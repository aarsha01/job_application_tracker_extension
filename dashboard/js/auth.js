// Authentication functions

// Convert username to email format for Supabase Auth
function usernameToEmail(username) {
    return `${username.toLowerCase().trim()}@app.local`;
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
