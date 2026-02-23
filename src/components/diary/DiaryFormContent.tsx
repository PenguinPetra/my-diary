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
    image_url?: string;
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
      if (previewUrl && previewUrl.startsWith('blob:')) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  const addTaskBlock = () => {
    const newId = Date.now().toString();
    setTasks([...tasks, { 
      id: newId, taskName: '', startDate: selectedDate, deadline: '', finalGoal: '', progress: '', dailyPlan: '' 
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
      {/* ヘッダー・ナビゲーション：スマホでの余白とフォントサイズを調整 */}
      <div className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-100 px-3 sm:px-6 py-3 sm:py-4">
        <div className="max-w-3xl mx-auto flex justify-between items-center gap-2">
          <Link href="/dashboard" className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-400 shrink-0">
            <ChevronLeft size={24} />
          </Link>
          
          <div className="flex bg-slate-100 p-1 rounded-xl sm:rounded-2xl gap-0.5 sm:gap-1 flex-1 max-w-50 sm:max-w-none">
            <button 
              type="button"
              onClick={() => setDiaryType('memory')}
              className={`flex-1 flex items-center justify-center gap-1 sm:gap-2 px-2 sm:px-4 py-1.5 sm:py-2 rounded-lg sm:rounded-xl text-[10px] sm:text-sm font-black transition-all cursor-pointer ${diaryType === 'memory' ? 'bg-white text-sky-500 shadow-sm' : 'text-slate-500'}`}
            >
              <Heart size={14} fill={diaryType === 'memory' ? 'currentColor' : 'none'} className="sm:w-4 sm:h-4" />
              思い出
            </button>
            <button 
              type="button"
              onClick={() => setDiaryType('task')}
              className={`flex-1 flex items-center justify-center gap-1 sm:gap-2 px-2 sm:px-4 py-1.5 sm:py-2 rounded-lg sm:rounded-xl text-[10px] sm:text-sm font-black transition-all cursor-pointer ${diaryType === 'task' ? 'bg-white text-emerald-500 shadow-sm' : 'text-slate-500'}`}
            >
              <CheckSquare size={14} className="sm:w-4 sm:h-4" />
              タスク
            </button>
          </div>

          <button 
            onClick={handleSubmit}
            disabled={loading}
            className="flex items-center gap-1.5 sm:gap-2 bg-sky-500 hover:bg-sky-600 text-white px-3 sm:px-5 py-1.5 sm:py-2 rounded-full text-xs sm:text-sm font-bold shadow-lg shadow-sky-100 transition-all active:scale-95 disabled:opacity-50 shrink-0"
          >
            <Send size={16} className="sm:w-4.5 sm:h-4.5" />
            {loading ? '...' : '保存'}
          </button>
        </div>
      </div>

      <main className="max-w-3xl mx-auto mt-4 sm:mt-8 px-4">
        {/* 日付選択カード：スマホ用にコンパクト化 */}
        <div className="mb-4 sm:mb-6">
          <div 
            onClick={openCalendar}
            className="relative bg-white p-4 sm:p-6 rounded-3xl sm:rounded-[2.5rem] shadow-sm border border-slate-100 flex items-center gap-3 sm:gap-4 transition-all hover:border-sky-200 cursor-pointer active:scale-[0.98]"
          >
            <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl flex items-center justify-center transition-colors ${diaryType === 'memory' ? 'bg-sky-50 text-sky-500' : 'bg-emerald-50 text-emerald-500'}`}>
              <Calendar size={20} className="sm:w-6 sm:h-6" />
            </div>
            <div className="flex-1">
              <p className="text-[9px] sm:text-[10px] font-black text-slate-400 uppercase tracking-widest mb-0.5">日付</p>
              <div className="flex items-center">
                <span className="text-sm sm:text-lg font-bold text-slate-700">
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
              className="space-y-4 sm:space-y-6"
            >
              <div className="bg-white rounded-3xl sm:rounded-[3rem] shadow-sm border border-slate-100 overflow-hidden">
                <div className="px-5 sm:px-10 pt-6 sm:pt-10 pb-2 border-b-2 border-slate-200">
                  <input 
                    type="text" 
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="タイトル" 
                    className="w-full text-lg sm:text-2xl font-black text-slate-800 placeholder:text-slate-200 focus:outline-none bg-transparent"
                  />
                </div>

                {previewUrl && (
                  <div className="px-5 sm:px-10 pt-4 sm:pt-6">
                    <div className="relative rounded-xl sm:rounded-2xl overflow-hidden shadow-md border border-slate-100 bg-slate-50 aspect-video">
                      <Image src={previewUrl} alt="Preview" fill className="object-contain" unoptimized />
                      <button
                        type="button"
                        onClick={handleRemoveImage}
                        className="absolute top-2 right-2 sm:top-4 sm:right-4 p-2 bg-white/90 text-slate-500 rounded-full shadow-md z-10"
                      >
                        <X size={16} />
                      </button>
                    </div>
                  </div>
                )}
                
                <textarea 
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="今日はどんな一日でしたか？"
                  className="w-full px-5 sm:px-10 py-4 sm:py-6 h-60 sm:h-80 text-slate-600 text-sm sm:text-lg leading-relaxed focus:outline-none resize-none bg-transparent"
                />
                
                <div className="px-4 sm:px-8 py-4 sm:py-6 bg-slate-50/50 border-t border-slate-50">
                  <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleImageChange} />
                  <button 
                    type="button" 
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full sm:w-auto p-3 sm:p-4 bg-white hover:bg-sky-50 text-slate-500 hover:text-sky-500 rounded-xl sm:rounded-2xl shadow-sm transition-all flex items-center justify-center gap-2 font-black text-xs sm:text-sm cursor-pointer border border-slate-100"
                  >
                    <ImageIcon size={18} />
                    <span>写真をアップロード</span>
                  </button>
                </div>
              </div>
            </motion.div>
          ) : (
            <motion.div 
              key="task" 
              initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
              className="space-y-4 sm:space-y-6"
            >
              <div className="flex justify-between items-center mb-2 px-1">
                <h2 className="text-lg sm:text-xl font-black text-slate-800 tracking-tighter uppercase">Task Diary</h2>
                <p className="text-[10px] font-bold text-slate-400 bg-white px-2 py-0.5 rounded-full border border-slate-100">{tasks.length} Tasks</p>
              </div>

              {tasks.map((task, index) => (
                <div key={task.id} className="relative bg-white rounded-3xl sm:rounded-[2.5rem] shadow-sm border border-slate-100 overflow-hidden">
                  <div className="absolute top-0 left-0 w-1.5 sm:w-2 h-full bg-emerald-400" />
                  
                  {tasks.length > 1 && (
                    <button 
                      type="button"
                      onClick={() => removeTaskBlock(task.id)}
                      className="absolute top-4 right-4 p-2 text-slate-300 hover:text-red-500 transition-all cursor-pointer"
                    >
                      <Trash2 size={16} />
                    </button>
                  )}

                  <div className="p-5 sm:p-8 space-y-4 sm:space-y-6">
                    <div className="flex items-center gap-3 sm:gap-4">
                      <div className="w-8 h-8 sm:w-10 sm:h-10 bg-emerald-50 text-emerald-600 rounded-lg sm:rounded-xl flex items-center justify-center font-black text-xs sm:text-sm shrink-0">
                        {index + 1}
                      </div>
                      <div className="flex-1">
                        <label className="text-[9px] sm:text-[10px] font-black text-slate-400 uppercase mb-0.5 block">課題名</label>
                        <input 
                          type="text" 
                          placeholder="タスク名"
                          className="w-full text-base sm:text-xl font-black text-slate-800 placeholder:text-slate-200 focus:outline-none"
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

                    <div className="bg-rose-50/30 p-3 sm:p-4 rounded-xl sm:rounded-2xl border border-rose-100/50">
                      <label className="text-[9px] sm:text-[10px] font-black text-rose-400 uppercase mb-1 flex items-center gap-1"><Target size={10} /> 締め切り</label>
                      <input 
                        type="date" 
                        value={task.deadline}
                        onChange={(e) => {
                          const newTasks = [...tasks];
                          newTasks[index].deadline = e.target.value;
                          setTasks(newTasks);
                        }}
                        className="bg-transparent font-bold text-rose-600 w-full focus:outline-none text-xs sm:text-sm cursor-pointer" 
                        style={{ colorScheme: 'light' }}
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[9px] sm:text-[10px] font-black text-slate-400 uppercase flex items-center gap-2"><PenTool size={12} /> 最終目標</label>
                      <input 
                        type="text" 
                        value={task.finalGoal}
                        onChange={(e) => {
                          const newTasks = [...tasks];
                          newTasks[index].finalGoal = e.target.value;
                          setTasks(newTasks);
                        }}
                        placeholder="達成したいこと"
                        className="w-full p-3 sm:p-4 bg-emerald-50/30 border border-emerald-100 rounded-xl sm:rounded-2xl text-xs sm:text-sm font-bold text-emerald-800 focus:outline-none"
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-slate-50">
                      <div className="space-y-1.5">
                        <label className="text-[9px] sm:text-[10px] font-black text-sky-500 uppercase flex items-center gap-2"><BookOpen size={12} /> 今日の進捗</label>
                        <textarea 
                          value={task.progress}
                          onChange={(e) => {
                            const newTasks = [...tasks];
                            newTasks[index].progress = e.target.value;
                            setTasks(newTasks);
                          }}
                          className="w-full h-24 sm:h-32 p-3 sm:p-4 bg-slate-50 rounded-xl sm:rounded-2xl text-xs sm:text-sm text-slate-600 focus:outline-none resize-none border border-slate-100"
                          placeholder="状況を入力..."
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[9px] sm:text-[10px] font-black text-emerald-500 uppercase flex items-center gap-2"><MessageSquare size={12} /> 今後の予定</label>
                        <textarea 
                          value={task.dailyPlan}
                          onChange={(e) => {
                            const newTasks = [...tasks];
                            newTasks[index].dailyPlan = e.target.value;
                            setTasks(newTasks);
                          }}
                          className="w-full h-24 sm:h-32 p-3 sm:p-4 bg-slate-50 rounded-xl sm:rounded-2xl text-xs sm:text-sm text-slate-600 focus:outline-none resize-none border border-slate-100"
                          placeholder="次回の目標..."
                        />
                      </div>
                    </div>
                  </div>
                </div>
              ))}

              <button 
                type="button"
                onClick={addTaskBlock}
                className="w-full py-6 sm:py-10 border-2 sm:border-4 border-dashed border-slate-200 rounded-3xl sm:rounded-[3rem] text-slate-300 font-black text-sm sm:text-xl hover:bg-white hover:text-emerald-400 hover:border-emerald-100 transition-all flex flex-col items-center gap-2 sm:gap-3"
              >
                <Plus size={24} className="sm:w-8 sm:h-8" />
                <span>タスクを追加</span>
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}