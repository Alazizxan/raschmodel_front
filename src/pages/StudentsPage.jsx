import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { api } from "../api/client.js";
import { useToast } from "../App.jsx";
import {
  buildQuestionsForSubject,
  SINGLE_CHOICE_OPTIONS,
  MULTI_CHOICE_OPTIONS,
} from "../config/subjects.js";

// ─── Answer components (student version) ─────────────────

function SingleChoicePicker({ value, onChange }) {
  return (
    <div className="choice-buttons">
      {SINGLE_CHOICE_OPTIONS.map((opt) => (
        <button
          key={opt}
          type="button"
          className={`choice-btn ${value === opt ? "selected" : ""}`}
          onClick={() => onChange(value === opt ? "" : opt)}
        >
          {opt}
        </button>
      ))}
    </div>
  );
}

function MultiChoicePicker({ value = "", onChange }) {
  const selected = new Set(value.toUpperCase().split("").filter(Boolean));
  function toggle(opt) {
    const newSet = new Set(selected);
    if (newSet.has(opt)) newSet.delete(opt);
    else newSet.add(opt);
    const sorted = MULTI_CHOICE_OPTIONS.filter((o) => newSet.has(o)).join("");
    onChange(sorted);
  }
  return (
    <div className="choice-buttons">
      {MULTI_CHOICE_OPTIONS.map((opt) => (
        <button
          key={opt}
          type="button"
          className={`choice-btn ${selected.has(opt) ? "multi-selected" : ""}`}
          onClick={() => toggle(opt)}
        >
          {opt}
        </button>
      ))}
    </div>
  );
}

function WrittenPicker({ value, onChange, subCount }) {
  const max = subCount ?? 1;
  return (
    <div className="flex gap-2" style={{ flexWrap: "wrap", alignItems: "center" }}>
      <span className="text-xs text-muted">To'g'ri bandlar soni:</span>
      <div className="number-input-group">
        <button
          type="button"
          className="num-btn"
          onClick={() => onChange(Math.max(0, (value || 0) - 1))}
          disabled={(value || 0) <= 0}
        >
          −
        </button>
        <input
          type="number"
          value={value ?? 0}
          min={0}
          max={max}
          onChange={(e) => {
            const v = parseInt(e.target.value);
            if (!isNaN(v)) onChange(Math.max(0, Math.min(max, v)));
          }}
        />
        <button
          type="button"
          className="num-btn"
          onClick={() => onChange(Math.min(max, (value || 0) + 1))}
          disabled={(value || 0) >= max}
        >
          +
        </button>
      </div>
      <span className="text-xs text-muted">/ {max}</span>
    </div>
  );
}

