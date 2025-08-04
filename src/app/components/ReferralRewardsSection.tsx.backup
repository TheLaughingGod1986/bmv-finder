'use client';


import { GiftIcon } from '@heroicons/react/24/outline';

interface ReferralReward {
  icon: string;
  title: string;
  description: string;
}

interface ReferralRewardsSectionProps {
  title?: string;
  description?: string;
  rewards?: ReferralReward[];
  ctaText?: string;
  onCtaClick?: () => void;
  className?: string;
}

const defaultRewards: ReferralReward[] = [
  {
    icon: '🎁',
    title: 'Free Month',
    description: 'Get 1 month free for each friend who upgrades'
  },
  {
    icon: '⭐',
    title: 'Exclusive Features',
    description: 'Unlock premium features for referring 5+ friends'
  },
  {
    icon: '🏆',
    title: 'VIP Status',
    description: 'Become a VIP member with 10+ referrals'
  }
];

export default function ReferralRewardsSection({
  title = 'Refer Friends & Earn Rewards',
  description = 'Share BMV Finder with friends and earn exclusive rewards. Both you and your friends get benefits!',
  rewards = defaultRewards,
  ctaText = 'Get Referral Link',
  onCtaClick,
  className = ''
}: ReferralRewardsSectionProps) {
  return (
    <section className={`bg-gradient-to-r from-[#5DA271] to-[#3B755D] rounded-xl p-6 text-white ${className}`}>
      <div className="flex items-center gap-3 mb-4">
        <GiftIcon className="w-6 h-6" />
        <h2 className="text-xl font-bold">{title}</h2>
      </div>
      
      <p className="mb-4 text-white text-opacity-90">
        {description}
      </p>
      
      <div className="grid md:grid-cols-3 gap-4 mb-4">
        {rewards.map((reward, index) => (
          <div key={index} className="bg-white bg-opacity-10 rounded-lg p-3">
            <div className="text-2xl mb-2">{reward.icon}</div>
            <h3 className="font-semibold mb-1">{reward.title}</h3>
            <p className="text-sm text-white text-opacity-80">{reward.description}</p>
          </div>
        ))}
      </div>
      
      <button 
        onClick={onCtaClick}
        className="bg-white text-primary-600 px-6 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors"
      >
        {ctaText}
      </button>
    </section>
  );
} 