import { useEffect, useState } from "react"

const SPREADSHEET_ID = "1isWWGLV4Lh_P4gSKAtyABlcpMZFSxi8cAfpp6mOMMws"
const BASE = `https://opensheet.elk.sh/${SPREADSHEET_ID}`

export function useConfig() {
    const [state, setState] = useState({
        loading: true,
        error: null,
        meta: null,
        days: [],
    })

    useEffect(() => {
        let cancelled = false

        async function load() {
            try {
                const [metaRes, daysRes] = await Promise.all([
                    fetch(`${BASE}/meta`),
                    fetch(`${BASE}/days`),
                ])

                if (!metaRes.ok)
                    throw new Error("Failed to load meta")
                if (!daysRes.ok)
                    throw new Error("Failed to load days")

                const metaArr = await metaRes.json()
                const daysArr = await daysRes.json()

                const meta = metaArr?.[0] ?? null

                const days = (daysArr ?? [])
                    .filter(d => d.date && d.start && d.end)
                    .map(d => ({
                        date: String(d.date).trim(),
                        start: String(d.start).trim(),
                        end: String(d.end).trim(),
                    }))

                if (!cancelled) {
                    setState({
                        loading: false,
                        error: null,
                        meta,
                        days,
                    })
                }
            } catch (e) {
                if (!cancelled) {
                    setState({
                        loading: false,
                        error: e.message,
                        meta: null,
                        days: [],
                    })
                }
            }
        }

        load()
        return () => { cancelled = true }
    }, [])

    return state
}
