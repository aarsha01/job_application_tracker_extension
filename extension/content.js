// Content script for Job Application Tracker
// Runs on the dashboard domain to sync logout state

// Listen for logout event from dashboard
window.addEventListener('job-tracker-logout', () => {
    chrome.runtime.sendMessage({ action: 'logout' });
});

// Listen for auth state from dashboard
window.addEventListener('message', (event) => {
    if (event.data && event.data.type === 'JOB_TRACKER_LOGOUT') {
        chrome.runtime.sendMessage({ action: 'logout' });
    }
});
