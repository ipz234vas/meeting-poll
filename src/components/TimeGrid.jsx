import { useCallback, useEffect, useMemo, useRef } from "react";
import { buildTimeAxis, formatHHMM, isSlotActiveForDay } from "../lib/time";
import styles from "./TimeGrid.module.css";

// ─── Date display helpers ──────────────────────────────────────────────────────

/** Strips the year from common date formats so the column header is compact.
 *  "DD.MM.YYYY" → "DD.MM"  |  "YYYY-MM-DD" → "DD.MM"  |  anything else → as-is */
function shortDate(dateStr) {
    // DD.MM.YYYY
    const dotMatch = dateStr.match(/^(\d{2}\.\d{2})\.\d{4}$/);
    if (dotMatch) return dotMatch[1];
    // YYYY-MM-DD
    const isoMatch = dateStr.match(/^\d{4}-(\d{2})-(\d{2})$/);
    if (isoMatch) return `${isoMatch[2]}.${isoMatch[1]}`;
    return dateStr;
}

// ─── Day-of-week helper (POINT 6) ─────────────────────────────────────────────
const DOW = ["Нд", "Пн", "Вт", "Ср", "Чт", "Пт", "Сб"];

function getDayOfWeek(dateStr) {
    // Handles "YYYY-MM-DD", "DD.MM.YYYY", "DD/MM/YYYY" formats
    let d = new Date(dateStr);
    if (isNaN(d.getTime())) {
        // Try DD.MM.YYYY or DD/MM/YYYY
        const parts = dateStr.split(/[./]/);
        if (parts.length === 3) {
            d = new Date(`${parts[2]}-${parts[1].padStart(2, "0")}-${parts[0].padStart(2, "0")}`);
        }
    }
    return isNaN(d.getTime()) ? "" : DOW[d.getDay()];
}

