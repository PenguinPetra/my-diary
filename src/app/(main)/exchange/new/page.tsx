'use client';

export const dynamic = 'force-dynamic';

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

  useEffect(() => {
    const fetchFriends = async () => {
      const supabase = createClient();
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
  }, []);

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
    <div className="max-w-2xl mx-auto px-4 py-6 md:py-10 space-y-6 md:space-y-10">
      {/* ヘッダー */}
      <div className="flex items-center gap-3">
        <Link href="/exchange" className="p-2 -ml-2 text-slate-400 hover:bg-white hover:text-slate-600 rounded-full transition-all shrink-0">
          <ChevronLeft size={24} />
        </Link>
        <h1 className="text-lg md:text-xl font-bold text-slate-700 font-serif">新しい交換日記</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8 md:space-y-12">
        {/* ノートデザインセクション */}
        <section className="bg-[#fdfaf3] p-6 md:p-12 rounded-sm shadow-xl border-t-10 md:border-t-14 border-amber-400 relative overflow-hidden ring-1 ring-slate-200">
          {/* ノートの縦線（紅線） */}
          <div className="absolute left-6 md:left-10 top-0 bottom-0 w-px bg-rose-200/60" />
          
          <div className="pl-6 md:pl-12 space-y-8">
            <div className="flex flex-col md:flex-row md:justify-between md:items-end border-b border-slate-200 pb-2 gap-2">
              <span className="text-[10px] font-mono text-slate-300 tracking-tighter">NO. EX-001</span>
              <span className="text-[10px] font-mono text-slate-400">DATE. {new Date().toLocaleDateString()}</span>
            </div>

            <div className="space-y-3">
              <label className="text-[10px] font-black text-amber-600 tracking-[0.3em] flex items-center gap-2 uppercase">
                <BookText size={14} /> Diary Title
              </label>
              <input
                type="text"
                placeholder="二人の日記のタイトル..."
                className="w-full text-xl md:text-3xl bg-transparent border-b border-slate-100 focus:border-amber-400 outline-none pb-3 transition-all font-serif placeholder:text-slate-200 leading-relaxed"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
            </div>
          </div>
          
          {/* ノート下の影演出 */}
          <div className="absolute bottom-0 right-0 w-32 h-32 bg-linear-to-br from-transparent to-black/5 pointer-events-none" />
        </section>

        {/* フレンド選択 */}
        <section className="space-y-4">
          <h2 className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Select Partner</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {friends.length === 0 ? (
              <p className="col-span-full text-center py-16 text-slate-400 bg-white/50 rounded-2xl border border-dashed border-slate-200">
                フレンドがまだいないようです
              </p>
            ) : (
              friends.map((friend) => (
                <button
                  key={friend.id}
                  type="button"
                  onClick={() => setSelectedFriendId(friend.id)}
                  className={`flex items-center gap-4 p-4 rounded-2xl border-2 transition-all group ${
                    selectedFriendId === friend.id
                      ? 'border-amber-400 bg-amber-50 shadow-md translate-y-0.5'
                      : 'border-white bg-white hover:border-slate-200 shadow-sm'
                  }`}
                >
                  <div className="relative w-11 h-11 shrink-0">
                    <Image
                      src={friend.avatar_url || '/default-avatar.png'}
                      alt=""
                      fill
                      className="rounded-full object-cover border-2 border-white shadow-sm"
                      unoptimized
                    />
                    {selectedFriendId === friend.id && (
                      <div className="absolute -top-1 -right-1 w-5 h-5 bg-amber-400 rounded-full flex items-center justify-center text-white border-2 border-amber-50">
                        <div className="w-2 h-2 bg-white rounded-full" />
                      </div>
                    )}
                  </div>
                  <div className="text-left overflow-hidden">
                    <span className={`block font-bold truncate ${selectedFriendId === friend.id ? 'text-amber-800' : 'text-slate-600'}`}>
                      {friend.username}
                    </span>
                    <span className="text-[10px] text-slate-400 font-medium">Friend</span>
                  </div>
                </button>
              ))
            )}
          </div>
        </section>

        {/* 送信ボタン */}
        <div className="pt-4 sticky bottom-6 md:static">
          <button
            type="submit"
            disabled={loading || !selectedFriendId || !title}
            className="w-full py-5 bg-slate-800 text-white rounded-2xl font-bold tracking-widest flex items-center justify-center gap-3 hover:bg-slate-900 disabled:opacity-20 transition-all shadow-xl shadow-slate-200 active:scale-95"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                <Send size={20} className="rotate-[-10deg]" />
                日記を交換しにいく
              </>
            )}
          </button>
        </div>
      </form>
      
      {/* デコレーション用（スマホでも邪魔にならない程度に） */}
      <style jsx global>{`
        body {
          background-color: #f8f9fa;
        }
      `}</style>
    </div>
  );
}