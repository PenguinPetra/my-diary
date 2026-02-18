'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

// ★追加：日記を削除する処理
export async function deleteExchangeDiary(diaryId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Unauthorized' };

  // 権限チェック（参加者のみ削除可能）
  const { data: participant } = await supabase
    .from('exchange_diary_participants')
    .select('*')
    .eq('diary_id', diaryId)
    .eq('profile_id', user.id)
    .single();

  if (!participant) return { error: '権限がありません' };

  // 削除実行（CASCADE設定があれば関連データも消えます）
  const { error } = await supabase
    .from('exchange_diaries')
    .delete()
    .eq('id', diaryId);

  if (error) return { error: error.message };

  revalidatePath('/exchange');
  revalidatePath('/dashboard');
  return { success: true };
}

export async function markAsRead(diaryId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  await supabase
    .from('exchange_diary_entries')
    .update({ is_read: true })
    .eq('diary_id', diaryId)
    .not('author_id', 'eq', user.id)
    .eq('is_read', false);

  revalidatePath('/dashboard');
}

export async function postEntry(diaryId: string, content: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Unauthorized' };

  const { error } = await supabase
    .from('exchange_diary_entries')
    .insert({ diary_id: diaryId, author_id: user.id, content });

  if (error) return { error: error.message };
  
  revalidatePath(`/exchange/${diaryId}`);
  revalidatePath('/dashboard');
  return { success: true };
}

export async function createExchangeDiary(title: string, partnerId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Unauthorized' };

  const { data: diary, error: dError } = await supabase
    .from('exchange_diaries')
    .insert({ title, created_by: user.id })
    .select()
    .single();

  if (dError) return { error: dError.message };

  const participants = [
    { diary_id: diary.id, profile_id: user.id },
    { diary_id: diary.id, profile_id: partnerId }
  ];

  await supabase.from('exchange_diary_participants').insert(participants);
  revalidatePath('/exchange');
  return { success: true, id: diary.id };
}