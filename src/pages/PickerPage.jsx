import { useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { usePoll } from "../lib/usePoll";
import TimeGrid from "../components/TimeGrid";
import GoogleFormSubmitFetch from "../components/GoogleFormSubmitFetch.jsx";
import styles from "./PickerPage.module.css";

export default function PickerPage() {
    const { guid } = useParams();
    const { loading, error, meta, days } = usePoll(guid);
    const navigate = useNavigate();

    const [mode, setMode]                 = useState("g");
    const [name, setName]                 = useState("");
    const [availability, setAvailability] = useState({});
    const [submitted, setSubmitted]       = useState(false);

    const slotMinutes = useMemo(() => Number(meta?.slotMinutes ?? 30) || 30, [meta]);

    if (loading) return <p style={{ padding: 16 }}>Завантаження…</p>;
    if (error)   return <p style={{ padding: 16, color: "crimson" }}>Помилка: {error}</p>;

    const modeName = mode === "g" ? "Підходить" : mode === "y" ? "Можливо" : "Стерти";

    return (
        <div className={styles.page}>
            <h1 className={styles.title}>{meta?.title ?? "Вибір зручного часу"}</h1>

            {/* ── Success banner ───────────────────────────────────────────── */}
            {submitted && (
                <div className={styles.successBanner}>
                    <div className={styles.successTop}>
                        <span className={styles.successIcon}>✅</span>
                        <div>
                            <div className={styles.successTitle}>Відповідь надіслано!</div>
                            <div className={styles.successSub}>
                                Дякуємо, <strong>{name}</strong>. Ваш вибір збережено нижче.
                            </div>
                        </div>
                    </div>

                    <div className={styles.successActions}>
                        <button
                            className={styles.btnResults}
                            onClick={() => navigate(`/poll/${guid}/results`)}
                        >
                            Переглянути результати →
                        </button>
                        <button className={styles.btnEdit} onClick={() => setSubmitted(false)}>
                            ✏️ Змінити відповідь
                        </button>
                    </div>

                    <p className={styles.delayNote}>
                        💬 Результати оновлюються з невеликою затримкою (~1 хв).
                    </p>
                </div>
            )}

            {/* ── Top bar ──────────────────────────────────────────────────── */}
            {!submitted && (
                <>
                    <div className={styles.topBar}>
                        <div className={styles.nameGroup}>
                            <label className={styles.label} htmlFor="participant-name">
                                Ваше ім'я
                            </label>
                            <input
                                id="participant-name"
                                className={styles.input}
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder="Іваненко Іван"
                                autoComplete="off"
                            />
                            <span className={styles.nameHint}>
                                Прізвище + Ім'я або унікальний нікнейм
                            </span>
                        </div>

                        <div className={styles.modes}>
                            <ModeButton active={mode === "g"} onClick={() => setMode("g")}>🟩 Підходить</ModeButton>
                            <ModeButton active={mode === "y"} onClick={() => setMode("y")}>🟨 Можливо</ModeButton>
                            <ModeButton active={mode === "e"} onClick={() => setMode("e")}>🧽 Стерти</ModeButton>
                        </div>

                        <div className={styles.modeHint}>Режим: <b>{modeName}</b></div>
                    </div>

                    <div className={styles.nickCallout}>
                        <span className={styles.nickCalloutIcon}>🔑</span>
                        <div>
                            <strong>Нікнейм = ваш ключ.</strong>{" "}
                            Якщо захочете змінити відповідь пізніше — просто введіть
                            той самий нікнейм і надішліть знову. Нова відповідь
                            автоматично замінить попередню.
                        </div>
                    </div>

                    <div className={styles.legend}>
                        <span className={styles.legendItem}>
                            <span className={`${styles.legendSwatch} ${styles.swatchGreen}`} />
                            Підходить — зручний час
                        </span>
                        <span className={styles.legendItem}>
                            <span className={`${styles.legendSwatch} ${styles.swatchYellow}`} />
                            Можливо — може підійти
                        </span>
                    </div>

                    <p className={styles.shiftHint}>
                        💡 Затисніть ліву кнопку миші та тягніть, щоб позначити кілька клітинок.
                        Або утримуйте <kbd>Shift</kbd> і клікніть на другу клітинку — заповниться весь діапазон одразу.
                    </p>
                </>
            )}

            <TimeGrid
                days={days}
                slotMinutes={slotMinutes}
                value={availability}
                onChange={setAvailability}
                mode={mode}
                readOnly={submitted}
            />

            {!submitted && (
                <GoogleFormSubmitFetch
                    name={name}
                    availability={availability}
                    slotMinutes={slotMinutes}
                    pollId={guid}
                    onSuccess={() => setSubmitted(true)}
                />
            )}
        </div>
    );
}

function ModeButton({ active, onClick, children }) {
    return (
        <button
            type="button"
            onClick={onClick}
            className={`${styles.btn} ${active ? styles.btnActive : ""}`}
        >
            {children}
        </button>
    );
}