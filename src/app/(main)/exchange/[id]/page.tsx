'use client';

import { useState, useEffect, use } from 'react'; // use を追加
import { ChevronLeft, Send, Calendar, ChevronRight, Trash2 } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { createClient } from '@/lib/supabase/client';
import { postEntry, markAsRead, deleteExchangeDiary } from '../actions';
import type { User } from '@supabase/supabase-js';
import { useRouter } from 'next/navigation';

interface Entry {
  id: string;
  content: string;
  created_at: string;
  author_id: string;
  is_read: boolean;
  author: {
    username: string;
    avatar_url: string;
  };
}

// params の型を Promise に変更
export default function ExchangeDetailPage({ params }: { params: Promise<{ id: string }> }) {
  // params を展開して diaryId を取得
  const resolvedParams = use(params);
  const diaryId = resolvedParams.id;

  const [entries, setEntries] = useState<Entry[]>([]);
  const [diaryTitle, setDiaryTitle] = useState('');
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [currentPage, setCurrentPage] = useState(0);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();
  const router = useRouter();

  useEffect(() => {
    const fetchData = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setCurrentUser(user);

      const { data: diary } = await supabase
        .from('exchange_diaries')
        .select('title')
        .eq('id', diaryId) // diaryId を使用
        .single();
      if (diary) setDiaryTitle(diary.title);

      const { data: rawEntries } = await supabase
        .from('exchange_diary_entries')
        .select(`
          id, content, created_at, author_id, is_read,
          author:profiles!exchange_diary_entries_author_id_fkey(username, avatar_url)
        `)
        .eq('diary_id', diaryId) // diaryId を使用
        .order('created_at', { ascending: true });

      const formattedEntries = (rawEntries as unknown as Entry[]) || [];
      setEntries(formattedEntries);
      
      const pageCount = Math.ceil(formattedEntries.length / 2);
      setCurrentPage(Math.max(0, pageCount - 1));

      if (formattedEntries.some(e => e.author_id !== user?.id && !e.is_read)) {
        await markAsRead(diaryId); // diaryId を使用
      }
      setLoading(false);
    };

    fetchData();
  }, [diaryId, supabase]); // 依存配列を diaryId に変更

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const content = formData.get('content') as string;
    if (!content.trim()) return;

    const result = await postEntry(diaryId, content); // diaryId を使用
    if (result.success) {
      window.location.reload();
    }
  };

  const handleDelete = async () => {
    if (!confirm('この交換日記を削除しますか？\nこれまでの記録がすべて削除されます。')) return;
    
    const result = await deleteExchangeDiary(diaryId); // diaryId を使用
    if (result.success) {
      router.push('/exchange');
    } else {
      alert('削除に失敗しました: ' + result.error);
    }
  };

  if (loading) return <div className="min-h-screen bg-[#f8f5f0] flex items-center justify-center font-serif text-slate-400">ノートを開いています...</div>;

  const pagedEntries: Entry[][] = [];
  for (let i = 0; i < entries.length; i += 2) {
    pagedEntries.push(entries.slice(i, i + 2));
  }
  if (pagedEntries.length === 0) pagedEntries.push([]);

  const lastEntry = entries[entries.length - 1];
  const isMyTurn = !lastEntry || lastEntry.author_id !== currentUser?.id;

  return (
    <div className="min-h-screen bg-[#e2ddd3] pb-32">
      <header className="sticky top-0 z-30 p-4 max-w-5xl mx-auto flex items-center justify-between">
        <div className="flex-1">
          <Link 
            href="/exchange" 
            className="inline-flex items-center gap-2 px-3 py-2 bg-white/60 backdrop-blur-sm border border-slate-200 text-slate-600 rounded-lg hover:bg-white hover:text-amber-600 hover:shadow-md transition-all group"
          >
            <ChevronLeft size={20} className="group-hover:-translate-x-0.5 transition-transform" />
            <span className="text-sm font-bold font-serif">ノートを閉じる</span>
          </Link>
        </div>
        
        <div className="text-center flex-1">
          <h1 className="text-lg font-bold text-slate-800 font-serif truncate">{diaryTitle}</h1>
          <p className="text-[9px] text-slate-500 tracking-[0.3em] uppercase">Archive</p>
        </div>
        
        <div className="flex-1 flex justify-end">
          <button 
            onClick={handleDelete}
            className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-all"
            title="日記を削除"
          >
            <Trash2 size={20} />
          </button>
        </div>
      </header>

      <main className="max-w-6xl mx-auto p-4 flex flex-col items-center">
        <div className="relative w-full aspect-4/3 md:aspect-video max-h-150 mt-4">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentPage}
              initial={{ rotateY: 10, opacity: 0, x: 20 }}
              animate={{ rotateY: 0, opacity: 1, x: 0 }}
              exit={{ rotateY: -10, opacity: 0, x: -20 }}
              transition={{ duration: 0.4 }}
              className="w-full h-full grid grid-cols-2 bg-[#fdfaf3] shadow-[20px_20px_60px_rgba(0,0,0,0.15)] rounded-r-lg border-y border-r border-slate-300 relative overflow-hidden"
            >
              <div className="absolute inset-y-0 left-1/2 w-0.5 bg-linear-to-r from-slate-300 via-slate-100 to-slate-300 z-20 shadow-inner" />

              <div className="p-6 md:p-10 border-r border-slate-100 relative bg-[linear-gradient(#e5e7eb_1px,transparent_1px)] bg-size-[100%_2.5rem] leading-10">
                <div className="absolute left-6 top-0 bottom-0 w-px bg-rose-200 opacity-50" />
                {pagedEntries[currentPage]?.[0] ? (
                  <PageContent entry={pagedEntries[currentPage][0]} />
                ) : (
                  <div className="h-full flex items-center justify-center text-slate-300 font-serif italic">最初のページ</div>
                )}
              </div>

              <div className="p-6 md:p-10 relative bg-[linear-gradient(#e5e7eb_1px,transparent_1px)] bg-size-[100%_2.5rem] leading-10">
                {pagedEntries[currentPage]?.[1] ? (
                  <PageContent entry={pagedEntries[currentPage][1]} />
                ) : (
                  <div className="h-full flex items-center justify-center text-slate-300 font-serif italic">
                    {currentPage === pagedEntries.length - 1 ? "返信を待っています..." : "白紙"}
                  </div>
                )}
              </div>
            </motion.div>
          </AnimatePresence>

          <div className="absolute inset-y-0 -left-6 md:-left-12 flex items-center">
            <button
              onClick={() => setCurrentPage(prev => Math.max(0, prev - 1))}
              disabled={currentPage === 0}
              className="p-3 bg-white/50 hover:bg-white rounded-full shadow-md disabled:opacity-0 transition-all"
            >
              <ChevronLeft size={24} className="text-slate-600" />
            </button>
          </div>
          <div className="absolute inset-y-0 -right-6 md:-right-12 flex items-center">
            <button
              onClick={() => setCurrentPage(prev => Math.min(pagedEntries.length - 1, prev + 1))}
              disabled={currentPage === pagedEntries.length - 1}
              className="p-3 bg-white/50 hover:bg-white rounded-full shadow-md disabled:opacity-0 transition-all"
            >
              <ChevronRight size={24} className="text-slate-600" />
            </button>
          </div>
        </div>

        <div className="mt-8 text-slate-500 font-serif tracking-widest text-sm">
          - {currentPage * 2 + 1} / {currentPage * 2 + 2} -
        </div>
      </main>

      <footer className="fixed bottom-0 left-0 right-0 p-6 bg-linear-to-t from-[#e2ddd3] via-[#e2ddd3] to-transparent">
        <div className="max-w-2xl mx-auto">
          {isMyTurn ? (
            <form onSubmit={handleSubmit} className="relative group">
              <textarea
                name="content"
                placeholder="今日のできごとを綴りましょう..."
                className="w-full pl-6 pr-16 py-4 bg-white border-2 border-amber-200 rounded-2xl focus:border-amber-400 focus:ring-0 outline-none transition-all shadow-xl resize-none font-serif min-h-15"
                rows={2}
                required
              />
              <button
                type="submit"
                className="absolute right-3 top-1/2 -translate-y-1/2 p-3 bg-amber-500 text-white rounded-xl hover:bg-amber-600 transition-all shadow-lg active:scale-95"
              >
                <Send size={20} />
              </button>
            </form>
          ) : (
            <div className="w-full py-5 bg-white/50 border-2 border-dashed border-slate-300 rounded-2xl text-slate-500 text-center font-serif italic shadow-inner">
              {lastEntry?.author.username} さんが書き終わるのを待っています...
            </div>
          )}
        </div>
      </footer>
    </div>
  );
}

function PageContent({ entry }: { entry: Entry }) {
  return (
    <div className="font-serif text-slate-700">
      <div className="flex items-center justify-between mb-4 border-b border-rose-100 pb-1 h-10 leading-10">
        <div className="flex items-center gap-2">
          <div className="relative w-6 h-6">
            <Image
              src={entry.author.avatar_url || '/default-avatar.png'}
              alt="" fill className="rounded-full object-cover grayscale-[0.3]"
              unoptimized
            />
          </div>
          <span className="text-[10px] font-bold text-slate-400">{entry.author.username}</span>
        </div>
        <div className="flex items-center gap-1 text-[10px] text-rose-300">
          <Calendar size={10} />
          {new Date(entry.created_at).toLocaleDateString()}
        </div>
      </div>
      <div className="whitespace-pre-wrap text-sm md:text-base">
        {entry.content}
      </div>
    </div>
  );
}