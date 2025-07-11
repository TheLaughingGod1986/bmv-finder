'use client';

import React from 'react';
import { SparklesIcon } from '@heroicons/react/24/outline';

export interface Achievement {
  id: string;
  name: string;
  description: string;
  earned: boolean;
  icon: string;
}

interface AchievementCardProps {
  achievement: Achievement;
  className?: string;
}

export default function AchievementCard({ achievement, className = '' }: AchievementCardProps) {
  return (
    <div
      className={`p-4 rounded-lg border-2 transition-all duration-300 ${
        achievement.earned
          ? 'bg-gradient-to-br from-[#D4AF37] to-[#C0C0C0] border-[#D4AF37] text-white shadow-lg'
          : 'bg-[#F5F5DC] border-[#E5E5E5] text-[#3B755D] opacity-60'
      } ${className}`}
    >
      <div className="text-center">
        <div className="text-2xl mb-2">{achievement.icon}</div>
        <h3 className={`font-bold text-sm mb-1 ${
          achievement.earned ? 'text-white' : 'text-[#2C6E91]'
        }`}>
          {achievement.name}
        </h3>
        <p className={`text-xs ${
          achievement.earned ? 'text-white text-opacity-90' : 'text-[#3B755D]'
        }`}>
          {achievement.description}
        </p>
        {achievement.earned && (
          <div className="mt-2">
            <SparklesIcon className="w-4 h-4 mx-auto text-white" />
          </div>
        )}
      </div>
    </div>
  );
} 