import { useEffect, useState } from "react";

const RESPONSES_SPREADSHEET_ID = "18gMO3XPKWd9nOYCN-H_Qs6j2UlAhm0zNvi0D5fcp8V4";
const RESPONSES_SHEET_NAME      = "responses";

/**
 * Fetch responses for a specific poll from Google Sheets.
 * Responses sheet columns: timestamp | name | json | pollId
 *
 * @param {string|null} pollId  – The poll guid to filter by
 * @returns {{ loading, error, responses: [{ name, payload }] }}
 */
export function useResponses(pollId) {
    const [state, setState] = useState({
        loading:   true,
        error:     null,
        responses: [],
    });

    useEffect(() => {
        if (!pollId) {
            setState({ loading: false, error: null, responses: [] });
            return;
        }

        let cancelled = false;

        async function load() {
            try {
                const url = `https://opensheet.elk.sh/${RESPONSES_SPREADSHEET_ID}/${RESPONSES_SHEET_NAME}`;
                const res = await fetch(url);
                if (!res.ok) throw new Error(`Не вдалося завантажити відповіді: ${res.status}`);

                const rows = await res.json();

                const responses = (rows ?? [])
                    // Filter to only this poll's responses
                    .filter((row) => String(row.pollId || "").trim() === pollId)
                    .map((row) => {
                        const name = String(row.name || "").trim();
                        if (!name) return null;

                        let payload = null;
                        try {
                            payload = JSON.parse(row.json || "{}");
                        } catch {
                            return null;
                        }

                        return { name, payload };
                    })
                    .filter(Boolean);

                if (!cancelled) {
                    setState({ loading: false, error: null, responses });
                }
            } catch (e) {
                if (!cancelled) {
                    setState({ loading: false, error: e.message, responses: [] });
                }
            }
        }

        load();
        return () => { cancelled = true; };
    }, [pollId]);

    return state;
}