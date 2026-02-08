// Popup JavaScript - Job Application Tracker Extension

// ============================================
// CONFIGURATION
// ============================================

// Replace these with your Supabase project credentials
const SUPABASE_URL = 'https://ectrvzdnrijkcvslabad.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVjdHJ2emRucmlqa2N2c2xhYmFkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA1Mzc2MjAsImV4cCI6MjA4NjExMzYyMH0.F2lfYTvkUOVNqarscYjNkRByKxxAyldPH1Su7KiJVOc';

// Dashboard URL (update this after deploying your dashboard)
const DASHBOARD_URL = 'https://iridescent-profiterole-b1f5ed.netlify.app/dashboard/';

// ============================================
// DOMAIN DETECTION
// ============================================

// Email sites show "Search & Update" view
// All other sites show "Add Application" form
const EMAIL_SITES = [
    'mail.google.com',
    'outlook.live.com',
    'outlook.office.com',
    'mail.yahoo.com'
];

const STATUS_OPTIONS = [
    { value: 'Applied', color: '#3498db' },
    { value: 'Rejected', color: '#e74c3c' },
    { value: 'Test Scheduled', color: '#f39c12' },
    { value: 'Test Passed', color: '#27ae60' },
    { value: 'Test Failed', color: '#e74c3c' },
    { value: 'Interview Scheduled', color: '#9b59b6' },
    { value: 'Interview Cleared', color: '#27ae60' },
    { value: 'Interview Rejected', color: '#e74c3c' },
    { value: 'Offer Received', color: '#2ecc71' },
    { value: 'Offer Accepted', color: '#27ae60' },
    { value: 'Offer Declined', color: '#95a5a6' }
];

// ============================================
// INITIALIZE SUPABASE
// ============================================

let supabaseClient;
let currentUser = null;
let currentDomain = null;
let applications = [];
let selectedApplication = null;

function initSupabase() {
    supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
}

// ============================================
// AUTHENTICATION
// ============================================

function usernameToEmail(username) {
    return `${username.toLowerCase().trim()}@app.local`;
}

async function signIn(username, password) {
    const email = usernameToEmail(username);
    const { data, error } = await supabaseClient.auth.signInWithPassword({
        email: email,
        password: password
    });
    if (error) throw error;
    return data;
}

async function signOut() {
    const { error } = await supabaseClient.auth.signOut();
    if (error) throw error;
    currentUser = null;
    showView('login');
    document.getElementById('user-info').classList.add('hidden');
}

async function getSession() {
    const { data: { session }, error } = await supabaseClient.auth.getSession();
    if (error) throw error;
    return session;
}

function getUsername(user) {
    if (user.user_metadata && user.user_metadata.username) {
        return user.user_metadata.username;
    }
    return user.email.replace('@app.local', '');
}

// ============================================
// VIEW MANAGEMENT
// ============================================

function showView(viewName) {
    document.querySelectorAll('.view').forEach(v => v.classList.add('hidden'));
    document.getElementById(`${viewName}-view`).classList.remove('hidden');
}

function detectSiteType(url) {
    if (!url) return 'default';

    try {
        const hostname = new URL(url).hostname;

        // Check email sites - show search/update view
        for (const site of EMAIL_SITES) {
            if (hostname.includes(site)) {
                return 'email';
            }
        }

        // Skip chrome:// and extension pages
        if (url.startsWith('chrome://') || url.startsWith('chrome-extension://')) {
            return 'default';
        }

        // All other websites - show add application form
        return 'job-site';
    } catch (e) {
        console.error('Error parsing URL:', e);
    }

    return 'default';
}

function getDomainFromUrl(url) {
    try {
        const hostname = new URL(url).hostname;
        return hostname.replace('www.', '');
    } catch (e) {
        return '';
    }
}

// ============================================
// APPLICATION MANAGEMENT
// ============================================

async function loadApplications() {
    try {
        const { data, error } = await supabaseClient
            .from('applications')
            .select('*')
            .order('application_date', { ascending: false });

        if (error) throw error;
        applications = data || [];
        return applications;
    } catch (error) {
        console.error('Error loading applications:', error);
        return [];
    }
}

async function addApplication(companyName, applied, applicationDate, notes, sourceDomain) {
    const status = applied ? 'Applied' : 'Saved';

    const { data, error } = await supabaseClient
        .from('applications')
        .insert({
            user_id: currentUser.id,
            company_name: companyName,
            application_date: applicationDate,
            status: status,
            source_domain: sourceDomain,
            notes: notes
        })
        .select()
        .single();

    if (error) throw error;
    return data;
}

