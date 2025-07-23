'use client';



interface FooterProps {
  className?: string;
}

export default function Footer({ className = '' }: FooterProps) {
  return (
    <footer className={`bg-primary-blue-dark text-white py-8 mt-auto ${className}`}>
      <div className="max-w-7xl mx-auto px-4 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="text-lg font-bold">UK Property Insights</div>
        <div className="flex gap-6 text-sm">
          <a href="#features" className="hover:underline">Features</a>
          <a href="#plans" className="hover:underline">Plans</a>
          <a href="#testimonials" className="hover:underline">Testimonials</a>
          <a href="mailto:support@propertyinsights.co.uk" className="hover:underline">Support</a>
          <a href="/sitemap.xml" className="hover:underline">Sitemap</a>
          <a href="/privacy" className="hover:underline">Privacy Policy</a>
          <a href="/terms" className="hover:underline">Terms</a>
        </div>
        <div className="text-xs text-gray-400">
          &copy; {new Date().getFullYear()} UK Property Insights. All rights reserved.
        </div>
      </div>
    </footer>
  );
} 