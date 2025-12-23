import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm'

// ⚠️ UTILISEZ VOTRE NOUVELLE CLÉ APRÈS RÉGÉNÉRATION
const supabaseUrl = 'https://vwmqhulgzawfwlpptpay.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ3bXFodWxnemF3ZndscHB0cGF5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY0MTEwMDUsImV4cCI6MjA4MTk4NzAwNX0.a_Zyy0sfGs1ik0CBPkuMPJ3W4Qwg0rZN19Jbre4jHY0' // ← À CHANGER

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Vérifier la connexion
supabase.auth.getSession().then(({ data: { session } }) => {
  if (session) {
    console.log('✅ Connecté à Supabase')
  } else {
    console.log('🔐 Non connecté')
  }
})