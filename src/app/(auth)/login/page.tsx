'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Mail, Lock, LogIn } from 'lucide-react';
import { AuthBackground } from '@/components/auth/AuthBackground';
import { signIn } from './actions';

export default function LoginPage() {
  const [pending, setPending] = useState(false);

  return (
    <AuthBackground>
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="bg-white/40 backdrop-blur-xl border border-white/60 shadow-2xl rounded-3xl p-8"
      >
        <div className="text-center mb-8">
          <h1 className="text-2xl font-light tracking-widest text-slate-600 mb-2">
            記憶の続きを書く
          </h1>
          <p className="text-xs text-slate-400">Welcome back</p>
        </div>

        <form action={async (formData) => {
          setPending(true);
          await signIn(formData);
          setPending(false);
        }} className="space-y-6">
          
          <div className="space-y-4">
            {/* メールアドレス */}
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                name="email"
                type="email"
                placeholder="メールアドレス"
                required
                className="w-full pl-10 pr-4 py-3 bg-white/50 border border-white/20 rounded-full focus:outline-none focus:ring-2 focus:ring-sky-200 transition-all placeholder:text-slate-300 text-slate-600"
              />
            </div>

            {/* パスワード */}
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                name="password"
                type="password"
                placeholder="パスワード"
                required
                className="w-full pl-10 pr-4 py-3 bg-white/50 border border-white/20 rounded-full focus:outline-none focus:ring-2 focus:ring-sky-200 transition-all placeholder:text-slate-300 text-slate-600"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={pending}
            className="w-full py-3 bg-blue-400/80 hover:bg-blue-500 text-white rounded-full font-light tracking-widest shadow-lg shadow-blue-200/50 transition-all flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50"
          >
            <LogIn className="w-4 h-4" />
            {pending ? 'ログイン中...' : 'ログイン'}
          </button>
        </form>

        <div className="mt-8 text-center space-y-2">
          <p className="text-xs text-slate-400">
            はじめての方はこちら
          </p>
          <a href="/register" className="inline-block text-xs text-sky-500 hover:text-sky-600 font-medium transition-colors">
            新しくアカウントを作る
          </a>
        </div>
      </motion.div>
    </AuthBackground>
  );
}