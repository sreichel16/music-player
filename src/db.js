const supabaseUrl = 'https://chpiknoillslpmowgvdj.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNocGlrbm9pbGxzbHBtb3dndmRqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzkyMjQzNzEsImV4cCI6MjA5NDgwMDM3MX0.jXPWUm0WCmXJ4avNM8_-D5osLkqcIkPY2YhV1lV2zNA'

const { createClient } = supabase
const supabaseClient = createClient(supabaseUrl, supabaseKey)