import { createClient } from '@/lib/supabase/server';
import { notFound, redirect } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { 
  Edit2, ArrowLeft, Calendar, Heart, CheckSquare, 
  Target, MessageSquare, BookOpen, PenTool 
} from 'lucide-react';

interface TaskBlock {
  taskName: string;
  startDate: string; 
  deadline: string;
  finalGoal: string;
  progress: string;
  dailyPlan: string;
}

export default async function DiaryDetailPage({ 
  params 
}: { 
  params: Promise<{ id: string }> 
}) {
  const { id } = await params;
  const supabase = await createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: diary } = await supabase
    .from('diaries')
    .select('*')
    .eq('id', id)
    .single();

  if (!diary || diary.user_id !== user.id) {
    notFound();
  }

  const isTaskDiary = diary.diary_type === 'task';

  return (
    <div className="max-w-2xl mx-auto p-6 pb-20">
      {/* ナビゲーション */}
      <div className="flex justify-between items-center mb-8">
        <Link 
          href="/dashboard" 
          className="text-slate-400 hover:text-sky-500 flex items-center gap-1 transition-colors group"
        >
          <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
          <span className="text-sm font-black tracking-tighter uppercase">戻る</span>
        </Link>
        
        <Link 
          href={`/diary/${id}/edit`}
          className={`flex items-center gap-2 px-5 py-2 text-sm font-bold rounded-full transition-all border shadow-sm ${
            isTaskDiary 
            ? 'text-emerald-500 border-emerald-100 hover:bg-emerald-50' 
            : 'text-sky-500 border-sky-100 hover:bg-sky-50'
          }`}
        >
          <Edit2 size={16} />
          <span>編集する</span>
        </Link>
      </div>

      <article className="bg-white rounded-[3rem] shadow-2xl overflow-hidden border border-slate-50">
        <div className={`h-3 w-full ${isTaskDiary ? 'bg-emerald-400' : 'bg-sky-400'}`} />
        
        <div className="p-8 md:p-12">
          {/* ヘッダー情報 */}
          <div className="flex items-center gap-3 mb-6">
            <span className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
              isTaskDiary ? 'bg-emerald-50 text-emerald-500' : 'bg-sky-50 text-sky-500'
            }`}>
              {isTaskDiary ? (
                <><CheckSquare size={12} /> Task Diary</>
              ) : (
                <><Heart size={12} fill="currentColor" /> Memory Diary</>
              )}
            </span>
          </div>

          <header className="mb-8">
            <h1 className="text-4xl font-black text-slate-800 leading-tight">
              {diary.title || '無題の日記'}
            </h1>
          </header>

          {/* 1. 日付 (メインヘッダー) */}
          <div className="flex items-center gap-2 text-slate-400 mb-10 pb-6 border-b border-slate-50">
            <Calendar size={18} />
            <time className="text-lg font-bold tracking-tight text-slate-600">
              {new Date(diary.created_at).toLocaleDateString('ja-JP', {
                year: 'numeric', month: 'long', day: 'numeric', weekday: 'short'
              })}
            </time>
          </div>
          
          {/* 思い出日記用画像 */}
          {!isTaskDiary && diary.image_url && (
            <div className="relative w-full aspect-4/3 mb-10 rounded-4xl overflow-hidden shadow-xl bg-slate-50 border border-slate-100">
              <Image 
                src={diary.image_url} 
                alt={diary.title || '日記の画像'} 
                fill 
                className="object-cover transition-transform duration-700 hover:scale-105" 
                unoptimized
              />
            </div>
          )}

          {/* タスク日記用コンテンツ (task_data を参照) */}
          {isTaskDiary && diary.task_data && (
            <div className="space-y-12">
              {(diary.task_data as TaskBlock[]).map((task, idx) => (
                <div key={idx} className="relative space-y-8">
                  {/* セパレーターとしてのインデックス */}
                  {idx > 0 && <div className="border-t border-slate-100 pt-12" />}
                  
                  {/* 2. 課題名 */}
                  <div className="flex items-start gap-4">
                    <div className="bg-emerald-500 text-white w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 shadow-lg shadow-emerald-100">
                      <Target size={24} />
                    </div>
                    <div>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">課題名</p>
                      <h3 className="font-black text-slate-800 text-3xl">{task.taskName || '名称未設定'}</h3>
                    </div>
                  </div>

                  {/* 3. 今日の進捗 */}
                  <div className="bg-sky-50/50 rounded-4xl p-6 md:p-8 border border-sky-100 shadow-sm relative overflow-hidden">
                    <BookOpen className="absolute -right-4 -bottom-4 text-sky-500/10 w-24 h-24" />
                    <label className="text-[10px] font-black text-sky-500 uppercase tracking-widest mb-3 flex items-center gap-2">
                      <CheckSquare size={14} /> 今日の進捗
                    </label>
                    <p className="text-slate-700 text-lg font-medium leading-relaxed whitespace-pre-wrap relative z-10">
                      {task.progress || '進捗の入力はありません'}
                    </p>
                  </div>

                  {/* 修正ポイント：4. 締め切り & 5. 最終目標 を横並び（grid-cols-2）から縦並び（space-y-6）に変更 */}
                  <div className="flex flex-col gap-6">
                    {/* 4. 締め切り */}
                    <div className="bg-rose-50/50 p-6 rounded-4xl border border-rose-100">
                      <label className="text-[10px] font-black text-rose-400 uppercase tracking-widest mb-2 flex items-center gap-2">
                        <Calendar size={14} /> 締め切り
                      </label>
                      <p className="text-rose-600 text-xl font-black">
                        {task.deadline || '未設定'}
                      </p>
                    </div>

                    {/* 5. 最終目標 */}
                    <div className="bg-emerald-50/50 p-6 rounded-4xl border border-emerald-100">
                      <label className="text-[10px] font-black text-emerald-600 uppercase tracking-widest mb-2 flex items-center gap-2">
                        <PenTool size={14} /> 最終目標
                      </label>
                      <p className="text-emerald-800 font-bold text-lg">
                        {task.finalGoal || '未設定'}
                      </p>
                    </div>
                  </div>

                  {/* 6. 今後の予定 */}
                  <div className="bg-white p-6 md:p-8 rounded-4xl border-2 border-slate-100 border-dashed">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                      <MessageSquare size={14} /> 今後の予定
                    </label>
                    <p className="text-slate-600 font-bold leading-relaxed whitespace-pre-wrap">
                      {task.dailyPlan || '未入力'}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* 修正ポイント：タスク日記の場合は「全体メッセージ（本文）」を非表示、思い出日記の場合のみ表示 */}
          {!isTaskDiary && (
            <div className="mt-16 pt-10 border-t border-slate-50">
              <div className="flex items-center gap-2 mb-6">
              </div>
              <div className="leading-relaxed text-xl whitespace-pre-wrap font-serif text-slate-600 italic">
                {diary.content}
              </div>
            </div>
          )}
        </div>
      </article>
    </div>
  );
}