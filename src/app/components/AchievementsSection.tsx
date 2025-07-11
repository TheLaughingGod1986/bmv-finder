'use client';

import React from 'react';
import { TrophyIcon } from '@heroicons/react/24/outline';
import AchievementCard, { Achievement } from './AchievementCard';

interface AchievementsSectionProps {
  achievements: Achievement[];
  title?: string;
  showProgress?: boolean;
  className?: string;
}

export default function AchievementsSection({ 
  achievements, 
  title = 'Achievements',
  showProgress = true,
  className = '' 
}: AchievementsSectionProps) {
  const earnedAchievements = achievements.filter(a => a.earned);
  const totalAchievements = achievements.length;

  return (
    <section className={`mb-8 ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-[#2C6E91] flex items-center gap-2">
          <TrophyIcon className="w-6 h-6" />
          {title}
        </h2>
        <span className="text-sm font-semibold text-[#3B755D]">
          {earnedAchievements.length}/{totalAchievements} earned
        </span>
      </div>
      
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {achievements.map((achievement) => (
          <AchievementCard
            key={achievement.id}
            achievement={achievement}
          />
        ))}
      </div>
      
      {/* Achievement Progress */}
      {showProgress && (
        <div className="mt-4 bg-[#F5F5DC] rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-semibold text-[#2C6E91]">Achievement Progress</span>
            <span className="text-sm text-[#3B755D]">
              {Math.round((earnedAchievements.length / totalAchievements) * 100)}% complete
            </span>
          </div>
          <div className="w-full bg-[#E5E5E5] rounded-full h-2">
            <div 
              className="bg-gradient-to-r from-[#D4AF37] to-[#C0C0C0] h-2 rounded-full transition-all duration-500"
              style={{ width: `${(earnedAchievements.length / totalAchievements) * 100}%` }}
            />
          </div>
        </div>
      )}
    </section>
  );
} 