'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { LayoutList, Calendar as CalendarIcon, Sparkles, Trash2, ChevronLeft, ChevronRight } from 'lucide-react';
import Link from 'next/link';

interface Diary {
  id: string;
  title: string | null;
  content: string;
  created_at: string;
}

interface DashboardContentProps {
  initialDiaries: Diary[];
  deleteDiaryAction: (id: string) => Promise<void>;
}

export default function DashboardContent({ initialDiaries, deleteDiaryAction }: DashboardContentProps) {
  const [activeTab, setActiveTab] = useState<'daily' | 'calendar' | 'event'>('daily');
  
  // 削除モーダル用の状態管理
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [targetDiary, setTargetDiary] = useState<{ id: string, title: string } | null>(null);

  // 削除ボタンクリック時
  const openDeleteModal = (id: string, title: string | null) => {
    setTargetDiary({ id, title: title || '無題' });
    setIsModalOpen(true);
  };

  // 実際の削除実行
  const executeDelete = async () => {
    if (targetDiary) {
      await deleteDiaryAction(targetDiary.id);
      setIsModalOpen(false);
      setTargetDiary(null);
    }
  };

  return (
    <>
      {/* --- カスタム確認モーダル (hiddenの代わりに条件付きレンダリングとAnimatePresenceを使用) --- */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-100 flex items-center justify-center p-4 overflow-hidden">
            {/* 背景のオーバーレイ */}
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setIsModalOpen(false)}
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
            />
            
            {/* メッセージ本体 */}
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
              className="relative bg-white rounded-4xl p-8 max-w-sm w-full shadow-2xl border border-slate-100"
            >
              <div className="text-center">
                <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Trash2 className="text-red-500" size={28} />
                </div>
                <h3 className="text-lg font-bold text-slate-800 mb-2">
                  日記「{targetDiary?.title}」を消去しますか。
                </h3>
                
                <div className="flex gap-3">
                  <button 
                    onClick={() => setIsModalOpen(false)}
                    className="flex-1 py-3 px-6 bg-slate-100 text-slate-600 rounded-xl font-bold text-sm hover:bg-slate-200 transition-colors"
                  >
                    キャンセル
                  </button>
                  <button 
                    onClick={executeDelete}
                    className="flex-1 py-3 px-6 bg-red-500 text-white rounded-xl font-bold text-sm hover:bg-red-600 shadow-lg shadow-red-100 transition-all active:scale-95"
                  >
                    削除
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* --- タブセレクター --- */}
      <div className="flex justify-center mb-10">
        <div className="bg-slate-200/50 p-1.5 rounded-3xl flex gap-1 backdrop-blur-sm shadow-inner">
          {[
            { id: 'calendar' as const, label: 'カレンダー', icon: CalendarIcon },
            { id: 'daily' as const, label: 'デイリー', icon: LayoutList },
            { id: 'event' as const, label: 'イベント', icon: Sparkles },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-6 py-2.5 rounded-[1.2rem] text-sm font-bold transition-all ${
                activeTab === tab.id 
                ? 'bg-white text-sky-500 shadow-md scale-105' 
                : 'text-slate-400 hover:text-slate-600'
              }`}
            >
              <tab.icon size={16} />
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <AnimatePresence mode="wait">
        <motion.div key={activeTab} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
          {activeTab === 'daily' && (
            <div className="max-w-2xl mx-auto space-y-4">
              {initialDiaries.map((diary) => (
                <div key={diary.id} className="group relative bg-white/60 backdrop-blur-md p-6 rounded-4xl border border-white/20 shadow-lg hover:shadow-xl hover:bg-white/80 transition-all flex gap-6">
                  
                  {/* 右上の削除ボタン */}
                  <button 
                    onClick={() => openDeleteModal(diary.id, diary.title)}
                    className="absolute top-5 right-5 p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-full transition-all opacity-0 group-hover:opacity-100"
                  >
                    <Trash2 size={18} />
                  </button>

                  <div className="shrink-0 w-14 text-center border-r border-slate-50 pr-6">
                    <p className="text-2xl font-black text-slate-200 group-hover:text-sky-400 transition-colors leading-none">
                      {new Date(diary.created_at).getDate()}
                    </p>
                    <p className="text-[10px] uppercase font-bold text-slate-300 mt-1">
                      {new Date(diary.created_at).toLocaleDateString('en-US', { month: 'short' })}
                    </p>
                  </div>

                  <div className="flex-1 pr-8">
                    <Link href={`/diary/${diary.id}`} className="block">
                      <h3 className="font-bold text-slate-700 group-hover:text-sky-600 transition-colors mb-2">
                        {diary.title || '無題'}
                      </h3>
                      <p className="text-sm text-slate-400 line-clamp-2 leading-relaxed">
                        {diary.content}
                      </p>
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* カレンダー表示（省略せず維持） */}
          {activeTab === 'calendar' && (
            <div className="max-w-3xl mx-auto bg-white p-10 rounded-[3rem] shadow-2xl shadow-slate-200/50 border border-slate-100">
               <div className="flex justify-between items-center mb-10 px-4">
                <h2 className="text-2xl font-black text-slate-800 tracking-tighter">2026 February</h2>
                <div className="flex gap-3">
                  <button className="p-3 bg-slate-50 rounded-2xl hover:bg-slate-100 transition-colors"><ChevronLeft size={20}/></button>
                  <button className="p-3 bg-slate-50 rounded-2xl hover:bg-slate-100 transition-colors"><ChevronRight size={20}/></button>
                </div>
              </div>
              <div className="grid grid-cols-7 gap-3">
                {['日', '月', '火', '水', '木', '金', '土'].map(d => (
                  <div key={d} className="text-center text-xs font-bold text-slate-300 pb-4">{d}</div>
                ))}
                {Array.from({ length: 28 }).map((_, i) => {
                  const day = i + 1;
                  const hasDiary = initialDiaries.some(d => new Date(d.created_at).getDate() === day);
                  return (
                    <div key={i} className={`aspect-square relative flex items-center justify-center rounded-2xl text-sm font-bold transition-all cursor-pointer border
                      ${hasDiary ? 'bg-sky-500 text-white border-sky-400 shadow-lg shadow-sky-100 scale-105' : 'bg-slate-50/50 border-transparent text-slate-400 hover:bg-white hover:border-slate-200'}
                    `}>
                      {day}
                      {hasDiary && <div className="absolute bottom-2 w-1 h-1 bg-white/50 rounded-full" />}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {activeTab === 'event' && (
            <div className="max-w-2xl mx-auto py-32 flex flex-col items-center justify-center bg-white rounded-[3rem] border-2 border-dashed border-slate-100">
              <Sparkles className="text-slate-200 mb-4" size={48} />
              <p className="text-slate-400 font-bold tracking-[0.2em] text-sm italic">COMING SOON...</p>
              <p className="text-[10px] text-slate-300 mt-2">イベントや思い出を振り返る機能を追加予定です</p>
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </>
  );
}