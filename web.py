# web.py - Updated with proper candidate routing
from flask import Flask, render_template, request, redirect, url_for, session, flash, jsonify
from flask_sqlalchemy import SQLAlchemy
from datetime import datetime
import os
from flask_bcrypt import Bcrypt



app = Flask(__name__)

app.config['SECRET_KEY'] = 'your_secret_key'
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///careersync.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

# Use centralized models and extensions to avoid circular imports
from models import db, bcrypt, User, JobPosting, Candidate, Application

# Initialize extensions with the app
db.init_app(app)
bcrypt.init_app(app)

# Create tables
with app.app_context():
    db.create_all()

# Import and register candidate blueprint
from candidate_dashboard import candidate_bp
app.register_blueprint(candidate_bp)

# --------------------- Routes -------------------------
@app.route('/')
def home():
    return render_template('index.html')

@app.route('/login', methods=['GET', 'POST'])
def login():
    if request.method == 'POST':
        email = request.form['email']
        password = request.form['password']

        user = User.query.filter_by(email=email).first()

        if user and user.check_password(password):
            session['user_id'] = user.id
            session['user_name'] = user.name
            session['user_type'] = user.user_type

            if user.user_type == 'jobseeker':
                # ✅ ENSURE CANDIDATE EXISTS
                candidate = Candidate.query.get(user.id)
                if not candidate:
                    candidate = Candidate(
                        id=user.id,
                        name=user.name,
                        email=user.email
                    )
                    db.session.add(candidate)
                    db.session.commit()

            return redirect(url_for(
                'candidate.candidate_dashboard'
                if user.user_type == 'jobseeker'
                else 'hr_dashboard'
            ))

        flash('Invalid email or password', 'error')

    return render_template('login.html')

@app.route('/signup', methods=['GET', 'POST'])
def signup():
    if request.method == 'POST':
        required_fields = ['name', 'email', 'password', 'phone', 'user_type']
        for field in required_fields:
            if not request.form.get(field):
                flash(f'Please fill in the {field.replace("_", " ")} field', 'error')
                return redirect(url_for('signup'))
        
        name = request.form['name']
        email = request.form['email']
        password = request.form['password']
        phone = request.form['phone']
        user_type = request.form['user_type']
        
        existing_user = User.query.filter_by(email=email).first()
        if existing_user:
            flash('Email already registered', 'error')
            return redirect(url_for('signup'))
        
        new_user = User(
            name=name,
            email=email,
            phone=phone,
            user_type=user_type
        )
        new_user.set_password(password)
        
        try:
            db.session.add(new_user)
            db.session.commit()
            
            session['user_id'] = new_user.id
            session['user_name'] = new_user.name
            session['user_type'] = new_user.user_type
            
            flash('Registration successful!', 'success')
            
            if user_type == 'hr':
                return redirect(url_for('hr_dashboard'))
            else:
                return redirect(url_for('candidate.candidate_dashboard'))
                
        except Exception as e:
            db.session.rollback()
            flash(f'Registration failed: {str(e)}', 'error')
    
    return render_template('signup.html')

@app.route('/logout')
def logout():
    session.clear()
    flash('You have been logged out successfully', 'success')
    return redirect(url_for('home'))

