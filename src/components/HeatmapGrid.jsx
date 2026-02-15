import { useEffect, useMemo, useRef, useState } from "react";
import { buildTimeAxis, formatHHMM, isSlotActiveForDay } from "../lib/time";
import styles from "./HeatmapGrid.module.css";

// ─── Helpers ──────────────────────────────────────────────────────────────────

const DOW = ["Нд", "Пн", "Вт", "Ср", "Чт", "Пт", "Сб"];

function getDayOfWeek(dateStr) {
    let d = new Date(dateStr);
    if (isNaN(d.getTime())) {
        const parts = dateStr.split(/[./]/);
        if (parts.length === 3)
            d = new Date(`${parts[2]}-${parts[1].padStart(2, "0")}-${parts[0].padStart(2, "0")}`);
    }
    return isNaN(d.getTime()) ? "" : DOW[d.getDay()];
}

function shortDate(dateStr) {
    const dot = dateStr.match(/^(\d{2}\.\d{2})\.\d{4}$/);
    if (dot) return dot[1];
    const iso = dateStr.match(/^\d{4}-(\d{2})-(\d{2})$/);
    if (iso) return `${iso[2]}.${iso[1]}`;
    return dateStr;
}

// ─── Color scale ──────────────────────────────────────────────────────────────
function cellBackground(green, yellow, maxParticipants) {
    const total = green + yellow;
    if (!total) return null;
    const intensity  = maxParticipants > 0 ? total / maxParticipants : 0;
    const greenRatio = total > 0 ? green / total : 0;
    const hue        = 75 + greenRatio * 45;
    const saturation = 35 + greenRatio * 30;
    const lightness  = 94 - intensity * 49;
    return `hsl(${hue.toFixed(0)}, ${saturation.toFixed(0)}%, ${lightness.toFixed(0)}%)`;
}

const LEGEND_SWATCHES = [0.1, 0.35, 0.6, 0.85, 1.0].map((intensity) =>
    `hsl(${(75 + 0.7 * 45).toFixed(0)}, ${(35 + 0.7 * 30).toFixed(0)}%, ${(94 - intensity * 49).toFixed(0)}%)`
);

// ─── Popover ──────────────────────────────────────────────────────────────────
// Positioned fixed near the tapped cell, flips above/below if near edge.
function CellPopover({ popup, onClose }) {
    const ref = useRef(null);

    // Dismiss on outside click / tap
    useEffect(() => {
        if (!popup) return;
        function handleOutside(e) {
            if (ref.current && !ref.current.contains(e.target)) onClose();
        }
        // small delay so the opening tap doesn't immediately close it
        const id = setTimeout(() => {
            document.addEventListener("pointerdown", handleOutside);
        }, 50);
        return () => {
            clearTimeout(id);
            document.removeEventListener("pointerdown", handleOutside);
        };
    }, [popup, onClose]);

    if (!popup) return null;

    const { rect, interval, cellData } = popup;
    const total = cellData.green + cellData.yellow;

    // Position: horizontally centred on the cell, clamped to viewport width
    const POPOVER_W = 200;
    const MARGIN    = 8;
    const viewW     = window.innerWidth;

    let left = rect.left + rect.width / 2 - POPOVER_W / 2;
    left = Math.max(MARGIN, Math.min(left, viewW - POPOVER_W - MARGIN));

    // Prefer showing above; fall back to below if too close to top
    const spaceAbove = rect.top;
    const showAbove  = spaceAbove > 140;
    const top        = showAbove ? rect.top - 8   : rect.bottom + 8;
    const transform  = showAbove ? "translateY(-100%)" : "none";

    return (
        <div
            ref={ref}
            className={styles.popover}
            style={{ left, top, transform }}
            // stop tap propagating to the outside-click handler
            onPointerDown={(e) => e.stopPropagation()}
        >
            <button className={styles.popoverClose} onClick={onClose} aria-label="Закрити">✕</button>
            <div className={styles.popoverInterval}>{interval}</div>
            <div className={styles.popoverRow}>
                <span className={styles.popoverKey}>Учасників</span>
                <span className={styles.popoverVal}><strong>{total}</strong></span>
            </div>
            <div className={styles.popoverRow}>
                <span className={styles.popoverKey}>🟩 Вільних</span>
                <span className={styles.popoverVal}>{cellData.green}</span>
            </div>
            <div className={styles.popoverRow}>
                <span className={styles.popoverKey}>🟨 Можливо</span>
                <span className={styles.popoverVal}>{cellData.yellow}</span>
            </div>
            <div className={styles.popoverRow}>
                <span className={styles.popoverKey}>Рейтинг</span>
                <span className={styles.popoverVal}>{cellData.score.toFixed(1)}</span>
            </div>
        </div>
    );
}

