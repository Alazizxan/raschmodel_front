import { createContext, useContext, useState, useCallback } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Layout from "./components/Layout.jsx";
import Toast from "./components/Toast.jsx";
import DashboardPage from "./pages/DashboardPage.jsx";
import CreateTestPage from "./pages/CreateTestPage.jsx";
import AnswerKeyPage from "./pages/AnswerKeyPage.jsx";
import StudentsPage from "./pages/StudentsPage.jsx";
import ResultsPage from "./pages/ResultsPage.jsx";

// ─── Toast Context ────────────────────────────────────────
export const ToastContext = createContext(null);

export function useToast() {
  return useContext(ToastContext);
}

// ─── App ─────────────────────────────────────────────────
export default function App() {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((message, type = "info", duration = 4000) => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, duration);
  }, []);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ addToast }}>
      <BrowserRouter>
        <Routes>
          <Route element={<Layout />}>
            <Route index element={<DashboardPage />} />
            <Route path="/create-test" element={<CreateTestPage />} />
            <Route path="/answer-key/:testId" element={<AnswerKeyPage />} />
            <Route path="/students/:testId" element={<StudentsPage />} />
            <Route path="/results/:testId" element={<ResultsPage />} />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
      <Toast toasts={toasts} onRemove={removeToast} />
    </ToastContext.Provider>
  );
}
