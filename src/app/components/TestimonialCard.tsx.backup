'use client';



interface TestimonialCardProps {
  rating: number;
  text: string;
  author: string;
  className?: string;
}

export default function TestimonialCard({ rating, text, author, className = '' }: TestimonialCardProps) {
  const stars = '⭐️'.repeat(rating);
  
  return (
    <div className={`bg-white rounded-xl shadow p-6 border border-neutral-200 flex flex-col items-center text-center ${className}`}>
      <span className="text-4xl mb-2">{stars}</span>
      <p className="text-primary-600 mb-2">&ldquo;{text}&rdquo;</p>
      <span className="text-primary-700 font-semibold">{author}</span>
    </div>
  );
} 