import React, { useState, useCallback } from "react";
import "./App.css";
import Sidebar from "./components/Sidebar";
import ChatWindow from "./components/ChatWindow";

export default function App() {
  const [selectedChatbot, setSelectedChatbot] = useState("law");
  const [lawMessages, setLawMessages] = useState([]);
  const [englishMessages, setEnglishMessages] = useState([]);
  const [selectedSubject, setSelectedSubject] = useState(null);
  const [selectedLevel, setSelectedLevel] = useState(null);
  const [pendingInput, setPendingInput] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const messages = selectedChatbot === "law" ? lawMessages : englishMessages;
  const setMessages = selectedChatbot === "law" ? setLawMessages : setEnglishMessages;

  const handleSelectChatbot = useCallback((bot) => {
    setSelectedChatbot(bot);
    setSidebarOpen(false);
  }, []);

  const handleNewChat = useCallback(() => {
    setMessages([]);
    setSidebarOpen(false);
  }, [setMessages]);

  const handleQuickMode = useCallback((prompt) => {
    setPendingInput(prompt);
    setSidebarOpen(false);
  }, []);

  const handleSelectSubject = useCallback((subject) => {
    setSelectedSubject(subject);
    setSidebarOpen(false);
  }, []);

  const handleSelectLevel = useCallback((level) => {
    setSelectedLevel(level);
  }, []);

  const clearPendingInput = useCallback(() => {
    setPendingInput(null);
  }, []);

  return (
    <div className="app-layout">
      <button
        className="hamburger"
        onClick={() => setSidebarOpen(o => !o)}
        aria-label="Menu"
      >
        {sidebarOpen ? "✕" : "☰"}
      </button>

      {sidebarOpen && (
        <div className="sidebar-overlay" onClick={() => setSidebarOpen(false)} />
      )}

      <Sidebar
        selectedChatbot={selectedChatbot}
        onSelectChatbot={handleSelectChatbot}
        selectedSubject={selectedSubject}
        onSelectSubject={handleSelectSubject}
        selectedLevel={selectedLevel}
        onSelectLevel={handleSelectLevel}
        onQuickMode={handleQuickMode}
        onNewChat={handleNewChat}
        isOpen={sidebarOpen}
      />

      <ChatWindow
        selectedChatbot={selectedChatbot}
        messages={messages}
        setMessages={setMessages}
        selectedSubject={selectedSubject}
        selectedLevel={selectedLevel}
        pendingInput={pendingInput}
        clearPendingInput={clearPendingInput}
      />
    </div>
  );
}
