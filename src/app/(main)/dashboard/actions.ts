'use server'

import { createClient } from '@/lib/supabase/server'

export async function getDiaries() {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('diaries')
    .select('*')
    .order('created_at', { ascending: false }) // 新しい順

  if (error) {
    console.error('Fetch Error:', error.message)
    return []
  }

  return data
}