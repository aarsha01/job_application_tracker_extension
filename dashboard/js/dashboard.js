// Dashboard

const STATUS_OPTIONS = [
    { value: 'Applied', class: 'status-applied' },
    { value: 'Rejected', class: 'status-rejected' },
    { value: 'Test Scheduled', class: 'status-test-scheduled' },
    { value: 'Test Passed', class: 'status-test-passed' },
    { value: 'Test Failed', class: 'status-test-failed' },
    { value: 'Interview Scheduled', class: 'status-interview-scheduled' },
    { value: 'Interview Cleared', class: 'status-interview-cleared' },
    { value: 'Interview Rejected', class: 'status-interview-rejected' },
    { value: 'Offer Received', class: 'status-offer-received' },
    { value: 'Offer Accepted', class: 'status-offer-accepted' },
    { value: 'Offer Declined', class: 'status-offer-declined' }
];

let currentUser = null;
let applications = [];

async function initDashboard() {
    // Check for tokens passed from extension via URL
    const tokenSession = await checkUrlTokens();

    // Use token session if available, otherwise check for existing session
    let session = tokenSession;
    if (!session) {
        session = await requireAuth();
    }

    if (!session) return;

    currentUser = session.user;
    document.getElementById('username-display').textContent = getUsername(currentUser);

    await loadApplications();
    setupEventListeners();
}

async function loadApplications() {
    try {
        const { data, error } = await supabaseClient
            .from('applications')
            .select('*')
            .order('application_date', { ascending: false });

        if (error) throw error;

        applications = data || [];
        renderTable();
        updateStats();
    } catch (error) {
        console.error('Error:', error);
        showNotification('Failed to load applications', 'error');
    }
}

function renderTable() {
    const tbody = document.getElementById('applications-tbody');

    if (applications.length === 0) {
        tbody.innerHTML = `<tr><td colspan="6" class="empty-state">No applications yet</td></tr>`;
        return;
    }

    tbody.innerHTML = applications.map(app => {
        const statusClass = STATUS_OPTIONS.find(s => s.value === app.status)?.class || 'status-applied';
        const truncatedNotes = app.notes ? (app.notes.length > 30 ? app.notes.substring(0, 30) + '...' : app.notes) : '-';

        return `
            <tr data-id="${app.id}" data-status="${app.status}">
                <td class="company-cell">${escapeHtml(app.company_name)}</td>
                <td class="date-cell">${formatDate(app.application_date)}</td>
                <td><span class="status-badge ${statusClass}">${app.status}</span></td>
                <td class="date-cell">${app.interview_date ? formatDate(app.interview_date) : '-'}</td>
                <td class="notes-cell" title="${app.notes ? escapeHtml(app.notes) : ''}">${escapeHtml(truncatedNotes)}</td>
                <td class="actions-cell">
                    <button class="btn btn-ghost btn-small" onclick="openModal('${app.id}')">View</button>
                    <button class="btn btn-danger btn-small" onclick="deleteApp('${app.id}')">Delete</button>
                </td>
            </tr>
        `;
    }).join('');
}

function updateStats() {
    document.getElementById('stat-total').textContent = applications.length;
    document.getElementById('stat-applied').textContent = applications.filter(a => a.status === 'Applied').length;
    document.getElementById('stat-interview').textContent = applications.filter(a => a.status.includes('Interview')).length;
    document.getElementById('stat-offer').textContent = applications.filter(a => a.status.includes('Offer')).length;
}

function openModal(id) {
    const app = applications.find(a => a.id === id);
    if (!app) return;

    document.getElementById('edit-app-id').value = app.id;
    document.getElementById('edit-company').value = app.company_name;
    document.getElementById('edit-interview-date').value = app.interview_date || '';
    document.getElementById('edit-notes').value = app.notes || '';
    document.getElementById('modal-title').textContent = app.company_name;

    const statusSelect = document.getElementById('edit-status');
    statusSelect.innerHTML = STATUS_OPTIONS.map(s =>
        `<option value="${s.value}" ${s.value === app.status ? 'selected' : ''}>${s.value}</option>`
    ).join('');

    document.getElementById('view-modal').classList.add('active');
}

function closeModal() {
    document.getElementById('view-modal').classList.remove('active');
}

async function handleSubmit(e) {
    e.preventDefault();

    const id = document.getElementById('edit-app-id').value;
    const updates = {
        company_name: document.getElementById('edit-company').value.trim(),
        status: document.getElementById('edit-status').value,
        interview_date: document.getElementById('edit-interview-date').value || null,
        notes: document.getElementById('edit-notes').value.trim() || null
    };

    if (!updates.company_name) {
        showNotification('Company name required', 'error');
        return;
    }

    try {
        const { error } = await supabaseClient
            .from('applications')
            .update(updates)
            .eq('id', id);

        if (error) throw error;

        showNotification('Updated', 'success');
        closeModal();
        await loadApplications();
    } catch (error) {
        console.error('Error:', error);
        showNotification('Update failed', 'error');
    }
}

async function deleteApp(id) {
    if (!confirm('Delete this application?')) return;

    try {
        const { error } = await supabaseClient
            .from('applications')
            .delete()
            .eq('id', id);

        if (error) throw error;

        showNotification('Deleted', 'success');
        await loadApplications();
    } catch (error) {
        console.error('Error:', error);
        showNotification('Delete failed', 'error');
    }
}

function setupEventListeners() {
    document.getElementById('search-input')?.addEventListener('input', filterTable);

    const filterSelect = document.getElementById('filter-status');
    filterSelect.innerHTML = `<option value="">All Statuses</option>` +
        STATUS_OPTIONS.map(s => `<option value="${s.value}">${s.value}</option>`).join('');
    filterSelect.addEventListener('change', filterTable);

    document.getElementById('edit-form')?.addEventListener('submit', handleSubmit);
    document.querySelectorAll('.modal-close').forEach(btn => btn.addEventListener('click', closeModal));
    document.querySelectorAll('.modal').forEach(m => m.addEventListener('click', e => { if (e.target === m) closeModal(); }));
    document.getElementById('logout-btn')?.addEventListener('click', signOut);
}

function filterTable() {
    const query = document.getElementById('search-input')?.value.toLowerCase().trim() || '';
    const status = document.getElementById('filter-status')?.value || '';

    document.querySelectorAll('#applications-tbody tr').forEach(row => {
        if (row.querySelector('.empty-state')) return;

        const company = row.querySelector('.company-cell')?.textContent.toLowerCase() || '';
        const rowStatus = row.dataset.status || '';

        row.style.display = (!query || company.includes(query)) && (!status || rowStatus === status) ? '' : 'none';
    });
}

function showNotification(msg, type = 'info') {
    const container = document.getElementById('notification-container');
    const el = document.createElement('div');
    el.className = `notification ${type}`;
    el.textContent = msg;
    container.appendChild(el);
    setTimeout(() => el.remove(), 3000);
}

function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function formatDate(str) {
    if (!str) return '-';
    return new Date(str).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

document.addEventListener('DOMContentLoaded', initDashboard);