// ─── Component ────────────────────────────────────────────────────────────────
export default function TimeGrid({ days, slotMinutes, value, onChange, mode, readOnly = false }) {
    const { slot, slots } = useMemo(
        () => buildTimeAxis(days, slotMinutes),
        [days, slotMinutes]
    );

    // ── Refs ─────────────────────────────────────────────────────────────────
    const paintingRef   = useRef(false);
    const paintValRef   = useRef("");      // "g" | "y" | ""
    const anchorRef     = useRef(null);    // { date, tMinutes } for shift-range
    const tableRef      = useRef(null);

    // Keep a stable ref to the latest values for use inside event listeners
    const latestDays    = useRef(days);
    const latestSlot    = useRef(slot);
    const readOnlyRef   = useRef(readOnly);
    latestDays.current  = days;
    latestSlot.current  = slot;
    readOnlyRef.current = readOnly;

    // ── Stop painting on pointer/touch up ─────────────────────────────────────
    useEffect(() => {
        const stop = () => { paintingRef.current = false; };
        window.addEventListener("pointerup",     stop);
        window.addEventListener("pointercancel", stop);
        window.addEventListener("touchend",      stop);
        window.addEventListener("touchcancel",   stop);
        return () => {
            window.removeEventListener("pointerup",     stop);
            window.removeEventListener("pointercancel", stop);
            window.removeEventListener("touchend",      stop);
            window.removeEventListener("touchcancel",   stop);
        };
    }, []);

    // ── POINT 1 (mobile) & POINT 2: Touch-move drag selection ─────────────────
    // We must register with { passive: false } to call preventDefault() and
    // prevent the page from scrolling while the user is painting cells.
    // React synthetic events don't support passive: false, so we use addEventListener.
    const touchMoveHandlerRef = useRef(null);
    touchMoveHandlerRef.current = useCallback((e) => {
        if (readOnlyRef.current) return;
        if (!paintingRef.current) return;
        e.preventDefault(); // block scroll while painting

        const touch = e.touches[0];
        const el = document.elementFromPoint(touch.clientX, touch.clientY);
        if (!el?.dataset?.date || el?.dataset?.t === undefined) return;

        const date     = el.dataset.date;
        const tMinutes = Number(el.dataset.t);
        const day      = latestDays.current.find((d) => d.date === date);
        if (!day) return;

        if (isSlotActiveForDay(day, tMinutes, latestSlot.current)) {
            setCell(date, tMinutes, paintValRef.current);
        }
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    useEffect(() => {
        const table = tableRef.current;
        if (!table) return;
        const handler = (e) => touchMoveHandlerRef.current(e);
        table.addEventListener("touchmove", handler, { passive: false });
        return () => table.removeEventListener("touchmove", handler);
    }, []); // runs once; handler reads from refs

    // ── State helpers ─────────────────────────────────────────────────────────

    // Use functional updater so we never close over stale `value`
    function setCell(date, tMinutes, nextVal) {
        const timeKey = formatHHMM(tMinutes);
        onChange((prev) => {
            const prevDay = prev?.[date] ?? {};
            if ((prevDay[timeKey] ?? "") === nextVal) return prev; // no-op

            const nextDay =
                nextVal === ""
                    ? (() => { const c = { ...prevDay }; delete c[timeKey]; return c; })()
                    : { ...prevDay, [timeKey]: nextVal };

            const next = { ...(prev ?? {}), [date]: nextDay };
            if (Object.keys(nextDay).length === 0) delete next[date];
            return next;
        });
    }

    // POINT 5: fill a rectangular range when Shift is held
    function setCellRange(date1, t1, date2, t2, nextVal) {
        const di1 = days.findIndex((d) => d.date === date1);
        const di2 = days.findIndex((d) => d.date === date2);
        const si1 = slots.indexOf(t1);
        const si2 = slots.indexOf(t2);
        if (di1 < 0 || di2 < 0 || si1 < 0 || si2 < 0) return;

        const minD = Math.min(di1, di2), maxD = Math.max(di1, di2);
        const minS = Math.min(si1, si2), maxS = Math.max(si1, si2);

        onChange((prev) => {
            let next = { ...(prev ?? {}) };
            for (let di = minD; di <= maxD; di++) {
                const day = days[di];
                for (let si = minS; si <= maxS; si++) {
                    const t = slots[si];
                    if (!isSlotActiveForDay(day, t, slot)) continue;

                    const timeKey = formatHHMM(t);
                    const prevDay = next[day.date] ?? {};
                    const nextDay =
                        nextVal === ""
                            ? (() => { const c = { ...prevDay }; delete c[timeKey]; return c; })()
                            : { ...prevDay, [timeKey]: nextVal };
                    next = { ...next, [day.date]: nextDay };
                    if (Object.keys(nextDay).length === 0) delete next[day.date];
                }
            }
            return next;
        });
    }

    function currentPaintVal() {
        return mode === "g" ? "g" : mode === "y" ? "y" : "";
    }

    function getCellState(date, tMinutes) {
        return value?.[date]?.[formatHHMM(tMinutes)] ?? "";
    }

    // ── Pointer handlers (desktop + stylus) ───────────────────────────────────
    function handlePointerDown(e, day, tMinutes) {
        if (readOnly) return;
        if (e.button !== 0) return;
        if (!isSlotActiveForDay(day, tMinutes, slot)) return;

        const nextVal = currentPaintVal();

        // POINT 5: Shift + click → fill range from anchor to here
        if (e.shiftKey && anchorRef.current) {
            setCellRange(
                anchorRef.current.date, anchorRef.current.tMinutes,
                day.date, tMinutes,
                nextVal,
            );
        } else {
            paintingRef.current = true;
            paintValRef.current = nextVal;
            anchorRef.current   = { date: day.date, tMinutes };
            setCell(day.date, tMinutes, nextVal);
        }
    }

    function handlePointerEnter(day, tMinutes) {
        if (readOnly) return;
        if (!paintingRef.current) return;
        if (!isSlotActiveForDay(day, tMinutes, slot)) return;
        setCell(day.date, tMinutes, paintValRef.current);
    }

    // ── Touch-start (mobile tap / drag start) ─────────────────────────────────
    function handleTouchStart(e, day, tMinutes) {
        if (readOnly) return;
        if (!isSlotActiveForDay(day, tMinutes, slot)) return;
        paintingRef.current = true;
        paintValRef.current = currentPaintVal();
        anchorRef.current   = { date: day.date, tMinutes };
        setCell(day.date, tMinutes, paintValRef.current);
    }

    // ── Render ────────────────────────────────────────────────────────────────
    return (
        <div className={`${styles.wrapper} ${readOnly ? styles.wrapperLocked : ""}`}>
            <div className={styles.gridScroll} ref={tableRef}>
                <table className={styles.table}>
                    <thead>
                    <tr>
                        {/*
                             * Corner th: empty header cell + the FIRST time label anchored
                             * to its bottom border (translateY 50%). This is the only way to
                             * render the first time ON the header divider line at full z-index,
                             * since tbody cells have lower z-index than the sticky thead.
                             */}
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
                        const label  = formatHHMM(t);
                        const isLast = idx === slots.length - 1;

                        return (
                            <tr key={t}>
                                {/*
                                     * idx === 0: no label — "09:00" already rendered in corner th.
                                     * All other rows: label at top: 0 + translateY(-50%) sits ON
                                     *   the top border of this row (= bottom border of row above).
                                     * Last row: also shows end-time on its BOTTOM border.
                                     */}
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
                                    const active = isSlotActiveForDay(d, t, slot);
                                    const state  = getCellState(d.date, t);

                                    return (
                                        <td
                                            key={d.date + ":" + t}
                                            data-date={d.date}
                                            data-t={t}
                                            className={[
                                                styles.td,
                                                active ? styles.cellBase : styles.cellDisabled,
                                                state === "g" ? styles.cellGreen  : "",
                                                state === "y" ? styles.cellYellow : "",
                                                readOnly      ? styles.cellLocked : "",
                                            ].filter(Boolean).join(" ")}
                                            title={active
                                                ? `${label}–${formatHHMM(t + slot)}`
                                                : "недоступно"}
                                            onPointerDown={(e) => handlePointerDown(e, d, t)}
                                            onPointerEnter={() => handlePointerEnter(d, t)}
                                            onTouchStart={(e) => handleTouchStart(e, d, t)}
                                        />
                                    );
                                })}
                            </tr>
                        );
                    })}
                    </tbody>
                </table>


            </div>
        </div>
    );
}