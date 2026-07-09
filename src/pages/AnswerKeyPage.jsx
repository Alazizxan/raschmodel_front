import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { api } from "../api/client.js";
import { useToast } from "../App.jsx";
import {
  SUBJECT_RULES,
  buildQuestionsForSubject,
  SINGLE_CHOICE_OPTIONS,
  MULTI_CHOICE_OPTIONS,
} from "../config/subjects.js";

// ─── Single Choice Selector ───────────────────────────────
function SingleChoiceSelector({ value, onChange }) {
  return (
    <div className="choice-buttons">
      {SINGLE_CHOICE_OPTIONS.map((opt) => (
        <button
          key={opt}
          type="button"
          className={`choice-btn ${value === opt ? "selected" : ""}`}
          onClick={() => onChange(value === opt ? "" : opt)}
          id={`single-${opt}`}
        >
          {opt}
        </button>
      ))}
    </div>
  );
}

// ─── Multi Choice Selector ────────────────────────────────
function MultiChoiceSelector({ value = "", onChange }) {
  const selected = new Set(value.toUpperCase().split("").filter(Boolean));

  function toggle(opt) {
    const newSet = new Set(selected);
    if (newSet.has(opt)) newSet.delete(opt);
    else newSet.add(opt);
    // Harflarni tartiblash
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
          id={`multi-${opt}`}
        >
          {opt}
        </button>
      ))}
    </div>
  );
}

