import { useEffect, useMemo, useRef, useState } from "react";
import { buildTimeAxis, formatHHMM, isSlotActiveForDay } from "../lib/time";

export default function TimeGrid({ days, slotMinutes, value, onChange, mode }) {
    const { globalStart, globalEnd, slot, slots } = useMemo(
        () => buildTimeAxis(days, slotMinutes),
        [days, slotMinutes]
    );

    // paint state (pointer)
    const paintingRef = useRef(false);

    useEffect(() => {
        const stop = () => (paintingRef.current = false);
        window.addEventListener("pointerup", stop);
        window.addEventListener("pointercancel", stop);
        return () => {
            window.removeEventListener("pointerup", stop);
            window.removeEventListener("pointercancel", stop);
        };
    }, []);

    function setCell(date, tMinutes, nextVal) {
        const timeKey = formatHHMM(tMinutes);
        const prevDay = value?.[date] ?? {};

        // no-op if same
        if ((prevDay[timeKey] ?? "") === nextVal) return;

        const nextDay =
            nextVal === ""
                ? (() => {
                    const copy = { ...prevDay };
                    delete copy[timeKey];
                    return copy;
                })()
                : { ...prevDay, [timeKey]: nextVal };

        const next = { ...(value ?? {}), [date]: nextDay };

        // optional cleanup: if day becomes empty remove key
        if (Object.keys(nextDay).length === 0) delete next[date];

        onChange(next);
    }

    function handlePointerDown(e, day, tMinutes) {
        if (e.button !== 0) return;
        const active = isSlotActiveForDay(day, tMinutes, slot);
        if (!active) return;

        paintingRef.current = true;

        const nextVal = mode === "g" ? "g" : mode === "y" ? "y" : "";
        setCell(day.date, tMinutes, nextVal);
    }

    function handlePointerEnter(day, tMinutes) {
        if (!paintingRef.current) return;

        const active = isSlotActiveForDay(day, tMinutes, slot);
        if (!active) return;

        const nextVal = mode === "g" ? "g" : mode === "y" ? "y" : "";
        setCell(day.date, tMinutes, nextVal);
    }

    function getCellState(date, tMinutes) {
        const timeKey = formatHHMM(tMinutes);
        return value?.[date]?.[timeKey] ?? ""; // "g" | "y" | ""
    }

    return (
        <div style={styles.wrapper}>
            <div style={styles.gridScroll}>
                <table style={styles.table}>
                    <thead>
                    <tr>
                        <th style={{ ...styles.th, ...styles.stickyLeft, ...styles.corner }}>
                            {/* Порожньо: ми ставимо час на лініях */}
                        </th>

                        {days.map((d) => (
                            <th key={d.date} style={{ ...styles.th, ...styles.stickyTop }}>
                                <div style={{ fontWeight: 700 }}>{d.date}</div>
                                <div style={styles.sub}>{d.start}–{d.end}</div>
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
                                {/* time column: label on the grid line (top of row) */}
                                <td style={{ ...styles.td, ...styles.stickyLeft, ...styles.timeCell }}>
                                    <div style={styles.timeLineLabel} title={label}>
                                        {label}
                                    </div>

                                    {/* на останньому інтервалі тихо покажемо 17:30–18:00 як підказку */}
                                    {idx === slots.length - 1 && (
                                        <div style={styles.intervalHint}>{intervalLabel}</div>
                                    )}
                                </td>

                                {days.map((d) => {
                                    const active = isSlotActiveForDay(d, t, slot);
                                    const state = getCellState(d.date, t);

                                    return (
                                        <td
                                            key={d.date + ":" + t}
                                            style={{
                                                ...styles.td,
                                                ...(active ? styles.cellBase : styles.cellDisabled),
                                                ...(state === "g" ? styles.cellGreen : {}),
                                                ...(state === "y" ? styles.cellYellow : {}),
                                            }}
                                            title={active ? intervalLabel : "disabled"}
                                            onPointerDown={(e) => handlePointerDown(e, d, t)}
                                            onPointerEnter={() => handlePointerEnter(d, t)}
                                        />
                                    );
                                })}
                            </tr>
                        );
                    })}
                    </tbody>
                </table>

                {/* показати останню мітку часу внизу */}
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

    // label sits on the grid line (top border of the row)
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

    cellBase: {
        cursor: "pointer",
        background: "#151515",
    },
    cellDisabled: {
        background: "#0a0a0a",
        opacity: 0.55,
    },
    cellGreen: {
        background: "#1c3f2a", // темний зелений
    },
    cellYellow: {
        background: "#3f3520", // темний жовтий
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
