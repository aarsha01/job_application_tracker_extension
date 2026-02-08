// Supabase Configuration
// Replace these with your actual Supabase project credentials

const SUPABASE_URL = 'https://ectrvzdnrijkcvslabad.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVjdHJ2emRucmlqa2N2c2xhYmFkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA1Mzc2MjAsImV4cCI6MjA4NjExMzYyMH0.F2lfYTvkUOVNqarscYjNkRByKxxAyldPH1Su7KiJVOc';

// Initialize Supabase client
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Export for use in other modules
window.supabaseClient = supabase;