async function updateApplication(appId, status, notes) {
    const { data, error } = await supabaseClient
        .from('applications')
        .update({ status, notes })
        .eq('id', appId)
        .select()
        .single();

    if (error) throw error;
    return data;
}

async function addEvent(applicationId, eventType, eventDate) {
    const { data, error } = await supabaseClient
        .from('application_events')
        .insert({
            application_id: applicationId,
            event_type: eventType,
            event_date: eventDate
        })
        .select()
        .single();

    if (error) throw error;
    return data;
}

// ============================================
// UI HELPERS
// ============================================

function showError(elementId, message) {
    const errorEl = document.getElementById(elementId);
    errorEl.textContent = message;
    errorEl.classList.add('active');
}

function hideError(elementId) {
    const errorEl = document.getElementById(elementId);
    errorEl.classList.remove('active');
}

function showSuccess(container, message) {
    const successDiv = document.createElement('div');
    successDiv.className = 'success-message';
    successDiv.textContent = message;
    container.insertBefore(successDiv, container.firstChild);
    setTimeout(() => successDiv.remove(), 2000);
}

function getStatusColor(status) {
    const option = STATUS_OPTIONS.find(s => s.value === status);
    return option ? option.color : '#95a5a6';
}

function formatDate(dateString) {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
    });
}

// ============================================
// SEARCH FUNCTIONALITY
// ============================================

function searchApplications(query) {
    if (!query.trim()) {
        return [];
    }

    const lowerQuery = query.toLowerCase();
    return applications.filter(app =>
        app.company_name.toLowerCase().includes(lowerQuery)
    );
}

function renderSearchResults(results) {
    const container = document.getElementById('search-results');

    if (results.length === 0) {
        container.innerHTML = '<p class="empty-message">No applications found</p>';
        return;
    }

    container.innerHTML = results.map(app => `
        <div class="search-result-item" data-id="${app.id}">
            <div class="company-name">${escapeHtml(app.company_name)}</div>
            <span class="status-badge" style="background-color: ${getStatusColor(app.status)}">
                ${escapeHtml(app.status)}
            </span>
            <div class="date">Applied: ${formatDate(app.application_date)}</div>
        </div>
    `).join('');

    // Add click handlers
    container.querySelectorAll('.search-result-item').forEach(item => {
        item.addEventListener('click', () => selectApplication(item.dataset.id));
    });
}

