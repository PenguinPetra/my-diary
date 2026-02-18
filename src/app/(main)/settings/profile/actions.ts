'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

export async function updateProfile(formData: FormData) {
  const supabase = await createClient();
  
  const username = formData.get('username') as string;
  const avatarUrl = formData.get('avatarUrl') as string;
  const resizedImageData = formData.get('resizedImageData') as string;

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'ログインが必要です' };

  let finalAvatarUrl = avatarUrl;

  // 1. クロップされた新しい画像データがある場合、Storageにアップロード
  if (resizedImageData && resizedImageData.startsWith('data:image')) {
    const base64Data = resizedImageData.split(',')[1];
    const buffer = Buffer.from(base64Data, 'base64');
    const fileName = `${user.id}/${Date.now()}.jpg`;

    const { error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(fileName, buffer, {
        contentType: 'image/jpeg',
        upsert: true,
      });

    if (uploadError) return { error: '画像のアップロードに失敗しました' };
    
    const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(fileName);
    finalAvatarUrl = publicUrl;
  } 
  // 2. アップロード画像がなく、かつ外部API（Google等）のアイコンが利用可能な場合
  else if (!finalAvatarUrl && user.user_metadata?.avatar_url) {
    finalAvatarUrl = user.user_metadata.avatar_url;
  }

  // プロフィール情報の更新
  const { error: updateError } = await supabase
    .from('profiles')
    .update({
      username: username,
      avatar_url: finalAvatarUrl,
      updated_at: new Date().toISOString(),
    })
    .eq('id', user.id);

  if (updateError) return { error: 'プロフィールの更新に失敗しました' };

  // キャッシュを更新して遷移
  revalidatePath('/dashboard');
  revalidatePath('/settings/profile');
  redirect('/dashboard');
}