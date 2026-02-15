import { useEffect, useState } from "react";

// The same spreadsheet that used to hold "meta" + "days" now holds "Polls".
// Rename the sheet tab to "Polls" in Google Sheets.
const POLLS_SPREADSHEET_ID = "11j5LxsqRmdsMBkufQ3S9copGSy6FsPVheNa-xJ7Zs-4";
const POLLS_SHEET_NAME      = "polls";

/**
 * Fetch a single poll by its guid from the Polls sheet.
 * Polls sheet columns: id | json
 *   json shape: { title, slotMinutes, meetingDurationMinutes, days: [{date,start,end}] }
 *
 * @param {string|null} guid
 * @returns {{ loading, error, meta, days }}
 */
export function usePoll(guid) {
    const [state, setState] = useState({
        loading: true,
        error:   null,
        meta:    null,
        days:    [],
    });

    useEffect(() => {
        if (!guid) {
            setState({ loading: false, error: "Відсутній ідентифікатор опитування", meta: null, days: [] });
            return;
        }

        let cancelled = false;

        async function load() {
            try {
                const url = `https://opensheet.elk.sh/${POLLS_SPREADSHEET_ID}/${POLLS_SHEET_NAME}`;
                const res = await fetch(url);
                if (!res.ok) throw new Error("Не вдалося завантажити список опитувань");

                const rows = await res.json();
                const row  = (rows ?? []).find((r) => String(r.id || "").trim() === guid);
                if (!row) throw new Error("Опитування не знайдено");

                const parsed = JSON.parse(row.json || "{}");
                const { title, slotMinutes, meetingDurationMinutes, days: rawDays } = parsed;

                const days = (Array.isArray(rawDays) ? rawDays : [])
                    .filter((d) => d.date && d.start && d.end)
                    .map((d) => ({
                        date:  String(d.date).trim(),
                        start: String(d.start).trim(),
                        end:   String(d.end).trim(),
                    }));

                if (!cancelled) {
                    setState({
                        loading: false,
                        error:   null,
                        meta:    { title, slotMinutes, meetingDurationMinutes },
                        days,
                    });
                }
            } catch (e) {
                if (!cancelled) {
                    setState({ loading: false, error: e.message, meta: null, days: [] });
                }
            }
        }

        load();
        return () => { cancelled = true; };
    }, [guid]);

    return state;
}