function selectApplication(appId) {
    selectedApplication = applications.find(a => a.id === appId);
    if (!selectedApplication) return;

    document.getElementById('selected-company').textContent = selectedApplication.company_name;
    document.getElementById('update-status').innerHTML = STATUS_OPTIONS.map(s =>
        `<option value="${s.value}" ${s.value === selectedApplication.status ? 'selected' : ''}>${s.value}</option>`
    ).join('');
    document.getElementById('update-notes').value = selectedApplication.notes || '';
    document.getElementById('event-type').value = '';

    document.getElementById('update-section').classList.remove('hidden');
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// ============================================
// EVENT HANDLERS
// ============================================

function setupEventHandlers() {
    // Login form
    document.getElementById('login-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        hideError('login-error');

        const username = document.getElementById('username').value;
        const password = document.getElementById('password').value;
        const loginBtn = document.getElementById('login-btn');

        loginBtn.disabled = true;
        loginBtn.textContent = 'Signing in...';

        try {
            const { user } = await signIn(username, password);
            currentUser = user;
            await initializeForCurrentSite();
        } catch (error) {
            showError('login-error', error.message || 'Login failed');
        } finally {
            loginBtn.disabled = false;
            loginBtn.textContent = 'Sign In';
        }
    });

    // Add application form
    document.getElementById('add-application-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        hideError('add-error');

        const companyName = document.getElementById('company-name').value;
        const applied = document.getElementById('applied-select').value === 'yes';
        const applicationDate = document.getElementById('application-date').value;
        const notes = document.getElementById('notes-input').value;
        const addBtn = document.getElementById('add-btn');

        addBtn.disabled = true;
        addBtn.textContent = 'Adding...';

        try {
            await addApplication(companyName, applied, applicationDate, notes, currentDomain);
            showSuccess(document.getElementById('job-site-view'), 'Application added!');

            // Reset form
            document.getElementById('company-name').value = '';
            document.getElementById('notes-input').value = '';
        } catch (error) {
            showError('add-error', error.message || 'Failed to add application');
        } finally {
            addBtn.disabled = false;
            addBtn.textContent = 'Add Application';
        }
    });

    // Applied select toggle date field
    document.getElementById('applied-select').addEventListener('change', (e) => {
        const dateGroup = document.getElementById('date-group');
        if (e.target.value === 'yes') {
            dateGroup.classList.remove('hidden');
        } else {
            dateGroup.classList.add('hidden');
        }
    });

    // Search input
    document.getElementById('search-company').addEventListener('input', (e) => {
        const results = searchApplications(e.target.value);
        if (e.target.value.trim()) {
            renderSearchResults(results);
        } else {
            document.getElementById('search-results').innerHTML =
                '<p class="empty-message">Enter company name to search</p>';
        }
        document.getElementById('update-section').classList.add('hidden');
    });


    // Update form
    document.getElementById('update-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        hideError('update-error');

        if (!selectedApplication) return;

        const status = document.getElementById('update-status').value;
        const notes = document.getElementById('update-notes').value;
        const eventType = document.getElementById('event-type').value;
        const eventDate = new Date().toISOString().split('T')[0]; // Use today's date
        const updateBtn = document.getElementById('update-btn');

        updateBtn.disabled = true;
        updateBtn.textContent = 'Updating...';

        try {
            await updateApplication(selectedApplication.id, status, notes);

            // Add event if selected
            if (eventType) {
                await addEvent(selectedApplication.id, eventType, eventDate);
            }

            showSuccess(document.getElementById('email-view'), 'Updated!');
            document.getElementById('update-section').classList.add('hidden');

            // Reload applications
            await loadApplications();
            const query = document.getElementById('search-company').value;
            if (query) {
                renderSearchResults(searchApplications(query));
            }
        } catch (error) {
            showError('update-error', error.message || 'Failed to update');
        } finally {
            updateBtn.disabled = false;
            updateBtn.textContent = 'Update';
        }
    });

    // Cancel update
    document.getElementById('cancel-update-btn').addEventListener('click', () => {
        document.getElementById('update-section').classList.add('hidden');
        selectedApplication = null;
    });

    // Open dashboard links
    document.getElementById('open-dashboard').addEventListener('click', (e) => {
        e.preventDefault();
        if (DASHBOARD_URL && DASHBOARD_URL !== 'YOUR_DASHBOARD_URL') {
            chrome.tabs.create({ url: DASHBOARD_URL });
        } else {
            alert('Dashboard URL not configured. Please update DASHBOARD_URL in popup.js');
        }
    });

    document.getElementById('open-dashboard-login').addEventListener('click', (e) => {
        e.preventDefault();
        if (DASHBOARD_URL && DASHBOARD_URL !== 'YOUR_DASHBOARD_URL') {
            chrome.tabs.create({ url: DASHBOARD_URL + 'signup.html' });
        } else {
            alert('Dashboard URL not configured');
        }
    });

    document.getElementById('open-signup').addEventListener('click', (e) => {
        e.preventDefault();
        if (DASHBOARD_URL && DASHBOARD_URL !== 'YOUR_DASHBOARD_URL') {
            chrome.tabs.create({ url: DASHBOARD_URL + 'signup.html' });
        } else {
            alert('Dashboard URL not configured');
        }
    });

    // Logout
    document.getElementById('logout-link').addEventListener('click', async (e) => {
        e.preventDefault();
        await signOut();
    });
}

// ============================================
// INITIALIZATION
// ============================================

async function initializeForCurrentSite() {
    // Update user info
    document.getElementById('current-user').textContent = getUsername(currentUser);
    document.getElementById('user-info').classList.remove('hidden');

    // Load applications
    await loadApplications();

    // Get current tab
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        const url = tabs[0]?.url || '';
        currentDomain = getDomainFromUrl(url);
        const siteType = detectSiteType(url);

        // Update domain badge
        document.getElementById('current-domain').textContent = currentDomain || 'Unknown';

        // Show appropriate view
        switch (siteType) {
            case 'job-site':
                showView('job-site');
                // Set default date to today
                document.getElementById('application-date').value =
                    new Date().toISOString().split('T')[0];
                break;

            case 'email':
                showView('email');
                break;

            default:
                showView('default');
                // Update quick stats
                document.getElementById('total-apps').textContent = applications.length;
                document.getElementById('active-apps').textContent =
                    applications.filter(a => !['Rejected', 'Offer Accepted', 'Offer Declined'].includes(a.status)).length;
                break;
        }
    });
}

async function init() {
    // Show loading view immediately
    showView('loading');

    // Set up event handlers FIRST (so links always work)
    setupEventHandlers();

    // Then try to initialize Supabase
    try {
        initSupabase();
    } catch (error) {
        console.error('Supabase init error:', error);
        showView('login');
        return;
    }

    // Check for existing session
    try {
        const session = await getSession();
        if (session) {
            currentUser = session.user;
            await initializeForCurrentSite();
        } else {
            showView('login');
        }
    } catch (error) {
        console.error('Init error:', error);
        showView('login');
    }
}

// Start the app
document.addEventListener('DOMContentLoaded', init);
