import { HashRouter, Routes, Route, Link } from "react-router-dom"
import PickerPage from "./pages/PickerPage.jsx"
import ResultsPage from "./pages/ResultsPage.jsx"

export default function App() {
    return (
        <HashRouter>
            <nav style={{ display: "flex", gap: "1rem", marginBottom: "1rem" }}>
                <Link to="/">Picker</Link>
                <Link to="/results">Results</Link>
            </nav>

            <Routes>
                <Route path="/" element={<PickerPage />} />
                <Route path="/results" element={<ResultsPage />} />
            </Routes>
        </HashRouter>
    )
}
