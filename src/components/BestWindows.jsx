import { formatHHMM } from "../lib/time";
import styles from "./BestWindows.module.css";

function shortDate(dateStr) {
    const dot = dateStr.match(/^(\d{2}\.\d{2})\.\d{4}$/);
    if (dot) return dot[1];
    const iso = dateStr.match(/^\d{4}-(\d{2})-(\d{2})$/);
    if (iso) return `${iso[2]}.${iso[1]}`;
    return dateStr;
}

/**
 * BestWindows – top meeting time windows.
 * Props:
 *   windows        – [{ date, startMinutes, endMinutes, participants, qualityScore, green, yellow }]
 *   totalResponses – total number of respondents
 */
export default function BestWindows({ windows, totalResponses }) {
    if (!windows?.length) {
        return (
            <div className={styles.container}>
                <h2 className={styles.heading}>Найкращий час для зустрічі</h2>
                <p className={styles.empty}>Підходящих вікон не знайдено.</p>
            </div>
        );
    }

    return (
        <div className={styles.container}>
            <h2 className={styles.heading}>Найкращий час для зустрічі</h2>
            <div className={styles.windowList}>
                {windows.map((win, idx) => {
                    const isBest     = idx === 0;
                    const pct        = totalResponses > 0
                        ? Math.round((win.participants / totalResponses) * 100)
                        : 0;

                    return (
                        <div
                            key={`${win.date}-${win.startMinutes}`}
                            className={`${styles.window} ${isBest ? styles.windowBest : ""}`}
                        >
                            {/* Rank badge */}
                            <div className={`${styles.rank} ${isBest ? styles.rankBest : ""}`}>
                                {idx + 1}
                            </div>

                            <div className={styles.windowContent}>
                                {/* Date + time */}
                                <div className={styles.windowTime}>
                                    <span className={styles.dateText}>{shortDate(win.date)}</span>
                                    <span className={styles.timeRange}>
                                        {formatHHMM(win.startMinutes)}–{formatHHMM(win.endMinutes)}
                                    </span>
                                </div>

                                {/* Stats */}
                                <div className={styles.stats}>
                                    {/* Participation with visual bar */}
                                    <div className={styles.stat}>
                                        <span className={styles.statLabel}>Участь</span>
                                        <div className={styles.barWrap}>
                                            <div className={styles.barTrack}>
                                                <div
                                                    className={styles.barFill}
                                                    style={{ width: `${pct}%` }}
                                                />
                                            </div>
                                            <span className={styles.barLabel}>
                                                {win.participants}/{totalResponses} ({pct}%)
                                            </span>
                                        </div>
                                    </div>

                                    <div className={styles.stat}>
                                        <span className={styles.statLabel}>Доступність</span>
                                        <span className={styles.statValue}>
                                            🟩 {win.green} вільних · 🟨 {win.yellow} можливо
                                        </span>
                                    </div>

                                    <div className={styles.stat}>
                                        <span className={styles.statLabel}>Рейтинг</span>
                                        <span className={styles.statValue}>
                                            {win.qualityScore.toFixed(1)} / {win.participants}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}