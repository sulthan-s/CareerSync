// jobs.js - SEPARATE FILE FOR JOBS PAGE ONLY - FIXED

// Global variables for jobs page
let savedJobs = window.savedJobIds || [];
let appliedJobs = window.appliedJobIds || [];
let activeFilters = {
    jobType: '',
    location: '',
    salary: '',
    search: ''
};

// Initialize jobs page
function initJobsPage() {
    console.log('Jobs listing page initialized');
    
    // Initialize savedJobs from window variable
    savedJobs = window.savedJobIds || [];
    appliedJobs = window.appliedJobIds || [];
    
    // Initialize event listeners
    initJobsEventListeners();
    
    // Update saved job buttons
    updateSavedJobButtons();
    
    // Update applied job buttons
    updateAppliedJobButtons();
    
    // Initialize file upload
    initFileUpload();
    
    // Set initial showing count
    const jobCards = document.querySelectorAll('.job-card');
    document.getElementById('showingCount').textContent = jobCards.length;
    
    // Add toast styles
    addToastStyles();
}

function initJobsEventListeners() {
    // Search input with debounce
    const searchInput = document.getElementById('jobSearch');
    let searchTimeout;
    
    if (searchInput) {
        searchInput.addEventListener('input', function() {
            clearTimeout(searchTimeout);
            searchTimeout = setTimeout(() => {
                activeFilters.search = this.value.toLowerCase();
                filterJobs();
            }, 300);
        });
        
        searchInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                activeFilters.search = this.value.toLowerCase();
                filterJobs();
            }
        });
    }
    
    // Filter change listeners
    document.getElementById('jobTypeFilter')?.addEventListener('change', function() {
        activeFilters.jobType = this.value;
        filterJobs();
    });
    
    document.getElementById('locationFilter')?.addEventListener('change', function() {
        activeFilters.location = this.value;
        filterJobs();
    });
    
    document.getElementById('salaryFilter')?.addEventListener('change', function() {
        activeFilters.salary = this.value;
        filterJobs();
    });
    
    // Clear filters button
    document.querySelector('.clear-filters-btn')?.addEventListener('click', clearFilters);
    
    // Job modal close button
    const closeJobModal = document.getElementById('closeJobModal');
    if (closeJobModal) {
        closeJobModal.addEventListener('click', closeJobModalFunc);
    }
    
    // Apply modal close button
    const closeApplyModal = document.getElementById('closeApplyModal');
    if (closeApplyModal) {
        closeApplyModal.addEventListener('click', closeApplyModalFunc);
    }
    
    // Close modals when clicking outside
    window.addEventListener('click', function(event) {
        const jobModal = document.getElementById('jobDetailsModal');
        const applyModal = document.getElementById('applyModal');
        
        if (event.target === jobModal) {
            closeJobModalFunc();
        }
        if (event.target === applyModal) {
            closeApplyModalFunc();
        }
    });
    
    // Keyboard shortcuts
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            closeJobModalFunc();
            closeApplyModalFunc();
        }
    });
    
    // Apply form submission
    const applyForm = document.getElementById('applyForm');
    if (applyForm) {
        applyForm.addEventListener('submit', function(e) {
            e.preventDefault();
            submitApplication();
        });
    }

    // Table buttons (for server-rendered job_postings table)
    initTableButtons();
}

