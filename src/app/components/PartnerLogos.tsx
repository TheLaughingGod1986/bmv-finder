

const partners = [
  { name: 'PropertyWeek', svg: <span className="font-bold text-lg">PropertyWeek</span> },
  { name: 'The Times', svg: <span className="font-bold text-lg">The Times</span> },
  { name: 'Estate Gazette', svg: <span className="font-bold text-lg">Estate Gazette</span> },
  { name: 'InvestNow', svg: <span className="font-bold text-lg">InvestNow</span> },
];

export default function PartnerLogos() {
  return (
    <section aria-label="Partner and Press Logos" className="my-8">
      <div className="text-center text-primary-600 text-sm mb-3">As featured in</div>
      <div className="flex flex-wrap justify-center gap-8 items-center">
        {partners.map((p, i) => (
          <div key={i} className="bg-neutral-200 rounded-lg px-6 py-3 flex items-center justify-center min-w-[120px] min-h-[48px] shadow-sm" aria-label={p.name} title={p.name}>
            {p.svg}
          </div>
        ))}
      </div>

    </section>
  );
} 