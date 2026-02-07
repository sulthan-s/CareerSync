// script.js - WITH HOME PAGE ANIMATIONS AND SIGNUP TOGGLE RESTORED

// ===========================================
// GLOBAL UTILITY FUNCTIONS
// ===========================================

// Show notification toast
function showNotification(message, type = 'success') {
    const toast = document.getElementById('notificationToast');
    if (!toast) return;
    
    const toastIcon = toast.querySelector('.toast-icon');
    const toastMessage = document.getElementById('toastMessage');
    
    // Set icon based on type
    if (type === 'success') {
        toastIcon.className = 'fas fa-check-circle toast-icon';
        toastIcon.style.color = 'var(--secondary-color)';
    } else if (type === 'error') {
        toastIcon.className = 'fas fa-exclamation-circle toast-icon';
        toastIcon.style.color = 'var(--danger-color)';
    } else if (type === 'warning') {
        toastIcon.className = 'fas fa-exclamation-triangle toast-icon';
        toastIcon.style.color = 'var(--warning-color)';
    } else {
        toastIcon.className = 'fas fa-info-circle toast-icon';
        toastIcon.style.color = 'var(--primary-color)';
    }
    
    toastMessage.textContent = message;
    toast.classList.add('show');
    
    // Auto-hide after 5 seconds
    setTimeout(() => {
        toast.classList.remove('show');
    }, 5000);
}

// Format dates
function formatDate(dateString) {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
}

// Format job type
function formatJobType(type) {
    const types = {
        'fulltime': 'Full-time',
        'parttime': 'Part-time',
        'contract': 'Contract',
        'remote': 'Remote'
    };
    return types[type] || type;
}

// Format status
function formatStatus(status) {
    return status.charAt(0).toUpperCase() + status.slice(1);
}

// ===========================================
// HOME PAGE ANIMATIONS AND FUNCTIONALITY
// ===========================================

function initHomePage() {
    console.log('Home page initialized');
    
    // Smooth scroll for anchor links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const targetId = this.getAttribute('href');
            if (targetId === '#') return;
            
            const targetElement = document.querySelector(targetId);
            if (targetElement) {
                window.scrollTo({
                    top: targetElement.offsetTop - 80,
                    behavior: 'smooth'
                });
            }
        });
    });
    
    // Navbar background on scroll
    window.addEventListener('scroll', function() {
        const navbar = document.querySelector('.navbar');
        if (navbar) {
            if (window.scrollY > 50) {
                navbar.style.background = 'rgba(15, 23, 42, 0.98)';
                navbar.style.boxShadow = '0 10px 30px rgba(0, 0, 0, 0.2)';
            } else {
                navbar.style.background = 'rgba(15, 23, 42, 0.95)';
                navbar.style.boxShadow = 'none';
            }
        }
    });
    
    // Animate elements on scroll
    const observerOptions = {
        threshold: 0.2
    };
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
            }
        });
    }, observerOptions);
    
    // Observe feature cards
    document.querySelectorAll('.feature-card').forEach(card => {
        card.style.opacity = '0';
        card.style.transform = 'translateY(30px)';
        card.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
        observer.observe(card);
    });
    
    // Observe steps
    document.querySelectorAll('.step').forEach(step => {
        step.style.opacity = '0';
        step.style.transform = 'translateY(30px)';
        step.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
        observer.observe(step);
    });
    
    // Add hover effects for suggestion cards
    document.querySelectorAll('.ai-suggestion a').forEach(link => {
        link.addEventListener('mouseenter', function() {
            this.style.transform = 'translateY(-5px)';
            this.style.boxShadow = '0 10px 20px rgba(0, 0, 0, 0.2)';
        });
        
        link.addEventListener('mouseleave', function() {
            this.style.transform = 'translateY(0)';
            this.style.boxShadow = 'none';
        });
    });
}