// Initialize buttons in server-rendered tables (job_postings.html)
function initTableButtons() {
    // View applications
    document.querySelectorAll('.view-applications-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const jobId = this.getAttribute('data-job-id') || this.dataset.jobId;
            if (jobId) openApplicationsModal(parseInt(jobId, 10));
        });
    });

    // Edit job button -> open preview modal in edit mode
    document.querySelectorAll('.edit-job-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const jobId = this.getAttribute('data-job-id') || this.dataset.jobId;
            if (jobId) {
                // reuse preview modal flow from script.js
                try { openJobPreview(parseInt(jobId, 10), true); } catch (e) { console.error(e); }
            }
        });
    });

    // Delete job button -> show confirmation and call API
    document.querySelectorAll('.delete-job-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const jobId = this.getAttribute('data-job-id') || this.dataset.jobId;
            if (!jobId) return;
            // populate and show confirmation modal
            const confirmMsg = document.getElementById('confirmationMessage');
            if (confirmMsg) confirmMsg.textContent = 'Are you sure you want to delete this job? This action cannot be undone.';
            const confirmBtn = document.getElementById('confirmActionBtn');
            if (confirmBtn) {
                confirmBtn.onclick = async function() {
                    try {
                        const res = await fetch(`/api/job/${jobId}`, { method: 'DELETE' });
                        const data = await res.json();
                        if (res.ok) {
                            showToast(data.message || 'Job deleted', 'success');
                            location.reload();
                        } else {
                            showToast(data.error || 'Delete failed', 'error');
                        }
                    } catch (err) {
                        console.error(err);
                        showToast('Delete failed', 'error');
                    }
                };
            }
            const confirmationModal = document.getElementById('confirmationModal');
            if (confirmationModal) {
                confirmationModal.style.display = 'flex';
                document.body.style.overflow = 'hidden';
            }
        });
    });

    // Close applications modal
    const closeApps = document.getElementById('closeApplicationsModal');
    if (closeApps) closeApps.addEventListener('click', function() {
        const modal = document.getElementById('applicationsModal');
        if (modal) modal.style.display = 'none';
        document.body.style.overflow = 'auto';
    });
}

// Open and populate applications modal for a job
async function openApplicationsModal(jobId) {
    const titleEl = document.getElementById('applicationsJobTitle');
    const totalCountEl = document.getElementById('totalApplicationsCount');
    const activeCountEl = document.getElementById('activeApplicationsCount');
    const tbody = document.getElementById('applicationsTableBody');

    if (titleEl) titleEl.textContent = 'Loading job details...';
    if (tbody) tbody.innerHTML = `<tr><td colspan="6" style="text-align:center;padding:2rem;"><div class="simple-loading"><span class="loading-spinner large" aria-hidden="true"></span><p>Loading applications...</p></div></td></tr>`;

    try {
        const res = await fetch(`/api/job/${jobId}/applications`);
        if (!res.ok) throw new Error('Failed to fetch applications');
        const data = await res.json();

        // Update header
        const jobRes = await fetch(`/api/job/${jobId}/details`);
        const jobData = jobRes.ok ? await jobRes.json() : null;
        if (titleEl) titleEl.textContent = jobData ? jobData.title : `Job ${jobId}`;

        // Stats
        if (totalCountEl) totalCountEl.textContent = `${data.count || (data.applications || []).length} applications`;
        if (activeCountEl) activeCountEl.textContent = `${(data.applications || []).filter(a => a.status !== 'rejected').length} active`;

        // Populate table
        if (tbody) {
            const apps = data.applications || [];
            if (apps.length === 0) {
                tbody.innerHTML = `<tr><td colspan="6" style="text-align:center;padding:2rem;">No applications yet.</td></tr>`;
            } else {
                tbody.innerHTML = apps.map(a => `
                    <tr>
                        <td>${escapeHtml(a.candidate_name || '—')}</td>
                        <td>${escapeHtml(a.email || '—')}</td>
                        <td>${escapeHtml(a.phone || '—')}</td>
                        <td>${escapeHtml(a.applied_at || '—')}</td>
                        <td>${escapeHtml(a.status || '—')}</td>
                        <td><button class="btn btn-outline" onclick="openCandidateFromApp(${a.candidate_id || 'null'})">View</button></td>
                    </tr>
                `).join('');
            }
        }

        const modal = document.getElementById('applicationsModal');
        if (modal) {
            modal.style.display = 'flex';
            document.body.style.overflow = 'hidden';
        }

    } catch (err) {
        console.error('Error loading applications:', err);
        if (tbody) tbody.innerHTML = `<tr><td colspan="6" style="text-align:center;padding:2rem;">Error loading applications</td></tr>`;
    }
}

// Search jobs
function searchJobs() {
    const searchInput = document.getElementById('jobSearch');
    if (searchInput) {
        activeFilters.search = searchInput.value.toLowerCase();
        filterJobs();
    }
}

