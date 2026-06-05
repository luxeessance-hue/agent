import os
import base64
import tempfile
import json
from pathlib import Path
from typing import List, Optional

import fitz  # PyMuPDF
import anthropic
from docx import Document
from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse, FileResponse
from fastapi.staticfiles import StaticFiles
from openai import OpenAI
from pydantic import BaseModel

load_dotenv()

app = FastAPI(title="Moroccan Law Tutor API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

client = OpenAI(
    api_key=os.getenv("OPENAI_API_KEY"),
    base_url=os.getenv("OPENAI_BASE_URL", "https://api.openai.com/v1"),
)

MODEL = "gpt-4.1-mini"

SYSTEM_PROMPT = """قاعدة مطلقة لا استثناء فيها: يجب أن تكون جميع ردودك باللغة العربية الفصحى فقط، بغض النظر عن اللغة التي يكتب بها الطالب. لا تكتب كلمة واحدة بالفرنسية أو الإنجليزية أو الدارجة المغربية. العربية فقط دائماً.

أنت أستاذ ذكاء اصطناعي متخصص في القانون المغربي، تساعد طالب ليسانس في التحضير للامتحانات.

تغطي هذه المواد الخمس:
- ثقافة مقاولاتية
- علم الإجرام والقانون الجنائي
- القانون العقاري
- حقوق الإنسان والحريات العامة
- قانون الشركات

## طريقة الإجابة
نظّم كل إجابة على النحو التالي:
**التعريف** — ما هو المفهوم؟
**الشرح** — كيف يُطبَّق في القانون المغربي؟
**المرجع القانوني** — اذكر الفصل أو القانون بدقة (مثال: "الفصل 489 من القانون الجنائي المغربي")
**مثال** — أعطِ مثالاً واقعياً ملموساً

## الأوضاع الإضافية
إذا قال الطالب "ختبرني" أو "quiz me" أو "teste-moi":
← اطرح 5 أسئلة امتحانية على المادة المختارة، ثم صحح إجاباته مع الشرح.

إذا قال الطالب "كيفاش نراجع" أو "revision plan":
← قدّم خطة مراجعة أسبوعية مع أبرز المحاور الأكثر ورودًا في الامتحانات.

إذا قال الطالب "دير ليا فيش" أو "fiche résumé":
← أنشئ ورقة ملخصة موجزة بالتعريفات والمواد القانونية الأساسية.

## قواعد مهمة
- لا تخترع مواد قانونية — إن لم تكن متأكداً فقل ذلك صراحةً.
- استشهد دائماً باسم القانون المغربي ورقمه (مثال: القانون 17-95 المتعلق بشركات المساهمة).
- كن مثل أستاذ جيد: واضح، منظم، صبور.
- استخدم تنسيق markdown للوضوح (عناوين، قوائم، جداول عند الحاجة).
- إذا لم تحتوِ الصورة أو الملف على أسئلة قانونية، أخبر الطالب بلطف بما وجدته."""


class Message(BaseModel):
    role: str
    content: str


class ChatRequest(BaseModel):
    messages: List[Message]
    subject: Optional[str] = None


def extract_text_from_pdf(file_bytes: bytes) -> str:
    with tempfile.NamedTemporaryFile(suffix=".pdf", delete=False) as tmp:
        tmp.write(file_bytes)
        tmp_path = tmp.name
    try:
        doc = fitz.open(tmp_path)
        text = "\n".join(page.get_text() for page in doc)
        doc.close()
        return text
    finally:
        os.unlink(tmp_path)


def extract_text_from_docx(file_bytes: bytes) -> str:
    with tempfile.NamedTemporaryFile(suffix=".docx", delete=False) as tmp:
        tmp.write(file_bytes)
        tmp_path = tmp.name
    try:
        doc = Document(tmp_path)
        return "\n".join(p.text for p in doc.paragraphs if p.text.strip())
    finally:
        os.unlink(tmp_path)


def build_system(subject: Optional[str]) -> str:
    system = SYSTEM_PROMPT
    if subject:
        system += f"\n\nالمادة المختارة: **{subject}**. ركّز إجاباتك على هذه المادة إلا إذا طلب الطالب غير ذلك."
    return system


ENGLISH_EXAM_PROMPT = """You are an expert English exam agent for Moroccan university students at Bac+3 level.
Your role:
- Generate realistic English university exams (grammar, writing, vocabulary, oral prep)
- Cover all question types: MCQ, fill-in-the-blank, short essays, sentence transformation
- Adapt to B1/B2/C1 levels
- After generating an exam, wait for the student's answers then provide detailed correction with explanations in simple English (or Darija if asked)

When the student says "generate exam [type] [topic] [level]":
1. Create a full structured exam with 3 sections
2. Number all questions clearly
3. After answers are submitted, correct each one with explanation
4. Give a final score and personalized advice

Always be encouraging and explain mistakes clearly so the student learns.
Start by asking: 'What type of exam do you need today? (grammar / writing / vocabulary / mixed)'"""


class EnglishChatRequest(BaseModel):
    messages: List[Message]
    level: Optional[str] = None


@app.post("/api/english-exam/chat")
async def english_exam_chat(request: EnglishChatRequest):
    if not os.getenv("ANTHROPIC_API_KEY"):
        raise HTTPException(status_code=500, detail="ANTHROPIC_API_KEY not configured")

    system = ENGLISH_EXAM_PROMPT
    if request.level:
        system += f"\n\nThe student has selected level: **{request.level}**. Adapt all exams and explanations to this level."

    claude = anthropic.Anthropic(api_key=os.getenv("ANTHROPIC_API_KEY"))

    def generate():
        with claude.messages.stream(
            model="claude-sonnet-4-6",
            max_tokens=4096,
            system=system,
            messages=[{"role": m.role, "content": m.content} for m in request.messages],
        ) as stream:
            for text in stream.text_stream:
                yield text

    return StreamingResponse(generate(), media_type="text/plain")


@app.get("/api/health")
def health():
    return {"status": "ok", "model": MODEL}


@app.post("/api/chat")
async def chat(request: ChatRequest):
    if not os.getenv("OPENAI_API_KEY"):
        raise HTTPException(status_code=500, detail="OPENAI_API_KEY not configured")

    messages = [{"role": "system", "content": build_system(request.subject)}]
    messages += [{"role": m.role, "content": m.content} for m in request.messages]

    async def generate():
        stream = client.chat.completions.create(
            model=MODEL,
            messages=messages,
            stream=True,
            max_tokens=2048,
        )
        for chunk in stream:
            delta = chunk.choices[0].delta.content
            if delta:
                yield delta

    return StreamingResponse(generate(), media_type="text/plain")


@app.post("/api/upload")
async def upload_file(
    file: UploadFile = File(...),
    subject: Optional[str] = Form(None),
    history: Optional[str] = Form(None),
):
    if not os.getenv("OPENAI_API_KEY"):
        raise HTTPException(status_code=500, detail="OPENAI_API_KEY not configured")

    file_bytes = await file.read()
    content_type = file.content_type or ""
    filename = file.filename or ""

    messages = [{"role": "system", "content": build_system(subject)}]

    if history:
        try:
            parsed = json.loads(history)
            for m in parsed:
                messages.append({"role": m["role"], "content": m["content"]})
        except Exception:
            pass

    if content_type.startswith("image/") or filename.lower().endswith((".png", ".jpg", ".jpeg", ".webp", ".gif")):
        b64 = base64.standard_b64encode(file_bytes).decode("utf-8")
        media_type = content_type if content_type.startswith("image/") else "image/jpeg"
        messages.append({
            "role": "user",
            "content": [
                {"type": "image_url", "image_url": {"url": f"data:{media_type};base64,{b64}"}},
                {"type": "text", "text": "هذه صورة من دروسي أو امتحاني. اقرأ المحتوى، وحدد جميع الأسئلة أو المفاهيم القانونية، وأجب عن كل منها بطريقة منظمة باللغة العربية."},
            ],
        })
    else:
        if filename.lower().endswith(".pdf"):
            text = extract_text_from_pdf(file_bytes)
        elif filename.lower().endswith(".docx"):
            text = extract_text_from_docx(file_bytes)
        else:
            text = file_bytes.decode("utf-8", errors="replace")

        messages.append({
            "role": "user",
            "content": f"هذا محتوى الملف **{filename}**:\n\n{text}\n\nحدد جميع الأسئلة أو المفاهيم القانونية وأجب عن كل منها بطريقة منظمة ومرقمة باللغة العربية.",
        })

    async def generate():
        stream = client.chat.completions.create(
            model=MODEL,
            messages=messages,
            stream=True,
            max_tokens=4096,
        )
        for chunk in stream:
            delta = chunk.choices[0].delta.content
            if delta:
                yield delta

    return StreamingResponse(generate(), media_type="text/plain")


# ── Serve React build (must be LAST) ─────────────────────────────
BUILD_DIR = Path(__file__).parent / "static"

if BUILD_DIR.exists():
    app.mount("/static", StaticFiles(directory=str(BUILD_DIR / "static")), name="assets")

    @app.get("/{full_path:path}")
    async def serve_spa(full_path: str):
        return FileResponse(str(BUILD_DIR / "index.html"))
