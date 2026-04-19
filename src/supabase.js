import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://uwavbltsaajygjytmgzt.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV3YXZibHRzYWFqeWdqeXRtZ3p0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY1MDMxNTAsImV4cCI6MjA5MjA3OTE1MH0.gLaeRwuBRv8eQ9PweWFWvwclBToLQmYSwt2GsE1Tm-Y';

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
