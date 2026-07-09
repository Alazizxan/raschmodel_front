// Fan konfiguratsiyasi
export const SUBJECT_RULES = {
  matematika: {
    label: "Matematika",
    single_choice: [1, 32],
    multi_choice: [33, 35],
    written: [36, 45],
    essay: null,
    totalQuestions: 45,
  },
  fizika: {
    label: "Fizika",
    single_choice: [1, 32],
    multi_choice: [33, 35],
    written: [36, 45],
    essay: null,
    totalQuestions: 45,
  },
  kimyo: {
    label: "Kimyo",
    single_choice: [1, 32],
    multi_choice: [33, 35],
    written: [36, 45],
    essay: null,
    totalQuestions: 45,
  },
  ona_tili: {
    label: "Ona tili",
    single_choice: [1, 32],
    multi_choice: [33, 35],
    written: [36, 45],
    totalQuestions: 45,
  },
  adabiyot: {
    label: "Adabiyot",
    single_choice: [1, 32],
    multi_choice: [33, 35],
    written: [36, 45],
    totalQuestions: 45,
  },
  biologiya: {
    label: "Biologiya",
    single_choice: [1, 32],
    multi_choice: [33, 35],
    written: [36, 45],
    essay: null,
    totalQuestions: 45,
  },
  tarix: {
    label: "Tarix",
    single_choice: [1, 32],
    multi_choice: [33, 35],
    written: [36, 45],
    essay: null,
    totalQuestions: 45,
  },
  ingliz_tili: {
    label: "Ingliz tili",
    single_choice: [1, 32],
    multi_choice: [33, 35],
    written: [36, 45],
    essay: null,
    totalQuestions: 45,
  },
  geografiya: {
    label: "Geografiya",
    single_choice: [1, 32],
    multi_choice: [33, 35],
    written: [36, 45],
    essay: null,
    totalQuestions: 45,
  },
};

/**
 * Savol raqami bo'yicha turning turini aniqlash
 * @param {string} subjectKey - fan kaliti (masalan: "matematika")
 * @param {number} orderNumber - savol raqami
 * @returns {"single_choice"|"multi_choice"|"written"|"essay"}
 */
export function getQuestionType(subjectKey, orderNumber) {
  const rules = SUBJECT_RULES[subjectKey];
  if (!rules) return "single_choice";

  const n = orderNumber;

  if (rules.written && n >= rules.written[0] && n <= rules.written[1]) return "written";
  if (rules.multi_choice && n >= rules.multi_choice[0] && n <= rules.multi_choice[1]) return "multi_choice";
  if (rules.single_choice && n >= rules.single_choice[0] && n <= rules.single_choice[1]) return "single_choice";

  return "single_choice";
}

/**
 * Fan uchun barcha savollar ro'yxatini yaratish
 * @param {string} subjectKey
 * @returns {Array<{orderNumber: number, questionType: string}>}
 */
export function buildQuestionsForSubject(subjectKey) {
  const rules = SUBJECT_RULES[subjectKey];
  if (!rules) return [];

  const questions = [];
  for (let i = 1; i <= rules.totalQuestions; i++) {
    questions.push({
      orderNumber: i,
      questionType: getQuestionType(subjectKey, i),
    });
  }
  return questions;
}

export const SUBJECTS_LIST = Object.entries(SUBJECT_RULES).map(([key, val]) => ({
  key,
  label: val.label,
}));

export const MULTI_CHOICE_OPTIONS = ["A", "B", "C", "D", "E", "F"];
export const SINGLE_CHOICE_OPTIONS = ["A", "B", "C", "D"];

export const GRADE_COLORS = {
  A: "#22c55e",
  B: "#3b82f6",
  C: "#f59e0b",
  D: "#ef4444",
  F: "#6b7280",
};
