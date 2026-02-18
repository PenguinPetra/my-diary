import { createClient } from '@/lib/supabase/server';
import { notFound, redirect } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { Edit2, ArrowLeft, Calendar } from 'lucide-react';

// params の型定義を Promise に変更
export default async function DiaryDetailPage({ 
  params 
}: { 
  params: Promise<{ id: string }> 
}) {
  // 1. params を await して id を取り出す
  const { id } = await params;

  const supabase = await createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  // 2. await した id を使って検索
  const { data: diary } = await supabase
    .from('diaries')
    .select('*')
    .eq('id', id)
    .single();

  if (!diary || diary.user_id !== user.id) {
    notFound();
  }

  return (
    <div className="max-w-2xl mx-auto p-6">
      <div className="flex justify-between items-center mb-8">
        <Link 
          href="/dashboard" 
          className="text-slate-400 hover:text-sky-500 flex items-center gap-1 transition-colors group"
        >
          <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
          <span className="text-sm font-medium">一覧に戻る</span>
        </Link>
        
        {/* URL構築にも await した id を使用 */}
        <Link 
          href={`/diary/${id}/edit`}
          className="flex items-center gap-2 px-4 py-2 text-sm font-bold text-sky-500 hover:bg-sky-50 rounded-full transition-all border border-sky-100 shadow-sm"
        >
          <Edit2 size={16} />
          <span>編集する</span>
        </Link>
      </div>

      <article className="bg-white p-8 md:p-12 rounded-4xl border border-slate-100 shadow-xl shadow-slate-200/50">
        <header className="mb-8 border-b border-slate-50 pb-6">
          <div className="flex items-center gap-2 text-slate-400 mb-3">
            <Calendar size={14} />
            <time className="text-xs tracking-[0.2em] font-semibold uppercase">
              {new Date(diary.created_at).toLocaleDateString('ja-JP', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                weekday: 'short'
              })}
            </time>
          </div>
          <h1 className="text-3xl font-bold text-slate-800 leading-tight">
            {diary.title || '無題の日記'}
          </h1>
        </header>
        
        {diary.image_url && (
          <div className="relative w-full h-64 mb-8 rounded-lg overflow-hidden border border-slate-200 bg-slate-50">
            <Image 
              src={diary.image_url} 
              alt={diary.title || '日記の画像'} 
              fill 
              className="object-contain" 
              unoptimized 
            />
          </div>
        )}

        <div className="text-slate-600 leading-loose text-lg whitespace-pre-wrap font-serif">
          {diary.content}
        </div>

        <div className="mt-12 pt-6 border-t border-slate-50 flex justify-end">
          <div className="w-16 h-1 bg-sky-100 rounded-full"></div>
        </div>
      </article>
    </div>
  );
}