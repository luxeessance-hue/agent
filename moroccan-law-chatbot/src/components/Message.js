import React, { useMemo } from "react";
import { marked } from "marked";

marked.setOptions({ breaks: true, gfm: true });

export default function Message({ message }) {
  const isUser = message.role === "user";
  const isError = message.role === "error";

  const html = useMemo(() => {
    if (isUser || isError) return null;
    return marked.parse(message.content || "");
  }, [message.content, isUser, isError]);

  if (isError) {
    return (
      <div className="message-row error-row">
        <div className="message-bubble error-bubble">
          ⚠️ {message.content}
        </div>
      </div>
    );
  }

  return (
    <div className={`message-row ${isUser ? "user-row" : "assistant-row"}`}>
      {!isUser && (
        <div className="avatar assistant-avatar" title="Ustaz IA">
          🇲🇦
        </div>
      )}
      <div className={`message-bubble ${isUser ? "user-bubble" : "assistant-bubble"}`}>
        {isUser ? (
          <span className="user-text">{message.content}</span>
        ) : (
          <div
            className="markdown-body"
            dangerouslySetInnerHTML={{ __html: html }}
          />
        )}
        {message.file && (
          <div className="file-badge">📎 {message.file}</div>
        )}
      </div>
      {isUser && (
        <div className="avatar user-avatar" title="You">
          👤
        </div>
      )}
    </div>
  );
}
