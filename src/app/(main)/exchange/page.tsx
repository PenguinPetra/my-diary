import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';
import { Book, Plus, ChevronRight, ChevronLeft } from 'lucide-react'; // ChevronLeftを追加

// --- 型定義を追加 ---
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

  // 自分が参加している交換日記を取得
  const { data: rawData } = await supabase
    .from('exchange_diary_participants')
    .select(`
      diary_id,
      exchange_diaries ( id, title, created_at )
    `)
    .eq('profile_id', user.id);

  const diaries = (rawData as unknown as ParticipantResponse[]) || [];

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-8">
      {/* 戻るボタンをヘッダーの上に配置 */}
      <nav className="mb-2">
        <Link 
          href="/dashboard" 
          className="inline-flex items-center gap-1 text-slate-400 hover:text-sky-500 transition-colors text-sm font-medium"
        >
          <ChevronLeft size={18} />
          ダッシュボードへ
        </Link>
      </nav>

      <header className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-slate-700 flex items-center gap-2">
          <Book className="text-amber-500" /> 交換日記
        </h1>
        <Link 
          href="/exchange/new" 
          className="p-2 bg-amber-500 text-white rounded-full hover:bg-amber-600 transition-all shadow-md active:scale-95"
          title="新しく始める"
        >
          <Plus size={24} />
        </Link>
      </header>

      <div className="grid gap-4">
        {diaries.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-3xl border-2 border-dashed border-slate-200">
            <p className="text-slate-400 leading-relaxed">
              まだ交換日記がありません。<br/>
              右上の＋からフレンドを誘ってみましょう！
            </p>
          </div>
        ) : (
          diaries.map((participant) => {
            const diary = participant.exchange_diaries;
            if (!diary) return null;

            return (
              <Link 
                key={participant.diary_id} 
                href={`/exchange/${participant.diary_id}`}
                className="flex items-center justify-between p-6 bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-md hover:border-amber-200 transition-all group"
              >
                <div>
                  <h2 className="font-bold text-slate-700 group-hover:text-amber-600 transition-colors">
                    {diary.title}
                  </h2>
                  <p className="text-xs text-slate-400 mt-1">
                    開始日: {new Date(diary.created_at).toLocaleDateString('ja-JP')}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-300 opacity-0 group-hover:opacity-100 transition-opacity">
                    ノートを開く
                  </span>
                  <ChevronRight className="text-slate-300 group-hover:text-amber-500 transition-colors" />
                </div>
              </Link>
            );
          })
        )}
      </div>
    </div>
  );
}