// ===========================================
// SIGNUP PAGE TOGGLE FUNCTIONALITY
// ===========================================

function initSignupPage() {
    console.log('Signup page initialized');
    
    // User type selection for signup
    const labels = document.querySelectorAll('.user-type-label');
    const inputs = document.querySelectorAll('input[name="user_type"]');
    
    if (labels.length > 0) {
        labels.forEach(label => {
            label.addEventListener('click', function() {
                // Remove selected class from all labels
                labels.forEach(l => l.classList.remove('user-type-selected'));
                
                // Add selected class to clicked label
                this.classList.add('user-type-selected');
                
                // Trigger corresponding radio button
                const inputId = this.getAttribute('for');
                if (inputId) {
                    const input = document.getElementById(inputId);
                    if (input) {
                        input.checked = true;
                    }
                }
            });
        });
    }
}

// ===========================================
// LOGIN PAGE FUNCTIONALITY
// ===========================================

function initLoginPage() {
    console.log('Login page initialized');
    // Add any login-specific functionality here
}

// ===========================================
// 404 PAGE ANIMATIONS
// ===========================================

function init404Page() {
    console.log('404 page initialized');
    
    // Animate error code on load
    const errorCode = document.querySelector('.error-code');
    if (errorCode) {
        errorCode.style.opacity = '0';
        errorCode.style.transform = 'scale(0.5)';
        
        setTimeout(() => {
            errorCode.style.transition = 'all 0.6s ease-out';
            errorCode.style.opacity = '1';
            errorCode.style.transform = 'scale(1)';
        }, 100);
    }
}

// ===========================================
// MODAL MANAGEMENT SYSTEM
// ===========================================

// Modal elements
let currentJobId = null;
let currentCandidateId = null;
let currentAction = null;
let currentCallback = null;

// Job Preview Modal Functions
//function openJobPreview(jobId, openEdit = false) {
//    currentJobId = jobId;
   
    // Reset modal to preview mode
//    document.getElementById('editJobForm').style.display = 'none';
//    document.getElementById('previewModalTitle').textContent = 'Job Preview';
    
    // Fetch job details
//    fetch(`/api/job/${jobId}`)
//        .then(response => {
//            if (!response.ok) throw new Error('Failed to fetch job details');
//           return response.json();
//        })
//        .then(job => {
//            updateJobPreview(job);
//            document.getElementById('jobPreviewModal').style.display = 'flex';
//            document.body.style.overflow = 'hidden';

//            if (openEdit) {
//                setTimeout(() => {
//                    try { switchToEditMode(); } catch (err) { console.error(err); }
//                }, 50);
//            }
//        })
//        .catch(error => {
//            console.error('Error fetching job:', error);
//            showNotification('Error loading job details', 'error');
//        });
//}

function updateJobPreview(job) {
    // Update basic info
    document.getElementById('previewJobTitle').textContent = job.title;
    document.getElementById('previewCompany').textContent = job.company;
    document.getElementById('previewLocation').innerHTML = `<i class="fas fa-map-marker-alt"></i> ${job.location || 'Not specified'}`;
    document.getElementById('previewSalary').innerHTML = `<i class="fas fa-money-bill-wave"></i> ${job.salary_range || 'Not specified'}`;
    document.getElementById('previewJobType').innerHTML = `<i class="fas fa-briefcase"></i> ${formatJobType(job.job_type)}`;
    document.getElementById('previewStatus').innerHTML = `<i class="fas fa-circle"></i> <span class="status-badge ${job.status}">${formatStatus(job.status)}</span>`;
    
    // Update description and requirements
    document.getElementById('previewDescription').textContent = job.description;
    document.getElementById('previewRequirements').textContent = job.requirements;
    
    // Update dates and ID
    document.getElementById('previewPostedDate').textContent = formatDate(job.created_at);
    document.getElementById('previewUpdatedDate').textContent = formatDate(job.updated_at);
    document.getElementById('previewJobId').textContent = job.id;
    
    // Set up toggle status button
    const toggleBtn = document.getElementById('toggleStatusBtn');
    if (toggleBtn) {
        toggleBtn.innerHTML = job.status === 'active' 
            ? '<i class="fas fa-pause"></i> Close Job' 
            : '<i class="fas fa-play"></i> Activate Job';
    }
    
    // Fetch application count
    const previewApplications = document.getElementById('previewApplications');
    if (previewApplications) {
        previewApplications.textContent = '0';
    }
    
    // Pre-fill edit form
    prefillEditForm(job);
}

