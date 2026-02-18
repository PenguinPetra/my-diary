import Link from 'next/link';
import { getDiaries, deleteDiary } from './actions';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Image from 'next/image';
import { 
  LogOut, 
  Users, 
  Book, 
  Plus 
} from 'lucide-react';
import DashboardContent from './DashboardContent';
import TimeOfDayBackground from './TimeOfDayBackground'; // 新しく追加する背景コンポーネント

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
    // 背景コンポーネントで全体をラップ
    <TimeOfDayBackground>
      <div className="min-h-screen text-slate-600 relative z-10"> {/* z-10で背景の上に表示 */}
        <header className="bg-white/70 backdrop-blur-md border-b border-slate-100 sticky top-0 z-30 px-6 py-4">
          <div className="max-w-6xl mx-auto flex justify-between items-center">
            <h1 className="text-xl font-black tracking-tighter text-slate-800">my-diary</h1>

            <div className="flex items-center gap-4 md:gap-8">
              <Link href="/diary/new" className="flex items-center gap-2 bg-sky-500 hover:bg-sky-600 text-white px-5 py-2.5 rounded-full text-sm font-bold shadow-lg shadow-sky-100 transition-all active:scale-95">
                <Plus size={18} />
                <span className="hidden sm:inline">日記を書く</span>
              </Link>

              <div className="flex items-center gap-3">
                <div className="text-right hidden sm:block">
                  <p className="text-sm font-bold text-slate-700 leading-none mb-1">{profile?.username || 'Guest'}</p>
                  <div className="flex gap-3 justify-end">
                    <Link href="/exchange" className="relative flex items-center gap-1 text-[10px] font-bold text-slate-400 hover:text-amber-500 transition-colors">
                      <Book size={10} /> 交換日記
                      {exchangeUnreadCount > 0 && <span className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-pulse" />}
                    </Link>
                    <Link href="/friends" className="relative flex items-center gap-1 text-[10px] font-bold text-slate-400 hover:text-sky-500 transition-colors">
                      <Users size={10} /> フレンド
                      {(pendingCount ?? 0) > 0 && <span className="w-1.5 h-1.5 bg-rose-500 rounded-full animate-pulse" />}
                    </Link>
                  </div>
                </div>

                <Link href="/settings/profile" className="relative w-10 h-10 rounded-full border-2 border-white shadow-sm overflow-hidden bg-slate-100 hover:ring-2 hover:ring-sky-100 transition-all">
                  <Image 
                    src={profile?.avatar_url || '/default-avatar.png'} 
                    alt="Avatar" fill className="object-cover" unoptimized 
                  />
                </Link>

                <form action={logout}>
                  <button className="p-2 text-slate-300 hover:text-red-400 transition-colors">
                    <LogOut size={18} />
                  </button>
                </form>
              </div>
            </div>
          </div>
        </header>

        <main className="max-w-5xl mx-auto p-6 mt-4">
          <DashboardContent initialDiaries={diaries} deleteDiaryAction={deleteDiary} />
        </main>
      </div>
    </TimeOfDayBackground>
  );
}