// Filter jobs
async function filterJobs() {
    // Update active filters from form
    activeFilters.jobType = document.getElementById('jobTypeFilter')?.value || '';
    activeFilters.location = document.getElementById('locationFilter')?.value || '';
    activeFilters.salary = document.getElementById('salaryFilter')?.value || '';
    
    // Show loading state
    document.getElementById('jobsList').style.display = 'none';
    document.getElementById('loadingState').style.display = 'flex';
    document.getElementById('noResults').style.display = 'none';
    document.getElementById('paginationWrapper').style.display = 'none';
    
    try {
        // Build query string
        const params = new URLSearchParams();
        if (activeFilters.search) params.append('search', activeFilters.search);
        if (activeFilters.jobType) params.append('type', activeFilters.jobType);
        if (activeFilters.location) params.append('location', activeFilters.location);
        if (activeFilters.salary) params.append('salary', activeFilters.salary);
        
        const response = await fetch(`/api/jobs?${params.toString()}`);
        if (!response.ok) throw new Error('Failed to fetch jobs');
        
        const data = await response.json();
        
        // Hide loading state
        document.getElementById('loadingState').style.display = 'none';
        
        // Update job list with new data
        updateJobList(data.jobs);
        
        const count = data.count || data.jobs?.length || 0;
        document.getElementById('showingCount').textContent = count;
        
        // Show/hide no results
        if (count === 0) {
            document.getElementById('noResults').style.display = 'block';
        } else {
            document.getElementById('noResults').style.display = 'none';
            document.getElementById('jobsList').style.display = 'grid';
        }
        
        // Update active filters display
        updateActiveFiltersDisplay();
        
    } catch (error) {
        console.error('Error fetching jobs:', error);
        document.getElementById('loadingState').style.display = 'none';
        document.getElementById('noResults').style.display = 'block';
        const noResultsEl = document.getElementById('noResults');
        noResultsEl.querySelector('h3').textContent = 'Error loading jobs';
        noResultsEl.querySelector('p').textContent = 'Please try again later';
    }
}

// Update job list with new data
function updateJobList(jobs) {
    const jobsList = document.getElementById('jobsList');
    if (!jobsList || !jobs) return;
    
    if (jobs.length === 0) {
        jobsList.innerHTML = `
            <div class="no-results" style="display: block;">
                <i class="fas fa-search fa-3x"></i>
                <h3>No jobs found</h3>
                <p>Try adjusting your search criteria or clear filters</p>
                <button class="btn btn-outline mt-3" onclick="clearFilters()">
                    <i class="fas fa-redo"></i> Clear Filters
                </button>
            </div>
        `;
        return;
    }
    
    let html = '';
    jobs.forEach(job => {
        const isSaved = savedJobs.includes(job.id);
        const isApplied = appliedJobs.includes(job.id);
        
        html += `
            <div class="job-card" data-job-id="${job.id}" 
                 data-type="${job.job_type}" 
                 data-location="${(job.location || '').toLowerCase()}"
                 data-salary="${job.salary_range || ''}"
                 data-remote="${job.job_type === 'remote' ? 'true' : 'false'}">
                <div class="job-card-header">
                    <div class="job-meta-badges">
                        <span class="job-type-badge ${job.job_type}">
                            <i class="fas fa-${job.job_type === 'remote' ? 'home' : 'briefcase'}"></i> 
                            ${formatJobType(job.job_type)}
                        </span>
                        
                        ${job.salary_range ? `
                        <span class="salary-badge">
                            <i class="fas fa-money-bill-wave"></i> ${job.salary_range}
                        </span>
                        ` : ''}
                    </div>
                    
                    <button class="btn btn-outline btn-sm save-job-btn" 
                            onclick="toggleSaveJob(${job.id})" 
                            data-job-id="${job.id}"
                            id="saveBtn${job.id}">
                        ${isSaved ? 
                            '<i class="fas fa-bookmark"></i> Saved' : 
                            '<i class="far fa-bookmark"></i> Save'}
                    </button>
                </div>
                
                <div class="job-card-body">
                    <h3 class="job-title">${escapeHtml(job.title)}</h3>
                    
                    <div class="company-info">
                        <div class="company-logo">
                            <i class="fas fa-building"></i>
                        </div>
                        <div class="company-details">
                            <div class="company-name">${escapeHtml(job.company)}</div>
                            <div class="job-location">
                                <i class="fas fa-map-marker-alt"></i>
                                <span>${escapeHtml(job.location || 'Location not specified')}</span>
                            </div>
                        </div>
                    </div>
                    
                    <p class="job-description">
                        ${escapeHtml(job.description?.substring(0, 200) || '')}${job.description?.length > 200 ? '...' : ''}
                    </p>
                    
                    ${job.requirements ? `
                    <div class="job-tags">
                        ${job.requirements.split(',').slice(0, 4).map(skill => `
                            <span class="tag">
                                <i class="fas fa-tag"></i> ${escapeHtml(skill.trim())}
                            </span>
                        `).join('')}
                    </div>
                    ` : ''}
                    
                    <div class="job-meta">
                        <div class="meta-item">
                            <i class="fas fa-clock"></i>
                            <span>Posted ${formatJobDate(job.created_at)}</span>
                        </div>
                        <div class="meta-item">
                            <i class="fas fa-users"></i>
                            <span>${job.applications || 0} applications</span>
                        </div>
                    </div>
                </div>
                
                <div class="job-card-footer">
                    <button class="btn btn-outline" onclick="viewJobDetails(${job.id})">
                        <i class="fas fa-eye"></i> View Details
                    </button>
                    
                    ${window.isLoggedIn === 'true' ? 
                        window.userType === '"jobseeker"' ? 
                            isApplied ? 
                                `<button class="btn btn-secondary" disabled id="applyBtn${job.id}">
                                    <i class="fas fa-check"></i> Applied
                                </button>` :
                                `<button class="btn btn-primary" onclick="applyForJob(${job.id})" id="applyBtn${job.id}">
                                    <i class="fas fa-paper-plane"></i> Apply Now
                                </button>`
                            : `<button class="btn btn-outline" disabled>
                                    <i class="fas fa-user-tie"></i> HR Account
                               </button>`
                        : `<button class="btn btn-primary" onclick="loginToApply(${job.id})">
                                <i class="fas fa-sign-in-alt"></i> Login to Apply
                           </button>`}
                </div>
            </div>
        `;
    });
    
    jobsList.innerHTML = html;
    jobsList.style.display = 'grid';
}

