'use client';



interface SectionProps {
  children: React.ReactNode;
  id?: string;
  className?: string;
  background?: 'white' | 'light' | 'dark';
}

export default function Section({ children, id, className = '', background = 'white' }: SectionProps) {
  const backgroundClasses = {
    white: 'bg-white',
    light: 'bg-neutral-200',
    dark: 'bg-primary-blue-dark text-white'
  };

  return (
    <section 
      id={id} 
      className={`py-16 px-4 ${backgroundClasses[background]} ${className}`}
    >
      <div className="max-w-7xl mx-auto">
        {children}
      </div>
    </section>
  );
} 