import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';
import { Book, Plus, ChevronRight, ChevronLeft } from 'lucide-react';

interface ExchangeDiary {
  id: string;
  title: string;
  created_at: string;
}

interface ParticipantResponse {
  diary_id: string;
  exchange_diaries: ExchangeDiary | null;
}

export default async function ExchangePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return null;

  // 1. 自分が参加している日記を取得
  const { data: rawData } = await supabase
    .from('exchange_diary_participants')
    .select(`
      diary_id,
      exchange_diaries ( id, title, created_at )
    `)
    .eq('profile_id', user.id);

  const diariesRaw = (rawData as unknown as ParticipantResponse[]) || [];

  // 2. 各日記に未読エントリがあるか確認
  const diariesWithStatus = await Promise.all(
    diariesRaw.map(async (p) => {
      if (!p.exchange_diaries) return null;

      const { count } = await supabase
        .from('exchange_diary_entries')
        .select('*', { count: 'exact', head: true })
        .eq('diary_id', p.diary_id)
        .eq('is_read', false)
        .not('author_id', 'eq', user.id); // 自分以外の投稿

      return {
        ...p.exchange_diaries,
        hasUnread: (count ?? 0) > 0,
      };
    })
  );

  const diaries = diariesWithStatus.filter(Boolean);
  const totalUnread = diaries.some(d => d?.hasUnread);

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-8">
      <nav className="mb-2">
        <Link href="/dashboard" className="inline-flex items-center gap-1 text-slate-400 hover:text-sky-500 transition-colors text-sm font-medium">
          <ChevronLeft size={18} />
          ダッシュボードへ
        </Link>
      </nav>

      <header className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-slate-700 flex items-center gap-2 relative">
          <div className="relative">
            <Book className="text-amber-500" />
            {/* メインアイコンの通知ドット */}
            {totalUnread && (
              <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 border-2 border-white rounded-full" />
            )}
          </div>
          交換日記
        </h1>
        <Link href="/exchange/new" className="p-2 bg-amber-500 text-white rounded-full hover:bg-amber-600 transition-all shadow-md active:scale-95">
          <Plus size={24} />
        </Link>
      </header>

      <div className="grid gap-4">
        {diaries.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-3xl border-2 border-dashed border-slate-200 text-slate-400">
            まだ交換日記がありません。
          </div>
        ) : (
          diaries.map((diary) => (
            <Link 
              key={diary!.id} 
              href={`/exchange/${diary!.id}`}
              className="flex items-center justify-between p-6 bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-md hover:border-amber-200 transition-all group relative"
            >
              <div className="flex items-start gap-3">
                <div className="mt-1">
                  {/* タイトル横の通知ドット */}
                  {diary!.hasUnread ? (
                    <span className="flex w-2.5 h-2.5 bg-red-500 rounded-full animate-pulse" />
                  ) : (
                    <div className="w-2.5" /> 
                  )}
                </div>
                <div>
                  <h2 className={`font-bold transition-colors ${diary!.hasUnread ? 'text-slate-900' : 'text-slate-600'} group-hover:text-amber-600`}>
                    {diary!.title}
                  </h2>
                  <p className="text-xs text-slate-400 mt-1">
                    開始日: {new Date(diary!.created_at).toLocaleDateString('ja-JP')}
                  </p>
                </div>
              </div>
              <ChevronRight className="text-slate-300 group-hover:text-amber-500 transition-colors" />
            </Link>
          ))
        )}
      </div>
    </div>
  );
}