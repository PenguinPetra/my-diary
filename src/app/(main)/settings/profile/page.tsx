'use client';

import { useState, useCallback, useEffect, useMemo, useRef } from 'react';
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
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const initialSeeds = useMemo(() => ["Aria", "Sora", "Kai", "Rin", "Yuki"], []);
  
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
    <div className="max-w-2xl mx-auto p-6 md:p-12 min-h-screen">
      <div className="mb-8">
        <Link href="/dashboard" className="inline-flex items-center gap-2 text-slate-400 hover:text-sky-500 font-medium transition-colors">
          <ChevronLeft size={18} />
          <span>戻る</span>
        </Link>
      </div>

      <AnimatePresence>
        {imageSrc && (
          <div className="fixed inset-0 z-100 bg-slate-900/90 backdrop-blur-md flex flex-col p-4">
            <div className="relative flex-1 max-w-lg mx-auto w-full">
              <Cropper image={imageSrc} crop={crop} zoom={zoom} aspect={1} cropShape="round" onCropChange={setCrop} onCropComplete={onCropComplete} onZoomChange={setZoom} />
            </div>
            <div className="p-8 bg-white rounded-[2.5rem] max-w-lg mx-auto w-full flex flex-col gap-6 shadow-2xl mb-10">
              <input type="range" value={zoom} min={1} max={3} step={0.1} onChange={(e) => setZoom(Number(e.target.value))} className="w-full h-1.5 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-sky-500" />
              <div className="flex gap-4">
                <button onClick={() => setImageSrc(null)} className="flex-1 py-4 text-slate-500 bg-slate-100 rounded-2xl font-bold flex items-center justify-center gap-2">
                  <X size={20} /> キャンセル
                </button>
                <button onClick={generateCroppedImage} className="flex-1 py-4 bg-slate-800 text-white rounded-2xl font-bold flex items-center justify-center gap-2">
                  <Check size={20} /> 決定
                </button>
              </div>
            </div>
          </div>
        )}
      </AnimatePresence>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white/70 backdrop-blur-2xl border border-white/40 shadow-2xl rounded-[3rem] p-8 md:p-12">
        <header className="text-center mb-10">
          <h1 className="text-2xl font-bold tracking-tight text-slate-700">プロフィール設定</h1>
        </header>

        {message && (
          <div className={`mb-8 p-4 rounded-2xl text-sm font-medium text-center ${message.type === 'success' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-red-50 text-red-600 border border-red-100'}`}>
            {message.text}
          </div>
        )}

        <div className="w-full h-px bg-linear-to-r from-transparent via-slate-200 to-transparent mb-12" />

        <form action={async (formData) => {
          setPending(true);
          const res = await updateProfile(formData);
          if (res?.error) {
            setMessage({ type: 'error', text: res.error });
            setPending(false);
          }
        }} className="space-y-12">
          
          {/* アイコン選択セクション */}
          <div className="flex flex-col items-center gap-8">
            <div className="relative w-36 h-36 rounded-full border-4 border-white shadow-2xl overflow-hidden bg-slate-50">
              <Image 
                src={previewUrl || currentAvatar || '/default-avatar.png'} 
                alt="Avatar" fill className="object-cover" unoptimized 
              />
            </div>

            <div className="flex flex-wrap justify-center items-center gap-4">
              {initialSeeds.map((seed) => {
                const url = `https://api.dicebear.com/7.x/avataaars/svg?seed=${seed}`;
                const isSelected = currentAvatar === url && !previewUrl;
                return (
                  <button
                    key={seed} type="button"
                    onClick={() => { setCurrentAvatar(url); setPreviewUrl(null); setResizedBase64(null); }}
                    className={`relative w-11 h-11 rounded-full border-2 transition-all overflow-hidden ${isSelected ? 'border-sky-400 shadow-lg ring-2 ring-sky-100' : 'border-white opacity-60'}`}
                  >
                    <Image src={url} alt={seed} fill unoptimized />
                    {isSelected && <div className="absolute inset-0 bg-sky-500/10 flex items-center justify-center"><Check className="text-sky-600 w-4 h-4" /></div>}
                  </button>
                );
              })}
              
              <div className="w-px h-6 bg-slate-200 mx-1" />
              
              {/* アカウント作成時と同じスタイルのアップロードボタン */}
              <button 
                type="button" 
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-2 px-4 py-2 bg-white rounded-full border border-slate-200 text-slate-400 hover:text-sky-500 hover:border-sky-200 transition-all text-xs font-medium shadow-sm"
              >
                <Upload size={14} />
                <span>画像アップロード</span>
              </button>
            </div>
            
            <input type="hidden" name="avatarUrl" value={currentAvatar} />
            <input type="hidden" name="resizedImageData" value={resizedBase64 || ""} />
            <input type="file" ref={fileInputRef} accept="image/*" className="hidden" onChange={onFileChange} />
          </div>

          {/* 入力セクション */}
          <div className="space-y-6">
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-4">ユーザー名</label>
              <div className="relative group">
                <div className="absolute left-5 top-1/2 -translate-y-1/2 border-r pr-4 border-slate-100">
                  <User className="w-5 h-5 text-slate-300 group-focus-within:text-sky-500 transition-colors" />
                </div>
                <input 
                  name="username" type="text" value={username} onChange={(e) => setUsername(e.target.value)} required 
                  className="w-full pl-16 pr-6 py-5 bg-white/50 border border-slate-200 rounded-3xl outline-none focus:ring-4 focus:ring-sky-500/5 focus:border-sky-400 text-slate-700 font-medium transition-all shadow-sm"
                />
              </div>
            </div>
          </div>

          <button 
            type="submit" disabled={pending} 
            className="w-full py-5 bg-slate-800 text-white rounded-3xl font-bold tracking-[0.2em] shadow-xl hover:bg-slate-700 transition-all active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-3"
          >
            {pending ? '保存中...' : <><Save size={20} /> 変更を保存する</>}
          </button>
        </form>
      </motion.div>
    </div>
  );
}