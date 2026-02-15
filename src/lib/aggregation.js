import { formatHHMM, parseHHMM } from "./time";

/**
 * Deduplicate responses by name. If same name appears multiple times, keep the last one.
 */
export function deduplicateResponses(responses) {
    const byName = new Map();

    for (const resp of responses) {
        if (!resp.name || !resp.payload) continue;
        byName.set(resp.name, resp);
    }

    return Array.from(byName.values());
}

/**
 * Build heatmap: for each (date, timeKey), count participants and compute weighted score.
 * Returns: {
 *   [date]: {
 *     [HH:MM]: { green: N, yellow: N, score: N }
 *   }
 * }
 */
export function aggregateAvailability(responses) {
    const heatmap = {};

    for (const resp of responses) {
        const avail = resp.payload?.availability ?? {};

        for (const [date, slots] of Object.entries(avail)) {
            if (!heatmap[date]) heatmap[date] = {};

            for (const [timeKey, state] of Object.entries(slots)) {
                if (!heatmap[date][timeKey]) {
                    heatmap[date][timeKey] = { green: 0, yellow: 0, score: 0 };
                }

                if (state === "g") {
                    heatmap[date][timeKey].green++;
                    heatmap[date][timeKey].score += 1.0;
                } else if (state === "y") {
                    heatmap[date][timeKey].yellow++;
                    heatmap[date][timeKey].score += 0.5;
                }
            }
        }
    }

    return heatmap;
}

/**
 * Find best continuous meeting windows.
 * Returns array of top 3 windows sorted by:
 * 1. Max participants (green + yellow count)
 * 2. Quality (higher score = more green)
 *
 * Each window: { date, startMinutes, endMinutes, participants, qualityScore }
 */
export function findBestMeetingWindows(heatmap, days, slotMinutes, meetingDurationMinutes) {
    const duration = Number(meetingDurationMinutes) || 60;
    const slot = Number(slotMinutes) || 30;

    const windows = [];

    for (const day of days) {
        const date = day.date;
        const dayData = heatmap[date] ?? {};

        const dayStart = parseHHMM(day.start);
        const dayEnd = parseHHMM(day.end);
        if (dayStart == null || dayEnd == null) continue;

        // Try every possible start time
        for (let start = dayStart; start + duration <= dayEnd; start += slot) {
            // Count participants for this window
            const slotCount = Math.floor(duration / slot);
            const participantSets = []; // array of Sets, one per slot

            let validWindow = true;
            let totalScore = 0;

            for (let i = 0; i < slotCount; i++) {
                const tMinutes = start + i * slot;
                const timeKey = formatHHMM(tMinutes);
                const cell = dayData[timeKey];

                if (!cell) {
                    // No data for this slot means 0 participants
                    participantSets.push(new Set());
                } else {
                    participantSets.push(new Set()); // We don't track individual names, just counts
                    totalScore += cell.score;
                }
            }

            // Total participants = those available for ALL slots in window
            // Since we don't track individual names per slot, we approximate by taking min counts
            // Better: sum participants across all slots and average

            let minGreen = Infinity;
            let minYellow = Infinity;
            let sumScore = 0;

            for (let i = 0; i < slotCount; i++) {
                const tMinutes = start + i * slot;
                const timeKey = formatHHMM(tMinutes);
                const cell = dayData[timeKey];

                if (!cell) {
                    minGreen = 0;
                    minYellow = 0;
                    sumScore = 0;
                    break;
                }

                minGreen = Math.min(minGreen, cell.green);
                minYellow = Math.min(minYellow, cell.yellow);
                sumScore += cell.score;
            }

            // Conservative estimate: min participants available across all slots
            const participants = Math.min(minGreen + minYellow);
            const qualityScore = sumScore / slotCount; // average score per slot

            if (participants > 0) {
                windows.push({
                    date,
                    startMinutes: start,
                    endMinutes: start + duration,
                    participants,
                    qualityScore,
                    green: minGreen,
                    yellow: minYellow,
                });
            }
        }
    }

    // Sort by: 1) max participants, 2) quality score
    windows.sort((a, b) => {
        if (b.participants !== a.participants) {
            return b.participants - a.participants;
        }
        return b.qualityScore - a.qualityScore;
    });

    return windows.slice(0, 3);
}

/**
 * Calculate max participants across all cells in heatmap
 */
export function getMaxParticipants(heatmap) {
    let max = 0;

    for (const dayData of Object.values(heatmap)) {
        for (const cell of Object.values(dayData)) {
            const total = cell.green + cell.yellow;
            if (total > max) max = total;
        }
    }

    return max;
}
