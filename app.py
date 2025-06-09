import streamlit as st
import docx2txt
import pdfplumber
import re
import matplotlib.pyplot as plt
import json
import os
from transformers import pipeline
from transformers.pipelines import AggregationStrategy

st.set_page_config(page_title="PrivAI", layout="wide", page_icon="🤖")

REPORTS_FILE = "saved_reports.json"

def load_reports():
    if os.path.exists(REPORTS_FILE):
        try:
            with open(REPORTS_FILE, "r") as f:
                return json.load(f)
        except Exception:
            return []
    return []

def save_reports(reports):
    with open(REPORTS_FILE, "w") as f:
        json.dump(reports, f, indent=4)

if "authenticated" not in st.session_state:
    st.session_state.authenticated = False
if "username" not in st.session_state:
    st.session_state.username = ""

@st.cache_resource(show_spinner=False)
def load_ner_model():
    return pipeline(
        "ner",
        model="dbmdz/bert-large-cased-finetuned-conll03-english",
        aggregation_strategy=AggregationStrategy.SIMPLE,
    )

ner_pipeline = load_ner_model()

def login(username, password):
    return username == "admin" and password == "privai2025"

def logout():
    st.session_state.authenticated = False
    st.session_state.username = ""

def extract_text(file):
    try:
        file_extension = file.name.split('.')[-1].lower()
        
        if file_extension == "txt":
            return file.read().decode("utf-8")
        
        elif file_extension == "pdf":
            file.seek(0)  # ensure pointer at start
            with pdfplumber.open(file) as pdf:
                pages_text = []
                for page in pdf.pages:
                    text = page.extract_text()
                    if text:
                        pages_text.append(text)
                return "\n".join(pages_text)
        
        elif file_extension == "docx":
            # docx2txt requires a filepath, so save temp file
            import tempfile
            with tempfile.NamedTemporaryFile(delete=True, suffix=".docx") as tmp:
                tmp.write(file.read())
                tmp.flush()
                return docx2txt.process(tmp.name)
    except Exception as e:
        st.error(f"Error extracting text: {e}")
    return ""

def detect_keywords(text):
    keywords = [
        'password', 'ssn', 'social security number', 'credit card', 'card number',
        'confidential', 'dob', 'date of birth', 'email', 'phone', 'address', 'account number',
        'routing number', 'pin', 'cvv', 'passport', 'driver license'
    ]
    found = []
    for kw in keywords:
        if re.search(rf"\b{re.escape(kw)}\b", text, re.IGNORECASE):
            found.append(kw)
    return found

def detect_ner_entities(text):
    entities = []
    try:
        ner_results = ner_pipeline(text)
        for ent in ner_results:
            if ent['entity_group'] in ['PER', 'ORG', 'LOC', 'MISC', 'DATE']:
                entities.append(ent['word'])
    except Exception as e:
        st.warning(f"NER detection failed: {e}")
    entities = list(set(entities))
    return entities

def detect_leaks(text):
    keywords_found = detect_keywords(text)
    ner_entities = detect_ner_entities(text)

    leaks = list(set([kw.lower() for kw in keywords_found] + [ent.lower() for ent in ner_entities]))

    base_score = len(keywords_found) * 12.5
    ner_score = min(len(ner_entities) * 7, 50)
    score = min(base_score + ner_score, 100)

    explanations = []
    for kw in keywords_found:
        explanations.append(f"The keyword '{kw}' was flagged as a privacy risk.")
    for ent in ner_entities:
        explanations.append(f"The entity '{ent}' was detected as sensitive information by AI.")

    return leaks, score, explanations

def redact_text(text, leaks):
    for kw in leaks:
        pattern = re.escape(kw)
        text = re.sub(rf"\b{pattern}\b", "[REDACTED]", text, flags=re.IGNORECASE)
    return text

def show_login():
    st.markdown("## 🔐 Welcome to PrivAI")
    username = st.text_input("Username", key="login_username")
    password = st.text_input("Password", type="password", key="login_password")
    if st.button("Login"):
        if login(username, password):
            st.session_state.authenticated = True
            st.session_state.username = username
            st.success("Login successful! Please continue below.")
        else:
            st.error("Invalid username or password")

def show_main_app():
    st.title(":shield: PrivAI – AI Privacy Leak Detection")

    st.sidebar.write(f"👤 Logged in as **{st.session_state.username}**")
    if st.sidebar.button("Logout"):
        logout()
        st.experimental_rerun()

    page = st.sidebar.radio("Navigation", ["Analyze Document", "View Saved Reports"])

    if page == "Analyze Document":
        file = st.file_uploader("Upload Document", type=["pdf", "docx", "txt"])
        if file:
            with st.spinner("Analyzing document with AI-powered detection..."):
                text = extract_text(file)
                if not text.strip():
                    st.error("No text extracted from the document.")
                    return
                leaks, score, explanations = detect_leaks(text)
                redacted = redact_text(text, leaks)

            st.success("Analysis complete!")

            col1, col2 = st.columns(2)
            with col1:
                st.subheader("Original Text")
                st.text_area("Extracted Text", text, height=300)
            with col2:
                st.subheader("Redacted Text")
                st.text_area("Redacted Output", redacted, height=300)

            st.subheader("Detected Leaks")
            if leaks:
                st.write(", ".join(leaks))
            else:
                st.success("No sensitive information detected.")

            if explanations:
                with st.expander("Why were these flagged?"):
                    for exp in explanations:
                        st.markdown(f"- {exp}")

            st.subheader("Risk Score")
            st.metric("Risk", f"{score:.0f}/100")
            st.progress(score / 100)

            fig, ax = plt.subplots()
            ax.barh(["Risk"], [score], color="#ff6b6b")
            ax.set_xlim(0, 100)
            ax.set_xlabel("Risk Level")
            st.pyplot(fig)

            if st.button("Save Report"):
                reports = load_reports()
                reports.append({
                    "name": file.name,
                    "leaks": leaks,
                    "score": score,
                })
                save_reports(reports)
                st.success("Report saved successfully.")

    elif page == "View Saved Reports":
        reports = load_reports()
        st.subheader("Saved Reports")
        if not reports:
            st.info("No saved reports found.")
        else:
            for i, report in enumerate(reports):
                with st.expander(f"{report['name']} (Report #{i+1})"):
                    st.write(f"**Leaks:** {', '.join(report['leaks']) if report['leaks'] else 'None'}")
                    st.write(f"**Risk Score:** {report['score']} / 100")

    st.markdown("""
    <hr style='margin-top: 2em;'/>
    <div style='text-align:center; font-size: 12px; color: gray;'>
        © 2025 Vinotini Uthirapathy - All Rights Reserved. Unauthorized use prohibited.
    </div>
    """, unsafe_allow_html=True)

if st.session_state.authenticated:
    show_main_app()
else:
    show_login()


