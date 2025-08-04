'use client';


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
          ? 'bg-gradient-to-br from-yellow-500 to-gray-400 border-yellow-500 text-white shadow-lg'
          : 'bg-neutral-100 border-neutral-200 text-primary-600 opacity-60'
      } ${className}`}
    >
      <div className="text-center">
        <div className="text-2xl mb-2">{achievement.icon}</div>
        <h3 className={`font-bold text-sm mb-1 ${
          achievement.earned ? 'text-white' : 'text-primary-700'
        }`}>
          {achievement.name}
        </h3>
        <p className={`text-xs ${
          achievement.earned ? 'text-white text-opacity-90' : 'text-primary-600'
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