import Link from 'next/link';
import { getDiaries } from './actions';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Image from 'next/image';
import { LogOut, Settings, Users, Book } from 'lucide-react'; // Bookを追加

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: profile } = await supabase
    .from('profiles')
    .select('username, avatar_url')
    .eq('id', user.id)
    .single();

  // フレンド申請の数
  const { count: pendingCount } = await supabase
    .from('friends')
    .select('*', { count: 'exact', head: true })
    .eq('receiver_id', user.id)
    .eq('status', 'pending');

  // ★追加：交換日記の未読数（自分以外が書いた未読エントリをカウント）
  const { count: exchangeUnreadCount } = await supabase
    .from('exchange_diary_entries')
    .select('*, exchange_diary_participants!inner(*)', { count: 'exact', head: true })
    .eq('exchange_diary_participants.profile_id', user.id)
    .not('author_id', 'eq', user.id)
    .eq('is_read', false);

  const diaries = await getDiaries();

  async function logout() {
    'use server';
    const supabaseLogout = await createClient();
    await supabaseLogout.auth.signOut();
    redirect('/login');
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <header className="flex justify-between items-center mb-8 border-b pb-4">
        <Link href="/settings/profile" className="flex items-center gap-3 hover:opacity-80 transition-opacity group">
          <div className="relative w-12 h-12 overflow-hidden rounded-full border-2 border-white shadow-sm bg-slate-100">
            <Image 
              src={profile?.avatar_url || '/default-avatar.png'} 
              alt="icon" 
              fill 
              className="object-cover" 
              unoptimized 
            />
          </div>
          <div>
            <div className="flex items-center gap-1">
              <h1 className="text-xl font-bold text-slate-700 group-hover:text-sky-600 transition-colors">マイダイアリー</h1>
              <Settings size={14} className="text-slate-400" />
            </div>
            <p className="text-xs text-gray-500">{profile?.username || 'ゲスト'} のアーカイブ</p>
          </div>
        </Link>
        
        <div className="flex items-center gap-2 md:gap-4">
          {/* ★追加：交換日記アイコンと通知バッジ */}
          <Link 
            href="/exchange" 
            className="relative p-2 text-slate-500 hover:bg-slate-50 rounded-full transition-all group"
            title="交換日記"
          >
            <Book size={24} className="group-hover:text-amber-500 transition-colors" />
            {exchangeUnreadCount !== null && exchangeUnreadCount > 0 && (
              <span className="absolute top-0 right-0 min-w-4.5 h-4.5 px-1 bg-amber-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center border-2 border-white shadow-sm transform translate-x-1 -translate-y-1">
                {exchangeUnreadCount}
              </span>
            )}
          </Link>

          {/* フレンド管理 */}
          <Link 
            href="/friends" 
            className="relative p-2 text-slate-500 hover:bg-slate-50 rounded-full transition-all group"
            title="フレンド管理"
          >
            <Users size={24} className="group-hover:text-sky-500 transition-colors" />
            {pendingCount !== null && pendingCount > 0 && (
              <span className="absolute top-0 right-0 min-w-4.5 h-4.5 px-1 bg-rose-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center border-2 border-white shadow-sm transform translate-x-1 -translate-y-1">
                {pendingCount}
              </span>
            )}
          </Link>

          <form action={logout}>
            <button className="p-2 text-slate-400 hover:text-red-500 transition-colors" title="ログアウト">
              <LogOut size={20} />
            </button>
          </form>

          <Link 
            href="/diary/new" 
            className="bg-sky-500 text-white px-4 md:px-5 py-2 rounded-full text-sm hover:bg-sky-600 transition-all shadow-md flex items-center gap-2"
          >
            <span className="hidden md:inline">＋ 日記を書く</span>
            <span className="md:hidden text-lg">＋</span>
          </Link>
        </div>
      </header>

      <main>
        {diaries.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-gray-400">まだ、この物語の続きは書かれていません。</p>
          </div>
        ) : (
          <div className="grid gap-4">
            {diaries.map((diary) => (
              <Link 
                key={diary.id} 
                href={`/diary/${diary.id}`}
                className="group block p-5 bg-white border border-gray-100 rounded-2xl hover:shadow-lg transition-all"
              >
                <div className="flex justify-between items-start mb-2">
                  <h2 className="font-semibold text-slate-700 group-hover:text-sky-600 transition-colors">
                    {diary.title || '無題'}
                  </h2>
                  <span className="text-[10px] tracking-widest text-gray-400 uppercase">
                    {new Date(diary.created_at).toLocaleDateString('ja-JP')}
                  </span>
                </div>
                <p className="text-sm text-gray-500 line-clamp-2 leading-relaxed">{diary.content}</p>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}