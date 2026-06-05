const BASE_URL = process.env.REACT_APP_API_URL !== undefined
  ? process.env.REACT_APP_API_URL
  : "http://localhost:8000";

async function stream(url, body, onChunk, onDone, onError) {
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      const err = await res.text();
      onError(err || `Server error ${res.status}`);
      return;
    }
    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let done = false;
    while (!done) {
      const { value, done: d } = await reader.read();
      done = d;
      if (value) onChunk(decoder.decode(value, { stream: true }));
    }
    onDone();
  } catch (err) {
    onError(err.message);
  }
}

export function streamChat(messages, subject, onChunk, onDone, onError) {
  return stream(`${BASE_URL}/api/chat`, { messages, subject }, onChunk, onDone, onError);
}

export function streamEnglishExam(messages, level, onChunk, onDone, onError) {
  return stream(`${BASE_URL}/api/english-exam/chat`, { messages, level }, onChunk, onDone, onError);
}

export async function uploadEnglishExamFile(file, level, history, onChunk, onDone, onError) {
  try {
    const form = new FormData();
    form.append("file", file);
    if (level) form.append("level", level);
    if (history) form.append("history", JSON.stringify(history));

    const res = await fetch(`${BASE_URL}/api/english-exam/upload`, { method: "POST", body: form });
    if (!res.ok) {
      const err = await res.text();
      onError(err || `Server error ${res.status}`);
      return;
    }
    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let done = false;
    while (!done) {
      const { value, done: d } = await reader.read();
      done = d;
      if (value) onChunk(decoder.decode(value, { stream: true }));
    }
    onDone();
  } catch (err) {
    onError(err.message);
  }
}

export async function uploadFile(file, subject, history, onChunk, onDone, onError) {
  try {
    const form = new FormData();
    form.append("file", file);
    if (subject) form.append("subject", subject);
    if (history) form.append("history", JSON.stringify(history));

    const res = await fetch(`${BASE_URL}/api/upload`, { method: "POST", body: form });
    if (!res.ok) {
      const err = await res.text();
      onError(err || `Server error ${res.status}`);
      return;
    }
    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let done = false;
    while (!done) {
      const { value, done: d } = await reader.read();
      done = d;
      if (value) onChunk(decoder.decode(value, { stream: true }));
    }
    onDone();
  } catch (err) {
    onError(err.message);
  }
}
