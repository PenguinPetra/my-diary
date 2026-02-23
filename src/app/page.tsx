import { redirect } from 'next/navigation';

/**
 * アプリケーションのルートページ (/)
 * * 役割:
 * アクセスしてきたユーザーを即座に /dashboard へ転送します。
 * ダッシュボード側のサーバーコンポーネントで認証チェックを行っているため、
 * ログイン済みならそのまま表示、未ログインなら自動的に /login へ誘導されます。
 */
export default function Home() {
  redirect('/login');
}