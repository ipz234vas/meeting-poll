import { useMemo } from "react";
import { buildTimeAxis, formatHHMM, isSlotActiveForDay } from "../lib/time";

/**
 * HeatmapGrid - read-only grid showing aggregated availability
 * Props:
 * - days: array of { date, start, end }
 * - slotMinutes: number
 * - heatmap: { [date]: { [HH:MM]: { green, yellow, score } } }
 * - maxParticipants: max participant count for color scaling
 */
export default function HeatmapGrid({ days, slotMinutes, heatmap, maxParticipants }) {
    const { globalStart, globalEnd, slot, slots } = useMemo(
        () => buildTimeAxis(days, slotMinutes),
        [days, slotMinutes]
    );

    function getCellData(date, tMinutes) {
        const timeKey = formatHHMM(tMinutes);
        return heatmap?.[date]?.[timeKey] ?? null;
    }

    function getCellStyle(cellData, isActive) {
        if (!isActive) {
            return styles.cellDisabled;
        }

        if (!cellData) {
            return styles.cellEmpty;
        }

        const total = cellData.green + cellData.yellow;
        const intensity = maxParticipants > 0 ? total / maxParticipants : 0;

        // Color based on quality: more green = greener hue
        const greenRatio = total > 0 ? cellData.green / total : 0;

        // Interpolate between yellow and green based on ratio
        const hue = 60 - greenRatio * 60; // 60 = yellow, 0 = green (in HSL)
        const saturation = 70;
        const lightness = 20 + intensity * 30; // darker to lighter

        return {
            background: `hsl(${hue}, ${saturation}%, ${lightness}%)`,
            cursor: "help",
        };
    }

    function getCellTitle(cellData, intervalLabel) {
        if (!cellData) return intervalLabel;

        const total = cellData.green + cellData.yellow;
        return `${intervalLabel}\n${total} participants\n🟩 ${cellData.green} free\n🟨 ${cellData.yellow} maybe\nScore: ${cellData.score.toFixed(1)}`;
    }

    return (
        <div style={styles.wrapper}>
            <div style={styles.gridScroll}>
                <table style={styles.table}>
                    <thead>
                        <tr>
                            <th style={{ ...styles.th, ...styles.stickyLeft, ...styles.corner }}>
                                {/* Empty corner */}
                            </th>

                            {days.map((d) => (
                                <th key={d.date} style={{ ...styles.th, ...styles.stickyTop }}>
                                    <div style={{ fontWeight: 700 }}>{d.date}</div>
                                    <div style={styles.sub}>
                                        {d.start}–{d.end}
                                    </div>
                                </th>
                            ))}
                        </tr>
                    </thead>

                    <tbody>
                        {slots.map((t, idx) => {
                            const label = formatHHMM(t);
                            const intervalLabel = `${label}–${formatHHMM(t + slot)}`;

                            return (
                                <tr key={t}>
                                    <td style={{ ...styles.td, ...styles.stickyLeft, ...styles.timeCell }}>
                                        <div style={styles.timeLineLabel} title={label}>
                                            {label}
                                        </div>

                                        {idx === slots.length - 1 && (
                                            <div style={styles.intervalHint}>{intervalLabel}</div>
                                        )}
                                    </td>

                                    {days.map((d) => {
                                        const active = isSlotActiveForDay(d, t, slot);
                                        const cellData = getCellData(d.date, t);
                                        const cellStyle = getCellStyle(cellData, active);

                                        return (
                                            <td
                                                key={d.date + ":" + t}
                                                style={{
                                                    ...styles.td,
                                                    ...cellStyle,
                                                }}
                                                title={getCellTitle(cellData, intervalLabel)}
                                            >
                                                {cellData && active && (
                                                    <div style={styles.cellLabel}>
                                                        {cellData.green + cellData.yellow}
                                                    </div>
                                                )}
                                            </td>
                                        );
                                    })}
                                </tr>
                            );
                        })}
                    </tbody>
                </table>

                <div style={styles.endTimeRow}>
                    <div style={styles.endTimeLabel}>{formatHHMM(globalEnd)}</div>
                </div>
            </div>
        </div>
    );
}

const styles = {
    wrapper: {
        border: "1px solid #2a2a2a",
        borderRadius: 12,
        overflow: "hidden",
        userSelect: "none",
    },
    gridScroll: {
        overflow: "auto",
        maxHeight: "70vh",
        background: "#0f0f0f",
    },
    table: {
        borderCollapse: "separate",
        borderSpacing: 0,
        width: "max-content",
        minWidth: "100%",
        fontSize: 14,
    },
    th: {
        borderBottom: "1px solid #2a2a2a",
        borderRight: "1px solid #2a2a2a",
        padding: "10px 12px",
        background: "#121212",
        color: "#eaeaea",
        textAlign: "left",
        whiteSpace: "nowrap",
    },
    td: {
        borderBottom: "1px solid #2a2a2a",
        borderRight: "1px solid #2a2a2a",
        width: 78,
        height: 28,
        background: "#0f0f0f",
        textAlign: "center",
        verticalAlign: "middle",
        position: "relative",
    },
    stickyTop: { position: "sticky", top: 0, zIndex: 3 },
    stickyLeft: { position: "sticky", left: 0, zIndex: 2, background: "#121212" },
    corner: { zIndex: 4 },
    sub: { fontSize: 12, opacity: 0.75, marginTop: 2 },

    timeCell: {
        width: 74,
        color: "#eaeaea",
        padding: 0,
        position: "relative",
    },

    timeLineLabel: {
        position: "relative",
        top: -9,
        paddingLeft: 10,
        fontVariantNumeric: "tabular-nums",
        fontSize: 13,
        opacity: 0.95,
        pointerEvents: "none",
    },

    intervalHint: {
        position: "absolute",
        right: 8,
        bottom: 4,
        fontSize: 11,
        opacity: 0.45,
        pointerEvents: "none",
    },

    cellEmpty: {
        background: "#151515",
    },
    cellDisabled: {
        background: "#0a0a0a",
        opacity: 0.55,
    },

    cellLabel: {
        fontSize: 12,
        fontWeight: 600,
        color: "#fff",
        textShadow: "0 1px 2px rgba(0,0,0,0.5)",
    },

    endTimeRow: {
        position: "relative",
        height: 22,
    },
    endTimeLabel: {
        position: "sticky",
        left: 0,
        width: 74,
        paddingLeft: 10,
        paddingTop: 6,
        fontVariantNumeric: "tabular-nums",
        fontSize: 13,
        opacity: 0.95,
        color: "#eaeaea",
        background: "#121212",
        borderTop: "1px solid #2a2a2a",
        borderRight: "1px solid #2a2a2a",
    },
};
