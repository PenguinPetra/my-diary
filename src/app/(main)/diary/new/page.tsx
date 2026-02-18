'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Smile, ImageIcon, X, Send, ChevronLeft } from 'lucide-react';
import { createDiary, uploadDiaryImage } from '../../dashboard/actions';
import EmojiPicker from '@/components/EmojiPicker';
import Link from 'next/link';
import Image from 'next/image';

export default function NewDiaryPage() {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [showEmoji, setShowEmoji] = useState(false);
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) setImagePreview(URL.createObjectURL(file));
  };

  const addEmoji = (emoji: string) => {
    setContent(prev => prev + emoji);
    setShowEmoji(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    let imageUrl = null;
    if (fileInputRef.current?.files?.[0]) {
      const formData = new FormData();
      formData.append('file', fileInputRef.current.files[0]);
      imageUrl = await uploadDiaryImage(formData);
    }

    await createDiary(title, content, imageUrl);
    router.push('/dashboard');
  };

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/dashboard" className="p-2 hover:bg-slate-100 rounded-full"><ChevronLeft /></Link>
        <h1 className="text-xl font-bold">新しい日記</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          placeholder="タイトル（任意）"
          className="w-full text-2xl font-bold outline-none border-b pb-2 focus:border-sky-500"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />

        <div className="relative bg-slate-50 rounded-2xl p-4 border focus-within:ring-2 ring-sky-500 transition-all">
          <textarea
            placeholder="今日はどんな一日でしたか？"
            className="w-full h-64 bg-transparent outline-none resize-none"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            required
          />
          
          <div className="flex justify-between items-center mt-2 border-t pt-2">
            <div className="flex gap-2">
              <button type="button" onClick={() => fileInputRef.current?.click()} className="p-2 hover:bg-white rounded-full text-slate-500"><ImageIcon size={20} /></button>
              <button type="button" onClick={() => setShowEmoji(!showEmoji)} className="p-2 hover:bg-white rounded-full text-slate-500"><Smile size={20} /></button>
              {showEmoji && <EmojiPicker onSelect={addEmoji} />}
            </div>
          </div>
          <input type="file" ref={fileInputRef} hidden accept="image/*" onChange={handleImageChange} />
        </div>

        {imagePreview && (
          <div className="relative w-full h-48 rounded-xl overflow-hidden border">
            <Image src={imagePreview} alt="Preview" fill className="object-cover" />
            <button type="button" onClick={() => setImagePreview(null)} className="absolute top-2 right-2 bg-black/50 text-white p-1 rounded-full"><X size={16} /></button>
          </div>
        )}

        <button
          disabled={loading || !content}
          className="w-full py-4 bg-sky-500 text-white rounded-xl font-bold flex justify-center gap-2 items-center hover:bg-sky-600 disabled:opacity-50"
        >
          <Send size={18} /> {loading ? '保存中...' : '日記を保存する'}
        </button>
      </form>
    </div>
  );
}