// ─── Number Stepper ───────────────────────────────────────
function NumberStepper({ value, onChange, min = 0, max = 10, label }) {
  return (
    <div className="flex-col gap-2">
      {label && <span className="text-xs text-muted">{label}</span>}
      <div className="number-input-group">
        <button
          type="button"
          className="num-btn"
          onClick={() => onChange(Math.max(min, (value || 0) - 1))}
          disabled={(value || 0) <= min}
        >
          −
        </button>
        <input
          type="number"
          value={value ?? ""}
          min={min}
          max={max}
          onChange={(e) => {
            const v = parseInt(e.target.value);
            if (!isNaN(v)) onChange(Math.max(min, Math.min(max, v)));
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
    </div>
  );
}

// ─── Question Card ─────────────────────────────────────────
function QuestionCard({ question, answerData, onChange }) {
  const { orderNumber, questionType } = question;
  const isFilled = Boolean(
    questionType === "single_choice"
      ? answerData?.correct_answer
      : questionType === "multi_choice"
        ? answerData?.correct_answer
        : questionType === "written"
          ? answerData?.sub_question_count !== undefined
          : questionType === "written"
            ? answerData?.sub_question_count !== undefined
            : false
  );

  const typeLabels = {
    single_choice: { label: "Oddiy", cls: "type-single" },
    multi_choice: { label: "Kengaytirilgan", cls: "type-multi" },
    written: { label: "Yozma", cls: "type-written" },

  };
  const typeInfo = typeLabels[questionType] || typeLabels.single_choice;

  return (
    <div className={`question-card ${isFilled ? "is-filled" : ""}`}>
      <div className="question-header">
        <div className="question-number">{orderNumber}</div>
        <span className={`question-type-badge ${typeInfo.cls}`}>
          {typeInfo.label}
        </span>
        {isFilled && (
          <span style={{ marginLeft: "auto", color: "var(--accent-green)", fontSize: 14 }}>
            ✓
          </span>
        )}
      </div>

      {questionType === "single_choice" && (
        <SingleChoiceSelector
          value={answerData?.correct_answer || ""}
          onChange={(v) => onChange({ ...answerData, correct_answer: v })}
        />
      )}

      {questionType === "multi_choice" && (
        <MultiChoiceSelector
          value={answerData?.correct_answer || ""}
          onChange={(v) => onChange({ ...answerData, correct_answer: v })}
        />
      )}

      {questionType === "written" && (
        <NumberStepper
          value={answerData?.sub_question_count ?? 1}
          min={1}
          max={10}
          label="Kichik savollar soni"
          onChange={(v) => onChange({ ...answerData, sub_question_count: v })}
        />
      )}


    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────
export default function AnswerKeyPage() {
  const { testId } = useParams();
  const navigate = useNavigate();
  const { addToast } = useToast();

  const [test, setTest] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [answers, setAnswers] = useState({}); // { orderNumber: answerData }
  const [questions, setQuestions] = useState([]);

  useEffect(() => {
    loadTest();
  }, [testId]);

  async function loadTest() {
    try {
      setLoading(true);
      const t = await api.getTest(testId);
      setTest(t);
      const qs = buildQuestionsForSubject(
        t.subject?.toLowerCase().replace(" ", "_") || t.subject
      );
      setQuestions(qs);

      // Initializatsiya — written uchun default sub_question_count=1
      const initAnswers = {};
      qs.forEach((q) => {
        if (q.questionType === "written") {
          initAnswers[q.orderNumber] = { sub_question_count: 1 };
        }
      });
      setAnswers(initAnswers);
    } catch (err) {
      addToast("Test yuklanmadi: " + err.message, "error");
    } finally {
      setLoading(false);
    }
  }

  function handleAnswerChange(orderNumber, data) {
    setAnswers((prev) => ({ ...prev, [orderNumber]: data }));
  }

  // Progress hisoblash
  const filled = questions.filter((q) => {
    const a = answers[q.orderNumber];
    if (!a) return false;
    if (q.questionType === "single_choice") return Boolean(a.correct_answer);
    if (q.questionType === "multi_choice") return Boolean(a.correct_answer);
    if (q.questionType === "written") return a.sub_question_count !== undefined;
    if (q.questionType === "essay") return Boolean(a.max_score);
    return false;
  }).length;
  const progress = questions.length ? Math.round((filled / questions.length) * 100) : 0;

  // Faqat single/multi validation
  const mandatoryFilled = questions
    .filter((q) => ["single_choice", "multi_choice"].includes(q.questionType))
    .every((q) => Boolean(answers[q.orderNumber]?.correct_answer));

  async function handleSubmit() {
    if (!mandatoryFilled) {
      addToast(
        "Barcha oddiy va kengaytirilgan savollarga javob kiriting!",
        "warning"
      );
      return;
    }
    setSubmitting(true);
    try {
      const payload = questions.map((q) => {
        const a = answers[q.orderNumber] || {};
        const base = {
          order_number: q.orderNumber,
          question_type: q.questionType,
        };
        if (q.questionType === "single_choice" || q.questionType === "multi_choice") {
          return { ...base, correct_answer: a.correct_answer };
        }
        if (q.questionType === "written") {

          const isEssay =
            (test.subject === "Ona tili" ||
              test.subject === "Adabiyot") &&
            q.orderNumber === 45;

          return {
            ...base,
            sub_question_count: a.sub_question_count ?? 1,
            max_score: isEssay ? 75 : 1,
          };
        }
        return base;
      });


      console.log(
        JSON.stringify(
          {
            test_id: Number(testId),
            questions: payload,
          },
          null,
          2
        )
      );

      await api.submitAnswerKey(testId, payload);
      addToast("✅ Javob kaliti saqlandi!", "success");
      navigate(`/students/${testId}`);
    } catch (err) {
      addToast("Xatolik: " + err.message, "error");
    } finally {
      setSubmitting(false);
    }
  }

  // Savol turlariga bo'lish
  const singleQuestions = questions.filter((q) => q.questionType === "single_choice");
  const multiQuestions = questions.filter((q) => q.questionType === "multi_choice");
  const writtenQuestions = questions.filter((q) => q.questionType === "written");


  if (loading) {
    return (
      <div className="loading-container" style={{ minHeight: "100vh" }}>
        <div className="spinner" />
        <div className="loading-text">Test yuklanmoqda...</div>
      </div>
    );
  }

  return (
    <div className="fade-in">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1>Javob Kaliti</h1>
          <div className="breadcrumb">
            <span onClick={() => navigate("/")} style={{ cursor: "pointer" }}>
              Dashboard
            </span>
            {" / "}
            {test?.title || `Test #${testId}`}
          </div>
        </div>
        <div className="header-actions">
          <div
            style={{
              fontSize: 13,
              color: "var(--text-muted)",
              background: "var(--bg-card)",
              border: "1px solid var(--border-subtle)",
              borderRadius: "var(--radius-md)",
              padding: "6px 14px",
            }}
          >
            {filled} / {questions.length} to'ldirildi
          </div>
          <button
            className="btn btn-primary"
            onClick={handleSubmit}
            disabled={submitting || !mandatoryFilled}
            id="btn-save-answer-key"
          >
            {submitting ? (
              <>
                <span className="spinner" style={{ width: 16, height: 16, borderWidth: 2 }} />
                Saqlanmoqda...
              </>
            ) : (
              <>➡️ Talabalar</>
            )}
          </button>
        </div>
      </div>

      <div className="page-body">
        {/* Progress */}
        <div className="card mb-6">
          <div className="progress-info">
            <span className="progress-label">To'ldirish jarayoni</span>
            <span className="progress-value">{progress}%</span>
          </div>
          <div className="progress-bar">
            <div className="progress-fill" style={{ width: `${progress}%` }} />
          </div>
          <div className="flex gap-4 mt-4" style={{ flexWrap: "wrap" }}>
            {[
              {
                label: "Oddiy",
                count: singleQuestions.length,
                cls: "type-single",
              },
              {
                label: "Kengaytirilgan",
                count: multiQuestions.length,
                cls: "type-multi",
              },
              {
                label: "Yozma",
                count: writtenQuestions.length,
                cls: "type-written",
              },
            ].map((item) => (
              <div
                key={item.label}
                className="flex gap-2"
                style={{ alignItems: "center" }}
              >
                <span className={`question-type-badge ${item.cls}`}>
                  {item.label}
                </span>
                <span className="text-sm text-muted">
                  {item.count} ta
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Oddiy test savollar */}
        {singleQuestions.length > 0 && (
          <div className="mb-8">
            <div className="section-header mb-4">
              <div>
                <div className="section-title" style={{ fontSize: 16 }}>
                  📝 Oddiy Test (1–32)
                </div>
                <div className="section-subtitle">A/B/C/D variantlardan birini tanlang</div>
              </div>
            </div>
            <div className="answer-key-grid">
              {singleQuestions.map((q) => (
                <QuestionCard
                  key={q.orderNumber}
                  question={q}
                  answerData={answers[q.orderNumber]}
                  onChange={(data) => handleAnswerChange(q.orderNumber, data)}
                />
              ))}
            </div>
          </div>
        )}

        {/* Kengaytirilgan */}
        {multiQuestions.length > 0 && (
          <div className="mb-8">
            <div className="section-header mb-4">
              <div>
                <div className="section-title" style={{ fontSize: 16 }}>
                  🔢 Kengaytirilgan (33–35)
                </div>
                <div className="section-subtitle">
                  Bir nechta variant tanlash mumkin (AB, ABC, BDF...)
                </div>
              </div>
            </div>
            <div className="answer-key-grid">
              {multiQuestions.map((q) => (
                <QuestionCard
                  key={q.orderNumber}
                  question={q}
                  answerData={answers[q.orderNumber]}
                  onChange={(data) => handleAnswerChange(q.orderNumber, data)}
                />
              ))}
            </div>
          </div>
        )}

        {/* Yozma */}
        {writtenQuestions.length > 0 && (
          <div className="mb-8">
            <div className="section-header mb-4">
              <div>
                <div className="section-title" style={{ fontSize: 16 }}>
                  ✍️ Yozma Savollar
                </div>
                <div className="section-subtitle">
                  {test?.subject === "Ona tili" || test?.subject === "Adabiyot"
                    ? "36–44 savollar uchun kichik savollar sonini kiriting. 45-savol avtomatik 75 ballik yozma savol hisoblanadi."
                    : "Har bir yozma savol uchun kichik savollar sonini kiriting."}
                </div>
              </div>
            </div>
            <div className="answer-key-grid">
              {writtenQuestions.map((q) => {
                const isEssay =
                  (test?.subject === "Ona tili" ||
                    test?.subject === "Adabiyot") &&
                  q.orderNumber === 45;

                if (isEssay) {
                  return (
                    <div key={q.orderNumber} className="question-card">
                      <div className="question-header">
                        <div className="question-number">45</div>

                        <span className="question-type-badge type-written">
                          75 ballik yozma
                        </span>
                      </div>

                      <div style={{ marginTop: 16 }}>
                        Bu savol avtomatik <b>75 ball</b> bilan saqlanadi.
                        Javob kaliti kiritilmaydi.
                      </div>
                    </div>
                  );
                }

                return (
                  <QuestionCard
                    key={q.orderNumber}
                    question={q}
                    answerData={answers[q.orderNumber]}
                    onChange={(data) => handleAnswerChange(q.orderNumber, data)}
                  />
                );
              })}
            </div>
          </div>
        )}



        {/* Save bar */}
        <div
          style={{
            position: "sticky",
            bottom: "var(--space-6)",
            display: "flex",
            justifyContent: "flex-end",
          }}
        >
          <div className="card flex gap-4" style={{ padding: "var(--space-4) var(--space-6)", flexDirection: "row", alignItems: "center" }}>
            <span className="text-sm text-muted">
              {filled}/{questions.length} savol to'ldirildi
            </span>
            <button
              className="btn btn-secondary"
              onClick={() => navigate("/")}
              id="btn-back-dashboard"
            >
              ← Dashboard
            </button>
            <button
              className="btn btn-primary"
              onClick={handleSubmit}
              disabled={submitting || !mandatoryFilled}
              id="btn-save-bottom"
            >
              {submitting ? "Saqlanmoqda..." : "✅ Saqlash va Keyingi →"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
