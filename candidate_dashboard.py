# candidate_dashboard.py
from flask import Blueprint, render_template, request, redirect, url_for, session, flash, jsonify
import os
import uuid
from werkzeug.utils import secure_filename
from models import db, User, JobPosting, Candidate as CandidateModel, Application
from resume_analyzer import analyze_resume, extract_text_from_resume


candidate_bp = Blueprint('candidate', __name__, url_prefix='/dashboard/candidate')


import os


# Candidate Dashboard Routes
@candidate_bp.route('/')
def candidate_dashboard():
    if 'user_id' not in session or session.get('user_type') != 'jobseeker':
        return redirect(url_for('login'))
    
    user_id = session['user_id']
    
    # Get candidate stats
    total_applications = Application.query.filter_by(candidate_id=user_id).count()
    pending_applications = Application.query.filter_by(candidate_id=user_id, status='pending').count()
    shortlisted_applications = Application.query.filter_by(candidate_id=user_id, status='shortlisted').count()
    rejected_applications = Application.query.filter_by(candidate_id=user_id, status='rejected').count()
    
    # Get recent applications (last 5)
    recent_apps = Application.query.filter_by(candidate_id=user_id)\
        .join(JobPosting)\
        .order_by(Application.applied_at.desc())\
        .limit(5)\
        .all()
    
    # Get recommended jobs (based on skills - simplified)
    candidate = CandidateModel.query.filter_by(id=user_id).first()
    recommended_jobs = get_ml_recommended_jobs(candidate)

    # Remove duplicates
    recommended_jobs = list(set(recommended_jobs))[:5]
    
    # Get application timeline
    applications_timeline = Application.query.filter_by(candidate_id=user_id)\
        .join(JobPosting)\
        .order_by(Application.applied_at.desc())\
        .limit(10)\
        .all()
    
    return render_template('candidate_dashboard.html',
                         user_name=session['user_name'],
                         total_applications=total_applications,
                         pending_applications=pending_applications,
                         shortlisted_applications=shortlisted_applications,
                         rejected_applications=rejected_applications,
                         recent_apps=recent_apps,
                         recommended_jobs=recommended_jobs,
                         applications_timeline=applications_timeline)

@candidate_bp.route('/applications')
def applications():
    if 'user_id' not in session or session.get('user_type') != 'jobseeker':
        return redirect(url_for('login'))
    
    user_id = session['user_id']
    
    # Get filter parameters
    status_filter = request.args.get('status', 'all')
    sort_by = request.args.get('sort', 'newest')
    
    # Base query
    query = Application.query.filter_by(candidate_id=user_id).join(JobPosting)
    
    # Apply filters
    if status_filter != 'all':
        query = query.filter(Application.status == status_filter)
    
    # Apply sorting
    if sort_by == 'newest':
        query = query.order_by(Application.applied_at.desc())
    elif sort_by == 'oldest':
        query = query.order_by(Application.applied_at.asc())
    elif sort_by == 'match':
        # Assuming match_score column exists, otherwise adjust
        query = query.order_by(Application.match_score.desc())
    elif sort_by == 'status':
        query = query.order_by(Application.status)
    
    applications = query.all()
    
    return render_template('candidate_applications.html',
                         applications=applications,
                         user_name=session['user_name'])

@candidate_bp.route('/job-search')
def job_search():
    if 'user_id' not in session or session.get('user_type') != 'jobseeker':
        return redirect(url_for('login'))
    
    # Get search parameters
    search_query = request.args.get('search', '')
    location_filter = request.args.get('location', '')
    experience_filter = request.args.get('experience', 'all')
    job_type_filter = request.args.get('job_type', 'all')
    
    # Base query for active jobs
    query = JobPosting.query.filter_by(status='active')
    
    # Apply filters
    if search_query:
        query = query.filter(
            JobPosting.title.ilike(f'%{search_query}%') |
            JobPosting.company.ilike(f'%{search_query}%') |
            JobPosting.description.ilike(f'%{search_query}%')
        )
    
    if location_filter:
        query = query.filter(JobPosting.location.ilike(f'%{location_filter}%'))
    
    if experience_filter != 'all':
        query = query.filter(JobPosting.experience.ilike(f'%{experience_filter}%'))
    
    if job_type_filter != 'all':
        query = query.filter(JobPosting.job_type == job_type_filter)
    
    # Get jobs
    jobs = query.order_by(JobPosting.created_at.desc()).all()
    
    # Check which jobs are already applied
    user_id = session['user_id']
    applied_job_ids = [app.job_id for app in 
                      Application.query.filter_by(candidate_id=user_id).all()]
    
    return render_template('candidate_job_search.html',
                         jobs=jobs,
                         applied_job_ids=applied_job_ids,
                         user_name=session['user_name'])

