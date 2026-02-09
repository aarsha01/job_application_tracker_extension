// Authentication functions

// Convert username to email format for Supabase Auth
function usernameToEmail(username) {
    return `${username.toLowerCase().trim()}@app.local`;
}

// Check for session tokens passed from extension via URL
async function checkUrlTokens() {
    const params = new URLSearchParams(window.location.search);
    const accessToken = params.get('access_token');
    const refreshToken = params.get('refresh_token');

    if (accessToken && refreshToken) {
        try {
            // Set the session using the tokens from the extension
            const { data, error } = await supabaseClient.auth.setSession({
                access_token: accessToken,
                refresh_token: refreshToken
            });

            // Clean up URL (remove tokens from address bar)
            const cleanUrl = window.location.origin + window.location.pathname;
            window.history.replaceState({}, document.title, cleanUrl);

            if (error) {
                return null;
            }

            // Return the session from setSession result
            return data.session;
        } catch (e) {
            return null;
        }
    }
    return null;
}

// Sign up new user
async function signUp(username, password) {
    const email = usernameToEmail(username);

    const { data, error } = await supabaseClient.auth.signUp({
        email: email,
        password: password,
        options: {
            data: {
                username: username
            }
        }
    });

    if (error) throw error;
    return data;
}

// Sign in user
async function signIn(username, password) {
    const email = usernameToEmail(username);

    const { data, error } = await supabaseClient.auth.signInWithPassword({
        email: email,
        password: password
    });

    if (error) throw error;
    return data;
}

// Sign out user
async function signOut() {
    const { error } = await supabaseClient.auth.signOut();
    if (error) throw error;

    // Notify extension about logout (via content script)
    window.postMessage({ type: 'JOB_TRACKER_LOGOUT' }, '*');

    window.location.href = 'login.html';
}

// Get current session
async function getSession() {
    const { data: { session }, error } = await supabaseClient.auth.getSession();
    if (error) throw error;
    return session;
}

// Get current user
async function getCurrentUser() {
    const { data: { user }, error } = await supabaseClient.auth.getUser();
    if (error) throw error;
    return user;
}

// Check if user is authenticated and redirect if not
async function requireAuth() {
    const session = await getSession();
    if (!session) {
        window.location.href = 'login.html';
        return null;
    }
    return session;
}

// Redirect to dashboard if already logged in
async function redirectIfLoggedIn() {
    // First check for tokens passed from extension
    await checkUrlTokens();

    const session = await getSession();
    if (session) {
        window.location.href = 'index.html';
    }
}

// Get username from user metadata or email
function getUsername(user) {
    if (user.user_metadata && user.user_metadata.username) {
        return user.user_metadata.username;
    }
    // Extract username from email (remove @app.local)
    return user.email.replace('@app.local', '');
}

// Check session validity when tab becomes visible (detects logout from extension)
function setupVisibilityCheck() {
    document.addEventListener('visibilitychange', async () => {
        if (document.visibilityState === 'visible') {
            const session = await getSession();
            if (!session && !window.location.pathname.includes('login') && !window.location.pathname.includes('signup')) {
                // Session was invalidated (logged out from extension)
                window.location.href = 'login.html';
            }
        }
    });
}

// Initialize visibility check
setupVisibilityCheck();
