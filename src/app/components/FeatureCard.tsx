'use client';



interface FeatureCardProps {
  icon: string;
  title: string;
  description: string;
  className?: string;
}

export default function FeatureCard({ icon, title, description, className = '' }: FeatureCardProps) {
  return (
    <div className={`bg-white rounded-xl shadow p-8 flex flex-col items-center text-center border border-neutral-200 ${className}`}>
      <span className="text-3xl mb-3">{icon}</span>
      <h3 className="text-xl font-bold text-primary-blue-dark mb-2">{title}</h3>
      <p className="text-primary-green-dark">{description}</p>
    </div>
  );
} 