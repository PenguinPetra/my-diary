'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

// ユーザー名で検索
export async function searchUsers(query: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || !query) return [];

  const { data, error } = await supabase
    .from('profiles')
    .select('id, username, avatar_url')
    .ilike('username', `%${query}%`)
    .not('id', 'eq', user.id) // 自分は除外
    .limit(10);

  if (error) return [];
  return data;
}

// フレンド申請を送る
export async function sendFriendRequest(receiverId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'ログインが必要です' };

  const { error } = await supabase
    .from('friends')
    .insert({ requester_id: user.id, receiver_id: receiverId, status: 'pending' });

  if (error) return { error: '申請に失敗しました' };
  revalidatePath('/friends');
  return { success: true };
}

// 申請を承認する
export async function acceptFriendRequest(requesterId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'ログインが必要です' };

  const { error } = await supabase
    .from('friends')
    .update({ status: 'accepted' })
    .eq('requester_id', requesterId)
    .eq('receiver_id', user.id);

  if (error) return { error: '承認に失敗しました' };
  revalidatePath('/friends');
  revalidatePath('/dashboard'); // バッジ更新のため
  return { success: true };
}

// フレンド解除 / 申請拒否
export async function removeFriend(friendId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'ログインが必要です' };

  const { error } = await supabase
    .from('friends')
    .delete()
    .or(`and(requester_id.eq.${user.id},receiver_id.eq.${friendId}),and(requester_id.eq.${friendId},receiver_id.eq.${user.id})`);

  if (error) return { error: '削除に失敗しました' };
  revalidatePath('/friends');
  revalidatePath('/dashboard');
  return { success: true };
}