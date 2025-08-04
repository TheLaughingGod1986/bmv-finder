'use client';



interface PersonalizedGreetingProps {
  userName?: string;
  planName?: string;
  title?: string;
  subtitle?: string;
  className?: string;
}

export default function PersonalizedGreeting({
  userName,
  planName,
  title,
  subtitle,
  className = ''
}: PersonalizedGreetingProps) {
  const defaultTitle = `Hi${userName ? `, ${userName}` : ''}!`;
  const defaultSubtitle = planName 
    ? `You're currently on the ${planName} plan`
    : 'Welcome to BMV Finder';

  return (
    <div className={`mb-8 text-center bg-gradient-to-r from-[#F5F5DC] to-[#E5E5E5] rounded-xl p-6 border border-neutral-200 ${className}`}>
      <h1 className="text-3xl md:text-4xl font-bold text-primary-blue-dark mb-2 leading-tight">
        {title || defaultTitle}
      </h1>
      <p className="text-lg md:text-xl text-primary-green-dark font-medium leading-relaxed">
        {subtitle || defaultSubtitle}
      </p>
    </div>
  );
} 