function prefillEditForm(job) {
    const editJobTitle = document.getElementById('editJobTitle');
    if (editJobTitle) editJobTitle.value = job.title;
    
    const editCompany = document.getElementById('editCompany');
    if (editCompany) editCompany.value = job.company;
    
    const editLocation = document.getElementById('editLocation');
    if (editLocation) editLocation.value = job.location || '';
    
    const editSalaryRange = document.getElementById('editSalaryRange');
    if (editSalaryRange) editSalaryRange.value = job.salary_range || '';
    
    const editDescription = document.getElementById('editDescription');
    if (editDescription) editDescription.value = job.description;
    
    const editRequirements = document.getElementById('editRequirements');
    if (editRequirements) editRequirements.value = job.requirements;
    
    // Set job type radio
    document.querySelectorAll('input[name="job_type"]').forEach(radio => {
        radio.checked = radio.value === job.job_type;
    });
    
    // Set status radio
    document.querySelectorAll('input[name="status"]').forEach(radio => {
        radio.checked = radio.value === job.status;
    });
}

function switchToEditMode() {
    const previewModalTitle = document.getElementById('previewModalTitle');
    if (previewModalTitle) previewModalTitle.textContent = 'Edit Job';
    
    const previewContent = document.querySelector('.preview-content');
    if (previewContent) previewContent.style.display = 'none';
    
    const editJobForm = document.getElementById('editJobForm');
    if (editJobForm) editJobForm.style.display = 'block';
}

function switchToPreviewMode() {
    const previewModalTitle = document.getElementById('previewModalTitle');
    if (previewModalTitle) previewModalTitle.textContent = 'Job Preview';
    
    const editJobForm = document.getElementById('editJobForm');
    if (editJobForm) editJobForm.style.display = 'none';
    
    const previewContent = document.querySelector('.preview-content');
    if (previewContent) previewContent.style.display = 'block';
    
    // Reload job data
    if (currentJobId) {
        openJobPreview(currentJobId);
    }
}

// Candidate Preview Modal Functions
function openCandidatePreview(candidateId) {
    currentCandidateId = candidateId;
    
    // Reset modal to preview mode
    const editCandidateForm = document.getElementById('editCandidateForm');
    if (editCandidateForm) editCandidateForm.style.display = 'none';
    
    const candidateModalTitle = document.getElementById('candidateModalTitle');
    if (candidateModalTitle) candidateModalTitle.textContent = 'Candidate Profile';
    
    // Fetch candidate details
    fetch(`/api/candidate/${candidateId}`)
        .then(response => {
            if (!response.ok) throw new Error('Failed to fetch candidate details');
            return response.json();
        })
        .then(candidate => {
            updateCandidatePreview(candidate);
            const candidatePreviewModal = document.getElementById('candidatePreviewModal');
            if (candidatePreviewModal) {
                candidatePreviewModal.style.display = 'flex';
                document.body.style.overflow = 'hidden';
            }
        })
        .catch(error => {
            console.error('Error fetching candidate:', error);
            showNotification('Error loading candidate profile', 'error');
        });
}

