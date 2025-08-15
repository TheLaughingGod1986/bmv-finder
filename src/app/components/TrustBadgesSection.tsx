'use client';



interface TrustBadge {
  icon: string;
  text: string;
  color?: string;
}

interface PartnerLogo {
  name: string;
  placeholder?: boolean;
}

interface Testimonial {
  name: string;
  role: string;
  content: string;
  avatar: string;
  avatarColor: string;
}

interface TrustBadgesSectionProps {
  badges?: TrustBadge[];
  partners?: PartnerLogo[];
  testimonials?: Testimonial[];
  showBadges?: boolean;
  showPartners?: boolean;
  showTestimonials?: boolean;
  className?: string;
}

const defaultBadges: TrustBadge[] = [
  {
    icon: '✓',
    text: 'Trusted by 1,000+ investors',
    color: '#5DA271'
  },
  {
    icon: '🔒',
    text: 'Secure Payments by Stripe',
    color: '#5DA271'
  },
  {
    icon: '📄',
    text: 'Data from UK Land Registry',
    color: '#5DA271'
  }
];

const defaultPartners: PartnerLogo[] = [
  { name: 'Rightmove' },
  { name: 'Zoopla' },
  { name: 'BBC' },
  { name: 'Property Week' }
];

const defaultTestimonials: Testimonial[] = [
  {
    name: 'Sarah M.',
    role: 'Property Investor',
    content: '"Found my dream investment property using their BMV scoring. Saved me hours of research!"',
    avatar: 'S',
    avatarColor: '#3A7CA5'
  },
  {
    name: 'Mike R.',
    role: 'First-time Buyer',
    content: '"The property history feature helped me understand the market value perfectly."',
    avatar: 'M',
    avatarColor: '#5DA271'
  },
  {
    name: 'Lisa K.',
    role: 'Estate Agent',
    content: '"Professional tool that gives my clients the insights they need to make informed decisions."',
    avatar: 'L',
    avatarColor: '#D4AF37'
  }
];

export default function TrustBadgesSection({
  badges = defaultBadges,
  partners = defaultPartners,
  testimonials = defaultTestimonials,
  showBadges = true,
  showPartners = true,
  showTestimonials = true,
  className = ''
}: TrustBadgesSectionProps) {
  return (
    <div className={className}>
      {/* Trust Badges */}
      {showBadges && (
        <section className="mb-12 flex flex-wrap justify-center gap-4 items-center">
          {badges.map((badge, index) => (
            <span 
              key={index}
              className="flex items-center gap-2 bg-neutral-200 text-primary-blue-dark px-4 py-3 rounded-full font-bold text-sm shadow-sm border border-neutral-200"
            >
              <span style={{ color: badge.color || '#5DA271' }}>{badge.icon}</span>
              {badge.text}
            </span>
          ))}
        </section>
      )}

      {/* Partner/Press Logos */}
      {showPartners && (
        <section className="mb-12 text-center">
          <h2 className="text-lg font-semibold text-primary-green-dark mb-6">As featured in</h2>
          <div className="flex flex-wrap justify-center items-center gap-8 opacity-60">
            {partners.map((partner, index) => (
              <div 
                key={index}
                className="h-8 w-24 bg-neutral-200 rounded flex items-center justify-center text-primary-blue-dark font-bold text-sm"
              >
                {partner.name}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Testimonials */}
      {showTestimonials && (
        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-8 text-center text-primary-blue-dark">What our users say</h2>
          <div className="grid md:grid-cols-3 gap-6">
            {testimonials.map((testimonial, index) => (
              <div key={index} className="bg-neutral-100 p-6 rounded-xl border border-neutral-200">
                <div className="flex items-center mb-4">
                  <div 
                    className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg mr-3"
                    style={{ backgroundColor: testimonial.avatarColor }}
                  >
                    {testimonial.avatar}
                  </div>
                  <div>
                    <p className="font-bold text-primary-blue-dark">{testimonial.name}</p>
                    <p className="text-sm text-primary-green-dark">{testimonial.role}</p>
                  </div>
                </div>
                <p className="text-primary-green-dark leading-relaxed">{testimonial.content}</p>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
} 