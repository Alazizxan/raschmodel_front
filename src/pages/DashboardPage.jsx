import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../api/client.js";
import { useToast } from "../App.jsx";

const SUBJECT_ICONS = {
  matematika: "📐",
  fizika: "⚡",
  kimyo: "🧪",
  ona_tili: "📝",
  adabiyot: "📚",
  biologiya: "🧬",
  tarix: "🏛️",
  ingliz_tili: "🌍",
  geografiya: "🗺️",
};

function formatDate(iso) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("uz-UZ", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function DashboardPage() {
  const navigate = useNavigate();
  const { addToast } = useToast();
  const [tests, setTests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all"); // all | active | finalized

  useEffect(() => {
    loadTests();
  }, []);

  async function loadTests() {
    try {
      setLoading(true);
      const data = await api.getTests();
      setTests(Array.isArray(data) ? data : []);
    } catch (err) {
      addToast("Testlarni yuklashda xatolik: " + err.message, "error");
      setTests([]);
    } finally {
      setLoading(false);
    }
  }

  const filtered = tests.filter((t) => {
    if (filter === "active") return t.is_active && !t.is_finalized;
    if (filter === "finalized") return t.is_finalized;
    return true;
  });

  function getTestStatus(test) {
    if (test.is_finalized) return { label: "Yakunlangan", cls: "badge-finalized" };
    if (test.is_active) return { label: "Faol", cls: "badge-active" };
    return { label: "Qoralama", cls: "badge-draft" };
  }

  function handleCardClick(test) {
    if (test.is_finalized) {
      navigate(`/results/${test.id}`);
    } else {
      navigate(`/answer-key/${test.id}`);
    }
  }

  const totalTests = tests.length;
  const activeTests = tests.filter((t) => t.is_active && !t.is_finalized).length;
  const finalizedTests = tests.filter((t) => t.is_finalized).length;

  return (
    <div className="fade-in">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1>Dashboard</h1>
          <div className="breadcrumb">Barcha testlar</div>
        </div>
        <div className="header-actions">
          <button
            className="btn btn-primary"
            onClick={() => navigate("/create-test")}
            id="btn-create-test"
          >
            <span>➕</span> Yangi Test
          </button>
        </div>
      </div>

      <div className="page-body">
        {/* Stats */}
        <div className="stats-grid mb-6">
          <div className="stat-card">
            <div className="stat-icon">📋</div>
            <div className="stat-value">{totalTests}</div>
            <div className="stat-label">Jami Testlar</div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">🟢</div>
            <div className="stat-value">{activeTests}</div>
            <div className="stat-label">Faol</div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">✅</div>
            <div className="stat-value">{finalizedTests}</div>
            <div className="stat-label">Yakunlangan</div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">📅</div>
            <div
              className="stat-value"
              style={{ fontSize: 16, marginTop: 4, WebkitTextFillColor: "initial", color: "var(--text-accent)" }}
            >
              {new Date().toLocaleDateString("uz-UZ", { day: "numeric", month: "long" })}
            </div>
            <div className="stat-label">Bugun</div>
          </div>
        </div>

        {/* Filter */}
        <div className="section-header">
          <div>
            <div className="section-title">Testlar Ro'yxati</div>
            <div className="section-subtitle">{filtered.length} ta test topildi</div>
          </div>
          <div className="flex gap-2">
            {["all", "active", "finalized"].map((f) => (
              <button
                key={f}
                className={`btn btn-sm ${filter === f ? "btn-primary" : "btn-ghost"}`}
                onClick={() => setFilter(f)}
                id={`filter-${f}`}
              >
                {f === "all" ? "Barchasi" : f === "active" ? "Faol" : "Yakunlangan"}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        {loading ? (
          <div className="loading-container">
            <div className="spinner"></div>
            <div className="loading-text">Testlar yuklanmoqda...</div>
          </div>
        ) : filtered.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon float">📋</div>
            <div className="empty-title">Testlar topilmadi</div>
            <div className="empty-desc">
              Hali test yaratilmagan. Birinchi testingizni yarating!
            </div>
            <button
              className="btn btn-primary mt-4"
              onClick={() => navigate("/create-test")}
            >
              ➕ Yangi Test Yaratish
            </button>
          </div>
        ) : (
          <div className="tests-grid">
            {filtered.map((test) => {
              const status = getTestStatus(test);
              const icon =
                SUBJECT_ICONS[test.subject?.toLowerCase().replace(" ", "_")] ||
                "📄";
              return (
                <div
                  key={test.id}
                  className="test-card"
                  onClick={() => handleCardClick(test)}
                  id={`test-card-${test.id}`}
                >
                  <div className="test-card-header">
                    <div className="test-card-icon">{icon}</div>
                    <span className={`badge ${status.cls}`}>
                      <span>●</span> {status.label}
                    </span>
                  </div>

                  <div className="card-title" style={{ fontSize: 15 }}>
                    {test.title}
                  </div>
                  <div className="card-subtitle">{test.subject}</div>

                  <div className="test-card-meta">
                    <div className="test-card-meta-item">
                      <span>🗓</span> {formatDate(test.created_at)}
                    </div>
                    <div className="test-card-meta-item">
                      <span>🆔</span> Test #{test.id}
                    </div>
                  </div>

                  <div className="test-card-actions">
                    {!test.is_finalized ? (
                      <>
                        <button
                          className="btn btn-secondary btn-sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/answer-key/${test.id}`);
                          }}
                          id={`btn-answer-key-${test.id}`}
                        >
                          🔑 Javob Kaliti
                        </button>
                        <button
                          className="btn btn-secondary btn-sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/students/${test.id}`);
                          }}
                          id={`btn-students-${test.id}`}
                        >
                          👥 Talabalar
                        </button>
                      </>
                    ) : (
                      <button
                        className="btn btn-primary btn-sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/results/${test.id}`);
                        }}
                        id={`btn-results-${test.id}`}
                      >
                        🏆 Natijalar
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
