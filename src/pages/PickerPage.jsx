import { useMemo, useState } from "react";
import { useConfig } from "../lib/useConfig";
import TimeGrid from "../components/TimeGrid";
import GoogleFormSubmitFetch from "../components/GoogleFormSubmitFetch.jsx";

export default function PickerPage() {
    const { loading, error, meta, days } = useConfig();

    const [mode, setMode] = useState("g"); // "g" | "y" | "e"
    const [name, setName] = useState("");
    const [availability, setAvailability] = useState({}); // { [date]: { [HH:MM]: "g"|"y" } }

    const slotMinutes = useMemo(() => Number(meta?.slotMinutes ?? 30) || 30, [meta]);

    if (loading) return <p style={{ padding: 16 }}>Loading…</p>;
    if (error) return <p style={{ padding: 16, color: "crimson" }}>Error: {error}</p>;

    return (
        <div style={{ padding: 16 }}>
            <h1 style={{ marginTop: 0 }}>{meta?.title ?? "Meeting poll"}</h1>

            <div style={styles.topBar}>
                <label style={styles.label}>
                    Name:
                    <input
                        style={styles.input}
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="ira.vaskovska"
                    />
                </label>

                <div style={styles.modes}>
                    <ModeButton active={mode === "g"} onClick={() => setMode("g")}>
                        🟩 Free
                    </ModeButton>
                    <ModeButton active={mode === "y"} onClick={() => setMode("y")}>
                        🟨 Maybe
                    </ModeButton>
                    <ModeButton active={mode === "e"} onClick={() => setMode("e")}>
                        🧽 Erase
                    </ModeButton>
                </div>

                <div style={styles.modeHint}>
                    Mode: <b>{mode === "g" ? "Free" : mode === "y" ? "Maybe" : "Erase"}</b>
                </div>
            </div>

            <TimeGrid
                days={days}
                slotMinutes={slotMinutes}
                value={availability}
                onChange={setAvailability}
                mode={mode}
            />

            <GoogleFormSubmitFetch name={name} availability={availability} slotMinutes={slotMinutes}/>
        </div>
    );
}

function ModeButton({ active, onClick, children }) {
    return (
        <button
            type="button"
            onClick={onClick}
            style={{
                ...styles.btn,
                ...(active ? styles.btnActive : {}),
            }}
        >
            {children}
        </button>
    );
}

const styles = {
    topBar: {
        display: "flex",
        gap: 12,
        alignItems: "center",
        flexWrap: "wrap",
        marginBottom: 12,
    },
    label: { display: "flex", gap: 8, alignItems: "center" },
    input: {
        height: 34,
        padding: "0 10px",
        borderRadius: 10,
        border: "1px solid #2a2a2a",
        background: "#0f0f0f",
        color: "#eaeaea",
        outline: "none",
    },
    modes: { display: "flex", gap: 8 },
    btn: {
        height: 34,
        padding: "0 10px",
        borderRadius: 10,
        border: "1px solid #2a2a2a",
        background: "#121212",
        color: "#eaeaea",
        cursor: "pointer",
    },
    btnActive: {
        borderColor: "#666",
        background: "#1a1a1a",
    },
    modeHint: { opacity: 0.9 },
    pre: {
        background: "#111",
        color: "#ddd",
        padding: 12,
        borderRadius: 10,
        overflow: "auto",
    },
};
