import { formatHHMM } from "../lib/time";

/**
 * BestWindows - display top meeting time windows
 * Props:
 * - windows: array of { date, startMinutes, endMinutes, participants, qualityScore, green, yellow }
 * - totalResponses: total number of participants who submitted
 */
export default function BestWindows({ windows, totalResponses }) {
    if (!windows || windows.length === 0) {
        return (
            <div style={styles.container}>
                <h2 style={styles.heading}>Best Meeting Times</h2>
                <p style={styles.empty}>No suitable meeting windows found.</p>
            </div>
        );
    }

    return (
        <div style={styles.container}>
            <h2 style={styles.heading}>Best Meeting Times</h2>
            <div style={styles.windowList}>
                {windows.map((win, idx) => {
                    const percentage = totalResponses > 0
                        ? ((win.participants / totalResponses) * 100).toFixed(0)
                        : 0;

                    return (
                        <div
                            key={`${win.date}-${win.startMinutes}`}
                            style={{
                                ...styles.window,
                                ...(idx === 0 ? styles.windowBest : {}),
                            }}
                        >
                            <div style={styles.rank}>#{idx + 1}</div>

                            <div style={styles.windowContent}>
                                <div style={styles.windowTime}>
                                    <strong>{win.date}</strong>
                                    <span style={styles.timeRange}>
                                        {formatHHMM(win.startMinutes)} – {formatHHMM(win.endMinutes)}
                                    </span>
                                </div>

                                <div style={styles.stats}>
                                    <div style={styles.stat}>
                                        <span style={styles.statLabel}>Participants:</span>
                                        <span style={styles.statValue}>
                                            {win.participants} / {totalResponses} ({percentage}%)
                                        </span>
                                    </div>

                                    <div style={styles.stat}>
                                        <span style={styles.statLabel}>Availability:</span>
                                        <span style={styles.statValue}>
                                            🟩 {win.green} free · 🟨 {win.yellow} maybe
                                        </span>
                                    </div>

                                    <div style={styles.stat}>
                                        <span style={styles.statLabel}>Quality:</span>
                                        <span style={styles.statValue}>
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

const styles = {
    container: {
        marginTop: 32,
    },
    heading: {
        marginTop: 0,
        marginBottom: 16,
        fontSize: 20,
    },
    empty: {
        padding: 16,
        background: "#121212",
        border: "1px solid #2a2a2a",
        borderRadius: 10,
        opacity: 0.8,
    },
    windowList: {
        display: "flex",
        flexDirection: "column",
        gap: 12,
    },
    window: {
        display: "flex",
        gap: 12,
        padding: 16,
        background: "#121212",
        border: "1px solid #2a2a2a",
        borderRadius: 10,
        alignItems: "flex-start",
    },
    windowBest: {
        borderColor: "#4a7c59",
        background: "#1a1f1c",
    },
    rank: {
        fontSize: 18,
        fontWeight: 700,
        color: "#888",
        minWidth: 32,
    },
    windowContent: {
        flex: 1,
        display: "flex",
        flexDirection: "column",
        gap: 12,
    },
    windowTime: {
        display: "flex",
        flexDirection: "column",
        gap: 4,
    },
    timeRange: {
        fontSize: 18,
        fontWeight: 600,
        color: "#eaeaea",
    },
    stats: {
        display: "flex",
        flexDirection: "column",
        gap: 6,
    },
    stat: {
        display: "flex",
        gap: 8,
        fontSize: 14,
    },
    statLabel: {
        opacity: 0.75,
        minWidth: 100,
    },
    statValue: {
        fontWeight: 500,
    },
};