// ─── Main component ───────────────────────────────────────────────────────────
export default function HeatmapGrid({ days, slotMinutes, heatmap, maxParticipants }) {
    const { slot, slots } = useMemo(
        () => buildTimeAxis(days, slotMinutes),
        [days, slotMinutes]
    );

    const [popup, setPopup] = useState(null); // { rect, interval, cellData } | null

    function getCellData(date, tMinutes) {
        return heatmap?.[date]?.[formatHHMM(tMinutes)] ?? null;
    }

    // Opens popover on click/tap of a filled cell; same cell closes it.
    function handleCellClick(e, cellData, interval) {
        if (!cellData) return;
        const rect = e.currentTarget.getBoundingClientRect();
        // toggle: tap same cell again → close
        if (
            popup &&
            popup.interval === interval &&
            popup.cellData === cellData
        ) {
            setPopup(null);
            return;
        }
        setPopup({ rect, interval, cellData });
    }

    // Desktop title attribute (hover tooltip still works on PC)
    function cellTitle(cellData, interval) {
        if (!cellData) return interval;
        const total = cellData.green + cellData.yellow;
        return (
            `${interval}\nУчасників: ${total}\n` +
            `🟩 Вільних: ${cellData.green}\n` +
            `🟨 Можливо: ${cellData.yellow}\n` +
            `Рейтинг: ${cellData.score.toFixed(1)}`
        );
    }

    return (
        <>
            {/* Color legend */}
            <div className={styles.legend}>
                <span className={styles.legendLabel}>Заповненість:</span>
                <span className={styles.legendScale}>
                    {LEGEND_SWATCHES.map((bg, i) => (
                        <span key={i} className={styles.legendSwatch} style={{ background: bg }} />
                    ))}
                </span>
            </div>
            <p className={styles.tapHint}>👆 Натисніть на клітинку, щоб побачити деталі</p>

            <div className={styles.wrapper}>
                <div className={styles.gridScroll}>
                    <table className={styles.table}>
                        <thead>
                        <tr>
                            <th className={`${styles.th} ${styles.corner}`}>
                                {slots.length > 0 && (
                                    <div className={styles.cornerTimeLabel}>
                                        {formatHHMM(slots[0])}
                                    </div>
                                )}
                            </th>
                            {days.map((d) => {
                                const dow = getDayOfWeek(d.date);
                                return (
                                    <th key={d.date} className={styles.th}>
                                        {dow && <div className={styles.dow}>{dow}</div>}
                                        <div className={styles.dateLabel}>{shortDate(d.date)}</div>
                                        <div className={styles.sub}>{d.start}–{d.end}</div>
                                    </th>
                                );
                            })}
                        </tr>
                        </thead>

                        <tbody>
                        {slots.map((t, idx) => {
                            const label    = formatHHMM(t);
                            const interval = `${label}–${formatHHMM(t + slot)}`;
                            const isLast   = idx === slots.length - 1;

                            return (
                                <tr key={t}>
                                    <td className={`${styles.td} ${styles.timeCell}`}>
                                        {idx > 0 && (
                                            <div className={styles.timeLineLabel}>{label}</div>
                                        )}
                                        {isLast && (
                                            <div className={styles.timeLabelEnd}>
                                                {formatHHMM(t + slot)}
                                            </div>
                                        )}
                                    </td>

                                    {days.map((d) => {
                                        const active   = isSlotActiveForDay(d, t, slot);
                                        const cellData = getCellData(d.date, t);
                                        const total    = cellData ? cellData.green + cellData.yellow : 0;
                                        const bg       = active && cellData
                                            ? cellBackground(cellData.green, cellData.yellow, maxParticipants)
                                            : null;

                                        return (
                                            <td
                                                key={d.date + ":" + t}
                                                className={[
                                                    styles.td,
                                                    !active             ? styles.cellDisabled : "",
                                                    active && !cellData ? styles.cellEmpty    : "",
                                                    active && cellData  ? styles.cellFilled   : "",
                                                ].filter(Boolean).join(" ")}
                                                style={bg ? { background: bg } : undefined}
                                                title={active ? cellTitle(cellData, interval) : "недоступно"}
                                                onClick={(e) => handleCellClick(e, cellData, interval)}
                                            >
                                                {active && total > 0 && (
                                                    <div className={styles.cellLabel}>{total}</div>
                                                )}
                                            </td>
                                        );
                                    })}
                                </tr>
                            );
                        })}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Fixed-position popover, rendered outside the scroll container */}
            <CellPopover popup={popup} onClose={() => setPopup(null)} />
        </>
    );
}