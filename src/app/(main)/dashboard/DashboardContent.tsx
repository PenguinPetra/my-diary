'use client';

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  LayoutList, 
  Calendar as CalendarIcon, 
  Trash2, 
  ChevronLeft, 
  ChevronRight,
  ArrowUp,
  X,
  Heart,
  CheckSquare
} from 'lucide-react';
import Link from 'next/link';

interface Diary {
  id: string;
  title: string | null;
  content: string;
  created_at: string;
  diary_type: 'memory' | 'task'; // 型を追加
}

interface DashboardContentProps {
  initialDiaries: Diary[];
  deleteDiaryAction: (id: string) => Promise<void>;
}

export default function DashboardContent({ initialDiaries, deleteDiaryAction }: DashboardContentProps) {
  const [activeTab, setActiveTab] = useState<'daily' | 'calendar'>('daily');
  const [filterType, setFilterType] = useState<'all' | 'memory' | 'task'>('all'); // フィルタ用
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [targetDiary, setTargetDiary] = useState<{ id: string, title: string } | null>(null);
  const [mounted, setMounted] = useState(false);

  // カレンダー用：選択された日付の日記を表示するための状態
  const [selectedDateDiaries, setSelectedDateDiaries] = useState<{date: string, diaries: Diary[]} | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // フィルタリングされた日記リスト
  const filteredDiaries = initialDiaries.filter(d => 
    filterType === 'all' ? true : d.diary_type === filterType
  );

  // カレンダーの日付をクリックした時の処理
  const handleDateClick = (day: number) => {
    const year = 2026;
    const month = 1; // 2月
    const filtered = initialDiaries.filter(d => {
      const date = new Date(d.created_at);
      return date.getFullYear() === year && date.getMonth() === month && date.getDate() === day;
    });

    if (filtered.length > 0) {
      setSelectedDateDiaries({
        date: `${year}年${month + 1}月${day}日`,
        diaries: filtered
      });
    }
  };

  const openDeleteModal = (id: string, title: string | null) => {
    setTargetDiary({ id, title: title || '無題' });
    setIsModalOpen(true);
  };

  const executeDelete = async () => {
    if (targetDiary) {
      await deleteDiaryAction(targetDiary.id);
      setIsModalOpen(false);
      setTargetDiary(null);
      setSelectedDateDiaries(null);
    }
  };

  const tabSelector = (
    <div className="bg-slate-100 p-1 rounded-xl flex gap-1 shadow-inner border border-slate-200">
      {[
        { id: 'daily' as const, label: 'デイリー', icon: LayoutList },
        { id: 'calendar' as const, label: 'カレンダー', icon: CalendarIcon },
      ].map((tab) => (
        <button
          key={tab.id}
          onClick={() => setActiveTab(tab.id)}
          className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-sm font-black transition-all cursor-pointer ${
            activeTab === tab.id 
            ? 'bg-white text-slate-900 shadow-sm ring-1 ring-slate-200' 
            : 'text-slate-400 hover:text-slate-600'
          }`}
        >
          <tab.icon size={16} strokeWidth={activeTab === tab.id ? 3 : 2} />
          {tab.label}
        </button>
      ))}
    </div>
  );

  return (
    <div className="relative w-full">
      {mounted && createPortal(tabSelector, document.getElementById('header-tabs-slot')!)}

      <AnimatePresence mode="wait">
        <motion.div 
          key={activeTab} 
          initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
          className="relative z-0" 
        >
          {activeTab === 'daily' && (
            <div className="max-w-2xl mx-auto space-y-6">
              {/* --- フィルタボタンエリア --- */}
              <div className="flex justify-center gap-2 mb-8">
                {[
  { id: 'all' as const, label: 'すべて', color: 'bg-slate-800' },
  { id: 'memory' as const, label: '思い出', color: 'bg-sky-500' },
  { id: 'task' as const, label: 'タスク', color: 'bg-emerald-500' }
].map((btn) => (
  <button
    key={btn.id}
    onClick={() => setFilterType(btn.id)} // ここから 「as any」を削除
    className={`px-5 py-2 rounded-full text-xs font-black transition-all active:scale-95 cursor-pointer ${
      filterType === btn.id 
      ? `${btn.color} text-white shadow-lg` 
      : 'bg-white text-slate-400 border border-slate-100 hover:bg-slate-50'
    }`}
  >
    {btn.label}
  </button>
))}
              </div>

              {filteredDiaries.map((diary) => (
                <div key={diary.id} className="group relative bg-white/85 backdrop-blur-md p-6 rounded-[2.5rem] border border-white shadow-sm hover:shadow-md transition-all flex gap-6">
                  <button onClick={() => openDeleteModal(diary.id, diary.title)} className="absolute top-5 right-5 p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-full transition-all opacity-0 group-hover:opacity-100 cursor-pointer">
                    <Trash2 size={18} />
                  </button>
                  <div className="shrink-0 w-14 text-center border-r border-slate-100 pr-6">
                    <p className={`text-2xl font-black leading-none ${diary.diary_type === 'memory' ? 'text-sky-500' : 'text-emerald-500'}`}>{new Date(diary.created_at).getDate()}</p>
                    <p className="text-[10px] uppercase font-bold text-slate-400 mt-1">{new Date(diary.created_at).toLocaleDateString('en-US', { month: 'short' })}</p>
                  </div>
                  <div className="flex-1 pr-8">
                    <Link href={`/diary/${diary.id}`} className="block">
                      <div className="flex items-center gap-2 mb-2">
                         <span className={`text-[9px] px-2 py-0.5 rounded-full font-black uppercase tracking-tighter ${
                           diary.diary_type === 'memory' ? 'bg-sky-50 text-sky-500' : 'bg-emerald-50 text-emerald-500'
                         }`}>
                           {diary.diary_type === 'memory' ? 'Memory' : 'Task'}
                         </span>
                         <h3 className="font-bold text-slate-800 group-hover:text-sky-600 transition-colors">{diary.title || '無題'}</h3>
                      </div>
                      <p className="text-sm text-slate-500 line-clamp-2 leading-relaxed">{diary.content}</p>
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'calendar' && (
            <div className="max-w-3xl mx-auto bg-white/90 backdrop-blur-md p-10 rounded-[3rem] shadow-xl border border-white">
              <div className="flex justify-between items-center mb-10 px-4">
                <h2 className="text-2xl font-black text-slate-800 tracking-tighter">2026 February</h2>
                <div className="flex gap-3">
                  <button className="p-3 bg-slate-50 rounded-2xl text-slate-400 hover:bg-sky-500 hover:text-white transition-all cursor-pointer"><ChevronLeft size={20}/></button>
                  <button className="p-3 bg-slate-50 rounded-2xl text-slate-400 hover:bg-sky-500 hover:text-white transition-all cursor-pointer"><ChevronRight size={20}/></button>
                </div>
              </div>
              <div className="grid grid-cols-7 gap-3">
                {['日', '月', '火', '水', '木', '金', '土'].map(d => (
                  <div key={d} className="text-center text-xs font-bold text-slate-400 pb-4">{d}</div>
                ))}
                {Array.from({ length: 28 }).map((_, i) => {
                  const day = i + 1;
                  const hasDiary = initialDiaries.some(d => {
                    const date = new Date(d.created_at);
                    return date.getDate() === day && date.getMonth() === 1;
                  });
                  return (
                    <button 
                      key={i} 
                      onClick={() => handleDateClick(day)}
                      disabled={!hasDiary}
                      className={`aspect-square relative flex items-center justify-center rounded-2xl text-sm font-bold transition-all border
                      ${hasDiary 
                        ? 'bg-sky-500 text-white border-sky-400 shadow-lg shadow-sky-100 scale-105 cursor-pointer hover:bg-sky-600' 
                        : 'bg-white/50 border-slate-100 text-slate-400'
                      }`}
                    >
                      {day}
                      {hasDiary && <div className="absolute bottom-2 w-1 h-1 bg-white/50 rounded-full" />}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </motion.div>
      </AnimatePresence>

      {/* --- 日付別日記リストモーダル (刷新版UI：種類選択に対応) --- */}
      <AnimatePresence>
        {selectedDateDiaries && (
          <div className="fixed inset-0 z-180 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }} 
              onClick={() => setSelectedDateDiaries(null)} 
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-md" 
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }} 
              animate={{ scale: 1, opacity: 1, y: 0 }} 
              exit={{ scale: 0.9, opacity: 0, y: 20 }} 
              className="relative bg-slate-50/95 backdrop-blur-xl rounded-[3rem] shadow-[0_32px_64px_-16px_rgba(0,0,0,0.2)] max-w-lg w-full max-h-[85vh] overflow-hidden flex flex-col border border-white"
            >
              <div className="p-8 pb-4 flex justify-between items-center">
                <div>
                  <p className="text-sky-500 font-black text-xs uppercase tracking-[0.2em] mb-1">Archive</p>
                  <h3 className="text-2xl font-black text-slate-800 tracking-tighter">
                    {selectedDateDiaries.date}
                  </h3>
                  <p className="text-sm font-bold text-slate-400">どちらの日記を閲覧しますか？</p>
                </div>
                <button 
                  onClick={() => setSelectedDateDiaries(null)} 
                  className="w-10 h-10 flex items-center justify-center bg-white hover:bg-red-50 hover:text-red-500 rounded-full shadow-sm transition-all cursor-pointer text-slate-400"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-8 pt-2 space-y-4 custom-scrollbar">
                {selectedDateDiaries.diaries.map((diary, index) => (
                  <motion.div
                    key={diary.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <Link 
                      href={`/diary/${diary.id}`} 
                      className="group block p-6 bg-white rounded-4xl border border-slate-100 shadow-sm hover:shadow-xl transition-all duration-300 relative overflow-hidden"
                    >
                      <div className={`absolute top-0 left-0 w-1.5 h-full transition-opacity ${
                        diary.diary_type === 'memory' ? 'bg-sky-400' : 'bg-emerald-400'
                      }`} />
                      
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-3">
                          <div className={`p-2 rounded-xl ${diary.diary_type === 'memory' ? 'bg-sky-50 text-sky-500' : 'bg-emerald-50 text-emerald-500'}`}>
                            {diary.diary_type === 'memory' ? <Heart size={18} fill="currentColor" /> : <CheckSquare size={18} />}
                          </div>
                          <div>
                            <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">
                              {diary.diary_type === 'memory' ? 'Memory Diary' : 'Task Diary'}
                            </p>
                            <h4 className="text-lg font-bold text-slate-800">
                              {diary.title || '無題の日記'}
                            </h4>
                          </div>
                        </div>
                        <ChevronRight size={20} className="text-slate-300 group-hover:text-slate-600 transition-colors" />
                      </div>
                    </Link>
                  </motion.div>
                ))}
              </div>
              <div className="h-6 shrink-0" />
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* --- 常時表示ボタン --- */}
      <div className="fixed bottom-10 right-10 z-150 flex flex-col items-center gap-2">
        <button onClick={scrollToTop} className="w-14 h-14 bg-white/90 backdrop-blur-md text-slate-800 rounded-full shadow-2xl border border-slate-100 flex items-center justify-center hover:bg-sky-500 hover:text-white transition-all cursor-pointer active:scale-90 group">
          <ArrowUp size={24} className="group-hover:-translate-y-1 transition-transform" />
        </button>
      </div>

      {/* --- 削除確認モーダル --- */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-200 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsModalOpen(false)} className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" />
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="relative bg-white rounded-4xl p-8 max-w-sm w-full shadow-2xl border border-slate-100">
              <div className="text-center">
                <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4 text-red-500"><Trash2 size={28} /></div>
                <h3 className="text-lg font-bold text-slate-800 mb-2 leading-relaxed">日記を消去しますか？</h3>
                <div className="flex gap-3 mt-8">
                  <button onClick={() => setIsModalOpen(false)} className="flex-1 py-3 bg-slate-100 text-slate-600 rounded-xl font-bold text-sm hover:bg-slate-200 transition-colors cursor-pointer">キャンセル</button>
                  <button onClick={executeDelete} className="flex-1 py-3 bg-red-500 text-white rounded-xl font-bold text-sm hover:bg-red-600 shadow-lg shadow-red-100 transition-all cursor-pointer">削除</button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}