// Clear all filters
function clearFilters() {
    // Reset form inputs
    const searchInput = document.getElementById('jobSearch');
    const jobTypeFilter = document.getElementById('jobTypeFilter');
    const locationFilter = document.getElementById('locationFilter');
    const salaryFilter = document.getElementById('salaryFilter');
    
    if (searchInput) searchInput.value = '';
    if (jobTypeFilter) jobTypeFilter.value = '';
    if (locationFilter) locationFilter.value = '';
    if (salaryFilter) salaryFilter.value = '';
    
    // Reset active filters
    activeFilters = {
        jobType: '',
        location: '',
        salary: '',
        search: ''
    };
    
    // Hide active filters display
    const activeFiltersEl = document.getElementById('activeFilters');
    if (activeFiltersEl) activeFiltersEl.style.display = 'none';
    
    // Reload all jobs
    location.reload();
}

// Update active filters display
function updateActiveFiltersDisplay() {
    const activeFiltersEl = document.getElementById('activeFilters');
    const activeFiltersTags = document.getElementById('activeFiltersTags');
    
    if (!activeFiltersEl || !activeFiltersTags) return;
    
    // Get active filter labels
    const activeFilterTags = [];
    
    if (activeFilters.jobType) {
        const select = document.getElementById('jobTypeFilter');
        const label = select?.options[select.selectedIndex]?.text || activeFilters.jobType;
        activeFilterTags.push({ type: 'jobType', label: `Job Type: ${label}` });
    }
    
    if (activeFilters.location) {
        const select = document.getElementById('locationFilter');
        const label = select?.options[select.selectedIndex]?.text || activeFilters.location;
        activeFilterTags.push({ type: 'location', label: `Location: ${label}` });
    }
    
    if (activeFilters.salary) {
        const select = document.getElementById('salaryFilter');
        const label = select?.options[select.selectedIndex]?.text || activeFilters.salary;
        activeFilterTags.push({ type: 'salary', label: `Salary: ${label}` });
    }
    
    if (activeFilters.search) {
        activeFilterTags.push({ type: 'search', label: `Search: "${activeFilters.search}"` });
    }
    
    // Update display
    if (activeFilterTags.length > 0) {
        activeFiltersEl.style.display = 'block';
        
        const tagsHTML = activeFilterTags.map(filter => `
            <span class="active-filter-tag">
                ${filter.label}
                <button class="remove-filter" onclick="removeFilter('${filter.type}')">
                    <i class="fas fa-times"></i>
                </button>
            </span>
        `).join('');
        
        activeFiltersTags.innerHTML = tagsHTML;
    } else {
        activeFiltersEl.style.display = 'none';
    }
}

