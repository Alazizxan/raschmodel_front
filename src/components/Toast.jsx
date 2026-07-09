const ICONS = {
  success: "✅",
  error: "❌",
  info: "ℹ️",
  warning: "⚠️",
};

export default function Toast({ toasts, onRemove }) {
  if (!toasts.length) return null;

  return (
    <div className="toast-container">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={`toast toast-${t.type}`}
          onClick={() => onRemove(t.id)}
          style={{ cursor: "pointer" }}
        >
          <span style={{ fontSize: 18, flexShrink: 0 }}>{ICONS[t.type] || "ℹ️"}</span>
          <span style={{ flex: 1, fontSize: 14, color: "var(--text-primary)" }}>
            {t.message}
          </span>
          <button
            onClick={(e) => { e.stopPropagation(); onRemove(t.id); }}
            style={{
              background: "none",
              border: "none",
              color: "var(--text-muted)",
              cursor: "pointer",
              fontSize: 16,
              lineHeight: 1,
              padding: 0,
            }}
          >
            ×
          </button>
        </div>
      ))}
    </div>
  );
}
