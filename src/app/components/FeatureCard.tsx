'use client';

import React from 'react';

interface FeatureCardProps {
  icon: string;
  title: string;
  description: string;
  className?: string;
}

export default function FeatureCard({ icon, title, description, className = '' }: FeatureCardProps) {
  return (
    <div className={`bg-white rounded-xl shadow p-8 flex flex-col items-center text-center border border-[#E5E5E5] ${className}`}>
      <span className="text-3xl mb-3">{icon}</span>
      <h3 className="text-xl font-bold text-[#2C6E91] mb-2">{title}</h3>
      <p className="text-[#3B755D]">{description}</p>
    </div>
  );
} 