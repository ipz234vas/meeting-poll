import { HashRouter, Routes, Route, NavLink } from "react-router-dom";
import PickerPage from "./pages/PickerPage.jsx";
import ResultsPage from "./pages/ResultsPage.jsx";
import styles from "./App.module.css";

export default function App() {
    return (
        <HashRouter>
            <div className={styles.shell}>
                <nav className={styles.nav}>
                    {/* Brand / logo text */}
                    <span className={styles.navBrand}>📅 MeetPoll</span>

                    <div className={styles.navSep} />

                    <NavLink
                        to="/"
                        end
                        className={({ isActive }) =>
                            `${styles.navLink} ${isActive ? styles.navLinkActive : ""}`
                        }
                    >
                        Обрати час
                    </NavLink>

                    <NavLink
                        to="/results"
                        className={({ isActive }) =>
                            `${styles.navLink} ${isActive ? styles.navLinkActive : ""}`
                        }
                    >
                        Результати
                    </NavLink>
                </nav>

                <main className={styles.main}>
                    <Routes>
                        <Route path="/"        element={<PickerPage />} />
                        <Route path="/results" element={<ResultsPage />} />
                    </Routes>
                </main>
            </div>
        </HashRouter>
    );
}