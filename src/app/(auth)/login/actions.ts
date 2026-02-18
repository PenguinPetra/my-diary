'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export async function signIn(formData: FormData) {
  const supabase = await createClient()

  const email = formData.get('email') as string
  const password = formData.get('password') as string

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (error) {
    console.error('Login Error:', error.message)
    // 実務ではここでエラーメッセージをクライアントに返す処理を入れます
    return { error: error.message }
  }

  // ログイン成功後、ダッシュボード（日記一覧）へ
  redirect('/dashboard')
}