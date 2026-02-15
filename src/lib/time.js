export function parseHHMM(hhmm) {
    const [hStr, mStr] = String(hhmm).split(":");
    const h = Number(hStr);
    const m = Number(mStr);
    if (!Number.isFinite(h) || !Number.isFinite(m)) return null;
    if (h < 0 || h > 23 || m < 0 || m > 59) return null;
    return h * 60 + m;
}

export function formatHHMM(totalMinutes) {
    const h = Math.floor(totalMinutes / 60);
    const m = totalMinutes % 60;
    return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

export function buildTimeAxis(days, slotMinutes) {
    const slot = Number(slotMinutes);
    if (!Number.isFinite(slot) || slot <= 0) throw new Error("Invalid slotMinutes");

    const starts = [];
    const ends = [];

    for (const d of days) {
        const s = parseHHMM(d.start);
        const e = parseHHMM(d.end);
        if (s == null || e == null) continue;
        starts.push(s);
        ends.push(e);
    }

    const globalStart = starts.length ? Math.min(...starts) : 9 * 60;
    const globalEnd = ends.length ? Math.max(...ends) : 18 * 60;


    const slots = [];
    for (let t = globalStart; t + slot <= globalEnd; t += slot) {
        slots.push(t);
    }

    return { globalStart, globalEnd, slot, slots };
}

export function isSlotActiveForDay(day, tMinutes, slotMinutes) {
    const s = parseHHMM(day.start);
    const e = parseHHMM(day.end);
    if (s == null || e == null) return false;

    return tMinutes >= s && (tMinutes + slotMinutes) <= e;
}