// Remove specific filter
function removeFilter(filterType) {
    switch(filterType) {
        case 'jobType':
            const jobTypeFilter = document.getElementById('jobTypeFilter');
            if (jobTypeFilter) jobTypeFilter.value = '';
            activeFilters.jobType = '';
            break;
        case 'location':
            const locationFilter = document.getElementById('locationFilter');
            if (locationFilter) locationFilter.value = '';
            activeFilters.location = '';
            break;
        case 'salary':
            const salaryFilter = document.getElementById('salaryFilter');
            if (salaryFilter) salaryFilter.value = '';
            activeFilters.salary = '';
            break;
        case 'search':
            const searchInput = document.getElementById('jobSearch');
            if (searchInput) searchInput.value = '';
            activeFilters.search = '';
            break;
    }
    
    // Re-filter jobs
    filterJobs();
}

// Toggle save job
async function toggleSaveJob(jobId) {
    const saveBtn = document.querySelector(`.save-job-btn[data-job-id="${jobId}"]`);
    if (!saveBtn) return;
    
    const isSaved = savedJobs.includes(jobId);
    
    try {
        if (isSaved) {
            // Remove from saved
            savedJobs = savedJobs.filter(id => id !== jobId);
            saveBtn.innerHTML = '<i class="far fa-bookmark"></i> Save';
            saveBtn.classList.remove('saved');
            
            const response = await fetch(`/unsave-job/${jobId}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' }
            });
            
            if (!response.ok) throw new Error('Failed to unsave job');
            
            showToast('Job removed from saved', 'info');
        } else {
            // Add to saved
            savedJobs.push(jobId);
            saveBtn.innerHTML = '<i class="fas fa-bookmark"></i> Saved';
            saveBtn.classList.add('saved');
            
            const response = await fetch(`/save-job/${jobId}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' }
            });
            
            if (!response.ok) throw new Error('Failed to save job');
            
            showToast('Job saved successfully!', 'success');
        }
        
        // Update localStorage
        localStorage.setItem('savedJobs', JSON.stringify(savedJobs));
        
    } catch (error) {
        console.error('Error saving job:', error);
        showToast('Error saving job', 'error');
    }
}

// Update saved job buttons
function updateSavedJobButtons() {
    savedJobs.forEach(jobId => {
        const saveBtn = document.querySelector(`.save-job-btn[data-job-id="${jobId}"]`);
        if (saveBtn) {
            saveBtn.innerHTML = '<i class="fas fa-bookmark"></i> Saved';
            saveBtn.classList.add('saved');
        }
    });
}

// Update applied job buttons
function updateAppliedJobButtons() {
    appliedJobs.forEach(jobId => {
        const applyBtn = document.getElementById(`applyBtn${jobId}`);
        if (applyBtn) {
            applyBtn.innerHTML = '<i class="fas fa-check"></i> Applied';
            applyBtn.className = 'btn btn-secondary';
            applyBtn.disabled = true;
            applyBtn.onclick = null;
        }
    });
}

// View job details
async function viewJobDetails(jobId) {
    currentJobId = jobId;
    
    // Show loading in modal
    const jobModalContent = document.getElementById('jobModalContent');
    if (jobModalContent) {
        jobModalContent.innerHTML = `
            <div class="loading-state" style="padding: 20px;">
                <div class="loading-spinner"></div>
                <p>Loading job details...</p>
            </div>
        `;
    }
    
    try {
        const response = await fetch(`/api/job/${jobId}/details`);
        if (!response.ok) throw new Error('Failed to fetch job details');
        
        const job = await response.json();
        
        // Create job details content
        const jobDetailsHTML = createJobDetailsHTML(job);
        
        // Update modal content
        const modalTitle = document.getElementById('modalJobTitle');
        if (modalTitle) modalTitle.textContent = job.title;
        if (jobModalContent) jobModalContent.innerHTML = jobDetailsHTML;
        
        // Update apply button in modal
        const modalApplyBtn = document.getElementById('modalApplyBtn');
        if (modalApplyBtn) {
            if (appliedJobs.includes(jobId)) {
                modalApplyBtn.innerHTML = '<i class="fas fa-check"></i> Applied';
                modalApplyBtn.className = 'btn btn-secondary';
                modalApplyBtn.disabled = true;
                modalApplyBtn.onclick = null;
            } else {
                modalApplyBtn.innerHTML = '<i class="fas fa-paper-plane"></i> Apply Now';
                modalApplyBtn.className = 'btn btn-primary';
                modalApplyBtn.disabled = false;
                modalApplyBtn.onclick = applyFromModal;
            }
        }
        
        // Show modal
        document.getElementById('jobDetailsModal').style.display = 'flex';
        document.body.style.overflow = 'hidden';
        
    } catch (error) {
        console.error('Error loading job details:', error);
        if (jobModalContent) {
            jobModalContent.innerHTML = `
                <div class="no-results" style="border: none; padding: 20px;">
                    <i class="fas fa-exclamation-triangle fa-2x"></i>
                    <h3>Error loading job details</h3>
                    <p>Please try again later</p>
                </div>
            `;
        }
    }
}

