// Dashboard functionality

// Status options with their display colors
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

// Event types
const EVENT_TYPES = [
    'Interview Scheduled',
    'Test Scheduled',
    'Phone Screen',
    'Technical Interview',
    'HR Interview',
    'Final Interview',
    'Offer Discussion',
    'Other'
];

// Current user
let currentUser = null;
let applications = [];

// Initialize dashboard
async function initDashboard() {
    const session = await requireAuth();
    if (!session) return;

    currentUser = session.user;

    // Display username
    const usernameDisplay = document.getElementById('username-display');
    if (usernameDisplay) {
        usernameDisplay.textContent = getUsername(currentUser);
    }

    // Load applications
    await loadApplications();

    // Set up event listeners
    setupEventListeners();
}

// Load all applications
async function loadApplications() {
    try {
        const { data, error } = await supabaseClient
            .from('applications')
            .select('*')
            .order('application_date', { ascending: false });

        if (error) throw error;

        applications = data || [];
        renderApplicationsTable();
        updateStats();
    } catch (error) {
        console.error('Error loading applications:', error);
        showNotification('Failed to load applications', 'error');
    }
}

// Render applications table
function renderApplicationsTable() {
    const tbody = document.getElementById('applications-tbody');
    if (!tbody) return;

    if (applications.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="6" class="empty-state">
                    No applications yet. Add your first application using the Chrome extension!
                </td>
            </tr>
        `;
        return;
    }

    tbody.innerHTML = applications.map(app => `
        <tr data-id="${app.id}">
            <td class="company-name">${escapeHtml(app.company_name)}</td>
            <td>${formatDate(app.application_date)}</td>
            <td>
                <span class="status-badge" style="background-color: ${getStatusColor(app.status)}">
                    ${escapeHtml(app.status)}
                </span>
            </td>
            <td>${app.source_domain ? escapeHtml(app.source_domain) : '-'}</td>
            <td class="notes-cell">${app.notes ? escapeHtml(app.notes) : '-'}</td>
            <td class="actions-cell">
                <button class="btn btn-small btn-primary" onclick="openUpdateModal('${app.id}')">
                    Update
                </button>
                <button class="btn btn-small btn-secondary" onclick="openEventsModal('${app.id}')">
                    Events
                </button>
                <button class="btn btn-small btn-danger" onclick="deleteApplication('${app.id}')">
                    Delete
                </button>
            </td>
        </tr>
    `).join('');
}

// Update statistics
function updateStats() {
    const totalEl = document.getElementById('stat-total');
    const appliedEl = document.getElementById('stat-applied');
    const interviewEl = document.getElementById('stat-interview');
    const offerEl = document.getElementById('stat-offer');

    if (totalEl) totalEl.textContent = applications.length;

    if (appliedEl) {
        appliedEl.textContent = applications.filter(a => a.status === 'Applied').length;
    }

    if (interviewEl) {
        interviewEl.textContent = applications.filter(a =>
            a.status.includes('Interview')
        ).length;
    }

    if (offerEl) {
        offerEl.textContent = applications.filter(a =>
            a.status.includes('Offer')
        ).length;
    }
}

// Open update modal
async function openUpdateModal(applicationId) {
    const app = applications.find(a => a.id === applicationId);
    if (!app) return;

    const modal = document.getElementById('update-modal');
    const form = document.getElementById('update-form');

    // Populate form
    document.getElementById('update-app-id').value = app.id;
    document.getElementById('update-company').textContent = app.company_name;
    document.getElementById('update-status').value = app.status;
    document.getElementById('update-notes').value = app.notes || '';

    // Populate status dropdown
    const statusSelect = document.getElementById('update-status');
    statusSelect.innerHTML = STATUS_OPTIONS.map(s =>
        `<option value="${s.value}" ${s.value === app.status ? 'selected' : ''}>${s.value}</option>`
    ).join('');

    modal.classList.add('active');
}

// Close update modal
function closeUpdateModal() {
    const modal = document.getElementById('update-modal');
    modal.classList.remove('active');
}

// Handle update form submission
async function handleUpdateSubmit(event) {
    event.preventDefault();

    const appId = document.getElementById('update-app-id').value;
    const status = document.getElementById('update-status').value;
    const notes = document.getElementById('update-notes').value;

    try {
        const { error } = await supabaseClient
            .from('applications')
            .update({ status, notes })
            .eq('id', appId);

        if (error) throw error;

        showNotification('Application updated successfully', 'success');
        closeUpdateModal();
        await loadApplications();
    } catch (error) {
        console.error('Error updating application:', error);
        showNotification('Failed to update application', 'error');
    }
}

// Open events modal
async function openEventsModal(applicationId) {
    const app = applications.find(a => a.id === applicationId);
    if (!app) return;

    const modal = document.getElementById('events-modal');
    document.getElementById('events-company').textContent = app.company_name;
    document.getElementById('events-app-id').value = applicationId;

    // Load events for this application
    await loadEvents(applicationId);

    // Populate event type dropdown
    const eventTypeSelect = document.getElementById('event-type');
    eventTypeSelect.innerHTML = EVENT_TYPES.map(t =>
        `<option value="${t}">${t}</option>`
    ).join('');

    // Set default date to today
    document.getElementById('event-date').value = new Date().toISOString().split('T')[0];
    document.getElementById('event-notes').value = '';

    modal.classList.add('active');
}

// Close events modal
function closeEventsModal() {
    const modal = document.getElementById('events-modal');
    modal.classList.remove('active');
}

// Load events for an application
async function loadEvents(applicationId) {
    try {
        const { data, error } = await supabaseClient
            .from('application_events')
            .select('*')
            .eq('application_id', applicationId)
            .order('event_date', { ascending: false });

        if (error) throw error;

        renderEventsList(data || []);
    } catch (error) {
        console.error('Error loading events:', error);
        showNotification('Failed to load events', 'error');
    }
}

// Render events list
function renderEventsList(events) {
    const container = document.getElementById('events-list');

    if (events.length === 0) {
        container.innerHTML = '<p class="empty-state">No events recorded yet.</p>';
        return;
    }

    container.innerHTML = events.map(event => `
        <div class="event-item">
            <div class="event-header">
                <span class="event-type">${escapeHtml(event.event_type)}</span>
                <span class="event-date">${formatDate(event.event_date)}</span>
            </div>
            ${event.result ? `<div class="event-result">Result: ${escapeHtml(event.result)}</div>` : ''}
            ${event.notes ? `<div class="event-notes">${escapeHtml(event.notes)}</div>` : ''}
            <button class="btn btn-small btn-danger" onclick="deleteEvent('${event.id}', '${event.application_id}')">
                Delete
            </button>
        </div>
    `).join('');
}

// Add new event
async function handleAddEvent(event) {
    event.preventDefault();

    const applicationId = document.getElementById('events-app-id').value;
    const eventType = document.getElementById('event-type').value;
    const eventDate = document.getElementById('event-date').value;
    const eventNotes = document.getElementById('event-notes').value;

    try {
        const { error } = await supabaseClient
            .from('application_events')
            .insert({
                application_id: applicationId,
                event_type: eventType,
                event_date: eventDate,
                notes: eventNotes
            });

        if (error) throw error;

        showNotification('Event added successfully', 'success');

        // Clear form
        document.getElementById('event-notes').value = '';

        // Reload events
        await loadEvents(applicationId);
    } catch (error) {
        console.error('Error adding event:', error);
        showNotification('Failed to add event', 'error');
    }
}

// Delete event
async function deleteEvent(eventId, applicationId) {
    if (!confirm('Are you sure you want to delete this event?')) return;

    try {
        const { error } = await supabaseClient
            .from('application_events')
            .delete()
            .eq('id', eventId);

        if (error) throw error;

        showNotification('Event deleted', 'success');
        await loadEvents(applicationId);
    } catch (error) {
        console.error('Error deleting event:', error);
        showNotification('Failed to delete event', 'error');
    }
}

// Delete application
async function deleteApplication(applicationId) {
    if (!confirm('Are you sure you want to delete this application? This will also delete all associated events.')) {
        return;
    }

    try {
        const { error } = await supabaseClient
            .from('applications')
            .delete()
            .eq('id', applicationId);

        if (error) throw error;

        showNotification('Application deleted', 'success');
        await loadApplications();
    } catch (error) {
        console.error('Error deleting application:', error);
        showNotification('Failed to delete application', 'error');
    }
}

// Set up event listeners
function setupEventListeners() {
    // Update form
    const updateForm = document.getElementById('update-form');
    if (updateForm) {
        updateForm.addEventListener('submit', handleUpdateSubmit);
    }

    // Add event form
    const addEventForm = document.getElementById('add-event-form');
    if (addEventForm) {
        addEventForm.addEventListener('submit', handleAddEvent);
    }

    // Modal close buttons
    document.querySelectorAll('.modal-close').forEach(btn => {
        btn.addEventListener('click', () => {
            btn.closest('.modal').classList.remove('active');
        });
    });

    // Close modal when clicking outside
    document.querySelectorAll('.modal').forEach(modal => {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.classList.remove('active');
            }
        });
    });

    // Search functionality
    const searchInput = document.getElementById('search-input');
    if (searchInput) {
        searchInput.addEventListener('input', handleSearch);
    }

    // Filter functionality
    const filterSelect = document.getElementById('filter-status');
    if (filterSelect) {
        filterSelect.innerHTML = `<option value="">All Statuses</option>` +
            STATUS_OPTIONS.map(s => `<option value="${s.value}">${s.value}</option>`).join('');
        filterSelect.addEventListener('change', handleFilter);
    }

    // Logout button
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', signOut);
    }
}

// Handle search
function handleSearch(event) {
    const query = event.target.value.toLowerCase();
    const filterStatus = document.getElementById('filter-status')?.value || '';

    filterApplications(query, filterStatus);
}

// Handle filter
function handleFilter(event) {
    const filterStatus = event.target.value;
    const query = document.getElementById('search-input')?.value.toLowerCase() || '';

    filterApplications(query, filterStatus);
}

// Filter applications
function filterApplications(query, status) {
    const rows = document.querySelectorAll('#applications-tbody tr');

    rows.forEach(row => {
        const companyName = row.querySelector('.company-name')?.textContent.toLowerCase() || '';
        const rowStatus = row.querySelector('.status-badge')?.textContent || '';

        const matchesQuery = !query || companyName.includes(query);
        const matchesStatus = !status || rowStatus === status;

        row.style.display = matchesQuery && matchesStatus ? '' : 'none';
    });
}

// Show notification
function showNotification(message, type = 'info') {
    const container = document.getElementById('notification-container');
    if (!container) return;

    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;

    container.appendChild(notification);

    // Remove after 3 seconds
    setTimeout(() => {
        notification.remove();
    }, 3000);
}

// Utility functions
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function formatDate(dateString) {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
}

function getStatusColor(status) {
    const statusOption = STATUS_OPTIONS.find(s => s.value === status);
    return statusOption ? statusOption.color : '#95a5a6';
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', initDashboard);
