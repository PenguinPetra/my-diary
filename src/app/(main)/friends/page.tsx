'use client';

import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
// 修正ポイント：ChevronLeft をインポートに追加
import { Users, UserMinus, Search, UserPlus, ChevronLeft } from 'lucide-react';
import { acceptFriendRequest, removeFriend, sendFriendRequest, searchUsers } from './actions';
import Image from 'next/image';
import Link from 'next/link';

interface Profile {
  id: string;
  username: string;
  avatar_url: string;
}

interface Friendship {
  id: string;
  requester_id: string;
  receiver_id: string;
  status: 'pending' | 'accepted' | 'rejected';
  sender?: Profile;
  receiver?: Profile;
}

interface RawFriendshipResponse {
  id: string;
  requester_id: string;
  receiver_id: string;
  status: 'pending' | 'accepted' | 'rejected';
  sender: Profile | Profile[] | null;
  receiver?: Profile | Profile[] | null;
}

type TabType = 'list' | 'requests' | 'search';

export default function FriendsPage() {
  const [activeTab, setActiveTab] = useState<TabType>('list');
  const [friends, setFriends] = useState<Friendship[]>([]);
  const [pendingRequests, setPendingRequests] = useState<Friendship[]>([]);
  const [searchResults, setSearchResults] = useState<Profile[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  
  const supabase = createClient();

  const fetchData = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    setCurrentUserId(user.id);

    const { data: acceptedData } = await supabase.from('friends').select(`
      id, requester_id, receiver_id, status,
      sender:profiles!friends_requester_id_fkey(id, username, avatar_url),
      receiver:profiles!friends_receiver_id_fkey(id, username, avatar_url)
    `).eq('status', 'accepted');
    
    const { data: pendingData } = await supabase.from('friends').select(`
      id, requester_id, receiver_id, status,
      sender:profiles!friends_requester_id_fkey(id, username, avatar_url)
    `).eq('receiver_id', user.id).eq('status', 'pending');

    const format = (item: RawFriendshipResponse): Friendship => ({
      id: item.id,
      requester_id: item.requester_id,
      receiver_id: item.receiver_id,
      status: item.status,
      sender: Array.isArray(item.sender) ? item.sender[0] : (item.sender ?? undefined),
      receiver: Array.isArray(item.receiver) ? item.receiver[0] : (item.receiver ?? undefined),
    });

    setFriends((acceptedData as unknown as RawFriendshipResponse[])?.map(format) || []);
    setPendingRequests((pendingData as unknown as RawFriendshipResponse[])?.map(format) || []);
  }, [supabase]);

  useEffect(() => { 
    fetchData(); 
  }, [fetchData]);

  const onSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    setLoading(true);
    const results = await searchUsers(searchQuery);
    setSearchResults(results);
    setLoading(false);
  };

  return (
    <div className="max-w-2xl mx-auto p-4 md:p-8 space-y-8">
      {/* --- ヘッダー部分 --- */}
      <header className="flex flex-col gap-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {/* 戻るボタン */}
            <Link 
              href="/dashboard" 
              className="p-2 -ml-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-all"
              title="戻る"
            >
              <ChevronLeft size={24} />
            </Link>
            <h1 className="text-2xl font-light flex items-center gap-2 text-slate-700">
              <Users className="text-sky-500" size={28} /> フレンド管理
            </h1>
          </div>
        </div>
        
        {/* タブ切り替えメニュー */}
        <div className="flex bg-slate-100 p-1 rounded-2xl">
          {(['list', 'requests', 'search'] as const).map((tabId) => {
            const labels = { list: '一覧', requests: '申請', search: '検索' };
            const count = tabId === 'list' ? friends.length : tabId === 'requests' ? pendingRequests.length : 0;
            return (
              <button
                key={tabId}
                onClick={() => setActiveTab(tabId)}
                className={`flex-1 py-3 rounded-xl text-sm font-medium transition-all flex items-center justify-center gap-2 ${
                  activeTab === tabId ? 'bg-white shadow-sm text-sky-600' : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                {labels[tabId]}
                {count > 0 && (
                  <span className={`px-2 py-0.5 rounded-full text-[10px] ${tabId === 'requests' ? 'bg-rose-500 text-white' : 'bg-slate-200 text-slate-600'}`}>
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </header>

      <main className="min-h-72">
        {activeTab === 'search' && (
          <div className="space-y-6">
            <form onSubmit={onSearch} className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input 
                type="text" 
                placeholder="ユーザー名を入力..." 
                className="w-full pl-12 pr-4 py-4 bg-white border border-slate-200 rounded-2xl focus:ring-2 focus:ring-sky-100 outline-none transition-all"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </form>
            <div className="grid gap-3">
              {searchResults.map((u) => (
                <div key={u.id} className="flex items-center justify-between p-4 bg-white rounded-2xl border border-slate-100">
                  <div className="flex items-center gap-3">
                    <Image src={u.avatar_url || '/default-avatar.png'} alt="" width={40} height={40} className="rounded-full shadow-sm" unoptimized />
                    <span className="text-slate-700 font-medium">{u.username}</span>
                  </div>
                  <button onClick={async () => { await sendFriendRequest(u.id); alert('申請しました'); }} className="p-2 bg-sky-50 text-sky-600 rounded-full hover:bg-sky-100 transition-colors">
                    <UserPlus size={20} />
                  </button>
                </div>
              ))}
              {searchQuery && !loading && searchResults.length === 0 && (
                <p className="text-center text-slate-400 py-10">ユーザーが見つかりませんでした</p>
              )}
            </div>
          </div>
        )}

        {activeTab === 'requests' && (
          <div className="space-y-4">
            {pendingRequests.length === 0 ? (
              <p className="text-center text-slate-400 py-20">届いている申請はありません</p>
            ) : (
              pendingRequests.map((req) => (
                <div key={req.id} className="flex items-center justify-between p-4 bg-white border-rose-100 border rounded-2xl shadow-sm">
                  <div className="flex items-center gap-3">
                    <Image src={req.sender?.avatar_url || '/default-avatar.png'} alt="" width={40} height={40} className="rounded-full shadow-sm" unoptimized />
                    <span className="text-slate-700 font-medium">{req.sender?.username}</span>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={async () => { await acceptFriendRequest(req.requester_id); fetchData(); }} className="px-4 py-2 bg-emerald-500 text-white rounded-xl text-xs font-bold hover:bg-emerald-600 transition-colors">承認</button>
                    <button onClick={async () => { await removeFriend(req.requester_id); fetchData(); }} className="px-4 py-2 bg-slate-100 text-slate-500 rounded-xl text-xs font-bold hover:bg-slate-200 transition-colors">拒否</button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {activeTab === 'list' && (
          <div className="grid gap-3">
            {friends.length === 0 ? (
              <div className="text-center py-20 text-slate-400">まだフレンドがいません</div>
            ) : (
              friends.map((friend) => {
                const profile = friend.requester_id === currentUserId ? friend.receiver : friend.sender;
                if (!profile) return null;
                return (
                  <div key={friend.id} className="flex items-center justify-between p-4 bg-white rounded-2xl border border-slate-100 hover:border-sky-100 transition-all group">
                    <div className="flex items-center gap-3">
                      <Image src={profile.avatar_url || '/default-avatar.png'} alt="" width={40} height={40} className="rounded-full shadow-sm" unoptimized />
                      <span className="text-slate-700 font-medium">{profile.username}</span>
                    </div>
                    <button onClick={async () => { if(confirm('解除しますか？')) { await removeFriend(profile.id); fetchData(); } }} className="p-2 text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all" title="フレンド解除">
                      <UserMinus size={20} />
                    </button>
                  </div>
                );
              })
            )}
          </div>
        )}
      </main>
    </div>
  );
}