# Job Modal API Routes
@app.route('/api/job/<int:job_id>', methods=['GET', 'PUT', 'DELETE'])
def job_api(job_id):
    if 'user_id' not in session or session['user_type'] != 'hr':
        return jsonify({'error': 'Unauthorized'}), 401
    
    job = JobPosting.query.get_or_404(job_id)
    
    # Check if user owns this job
    if job.hr_id != session['user_id']:
        return jsonify({'error': 'Forbidden'}), 403
    
    if request.method == 'GET':
        return jsonify(job.to_dict())
    
    elif request.method == 'PUT':
        data = request.get_json()
        
        # Update job fields
        job.title = data.get('title', job.title)
        job.company = data.get('company', job.company)
        job.location = data.get('location', job.location)
        job.salary_range = data.get('salary_range', job.salary_range)
        job.description = data.get('description', job.description)
        job.requirements = data.get('requirements', job.requirements)
        job.job_type = data.get('job_type', job.job_type)
        job.status = data.get('status', job.status)
        
        try:
            db.session.commit()
            return jsonify({
                'success': True,
                'message': 'Job updated successfully',
                'job': job.to_dict()
            })
        except Exception as e:
            db.session.rollback()
            return jsonify({'error': str(e)}), 500
    
    elif request.method == 'DELETE':
        try:
            # Delete related applications first
            Application.query.filter_by(job_id=job_id).delete()
            
            db.session.delete(job)
            db.session.commit()
            return jsonify({
                'success': True,
                'message': 'Job deleted successfully'
            })
        except Exception as e:
            db.session.rollback()
            return jsonify({'error': str(e)}), 500

@app.route('/api/job/<int:job_id>/details')
def job_details_api(job_id):
    job = JobPosting.query.get_or_404(job_id)
    job_data = job.to_dict()
    # add related info
    job_data['applications'] = len(job.applications) if hasattr(job, 'applications') else 0
    hr = User.query.get(job.hr_id)
    job_data['hr_name'] = hr.name if hr else None
    return jsonify(job_data)

@app.route('/api/job/<int:job_id>/applications')
def job_applications_api(job_id):
    # Only HR or job owner may view applications
    if 'user_id' not in session or session.get('user_type') != 'hr':
        return jsonify({'error': 'Unauthorized'}), 401

    job = JobPosting.query.get_or_404(job_id)
    applications = Application.query.filter_by(job_id=job_id).join(Candidate).all()

    apps_data = []
    for a in applications:
        apps_data.append({
            'id': a.id,
            'candidate_id': a.candidate_id,
            'candidate_name': a.candidate.name if a.candidate else None,
            'email': a.candidate.email if a.candidate else None,
            'phone': a.candidate.phone if a.candidate else None,
            'applied_at': a.applied_at.strftime('%Y-%m-%d %H:%M:%S') if a.applied_at else None,
            'status': a.status,
            'match_score': a.match_score
        })

    return jsonify({'applications': apps_data, 'count': len(apps_data)})

@app.route('/api/job/<int:job_id>/toggle-status', methods=['POST'])
def toggle_job_status(job_id):
    if 'user_id' not in session or session['user_type'] != 'hr':
        return jsonify({'error': 'Unauthorized'}), 401
    
    job = JobPosting.query.get_or_404(job_id)
    
    if job.hr_id != session['user_id']:
        return jsonify({'error': 'Forbidden'}), 403
    
    # Toggle between active and closed
    job.status = 'closed' if job.status == 'active' else 'active'
    
    try:
        db.session.commit()
        return jsonify({
            'success': True,
            'message': f'Job status updated to {job.status}',
            'status': job.status
        })
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

# Candidate Modal API Routes
@app.route('/api/candidate/<int:candidate_id>', methods=['GET', 'PUT', 'DELETE'])
def candidate_api(candidate_id):
    if 'user_id' not in session or session['user_type'] != 'hr':
        return jsonify({'error': 'Unauthorized'}), 401
    
    candidate = Candidate.query.get_or_404(candidate_id)
    
    if request.method == 'GET':
        return jsonify(candidate.to_dict())
    
    elif request.method == 'PUT':
        data = request.get_json()
        
        # Update candidate fields
        candidate.name = data.get('name', candidate.name)
        candidate.email = data.get('email', candidate.email)
        candidate.phone = data.get('phone', candidate.phone)
        candidate.skills = data.get('skills', candidate.skills)
        candidate.experience = data.get('experience', candidate.experience)
        candidate.education = data.get('education', candidate.education)
        
        try:
            db.session.commit()
            return jsonify({
                'success': True,
                'message': 'Candidate updated successfully',
                'candidate': candidate.to_dict()
            })
        except Exception as e:
            db.session.rollback()
            return jsonify({'error': str(e)}), 500
    
    elif request.method == 'DELETE':
        try:
            # Delete related applications
            Application.query.filter_by(candidate_id=candidate_id).delete()
            
            db.session.delete(candidate)
            db.session.commit()
            return jsonify({
                'success': True,
                'message': 'Candidate deleted successfully'
            })
        except Exception as e:
            db.session.rollback()
            return jsonify({'error': str(e)}), 500

