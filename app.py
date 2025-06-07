import streamlit as st
import docx2txt
import pdfplumber
import re
import matplotlib.pyplot as plt
import json
import os

st.set_page_config(page_title="PrivAI", layout="wide")
REPORTS_FILE = "saved_reports.json"

def load_reports():
    if os.path.exists(REPORTS_FILE):
        with open(REPORTS_FILE, "r") as f:
            return json.load(f)
    return []

def save_reports(reports):
    with open(REPORTS_FILE, "w") as f:
        json.dump(reports, f)

if os.path.exists("styles.css"):
    with open("styles.css") as css:
        st.markdown(f"<style>{css.read()}</style>", unsafe_allow_html=True)

if "authenticated" not in st.session_state:
    st.session_state.authenticated = False

def login(username, password):
    return username == "admin" and password == "privai2025"

# --- UI ---

def show_login():
    st.title("🔐 Login to PrivAI")
    username = st.text_input("Username", key="username")
    password = st.text_input("Password", type="password", key="password")
    login_clicked = st.button("Login")
    if login_clicked:
        if login(username, password):
            st.session_state.authenticated = True
            st.success("Login successful! Please continue below.")
        else:
            st.error("Invalid credentials")

def extract_text(file):
    if file.name.endswith(".txt"):
        return file.read().decode("utf-8")
    elif file.name.endswith(".pdf"):
        with pdfplumber.open(file) as pdf:
            return "\n".join(p.extract_text() for p in pdf.pages if p.extract_text())
    elif file.name.endswith(".docx"):
        return docx2txt.process(file)
    return ""

def detect_leaks(text):
    keywords = ['password', 'ssn', 'credit card', 'confidential', 'dob', 'email', 'phone', 'address']
    found = [kw for kw in keywords if re.search(rf"\b{kw}\b", text, re.IGNORECASE)]
    score = len(found) * 12.5
    explanations = [f"The word '{kw}' is a potential leak based on privacy guidelines." for kw in found]
    return found, min(score, 100), explanations

def redact_text(text, leaks):
    for kw in leaks:
        text = re.sub(rf"\b{kw}\b", f"[REDACTED {kw.upper()}]", text, flags=re.IGNORECASE)
    return text

def show_main_app():
    st.title("🤖 PrivAI – Privacy Leak Detection ")
    st.sidebar.success("Logged in")
    page = st.sidebar.radio("📂 Navigate", ["Analyze", "Saved Reports"])

    if page == "Analyze":
        file = st.file_uploader("📄 Upload a document", type=["pdf", "docx", "txt"])
        if file:
            with st.spinner("Analyzing..."):
                text = extract_text(file)
                leaks, score, explanations = detect_leaks(text)
                redacted = redact_text(text, leaks)

            st.success("✅ Analysis Complete")
            with st.expander("📃 Original Document"):
                st.text_area("Extracted Text", text, height=200)
            with st.expander("🛡️ Redacted Document"):
                st.text_area("Redacted Output", redacted, height=200)

            st.subheader("🔍 Leaks Detected")
            st.write(leaks if leaks else "✅ No sensitive info found.")
            if explanations:
                with st.expander("🧠 Why these were flagged"):
                    for e in explanations:
                        st.markdown(f"- {e}")

            st.subheader("📊 Risk Score")
            st.progress(score / 100)
            st.metric("Score", f"{score:.0f}/100")
            fig, ax = plt.subplots()
            ax.barh(["Risk"], [score], color="#ff6b6b")
            ax.set_xlim(0, 100)
            st.pyplot(fig)

            if st.button("💾 Save Report"):
                reports = load_reports()
                reports.append({"name": file.name, "leaks": leaks, "score": score})
                save_reports(reports)
                st.success("Saved!")

    elif page == "Saved Reports":
        st.subheader("📁 Reports")
        reports = load_reports()
        if reports:
            for r in reports:
                st.markdown(f"""
<div style="border:1px solid #ddd; padding:10px; margin-bottom:10px; border-radius:5px;">
<strong>📄 File:</strong> {r['name']}<br>
<strong>🔐 Leaks:</strong> {', '.join(r['leaks']) if r['leaks'] else 'None'}<br>
<strong>📊 Score:</strong> {r['score']} / 100
</div>
""", unsafe_allow_html=True)
        else:
            st.info("No reports yet.")

    # Footer with your name and copyright
    st.markdown(
        """
        <style>
        .footer {
            position: fixed;
            left: 0;
            bottom: 0;
            width: 100%;
            background-color: #f0f2f6;
            color: #444;
            text-align: center;
            padding: 10px 0;
            font-size: 12px;
            z-index: 1000;
        }
        </style>
        <div class="footer">
            © 2025 Vinotini Uthirapathy - All Rights Reserved | Unauthorized copying, distribution, modification, or use of this project is strictly prohibited.
        </div>
        """,
        unsafe_allow_html=True,
    )


if st.session_state.authenticated:
    show_main_app()
else:
    show_login()
