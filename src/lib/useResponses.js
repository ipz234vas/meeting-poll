import { useEffect, useState } from "react";

const RESPONSES_SPREADSHEET_ID = "18gMO3XPKWd9nOYCN-H_Qs6j2UlAhm0zNvi0D5fcp8V4";
const RESPONSES_SHEET_NAME = "responses";

/**
 * Fetch responses from Google Sheets.
 * Expected columns: name, json
 * Returns: { loading, error, responses: [{ name, payload: {...} }] }
 */
export function useResponses() {
    const [state, setState] = useState({
        loading: true,
        error: null,
        responses: [],
    });

    useEffect(() => {
        let cancelled = false;

        async function load() {
            try {
                const url = `https://opensheet.elk.sh/${RESPONSES_SPREADSHEET_ID}/${RESPONSES_SHEET_NAME}`;
                const res = await fetch(url);

                if (!res.ok) {
                    throw new Error(`Failed to fetch responses: ${res.status}`);
                }

                const rows = await res.json();

                const responses = (rows ?? [])
                    .map((row) => {
                        const name = String(row.name || "").trim();
                        if (!name) return null;

                        let payload = null;
                        try {
                            payload = JSON.parse(row.json || "{}");
                        } catch {
                            // Invalid JSON, skip
                            return null;
                        }

                        return { name, payload };
                    })
                    .filter(Boolean);

                if (!cancelled) {
                    setState({
                        loading: false,
                        error: null,
                        responses,
                    });
                }
            } catch (e) {
                if (!cancelled) {
                    setState({
                        loading: false,
                        error: e.message,
                        responses: [],
                    });
                }
            }
        }

        load();
        return () => {
            cancelled = true;
        };
    }, []);

    return state;
}
