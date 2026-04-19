import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://irrimjdxvtrrbihdkpgs.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlycmltamR4dnRycmJpaGRrcGdzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY2MDQyNzYsImV4cCI6MjA5MjE4MDI3Nn0.u5qyPCAgkxddNy9mxeW8biV0S5qQmBSqa1hCqEByoaA'

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
