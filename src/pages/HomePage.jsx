import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { submitToGoogleForm } from "../lib/submitToGoogleForm";
import { POLLS_FORM_CONFIG } from "../config/googleForm";
import styles from "./HomePage.module.css";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function newDay() {
    return { id: crypto.randomUUID(), date: "", start: "09:00", end: "18:00" };
}

const SLOT_OPTIONS = [
    { value: 15,  label: "15 хв" },
    { value: 30,  label: "30 хв" },
    { value: 60,  label: "1 год" },
];

const DURATION_OPTIONS = [
    { value: 30,  label: "30 хв" },
    { value: 60,  label: "1 год" },
    { value: 90,  label: "1.5 год" },
    { value: 120, label: "2 год" },
    { value: 180, label: "3 год" },
    { value: 240, label: "4 год" },
    { value: 300, label: "5 год" },
    { value: 360, label: "6 год" },
    { value: 420, label: "7 год" },
    { value: 480, label: "8 год" },
    { value: 540, label: "9 год" },
    { value: 600, label: "10 год" },
    { value: 660, label: "11 год" },
    { value: 720, label: "12 год" },
];

// ─── Component ────────────────────────────────────────────────────────────────

export default function HomePage() {
    const navigate = useNavigate();

    // ── Form state ────────────────────────────────────────────────────────────
    const [pollTitle,   setPollTitle]   = useState("");
    const [slotMins,    setSlotMins]    = useState(30);
    const [durationMins,setDurationMins]= useState(60);
    const [days,        setDays]        = useState([newDay()]);

    // ── Submit state ──────────────────────────────────────────────────────────
    const [status,      setStatus]      = useState("idle"); // idle | submitting | success | error
    const [createdGuid, setCreatedGuid] = useState(null);
    const [copied,      setCopied]      = useState(false);

    // ── Day helpers ───────────────────────────────────────────────────────────
    function updateDay(id, field, value) {
        setDays((prev) => prev.map((d) => d.id === id ? { ...d, [field]: value } : d));
    }

    function removeDay(id) {
        setDays((prev) => prev.filter((d) => d.id !== id));
    }

    function addDay() {
        setDays((prev) => [...prev, newDay()]);
    }

    // ── Validation ────────────────────────────────────────────────────────────
    const validDays  = days.filter((d) => d.date && d.start && d.end);
    const canSubmit  =
        pollTitle.trim().length > 0 &&
        validDays.length > 0 &&
        status !== "submitting";

    // ── Submit ────────────────────────────────────────────────────────────────
    async function handleCreate() {
        if (!canSubmit) return;
        setStatus("submitting");

        try {
            const guid = crypto.randomUUID();

            const payload = {
                title:                  pollTitle.trim(),
                slotMinutes:            Number(slotMins),
                meetingDurationMinutes: Number(durationMins),
                days: validDays.map(({ date, start, end }) => ({ date, start, end })),
            };

            await submitToGoogleForm({
                formActionUrl: POLLS_FORM_CONFIG.formActionUrl,
                fields: {
                    [POLLS_FORM_CONFIG.fields.id]:   guid,
                    [POLLS_FORM_CONFIG.fields.json]: JSON.stringify(payload),
                },
            });

            setCreatedGuid(guid);
            setStatus("success");
        } catch {
            setStatus("error");
        }
    }

    // ── Shareable link ────────────────────────────────────────────────────────
    const pollUrl = createdGuid
        ? `${window.location.origin}${window.location.pathname}#/poll/${createdGuid}`
        : "";

    function handleCopy() {
        navigator.clipboard.writeText(pollUrl).then(() => {
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        });
    }

    function handleReset() {
        setPollTitle("");
        setSlotMins(30);
        setDurationMins(60);
        setDays([newDay()]);
        setCreatedGuid(null);
        setCopied(false);
        setStatus("idle");
    }

    // ── Render ────────────────────────────────────────────────────────────────

    if (status === "success" && createdGuid) {
        return (
            <div className={styles.page}>
                <h1 className={styles.title}>Опитування створено! 🎉</h1>
                <p className={styles.subtitle}>Поділіться посиланням з учасниками</p>

                <div className={styles.successCard}>
                    <div className={styles.successCardTitle}>✅ {pollTitle}</div>
                    <div className={styles.successCardSub}>
                        {validDays.length} {validDays.length === 1 ? "день" : "дні/днів"} ·{" "}
                        {slotMins} хв слоти · зустріч {durationMins} хв
                    </div>

                    <div className={styles.linkBox}>
                        <input
                            className={styles.linkInput}
                            value={pollUrl}
                            readOnly
                            onFocus={(e) => e.target.select()}
                        />
                        <button
                            className={`${styles.copyBtn} ${copied ? styles.copyBtnDone : ""}`}
                            onClick={handleCopy}
                        >
                            {copied ? "Скопійовано ✓" : "Копіювати"}
                        </button>
                    </div>

                    <div className={styles.linkBox}>
                        <button
                            className={styles.goToPollBtn}
                            onClick={() => navigate(`/poll/${createdGuid}`)}
                        >
                            Перейти до опитування →
                        </button>
                        <button className={styles.createAnotherBtn} onClick={handleReset}>
                            + Створити ще одне
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className={styles.page}>
            <h1 className={styles.title}>Нове опитування</h1>
            <p className={styles.subtitle}>
                Оберіть дні, час і тривалість — учасники самі позначать коли їм зручно
            </p>

            {/* ── Poll info ─────────────────────────────────────────────────── */}
            <div className={styles.section}>
                <div className={styles.sectionTitle}>Загальна інформація</div>

                <div className={styles.field}>
                    <label className={styles.fieldLabel} htmlFor="poll-title">
                        Назва події
                    </label>
                    <input
                        id="poll-title"
                        className={styles.input}
                        value={pollTitle}
                        onChange={(e) => setPollTitle(e.target.value)}
                        placeholder="Наприклад: Командна зустріч…"
                        autoComplete="off"
                    />
                </div>

                <div className={styles.inlineFields}>
                    <div className={styles.field}>
                        <label className={styles.fieldLabel} htmlFor="slot-mins">
                            Розмір слоту
                        </label>
                        <select
                            id="slot-mins"
                            className={styles.select}
                            value={slotMins}
                            onChange={(e) => setSlotMins(Number(e.target.value))}
                        >
                            {SLOT_OPTIONS.map((o) => (
                                <option key={o.value} value={o.value}>{o.label}</option>
                            ))}
                        </select>
                        <span className={styles.fieldHint}>Крок вибору часу</span>
                    </div>

                    <div className={styles.field}>
                        <label className={styles.fieldLabel} htmlFor="duration-mins">
                            Тривалість зустрічі
                        </label>
                        <select
                            id="duration-mins"
                            className={styles.select}
                            value={durationMins}
                            onChange={(e) => setDurationMins(Number(e.target.value))}
                        >
                            {DURATION_OPTIONS.map((o) => (
                                <option key={o.value} value={o.value}>{o.label}</option>
                            ))}
                        </select>
                        <span className={styles.fieldHint}>Мінімальний потрібний час</span>
                    </div>
                </div>
            </div>

            {/* ── Days ──────────────────────────────────────────────────────── */}
            <div className={styles.section}>
                <div className={styles.sectionTitle}>Потенційні дні</div>

                <div className={styles.dayList}>
                    {days.map((d, idx) => (
                        <div key={d.id} className={styles.dayRow}>
                            <div className={styles.dayField}>
                                <label className={styles.dayFieldLabel}>Дата</label>
                                <input
                                    type="date"
                                    className={styles.dayInput}
                                    value={d.date}
                                    onChange={(e) => updateDay(d.id, "date", e.target.value)}
                                />
                            </div>
                            <div className={styles.dayField}>
                                <label className={styles.dayFieldLabel}>Від</label>
                                <input
                                    type="time"
                                    className={styles.dayInput}
                                    value={d.start}
                                    onChange={(e) => updateDay(d.id, "start", e.target.value)}
                                />
                            </div>
                            <div className={styles.dayField}>
                                <label className={styles.dayFieldLabel}>До</label>
                                <input
                                    type="time"
                                    className={styles.dayInput}
                                    value={d.end}
                                    onChange={(e) => updateDay(d.id, "end", e.target.value)}
                                />
                            </div>
                            <button
                                className={styles.removeDayBtn}
                                onClick={() => removeDay(d.id)}
                                disabled={days.length === 1}
                                title="Видалити день"
                                aria-label="Видалити день"
                            >
                                ✕
                            </button>
                        </div>
                    ))}
                </div>

                <button className={styles.addDayBtn} onClick={addDay}>
                    + Додати день
                </button>
            </div>

            {/* ── Submit ────────────────────────────────────────────────────── */}
            <div className={styles.submitRow}>
                <button
                    className={styles.submitBtn}
                    onClick={handleCreate}
                    disabled={!canSubmit}
                >
                    {status === "submitting" ? "Створення…" : "Створити опитування"}
                </button>

                {status === "error" && (
                    <span className={styles.errorMsg}>Помилка ❌ — спробуйте ще раз</span>
                )}
                {status === "idle" && !canSubmit && (
                    <span className={styles.submitHint}>
                        {!pollTitle.trim()
                            ? "Введіть назву події"
                            : validDays.length === 0
                                ? "Заповніть хоча б один день"
                                : ""}
                    </span>
                )}
            </div>
        </div>
    );
}