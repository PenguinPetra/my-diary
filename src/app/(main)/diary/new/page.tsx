import { createDiary } from './actions'
import Link from 'next/link'

export default function NewDiaryPage() {
  return (
    <div className="max-w-2xl mx-auto p-6">
      <header className="flex justify-between items-center mb-8">
        <h1 className="text-xl font-bold">新しい日記</h1>
        <Link href="/dashboard" className="text-sm text-gray-500 hover:underline">
          キャンセル
        </Link>
      </header>

      <form action={createDiary} className="space-y-6">
        <div>
          <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
            タイトル
          </label>
          <input
            id="title"
            name="title"
            type="text"
            placeholder="今日のできごと"
            className="w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500 outline-none"
          />
        </div>

        <div>
          <label htmlFor="content" className="block text-sm font-medium text-gray-700 mb-1">
            内容
          </label>
          <textarea
            id="content"
            name="content"
            rows={10}
            required
            placeholder="どんな一日でしたか？"
            className="w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500 outline-none resize-none"
          ></textarea>
        </div>

        <button
          type="submit"
          className="w-full bg-blue-500 text-white py-3 rounded-md font-semibold hover:bg-blue-600 transition-colors"
        >
          保存する
        </button>
      </form>
    </div>
  )
}