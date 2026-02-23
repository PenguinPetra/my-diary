'use client';

import { useState, useEffect, use } from 'react';
import { ChevronLeft, Send, Calendar, ChevronRight, Trash2, Book, AlertTriangle } from 'lucide-react';
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

export default function ExchangeDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const diaryId = resolvedParams.id;

  const [entries, setEntries] = useState<Entry[]>([]);
  const [diaryTitle, setDiaryTitle] = useState('');
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [currentPage, setCurrentPage] = useState(0);
  const [loading, setLoading] = useState(true);
  
  // 確認メッセージの表示状態
  const [showConfirm, setShowConfirm] = useState(false);

  const supabase = createClient();
  const router = useRouter();

  useEffect(() => {
    const fetchData = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setCurrentUser(user);

      const { data: diary } = await supabase
        .from('exchange_diaries')
        .select('title')
        .eq('id', diaryId)
        .single();
      if (diary) setDiaryTitle(diary.title);

      const { data: rawEntries } = await supabase
        .from('exchange_diary_entries')
        .select(`
          id, content, created_at, author_id, is_read,
          author:profiles!exchange_diary_entries_author_id_fkey(username, avatar_url)
        `)
        .eq('diary_id', diaryId)
        .order('created_at', { ascending: true });

      const formattedEntries = (rawEntries as unknown as Entry[]) || [];
      setEntries(formattedEntries);
      
      const pageCount = Math.ceil(formattedEntries.length / 2);
      setCurrentPage(Math.max(0, pageCount - 1));

      if (formattedEntries.some(e => e.author_id !== user?.id && !e.is_read)) {
        await markAsRead(diaryId);
      }
      setLoading(false);
    };

    fetchData();
  }, [diaryId, supabase]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const content = formData.get('content') as string;
    if (!content.trim()) return;

    const result = await postEntry(diaryId, content);
    if (result.success) {
      window.location.reload();
    }
  };

  const handleDelete = async () => {
    const result = await deleteExchangeDiary(diaryId);
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
    <div className="min-h-screen bg-[#e2ddd3] selection:bg-orange-100 flex flex-col relative">
      
      {/* 削除確認メッセージ (hiddenクラスで制御) */}
      <div className={`fixed inset-0 z-100 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4 ${showConfirm ? 'block' : 'hidden'}`}>
        <div className="bg-white rounded-3xl p-8 max-w-sm w-full shadow-2xl text-center border border-slate-100">
          <div className="w-16 h-16 bg-rose-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertTriangle className="text-rose-500" size={32} />
          </div>
          <h2 className="text-xl font-bold text-slate-800 mb-2 font-serif">日記を削除しますか？</h2>
          <p className="text-slate-500 text-sm mb-8 leading-relaxed">
            これまでの記録がすべて削除されます。<br />この操作は取り消せません。
          </p>
          <div className="flex flex-col gap-3">
            <button 
              onClick={handleDelete}
              className="w-full py-4 bg-rose-500 text-white rounded-xl font-bold hover:bg-rose-600 transition-colors shadow-lg shadow-rose-200"
            >
              削除する
            </button>
            <button 
              onClick={() => setShowConfirm(false)}
              className="w-full py-4 bg-slate-100 text-slate-600 rounded-xl font-bold hover:bg-slate-200 transition-colors"
            >
              キャンセル
            </button>
          </div>
        </div>
      </div>

      <header className="w-full bg-white border-b border-slate-300 px-6 py-4 shadow-sm z-10">
        <div className="max-w-6xl mx-auto flex justify-between items-center">
          <Link href="/exchange" className="flex items-center gap-2 text-slate-500 hover:text-orange-600 transition-colors font-bold group">
            <ChevronLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
            <span className="text-sm font-serif">ノートを閉じる</span>
          </Link>
          
          <div className="flex items-center gap-3">
            <div className="bg-orange-500 p-1.5 rounded-lg shadow-sm">
              <Book className="text-white" size={18} />
            </div>
            <h1 className="text-lg font-black text-slate-800 tracking-tighter truncate font-serif">
              {diaryTitle}
            </h1>
          </div>

          {/* ゴミ箱をクリックすると、hiddenメッセージを解除する */}
          <button 
            onClick={() => setShowConfirm(true)}
            className="p-2.5 text-slate-300 hover:text-rose-500 transition-all"
          >
            <Trash2 size={20} />
          </button>
        </div>
      </header>

      <main className="flex-1 w-full p-4 md:p-12 flex flex-col items-center">
        <div className="relative w-full max-w-5xl aspect-4/3 md:aspect-video max-h-175 mt-4">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentPage}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="w-full h-full grid grid-cols-2 bg-[#fdfaf3] shadow-[0_30px_60px_-15px_rgba(0,0,0,0.3)] rounded-sm border border-slate-300 relative"
            >
              <div className="absolute inset-y-0 left-1/2 -translate-x-1/2 w-0.5 bg-linear-to-r from-slate-300 via-slate-100 to-slate-300 z-20" />

              <div className="relative overflow-hidden border-r border-slate-200 bg-notebook-paper">
                {pagedEntries[currentPage]?.[0] ? (
                  <PageContent entry={pagedEntries[currentPage][0]} isLeft />
                ) : (
                  <div className="h-full flex items-center justify-center text-slate-300 font-serif italic">最初のページ</div>
                )}
              </div>

              <div className="relative overflow-hidden bg-notebook-paper">
                {pagedEntries[currentPage]?.[1] ? (
                  <PageContent entry={pagedEntries[currentPage][1]} isLeft={false} />
                ) : (
                  <div className="h-full flex items-center justify-center text-slate-300 font-serif italic px-4 text-center">
                    {currentPage === pagedEntries.length - 1 ? "返信を待っています..." : "白紙"}
                  </div>
                )}
              </div>
            </motion.div>
          </AnimatePresence>

          <div className="absolute inset-y-0 -left-6 md:-left-16 flex items-center">
            <button
              onClick={() => setCurrentPage(prev => Math.max(0, prev - 1))}
              disabled={currentPage === 0}
              className="p-4 bg-white/90 hover:bg-white rounded-full shadow-lg disabled:opacity-0 transition-all z-30"
            >
              <ChevronLeft size={28} className="text-slate-600" />
            </button>
          </div>
          <div className="absolute inset-y-0 -right-6 md:-right-16 flex items-center">
            <button
              onClick={() => setCurrentPage(prev => Math.min(pagedEntries.length - 1, prev + 1))}
              disabled={currentPage === pagedEntries.length - 1}
              className="p-4 bg-white/90 hover:bg-white rounded-full shadow-lg disabled:opacity-0 transition-all z-30"
            >
              <ChevronRight size={28} className="text-slate-600" />
            </button>
          </div>
        </div>

        <div className="mt-12 mb-40 text-slate-500 font-serif tracking-[0.4em] text-xs font-bold">
          {currentPage * 2 + 1} / {currentPage * 2 + 2}
        </div>
      </main>

      <footer className="fixed bottom-0 left-0 right-0 p-6 bg-linear-to-t from-[#e2ddd3] via-[#e2ddd3]/80 to-transparent z-40">
        <div className="max-w-2xl mx-auto">
          {isMyTurn ? (
            <form onSubmit={handleSubmit} className="relative group">
              <textarea
                name="content"
                placeholder="続きを綴りましょう..."
                className="w-full pl-6 pr-16 py-4 bg-white border border-slate-200 rounded-2xl focus:border-orange-500 focus:ring-4 focus:ring-orange-500/10 outline-none transition-all shadow-2xl resize-none font-serif min-h-25"
                rows={2}
                required
              />
              <button
                type="submit"
                className="absolute right-3 bottom-3 p-3 bg-orange-500 text-white rounded-xl hover:bg-orange-600 transition-all shadow-lg active:scale-95"
              >
                <Send size={20} />
              </button>
            </form>
          ) : (
            <div className="w-full py-5 bg-white border border-slate-200 rounded-2xl text-slate-400 text-center font-serif italic shadow-lg">
              {lastEntry?.author.username} さんが書き終わるのを待っています...
            </div>
          )}
        </div>
      </footer>

      <style jsx global>{`
        .bg-notebook-paper {
          background-color: #fdfaf3;
          background-image: 
            linear-gradient(#e5e7eb 1px, transparent 1px);
          background-size: 100% 40px;
        }
      `}</style>
    </div>
  );
}

function PageContent({ entry, isLeft }: { entry: Entry, isLeft: boolean }) {
  const paddingStyle = isLeft ? 'pl-8 md:pl-12 pr-6 md:pr-10' : 'pl-6 md:pl-10 pr-8 md:pr-12';

  return (
    <div className={`w-full h-full py-0 ${paddingStyle}`}>
      <div className="flex items-center justify-between h-10 border-b border-rose-200/40">
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 relative rounded-full overflow-hidden">
            <Image
              src={entry.author.avatar_url || '/default-avatar.png'}
              alt="" fill className="object-cover grayscale-[0.2]"
              unoptimized
            />
          </div>
          <span className="text-[10px] font-bold text-slate-500 font-serif">
            {entry.author.username}
          </span>
        </div>
        <div className="flex items-center gap-1 text-[9px] font-mono text-rose-300">
          <Calendar size={10} />
          {new Date(entry.created_at).toLocaleDateString()}
        </div>
      </div>

      <div 
        className="text-slate-700 font-serif text-sm md:text-base whitespace-pre-wrap break-all tracking-wide"
        style={{ lineHeight: '40px' }}
      >
        {entry.content}
      </div>
    </div>
  );
}