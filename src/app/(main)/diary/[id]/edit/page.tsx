'use client'

import { useState, useEffect, use } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { updateDiary } from '../../../dashboard/actions'
import DiaryFormContent from '@/components/diary/DiaryFormContent'
import type { DiarySaveData, DiaryFormProps } from '@/components/diary/DiaryFormContent'

export default function EditDiaryPage({ 
  params 
}: { 
  params: Promise<{ id: string }> 
}) {
  const { id } = use(params);
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  
  const [initialData, setInitialData] = useState<DiaryFormProps['initialData']>(null)
  
  const supabase = createClient()

  useEffect(() => {
    const fetchDiary = async () => {
      const { data, error } = await supabase
        .from('diaries')
        .select('*')
        .eq('id', id)
        .single()

      if (data) {
        setInitialData({
          diary_type: data.diary_type,
          title: data.title,
          content: data.content,
          task_data: data.task_data,
          created_at: data.created_at,
          image_url: data.image_url // ここで画像URLを確実に渡しています
        })
      } else {
        console.error('Fetch error:', error)
        alert('日記が見つかりませんでした')
        router.push('/dashboard')
      }
      setLoading(false)
    }
    fetchDiary()
  }, [id, supabase, router])

  const handleSave = async (data: DiarySaveData) => {
    setSaving(true)
    try {
      await updateDiary(
        id,
        data.title,
        data.content,
        data.imageFile || null,
        data.diary_type,
        data.tasks,
        data.date
      )

      router.push(`/diary/${id}`)
      router.refresh()
    } catch (error) {
      console.error('Update failed:', error)
      alert('更新に失敗しました。')
    } finally {
      setSaving(false)
    }
  }

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="text-slate-400 font-black animate-pulse uppercase tracking-widest">Loading...</div>
    </div>
  )

  return (
    <DiaryFormContent 
      onSave={handleSave} 
      loading={saving} 
      initialData={initialData} 
    />
  )
}