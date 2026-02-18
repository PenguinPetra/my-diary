'use client';

import { useState, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, Lock, User, Upload, Check, X } from 'lucide-react';
import Cropper, { Area } from 'react-easy-crop';
import { AuthBackground } from '@/components/auth/AuthBackground';
import { signUp } from './actions';
import Image from 'next/image';

export default function RegisterPage() {
  const [pending, setPending] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  
  const initialSeeds = useMemo(() => ["Aria", "Sora", "Kai", "Rin", "Yuki"], []);
  const [selectedIcon, setSelectedIcon] = useState(`https://api.dicebear.com/7.x/avataaars/svg?seed=${initialSeeds[0]}`);
  
  // クロップ関連の状態管理
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [resizedBase64, setResizedBase64] = useState<string | null>(null);

  // ファイル選択ハンドラ
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

  // クロップ完了時の座標保存（型をAreaに指定）
  const onCropComplete = useCallback((_: Area, pixels: Area) => {
    setCroppedAreaPixels(pixels);
  }, []);

  // 選択された範囲を400x400のJPEGとして生成
  const generateCroppedImage = useCallback(async () => {
    if (!imageSrc || !croppedAreaPixels) return;

    try {
      const image = new window.Image();
      image.src = imageSrc;
      await new Promise((resolve) => (image.onload = resolve));

      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const targetSize = 400; // アイコンの固定解像度

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
      setImageSrc(null); // 編集モーダルを閉じる
    } catch {
      setErrorMsg("画像の加工に失敗しました。");
    }
  }, [imageSrc, croppedAreaPixels]);

  return (
    <AuthBackground>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white/40 backdrop-blur-xl border border-white/60 shadow-2xl rounded-3xl p-8 relative overflow-hidden"
      >
        {/* クロップ用モーダル */}
        <AnimatePresence>
          {imageSrc && (
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }}
              className="absolute inset-0 z-50 bg-slate-900/90 backdrop-blur-md flex flex-col"
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
              <div className="p-6 bg-white/5 flex flex-col gap-4">
                <div className="flex items-center gap-4">
                  <span className="text-white text-xs opacity-60">Zoom</span>
                  <input 
                    type="range" value={zoom} min={1} max={3} step={0.1}
                    onChange={(e) => setZoom(Number(e.target.value))}
                    className="flex-1 h-1 bg-white/20 rounded-lg appearance-none cursor-pointer"
                  />
                </div>
                <div className="flex justify-between gap-4">
                  <button 
                    type="button" onClick={() => setImageSrc(null)}
                    className="flex-1 py-3 bg-white/10 text-white rounded-full text-sm font-light hover:bg-white/20 transition-colors flex items-center justify-center gap-2"
                  >
                    <X size={16} /> キャンセル
                  </button>
                  <button 
                    type="button" onClick={generateCroppedImage}
                    className="flex-1 py-3 bg-sky-500 text-white rounded-full text-sm font-medium hover:bg-sky-600 transition-colors flex items-center justify-center gap-2"
                  >
                    <Check size={16} /> 範囲を決定
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="text-center mb-6">
          <h1 className="text-2xl font-light tracking-widest text-slate-600 mb-2">新しい記憶を紡ぐ</h1>
          <p className="text-xs text-slate-400">Join the story</p>
          {errorMsg && (
            <p className="mt-4 text-xs text-red-500 bg-red-50/50 py-2 rounded-lg border border-red-100 px-2">
              {errorMsg}
            </p>
          )}
        </div>

        <form 
          action={async (formData) => {
            formData.delete('avatarFile'); // 巨大な元ファイルを送信対象から除外
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
          className="space-y-5"
        >
          <div className="flex flex-col items-center gap-4">
            <div className="relative w-20 h-20 overflow-hidden rounded-full border-2 border-white shadow-sm bg-white/50">
              <Image 
                src={previewUrl || selectedIcon} 
                alt="Avatar" 
                fill
                className="object-cover"
                unoptimized
              />
            </div>
            
            <div className="flex flex-wrap justify-center gap-2">
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
                  className="relative w-8 h-8 rounded-full border border-white/50 overflow-hidden hover:scale-110 transition-transform disabled:opacity-50"
                >
                  <Image src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${seed}`} alt={seed} fill unoptimized />
                </button>
              ))}
              <label className={`w-8 h-8 flex items-center justify-center bg-white/50 rounded-full border border-white/50 cursor-pointer hover:bg-white transition-colors ${pending ? 'opacity-50 cursor-wait' : ''}`}>
                <Upload className="w-4 h-4 text-slate-500" />
                <input 
                  type="file" 
                  accept="image/*" 
                  className="hidden" 
                  onChange={handleFileChange}
                  disabled={pending}
                />
              </label>
            </div>
            <input type="hidden" name="avatarUrl" value={selectedIcon} />
            <input type="hidden" name="resizedImageData" value={resizedBase64 || ""} />
          </div>

          <div className="space-y-3">
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input name="username" type="text" placeholder="ユーザー名" required className="w-full pl-10 pr-4 py-3 bg-white/50 border border-white/20 rounded-full outline-none focus:ring-2 focus:ring-sky-200 text-slate-600" />
            </div>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input name="email" type="email" placeholder="メールアドレス" required className="w-full pl-10 pr-4 py-3 bg-white/50 border border-white/20 rounded-full outline-none focus:ring-2 focus:ring-sky-200 text-slate-600" />
            </div>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input name="password" type="password" placeholder="パスワード" required className="w-full pl-10 pr-4 py-3 bg-white/50 border border-white/20 rounded-full outline-none focus:ring-2 focus:ring-sky-200 text-slate-600" />
            </div>
          </div>

          <button 
            type="submit" 
            disabled={pending || !!imageSrc} 
            className="w-full py-3 bg-sky-400/80 hover:bg-sky-400 text-white rounded-full font-light tracking-widest shadow-lg transition-all active:scale-95 disabled:opacity-50"
          >
            {pending ? '物語を準備中...' : 'はじめる'}
          </button>
        </form>

        <div className="mt-6 text-center">
          <a href="/login" className="text-xs text-slate-400 hover:text-sky-500 transition-colors">すでにアカウントをお持ちですか？</a>
        </div>
      </motion.div>
    </AuthBackground>
  );
}