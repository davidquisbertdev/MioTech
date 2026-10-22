import { createClient } from '@supabase/supabase-js'

// Los valores de reserva evitan que el build falle mientras no rellenes el .env.local
export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co',
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-anon-key'
)

export const CREATE_EMPLOYEE_FN = 'create_employee'
