'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export async function createDiary(formData: FormData) {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('認証が必要です')

  const title = formData.get('title') as string
  const content = formData.get('content') as string

  const { error } = await supabase
    .from('diaries')
    .insert([
      {
        user_id: user.id,
        title: title,
        content: content,
      },
    ])

  if (error) {
    console.error('保存失敗:', error.message)
    // エラー時は何もしないか、エラー専用ページへ飛ばす
    return 
  }

  // 成功時はリダイレクト
  redirect('/dashboard')
}