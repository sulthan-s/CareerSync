import os
import pdfplumber
import docx
from flask import Flask
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
from models import db, JobPosting, Candidate as candidate




import spacy
nlp = spacy.load("en_core_web_sm")


app = Flask(__name__)
app.secret_key = "resume_screening_secret_key"

UPLOAD_FOLDER = "uploads"
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

# ---------------- JOB DATA ---------------- #
def get_jobs_from_db():
    job_records = JobPosting.query.filter_by(status='active').all()
    jobs = []

    for job in job_records:
        jobs.append({
            "id": job.id,
            "job_title": job.title,
            "company": job.company,
            # Combine description + requirements for stronger matching
            "description": f"{job.description} {job.requirements}".lower(),
            # Optional (kept for UI)
            "location": job.location,
            "job_type": job.job_type
        })

    return jobs


SKILL_SET = {
    "python", "flask", "django", "sql", "machine learning",
    "data analysis", "statistics", "git", "power bi",
    "docker", "aws", "nlp", "deep learning"
}

file_path = candidate.resume_url
# ---------------- RESUME PARSER ---------------- #
def extract_text_from_resume(file_path):
    text = ""
    if file_path.endswith(".pdf"):
        with pdfplumber.open(file_path) as pdf:
            for page in pdf.pages:
                text += page.extract_text() or ""
    elif file_path.endswith(".docx"):
        doc = docx.Document(file_path)
        for para in doc.paragraphs:
            text += para.text + " "
    return text.lower()

# ---------------- SKILL EXTRACTION ---------------- #
def extract_skills_nlp(text):
    doc = nlp(text.lower())
    extracted = set()

    # Extract noun chunks (most skills appear as noun phrases)
    for chunk in doc.noun_chunks:
        chunk_text = chunk.text.strip()
        if chunk_text in SKILL_SET:
            extracted.add(chunk_text)

    # Also check individual tokens
    for token in doc:
        if token.text in SKILL_SET:
            extracted.add(token.text)

    return extracted

# ---------------- SIMILARITY ---------------- #
def calculate_similarity(jd_text, resume_text):
    vectorizer = TfidfVectorizer()
    tfidf = vectorizer.fit_transform([jd_text, resume_text])
    return round(cosine_similarity(tfidf[0:1], tfidf[1:2])[0][0] * 100, 2)

# ---------------- SUGGESTIONS ---------------- #
def generate_suggestions(missing_skills, similarity_score):
    suggestions = []

    if missing_skills:
        suggestions.append(
            f"Add projects or certifications for: {', '.join(missing_skills)}"
        )

    if similarity_score < 50:
        suggestions.append(
            "Improve wording using job description keywords."
        )

    if similarity_score >= 70 and not missing_skills:
        suggestions.append(
            "Good match! Add quantified achievements for stronger impact."
        )

    return suggestions

# ---------------- ANALYSIS ---------------- #
def analyze_resume(job, resume_text):
    jd_text = job["description"].lower()

    jd_skills = extract_skills_nlp(jd_text)
    resume_skills = extract_skills_nlp(resume_text)

    matched = jd_skills & resume_skills
    missing = jd_skills - resume_skills

    # Scores
    skill_score = (len(matched) / len(jd_skills)) * 100 if jd_skills else 0
    similarity_score = calculate_similarity(jd_text, resume_text)

    final_score = round((skill_score * 0.6) + (similarity_score * 0.4), 2)

    # Keyword frequency (for UI tags)
    keyword_analysis = {}
    for skill in resume_skills:
        keyword_analysis[skill] = resume_text.lower().count(skill)

    return {
        # Used by circular progress bar
        "profile_strength": int(final_score),

        # Used by keyword section
        "keyword_analysis": keyword_analysis,

        # Used by skills gap section
        "skills_gap": list(missing),

        # Used by recommendations section
        "suggested_improvements": generate_suggestions(missing, similarity_score),

        # (Optional future use)
        "matched_skills": list(matched),
        "resume_skills": list(resume_skills),
        "jd_skills": list(jd_skills),
        "similarity_score": similarity_score
    }

def recommend_jobs(resume_text, current_job_id=None):
    recommendations = []

    for job in jobs:
        if job["id"] == current_job_id:
            continue

        result = analyze_resume(job, resume_text)
        recommendations.append({
            "id": job["id"],  # IMPORTANT
            "job_title": job["job_title"],
            "company": job["company"],
            "score": result["final_score"],
            "missing_skills": result["missing_skills"]
        })

    recommendations.sort(key=lambda x: x["score"], reverse=True)
    return recommendations[:5]