function updateCandidatePreview(candidate) {
    // Update basic info
    const candidateAvatar = document.getElementById('candidateAvatar');
    if (candidateAvatar) {
        candidateAvatar.textContent = candidate.name.split(' ').map(n => n[0]).join('').toUpperCase();
    }
    
    const candidateName = document.getElementById('candidateName');
    if (candidateName) candidateName.textContent = candidate.name;
    
    const candidateEmail = document.getElementById('candidateEmail');
    if (candidateEmail) candidateEmail.textContent = candidate.email;
    
    const candidatePhone = document.getElementById('candidatePhone');
    if (candidatePhone) {
        candidatePhone.innerHTML = `<i class="fas fa-phone"></i> ${candidate.phone || 'Not specified'}`;
    }
    
    const candidateExperience = document.getElementById('candidateExperience');
    if (candidateExperience) {
        candidateExperience.innerHTML = `<i class="fas fa-briefcase"></i> ${candidate.experience || 'Not specified'}`;
    }
    
    const candidateEducation = document.getElementById('candidateEducation');
    if (candidateEducation) {
        candidateEducation.innerHTML = `<i class="fas fa-graduation-cap"></i> ${candidate.education || 'Not specified'}`;
    }
    
    // Update skills
    const skillsContainer = document.getElementById('candidateSkills');
    if (skillsContainer) {
        skillsContainer.innerHTML = '';
        if (candidate.skills) {
            const skills = candidate.skills.split(',').map(skill => skill.trim());
            skills.forEach(skill => {
                if (skill) {
                    const skillTag = document.createElement('span');
                    skillTag.className = 'skill-tag';
                    skillTag.textContent = skill;
                    skillsContainer.appendChild(skillTag);
                }
            });
        } else {
            skillsContainer.innerHTML = '<span class="skill-tag">No skills specified</span>';
        }
    }
    
    // Update dates and ID
    const candidateMemberSince = document.getElementById('candidateMemberSince');
    if (candidateMemberSince) candidateMemberSince.textContent = formatDate(candidate.created_at);
    
    const candidateIdElement = document.getElementById('candidateId');
    if (candidateIdElement) candidateIdElement.textContent = candidate.id;
    
    // Update last active
    const lastActive = document.getElementById('lastActive');
    if (lastActive) lastActive.textContent = formatDate(candidate.created_at);
    
    // Pre-fill edit form
    prefillCandidateEditForm(candidate);
}

function prefillCandidateEditForm(candidate) {
    const editCandidateName = document.getElementById('editCandidateName');
    if (editCandidateName) editCandidateName.value = candidate.name;
    
    const editCandidateEmail = document.getElementById('editCandidateEmail');
    if (editCandidateEmail) editCandidateEmail.value = candidate.email;
    
    const editCandidatePhone = document.getElementById('editCandidatePhone');
    if (editCandidatePhone) editCandidatePhone.value = candidate.phone || '';
    
    const editCandidateExperience = document.getElementById('editCandidateExperience');
    if (editCandidateExperience) editCandidateExperience.value = candidate.experience || '';
    
    const editCandidateEducation = document.getElementById('editCandidateEducation');
    if (editCandidateEducation) editCandidateEducation.value = candidate.education || '';
    
    const editCandidateResume = document.getElementById('editCandidateResume');
    if (editCandidateResume) editCandidateResume.value = candidate.resume_url || '';
    
    const editCandidateSkills = document.getElementById('editCandidateSkills');
    if (editCandidateSkills) editCandidateSkills.value = candidate.skills || '';
}

function switchToCandidateEditMode() {
    const candidateModalTitle = document.getElementById('candidateModalTitle');
    if (candidateModalTitle) candidateModalTitle.textContent = 'Edit Candidate';
    
    const previewContent = document.querySelector('.preview-content');
    if (previewContent) previewContent.style.display = 'none';
    
    const editCandidateForm = document.getElementById('editCandidateForm');
    if (editCandidateForm) editCandidateForm.style.display = 'block';
}

