'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

// 日記の取得
export async function getDiaries() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  const { data, error } = await supabase
    .from('diaries')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  if (error) return []
  return data
}

// 画像のアップロード
export async function uploadDiaryImage(formData: FormData) {
  const supabase = await createClient()
  const file = formData.get('file') as File
  if (!file) return null

  const fileExt = file.name.split('.').pop()
  const fileName = `${Math.random()}.${fileExt}`
  const filePath = `diary-images/${fileName}`

  const { error: uploadError } = await supabase.storage
    .from('diary-images')
    .upload(filePath, file)

  if (uploadError) throw new Error('画像のアップロードに失敗しました')

  const { data } = supabase.storage.from('diary-images').getPublicUrl(filePath)
  return data.publicUrl
}

// 日記の作成 (新規)
export async function createDiary(title: string, content: string, imageUrl: string | null) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('認証が必要です')

  const { error } = await supabase.from('diaries').insert({
    user_id: user.id,
    title,
    content,
    image_url: imageUrl
  })

  if (error) throw error
  revalidatePath('/dashboard')
}

// 日記の更新 (編集)
export async function updateDiary(
  diaryId: string, 
  title: string, 
  content: string, 
  imageUrl?: string | null
) {
  const supabase = await createClient()
  
  // 更新するデータの型を定義（titleとcontentは必須、image_urlは任意）
  const updateData: {
    title: string;
    content: string;
    image_url?: string | null;
  } = { 
    title, 
    content 
  }

  // imageUrlが渡された場合（undefinedでない場合）のみ、更新対象に含める
  if (imageUrl !== undefined) {
    updateData.image_url = imageUrl
  }

  const { error } = await supabase
    .from('diaries')
    .update(updateData)
    .eq('id', diaryId)

  if (error) throw error
  
  revalidatePath('/dashboard')
  revalidatePath(`/diary/${diaryId}`)
}

// 日記の削除
export async function deleteDiary(diaryId: string) {
  const supabase = await createClient()
  const { error } = await supabase.from('diaries').delete().eq('id', diaryId)
  if (error) throw error
  revalidatePath('/dashboard')
}