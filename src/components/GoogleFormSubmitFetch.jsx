import { useState } from "react";
import { submitToGoogleForm } from "../lib/submitToGoogleForm";
import { GOOGLE_FORM_CONFIG } from "../config/googleForm";
import styles from "./GoogleFormSubmitFetch.module.css";

export default function GoogleFormSubmitFetch({ name, availability, slotMinutes, onSuccess }) {
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
                formActionUrl: GOOGLE_FORM_CONFIG.formActionUrl,
                entryNameKey:  GOOGLE_FORM_CONFIG.fields.name,
                entryJsonKey:  GOOGLE_FORM_CONFIG.fields.json,
                name:          String(name).trim(),
                jsonString:    JSON.stringify({
                    slotMinutes:  Number(slotMinutes) || 30,
                    availability: availability ?? {},
                }),
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