// Create HTML for job details
function createJobDetailsHTML(job) {
    const requirements = job.requirements ? 
        job.requirements.split(',').map(req => `<li>${escapeHtml(req.trim())}</li>`).join('') : 
        '<li>No specific requirements listed</li>';
    
    return `
        <div class="job-details-content">
            <div class="job-details-header">
                <div class="company-info" style="margin-bottom: 20px;">
                    <div class="company-logo">
                        <i class="fas fa-building"></i>
                    </div>
                    <div class="company-details">
                        <div class="company-name">${escapeHtml(job.company)}</div>
                        <div class="job-location">
                            <i class="fas fa-map-marker-alt"></i>
                            <span>${escapeHtml(job.location || 'Not specified')}</span>
                        </div>
                    </div>
                </div>
                
                <div class="job-details-meta">
                    <div class="job-details-meta-item">
                        <i class="fas fa-briefcase"></i>
                        <span>${formatJobType(job.job_type)}</span>
                    </div>
                    <div class="job-details-meta-item">
                        <i class="fas fa-money-bill-wave"></i>
                        <span>${escapeHtml(job.salary_range || 'Not specified')}</span>
                    </div>
                    <div class="job-details-meta-item">
                        <i class="fas fa-clock"></i>
                        <span>Posted ${formatJobDate(job.created_at)}</span>
                    </div>
                    <div class="job-details-meta-item">
                        <i class="fas fa-users"></i>
                        <span>${job.applications || 0} applications</span>
                    </div>
                </div>
            </div>
            
            <div class="job-details-section">
                <h4><i class="fas fa-align-left"></i> Job Description</h4>
                <div class="job-details-content-text">
                    ${escapeHtml(job.description || 'No description available').replace(/\n/g, '<br>')}
                </div>
            </div>
            
            <div class="job-details-section">
                <h4><i class="fas fa-list-check"></i> Requirements</h4>
                <ul style="color: var(--text-secondary); line-height: 1.6; padding-left: 20px;">
                    ${requirements}
                </ul>
            </div>
            
            ${job.requirements ? `
            <div class="job-details-section">
                <h4><i class="fas fa-tools"></i> Skills Required</h4>
                <div class="job-details-skills">
                    ${job.requirements.split(',').map(skill => `
                        <span class="skill-tag">${escapeHtml(skill.trim())}</span>
                    `).join('')}
                </div>
            </div>
            ` : ''}
            
            <div class="job-details-section">
                <h4><i class="fas fa-info-circle"></i> Additional Information</h4>
                <div class="job-details-info">
                    <div class="info-item">
                        <span class="info-label">Job ID:</span>
                        <span class="info-value">${job.id}</span>
                    </div>
                    <div class="info-item">
                        <span class="info-label">Applications:</span>
                        <span class="info-value">${job.applications || 0} applications received</span>
                    </div>
                    <div class="info-item">
                        <span class="info-label">Work Location:</span>
                        <span class="info-value">${job.job_type === 'remote' ? 'Remote' : 'On-site'}</span>
                    </div>
                    ${job.hr_name ? `
                    <div class="info-item">
                        <span class="info-label">Posted by:</span>
                        <span class="info-value">${escapeHtml(job.hr_name)}</span>
                    </div>
                    ` : ''}
                </div>
            </div>
        </div>
    `;
}