function switchToCandidatePreviewMode() {
    const candidateModalTitle = document.getElementById('candidateModalTitle');
    if (candidateModalTitle) candidateModalTitle.textContent = 'Candidate Profile';
    
    const editCandidateForm = document.getElementById('editCandidateForm');
    if (editCandidateForm) editCandidateForm.style.display = 'none';
    
    const previewContent = document.querySelector('.preview-content');
    if (previewContent) previewContent.style.display = 'block';
    
    // Reload candidate data
    if (currentCandidateId) {
        openCandidatePreview(currentCandidateId);
    }
}

// Confirmation Modal Functions
function showConfirmation(title, message, callback) {
    currentAction = title.toLowerCase().replace(' ', '_');
    currentCallback = callback;
    
    const confirmationTitle = document.getElementById('confirmationTitle');
    if (confirmationTitle) confirmationTitle.textContent = title;
    
    const confirmationMessage = document.getElementById('confirmationMessage');
    if (confirmationMessage) confirmationMessage.textContent = message;
    
    const confirmationModal = document.getElementById('confirmationModal');
    if (confirmationModal) {
        confirmationModal.style.display = 'flex';
        document.body.style.overflow = 'hidden';
    }
}

function closeConfirmationModal() {
    const confirmationModal = document.getElementById('confirmationModal');
    if (confirmationModal) {
        confirmationModal.style.display = 'none';
        document.body.style.overflow = 'auto';
    }
    currentAction = null;
    currentCallback = null;
}

// ===========================================
// DASHBOARD SPECIFIC FUNCTIONS
// ===========================================

function initDashboard() {
    console.log('Dashboard initialized');
    
    // Set current date in dashboard
    const currentDateElement = document.getElementById('current-date');
    if (currentDateElement) {
        currentDateElement.textContent = new Date().toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    }
    
    // Update progress circles
    updateProgressCircles();
    
    // Post New Job Modal
    const postJobBtns = document.querySelectorAll('.post-job-btn');
    const jobModal = document.getElementById('jobModal');
    
    if (postJobBtns && postJobBtns.length && jobModal) {
        postJobBtns.forEach(btn => {
            btn.addEventListener('click', function() {
                jobModal.style.display = 'flex';
                document.body.style.overflow = 'hidden';
            });
        });
    }
    
    // Close job modal
    const closeJobModal = document.getElementById('closeJobModal');
    if (closeJobModal) {
        closeJobModal.addEventListener('click', function() {
            if (jobModal) {
                jobModal.style.display = 'none';
                document.body.style.overflow = 'auto';
            }
            const postJobForm = document.getElementById('postJobForm');
            if (postJobForm) {
                postJobForm.reset();
            }
        });
    }
    
    // Cancel job
    const cancelJob = document.getElementById('cancelJob');
    if (cancelJob) {
        cancelJob.addEventListener('click', function() {
            if (jobModal) {
                jobModal.style.display = 'none';
                document.body.style.overflow = 'auto';
            }
            const postJobForm = document.getElementById('postJobForm');
            if (postJobForm) {
                postJobForm.reset();
            }
        });
    }
    
    // Form validation and submission
    const postJobForm = document.getElementById('postJobForm');
    if (postJobForm) {
        postJobForm.addEventListener('submit', function(e) {
            // Form validation
            const requiredFields = this.querySelectorAll('[required]');
            let isValid = true;
            
            requiredFields.forEach(field => {
                if (!field.value.trim()) {
                    isValid = false;
                    field.style.borderColor = '#ef4444';
                    if (!field.nextElementSibling || !field.nextElementSibling.classList.contains('error-message')) {
                        const errorMsg = document.createElement('div');
                        errorMsg.className = 'error-message';
                        errorMsg.style.color = '#ef4444';
                        errorMsg.style.fontSize = '0.75rem';
                        errorMsg.style.marginTop = '0.25rem';
                        errorMsg.textContent = 'This field is required';
                        field.parentNode.insertBefore(errorMsg, field.nextSibling);
                    }
                } else {
                    field.style.borderColor = '';
                    if (field.nextElementSibling && field.nextElementSibling.classList.contains('error-message')) {
                        field.nextElementSibling.remove();
                    }
                }
            });
            
            if (!isValid) {
                e.preventDefault();
            } else {
                // Optional: Show loading state
                const submitBtn = this.querySelector('button[type="submit"]');
                const originalText = submitBtn.innerHTML;
                submitBtn.innerHTML = '<span class="loading-spinner" aria-hidden="true"></span> Posting...';
                submitBtn.disabled = true;
                
                // Simulate processing
                setTimeout(() => {
                    submitBtn.innerHTML = originalText;
                    submitBtn.disabled = false;
                }, 1500);
            }
        });
    }
    
    // Job selection for analysis
    const jobSelect = document.getElementById('selectJobForAnalysis');
    if (jobSelect) {
        jobSelect.addEventListener('change', function() {
            const jobTitle = this.options[this.selectedIndex].text;
            console.log('Selected job for analysis:', jobTitle);
            
            const score = Math.floor(Math.random() * 30) + 70;
            const circleProgress = document.querySelector('.circle-progress');
            if (circleProgress) circleProgress.setAttribute('data-progress', score);
            
            const scoreText = document.querySelector('.score-text');
            if (scoreText) scoreText.textContent = `${score}%`;
            
            updateProgressCircles();
        });
    }
}

