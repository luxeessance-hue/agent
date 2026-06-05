import os
import streamlit as st
import anthropic
from openai import OpenAI

# ── System prompts ────────────────────────────────────────────────────────────

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

LAW_TUTOR_PROMPT = """قاعدة مطلقة لا استثناء فيها: يجب أن تكون جميع ردودك باللغة العربية الفصحى فقط، بغض النظر عن اللغة التي يكتب بها الطالب. لا تكتب كلمة واحدة بالفرنسية أو الإنجليزية أو الدارجة المغربية. العربية فقط دائماً.

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
**المرجع القانوني** — اذكر الفصل أو القانون بدقة
**مثال** — أعطِ مثالاً واقعياً ملموساً

إذا قال الطالب "ختبرني": اطرح 5 أسئلة امتحانية ثم صحح إجاباته مع الشرح.
إذا قال الطالب "كيفاش نراجع": قدّم خطة مراجعة أسبوعية.
إذا قال الطالب "دير ليا فيش": أنشئ ورقة ملخصة موجزة.

لا تخترع مواد قانونية. استشهد دائماً باسم القانون المغربي ورقمه. كن واضحاً ومنظماً وصبوراً."""

LAW_SUBJECTS = [
    "كل المواد",
    "ثقافة مقاولاتية",
    "علم الإجرام والقانون الجنائي",
    "القانون العقاري",
    "حقوق الإنسان والحريات العامة",
    "قانون الشركات",
]

# ── Page config ───────────────────────────────────────────────────────────────

st.set_page_config(page_title="AI Study Chatbots", page_icon="🎓", layout="wide")

# ── Sidebar ───────────────────────────────────────────────────────────────────

with st.sidebar:
    st.title("🎓 Study Chatbots")
    st.markdown("---")
    selected = st.radio(
        "Choose your chatbot",
        options=["📚 English Exam Agent", "⚖️ Moroccan Law Tutor"],
        label_visibility="collapsed",
    )
    st.markdown("---")

    if selected == "⚖️ Moroccan Law Tutor":
        st.markdown("**المادة**")
        subject = st.selectbox("Subject", LAW_SUBJECTS, label_visibility="collapsed")
    else:
        subject = None

    if st.button("🗑️ Clear chat", use_container_width=True):
        key = "english_messages" if selected == "📚 English Exam Agent" else "law_messages"
        st.session_state[key] = []
        st.rerun()

# ── English Exam chatbot ──────────────────────────────────────────────────────

def run_english_exam():
    st.title("📚 English Exam Agent")
    st.caption("Moroccan Bac+3 — B1 / B2 / C1")

    OPENING = "What type of exam do you need today? (grammar / writing / vocabulary / mixed)"

    if "english_messages" not in st.session_state:
        st.session_state.english_messages = [{"role": "assistant", "content": OPENING}]

    for msg in st.session_state.english_messages:
        with st.chat_message(msg["role"]):
            st.markdown(msg["content"])

    if prompt := st.chat_input("Type your message…"):
        st.session_state.english_messages.append({"role": "user", "content": prompt})
        with st.chat_message("user"):
            st.markdown(prompt)

        client = anthropic.Anthropic()
        with st.chat_message("assistant"):
            with st.spinner("Thinking…"):
                response = client.messages.create(
                    model="claude-sonnet-4-6",
                    max_tokens=4096,
                    system=ENGLISH_EXAM_PROMPT,
                    messages=st.session_state.english_messages,
                )
                reply = next((b.text for b in response.content if b.type == "text"), "")
            st.markdown(reply)

        st.session_state.english_messages.append({"role": "assistant", "content": reply})

# ── Moroccan Law Tutor chatbot ────────────────────────────────────────────────

def run_law_tutor(subject: str):
    st.title("⚖️ Moroccan Law Tutor")
    st.caption("أستاذ القانون المغربي — ليسانس")

    OPENING = "أهلاً! أنا أستاذك في القانون المغربي. اختر مادة من القائمة أو اسألني مباشرة."

    if "law_messages" not in st.session_state:
        st.session_state.law_messages = [{"role": "assistant", "content": OPENING}]

    for msg in st.session_state.law_messages:
        with st.chat_message(msg["role"]):
            st.markdown(msg["content"])

    if prompt := st.chat_input("اكتب سؤالك هنا…"):
        st.session_state.law_messages.append({"role": "user", "content": prompt})
        with st.chat_message("user"):
            st.markdown(prompt)

        system = LAW_TUTOR_PROMPT
        if subject and subject != "كل المواد":
            system += f"\n\nالمادة المختارة: **{subject}**. ركّز إجاباتك على هذه المادة."

        client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))
        with st.chat_message("assistant"):
            with st.spinner("جاري التفكير…"):
                response = client.chat.completions.create(
                    model="gpt-4.1-mini",
                    max_tokens=2048,
                    messages=[{"role": "system", "content": system}]
                    + [{"role": m["role"], "content": m["content"]} for m in st.session_state.law_messages],
                )
                reply = response.choices[0].message.content or ""
            st.markdown(reply)

        st.session_state.law_messages.append({"role": "assistant", "content": reply})

# ── Router ────────────────────────────────────────────────────────────────────

if selected == "📚 English Exam Agent":
    run_english_exam()
else:
    run_law_tutor(subject)
