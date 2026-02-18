'use client';

import React, { useState, useEffect, ReactNode } from 'react';
import { AnimatePresence, motion } from 'framer-motion';

type TimeOfDay = 'sunrise' | 'morning' | 'day' | 'evening' | 'night' | 'midnight';

export default function TimeOfDayBackground({ children }: { children: ReactNode }) {
  const [timeOfDay, setTimeOfDay] = useState<TimeOfDay>('day');

  useEffect(() => {
    const updateBackground = () => {
      const hour = new Date().getHours();
      let newTimeOfDay: TimeOfDay;

      if (hour >= 5 && hour < 6) {
        newTimeOfDay = 'sunrise'; // 5:00 - 5:59
      } else if (hour >= 6 && hour < 10) {
        newTimeOfDay = 'morning'; // 6:00 - 9:59
      } else if (hour >= 10 && hour < 17) {
        newTimeOfDay = 'day';     // 10:00 - 16:59
      } else if (hour >= 17 && hour < 18) {
        newTimeOfDay = 'evening'; // 17:00 - 17:59
      } else if (hour >= 18 && hour < 24) {
        newTimeOfDay = 'night';   // 18:00 - 23:59
      } else {
        newTimeOfDay = 'midnight';// 0:00 - 4:59
      }
      setTimeOfDay(newTimeOfDay);
    };

    // 初期ロード時に一度実行
    updateBackground();

    // 1分ごとに更新（細かく設定することも可能）
    const intervalId = setInterval(updateBackground, 60 * 1000); 

    return () => clearInterval(intervalId);
  }, []);

  const backgroundClass = `time-of-day-${timeOfDay}`;

  return (
    <div className="relative min-h-screen overflow-hidden">
      {/* 背景アニメーションとクラス切り替え */}
      <AnimatePresence>
        <motion.div
          key={timeOfDay} // timeOfDayが変わるたびに再レンダリング & アニメーション
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 1.5 }} // フェードイン/アウトの時間
          className={`absolute inset-0 transition-colors duration-1000 ${backgroundClass}`}
        >
          {/* 星と彗星のエフェクト */}
          {timeOfDay === 'night' && <div className="stars-effect" />}
          {timeOfDay === 'midnight' && (
            <>
              <div className="stars-effect" />
              <div className="shooting-star" />
            </>
          )}
        </motion.div>
      </AnimatePresence>
      
      {/* 子コンポーネントを配置 */}
      {children}
    </div>
  );
}