// Update progress circles
function updateProgressCircles() {
    const progressCircles = document.querySelectorAll('.circle-progress');
    progressCircles.forEach(circle => {
        const progress = circle.getAttribute('data-progress') || 92;
        circle.style.background = `conic-gradient(var(--primary-color) 0% ${progress}%, rgba(59, 130, 246, 0.2) ${progress}% 100%)`;
    });
}

// ===========================================
// GLOBAL EVENT LISTENERS
// ===========================================

document.addEventListener('DOMContentLoaded', function() {
    console.log('CareerSync initialized');
    
    // Initialize based on page
    if (document.querySelector('.hero')) {
        initHomePage();
    }
    
    if (document.querySelector('.login-container')) {
        // Check if it's signup page (has user-type-toggle)
        if (document.querySelector('.user-type-toggle')) {
            initSignupPage();
        } else {
            initLoginPage();
        }
    }
    
    if (document.querySelector('.dashboard-container')) {
        initDashboard();
    }
    
    if (document.querySelector('.error-page')) {
        init404Page();
    }
    
    // Dashboard Modal Event Listeners
    const closePreviewModal = document.getElementById('closePreviewModal');
    if (closePreviewModal) {
        closePreviewModal.addEventListener('click', function() {
            const jobPreviewModal = document.getElementById('jobPreviewModal');
            if (jobPreviewModal) {
                jobPreviewModal.style.display = 'none';
                document.body.style.overflow = 'auto';
                currentJobId = null;
            }
        });
    }
    
    const editJobBtn = document.getElementById('editJobBtn');
    if (editJobBtn) {
        editJobBtn.addEventListener('click', switchToEditMode);
    }
    
    const cancelEditBtn = document.getElementById('cancelEditBtn');
    if (cancelEditBtn) {
        cancelEditBtn.addEventListener('click', switchToPreviewMode);
    }
    
    const deleteJobBtn = document.getElementById('deleteJobBtn');
    if (deleteJobBtn) {
        deleteJobBtn.addEventListener('click', function() {
            showConfirmation('Delete Job', 'Are you sure you want to delete this job? This action cannot be undone.', () => {
                fetch(`/api/job/${currentJobId}`, {
                    method: 'DELETE'
                })
                .then(response => {
                    if (!response.ok) throw new Error('Failed to delete job');
                    return response.json();
                })
                .then(result => {
                    showNotification('Job deleted successfully!', 'success');
                    const jobPreviewModal = document.getElementById('jobPreviewModal');
                    if (jobPreviewModal) {
                        jobPreviewModal.style.display = 'none';
                        document.body.style.overflow = 'auto';
                    }
                    
                    if (window.location.pathname.includes('job-postings')) {
                        location.reload();
                    }
                })
                .catch(error => {
                    console.error('Error deleting job:', error);
                    showNotification('Error deleting job', 'error');
                });
            });
        });
    }
    
    const toggleStatusBtn = document.getElementById('toggleStatusBtn');
    if (toggleStatusBtn) {
        toggleStatusBtn.addEventListener('click', function() {
            fetch(`/api/job/${currentJobId}/toggle-status`, {
                method: 'POST'
            })
            .then(response => {
                if (!response.ok) throw new Error('Failed to toggle status');
                return response.json();
            })
            .then(result => {
                showNotification(`Job status updated to ${result.status}`, 'success');
                openJobPreview(currentJobId);
            })
            .catch(error => {
                console.error('Error toggling status:', error);
                showNotification('Error updating job status', 'error');
            });
        });
    }
    
    const editJobForm = document.getElementById('editJobForm');
    if (editJobForm) {
        editJobForm.addEventListener('submit', function(e) {
            e.preventDefault();
            const formData = new FormData(this);
            const data = Object.fromEntries(formData.entries());
            
            const saveBtn = document.getElementById('saveJobBtn');
            const originalText = saveBtn.innerHTML;
            saveBtn.innerHTML = '<span class="loading-spinner"></span> Saving...';
            saveBtn.disabled = true;
            
            fetch(`/api/job/${currentJobId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(data)
            })
            .then(response => {
                if (!response.ok) throw new Error('Failed to update job');
                return response.json();
            })
            .then(result => {
                showNotification('Job updated successfully!', 'success');
                switchToPreviewMode();
                
                if (window.location.pathname.includes('job-postings')) {
                    location.reload();
                }
            })
            .catch(error => {
                console.error('Error updating job:', error);
                showNotification('Error updating job', 'error');
            })
            .finally(() => {
                saveBtn.innerHTML = originalText;
                saveBtn.disabled = false;
            });
        });
    }
    
    // Candidate Preview Modal Events
    const closeCandidatePreview = document.getElementById('closeCandidatePreviewModal');
    if (closeCandidatePreview) {
        closeCandidatePreview.addEventListener('click', function() {
            const candidatePreviewModal = document.getElementById('candidatePreviewModal');
            if (candidatePreviewModal) {
                candidatePreviewModal.style.display = 'none';
                document.body.style.overflow = 'auto';
                currentCandidateId = null;
            }
        });
    }
    
    const editCandidateBtn = document.getElementById('editCandidateBtn');
    if (editCandidateBtn) {
        editCandidateBtn.addEventListener('click', switchToCandidateEditMode);
    }
    
    const cancelCandidateEditBtn = document.getElementById('cancelCandidateEditBtn');
    if (cancelCandidateEditBtn) {
        cancelCandidateEditBtn.addEventListener('click', switchToCandidatePreviewMode);
    }
    
    const deleteCandidateBtn = document.getElementById('deleteCandidateBtn');
    if (deleteCandidateBtn) {
        deleteCandidateBtn.addEventListener('click', function() {
            showConfirmation('Delete Candidate', 'Are you sure you want to delete this candidate? This action cannot be undone.', () => {
                fetch(`/api/candidate/${currentCandidateId}`, {
                    method: 'DELETE'
                })
                .then(response => {
                    if (!response.ok) throw new Error('Failed to delete candidate');
                    return response.json();
                })
                .then(result => {
                    showNotification('Candidate deleted successfully!', 'success');
                    const candidatePreviewModal = document.getElementById('candidatePreviewModal');
                    if (candidatePreviewModal) {
                        candidatePreviewModal.style.display = 'none';
                        document.body.style.overflow = 'auto';
                    }
                    
                    if (window.location.pathname.includes('candidates')) {
                        location.reload();
                    }
                })
                .catch(error => {
                    console.error('Error deleting candidate:', error);
                    showNotification('Error deleting candidate', 'error');
                });
            });
        });
    }
    
    const editCandidateForm = document.getElementById('editCandidateForm');
    if (editCandidateForm) {
        editCandidateForm.addEventListener('submit', function(e) {
            e.preventDefault();
            const formData = new FormData(this);
            const data = Object.fromEntries(formData.entries());
            
            const saveBtn = document.getElementById('saveCandidateBtn');
            const originalText = saveBtn.innerHTML;
            saveBtn.innerHTML = '<span class="loading-spinner"></span> Saving...';
            saveBtn.disabled = true;
            
            fetch(`/api/candidate/${currentCandidateId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(data)
            })
            .then(response => {
                if (!response.ok) throw new Error('Failed to update candidate');
                return response.json();
            })
            .then(result => {
                showNotification('Candidate updated successfully!', 'success');
                switchToCandidatePreviewMode();
            })
            .catch(error => {
                console.error('Error updating candidate:', error);
                showNotification('Error updating candidate', 'error');
            })
            .finally(() => {
                saveBtn.innerHTML = originalText;
                saveBtn.disabled = false;
            });
        });
    }
    
    // Confirmation Modal Events
    const closeConfirmationBtn = document.getElementById('closeConfirmationModal');
    if (closeConfirmationBtn) {
        closeConfirmationBtn.addEventListener('click', closeConfirmationModal);
    }
    
    const cancelConfirmationBtn = document.getElementById('cancelConfirmationBtn');
    if (cancelConfirmationBtn) {
        cancelConfirmationBtn.addEventListener('click', closeConfirmationModal);
    }
    
    const confirmActionBtn = document.getElementById('confirmActionBtn');
    if (confirmActionBtn) {
        confirmActionBtn.addEventListener('click', function() {
            if (currentCallback) {
                currentCallback();
            }
            closeConfirmationModal();
        });
    }
    
    // Global modal close handlers
    window.addEventListener('click', function(event) {
        // Job Preview Modal
        const jobPreviewModal = document.getElementById('jobPreviewModal');
        if (jobPreviewModal && event.target === jobPreviewModal) {
            jobPreviewModal.style.display = 'none';
            document.body.style.overflow = 'auto';
            currentJobId = null;
        }
        
        // Candidate Preview Modal
        const candidatePreviewModal = document.getElementById('candidatePreviewModal');
        if (candidatePreviewModal && event.target === candidatePreviewModal) {
            candidatePreviewModal.style.display = 'none';
            document.body.style.overflow = 'auto';
            currentCandidateId = null;
        }
        
        // Confirmation Modal
        const confirmationModal = document.getElementById('confirmationModal');
        if (confirmationModal && event.target === confirmationModal) {
            closeConfirmationModal();
        }
        
        // Job Modal (dashboard)
        const jobModal = document.getElementById('jobModal');
        if (jobModal && event.target === jobModal) {
            jobModal.style.display = 'none';
            document.body.style.overflow = 'auto';
            const postJobForm = document.getElementById('postJobForm');
            if (postJobForm) postJobForm.reset();
        }
    });
    
    // Keyboard shortcuts
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            // Close all modals
            const modals = [
                'jobPreviewModal',
                'candidatePreviewModal',
                'confirmationModal',
                'jobModal'
            ];
            
            modals.forEach(modalId => {
                const modal = document.getElementById(modalId);
                if (modal && modal.style.display === 'flex') {
                    modal.style.display = 'none';
                    document.body.style.overflow = 'auto';
                }
            });
        }
    });
    
    window.viewCandidateProfile = function(candidateId) {
        openCandidatePreview(candidateId);
    };
});