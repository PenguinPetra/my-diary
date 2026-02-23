'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Plus, Book, ChevronLeft, ArrowRight } from 'lucide-react';
import Link from 'next/link';

export interface ExchangeDiaryWithStatus {
  id: string;
  title: string;
  partnerName: string;
  created_at: string;
  hasUnread: boolean;
}

// 夕暮れの光を象徴するオレンジ・ゴールド系のリボン
const RIBBON_PATHS = [
  { d: "M-100,250 C300,200 600,450 1500,300", color: "stroke-orange-400/50", width: 20 },
  { d: "M-100,400 C400,350 800,600 1500,450", color: "stroke-amber-300/40", width: 30 },
  { d: "M-100,550 C500,500 900,200 1500,350", color: "stroke-rose-400/30", width: 15 },
];

export default function ExchangeDiaryClient({ diaries }: { diaries: ExchangeDiaryWithStatus[] }) {
  return (
    <div className="relative min-h-screen w-full overflow-hidden">
      {/* 1. 背景：教室の風景 */}
      <div 
        className="absolute inset-0 z-0 bg-cover bg-center bg-no-repeat"
        style={{ 
          backgroundImage: `url('/images/classroom-sunset.png')`,
          backgroundColor: '#fdf2f0'
        }}
      >
        <div className="absolute inset-0 bg-linear-to-b from-orange-900/20 via-orange-500/10 to-transparent backdrop-blur-[2px]" />
      </div>

      {/* 2. エモーショナルなリボン */}
      <svg className="absolute inset-0 z-10 w-full h-full pointer-events-none">
        {RIBBON_PATHS.map((r, i) => (
          <motion.path
            key={i}
            d={r.d}
            fill="none"
            className={r.color}
            strokeWidth={r.width}
            strokeLinecap="round"
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{ pathLength: 1, opacity: 1 }}
            transition={{ duration: 4, delay: i * 0.5, ease: "easeInOut" }}
          />
        ))}
      </svg>

      {/* 3. コンテンツレイヤー */}
      <div className="relative z-20 flex flex-col min-h-screen">
        
        {/* ヘッダー */}
        <header className="w-full bg-white/95 backdrop-blur-md shadow-lg border-b border-orange-100 px-6 py-4 sticky top-0 z-50">
          <div className="max-w-6xl mx-auto flex justify-between items-center">
            <Link href="/dashboard" className="flex items-center gap-2 text-slate-500 hover:text-orange-600 transition-colors font-bold group">
              <ChevronLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
              <span className="text-sm">日記一覧へ</span>
            </Link>
            
            <div className="flex items-center gap-3">
              <div className="bg-orange-500 p-2 rounded-xl shadow-md">
                <Book className="text-white" size={20} />
              </div>
              <h1 className="text-xl font-black text-slate-800 tracking-tighter">交換日記</h1>
            </div>

            <Link href="/exchange/new" className="bg-orange-500 hover:bg-orange-600 text-white p-2.5 rounded-xl shadow-lg transition-all active:scale-95">
              <Plus size={24} />
            </Link>
          </div>
        </header>

        {/* 日記カードリスト */}
        <main className="flex-1 max-w-7xl mx-auto w-full p-8 md:p-12">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
            {diaries.map((diary, index) => (
              <motion.div
                key={diary.id}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.15 }}
                whileHover={{ y: -8 }}
                className="relative"
              >
                <Link href={`/exchange/${diary.id}`} className="block group">
                  <div className="bg-white/90 backdrop-blur-lg rounded-2xl overflow-hidden shadow-2xl border border-white/50 relative">
                    
                    {/* 左側のバインダーの穴 */}
                    <div className="absolute left-4 top-0 bottom-0 flex flex-col justify-center gap-6 pointer-events-none py-10">
                      {[1, 2, 3, 4].map(n => (
                        <div key={n} className="w-5 h-5 bg-slate-100 rounded-full shadow-inner border border-slate-300" />
                      ))}
                    </div>

                    <div className="pl-14 p-8">
                      {/* ステータスバー */}
                      <div className="flex justify-between items-start mb-6">
                        <div className="flex flex-col">
                          <span className="text-[10px] font-black text-orange-500 tracking-[0.2em] uppercase mb-1">交換相手</span>
                          <span className="text-2xl font-black text-slate-800">
                            {diary.partnerName} <span className="text-sm font-medium text-slate-400">さん</span>
                          </span>
                        </div>
                        {diary.hasUnread && (
                          <span className="px-3 py-1 bg-rose-500 text-white text-[10px] font-black rounded-full animate-pulse">
                            NEW
                          </span>
                        )}
                      </div>

                      {/* セパレーター */}
                      <div className="h-px w-full bg-linear-to-r from-orange-200 to-transparent mb-6" />

                      {/* 日記タイトル */}
                      <div className="mb-8 min-h-20">
                        <span className="text-[10px] font-bold text-slate-400 italic block mb-2">日記のタイトル</span>
                        <h2 className="text-3xl font-black text-slate-700 leading-tight group-hover:text-orange-600 transition-colors">
                          {diary.title}
                        </h2>
                      </div>

                      {/* フッター情報 */}
                      <div className="flex items-end justify-between border-t border-slate-100 pt-6 mt-4">
                        <div className="text-[10px] font-mono text-slate-400 leading-none">
                          <p>交換日記の開始日</p>
                          <p className="text-slate-600 font-bold mt-1 uppercase tracking-tighter">
                            {new Date(diary.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
                          </p>
                        </div>
                        <div className="flex items-center gap-2 text-orange-500 font-black text-sm group-hover:translate-x-1 transition-transform">
                          <span>見る</span>
                          <ArrowRight size={16} />
                        </div>
                      </div>
                    </div>

                    {/* 装飾のプラスマークは削除しました */}
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        </main>
      </div>

      <style jsx global>{`
        body { background-color: #000; }
        ::-webkit-scrollbar { width: 6px; }
        ::-webkit-scrollbar-track { background: rgba(0,0,0,0.1); }
        ::-webkit-scrollbar-thumb { background: rgba(249, 115, 22, 0.5); border-radius: 10px; }
      `}</style>
    </div>
  );
}