@candidate_bp.route("/profile")
def profile():
    user_id = session.get("user_id")

    candidate = CandidateModel.query.get(user_id)

    return render_template(
        "candidate_profile.html",
        candidate=candidate,
        user_name=session.get("user_name"),
        total_applications=Application.query.filter_by(candidate_id=user_id).count()
    )

@candidate_bp.route("/profile/update", methods=["POST"])
def update_profile():
    user_id = session.get("user_id")

    if not user_id:
        flash("Session expired. Please login again.", "error")
        return redirect(url_for("login"))

    # ✅ ENSURE CANDIDATE EXISTS
    candidate = CandidateModel.query.get(user_id)
    if not candidate:
        candidate = CandidateModel(id=user_id)

    candidate.name = request.form["name"]
    candidate.email = request.form["email"]
    candidate.phone = request.form.get("phone")
    candidate.skills = request.form["skills"]
    candidate.experience = request.form.get("experience")
    candidate.education = request.form.get("education")

    # ✅ Resume upload
    resume = request.files.get("resume")
    if resume and resume.filename:
        filename = secure_filename(resume.filename)

        upload_dir = os.path.join("uploads", "resumes")
        os.makedirs(upload_dir, exist_ok=True)

        resume_path = os.path.join(upload_dir, filename)
        resume.save(resume_path)

        # ✅ ALWAYS store normalized path
        candidate.resume_url = resume_path.replace("\\", "/")

    db.session.add(candidate)
    db.session.commit()

    flash("Profile updated successfully", "success")
    return redirect(url_for("candidate.profile"))

@candidate_bp.route('/apply/<int:job_id>')
def apply_job(job_id):
    if 'user_id' not in session or session.get('user_type') != 'jobseeker':
        return redirect(url_for('login'))

    user_id = session['user_id']

    existing_application = Application.query.filter_by(
        candidate_id=user_id,
        job_id=job_id
    ).first()

    if existing_application:
        flash('You have already applied for this job!', 'warning')
        return redirect(url_for('candidate.job_search'))

    candidate = CandidateModel.query.get(user_id)
    job = JobPosting.query.get(job_id)

    resume_text = extract_text_from_resume(candidate.resume_url)

    job_dict = {
        "id": job.id,
        "job_title": job.title,
        "company": job.company,
        "description": f"{job.description} {job.requirements}".lower()
    }

    if resume_text:
        analysis = analyze_resume(job_dict, resume_text)
        match_score = analysis["similarity_score"]
    else:
        match_score = 0

    new_application = Application(
        candidate_id=user_id,
        job_id=job_id,
        status='pending',
        match_score=int(match_score)
    )

    db.session.add(new_application)
    db.session.commit()

    flash(f'Application submitted! Match Score: {match_score}%', 'success')
    return redirect(url_for('candidate.job_search'))

@candidate_bp.route('/resume-analysis')
def resume_analysis():
    user_id = session.get('user_id')
    candidate = CandidateModel.query.get(user_id)

    if not candidate:
        flash("Candidate profile not found", "error")
        return redirect(url_for('candidate.profile'))

    if not candidate.resume_url:
        flash("Please upload your resume before resume analysis", "warning")
        return redirect(url_for('candidate.profile'))

    resume_text = extract_text_from_resume(candidate.resume_url)

    if not resume_text:
        flash("Unable to read resume file. Please re-upload.", "error")
        return redirect(url_for('candidate.profile'))

    job = JobPosting.query.filter_by(status='active').first()
    if not job:
        flash("No active jobs available", "warning")
        return redirect(url_for('candidate.candidate_dashboard'))

    analysis = analyze_resume(
        {
            "id": job.id,
            "job_title": job.title,
            "company": job.company,
            "description": f"{job.description} {job.requirements}".lower()
        },
        resume_text
    )

    return render_template(
        "candidate_resume_analysis.html",
        analysis=analysis
    )

