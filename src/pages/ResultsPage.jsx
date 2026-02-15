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
import styles from "./ResultsPage.module.css";

export default function ResultsPage() {
    const { loading: configLoading,    error: configError,    meta, days } = useConfig();
    const { loading: responsesLoading, error: responsesError, responses }  = useResponses();

    const loading = configLoading || responsesLoading;
    const error   = configError   || responsesError;

    // ── Derived config values ──────────────────────────────────────────────
    // Both are cheap coercions from `meta`; useMemo avoids a new number
    // reference on every render, keeping downstream memos stable.
    const slotMinutes            = useMemo(() => Number(meta?.slotMinutes            ?? 30) || 30,  [meta]);
    const meetingDurationMinutes = useMemo(() => Number(meta?.meetingDurationMinutes ?? 60) || 60,  [meta]);

    // ── Response processing ────────────────────────────────────────────────
    // Each step depends only on its direct inputs, so these are correctly
    // memoized — they won't recompute unless their data actually changes.
    const dedupedResponses = useMemo(() => deduplicateResponses(responses),          [responses]);
    const heatmap          = useMemo(() => aggregateAvailability(dedupedResponses),  [dedupedResponses]);
    const maxParticipants  = useMemo(() => getMaxParticipants(heatmap),              [heatmap]);
    const bestWindows      = useMemo(
        () => findBestMeetingWindows(heatmap, days, slotMinutes, meetingDurationMinutes),
        [heatmap, days, slotMinutes, meetingDurationMinutes]
    );

    // ── Slot-mismatch check ────────────────────────────────────────────────
    // This is a simple .filter() count over already-memoized data, so a plain
    // derived value is more readable than another useMemo here.
    const mismatchCount = dedupedResponses.filter(
        (r) => r.payload?.slotMinutes && r.payload.slotMinutes !== slotMinutes
    ).length;

    // ── Loading / error states ─────────────────────────────────────────────
    if (loading) return <p style={{ padding: 16 }}>Завантаження результатів…</p>;
    if (error)   return <p style={{ padding: 16, color: "crimson" }}>Помилка: {error}</p>;

    const title = meta?.title ?? "Опитування про зустріч";

    if (!dedupedResponses.length) {
        return (
            <div className={styles.page}>
                <h1 className={styles.title}>{title} — Результати</h1>
                <p className={styles.empty}>Відповідей ще немає. Зайдіть пізніше!</p>
            </div>
        );
    }

    return (
        <div className={styles.page}>
            <h1 className={styles.title}>{title} — Результати</h1>

            {/* Summary stats */}
            <div className={styles.summary}>
                <div className={styles.summaryItem}>
                    <span className={styles.summaryKey}>Відповіді</span>
                    <span className={styles.summaryVal}>{dedupedResponses.length}</span>
                </div>
                <div className={styles.summaryItem}>
                    <span className={styles.summaryKey}>Слот</span>
                    <span className={styles.summaryVal}>
                        {slotMinutes}
                        <span className={styles.summaryUnit}>хв</span>
                    </span>
                </div>
                <div className={styles.summaryItem}>
                    <span className={styles.summaryKey}>Тривалість зустрічі</span>
                    <span className={styles.summaryVal}>
                        {meetingDurationMinutes}
                        <span className={styles.summaryUnit}>хв</span>
                    </span>
                </div>
            </div>

            {/* Slot mismatch warning */}
            {mismatchCount > 0 && (
                <div className={styles.warning}>
                    ⚠️ {mismatchCount} відповід{mismatchCount === 1 ? "ь" : "і"} містять
                    інший розмір слоту — результати можуть бути неточними.
                </div>
            )}

            {/* Best windows */}
            <BestWindows windows={bestWindows} totalResponses={dedupedResponses.length} />

            {/* Heatmap */}
            <div className={styles.heatmapSection}>
                <h2 className={styles.sectionHeading}>Теплова карта доступності</h2>
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