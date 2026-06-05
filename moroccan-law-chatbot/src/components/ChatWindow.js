import React, { useEffect, useRef, useState } from "react";
import Message from "./Message";
import TypingIndicator from "./TypingIndicator";
import { streamChat, streamEnglishExam, uploadFile } from "../api";
import { SUBJECTS } from "./Sidebar";

export default function ChatWindow({
  selectedChatbot, messages, setMessages,
  selectedSubject, selectedLevel,
  pendingInput, clearPendingInput,
}) {
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [dragging, setDragging] = useState(false);
  const bottomRef = useRef(null);
  const fileInputRef = useRef(null);

  const isEnglish = selectedChatbot === "english";
  const subjectLabel = selectedSubject
    ? SUBJECTS.find((s) => s.id === selectedSubject)?.fr
    : null;

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  useEffect(() => {
    if (pendingInput) {
      setInput(pendingInput);
      clearPendingInput();
    }
  }, [pendingInput, clearPendingInput]);

  const historyForApi = messages
    .filter((m) => m.role === "user" || m.role === "assistant")
    .map((m) => ({ role: m.role, content: m.content }));

  function handleSend() {
    const text = input.trim();
    if (!text || loading) return;
    setInput("");

    const newMessages = [...messages, { role: "user", content: text }];
    setMessages(newMessages);

    const apiHistory = [...historyForApi, { role: "user", content: text }];
    setLoading(true);

    let assistantText = "";
    const assistantId = Date.now();
    setMessages([...newMessages, { role: "assistant", content: "", id: assistantId }]);

    const onChunk = (chunk) => {
      assistantText += chunk;
      setMessages((prev) =>
        prev.map((m) => m.id === assistantId ? { ...m, content: assistantText } : m)
      );
    };
    const onDone = () => setLoading(false);
    const onError = (err) => {
      setMessages((prev) => [
        ...prev.filter((m) => m.id !== assistantId),
        { role: "error", content: `Error: ${err}` },
      ]);
      setLoading(false);
    };

    if (isEnglish) {
      streamEnglishExam(apiHistory, selectedLevel, onChunk, onDone, onError);
    } else {
      streamChat(apiHistory, subjectLabel, onChunk, onDone, onError);
    }
  }

  function handleFileChange(e) {
    const file = e.target.files?.[0];
    if (file) processFile(file);
    e.target.value = "";
  }

  function processFile(file) {
    if (loading || isEnglish) return;
    const fileName = file.name;
    const userMsg = { role: "user", content: `📎 Uploaded: **${fileName}**`, file: fileName };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setLoading(true);

    let assistantText = "";
    const assistantId = Date.now();
    setMessages([...newMessages, { role: "assistant", content: "", id: assistantId }]);

    uploadFile(
      file, subjectLabel, historyForApi,
      (chunk) => {
        assistantText += chunk;
        setMessages((prev) =>
          prev.map((m) => m.id === assistantId ? { ...m, content: assistantText } : m)
        );
      },
      () => setLoading(false),
      (err) => {
        setMessages((prev) => [
          ...prev.filter((m) => m.id !== assistantId),
          { role: "error", content: `Error: ${err}` },
        ]);
        setLoading(false);
      }
    );
  }

  function handleDrop(e) {
    e.preventDefault();
    setDragging(false);
    if (isEnglish) return;
    const file = e.dataTransfer.files?.[0];
    if (file) processFile(file);
  }

  function handleKeyDown(e) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  const isEmpty = messages.length === 0;

  return (
    <main
      className={`chat-window ${dragging ? "drag-over" : ""}`}
      onDragOver={(e) => { e.preventDefault(); if (!isEnglish) setDragging(true); }}
      onDragLeave={() => setDragging(false)}
      onDrop={handleDrop}
    >
      {!isEnglish && selectedSubject && (
        <div className="subject-banner">
          <span>
            {SUBJECTS.find((s) => s.id === selectedSubject)?.emoji}{" "}
            <strong>{subjectLabel}</strong> —{" "}
            {SUBJECTS.find((s) => s.id === selectedSubject)?.darija}
          </span>
        </div>
      )}

      {isEnglish && selectedLevel && (
        <div className="subject-banner">
          <span>📚 <strong>English Exam Agent</strong> — Level {selectedLevel}</span>
        </div>
      )}

      <div className="messages-area">
        {isEmpty && !isEnglish && (
          <div className="welcome-screen">
            <div className="welcome-flag">🇲🇦</div>
            <h2 className="welcome-title">Salam! مرحباً! Bienvenue!</h2>
            <p className="welcome-sub">
              Ana <strong>Ustaz IA dyalek</strong> — متخصص في القانون المغربي
            </p>
            <div className="welcome-grid">
              <div className="welcome-card"><span>💬</span><p>Ask any Moroccan law question in Darija, French, or Arabic</p></div>
              <div className="welcome-card"><span>📄</span><p>Upload a PDF or DOCX exam file and I'll answer all questions</p></div>
              <div className="welcome-card"><span>🖼️</span><p>Send a photo of your handwritten notes or exam paper</p></div>
              <div className="welcome-card"><span>🎯</span><p>Use sidebar buttons for Quiz, Fiche, or Revision Plan</p></div>
            </div>
          </div>
        )}

        {isEmpty && isEnglish && (
          <div className="welcome-screen">
            <div className="welcome-flag">📚</div>
            <h2 className="welcome-title">English Exam Agent</h2>
            <p className="welcome-sub">
              Your personal English tutor — <strong>Bac+3 Moroccan students</strong>
            </p>
            <div className="welcome-grid">
              <div className="welcome-card"><span>📝</span><p>Generate full exams: grammar, writing, vocabulary, or mixed</p></div>
              <div className="welcome-card"><span>🎯</span><p>Pick a level (B1/B2/C1) and exam type from the sidebar</p></div>
              <div className="welcome-card"><span>✅</span><p>Submit your answers and get detailed corrections with scores</p></div>
              <div className="welcome-card"><span>💬</span><p>Ask in English or Darija — I'll always explain clearly</p></div>
            </div>
          </div>
        )}

        {messages.map((msg, i) => (
          <Message key={msg.id || i} message={msg} />
        ))}

        {loading && messages[messages.length - 1]?.content === "" && (
          <TypingIndicator />
        )}

        <div ref={bottomRef} />
      </div>

      {dragging && (
        <div className="drop-overlay">
          <div className="drop-message">📎 Drop your file here</div>
        </div>
      )}

      <div className="input-area">
        <div className="input-bar">
          {!isEnglish && (
            <button
              className="attach-btn"
              onClick={() => fileInputRef.current?.click()}
              title="Upload PDF, DOCX, or image"
              disabled={loading}
            >
              📎
            </button>
          )}
          <textarea
            className="chat-input"
            placeholder={
              isEnglish
                ? "Ask me anything… or type \"generate exam grammar B2\""
                : "اسألني... / Posez votre question... / Ask me anything..."
            }
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            rows={1}
            disabled={loading}
          />
          <button
            className="send-btn"
            onClick={handleSend}
            disabled={!input.trim() || loading}
            title="Send"
          >
            {loading ? "⏳" : "➤"}
          </button>
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,.docx,.txt,image/*"
          style={{ display: "none" }}
          onChange={handleFileChange}
        />
        <div className="input-hint">
          Enter to send · Shift+Enter for new line{!isEnglish && " · Drag & drop files"}
        </div>
      </div>
    </main>
  );
}