# API Routes for candidate dashboard
@candidate_bp.route('/api/applications/stats')
def application_stats():
    if 'user_id' not in session or session.get('user_type') != 'jobseeker':
        return jsonify({'error': 'Unauthorized'}), 401
    
    user_id = session['user_id']
    
    stats = {
        'total': Application.query.filter_by(candidate_id=user_id).count(),
        'pending': Application.query.filter_by(candidate_id=user_id, status='pending').count(),
        'shortlisted': Application.query.filter_by(candidate_id=user_id, status='shortlisted').count(),
        'rejected': Application.query.filter_by(candidate_id=user_id, status='rejected').count(),
        'hired': Application.query.filter_by(candidate_id=user_id, status='hired').count()
    }
    
    return jsonify(stats)

@candidate_bp.route('/api/recommended-jobs')
def recommended_jobs_api():
    if 'user_id' not in session or session.get('user_type') != 'jobseeker':
        return jsonify({'error': 'Unauthorized'}), 401
    
    user_id = session['user_id']
    candidate = CandidateModel.query.filter_by(id=user_id).first()
    
    # Get recommended jobs (simplified)
    jobs = JobPosting.query.filter_by(status='active')\
        .order_by(JobPosting.created_at.desc())\
        .limit(10)\
        .all()
    
    jobs_data = []
    for job in jobs:
        jobs_data.append({
            'id': job.id,
            'title': job.title,
            'company': job.company,
            'location': job.location,
            'type': job.job_type,
            'posted_date': job.created_at.strftime('%b %d, %Y')
        })
    
    return jsonify({'jobs': jobs_data})

def get_ml_recommended_jobs(candidate, limit=5):
    from resume_analyzer import analyze_resume

    if not candidate or not candidate.resume_url:
        return []

    if not os.path.exists(candidate.resume_url):
        return []

    resume_text = extract_text_from_resume(candidate.resume_url)

    scored_jobs = []

    jobs = JobPosting.query.filter_by(status='active').all()

    for job in jobs:
        job_dict = {
            "id": job.id,
            "job_title": job.title,
            "company": job.company,
            "description": f"{job.description} {job.requirements}".lower()
        }

        analysis = analyze_resume(job_dict, resume_text)

        # ✅ FIX HERE
        score = analysis.get("profile_strength", 0)

        scored_jobs.append((job, score))

    # Sort by score
    scored_jobs.sort(key=lambda x: x[1], reverse=True)

    recommended = []
    for job, score in scored_jobs[:limit]:
        job.match_score = int(score)
        recommended.append(job)

    return recommended

@candidate_bp.route('/analyze-job/<int:job_id>')
def analyze_job(job_id):
    user_id = session.get("user_id")

    candidate = CandidateModel.query.get(user_id)
    if not candidate or not candidate.resume_url:
        return jsonify({"error": "Resume not uploaded"}), 400

    resume_text = extract_text_from_resume(candidate.resume_url)
    if not resume_text:
        return jsonify({"error": "Unable to read resume"}), 400

    job = JobPosting.query.get(job_id)
    if not job:
        return jsonify({"error": "Job not found"}), 404

    analysis = analyze_resume(
        {
            "description": f"{job.description} {job.requirements}".lower()
        },
        resume_text
    )

    return jsonify({
        "score": analysis["profile_strength"],
        "skills_gap": analysis["skills_gap"],
        "suggestions": analysis["suggested_improvements"]
    })

@candidate_bp.route('/job/<int:job_id>')
def job_details(job_id):
    job = JobPosting.query.get_or_404(job_id)

    return jsonify({
        "title": job.title,
        "company": job.company,
        "location": job.location,
        "description": job.description,
        "requirements": job.requirements
    })
