'use client';

import { useState, useCallback, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { User, Upload, Save, ChevronLeft, Check, X } from 'lucide-react';
import Cropper, { Area } from 'react-easy-crop';
import Image from 'next/image';
import Link from 'next/link';
import { updateProfile } from './actions';
import { createClient } from '@/lib/supabase/client';

export default function ProfileSettingsPage() {
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  const [username, setUsername] = useState('');
  const [currentAvatar, setCurrentAvatar] = useState('');
  
  // 初期アイコン用シード（RegisterPageと統一）
  const initialSeeds = useMemo(() => ["Aria", "Sora", "Kai", "Rin", "Yuki"], []);
  
  // 画像編集用ステート
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [resizedBase64, setResizedBase64] = useState<string | null>(null);

  useEffect(() => {
    const loadProfile = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single();
        if (data) {
          setUsername(data.username || '');
          // 既存画像がなければ外部API(metadata)のURLをセット
          setCurrentAvatar(data.avatar_url || user.user_metadata?.avatar_url || '');
        }
      }
    };
    loadProfile();
  }, []);

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => setImageSrc(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const onCropComplete = useCallback((_: Area, pixels: Area) => {
    setCroppedAreaPixels(pixels);
  }, []);

  const generateCroppedImage = useCallback(async () => {
    if (!imageSrc || !croppedAreaPixels) return;
    try {
      const image = new window.Image();
      image.src = imageSrc;
      await new Promise((resolve) => (image.onload = resolve));
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      canvas.width = 400; canvas.height = 400;
      ctx?.drawImage(image, croppedAreaPixels.x, croppedAreaPixels.y, croppedAreaPixels.width, croppedAreaPixels.height, 0, 0, 400, 400);
      const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
      setPreviewUrl(dataUrl);
      setResizedBase64(dataUrl);
      setImageSrc(null);
    } catch { 
      setMessage({ type: 'error', text: '画像の加工に失敗しました' }); 
    }
  }, [imageSrc, croppedAreaPixels]);

  return (
    <div className="max-w-2xl mx-auto p-4 md:p-8">
      {/* 戻るボタン（左上） */}
      <div className="mb-6">
        <Link href="/dashboard" className="text-slate-400 hover:text-sky-500 flex items-center gap-1 text-sm transition-colors">
          <ChevronLeft size={16} /> 戻る
        </Link>
      </div>

      {/* 画像クロップ用モーダル */}
      <AnimatePresence>
        {imageSrc && (
          <div className="fixed inset-0 z-100 bg-black/80 backdrop-blur-sm flex flex-col">
            <div className="relative flex-1">
              <Cropper image={imageSrc} crop={crop} zoom={zoom} aspect={1} cropShape="round" onCropChange={setCrop} onCropComplete={onCropComplete} onZoomChange={setZoom} />
            </div>
            <div className="p-6 bg-slate-900 flex flex-col gap-4">
               <input type="range" value={zoom} min={1} max={3} step={0.1} onChange={(e) => setZoom(Number(e.target.value))} className="w-full h-1 bg-white/20 rounded-lg appearance-none cursor-pointer" />
               <div className="flex gap-4">
                 <button onClick={() => setImageSrc(null)} className="flex-1 py-3 text-white border border-white/20 rounded-full text-sm flex items-center justify-center gap-2">
                   <X size={16} /> キャンセル
                 </button>
                 <button onClick={generateCroppedImage} className="flex-1 py-3 bg-sky-500 text-white rounded-full text-sm font-medium flex items-center justify-center gap-2">
                   <Check size={16} /> 範囲を決定
                 </button>
               </div>
            </div>
          </div>
        )}
      </AnimatePresence>

      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-white/80 backdrop-blur-md rounded-3xl p-8 shadow-sm border border-slate-100">
        <h2 className="text-xl font-light text-slate-700 mb-8 tracking-widest text-center">プロフィール設定</h2>

        {message && (
          <div className={`mb-6 p-4 rounded-2xl text-sm text-center ${message.type === 'success' ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'}`}>
            {message.text}
          </div>
        )}

        <form action={async (formData) => {
          setPending(true);
          const res = await updateProfile(formData);
          if (res?.error) {
            setMessage({ type: 'error', text: res.error });
            setPending(false);
          }
        }} className="space-y-8">
          
          <div className="flex flex-col items-center gap-6">
            {/* 現在のアイコン表示 */}
            <div className="relative w-32 h-32 rounded-full border-4 border-white shadow-md overflow-hidden bg-slate-50">
              <Image 
                src={previewUrl || currentAvatar || '/default-avatar.png'} 
                alt="Avatar" 
                fill 
                className="object-cover" 
                unoptimized 
              />
              <label className="absolute inset-0 bg-black/20 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity cursor-pointer">
                <Upload className="text-white w-8 h-8" />
                <input type="file" accept="image/*" className="hidden" onChange={onFileChange} />
              </label>
            </div>

            {/* 初期アイコン（DiceBear）選択リスト */}
            <div className="flex flex-wrap justify-center gap-3">
              {initialSeeds.map((seed) => {
                const url = `https://api.dicebear.com/7.x/avataaars/svg?seed=${seed}`;
                const isSelected = currentAvatar === url && !previewUrl;
                
                return (
                  <button
                    key={seed}
                    type="button"
                    onClick={() => {
                      setCurrentAvatar(url);
                      setPreviewUrl(null);
                      setResizedBase64(null);
                    }}
                    className={`relative w-10 h-10 rounded-full border-2 transition-all hover:scale-110 overflow-hidden ${isSelected ? 'border-sky-400 shadow-md ring-2 ring-sky-100' : 'border-white opacity-70'}`}
                  >
                    <Image src={url} alt={seed} fill unoptimized />
                    {isSelected && (
                      <div className="absolute inset-0 bg-sky-400/10 flex items-center justify-center">
                        <Check className="text-sky-600 w-4 h-4 drop-shadow-sm" />
                      </div>
                    )}
                  </button>
                );
              })}
              
              {/* カスタムアップロードボタン（簡易アクセス用） */}
              <label className="w-10 h-10 flex items-center justify-center bg-white rounded-full border-2 border-dashed border-slate-200 cursor-pointer hover:border-sky-300 hover:bg-sky-50 transition-all">
                <Upload className="w-4 h-4 text-slate-400" />
                <input type="file" accept="image/*" className="hidden" onChange={onFileChange} />
              </label>
            </div>

            <input type="hidden" name="avatarUrl" value={currentAvatar} />
            <input type="hidden" name="resizedImageData" value={resizedBase64 || ""} />
          </div>

          <div className="space-y-2">
            <label className="text-xs text-slate-400 ml-4 tracking-widest">ユーザー名</label>
            <div className="relative">
              <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
              <input 
                name="username" 
                type="text" 
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required 
                className="w-full pl-12 pr-4 py-4 bg-slate-50 border-none rounded-2xl outline-none focus:ring-2 focus:ring-sky-100 text-slate-600 transition-all"
              />
            </div>
          </div>

          <div className="flex flex-col gap-3">
            <button 
              type="submit" 
              disabled={pending} 
              className="w-full py-4 bg-slate-800 text-white rounded-2xl font-light tracking-[0.2em] shadow-lg hover:bg-slate-700 transition-all flex items-center justify-center gap-2 disabled:opacity-50 active:scale-[0.98]"
            >
              {pending ? '更新中...' : <><Save size={18} /> 更新する</>}
            </button>
            {/* キャンセルボタンを削除し、戻るボタンに統一しました */}
          </div>
        </form>
      </motion.div>
    </div>
  );
}