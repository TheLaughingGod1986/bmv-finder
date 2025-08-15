

const badges = [
  {
    icon: (
      <svg className="w-7 h-7 text-secondary-600" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
    ),
    label: 'Trusted by 1,000+ investors',
  },
  {
    icon: (
      <svg className="w-7 h-7 text-primary-600" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0110 0v4" /></svg>
    ),
    label: 'Secure payments',
  },
  {
    icon: (
      <svg className="w-7 h-7 text-yellow-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="10" /><path d="M12 8v4l3 3" /></svg>
    ),
    label: 'Data privacy guaranteed',
  },
  {
    icon: (
      <svg className="w-7 h-7 text-gray-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" aria-hidden="true"><rect x="4" y="4" width="16" height="16" rx="2" /><path d="M8 9h8M8 13h6" /></svg>
    ),
    label: 'Featured in major press',
  },
];

export default function TrustBadges() {
  return (
    <section aria-label="Trust and Security" className="my-8">
      <div className="flex flex-wrap justify-center gap-6">
        {badges.map((b, i) => (
          <div key={i} className="flex items-center gap-3 bg-neutral-100 border border-neutral-200 rounded-full px-5 py-3 shadow text-primary-700 text-base font-medium">
            {b.icon}
            <span>{b.label}</span>
          </div>
        ))}
      </div>
    </section>
  );
} 