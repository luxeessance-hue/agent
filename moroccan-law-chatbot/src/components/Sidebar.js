import React from "react";

const SUBJECTS = [
  { id: "entrepreneurship", emoji: "💼", label: "Entrepreneurship", darija: "ثقافة مقاولاتية", fr: "Culture Entrepreneuriale" },
  { id: "criminology",      emoji: "⚖️", label: "Criminology",      darija: "علم الإجرام والقانون", fr: "Criminologie & Droit Pénal" },
  { id: "real-estate",      emoji: "🏠", label: "Real Estate",      darija: "القانون العقاري",        fr: "Droit Immobilier" },
  { id: "human-rights",     emoji: "🕊️", label: "Human Rights",     darija: "حقوق الإنسان",          fr: "Droits de l'Homme" },
  { id: "company-law",      emoji: "🏢", label: "Company Law",      darija: "قانون الشركات",          fr: "Droit des Sociétés" },
];

const LAW_MODES = [
  { id: "quiz",  label: "ختبرني / Quiz",       emoji: "🎯", prompt: "ختبرني" },
  { id: "fiche", label: "فيش / Fiche",         emoji: "📋", prompt: "دير ليا فيش" },
  { id: "plan",  label: "مراجعة / Révision",   emoji: "📅", prompt: "كيفاش نراجع" },
];

const EXAM_TYPES = [
  { id: "grammar",    label: "Grammar",    emoji: "📝", prompt: "generate exam grammar" },
  { id: "writing",    label: "Writing",    emoji: "✍️", prompt: "generate exam writing" },
  { id: "vocabulary", label: "Vocabulary", emoji: "📖", prompt: "generate exam vocabulary" },
  { id: "mixed",      label: "Mixed",      emoji: "🎲", prompt: "generate exam mixed" },
];

const LEVELS = [
  { id: "B1", label: "B1", emoji: "🟡" },
  { id: "B2", label: "B2", emoji: "🟠" },
  { id: "C1", label: "C1", emoji: "🔴" },
];

export default function Sidebar({
  selectedChatbot, onSelectChatbot,
  selectedSubject, onSelectSubject,
  selectedLevel, onSelectLevel,
  onQuickMode, onNewChat, isOpen,
}) {
  return (
    <aside className={`sidebar${isOpen ? " open" : ""}`}>
      {/* ── Header ── */}
      <div className="sidebar-header">
        <div className="logo">
          <span className="logo-flag">🇲🇦</span>
          <div>
            <div className="logo-title">Study Agent</div>
            <div className="logo-sub">مساعدك الدراسي</div>
          </div>
        </div>

        {/* Chatbot picker */}
        <div className="chatbot-picker">
          <button
            className={`picker-btn${selectedChatbot === "law" ? " active" : ""}`}
            onClick={() => onSelectChatbot("law")}
          >
            ⚖️ Law
          </button>
          <button
            className={`picker-btn${selectedChatbot === "english" ? " active" : ""}`}
            onClick={() => onSelectChatbot("english")}
          >
            📚 English
          </button>
        </div>

        <button className="new-chat-btn" onClick={onNewChat} title="New chat">
          ✏️ New Chat
        </button>
      </div>

      {/* ── Law Tutor sections ── */}
      {selectedChatbot === "law" && (
        <>
          <div className="sidebar-section-title">المواد / Matières</div>
          <nav className="subject-list">
            {SUBJECTS.map((s) => (
              <button
                key={s.id}
                className={`subject-btn ${selectedSubject === s.id ? "active" : ""}`}
                onClick={() => onSelectSubject(s.id === selectedSubject ? null : s.id)}
              >
                <span className="subject-emoji">{s.emoji}</span>
                <div className="subject-text">
                  <span className="subject-fr">{s.fr}</span>
                  <span className="subject-ar">{s.darija}</span>
                </div>
              </button>
            ))}
          </nav>

          <div className="sidebar-section-title">أوضاع سريعة / Modes rapides</div>
          <div className="mode-list">
            {LAW_MODES.map((m) => (
              <button key={m.id} className="mode-btn" onClick={() => onQuickMode(m.prompt)}>
                {m.emoji} {m.label}
              </button>
            ))}
          </div>
        </>
      )}

      {/* ── English Exam sections ── */}
      {selectedChatbot === "english" && (
        <>
          <div className="sidebar-section-title">Exam Type</div>
          <div className="mode-list">
            {EXAM_TYPES.map((t) => (
              <button key={t.id} className="mode-btn" onClick={() => onQuickMode(t.prompt)}>
                {t.emoji} {t.label}
              </button>
            ))}
          </div>

          <div className="sidebar-section-title">Level</div>
          <div className="level-list">
            {LEVELS.map((l) => (
              <button
                key={l.id}
                className={`level-btn${selectedLevel === l.id ? " active" : ""}`}
                onClick={() => onSelectLevel(l.id === selectedLevel ? null : l.id)}
              >
                {l.emoji} {l.label}
              </button>
            ))}
          </div>
        </>
      )}

      <div className="sidebar-footer">
        <div className="tip-box">
          {selectedChatbot === "law"
            ? "💡 Upload a PDF, DOCX or image of your exam and I'll answer all questions!"
            : "💡 Type \"generate exam grammar B2\" to get a full structured exam with corrections!"}
        </div>
      </div>
    </aside>
  );
}

export { SUBJECTS };
