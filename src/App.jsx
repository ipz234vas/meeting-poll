import { HashRouter, Routes, Route, NavLink, Outlet, useParams, Link } from "react-router-dom";
import HomePage    from "./pages/HomePage.jsx";
import PickerPage  from "./pages/PickerPage.jsx";
import ResultsPage from "./pages/ResultsPage.jsx";
import styles from "./App.module.css";

// ─── Poll layout ──────────────────────────────────────────────────────────────
// Wraps /poll/:guid and /poll/:guid/results.
// Provides its own sticky nav with the two poll-specific links.
function PollLayout() {
    const { guid } = useParams();

    return (
        <div className={styles.shell}>
            {/* Sticky poll nav */}
            <nav className={styles.nav}>
                <Link to="/" className={styles.navBrand}>📅 MeetPoll</Link>

                <div className={styles.navSep} />

                <NavLink
                    to={`/poll/${guid}`}
                    end
                    className={({ isActive }) =>
                        `${styles.navLink} ${isActive ? styles.navLinkActive : ""}`
                    }
                >
                    Обрати час
                </NavLink>

                <NavLink
                    to={`/poll/${guid}/results`}
                    className={({ isActive }) =>
                        `${styles.navLink} ${isActive ? styles.navLinkActive : ""}`
                    }
                >
                    Результати
                </NavLink>
            </nav>

            {/* Page content */}
            <main className={styles.main}>
                <Outlet />
            </main>
        </div>
    );
}

// ─── Home layout ──────────────────────────────────────────────────────────────
// Just the brand — no poll links on the create page.
function HomeLayout() {
    return (
        <div className={styles.shell}>
            <nav className={styles.nav}>
                <Link to="/" className={styles.navBrand}>📅 MeetPoll</Link>
                <span className={styles.navTagline}>Планування зустрічей</span>
            </nav>
            <main className={styles.main}>
                <Outlet />
            </main>
        </div>
    );
}

// ─── App ──────────────────────────────────────────────────────────────────────
export default function App() {
    return (
        <HashRouter>
            <Routes>
                {/* Home — create a poll */}
                <Route element={<HomeLayout />}>
                    <Route path="/" element={<HomePage />} />
                </Route>

                {/* Poll — vote + results */}
                <Route path="/poll/:guid" element={<PollLayout />}>
                    <Route index        element={<PickerPage />} />
                    <Route path="results" element={<ResultsPage />} />
                </Route>
            </Routes>
        </HashRouter>
    );
}