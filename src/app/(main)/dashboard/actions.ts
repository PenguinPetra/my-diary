'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

/**
 * 型定義
 */
interface TaskBlock {
  id: string;
  taskName: string;
  startDate: string;
  deadline: string;
  finalGoal: string;
  progress: string;
  dailyPlan: string;
}

/**
 * 更新データの型定義
 */
interface UpdateDiaryPayload {
  title: string;
  content: string;
  image_url?: string | null;
  diary_type?: 'memory' | 'task';
  task_data?: TaskBlock[];
  created_at?: string;
}

/**
 * ヘルパー関数: 画像のアップロードと公開URLの取得
 */
async function uploadAndGetPublicUrl(file: File) {
  const supabase = await createClient()
  
  const fileExt = file.name.split('.').pop()
  const fileName = `${Math.random().toString(36).slice(2)}-${Date.now()}.${fileExt}`
  
  const { error: uploadError } = await supabase.storage
    .from('diary-images')
    .upload(fileName, file)

  if (uploadError) {
    console.error('Storage Upload Error:', uploadError)
    throw new Error('画像のアップロードに失敗しました')
  }

  const { data } = supabase.storage.from('diary-images').getPublicUrl(fileName)
  return data.publicUrl
}

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

// 日記の作成 (新規)
export async function createDiary(
  title: string, 
  content: string, 
  imageFile: File | null,
  diaryType: 'memory' | 'task' = 'memory',
  taskData: TaskBlock[] = [],
  date: string
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('認証が必要です')

  // --- 修正ポイント：タイトルと課題名の連動 ---
  let finalTitle = title;
  if (diaryType === 'task' && taskData.length > 0) {
    // 1番目のタスク名があれば、それをタイトルに採用する
    finalTitle = taskData[0].taskName || title || '名称未設定の課題';
  }

  let finalImageUrl = null;
  if (imageFile && imageFile.size > 0) {
    finalImageUrl = await uploadAndGetPublicUrl(imageFile)
  }

  const { error } = await supabase.from('diaries').insert({
    user_id: user.id,
    title: finalTitle, // 連動させたタイトルを保存
    content,
    image_url: finalImageUrl,
    diary_type: diaryType,
    task_data: taskData,
    created_at: new Date(date).toISOString(),
  })

  if (error) throw error
  revalidatePath('/dashboard')
}

// 日記の更新 (編集)
export async function updateDiary(
  diaryId: string, 
  title: string, 
  content: string, 
  imageFileOrUrl?: File | string | null,
  diaryType?: 'memory' | 'task',
  taskData?: TaskBlock[],
  date?: string
) {
  const supabase = await createClient()
  
  // --- 修正ポイント：編集時もタイトルと課題名を連動 ---
  let finalTitle = title;
  if (diaryType === 'task' && taskData && taskData.length > 0) {
    finalTitle = taskData[0].taskName || title;
  }

  const updateData: UpdateDiaryPayload = { 
    title: finalTitle, 
    content 
  }

  if (imageFileOrUrl instanceof File) {
    updateData.image_url = await uploadAndGetPublicUrl(imageFileOrUrl)
  } else if (imageFileOrUrl !== undefined) {
    updateData.image_url = imageFileOrUrl
  }

  if (diaryType !== undefined) updateData.diary_type = diaryType
  if (taskData !== undefined) updateData.task_data = taskData
  if (date !== undefined) updateData.created_at = new Date(date).toISOString()

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