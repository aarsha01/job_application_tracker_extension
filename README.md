# Job Application Tracker

A Chrome browser extension and web dashboard to track your job applications across various job boards and email platforms.

## Features

- **Chrome Extension**: Add job applications directly from job sites (LinkedIn, Indeed, Glassdoor, etc.)
- **Email Integration**: Update application status when checking email (Gmail, Outlook, Yahoo)
- **Web Dashboard**: View all applications, track status, add interview/test events
- **Status Tracking**: Track applications through Applied → Interview → Offer stages
- **Event History**: Record interviews, tests, and other milestones

## Supported Sites

### Job Sites (Add Applications)
- LinkedIn
- Indeed
- Wellfound (AngelList)
- Glassdoor
- Wantedly (Japan)
- Rikunabi (Japan)
- Mynavi (Japan)
- En-Japan
- Daijob (Japan)
- CareerCross (Japan)
- Justa (Japan)

### Email Sites (Update Applications)
- Gmail (mail.google.com)
- Outlook (outlook.live.com, outlook.office.com)
- Yahoo Mail (mail.yahoo.com)

## Setup Instructions

### 1. Supabase Setup

1. Create a free account at [supabase.com](https://supabase.com)
2. Create a new project
3. Go to **Authentication → Providers → Email**
4. Disable "Confirm email" toggle (for username-based auth)
5. Go to **SQL Editor** and run the contents of `supabase/schema.sql`
6. Go to **Settings → API** and copy:
   - Project URL
   - anon/public key

### 2. Configure the Dashboard

1. Open `dashboard/js/supabase-config.js`
2. Replace `YOUR_SUPABASE_URL` with your Project URL
3. Replace `YOUR_SUPABASE_ANON_KEY` with your anon key

```javascript
const SUPABASE_URL = 'https://your-project.supabase.co';
const SUPABASE_ANON_KEY = 'your-anon-key-here';
```

### 3. Configure the Extension

1. Open `extension/popup/popup.js`
2. Replace the configuration values at the top:

```javascript
const SUPABASE_URL = 'https://your-project.supabase.co';
const SUPABASE_ANON_KEY = 'your-anon-key-here';
const DASHBOARD_URL = 'https://yourusername.github.io/job-tracker/dashboard/';
```

### 4. Host the Dashboard

#### Option A: GitHub Pages (Free)
1. Create a new GitHub repository
2. Upload the `dashboard` folder contents
3. Go to Settings → Pages → Enable GitHub Pages
4. Your dashboard will be at `https://yourusername.github.io/repo-name/`

#### Option B: Netlify (Free)
1. Go to [netlify.com](https://netlify.com)
2. Drag and drop the `dashboard` folder
3. Your dashboard will be deployed instantly

### 5. Install the Extension

#### Option A: Chrome Web Store ($5 one-time fee)
1. Go to [Chrome Developer Dashboard](https://chrome.google.com/webstore/devconsole)
2. Pay $5 one-time developer fee
3. Create new item, upload ZIP of `extension` folder
4. Submit for review (1-3 days)

#### Option B: Load Unpacked (Free, for personal use)
1. Open Chrome and go to `chrome://extensions`
2. Enable "Developer mode" (toggle in top right)
3. Click "Load unpacked"
4. Select the `extension` folder
5. The extension is now installed!

## Usage

### Adding Applications (Job Sites)
1. Visit a supported job site (e.g., linkedin.com/jobs)
2. Click the extension icon
3. Enter company name
4. Select if you applied and the date
5. Click "Add Application"

### Updating Applications (Email)
1. Visit your email (Gmail, Outlook, etc.)
2. Click the extension icon
3. Search for company name
4. Click on the application to select it
5. Update status, add notes, or record events
6. Click "Update"

### Dashboard
1. Open the dashboard website
2. Log in with your username and password
3. View all applications in a table
4. Click "Update" to change status or notes
5. Click "Events" to add interview/test dates

## Status Flow

```
Applied → Rejected
       → Test Scheduled → Test Passed → Interview Scheduled
                       → Test Failed
       → Interview Scheduled → Interview Cleared → Offer Received
                            → Interview Rejected
       → Offer Received → Offer Accepted
                       → Offer Declined
```

## Tech Stack

- **Frontend**: Vanilla HTML, CSS, JavaScript
- **Backend**: Supabase (PostgreSQL + Auth)
- **Extension**: Chrome Extension Manifest V3

## Project Structure

```
job_application_basic_tracker/
├── extension/                 # Chrome Extension
│   ├── manifest.json
│   ├── popup/
│   │   ├── popup.html
│   │   ├── popup.css
│   │   └── popup.js
│   ├── background.js
│   └── icons/
│
├── dashboard/                 # Web Dashboard
│   ├── index.html
│   ├── login.html
│   ├── signup.html
│   ├── css/styles.css
│   └── js/
│       ├── supabase-config.js
│       ├── auth.js
│       └── dashboard.js
│
├── supabase/
│   └── schema.sql
│
└── README.md
```

## Troubleshooting

### "Invalid login credentials"
- Make sure you've created an account first via the signup page
- Usernames are case-insensitive

### Extension not showing popup
- Make sure all files are in the correct location
- Check the Chrome console for errors (`chrome://extensions` → Details → Inspect views)

### Data not syncing
- Verify your Supabase credentials are correct in both config files
- Check that Row Level Security policies are enabled (run schema.sql)
- Check the browser console for API errors

## License

MIT License - feel free to modify and use for your own job search!
