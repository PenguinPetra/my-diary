'use client';

import { useState } from 'react';
import { Mail, Lock, LogIn } from 'lucide-react';
import { AuthBackground } from '@/components/auth/AuthBackground';
import { signIn } from './actions';

export default function LoginPage() {
  const [pending, setPending] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  return (
    <AuthBackground>
      <div className="bg-white/70 backdrop-blur-2xl border border-white/40 shadow-2xl rounded-[2.5rem] p-10 w-full max-w-110 relative overflow-hidden">
        
        <header className="text-center mb-10">
          <h1 className="text-2xl font-bold tracking-tight text-slate-700">記憶の続きを書く</h1>
          {errorMsg && (
            <p className="mt-4 text-xs text-red-500 bg-red-50 py-2.5 rounded-xl border border-red-100 px-4">
              {errorMsg}
            </p>
          )}
        </header>

        {/* セパレーター下線 */}
        <div className="w-full h-px bg-linear-to-r from-transparent via-slate-200 to-transparent mb-10" />

        <form 
          action={async (formData) => {
            setPending(true);
            setErrorMsg(null);
            const result = await signIn(formData);
            if (result?.error) {
              setErrorMsg("ログインに失敗しました。メールアドレスかパスワードが正しくありません。");
            }
            setPending(false);
          }} 
          className="space-y-8"
        >
          {/* 入力フィールドセクション */}
          <div className="space-y-4">
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
            disabled={pending} 
            className="w-full py-4 bg-slate-800 text-white rounded-2xl font-bold tracking-widest shadow-xl shadow-slate-200 hover:bg-slate-700 transition-all active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {pending ? (
              '照合中...'
            ) : (
              <>
                <LogIn size={20} />
                <span>ログイン</span>
              </>
            )}
          </button>
        </form>

        <div className="mt-10 text-center space-y-2">
          <p className="text-xs text-slate-400">
            はじめての方はこちら
          </p>
          <a href="/register" className="inline-block text-2xs text-sky-500 hover:text-sky-600 font-medium transition-colors">
            新しくアカウントを作る
          </a>
        </div>
      </div>
    </AuthBackground>
  );
}