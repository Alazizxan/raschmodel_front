// API Client — barcha backend chaqiruvlari
// Vite proxy ishlashi uchun BASE_URL default holatda bo'sh bo'ladi (import.meta.env.VITE_API_URL bo'lmasa)
const BASE_URL = import.meta?.env?.VITE_API_URL || "";

async function request(method, path, body = null) {
  const opts = {
    method,
    headers: { "Content-Type": "application/json" },
  };
  if (body) opts.body = JSON.stringify(body);

  const res = await fetch(`${BASE_URL}${path}`, opts);
  if (!res.ok) {
    let errMsg = `HTTP ${res.status}`;
    try {
      const data = await res.json();
      errMsg = data.detail || data.message || errMsg;
    } catch (_) {}
    throw new Error(errMsg);
  }
  // 204 No Content
  if (res.status === 204) return null;
  return res.json();
}

// ─── Tests ──────────────────────────────────────────────
export const api = {
  // GET /tests
  getTests: () => request("GET", "/tests"),

  // POST /tests
  createTest: (title, subject) =>
    request("POST", "/tests", { title, subject }),

  // GET /tests/:id
  getTest: (id) => request("GET", `/tests/${id}`),

  // POST /tests/:id/answer-key
  submitAnswerKey: (testId, questions) =>
    request("POST", `/tests/${testId}/answer-key`, {
      test_id: parseInt(testId, 10),
      questions,
    }),

  // GET /tests/:id/answer-key  (mavjud bo'lsa)
  getAnswerKey: (testId) => request("GET", `/tests/${testId}/answer-key`),

  // POST /students/submit
  submitStudents: (testId, students) =>
    request("POST", "/students/submit", { test_id: parseInt(testId, 10), students }),

  // POST /tests/:id/finalize
  finalizeTest: (testId) =>
    request("POST", `/tests/${testId}/finalize`, {}),

  // GET /tests/:id/results
  getResults: (testId) => request("GET", `/tests/${testId}/results`),
};

export default api;
