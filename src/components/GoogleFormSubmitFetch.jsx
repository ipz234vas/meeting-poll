import { useState } from "react";
import { submitToGoogleForm } from "../lib/submitToGoogleForm";
import { VOTES_FORM_CONFIG } from "../config/googleForm";
import styles from "./GoogleFormSubmitFetch.module.css";

/**
 * Props:
 *   name         – participant name/nick
 *   availability – { [date]: { [HH:MM]: "g"|"y" } }
 *   slotMinutes  – number
 *   pollId       – guid of the current poll (stored as foreign key)
 *   onSuccess    – callback fired after successful submit
 */
export default function GoogleFormSubmitFetch({ name, availability, slotMinutes, pollId, onSuccess }) {
    const [status, setStatus] = useState("idle"); // idle | submitting | error

    const canSubmit =
        String(name || "").trim().length > 0 &&
        Object.keys(availability || {}).length > 0 &&
        status !== "submitting";

    async function handleSubmit() {
        if (!canSubmit) return;
        setStatus("submitting");
        try {
            await submitToGoogleForm({
                formActionUrl: VOTES_FORM_CONFIG.formActionUrl,
                fields: {
                    [VOTES_FORM_CONFIG.fields.name]:   String(name).trim(),
                    [VOTES_FORM_CONFIG.fields.json]:   JSON.stringify({
                        slotMinutes:  Number(slotMinutes) || 30,
                        availability: availability ?? {},
                    }),
                    [VOTES_FORM_CONFIG.fields.pollId]: String(pollId || ""),
                },
            });
            setStatus("idle");
            onSuccess?.();
        } catch {
            setStatus("error");
        }
    }

    return (
        <div className={styles.row}>
            <button
                type="button"
                onClick={handleSubmit}
                disabled={!canSubmit}
                className={styles.btn}
            >
                {status === "submitting" ? "Надсилання…" : "Надіслати"}
            </button>

            {status === "error" && (
                <span className={styles.err}>Помилка ❌ — спробуйте ще раз</span>
            )}
            {status === "idle" && (
                <span className={styles.hint}>
                    {!String(name || "").trim()
                        ? "Вкажіть ім'я учасника"
                        : !Object.keys(availability || {}).length
                            ? "Оберіть хоча б один часовий слот"
                            : "Готово до надсилання"}
                </span>
            )}
        </div>
    );
}