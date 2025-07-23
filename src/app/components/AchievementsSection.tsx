'use client';


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
        <h2 className="text-xl font-bold text-primary-blue-dark flex items-center gap-2">
          <TrophyIcon className="w-6 h-6" />
          {title}
        </h2>
        <span className="text-sm font-semibold text-primary-green-dark">
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
        <div className="mt-4 bg-neutral-100 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-semibold text-primary-blue-dark">Achievement Progress</span>
            <span className="text-sm text-primary-green-dark">
              {Math.round((earnedAchievements.length / totalAchievements) * 100)}% complete
            </span>
          </div>
          <div className="w-full bg-neutral-200 rounded-full h-2">
            <div 
              className="bg-gradient-to-r from-yellow-500 to-gray-400 h-2 rounded-full transition-all duration-500"
              style={{ width: `${(earnedAchievements.length / totalAchievements) * 100}%` }}
            />
          </div>
        </div>
      )}
    </section>
  );
} 