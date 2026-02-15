import { useMemo } from "react";
import { useParams } from "react-router-dom";
import { usePoll } from "../lib/usePoll";
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
    const { guid } = useParams();

    const { loading: pollLoading,      error: pollError,      meta, days } = usePoll(guid);
    const { loading: responsesLoading, error: responsesError, responses  } = useResponses(guid);

    const loading = pollLoading || responsesLoading;
    const error   = pollError   || responsesError;

    const slotMinutes            = useMemo(() => Number(meta?.slotMinutes            ?? 30) || 30,  [meta]);
    const meetingDurationMinutes = useMemo(() => Number(meta?.meetingDurationMinutes ?? 60) || 60,  [meta]);

    const dedupedResponses = useMemo(() => deduplicateResponses(responses),         [responses]);
    const heatmap          = useMemo(() => aggregateAvailability(dedupedResponses), [dedupedResponses]);
    const maxParticipants  = useMemo(() => getMaxParticipants(heatmap),             [heatmap]);
    const bestWindows      = useMemo(
        () => findBestMeetingWindows(heatmap, days, slotMinutes, meetingDurationMinutes),
        [heatmap, days, slotMinutes, meetingDurationMinutes]
    );

    const mismatchCount = dedupedResponses.filter(
        (r) => r.payload?.slotMinutes && r.payload.slotMinutes !== slotMinutes
    ).length;

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

            <div className={styles.summary}>
                <div className={styles.summaryItem}>
                    <span className={styles.summaryKey}>Відповіді</span>
                    <span className={styles.summaryVal}>{dedupedResponses.length}</span>
                </div>
                <div className={styles.summaryItem}>
                    <span className={styles.summaryKey}>Слот</span>
                    <span className={styles.summaryVal}>
                        {slotMinutes}<span className={styles.summaryUnit}>хв</span>
                    </span>
                </div>
                <div className={styles.summaryItem}>
                    <span className={styles.summaryKey}>Тривалість зустрічі</span>
                    <span className={styles.summaryVal}>
                        {meetingDurationMinutes}<span className={styles.summaryUnit}>хв</span>
                    </span>
                </div>
            </div>

            {mismatchCount > 0 && (
                <div className={styles.warning}>
                    ⚠️ {mismatchCount} відповід{mismatchCount === 1 ? "ь" : "і"} містять
                    інший розмір слоту — результати можуть бути неточними.
                </div>
            )}

            <BestWindows windows={bestWindows} totalResponses={dedupedResponses.length} />

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