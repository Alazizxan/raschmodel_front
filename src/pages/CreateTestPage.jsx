import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../api/client.js";
import { useToast } from "../App.jsx";
import { SUBJECTS_LIST } from "../config/subjects.js";

export default function CreateTestPage() {
  const navigate = useNavigate();
  const { addToast } = useToast();

  const [form, setForm] = useState({
    title: "",
    subject: "",
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  function validate() {
    const errs = {};
    if (!form.title.trim()) errs.title = "Sarlavha kiritilishi shart";
    if (!form.subject) errs.subject = "Fan tanlanishi shart";
    return errs;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) {
      setErrors(errs);
      return;
    }
    setErrors({});
    setLoading(true);

    try {
      const subjectLabel = SUBJECTS_LIST.find((s) => s.key === form.subject)?.label || form.subject;
      const data = await api.createTest(form.title.trim(), subjectLabel);
      addToast(`✅ Test yaratildi — #${data.id}`, "success");
      navigate(`/answer-key/${data.id}`);
    } catch (err) {
      addToast("Xatolik: " + err.message, "error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fade-in">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1>Yangi Test Yaratish</h1>
          <div className="breadcrumb">
            <span onClick={() => navigate("/")} style={{ cursor: "pointer" }}>
              Dashboard
            </span>
            {" / "}Test Yaratish
          </div>
        </div>
      </div>

      <div className="page-body">
        {/* Step Indicator */}
        <div className="steps mb-8">
          <div className="step">
            <div className="step-circle active">1</div>
            <div className="step-line"></div>
          </div>
          <div className="step">
            <div className="step-circle">2</div>
            <div className="step-line"></div>
          </div>
          <div className="step">
            <div className="step-circle">3</div>
            <div className="step-line"></div>
          </div>
          <div className="step">
            <div className="step-circle">4</div>
            <div className="step-line"></div>
          </div>
          <div className="step">
            <div className="step-circle">5</div>
          </div>
        </div>

        <div className="grid-2" style={{ maxWidth: 800, gap: "var(--space-8)" }}>
          {/* Form */}
          <div>
            <div className="card card-glow">
              <div className="card-title mb-4" style={{ fontSize: 20 }}>
                📋 Test Ma'lumotlari
              </div>

              <form onSubmit={handleSubmit} className="flex-col gap-5">
                <div className="form-group">
                  <label className="form-label" htmlFor="test-title">
                    Test Sarlavhasi
                  </label>
                  <input
                    id="test-title"
                    type="text"
                    className="form-input"
                    placeholder="masalan: Matematika Milliy Sertifikat 2026"
                    value={form.title}
                    onChange={(e) =>
                      setForm((p) => ({ ...p, title: e.target.value }))
                    }
                    autoFocus
                  />
                  {errors.title && (
                    <div className="form-error">{errors.title}</div>
                  )}
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="test-subject">
                    Fan
                  </label>
                  <select
                    id="test-subject"
                    className="form-select"
                    value={form.subject}
                    onChange={(e) =>
                      setForm((p) => ({ ...p, subject: e.target.value }))
                    }
                  >
                    <option value="">— Fan tanlang —</option>
                    {SUBJECTS_LIST.map((s) => (
                      <option key={s.key} value={s.key}>
                        {s.label}
                      </option>
                    ))}
                  </select>
                  {errors.subject && (
                    <div className="form-error">{errors.subject}</div>
                  )}
                </div>

                <div className="flex gap-3 mt-4">
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => navigate("/")}
                    disabled={loading}
                    id="btn-cancel-create"
                  >
                    Bekor qilish
                  </button>
                  <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={loading || !form.title || !form.subject}
                    id="btn-submit-create"
                  >
                    {loading ? (
                      <>
                        <span
                          className="spinner"
                          style={{ width: 16, height: 16, borderWidth: 2 }}
                        />
                        Yaratilmoqda...
                      </>
                    ) : (
                      <>➡️ Keyingi: Javob Kaliti</>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>

          {/* Info panel */}
          <div className="flex-col gap-4">
            <div className="highlight-box">
              <div
                className="font-bold mb-4"
                style={{ color: "var(--text-primary)", fontSize: 14 }}
              >
                📌 To'liq Flow
              </div>
              <div className="flex-col gap-3">
                {[
                  { step: 1, icon: "📋", text: "Test yaratish", active: true },
                  { step: 2, icon: "🔑", text: "Javob kalitini kiritish" },
                  { step: 3, icon: "👥", text: "Talaba javoblarini kiritish" },
                  { step: 4, icon: "🔒", text: "Testni yakunlash" },
                  { step: 5, icon: "🏆", text: "Natijalarni ko'rish" },
                ].map((item) => (
                  <div
                    key={item.step}
                    className="flex gap-3"
                    style={{ alignItems: "center" }}
                  >
                    <div
                      style={{
                        width: 24,
                        height: 24,
                        borderRadius: "50%",
                        background: item.active
                          ? "var(--accent-primary)"
                          : "var(--bg-card)",
                        border: `1px solid ${
                          item.active
                            ? "var(--accent-primary)"
                            : "var(--border-strong)"
                        }`,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: 11,
                        fontWeight: 700,
                        color: item.active ? "white" : "var(--text-muted)",
                        flexShrink: 0,
                      }}
                    >
                      {item.step}
                    </div>
                    <span
                      style={{
                        fontSize: 13,
                        color: item.active
                          ? "var(--text-primary)"
                          : "var(--text-muted)",
                        fontWeight: item.active ? 600 : 400,
                      }}
                    >
                      {item.icon} {item.text}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Subject preview */}
            {form.subject && (
              <div className="card slide-up">
                <div className="text-sm text-muted mb-3">Savol tuzilishi:</div>
                <div className="flex-col gap-2">
                  {[
                    { range: "1–32", type: "Oddiy test", color: "#6366f1" },
                    {
                      range: "33–35",
                      type: "Kengaytirilgan (AB, ABC...)",
                      color: "#22d3ee",
                    },
                    {
                      range:
                        ["ona_tili", "adabiyot"].includes(form.subject)
                          ? "36–44"
                          : "36–45",
                      type: "Yozma",
                      color: "#f59e0b",
                    },
                    ...( ["ona_tili", "adabiyot"].includes(form.subject)
                      ? [{ range: "45", type: "Insho/Bayon", color: "#10b981" }]
                      : []
                    ),
                  ].map((item) => (
                    <div
                      key={item.range}
                      className="flex gap-3"
                      style={{ alignItems: "center" }}
                    >
                      <span
                        style={{
                          width: 8,
                          height: 8,
                          borderRadius: "50%",
                          background: item.color,
                          flexShrink: 0,
                        }}
                      />
                      <span className="text-sm text-muted">
                        {item.range} —{" "}
                        <span style={{ color: "var(--text-secondary)" }}>
                          {item.type}
                        </span>
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
