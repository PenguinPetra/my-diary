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
      {/* --- ヘッダーバー：レスポンシブ調整 --- */}
      <header className="h-16 px-4 sm:px-6 w-full relative z-20">
        <div className="max-w-7xl mx-auto h-full flex justify-between items-center relative">
          
          {/* ロゴ：スマホでは少し小さく、幅も抑える */}
          <div className="w-24 sm:w-40 shrink-0">
            <h1 className="text-lg sm:text-xl font-black tracking-tighter text-slate-800">my-diary</h1>
          </div>

          {/* 中央タブ：スマホでは重なりを防ぐため非表示、またはDashboardContent側で調整 */}
          <div id="header-tabs-slot" className="absolute left-1/2 -translate-x-1/2 hidden md:flex items-center h-full" />

          <div className="flex items-center gap-2 sm:gap-4 shrink-0">
            {/* 日記を書くボタン：スマホではテキストを消してアイコンのみにする */}
            <Link href="/diary/new" className="flex items-center gap-2 bg-sky-500 hover:bg-sky-600 text-white px-3 py-2 sm:px-5 sm:py-2.5 rounded-full text-sm font-bold shadow-lg shadow-sky-500/20 transition-all active:scale-95">
              <Plus size={18} />
              <span className="hidden xs:inline">日記を書く</span>
            </Link>

            <div className="flex items-center gap-2 sm:gap-4 border-l border-slate-200/50 ml-1 sm:ml-2 pl-2 sm:pl-4">
              {/* ユーザー名とサブメニュー：スマホではアイコンのみを下に配置して省スペース化 */}
              <div className="text-right flex flex-col items-end">
                <p className="text-[10px] sm:text-xs font-bold text-slate-800 leading-none mb-1 hidden sm:block">
                  {profile?.username || 'Guest'}
                </p>
                <div className="flex gap-2 sm:gap-3 justify-end">
                  <Link href="/exchange" className="relative flex items-center gap-1 text-[10px] font-bold text-slate-500 hover:text-amber-500 transition-colors" title="交換日記">
                    <Book size={14} className="sm:w-3 sm:h-3" /> 
                    <span className="hidden xs:inline">交換</span>
                    {exchangeUnreadCount > 0 && <span className="absolute -top-1 -right-1 w-2 h-2 bg-amber-500 rounded-full border-2 border-white animate-pulse sm:static sm:border-0" />}
                  </Link>
                  <Link href="/friends" className="relative flex items-center gap-1 text-[10px] font-bold text-slate-500 hover:text-sky-500 transition-colors" title="フレンド">
                    <Users size={14} className="sm:w-3 sm:h-3" /> 
                    <span className="hidden xs:inline">フレンド</span>
                    {(pendingCount ?? 0) > 0 && <span className="absolute -top-1 -right-1 w-2 h-2 bg-rose-500 rounded-full border-2 border-white animate-pulse sm:static sm:border-0" />}
                  </Link>
                </div>
              </div>

              {/* アバター：サイズをスマホで微調整 */}
              <Link href="/settings/profile" className="relative w-8 h-8 sm:w-9 sm:h-9 rounded-full border border-slate-200 overflow-hidden bg-slate-100 shadow-sm shrink-0">
                <Image src={profile?.avatar_url || '/default-avatar.png'} alt="Avatar" fill className="object-cover" unoptimized />
              </Link>

              <form action={logout} className="shrink-0">
                <button className="p-1.5 sm:p-2 text-slate-400 hover:text-red-500 transition-colors cursor-pointer">
                  <LogOut size={18} />
                </button>
              </form>
            </div>
          </div>
        </div>
      </header>

      {/* --- メインコンテンツ領域：パディングの調整 --- */}
      <div className="flex-1">
        <TimeOfDayBackground>
          <div className="max-w-5xl mx-auto w-full p-4 sm:p-6 pt-6 sm:pt-10 min-h-screen relative">
            <DashboardContent initialDiaries={diaries} deleteDiaryAction={deleteDiary} />
          </div>
          
          <footer className="py-10 text-center text-slate-400/60 text-[10px] sm:text-xs font-bold tracking-widest mt-10">
            &copy; 2026 MY DIARY APP
          </footer>
        </TimeOfDayBackground>
      </div>
    </div>
  );
}