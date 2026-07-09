import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { api } from "../api/client.js";
import { useToast } from "../App.jsx";

const GRADE_COLORS = {
  A: { bg: "rgba(34,197,94,0.15)", color: "#22c55e", border: "rgba(34,197,94,0.25)" },
  B: { bg: "rgba(59,130,246,0.15)", color: "#3b82f6", border: "rgba(59,130,246,0.25)" },
  C: { bg: "rgba(245,158,11,0.15)", color: "#f59e0b", border: "rgba(245,158,11,0.25)" },
  D: { bg: "rgba(239,68,68,0.15)", color: "#ef4444", border: "rgba(239,68,68,0.25)" },
  F: { bg: "rgba(107,114,128,0.15)", color: "#6b7280", border: "rgba(107,114,128,0.25)" },
};

function GradeBadge({ grade }) {
  const style = GRADE_COLORS[grade] || GRADE_COLORS.F;
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        width: 32,
        height: 32,
        borderRadius: "8px",
        background: style.bg,
        color: style.color,
        border: `1px solid ${style.border}`,
        fontWeight: 800,
        fontSize: 14,
      }}
    >
      {grade || "—"}
    </span>
  );
}

function ScoreBar({ value, max = 100, color = "var(--accent-primary)" }) {
  const pct = Math.min(100, Math.max(0, (value / max) * 100));
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
      <div style={{ flex: 1, height: 6, background: "var(--bg-input)", borderRadius: 999, overflow: "hidden" }}>
        <div
          style={{
            height: "100%",
            width: `${pct}%`,
            background: color,
            borderRadius: 999,
            transition: "width 0.8s cubic-bezier(0.4,0,0.2,1)",
          }}
        />
      </div>
      <span style={{ fontSize: 12, color: "var(--text-muted)", minWidth: 36, textAlign: "right" }}>
        {typeof value === "number" ? value.toFixed(1) : "—"}%
      </span>
    </div>
  );
}

