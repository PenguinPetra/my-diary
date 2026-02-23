import { getDiaries, deleteDiary } from './actions';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { 
  LogOut, 
  Users, 
  Book, 
  Plus 
} from 'lucide-react';
import DashboardContent from './DashboardContent';
import TimeOfDayBackground from './TimeOfDayBackground';

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: profile } = await supabase
    .from('profiles')
    .select('username, avatar_url')
    .eq('id', user.id)
    .single();

  const { count: pendingCount } = await supabase
    .from('friends')
    .select('*', { count: 'exact', head: true })
    .eq('receiver_id', user.id)
    .eq('status', 'pending');

  const { data: myParticipatingDiaries } = await supabase
    .from('exchange_diary_participants')
    .select('diary_id')
    .eq('profile_id', user.id);

  const diaryIds = myParticipatingDiaries?.map(d => d.diary_id) || [];
  let exchangeUnreadCount = 0;
  if (diaryIds.length > 0) {
    const { count } = await supabase
      .from('exchange_diary_entries')
      .select('*', { count: 'exact', head: true })
      .in('diary_id', diaryIds)
      .not('author_id', 'eq', user.id)
      .eq('is_read', false);
    exchangeUnreadCount = count || 0;
  }

  const diaries = await getDiaries();

  async function logout() {
    'use server';
    const supabaseLogout = await createClient();
    await supabaseLogout.auth.signOut();
    redirect('/login');
  }

  return (
    <div className="min-h-screen flex flex-col">
      {/* --- ヘッダーバー：bg-whiteとshadowを削除して背景に馴染ませる --- */}
      <header className="h-16 px-6 w-full relative z-20">
        <div className="max-w-7xl mx-auto h-full flex justify-between items-center relative">
          
          <div className="w-40 shrink-0">
            <h1 className="text-xl font-black tracking-tighter text-slate-800">my-diary</h1>
          </div>

          <div id="header-tabs-slot" className="absolute left-1/2 -translate-x-1/2 flex items-center h-full" />

          <div className="flex items-center gap-4 shrink-0">
            <Link href="/diary/new" className="flex items-center gap-2 bg-sky-500 hover:bg-sky-600 text-white px-5 py-2.5 rounded-full text-sm font-bold shadow-lg shadow-sky-500/20 transition-all active:scale-95">
              <Plus size={18} />
              <span className="hidden sm:inline">日記を書く</span>
            </Link>

            <div className="flex items-center gap-4 border-l border-slate-200/50 ml-2 pl-4">
              <div className="text-right hidden md:block">
                <p className="text-xs font-bold text-slate-800 leading-none mb-1">{profile?.username || 'Guest'}</p>
                <div className="flex gap-3 justify-end">
                  <Link href="/exchange" className="relative flex items-center gap-1 text-[10px] font-bold text-slate-500 hover:text-amber-500 transition-colors">
                    <Book size={12} /> 
                    <span>交換日記</span>
                    {exchangeUnreadCount > 0 && <span className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-pulse" />}
                  </Link>
                  <Link href="/friends" className="relative flex items-center gap-1 text-[10px] font-bold text-slate-500 hover:text-sky-500 transition-colors">
                    <Users size={12} /> 
                    <span>フレンド</span>
                    {(pendingCount ?? 0) > 0 && <span className="w-1.5 h-1.5 bg-rose-500 rounded-full animate-pulse" />}
                  </Link>
                </div>
              </div>

              <Link href="/settings/profile" className="relative w-9 h-9 rounded-full border border-slate-200 overflow-hidden bg-slate-100 shadow-sm">
                <Image src={profile?.avatar_url || '/default-avatar.png'} alt="Avatar" fill className="object-cover" unoptimized />
              </Link>

              <form action={logout}>
                <button className="p-2 text-slate-400 hover:text-red-500 transition-colors cursor-pointer">
                  <LogOut size={18} />
                </button>
              </form>
            </div>
          </div>
        </div>
      </header>

      {/* --- メインコンテンツ領域 --- */}
      <div className="flex-1">
        <TimeOfDayBackground>
          {/* 指定された main 要素のスタイル（白背景）を削除 */}
          <div className="max-w-5xl mx-auto w-full p-6 pt-10 min-h-screen relative">
            <DashboardContent initialDiaries={diaries} deleteDiaryAction={deleteDiary} />
          </div>
          
          <footer className="py-10 text-center text-slate-400/60 text-xs font-bold tracking-widest mt-10">
            &copy; 2026 MY DIARY APP
          </footer>
        </TimeOfDayBackground>
      </div>
    </div>
  );
}