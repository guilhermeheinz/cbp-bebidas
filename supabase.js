import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm"

const supabaseUrl = "https://pksrvcloywzplmexrdbk.supabase.co"
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBrc3J2Y2xveXd6cGxtZXhyZGJrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM2NjEyOTgsImV4cCI6MjA4OTIzNzI5OH0.3kk-xZg-oBNxhrIReJm_tJP2DAhIMNosB_HixZDeQzI"

export const supabase = createClient(supabaseUrl, supabaseKey)