// CSV export
function exportCSV(results, testTitle) {
  const headers = [
    "№", "Ism", "Talaba ID", "Theta", "Theta SE",
    "To'g'ri", "Foiz (%)", "Ball", "Sertifikat (%)", "Daraja"
  ];
  const rows = results.map((r, i) => [
    i + 1,
    r.student?.full_name || r.student_name || `Talaba #${r.student_id}`,
    r.student_id,
    r.theta?.toFixed(4) ?? "",
    r.theta_se?.toFixed(4) ?? "",
    r.raw_score?.toFixed(2) ?? "",
    r.raw_percentage?.toFixed(2) ?? "",
    r.scaled_score?.toFixed(2) ?? "",
    r.certificate_percentage?.toFixed(2) ?? "",
    r.grade ?? "",
  ]);

  const csv = [headers, ...rows]
    .map((row) => row.map((cell) => `"${cell}"`).join(","))
    .join("\n");

  const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${testTitle || "natijalar"}_${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

// Grade distribution
function GradeChart({ results }) {
  const grades = ["A", "B", "C", "D", "F"];
  const counts = grades.reduce((acc, g) => {
    acc[g] = results.filter((r) => r.grade === g).length;
    return acc;
  }, {});
  const max = Math.max(...Object.values(counts), 1);

  return (
    <div style={{ display: "flex", alignItems: "flex-end", gap: 8, height: 80 }}>
      {grades.map((g) => {
        const pct = (counts[g] / max) * 100;
        const style = GRADE_COLORS[g];
        return (
          <div
            key={g}
            style={{
              flex: 1,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 4,
              height: "100%",
              justifyContent: "flex-end",
            }}
          >
            <span style={{ fontSize: 11, color: "var(--text-muted)" }}>{counts[g]}</span>
            <div
              style={{
                width: "100%",
                height: `${Math.max(pct, 4)}%`,
                background: style.bg,
                border: `1px solid ${style.border}`,
                borderRadius: "4px 4px 0 0",
                minHeight: 4,
                transition: "height 0.8s ease",
              }}
            />
            <span style={{ fontSize: 12, fontWeight: 700, color: style.color }}>{g}</span>
          </div>
        );
      })}
    </div>
  );
}

export default function ResultsPage() {
  const { testId } = useParams();
  const navigate = useNavigate();
  const { addToast } = useToast();

  const [results, setResults] = useState([]);
  const [test, setTest] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sortKey, setSortKey] = useState("scaled_score");
  const [sortDir, setSortDir] = useState("desc");
  const [search, setSearch] = useState("");
  const [finalizeData, setFinalizeData] = useState(null); // finalize response data

  useEffect(() => {
    loadResults();
  }, [testId]);

  async function loadResults() {
    try {
      setLoading(true);
      const [testData, resultsData] = await Promise.all([
        api.getTest(testId),
        api.getResults(testId),
      ]);
      setTest(testData);
      setResults(Array.isArray(resultsData) ? resultsData : []);
    } catch (err) {
      addToast("Natijalar yuklanmadi: " + err.message, "error");
      setResults([]);
    } finally {
      setLoading(false);
    }
  }

  function toggleSort(key) {
    if (sortKey === key) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else { setSortKey(key); setSortDir("desc"); }
  }

  function SortIcon({ col }) {
    if (sortKey !== col) return <span style={{ color: "var(--text-muted)", fontSize: 10 }}>↕</span>;
    return <span style={{ color: "var(--accent-primary)", fontSize: 10 }}>{sortDir === "asc" ? "↑" : "↓"}</span>;
  }

  // Sorted + filtered
  const displayed = [...results]
    .filter((r) => {
      if (!search) return true;
      const name = r.student?.full_name || r.student_name || `Talaba #${r.student_id}`;
      return name.toLowerCase().includes(search.toLowerCase());
    })
    .sort((a, b) => {
      let av = a[sortKey] ?? -Infinity;
      let bv = b[sortKey] ?? -Infinity;
      if (typeof av === "string") av = av.charCodeAt(0);
      if (typeof bv === "string") bv = bv.charCodeAt(0);
      return sortDir === "asc" ? av - bv : bv - av;
    });

  // Stats
  const avg = results.length
    ? results.reduce((s, r) => s + (r.scaled_score ?? 0), 0) / results.length
    : 0;
  const avgPct = results.length
    ? results.reduce((s, r) => s + (r.certificate_percentage ?? 0), 0) / results.length
    : 0;
  const topScore = results.length ? Math.max(...results.map((r) => r.scaled_score ?? 0)) : 0;
  const countA = results.filter((r) => r.grade === "A").length;

  if (loading) {
    return (
      <div className="loading-container" style={{ minHeight: "100vh" }}>
        <div className="spinner" />
        <div className="loading-text">Natijalar yuklanmoqda...</div>
      </div>
    );
  }

  return (
    <div className="fade-in">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1>Natijalar</h1>
          <div className="breadcrumb">
            <span onClick={() => navigate("/")} style={{ cursor: "pointer" }}>
              Dashboard
            </span>{" "}
            / {test?.title || `Test #${testId}`}
          </div>
        </div>
        <div className="header-actions">
          <button
            className="btn btn-secondary"
            onClick={() => exportCSV(results, test?.title)}
            disabled={results.length === 0}
            id="btn-export-csv"
          >
            📥 CSV Yuklab olish
          </button>
          <button
            className="btn btn-ghost"
            onClick={() => window.print()}
            id="btn-print"
          >
            🖨 Chop etish
          </button>
        </div>
      </div>

      <div className="page-body">
        {/* Hero */}
        <div className="results-hero mb-6">
          <div className="results-hero-title">{test?.title}</div>
          <div className="results-hero-sub">
            {test?.subject} · {results.length} talaba · Rasch IRT natijalar
          </div>
        </div>

        {/* Stats */}
        <div className="stats-grid mb-6">
          <div className="stat-card">
            <div className="stat-icon">👥</div>
            <div className="stat-value">{results.length}</div>
            <div className="stat-label">Jami Talabalar</div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">📊</div>
            <div className="stat-value">{avg.toFixed(1)}</div>
            <div className="stat-label">O'rtacha Ball</div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">🏆</div>
            <div className="stat-value">{topScore.toFixed(1)}</div>
            <div className="stat-label">Eng Yuqori Ball</div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">⭐</div>
            <div className="stat-value">{countA}</div>
            <div className="stat-label">A Daraja</div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">📈</div>
            <div className="stat-value">{avgPct.toFixed(1)}%</div>
            <div className="stat-label">O'rtacha Foiz</div>
          </div>
        </div>

        {/* Chart + search row */}
        <div className="grid-2 mb-6" style={{ alignItems: "start" }}>
          <div className="card">
            <div className="card-title mb-4" style={{ fontSize: 14 }}>
              📊 Daraja Taqsimoti
            </div>
            <GradeChart results={results} />
          </div>
          <div className="card" style={{ display: "flex", flexDirection: "column", gap: "var(--space-4)" }}>
            <div className="card-title" style={{ fontSize: 14 }}>
              🔍 Qidirish
            </div>
            <input
              type="text"
              className="form-input"
              placeholder="Talaba ismi..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              id="search-student"
            />
            <div style={{ fontSize: 13, color: "var(--text-muted)" }}>
              {displayed.length} ta natija ko'rsatilmoqda
            </div>
          </div>
        </div>

        {/* Table */}
        {results.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon float">📊</div>
            <div className="empty-title">Natijalar hali yo'q</div>
            <div className="empty-desc">
              Test yakunlanmagan. Avval talabalar kiritib, testni yakunlang.
            </div>
            <button
              className="btn btn-primary mt-4"
              onClick={() => navigate(`/students/${testId}`)}
              id="btn-goto-students"
            >
              👥 Talabalar sahifasiga o'tish
            </button>
          </div>
        ) : (
          <div className="table-wrapper">
            <table id="results-table">
              <thead>
                <tr>
                  <th>№</th>
                  <th
                    style={{ cursor: "pointer" }}
                    onClick={() => toggleSort("student_id")}
                  >
                    Ism <SortIcon col="student_id" />
                  </th>
                  <th
                    style={{ cursor: "pointer" }}
                    onClick={() => toggleSort("theta")}
                  >
                    Theta <SortIcon col="theta" />
                  </th>
                  <th
                    style={{ cursor: "pointer" }}
                    onClick={() => toggleSort("raw_score")}
                  >
                    To'g'ri <SortIcon col="raw_score" />
                  </th>
                  <th
                    style={{ cursor: "pointer" }}
                    onClick={() => toggleSort("raw_percentage")}
                  >
                    Foiz (%) <SortIcon col="raw_percentage" />
                  </th>
                  <th
                    style={{ cursor: "pointer" }}
                    onClick={() => toggleSort("scaled_score")}
                  >
                    Ball <SortIcon col="scaled_score" />
                  </th>
                  <th
                    style={{ cursor: "pointer" }}
                    onClick={() => toggleSort("certificate_percentage")}
                  >
                    Sertifikat % <SortIcon col="certificate_percentage" />
                  </th>
                  <th
                    style={{ cursor: "pointer" }}
                    onClick={() => toggleSort("grade")}
                  >
                    Daraja <SortIcon col="grade" />
                  </th>
                </tr>
              </thead>
              <tbody>
                {displayed.map((r, idx) => {
                  const name =
                    r.student?.full_name ||
                    r.student_name ||
                    r.ismi ||
                    `Talaba #${r.student_id}`;
                  return (
                    <tr key={r.id || r.student_id}>
                      <td style={{ color: "var(--text-muted)", fontSize: 12 }}>
                        {idx + 1}
                      </td>
                      <td>
                        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                          <div
                            style={{
                              width: 32,
                              height: 32,
                              borderRadius: 8,
                              background: "var(--gradient-soft)",
                              border: "1px solid var(--border-accent)",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              fontSize: 12,
                              fontWeight: 700,
                              color: "var(--text-accent)",
                              flexShrink: 0,
                            }}
                          >
                            {name.slice(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <div style={{ fontWeight: 600, color: "var(--text-primary)", fontSize: 14 }}>
                              {name}
                            </div>
                            <div style={{ fontSize: 11, color: "var(--text-muted)" }}>
                              ID: {r.student_id}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td>
                        <span style={{ fontFamily: "monospace", fontSize: 13, color: "var(--text-accent)" }}>
                          {r.theta != null ? r.theta.toFixed(3) : "—"}
                        </span>
                        {r.theta_se != null && (
                          <span style={{ fontSize: 10, color: "var(--text-muted)", marginLeft: 4 }}>
                            ±{r.theta_se.toFixed(2)}
                          </span>
                        )}
                      </td>
                      <td style={{ fontWeight: 600, color: "var(--text-primary)" }}>
                        {r.raw_score != null ? r.raw_score.toFixed(1) : "—"}
                      </td>
                      <td>
                        <ScoreBar value={r.raw_percentage} />
                      </td>
                      <td>
                        <span
                          style={{
                            fontSize: 16,
                            fontWeight: 800,
                            background: "var(--gradient-primary)",
                            WebkitBackgroundClip: "text",
                            WebkitTextFillColor: "transparent",
                            backgroundClip: "text",
                          }}
                        >
                          {r.scaled_score != null ? r.scaled_score.toFixed(1) : "—"}
                        </span>
                      </td>
                      <td>
                        <ScoreBar
                          value={r.certificate_percentage}
                          color="var(--accent-secondary)"
                        />
                      </td>
                      <td>
                        <GradeBadge grade={r.grade} />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Bottom actions */}
        <div className="flex gap-3 mt-8" style={{ justifyContent: "flex-end" }}>
          <button
            className="btn btn-secondary"
            onClick={() => navigate("/")}
            id="btn-back-home"
          >
            🏠 Dashboard
          </button>
          {results.length > 0 && (
            <button
              className="btn btn-primary"
              onClick={() => exportCSV(results, test?.title)}
              id="btn-export-bottom"
            >
              📥 CSV Yuklab olish
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
