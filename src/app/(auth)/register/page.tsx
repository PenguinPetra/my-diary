'use client';

import { useState, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, Lock, User, ImagePlus, Check, X } from 'lucide-react'; // ImagePlusに変更
import Cropper, { Area } from 'react-easy-crop';
import { AuthBackground } from '@/components/auth/AuthBackground';
import { signUp } from './actions';
import Image from 'next/image';

export default function RegisterPage() {
  const [pending, setPending] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  
  const initialSeeds = useMemo(() => ["Aria", "Sora", "Kai", "Rin", "Yuki"], []);
  const [selectedIcon, setSelectedIcon] = useState(`https://api.dicebear.com/7.x/avataaars/svg?seed=${initialSeeds[0]}`);
  
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [resizedBase64, setResizedBase64] = useState<string | null>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.addEventListener('load', () => {
        setImageSrc(reader.result as string);
      });
      reader.readAsDataURL(file);
      setErrorMsg(null);
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
      const targetSize = 400;

      canvas.width = targetSize;
      canvas.height = targetSize;

      if (ctx) {
        ctx.drawImage(
          image,
          croppedAreaPixels.x,
          croppedAreaPixels.y,
          croppedAreaPixels.width,
          croppedAreaPixels.height,
          0,
          0,
          targetSize,
          targetSize
        );
      }

      const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
      setPreviewUrl(dataUrl);
      setResizedBase64(dataUrl);
      setImageSrc(null);
    } catch {
      setErrorMsg("画像の加工に失敗しました。");
    }
  }, [imageSrc, croppedAreaPixels]);

  return (
    <AuthBackground>
      <div className="bg-white/70 backdrop-blur-2xl border border-white/40 shadow-2xl rounded-[2.5rem] p-10 w-full max-w-110 relative overflow-hidden">
        
        {/* クロップ用モーダル */}
        <AnimatePresence>
          {imageSrc && (
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }}
              className="absolute inset-0 z-50 bg-slate-900/95 flex flex-col"
            >
              <div className="relative flex-1 w-full">
                <Cropper
                  image={imageSrc}
                  crop={crop}
                  zoom={zoom}
                  aspect={1}
                  cropShape="round"
                  showGrid={false}
                  onCropChange={setCrop}
                  onCropComplete={onCropComplete}
                  onZoomChange={setZoom}
                />
              </div>
              <div className="p-8 bg-white/5 space-y-6">
                <input 
                  type="range" value={zoom} min={1} max={3} step={0.1}
                  onChange={(e) => setZoom(Number(e.target.value))}
                  className="w-full h-1.5 bg-white/20 rounded-lg appearance-none cursor-pointer accent-sky-400"
                />
                <div className="flex gap-4">
                  <button type="button" onClick={() => setImageSrc(null)} className="flex-1 py-3 bg-white/10 text-white rounded-full text-sm font-medium hover:bg-white/20 transition-all flex items-center justify-center gap-2">
                    <X size={18} /> キャンセル
                  </button>
                  <button type="button" onClick={generateCroppedImage} className="flex-1 py-3 bg-sky-500 text-white rounded-full text-sm font-bold hover:bg-sky-600 transition-all flex items-center justify-center gap-2 shadow-lg shadow-sky-500/30">
                    <Check size={18} /> 決定
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <header className="text-center mb-10">
          <h1 className="text-2xl font-bold tracking-tight text-slate-700">新しい記憶を紡ぐ</h1>
          {errorMsg && (
            <p className="mt-4 text-xs text-red-500 bg-red-50 py-2.5 rounded-xl border border-red-100 px-4">
              {errorMsg}
            </p>
          )}
        </header>

        <form 
          action={async (formData) => {
            formData.delete('avatarFile');
            setPending(true);
            setErrorMsg(null);
            try {
              const result = await signUp(formData);
              if (result?.error) setErrorMsg(result.error);
            } catch {
              setErrorMsg("接続に失敗しました。");
            } finally {
              setPending(false);
            }
          }} 
          className="space-y-8"
        >
          {/* プロフィール画像セクション */}
          <section className="flex flex-col items-center gap-6">
            <div className="flex items-center gap-6 w-full px-2">
              <div className="relative w-24 h-24 shrink-0 overflow-hidden rounded-full border-4 border-white shadow-md bg-slate-100">
                <Image 
                  src={previewUrl || selectedIcon} 
                  alt="Avatar" 
                  fill
                  className="object-cover"
                  unoptimized
                />
              </div>
              
              <div className="flex-1 space-y-3">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Icon Selection</p>
                <div className="flex gap-2">
                  {initialSeeds.map((seed) => (
                    <button
                      key={seed}
                      type="button"
                      disabled={pending}
                      onClick={() => { 
                        setSelectedIcon(`https://api.dicebear.com/7.x/avataaars/svg?seed=${seed}`); 
                        setPreviewUrl(null);
                        setResizedBase64(null);
                      }}
                      className={`relative w-8 h-8 rounded-full border-2 transition-all ${selectedIcon.includes(seed) && !previewUrl ? 'border-sky-400 scale-110 shadow-sm' : 'border-transparent hover:scale-105'}`}
                    >
                      <Image src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${seed}`} alt={seed} fill unoptimized className="rounded-full" />
                    </button>
                  ))}
                </div>
                
                <label className="flex items-center justify-center gap-2 w-full py-2 bg-white border border-slate-200 rounded-lg cursor-pointer hover:bg-slate-50 transition-all shadow-sm group">
                  <ImagePlus className="w-4 h-4 text-slate-400 group-hover:text-sky-500" />
                  <span className="text-xs font-bold text-slate-500 group-hover:text-sky-600">画像をアップロード</span>
                  <input type="file" accept="image/*" className="hidden" onChange={handleFileChange} disabled={pending} />
                </label>
              </div>
            </div>

            <input type="hidden" name="avatarUrl" value={selectedIcon} />
            <input type="hidden" name="resizedImageData" value={resizedBase64 || ""} />
            
            {/* セパレーター下線 */}
            <div className="w-full h-px bg-linear-to-r from-transparent via-slate-200 to-transparent" />
          </section>

          {/* 入力フィールドセクション */}
          <div className="space-y-4">
            <div className="relative group">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 flex items-center gap-3 border-r pr-3 border-slate-200 group-focus-within:border-sky-300 transition-colors">
                <User className="w-4 h-4 text-slate-400 group-focus-within:text-sky-500" />
              </div>
              <input 
                name="username" type="text" placeholder="ユーザー名" required 
                className="w-full pl-16 pr-4 py-4 bg-white/80 border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-sky-500/10 focus:border-sky-400 text-slate-600 font-medium transition-all placeholder:text-slate-300 shadow-sm" 
              />
            </div>

            <div className="relative group">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 flex items-center gap-3 border-r pr-3 border-slate-200 group-focus-within:border-sky-300 transition-colors">
                <Mail className="w-4 h-4 text-slate-400 group-focus-within:text-sky-500" />
              </div>
              <input 
                name="email" type="email" placeholder="メールアドレス" required 
                className="w-full pl-16 pr-4 py-4 bg-white/80 border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-sky-500/10 focus:border-sky-400 text-slate-600 font-medium transition-all placeholder:text-slate-300 shadow-sm" 
              />
            </div>

            <div className="relative group">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 flex items-center gap-3 border-r pr-3 border-slate-200 group-focus-within:border-sky-300 transition-colors">
                <Lock className="w-4 h-4 text-slate-400 group-focus-within:text-sky-500" />
              </div>
              <input 
                name="password" type="password" placeholder="パスワード" required 
                className="w-full pl-16 pr-4 py-4 bg-white/80 border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-sky-500/10 focus:border-sky-400 text-slate-600 font-medium transition-all placeholder:text-slate-300 shadow-sm" 
              />
            </div>
          </div>

          <button 
            type="submit" 
            disabled={pending || !!imageSrc} 
            className="w-full py-4 bg-slate-800 text-white rounded-2xl font-bold tracking-widest shadow-xl shadow-slate-200 hover:bg-slate-700 transition-all active:scale-[0.98] disabled:opacity-50 disabled:active:scale-100"
          >
            {pending ? '物語を準備中...' : 'はじめる'}
          </button>
        </form>
      </div>
    </AuthBackground>
  );
}