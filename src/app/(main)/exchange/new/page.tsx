'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { ChevronLeft, BookText, Send } from 'lucide-react';
import { createExchangeDiary } from '../actions';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';

interface Friend {
  id: string;
  username: string;
  avatar_url: string;
}

// 修正ポイント：Supabaseのレスポンス用の型を定義
interface FriendResponse {
  requester: Friend | Friend[] | null;
  receiver: Friend | Friend[] | null;
}

export default function NewExchangePage() {
  const [friends, setFriends] = useState<Friend[]>([]);
  const [selectedFriendId, setSelectedFriendId] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    const fetchFriends = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data } = await supabase
        .from('friends')
        .select(`
          requester:profiles!friends_requester_id_fkey(id, username, avatar_url),
          receiver:profiles!friends_receiver_id_fkey(id, username, avatar_url)
        `)
        .eq('status', 'accepted');

      if (data) {
        // 修正ポイント：any を使わずに型安全に変換
        const typedData = data as unknown as FriendResponse[];
        const formatted = typedData.map((f) => {
          const req = Array.isArray(f.requester) ? f.requester[0] : f.requester;
          const rec = Array.isArray(f.receiver) ? f.receiver[0] : f.receiver;
          return req?.id === user.id ? (rec as Friend) : (req as Friend);
        });
        setFriends(formatted.filter(f => f !== null));
      }
    };
    fetchFriends();
  }, [supabase]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFriendId || !title.trim()) return;

    setLoading(true);
    const result = await createExchangeDiary(title, selectedFriendId);
    if (result.success) {
      router.push(`/exchange/${result.id}`);
    } else {
      alert('作成に失敗しました');
      setLoading(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto p-4 md:p-6 space-y-8">
      <div className="flex items-center gap-2">
        <Link href="/exchange" className="p-2 text-slate-400 hover:bg-slate-100 rounded-full transition-all">
          <ChevronLeft size={24} />
        </Link>
        <h1 className="text-xl font-bold text-slate-700">新しい交換日記</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-10">
        {/* ノートデザインセクション */}
        <section className="bg-white p-6 md:p-10 rounded-sm shadow-xl border-t-12 border-amber-400 relative overflow-hidden ring-1 ring-slate-200">
          {/* ノートの縦線（紅線） */}
          <div className="absolute left-6 top-0 bottom-0 w-px bg-rose-200" />
          
          <div className="pl-6 space-y-6">
            <div className="flex justify-between items-end border-b border-slate-300 pb-1">
              <span className="text-[10px] font-mono text-slate-400">NO. ______</span>
              <span className="text-[10px] font-mono text-slate-400">DATE. {new Date().toLocaleDateString()}</span>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-bold text-amber-600 tracking-[0.2em] flex items-center gap-2">
                <BookText size={14} /> EXCHANGE DIARY TITLE
              </label>
              <input
                type="text"
                placeholder="二人の日記のタイトル..."
                className="w-full text-2xl bg-transparent border-b-2 border-slate-100 focus:border-amber-400 outline-none pb-2 transition-all font-serif placeholder:text-slate-200"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
            </div>
          </div>
        </section>

        {/* フレンド選択 */}
        <section className="space-y-4">
          <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest pl-2">Select Best Friend</h2>
          <div className="grid grid-cols-1 gap-2">
            {friends.length === 0 ? (
              <p className="text-center py-12 text-slate-400 bg-white rounded-2xl border border-slate-100">
                フレンドがまだいないようです
              </p>
            ) : (
              friends.map((friend) => (
                <button
                  key={friend.id}
                  type="button"
                  onClick={() => setSelectedFriendId(friend.id)}
                  className={`flex items-center gap-4 p-4 rounded-xl border-2 transition-all ${
                    selectedFriendId === friend.id
                      ? 'border-amber-400 bg-amber-50 shadow-inner'
                      : 'border-slate-50 bg-white hover:border-slate-200'
                  }`}
                >
                  <div className="relative w-10 h-10">
                    <Image
                      src={friend.avatar_url || '/default-avatar.png'}
                      alt=""
                      fill
                      className="rounded-full object-cover"
                      unoptimized
                    />
                  </div>
                  <span className={`font-bold ${selectedFriendId === friend.id ? 'text-amber-700' : 'text-slate-600'}`}>
                    {friend.username}
                  </span>
                </button>
              ))
            )}
          </div>
        </section>

        <button
          type="submit"
          disabled={loading || !selectedFriendId || !title}
          className="w-full py-4 bg-slate-800 text-white rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-slate-700 disabled:opacity-20 transition-all shadow-lg active:translate-y-1"
        >
          <Send size={18} />
          日記を交換しにいく
        </button>
      </form>
    </div>
  );
}