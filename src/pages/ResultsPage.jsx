import { useMemo } from "react";
import { useConfig } from "../lib/useConfig";
import { useResponses } from "../lib/useResponses";
import {
    deduplicateResponses,
    aggregateAvailability,
    findBestMeetingWindows,
    getMaxParticipants,
} from "../lib/aggregation";
import HeatmapGrid from "../components/HeatmapGrid";
import BestWindows from "../components/BestWindows";

export default function ResultsPage() {
    const { loading: configLoading, error: configError, meta, days } = useConfig();
    const { loading: responsesLoading, error: responsesError, responses } = useResponses();

    const loading = configLoading || responsesLoading;
    const error = configError || responsesError;

    const slotMinutes = useMemo(() => Number(meta?.slotMinutes ?? 30) || 30, [meta]);
    const meetingDurationMinutes = useMemo(
        () => Number(meta?.meetingDurationMinutes ?? 60) || 60,
        [meta]
    );

    // Deduplicate responses (last response per name wins)
    const dedupedResponses = useMemo(() => deduplicateResponses(responses), [responses]);

    // Validate slotMinutes consistency
    const slotMismatchWarning = useMemo(() => {
        const mismatches = dedupedResponses.filter(
            (r) => r.payload?.slotMinutes && r.payload.slotMinutes !== slotMinutes
        );
        return mismatches.length > 0 ? mismatches : null;
    }, [dedupedResponses, slotMinutes]);

    // Aggregate availability
    const heatmap = useMemo(() => aggregateAvailability(dedupedResponses), [dedupedResponses]);

    const maxParticipants = useMemo(() => getMaxParticipants(heatmap), [heatmap]);

    // Find best meeting windows
    const bestWindows = useMemo(
        () => findBestMeetingWindows(heatmap, days, slotMinutes, meetingDurationMinutes),
        [heatmap, days, slotMinutes, meetingDurationMinutes]
    );

    if (loading) return <p style={{ padding: 16 }}>Loading results…</p>;
    if (error) return <p style={{ padding: 16, color: "crimson" }}>Error: {error}</p>;

    if (dedupedResponses.length === 0) {
        return (
            <div style={{ padding: 16 }}>
                <h1 style={{ marginTop: 0 }}>{meta?.title ?? "Meeting poll"} – Results</h1>
                <p style={{ opacity: 0.8 }}>No responses yet. Check back later!</p>
            </div>
        );
    }

    return (
        <div style={{ padding: 16 }}>
            <h1 style={{ marginTop: 0 }}>{meta?.title ?? "Meeting poll"} – Results</h1>

            <div style={styles.summary}>
                <div style={styles.summaryItem}>
                    <strong>Responses:</strong> {dedupedResponses.length}
                </div>
                <div style={styles.summaryItem}>
                    <strong>Slot duration:</strong> {slotMinutes} min
                </div>
                <div style={styles.summaryItem}>
                    <strong>Meeting duration:</strong> {meetingDurationMinutes} min
                </div>
            </div>

            {slotMismatchWarning && (
                <div style={styles.warning}>
                    ⚠️ Warning: {slotMismatchWarning.length} response(s) have different slot
                    durations. Results may be inaccurate.
                </div>
            )}

            <BestWindows windows={bestWindows} totalResponses={dedupedResponses.length} />

            <div style={{ marginTop: 32 }}>
                <h2 style={{ marginTop: 0, marginBottom: 12 }}>Availability Heatmap</h2>
                <HeatmapGrid
                    days={days}
                    slotMinutes={slotMinutes}
                    heatmap={heatmap}
                    maxParticipants={maxParticipants}
                />
            </div>
        </div>
    );
}

const styles = {
    summary: {
        display: "flex",
        gap: 16,
        flexWrap: "wrap",
        padding: 12,
        background: "#121212",
        border: "1px solid #2a2a2a",
        borderRadius: 10,
        marginBottom: 16,
    },
    summaryItem: {
        fontSize: 14,
    },
    warning: {
        padding: 12,
        background: "#3f2e20",
        border: "1px solid #5a4020",
        borderRadius: 10,
        marginBottom: 16,
        color: "#f4c542",
    },
};