def get_dashboard_data(user_id):
    """Helper function to get dashboard data"""
    user = User.query.get(user_id)
    
    # Get job postings count
    job_count = JobPosting.query.filter_by(hr_id=user_id).count()
    
    # Get recent jobs (last 5)
    recent_jobs = JobPosting.query.filter_by(hr_id=user_id)\
        .order_by(JobPosting.created_at.desc())\
        .limit(5)\
        .all()
    
    # Get total applications
    total_applications = Application.query.join(JobPosting)\
        .filter(JobPosting.hr_id == user_id)\
        .count()
    
    # Get shortlisted applications
    shortlisted_count = Application.query.join(JobPosting)\
        .filter(JobPosting.hr_id == user_id, Application.status == 'shortlisted')\
        .count()
    
    # Get recent activities - FIXED: Handle None candidate case
    recent_activities = []
    
    # Get recent applications for activity
    recent_apps = Application.query\
        .join(JobPosting)\
        .filter(JobPosting.hr_id == user_id)\
        .order_by(Application.applied_at.desc())\
        .limit(3)\
        .all()
    
    for app in recent_apps:
        candidate_name = app.candidate.name if app.candidate else "Unknown Candidate"
        job_title = app.job.title if app.job else "Unknown Job"
        
        recent_activities.append({
            'title': f'New application from {candidate_name}',
            'description': f'Applied for {job_title}',
            'time_ago': 'Just now'  # In production, calculate time difference
        })
    
    # Get new candidates (last 4)
    new_candidates = Candidate.query\
        .join(Application, Candidate.id == Application.candidate_id)\
        .join(JobPosting, Application.job_id == JobPosting.id)\
        .filter(JobPosting.hr_id == user_id)\
        .order_by(Candidate.created_at.desc())\
        .limit(4)\
        .all()
    
    return {
        'user': user,
        'job_count': job_count,
        'recent_jobs': recent_jobs,
        'total_applications': total_applications,
        'shortlisted_count': shortlisted_count,
        'recent_activities': recent_activities,
        'new_candidates': new_candidates
    }

@app.route('/dashboard/hr')
def hr_dashboard():
    if 'user_id' not in session or session['user_type'] != 'hr':
        return redirect(url_for('login'))
    
    user_id = session['user_id']
    data = get_dashboard_data(user_id)
    
    return render_template('hr_dashboard.html', **data)

# Job Postings Routes
@app.route('/dashboard/hr/job-postings')
def job_postings():
    if 'user_id' not in session or session['user_type'] != 'hr':
        return redirect(url_for('login'))
    
    user_id = session['user_id']
    jobs = JobPosting.query.filter_by(hr_id=user_id)\
        .order_by(JobPosting.created_at.desc())\
        .all()
    
    return render_template('job_postings.html', 
                         jobs=jobs,
                         job_count=len(jobs))

@app.route('/dashboard/hr/create-job', methods=['POST'])
def create_job():
    if 'user_id' not in session or session['user_type'] != 'hr':
        return redirect(url_for('login'))
    
    if request.method == 'POST':
        try:
            new_job = JobPosting(
                title=request.form['title'],
                company=request.form['company'],
                location=request.form.get('location', ''),
                salary_range=request.form.get('salary_range', ''),
                description=request.form['description'],
                requirements=request.form['requirements'],
                job_type=request.form['job_type'],
                status='active',
                hr_id=session['user_id']
            )
            
            db.session.add(new_job)
            db.session.commit()
            
            flash('Job posted successfully!', 'success')
            return redirect(url_for('hr_dashboard'))
            
        except Exception as e:
            db.session.rollback()
            flash(f'Error creating job: {str(e)}', 'error')
            return redirect(url_for('hr_dashboard'))
    
    return redirect(url_for('hr_dashboard'))