// Apply from modal
function applyFromModal() {
    if (!currentJobId) return;
    applyForJob(currentJobId);
}

// Login from modal
function loginFromModal() {
    window.location.href = `/login?next=/jobs&apply=${currentJobId}`;
}

// Apply for job
function applyForJob(jobId) {
    currentJobId = jobId;
    
    // Check if user is logged in
    const isLoggedIn = window.isLoggedIn === 'true';
    const userType = window.userType;
    
    if (!isLoggedIn) {
        loginToApply(jobId);
        return;
    }
    
    if (userType === '"hr"') {
        showToast('Only job seekers can apply for jobs', 'error');
        return;
    }
    
    // Check if already applied
    if (appliedJobs.includes(jobId)) {
        showToast('You have already applied for this job', 'info');
        return;
    }
    
    // Show apply modal
    document.getElementById('applyModal').style.display = 'flex';
    document.body.style.overflow = 'hidden';
    document.getElementById('applyJobId').value = jobId;
}

// Login to apply
function loginToApply(jobId) {
    window.location.href = `/login?next=/jobs&apply=${jobId}`;
}

// Submit application
async function submitApplication() {
    const form = document.getElementById('applyForm');
    if (!form) return;
    
    const formData = new FormData(form);
    
    // Validate form
    if (!validateApplicationForm()) {
        return;
    }
    
    // Show loading state
    const submitBtn = document.querySelector('#applyModal .btn-primary');
    if (!submitBtn) return;
    
    const originalText = submitBtn.innerHTML;
    submitBtn.innerHTML = '<span class="loading-spinner small"></span> Submitting...';
    submitBtn.disabled = true;
    
    try {
        const response = await fetch(`/apply/${currentJobId}`, {
            method: 'POST',
            body: formData
        });
        
        const data = await response.json();
        
        if (response.ok) {
            showToast(data.message || 'Application submitted successfully!', 'success');
            closeApplyModalFunc();
            
            // Update applied status
            appliedJobs.push(currentJobId);
            updateAppliedStatus(currentJobId);
        } else {
            showToast(data.error || 'Application failed', 'error');
            submitBtn.innerHTML = originalText;
            submitBtn.disabled = false;
        }
        
    } catch (error) {
        console.error('Error submitting application:', error);
        showToast('Error submitting application', 'error');
        submitBtn.innerHTML = originalText;
        submitBtn.disabled = false;
    }
}

// Validate application form
function validateApplicationForm() {
    const name = document.getElementById('applicantName')?.value.trim();
    const email = document.getElementById('applicantEmail')?.value.trim();
    const resume = document.getElementById('applicantResume')?.files[0];
    
    // Basic validation
    if (!name) {
        showToast('Please enter your name', 'error');
        return false;
    }
    
    if (!email || !validateEmail(email)) {
        showToast('Please enter a valid email address', 'error');
        return false;
    }
    
    if (!resume) {
        showToast('Please upload your resume', 'error');
        return false;
    }
    
    // Check file size (5MB limit)
    if (resume.size > 5 * 1024 * 1024) {
        showToast('Resume file size must be less than 5MB', 'error');
        return false;
    }
    
    // Check file type
    const allowedTypes = [
        'application/pdf', 
        'application/msword', 
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ];
    if (!allowedTypes.includes(resume.type)) {
        showToast('Please upload a PDF or Word document', 'error');
        return false;
    }
    
    return true;
}

// Update applied status
function updateAppliedStatus(jobId) {
    // Update apply button in job card
    const applyBtn = document.getElementById(`applyBtn${jobId}`);
    if (applyBtn) {
        applyBtn.innerHTML = '<i class="fas fa-check"></i> Applied';
        applyBtn.className = 'btn btn-secondary';
        applyBtn.disabled = true;
        applyBtn.onclick = null;
    }
    
    // Update modal apply button if open
    const modalApplyBtn = document.getElementById('modalApplyBtn');
    if (modalApplyBtn && currentJobId === jobId) {
        modalApplyBtn.innerHTML = '<i class="fas fa-check"></i> Applied';
        modalApplyBtn.className = 'btn btn-secondary';
        modalApplyBtn.disabled = true;
        modalApplyBtn.onclick = null;
    }
}

