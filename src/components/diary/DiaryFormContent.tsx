'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Heart, CheckSquare, Calendar, Plus, Trash2, ChevronLeft, 
  Image as ImageIcon, Send, Target, PenTool, BookOpen, X, MessageSquare
} from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';

// --- 型定義 ---

export interface HTMLInputElementWithPicker extends HTMLInputElement {
  showPicker: () => void;
}

export interface TaskBlock {
  id: string;
  taskName: string;
  startDate: string; 
  deadline: string;
  finalGoal: string;
  progress: string;
  dailyPlan: string;
}

export interface DiarySaveData {
  diary_type: 'memory' | 'task';
  date: string;
  title: string;
  content: string;
  tasks: TaskBlock[];
  imageFile?: File | null;
}

export interface DiaryFormProps {
  initialData?: {
    diary_type?: 'memory' | 'task';
    title?: string;
    content?: string;
    task_data?: TaskBlock[];
    created_at?: string;
    image_url?: string; // ← ここを追加：既存の画像URLを受け取るため
  } | null;
  onSave: (data: DiarySaveData) => Promise<void>;
  loading: boolean;
}

export default function DiaryFormContent({ initialData, onSave, loading }: DiaryFormProps) {
  const [diaryType, setDiaryType] = useState<'memory' | 'task'>(initialData?.diary_type || 'memory');
  const [selectedDate, setSelectedDate] = useState(
    initialData?.created_at ? new Date(initialData.created_at).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]
  );
  
  const [title, setTitle] = useState(initialData?.title || '');
  const [content, setContent] = useState(initialData?.content || '');
  
  const [tasks, setTasks] = useState<TaskBlock[]>(initialData?.task_data || [
    { id: '1', taskName: '', startDate: selectedDate, deadline: '', finalGoal: '', progress: '', dailyPlan: '' }
  ]);

  const [imageFile, setImageFile] = useState<File | null>(null);
  
  // 修正ポイント：初期値として initialData の image_url を設定する
  const [previewUrl, setPreviewUrl] = useState<string | null>(initialData?.image_url || null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
    }
  };

  const handleRemoveImage = () => {
    setImageFile(null);
    setPreviewUrl(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  useEffect(() => {
    return () => {
      // メモリリーク防止：ObjectURLは生成した場合のみ解放（既存のURLは解放しないよう注意が必要ですが、通常Next.jsのImageタグ利用時は問題ありません）
      if (previewUrl && previewUrl.startsWith('blob:')) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  const addTaskBlock = () => {
    const newId = Date.now().toString();
    setTasks([...tasks, { 
      id: newId, 
      taskName: '', 
      startDate: selectedDate, 
      deadline: '', 
      finalGoal: '', 
      progress: '', 
      dailyPlan: '' 
    }]);
  };

  const removeTaskBlock = (id: string) => {
    if (tasks.length > 1) {
      setTasks(tasks.filter(t => t.id !== id));
    }
  };

  const handleSubmit = () => {
    onSave({
      diary_type: diaryType,
      date: selectedDate,
      title,
      content,
      tasks: diaryType === 'task' ? tasks : [],
      imageFile: imageFile
    });
  };

  const openCalendar = () => {
    const dateInput = document.getElementById('main-date-picker') as HTMLInputElementWithPicker | null;
    if (dateInput) {
      if (typeof dateInput.showPicker === 'function') {
        dateInput.showPicker();
      } else {
        dateInput.focus();
      }
    }
  };

  return (
    <div className="min-h-screen bg-slate-50/50 pb-20">
      {/* ヘッダー・ナビゲーション */}
      <div className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-100 px-6 py-4">
        <div className="max-w-3xl mx-auto flex justify-between items-center">
          <Link href="/dashboard" className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-400">
            <ChevronLeft size={24} />
          </Link>
          
          <div className="flex bg-slate-100 p-1 rounded-2xl gap-1">
            <button 
              type="button"
              onClick={() => setDiaryType('memory')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-black transition-all cursor-pointer active:scale-95 ${diaryType === 'memory' ? 'bg-white text-sky-500 shadow-sm' : 'text-slate-500'}`}
            >
              <Heart size={16} fill={diaryType === 'memory' ? 'currentColor' : 'none'} />
              思い出
            </button>
            <button 
              type="button"
              onClick={() => setDiaryType('task')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-black transition-all cursor-pointer active:scale-95 ${diaryType === 'task' ? 'bg-white text-emerald-500 shadow-sm' : 'text-slate-500'}`}
            >
              <CheckSquare size={16} />
              タスク
            </button>
          </div>

          <button 
            onClick={handleSubmit}
            disabled={loading}
            className="flex items-center gap-2 bg-sky-500 hover:bg-sky-600 text-white px-5 py-2 rounded-full font-bold shadow-lg shadow-sky-100 transition-all active:scale-95 cursor-pointer disabled:opacity-50"
          >
            <Send size={18} />
            {loading ? '保存中...' : '保存'}
          </button>
        </div>
      </div>

      <main className="max-w-3xl mx-auto mt-8 px-4">
        {/* 日付選択カード */}
        <div className="mb-6">
          <div 
            onClick={openCalendar}
            className="relative bg-white p-6 rounded-[2.5rem] shadow-sm border border-slate-100 flex items-center gap-4 transition-all hover:border-sky-200 hover:shadow-md cursor-pointer active:scale-[0.98] group"
          >
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-colors ${diaryType === 'memory' ? 'bg-sky-50 text-sky-500' : 'bg-emerald-50 text-emerald-500'}`}>
              <Calendar size={24} />
            </div>
            <div className="flex-1">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">日付</p>
              <div className="flex items-center">
                <span className="text-lg font-bold text-slate-700">
                  {new Date(selectedDate).toLocaleDateString('ja-JP', { 
                    year: 'numeric', month: 'long', day: 'numeric', weekday: 'short' 
                  })}
                </span>
                <input 
                  id="main-date-picker"
                  type="date" 
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  style={{ colorScheme: 'light' }}
                />
              </div>
            </div>
          </div>
        </div>

        <AnimatePresence mode="wait">
          {diaryType === 'memory' ? (
            <motion.div 
              key="memory" 
              initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
              className="space-y-6"
            >
              <div className="bg-white rounded-[3rem] shadow-sm border border-slate-100 overflow-hidden">
                <div className="px-10 pt-10 pb-2 border-b-2 border-slate-200">
                  <input 
                    type="text" 
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="タイトル（任意）" 
                    className="w-full text-2xl font-black text-slate-800 placeholder:text-slate-200 focus:outline-none bg-transparent"
                  />
                </div>

                {previewUrl && (
                  <div className="px-10 pt-6">
                    <div className="relative rounded-2xl overflow-hidden shadow-md border border-slate-100 bg-slate-50 group aspect-video">
                      <Image 
                        src={previewUrl} 
                        alt="Preview" 
                        fill
                        className="object-contain mx-auto"
                        unoptimized
                      />
                      <button
                        type="button"
                        onClick={handleRemoveImage}
                        className="absolute top-4 right-4 p-2 bg-white/90 hover:bg-red-50 text-slate-500 hover:text-red-500 rounded-full shadow-md transition-all active:scale-90 z-10"
                      >
                        <X size={20} />
                      </button>
                    </div>
                  </div>
                )}
                
                <textarea 
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="今日はどんな一日でしたか？"
                  className="w-full px-10 py-6 h-80 text-slate-600 text-lg leading-relaxed focus:outline-none resize-none bg-transparent"
                />
                
                <div className="px-8 py-6 bg-slate-50/50 border-t border-slate-50 flex gap-4">
                  <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleImageChange} />
                  <button 
                    type="button" 
                    onClick={() => fileInputRef.current?.click()}
                    className="p-4 bg-white hover:bg-sky-50 text-slate-500 hover:text-sky-500 rounded-2xl shadow-sm transition-all flex items-center gap-2 font-black text-sm cursor-pointer active:scale-95 border border-slate-100"
                  >
                    <ImageIcon size={20} />
                    <span>写真をアップロード</span>
                  </button>
                </div>
              </div>
            </motion.div>
          ) : (
            <motion.div 
              key="task" 
              initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
              className="space-y-6"
            >
              <div className="flex justify-between items-center mb-4 px-2">
                <h2 className="text-xl font-black text-slate-800 tracking-tighter uppercase">Task Diary</h2>
                <p className="text-xs font-bold text-slate-400 bg-white px-3 py-1 rounded-full border border-slate-100">{tasks.length} Tasks Active</p>
              </div>

              {tasks.map((task, index) => (
                <div key={task.id} className="relative group bg-white rounded-[2.5rem] shadow-sm border border-slate-100 overflow-hidden transition-all hover:shadow-md">
                  <div className="absolute top-0 left-0 w-2 h-full bg-emerald-400" />
                  
                  {tasks.length > 1 && (
                    <button 
                      type="button"
                      onClick={() => removeTaskBlock(task.id)}
                      className="absolute top-6 right-6 p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-full transition-all opacity-0 group-hover:opacity-100 cursor-pointer active:scale-90"
                    >
                      <Trash2 size={18} />
                    </button>
                  )}

                  <div className="p-8 space-y-6">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center font-black text-sm shrink-0">
                        {index + 1}
                      </div>
                      <div className="flex-1">
                        <label className="text-[10px] font-black text-slate-400 uppercase mb-1 block">課題名</label>
                        <input 
                          type="text" 
                          placeholder="タスク名・課題名"
                          className="w-full text-xl font-black text-slate-800 placeholder:text-slate-200 focus:outline-none"
                          value={task.taskName}
                          onChange={(e) => {
                              const newTasks = [...tasks];
                              newTasks[index].taskName = e.target.value;
                              setTasks(newTasks);
                              if (index === 0) setTitle(e.target.value);
                          }}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 gap-4">
                      <div className="bg-rose-50/30 p-4 rounded-2xl border border-rose-100/50">
                        <label className="text-[10px] font-black text-rose-400 uppercase mb-1 flex items-center gap-1"><Target size={10} /> 締め切り</label>
                        <input 
                          type="date" 
                          value={task.deadline}
                          onChange={(e) => {
                            const newTasks = [...tasks];
                            newTasks[index].deadline = e.target.value;
                            setTasks(newTasks);
                          }}
                          className="bg-transparent font-bold text-rose-600 w-full focus:outline-none text-sm cursor-pointer" 
                          style={{ colorScheme: 'light' }}
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2"><PenTool size={12} /> 最終目標</label>
                      <input 
                        type="text" 
                        value={task.finalGoal}
                        onChange={(e) => {
                          const newTasks = [...tasks];
                          newTasks[index].finalGoal = e.target.value;
                          setTasks(newTasks);
                        }}
                        placeholder="この課題で達成したいこと"
                        className="w-full p-4 bg-emerald-50/30 border border-emerald-100 rounded-2xl text-sm font-bold text-emerald-800 placeholder:text-emerald-200 focus:outline-none"
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-slate-50">
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-sky-500 uppercase tracking-widest flex items-center gap-2"><BookOpen size={12} /> 今日の進捗</label>
                        <textarea 
                          value={task.progress}
                          onChange={(e) => {
                            const newTasks = [...tasks];
                            newTasks[index].progress = e.target.value;
                            setTasks(newTasks);
                          }}
                          className="w-full h-32 p-4 bg-slate-50 rounded-2xl text-sm text-slate-600 leading-relaxed focus:outline-none resize-none border border-slate-100"
                          placeholder="現在の進捗状況を入力..."
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-emerald-500 uppercase tracking-widest flex items-center gap-2"><MessageSquare size={12} /> 今後の予定</label>
                        <textarea 
                          value={task.dailyPlan}
                          onChange={(e) => {
                            const newTasks = [...tasks];
                            newTasks[index].dailyPlan = e.target.value;
                            setTasks(newTasks);
                          }}
                          className="w-full h-32 p-4 bg-slate-50 rounded-2xl text-sm text-slate-600 leading-relaxed focus:outline-none resize-none border border-slate-100"
                          placeholder="今後の予定、次回の目標など..."
                        />
                      </div>
                    </div>
                  </div>
                </div>
              ))}

              <button 
                type="button"
                onClick={addTaskBlock}
                className="w-full py-10 border-4 border-dashed border-slate-100 rounded-[3rem] text-slate-300 font-black text-xl hover:bg-white hover:text-emerald-400 hover:border-emerald-100 transition-all flex flex-col items-center gap-3 cursor-pointer group active:scale-[0.98]"
              >
                <div className="p-3 bg-slate-50 rounded-full group-hover:bg-emerald-50 transition-colors">
                    <Plus size={32} />
                </div>
                <span>新しいタスクブロックを追加</span>
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}