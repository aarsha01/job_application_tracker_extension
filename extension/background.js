// Background service worker for Job Application Tracker

// Listen for extension installation
chrome.runtime.onInstalled.addListener(() => {
    console.log('Job Application Tracker installed');
});

// Handle messages from popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'getCurrentTab') {
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            if (tabs[0]) {
                sendResponse({ url: tabs[0].url, title: tabs[0].title });
            } else {
                sendResponse({ url: null, title: null });
            }
        });
        return true; // Required for async sendResponse
    }
});