// Close job modal
function closeJobModalFunc() {
    document.getElementById('jobDetailsModal').style.display = 'none';
    document.body.style.overflow = 'auto';
}

// Close apply modal
function closeApplyModalFunc() {
    document.getElementById('applyModal').style.display = 'none';
    document.body.style.overflow = 'auto';
    
    // Reset form
    const applyForm = document.getElementById('applyForm');
    if (applyForm) {
        applyForm.reset();
        const fileName = document.getElementById('fileName');
        if (fileName) fileName.textContent = 'No file chosen';
    }
}

// Initialize file upload
function initFileUpload() {
    const resumeInput = document.getElementById('applicantResume');
    const fileNameSpan = document.getElementById('fileName');
    
    if (resumeInput && fileNameSpan) {
        resumeInput.addEventListener('change', function() {
            fileNameSpan.textContent = this.files.length > 0 ? this.files[0].name : 'No file chosen';
        });
    }
}

// Show toast notification (separate from dashboard)
function showToast(message, type = 'info') {
    // Remove existing toast
    const existingToast = document.querySelector('.toast-jobs');
    if (existingToast) existingToast.remove();
    
    // Create new toast
    const toast = document.createElement('div');
    toast.className = `toast-jobs toast-${type}`;
    toast.innerHTML = `
        <div class="toast-content">
            <i class="fas fa-${getToastIcon(type)}"></i>
            <span>${message}</span>
        </div>
    `;
    
    document.body.appendChild(toast);
    
    // Show toast
    setTimeout(() => toast.classList.add('show'), 10);
    
    // Auto remove after 3 seconds
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

function getToastIcon(type) {
    switch(type) {
        case 'success': return 'check-circle';
        case 'error': return 'exclamation-circle';
        case 'warning': return 'exclamation-triangle';
        default: return 'info-circle';
    }
}

// Add toast styles
function addToastStyles() {
    const styles = `
        .toast-jobs {
            position: fixed;
            top: 20px;
            right: 20px;
            background: var(--card-bg2);
            border: 1px solid var(--border-color);
            border-radius: 12px;
            padding: 16px 20px;
            display: flex;
            align-items: center;
            gap: 12px;
            color: var(--text-primary);
            font-size: 14px;
            z-index: 10000;
            transform: translateX(150%);
            transition: transform 0.3s ease;
            max-width: 350px;
            backdrop-filter: blur(10px);
            box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
        }
        
        .toast-jobs.show {
            transform: translateX(0);
        }
        
        .toast-jobs.success {
            border-left: 4px solid #10b981;
        }
        
        .toast-jobs.success i {
            color: #10b981;
        }
        
        .toast-jobs.error {
            border-left: 4px solid #ef4444;
        }
        
        .toast-jobs.error i {
            color: #ef4444;
        }
        
        .toast-jobs.warning {
            border-left: 4px solid #f59e0b;
        }
        
        .toast-jobs.warning i {
            color: #f59e0b;
        }
        
        .toast-jobs.info {
            border-left: 4px solid #3b82f6;
        }
        
        .toast-jobs.info i {
            color: #3b82f6;
        }
        
        .loading-spinner.small {
            width: 16px;
            height: 16px;
            border: 2px solid rgba(255, 255, 255, 0.1);
            border-radius: 50%;
            border-top-color: var(--primary-color);
            animation: spin 1s ease-in-out infinite;
            display: inline-block;
            margin-right: 8px;
        }
        
        @keyframes spin {
            to {
                transform: rotate(360deg);
            }
        }
    `;
    
    const styleSheet = document.createElement('style');
    styleSheet.textContent = styles;
    document.head.appendChild(styleSheet);
}

// Helper functions
function formatJobType(type) {
    const types = {
        'fulltime': 'Full-time',
        'parttime': 'Part-time',
        'contract': 'Contract',
        'remote': 'Remote',
        'internship': 'Internship'
    };
    return types[type] || type.charAt(0).toUpperCase() + type.slice(1);
}

function formatJobDate(dateString) {
    if (!dateString) return 'Unknown date';
    
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    
    return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
}

function validateEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    // Check if we're on the jobs page (SPA listing) or server-rendered job_postings table
    if (document.querySelector('.jobs-listing') || document.getElementById('jobsTable') || document.getElementById('jobsList')) {
        initJobsPage();
    }
});

