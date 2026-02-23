'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createDiary } from '../../dashboard/actions';
import DiaryFormContent from '@/components/diary/DiaryFormContent';
// 重要なポイント：DiaryFormContent側で定義されている型をインポートします
// ※DiaryFormContent.tsx側で export interface DiarySaveData ... となっている必要があります
import type { DiarySaveData } from '@/components/diary/DiaryFormContent';

export default function NewDiaryPage() {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  /**
   * 保存処理
   * DiaryFormContentから渡されるdataの型を、インポートしたDiarySaveDataに合わせます
   */
  const handleSave = async (data: DiarySaveData) => {
    setLoading(true);
    try {
      // サーバーアクションの引数順序に合わせて実行
      // 引数: title, content, imageFile, diaryType, taskData, date
      await createDiary(
        data.title,              // 1. title
        data.content,            // 2. content
        data.imageFile || null,  // 3. imageFile
        data.diary_type,         // 4. diaryType
        data.tasks,              // 5. taskData (詳細画面で使う task_data に保存される)
        data.date                // 6. date
      );

      // 保存成功後の遷移
      router.push('/dashboard');
      router.refresh();
    } catch (error) {
      console.error('Failed to save diary:', error);
      alert('保存に失敗しました。');
    } finally {
      setLoading(false);
    }
  };

  return (
    <DiaryFormContent 
      onSave={handleSave} 
      loading={loading} 
      initialData={null} 
    />
  );
}