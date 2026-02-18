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

  // 1. 新しい画像データ（Base64）がある場合、Storageにアップロード
  if (resizedImageData && resizedImageData.startsWith('data:image')) {
    try {
      const base64Data = resizedImageData.split(',')[1];
      const buffer = Buffer.from(base64Data, 'base64');
      const fileName = `${user.id}/${Date.now()}.jpg`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(fileName, buffer, {
          contentType: 'image/jpeg',
          upsert: true,
        });

      if (uploadError) return { error: '画像の保存に失敗しました' };
      
      const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(fileName);
      finalAvatarUrl = publicUrl;
    } catch  {
      return { error: '画像処理中にエラーが発生しました' };
    }
  } 

  // 2. プロフィール情報の更新
  const { error: updateError } = await supabase
    .from('profiles')
    .upsert({
      id: user.id, // upsertで確実に自分を特定
      username: username,
      avatar_url: finalAvatarUrl,
      updated_at: new Date().toISOString(),
    });

  if (updateError) return { error: 'データベースの更新に失敗しました' };

  // キャッシュをクリア
  revalidatePath('/dashboard');
  revalidatePath('/settings/profile');
  
  // 最後にダッシュボードへ戻る
  redirect('/dashboard');
}