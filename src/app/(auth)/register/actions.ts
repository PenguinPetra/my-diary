'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export async function signUp(formData: FormData) {
  const supabase = await createClient()

  const email = formData.get('email') as string
  const password = formData.get('password') as string
  const username = formData.get('username') as string
  const defaultAvatarUrl = formData.get('avatarUrl') as string
  const resizedImageData = formData.get('resizedImageData') as string

  // 1. Auth 登録
  const { data, error: authError } = await supabase.auth.signUp({ 
    email, 
    password,
    options: {
      data: { display_name: username }
    }
  })

  if (authError || !data.user) {
    return { error: authError?.message }
  }

  let finalAvatarUrl = defaultAvatarUrl

  // 2. リサイズ済み画像データがある場合、Storageにアップロード
  if (resizedImageData && resizedImageData.startsWith('data:image')) {
    try {
      // Base64をBufferに変換
      const base64Data = resizedImageData.split(',')[1];
      const buffer = Buffer.from(base64Data, 'base64');
      const fileName = `${data.user.id}/${Date.now()}.jpg`;
      
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(fileName, buffer, {
          contentType: 'image/jpeg',
          upsert: true
        })

      if (!uploadError) {
        const { data: urlData } = supabase.storage.from('avatars').getPublicUrl(fileName)
        finalAvatarUrl = urlData.publicUrl
      }
    } catch (err) {
      console.error('Upload Error:', err)
    }
  }

  // 3. Profilesテーブル更新
  const { error: profileError } = await supabase.from('profiles').upsert([
    { 
      id: data.user.id, 
      username: username,
      avatar_url: finalAvatarUrl,
      updated_at: new Date().toISOString()
    }
  ])

  if (profileError) return { error: profileError.message }

  redirect('/login')
}