// ─── Student Answer Form (modal-like panel) ───────────────
function StudentAnswerForm({ questions, answerKeyMap, test, onClose, onSubmit, editStudent }) {
  const [name, setName] = useState(editStudent?.full_name || "");
  const [code, setCode] = useState(editStudent?.student_code || "");
  const [studentAnswers, setStudentAnswers] = useState(() => {
    if (editStudent?.answers) return editStudent.answers;
    const init = {};
    questions.forEach((q) => {
      if (q.questionType === "written") init[q.orderNumber] = { written_correct_count: 0 };
    });
    return init;
  });
  const [errors, setErrors] = useState({});

  function setAnswer(orderNumber, data) {
    setStudentAnswers((prev) => ({ ...prev, [orderNumber]: data }));
  }

  function validate() {
    const errs = {};
    if (!name.trim()) errs.name = "Ism kiritilishi shart";
    if (!code.trim()) errs.code = "Kod kiritilishi shart";
    return errs;
  }

  function handleSubmit() {
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }

    const answers = questions.map((q) => {
      const a = studentAnswers[q.orderNumber] || {};
      if (q.questionType === "single_choice") {
        return { order_number: q.orderNumber, given_answer: a.given_answer || "" };
      }
      if (q.questionType === "multi_choice") {
        return { order_number: q.orderNumber, given_answer: a.given_answer || "" };
      }
      if (q.questionType === "written") {
        const is75Ball =
          (test.subject === "Ona tili" ||
            test.subject === "Adabiyot") &&
          q.orderNumber === 45;

        return {
          order_number: q.orderNumber,
          written_correct_count: is75Ball
            ? (a.written_score ?? 0)
            : (a.written_correct_count ?? 0),
        };
      }

      return { order_number: q.orderNumber };
    });

    onSubmit({ full_name: name.trim(), student_code: code.trim(), answers });
  }

  const singleQs = questions.filter((q) => q.questionType === "single_choice");
  const multiQs = questions.filter((q) => q.questionType === "multi_choice");
  const writtenQs = questions.filter((q) => q.questionType === "written");


  return (
    <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div
        className="modal"
        style={{ maxWidth: 800, maxHeight: "90vh", overflowY: "auto", width: "95%" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <div className="modal-title">👤 Talaba Javoblari</div>
          <button
            className="btn btn-ghost btn-icon"
            onClick={onClose}
            id="btn-close-student-form"
          >
            ✕
          </button>
        </div>

        {/* Talaba ma'lumotlari */}
        <div className="grid-2 mb-6" style={{ gap: "var(--space-4)" }}>
          <div className="form-group">
            <label className="form-label">To'liq Ism</label>
            <input
              className="form-input"
              placeholder="Ali Valiyev"
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoFocus
              id="student-name-input"
            />
            {errors.name && <div className="form-error">{errors.name}</div>}
          </div>
          <div className="form-group">
            <label className="form-label">Talaba Kodi</label>
            <input
              className="form-input"
              placeholder="A001"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              id="student-code-input"
            />
            {errors.code && <div className="form-error">{errors.code}</div>}
          </div>
        </div>

        <div className="divider" />

        {/* Oddiy test */}
        <div className="mb-6">
          <div className="font-bold mb-4" style={{ fontSize: 13, color: "var(--text-secondary)" }}>
            📝 ODDIY TEST (1–32)
          </div>
          <div className="answer-sheet">
            {singleQs.map((q) => {
              const a = studentAnswers[q.orderNumber] || {};
              return (
                <div key={q.orderNumber} className={`answer-row ${a.given_answer ? "is-answered" : ""}`}>
                  <div className="flex" style={{ alignItems: "center", gap: "var(--space-2)", marginBottom: "var(--space-2)" }}>
                    <span className="question-number" style={{ width: 26, height: 26, fontSize: 11 }}>
                      {q.orderNumber}
                    </span>
                  </div>
                  <SingleChoicePicker
                    value={a.given_answer || ""}
                    onChange={(v) => setAnswer(q.orderNumber, { given_answer: v })}
                  />
                </div>
              );
            })}
          </div>
        </div>

        {/* Kengaytirilgan */}
        {multiQs.length > 0 && (
          <div className="mb-6">
            <div className="font-bold mb-4" style={{ fontSize: 13, color: "var(--text-secondary)" }}>
              🔢 KENGAYTIRILGAN (33–35)
            </div>
            <div className="answer-sheet" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(280px,1fr))" }}>
              {multiQs.map((q) => {
                const a = studentAnswers[q.orderNumber] || {};
                return (
                  <div key={q.orderNumber} className={`answer-row ${a.given_answer ? "is-answered" : ""}`}>
                    <div className="flex" style={{ alignItems: "center", gap: "var(--space-2)", marginBottom: "var(--space-2)" }}>
                      <span className="question-number" style={{ width: 26, height: 26, fontSize: 11 }}>
                        {q.orderNumber}
                      </span>
                    </div>
                    <MultiChoicePicker
                      value={a.given_answer || ""}
                      onChange={(v) => setAnswer(q.orderNumber, { given_answer: v })}
                    />
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Yozma */}
        {writtenQs.length > 0 && (
          <div className="mb-6">
            <div className="font-bold mb-4" style={{ fontSize: 13, color: "var(--text-secondary)" }}>
              ✍️ YOZMA SAVOLLAR
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px,1fr))", gap: "var(--space-3)" }}>
              {writtenQs.map((q) => {
                const a = studentAnswers[q.orderNumber] || {};
                const keyData = answerKeyMap?.[q.orderNumber];
                const maxCount = keyData?.sub_question_count ?? 1;
                return (
                  <div key={q.orderNumber} className="answer-row">
                    <div className="flex" style={{ alignItems: "center", gap: "var(--space-2)", marginBottom: "var(--space-2)" }}>
                      <span className="question-number" style={{ width: 26, height: 26, fontSize: 11 }}>
                        {q.orderNumber}
                      </span>
                      <span className="text-xs text-muted">
                        {q.orderNumber}-savol ({maxCount} band)
                      </span>
                    </div>
                    {q.orderNumber === 45 &&
                      (test.subject === "Ona tili" ||
                        test.subject === "Adabiyot") ? (

                      <div className="number-input-group">
                        <input
                          type="number"
                          min={0}
                          max={75}
                          value={a.written_score ?? 0}
                          onChange={(e) =>
                            setAnswer(q.orderNumber, {
                              written_score: Number(e.target.value),
                            })
                          }
                        />
                      </div>

                    ) : (

                      <WrittenPicker
                        value={a.written_correct_count ?? 0}
                        subCount={maxCount}
                        onChange={(v) =>
                          setAnswer(q.orderNumber, {
                            written_correct_count: v,
                          })
                        }
                      />

                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}



        <div className="divider" />

        <div className="flex gap-3" style={{ justifyContent: "flex-end" }}>
          <button className="btn btn-secondary" onClick={onClose} id="btn-cancel-student">
            Bekor qilish
          </button>
          <button className="btn btn-primary" onClick={handleSubmit} id="btn-save-student">
            ✅ Saqlash
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ─────────────────────────────────────────────
export default function StudentsPage() {
  const { testId } = useParams();
  const navigate = useNavigate();
  const { addToast } = useToast();

  const [test, setTest] = useState(null);
  const [loading, setLoading] = useState(true);
  const [questions, setQuestions] = useState([]);
  const [answerKeyMap, setAnswerKeyMap] = useState({});
  const [submittedStudents, setSubmittedStudents] = useState([]); // [{full_name, student_id, raw_score}]
  const [showForm, setShowForm] = useState(false);
  const [finalizing, setFinalizing] = useState(false);
  const [confirmFinalize, setConfirmFinalize] = useState(false);

  useEffect(() => {
    loadData();
  }, [testId]);

  async function loadData() {
    try {
      setLoading(true);
      const t = await api.getTest(testId);
      setTest(t);
      const subjectKey = t.subject?.toLowerCase().replace(/ /g, "_") || t.subject;
      const qs = buildQuestionsForSubject(subjectKey);
      setQuestions(qs);

      // Javob kalitini olish (sub_question_count uchun kerak)
      try {
        const ak = await api.getAnswerKey(testId);
        if (Array.isArray(ak)) {
          const map = {};
          ak.forEach((q) => { map[q.order_number] = q; });
          setAnswerKeyMap(map);
        }
      } catch (_) {
        // Mavjud bo'lmasa davom etamiz
      }
    } catch (err) {
      addToast("Test yuklanmadi: " + err.message, "error");
    } finally {
      setLoading(false);
    }
  }

  async function handleStudentSubmit(studentData) {
    try {
      const res = await api.submitStudents(testId, [studentData]);
      const result = Array.isArray(res) ? res[0] : res;
      setSubmittedStudents((prev) => [
        ...prev,
        {
          full_name: studentData.full_name,
          student_code: studentData.student_code,
          student_id: result?.student_id,
          raw_score: result?.raw_score,
          total_items: result?.total_items,
        },
      ]);
      addToast(`✅ ${studentData.full_name} qo'shildi`, "success");
      setShowForm(false);
    } catch (err) {
      addToast("Xatolik: " + err.message, "error");
    }
  }

  async function handleFinalize() {
    setFinalizing(true);
    try {
      await api.finalizeTest(testId);
      addToast("🎉 Test yakunlandi! Natijalar tayyorlandi.", "success");
      navigate(`/results/${testId}`);
    } catch (err) {
      addToast("Yakunlashda xatolik: " + err.message, "error");
    } finally {
      setFinalizing(false);
      setConfirmFinalize(false);
    }
  }

  function getInitials(name) {
    return name
      .split(" ")
      .map((w) => w[0])
      .slice(0, 2)
      .join("")
      .toUpperCase();
  }

  if (loading) {
    return (
      <div className="loading-container" style={{ minHeight: "100vh" }}>
        <div className="spinner" />
        <div className="loading-text">Ma'lumotlar yuklanmoqda...</div>
      </div>
    );
  }

  return (
    <div className="fade-in">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1>Talabalar</h1>
          <div className="breadcrumb">
            <span onClick={() => navigate("/")} style={{ cursor: "pointer" }}>
              Dashboard
            </span>{" "}
            / {test?.title}
          </div>
        </div>
        <div className="header-actions">
          <span
            style={{
              fontSize: 13,
              color: "var(--text-muted)",
              background: "var(--bg-card)",
              border: "1px solid var(--border-subtle)",
              borderRadius: "var(--radius-md)",
              padding: "6px 14px",
            }}
          >
            👥 {submittedStudents.length} talaba
          </span>
          <button
            className="btn btn-secondary"
            onClick={() => navigate(`/answer-key/${testId}`)}
            id="btn-back-answer-key"
          >
            ← Javob Kaliti
          </button>
          <button
            className="btn btn-primary"
            onClick={() => setShowForm(true)}
            id="btn-add-student"
          >
            ➕ Talaba Qo'shish
          </button>
        </div>
      </div>

      <div className="page-body">
        <div className="grid-2" style={{ gap: "var(--space-8)", alignItems: "start" }}>
          {/* Students list */}
          <div>
            <div className="section-header mb-4">
              <div className="section-title" style={{ fontSize: 16 }}>
                Kiritilgan Talabalar
              </div>
            </div>

            {submittedStudents.length === 0 ? (
              <div className="empty-state" style={{ minHeight: 200 }}>
                <div className="empty-icon">👥</div>
                <div className="empty-title">Hali talaba yo'q</div>
                <div className="empty-desc">
                  "Talaba qo'shish" tugmasini bosib, birinchi talabani kiriting
                </div>
              </div>
            ) : (
              <div className="student-list">
                {submittedStudents.map((s, idx) => (
                  <div key={idx} className="student-item">
                    <div className="student-avatar">{getInitials(s.full_name)}</div>
                    <div className="student-info">
                      <div className="student-name">{s.full_name}</div>
                      <div className="student-code">{s.student_code}</div>
                    </div>
                    {s.raw_score !== undefined && (
                      <div className="student-score">
                        {s.raw_score}/{s.total_items || "—"}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Finalize section */}
          <div>
            <div className="finalize-box">
              <div className="finalize-icon">🔒</div>
              <div className="finalize-title">Testni Yakunlash</div>
              <div className="finalize-desc">
                Barcha talaba javoblari kiritilgandan so'ng, testni yakunlang.
                Rasch IRT algoritmi orqali natijalari hisoblanadi.
              </div>

              {submittedStudents.length > 0 && (
                <div className="highlight-box mb-6" style={{ textAlign: "left" }}>
                  <div className="flex-between mb-2">
                    <span className="text-sm text-muted">Jami talabalar:</span>
                    <span className="font-bold text-accent">
                      {submittedStudents.length}
                    </span>
                  </div>
                  <div className="flex-between">
                    <span className="text-sm text-muted">Savollar soni:</span>
                    <span className="font-bold text-accent">
                      {questions.length}
                    </span>
                  </div>
                </div>
              )}

              <button
                className="btn btn-primary btn-lg w-full"
                disabled={submittedStudents.length === 0 || finalizing}
                onClick={() => setConfirmFinalize(true)}
                id="btn-finalize"
              >
                {finalizing ? (
                  <>
                    <span className="spinner" style={{ width: 18, height: 18, borderWidth: 2 }} />
                    Hisoblanmoqda...
                  </>
                ) : (
                  <>🎓 Testni Yakunlash</>
                )}
              </button>

              {submittedStudents.length === 0 && (
                <div className="text-xs text-muted mt-3">
                  Kamida 1 ta talaba kiritilishi shart
                </div>
              )}
            </div>

            {/* Tips */}
            <div className="card mt-4">
              <div className="font-bold text-sm mb-3" style={{ color: "var(--text-primary)" }}>
                💡 Maslahat
              </div>
              <div className="flex-col gap-2">
                {[
                  "Har bir talabani alohida kiriting",
                  "Yozma savollarda nechta band to'g'ri — shuni kiriting",
                  "Insho bahosi 0 dan max gacha bo'ladi",
                  "Barcha talabalar kiritilgandan keyin yakunlang",
                ].map((tip, i) => (
                  <div key={i} className="flex gap-2" style={{ alignItems: "flex-start" }}>
                    <span style={{ color: "var(--accent-primary)", flexShrink: 0, marginTop: 2 }}>
                      ●
                    </span>
                    <span className="text-sm text-muted">{tip}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Student Form Modal */}
      {showForm && (
        <StudentAnswerForm
          questions={questions}
          answerKeyMap={answerKeyMap}
          test={test}
          onClose={() => setShowForm(false)}
          onSubmit={handleStudentSubmit}
        />
      )}

      {/* Confirm Finalize Modal */}
      {confirmFinalize && (
        <div className="modal-overlay">
          <div className="modal" style={{ maxWidth: 440 }}>
            <div className="modal-header">
              <div className="modal-title">⚠️ Testni Yakunlash</div>
            </div>
            <p style={{ fontSize: 14, color: "var(--text-secondary)", marginBottom: "var(--space-6)", lineHeight: 1.7 }}>
              <strong style={{ color: "var(--text-primary)" }}>
                {submittedStudents.length} ta talaba
              </strong>{" "}
              uchun natijalari hisoblanadi. Bu amalni bekor qilib bo'lmaydi.
              Davom etasizmi?
            </p>
            <div className="flex gap-3" style={{ justifyContent: "flex-end" }}>
              <button
                className="btn btn-secondary"
                onClick={() => setConfirmFinalize(false)}
                id="btn-cancel-finalize"
              >
                Bekor qilish
              </button>
              <button
                className="btn btn-primary"
                onClick={handleFinalize}
                disabled={finalizing}
                id="btn-confirm-finalize"
              >
                {finalizing ? "Hisoblanmoqda..." : "✅ Ha, Yakunlash"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
