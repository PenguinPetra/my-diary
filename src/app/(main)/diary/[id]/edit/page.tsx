'use client'

import { useState, useEffect, useRef, use } from 'react' // React 19 の use を追加
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { updateDiary, uploadDiaryImage } from '../../../dashboard/actions'
import { ChevronLeft, ImageIcon, Smile, X } from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'
import EmojiPicker from '@/components/EmojiPicker'

export default function EditDiaryPage({ 
  params 
}: { 
  params: Promise<{ id: string }> 
}) {
  // params を React 19 の use() でアンラップ、または useParams() を使用
  const { id } = use(params);
  const router = useRouter()
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [showEmoji, setShowEmoji] = useState(false)
  const [loading, setLoading] = useState(true)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const supabase = createClient()

  useEffect(() => {
    const fetchDiary = async () => {
      const { data } = await supabase.from('diaries').select('*').eq('id', id).single()
      if (data) {
        setTitle(data.title || '')
        setContent(data.content)
        setImagePreview(data.image_url)
      }
      setLoading(false)
    }
    fetchDiary()
  }, [id, supabase])

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    let imageUrl = imagePreview
    // 新しいファイルが選択されている場合のみアップロードを実行
    if (fileInputRef.current?.files?.[0]) {
      const formData = new FormData()
      formData.append('file', fileInputRef.current.files[0])
      imageUrl = await uploadDiaryImage(formData)
    }

    try {
      await updateDiary(id, title, content, imageUrl)
      router.push('/dashboard')
    } catch (error) {
      console.error(error)
      alert('更新に失敗しました')
      setLoading(false)
    }
  }

  if (loading) return <div className="p-10 text-center text-slate-400">日記を読み込み中...</div>

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/dashboard" className="p-2 hover:bg-slate-100 rounded-full transition-colors">
          <ChevronLeft />
        </Link>
        <h1 className="text-xl font-bold text-slate-700">日記を編集</h1>
      </div>

      <form onSubmit={handleUpdate} className="flex flex-col gap-4">
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="タイトル（任意）"
          className="p-3 border rounded-xl outline-none focus:ring-2 focus:ring-sky-500 bg-slate-50 transition-all"
        />

        <div className="relative">
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            required
            rows={10}
            className="w-full p-4 border rounded-xl outline-none focus:ring-2 focus:ring-sky-500 bg-slate-50 resize-none transition-all leading-relaxed"
          />
          <div className="absolute bottom-4 left-4 flex gap-2">
            <button 
              type="button" 
              onClick={() => fileInputRef.current?.click()} 
              className="p-2 bg-white rounded-full shadow-sm border text-slate-500 hover:text-sky-500 transition-colors"
            >
              <ImageIcon size={18} />
            </button>
            <button 
              type="button" 
              onClick={() => setShowEmoji(!showEmoji)} 
              className="p-2 bg-white rounded-full shadow-sm border text-slate-500 hover:text-sky-500 transition-colors"
            >
              <Smile size={18} />
            </button>
            {showEmoji && <EmojiPicker onSelect={(e) => {
              setContent(prev => prev + e);
              setShowEmoji(false);
            }} />}
          </div>
          <input 
            type="file" 
            ref={fileInputRef} 
            hidden 
            accept="image/*" 
            onChange={(e) => {
              if (e.target.files?.[0]) {
                setImagePreview(URL.createObjectURL(e.target.files[0]))
              }
            }} 
          />
        </div>

        {imagePreview && (
          <div className="relative h-48 w-full rounded-xl overflow-hidden border border-slate-200">
            <Image src={imagePreview} alt="Diary Preview" fill className="object-cover" />
            <button 
              type="button" 
              onClick={() => {
                setImagePreview(null);
                if (fileInputRef.current) fileInputRef.current.value = "";
              }} 
              className="absolute top-2 right-2 bg-black/50 hover:bg-black/70 text-white p-1 rounded-full transition-colors"
            >
              <X size={16} />
            </button>
          </div>
        )}

        <button 
          type="submit" 
          disabled={loading} 
          className="py-4 bg-sky-500 text-white rounded-xl font-bold hover:bg-sky-600 transition-all shadow-md disabled:opacity-50"
        >
          {loading ? '保存中...' : '更新を保存する'}
        </button>
      </form>
    </div>
  )
}