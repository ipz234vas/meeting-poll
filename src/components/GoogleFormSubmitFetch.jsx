import { useState } from "react";
import { submitToGoogleForm } from "../lib/submitToGoogleForm";
import { GOOGLE_FORM_CONFIG } from "../config/googleForm";

export default function GoogleFormSubmitFetch({ name, availability,  slotMinutes}) {
    const [status, setStatus] = useState("idle"); // idle | submitting | success | error

    const canSubmit =
        String(name || "").trim().length > 0 &&
        Object.keys(availability || {}).length > 0 &&
        status !== "submitting";

    async function handleSubmit() {
        if (!canSubmit) return;

        setStatus("submitting");

        try {
            const payload = {
                slotMinutes: Number(slotMinutes) || 30,
                availability: availability ?? {},
            };

            const jsonString = JSON.stringify(payload);

            await submitToGoogleForm({
                formActionUrl: GOOGLE_FORM_CONFIG.formActionUrl,
                entryNameKey: GOOGLE_FORM_CONFIG.fields.name,
                entryJsonKey: GOOGLE_FORM_CONFIG.fields.json,
                name: String(name).trim(),
                jsonString,
            });

            setStatus("success");
        } catch {
            setStatus("error");
        }
    }


    return (
        <div style={styles.row}>
            <button
                type="button"
                onClick={handleSubmit}
                disabled={!canSubmit}
                style={{
                    ...styles.btn,
                    ...(canSubmit ? {} : styles.btnDisabled),
                }}
            >
                {status === "submitting" ? "Submitting…" : "Submit"}
            </button>

            {status === "success" && <span style={styles.ok}>Sent ✅</span>}
            {status === "error" && <span style={styles.err}>Failed ❌</span>}
            {status === "idle" && <span style={styles.hint}>Name + хоча б 1 слот</span>}
        </div>
    );
}

const styles = {
    row: {
        display: "flex",
        gap: 12,
        alignItems: "center",
        marginTop: 12,
        flexWrap: "wrap",
    },
    btn: {
        height: 36,
        padding: "0 14px",
        borderRadius: 10,
        border: "1px solid #2a2a2a",
        background: "#121212",
        color: "#eaeaea",
        cursor: "pointer",
    },
    btnDisabled: {
        opacity: 0.55,
        cursor: "not-allowed",
    },
    ok: { color: "#9ad39a" },
    err: { color: "crimson" },
    hint: { opacity: 0.75 },
};
