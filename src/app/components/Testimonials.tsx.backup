

const testimonials = [
  {
    name: 'Sarah J.',
    title: 'Property Investor',
    quote: 'This platform helped me find my best investment yet. The analytics and insights are top-notch!',
  },
  {
    name: 'James L.',
    title: 'First-Time Buyer',
    quote: 'I felt confident making my purchase thanks to the clear data and support. Highly recommended!',
  },
  {
    name: 'Priya S.',
    title: 'Portfolio Landlord',
    quote: 'The Pro plan paid for itself in my first month. The bulk analysis and reports are a game changer.',
  },
];

export default function Testimonials() {
  return (
    <section aria-labelledby="testimonials-heading" className="my-12">
      <h2 id="testimonials-heading" className="text-2xl md:text-3xl font-bold text-primary-blue-dark text-center mb-8">What Our Users Say</h2>
      <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
        {testimonials.map((t, i) => (
          <figure key={i} className="bg-white border border-neutral-200 rounded-xl shadow p-6 flex flex-col h-full">
            <blockquote className="text-primary-green-dark italic mb-4 flex-1">“{t.quote}”</blockquote>
            <figcaption className="mt-4 text-right">
              <span className="font-semibold text-primary-blue">{t.name}</span>
              <span className="block text-xs text-primary-green">{t.title}</span>
            </figcaption>
          </figure>
        ))}
      </div>
    </section>
  );
} 