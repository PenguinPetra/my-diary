'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export async function signUp(formData: FormData) {
  const supabase = await createClient()

  // フォームデータの取得
  const email = formData.get('email') as string
  const password = formData.get('password') as string
  const username = formData.get('username') as string
  const defaultAvatarUrl = formData.get('avatarUrl') as string
  const resizedImageData = formData.get('resizedImageData') as string

  // 1. Auth 登録（Supabase Auth）
  const { data, error: authError } = await supabase.auth.signUp({ 
    email, 
    password,
    options: {
      // メタデータとして名前を保存（必須ではないが推奨）
      data: { display_name: username }
    }
  })

  // 認証エラーがある場合はここで復帰
  if (authError || !data.user) {
    return { error: authError?.message || "認証に失敗しました。" }
  }

  let finalAvatarUrl = defaultAvatarUrl

  // 2. カスタムアイコン（リサイズ済みBase64）がある場合の処理
  if (resizedImageData && resizedImageData.startsWith('data:image')) {
    try {
      // Base64文字列から純粋なデータ部分のみを抽出してBufferに変換
      const base64Data = resizedImageData.split(',')[1]
      const buffer = Buffer.from(base64Data, 'base64')
      
      // 保存パス：ユーザーIDごとのフォルダにタイムスタンプ名で保存
      const fileName = `${data.user.id}/${Date.now()}.jpg`
      
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(fileName, buffer, {
          contentType: 'image/jpeg',
          upsert: true
        })

      if (uploadError) {
        console.error('Storage Upload Error:', uploadError.message)
        // ストレージ失敗時はデフォルトアイコンにフォールバック（登録は続行）
      } else {
        const { data: urlData } = supabase.storage.from('avatars').getPublicUrl(fileName)
        finalAvatarUrl = urlData.publicUrl
      }
    } catch (err) {
      console.error('Image Processing Error:', err)
    }
  }

  // 3. Profiles テーブルの作成・更新
  // Auth登録したユーザーIDと紐付けてプロフィールを作成
  const { error: profileError } = await supabase
    .from('profiles')
    .upsert({ 
      id: data.user.id, 
      username: username,
      avatar_url: finalAvatarUrl,
      updated_at: new Date().toISOString()
    })

  if (profileError) {
    console.error('Profile Upsert Error:', profileError.message)
    return { error: "プロフィールの作成に失敗しました。" }
  }

  // すべて成功したらログイン画面へリダイレクト
  redirect('/login')
}