# Candidates Routes
@app.route('/dashboard/hr/candidates')
def candidate_list():
    if 'user_id' not in session or session['user_type'] != 'hr':
        return redirect(url_for('login'))
    
    user_id = session['user_id']
    
    # Get candidates who applied to this HR's jobs
    candidates = Candidate.query\
        .join(Application, Candidate.id == Application.candidate_id)\
        .join(JobPosting, Application.job_id == JobPosting.id)\
        .filter(JobPosting.hr_id == user_id)\
        .distinct()\
        .order_by(Candidate.created_at.desc())\
        .all()
    
    return render_template('candidates.html',
                         candidates=candidates,
                         candidate_count=len(candidates))

# Applications Routes
@app.route('/dashboard/hr/applications')
def applications():
    if 'user_id' not in session or session['user_type'] != 'hr':
        return redirect(url_for('login'))
    
    user_id = session['user_id']
    
    # Get applications for this HR's jobs
    apps = Application.query\
        .join(JobPosting, Application.job_id == JobPosting.id)\
        .filter(JobPosting.hr_id == user_id)\
        .order_by(Application.applied_at.desc())\
        .all()
    
    return render_template('applications.html',
                         applications=apps,
                         application_count=len(apps))

# Analytics Routes
@app.route('/dashboard/hr/analytics')
def analytics():
    if 'user_id' not in session or session['user_type'] != 'hr':
        return redirect(url_for('login'))
    
    user_id = session['user_id']
    
    # Get analytics data
    total_jobs = JobPosting.query.filter_by(hr_id=user_id).count()
    active_jobs = JobPosting.query.filter_by(hr_id=user_id, status='active').count()
    total_applications = Application.query\
        .join(JobPosting)\
        .filter(JobPosting.hr_id == user_id)\
        .count()
    
    return render_template('analytics.html',
                         total_jobs=total_jobs,
                         active_jobs=active_jobs,
                         total_applications=total_applications)

# ------------------ Job Posting Action Buttons -----------------------------
@app.route('/api/applications/<int:job_id>')
def get_job_applications(job_id):
    if 'user_id' not in session or session['user_type'] != 'hr':
        return jsonify({'error': 'Unauthorized'}), 401
    
    job = JobPosting.query.get_or_404(job_id)
    
    # Check if user owns this job
    if job.hr_id != session['user_id']:
        return jsonify({'error': 'Forbidden'}), 403
    
    # Get applications with candidate details
    applications = Application.query\
        .filter_by(job_id=job_id)\
        .options(db.joinedload(Application.candidate))\
        .order_by(Application.applied_at.desc())\
        .all()
    
    applications_data = []
    for app in applications:
        applications_data.append({
            'id': app.id,
            'candidate_id': app.candidate_id,
            'job_id': app.job_id,
            'status': app.status,
            'applied_at': app.applied_at.strftime('%Y-%m-%d %H:%M:%S'),
            'candidate': {
                'id': app.candidate.id,
                'name': app.candidate.name,
                'email': app.candidate.email,
                'phone': app.candidate.phone,
                'skills': app.candidate.skills,
                'experience': app.candidate.experience,
                'education': app.candidate.education,
                'resume_url': app.candidate.resume_url
            }
        })
    
    return jsonify({
        'job_id': job_id,
        'job_title': job.title,
        'applications': applications_data,
        'total': len(applications_data)
    })

# Error Page - 404
@app.errorhandler(404)
def page_not_found(e):
    return render_template('404_page.html'), 404

if __name__ == '__main__':
    app.run(debug=True)