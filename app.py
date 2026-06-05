import streamlit as st
import anthropic

SYSTEM_PROMPT = """You are an expert English exam agent for Moroccan university students at Bac+3 level.
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

OPENING_MESSAGE = "What type of exam do you need today? (grammar / writing / vocabulary / mixed)"

st.set_page_config(page_title="English Exam Agent", page_icon="📚")
st.title("📚 English Exam Agent")
st.caption("Moroccan Bac+3 Students — B1 / B2 / C1")

if "messages" not in st.session_state:
    st.session_state.messages = [{"role": "assistant", "content": OPENING_MESSAGE}]

for msg in st.session_state.messages:
    with st.chat_message(msg["role"]):
        st.markdown(msg["content"])

if prompt := st.chat_input("Type your message…"):
    st.session_state.messages.append({"role": "user", "content": prompt})
    with st.chat_message("user"):
        st.markdown(prompt)

    client = anthropic.Anthropic()
    with st.chat_message("assistant"):
        with st.spinner("Thinking…"):
            response = client.messages.create(
                model="claude-sonnet-4-6",
                max_tokens=4096,
                system=SYSTEM_PROMPT,
                messages=st.session_state.messages,
            )
            reply = next(
                (b.text for b in response.content if b.type == "text"), ""
            )
        st.markdown(reply)

    st.session_state.messages.append({"role": "assistant", "content": reply})
