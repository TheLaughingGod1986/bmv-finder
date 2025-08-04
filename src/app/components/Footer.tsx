'use client';

import Link from 'next/link';
import { 
  Building2, 
  Mail, 
  Phone, 
  MapPin, 
  Twitter, 
  Linkedin, 
  Facebook, 
  Instagram,
  Github,
  ExternalLink,
  Heart,
  Shield,
  FileText,
  Users,
  HelpCircle,
  Star,
  TrendingUp,
  Calculator,
  Search,
  Eye,
  PieChart,
  Target,
  BarChart3,
  PoundSterling,
  FileText as FileTextIcon
} from 'lucide-react';

interface FooterProps {
  className?: string;
}

export default function Footer({ className = '' }: FooterProps) {
  const currentYear = new Date().getFullYear();

  const productLinks = [
    { name: 'Property Search', href: '/search', icon: Search, description: 'Find properties by postcode or address' },
    { name: 'BMV Analysis', href: '/advanced-deal-analysis', icon: Target, description: 'Below market value detection' },
    { name: 'Deal Calculator', href: '/deal-calculator', icon: Calculator, description: 'ROI and yield calculations' },
    { name: 'Market Trends', href: '/market-analysis', icon: BarChart3, description: 'Regional market insights' },
    { name: 'HPI Dashboard', href: '/hpi-dashboard', icon: TrendingUp, description: 'House Price Index data' },
    { name: 'Valuation', href: '/what-should-i-pay', icon: PoundSterling, description: 'Fair value analysis' },
    { name: 'Watchlist', href: '/watchlist', icon: Eye, description: 'Save properties of interest' },
    { name: 'Portfolio', href: '/portfolio-tracker', icon: PieChart, description: 'Track your investments' },
    { name: 'Comprehensive Valuation', href: '/comprehensive-valuation', icon: FileTextIcon, description: 'Detailed property reports' }
  ];

  const companyLinks = [
    { name: 'About Us', href: '/about', description: 'Our story and mission' },
    { name: 'Pricing', href: '/pricing', description: 'Plans and pricing' },
    { name: 'Roadmap', href: '/roadmap', description: 'Product development plans' },
    { name: 'Chrome Extension', href: '/extension-welcome', description: 'Browser extension for property capture' },
    { name: 'API Documentation', href: '/api-docs', description: 'Developer resources' }
  ];

  const supportLinks = [
    { name: 'Help Center', href: '/help', description: 'FAQs and guides' },
    { name: 'Contact Support', href: 'mailto:support@bmvfinder.com', description: 'Get in touch' },
    { name: 'Status Page', href: '/status', description: 'Service status' },
    { name: 'Feature Requests', href: '/feedback', description: 'Suggest improvements' }
  ];

  const legalLinks = [
    { name: 'Privacy Policy', href: '/privacy', description: 'How we handle your data' },
    { name: 'Terms of Service', href: '/terms', description: 'Terms and conditions' },
    { name: 'Cookie Policy', href: '/cookies', description: 'Cookie usage' },
    { name: 'GDPR Compliance', href: '/gdpr', description: 'Data protection' }
  ];

  const socialLinks = [
    { name: 'Twitter', href: process.env.NEXT_PUBLIC_SOCIAL_TWITTER || 'https://twitter.com/bmvfinder', icon: Twitter },
    { name: 'LinkedIn', href: process.env.NEXT_PUBLIC_SOCIAL_LINKEDIN || 'https://linkedin.com/company/bmvfinder', icon: Linkedin },
    { name: 'Facebook', href: process.env.NEXT_PUBLIC_SOCIAL_FACEBOOK || 'https://facebook.com/bmvfinder', icon: Facebook },
    { name: 'Instagram', href: process.env.NEXT_PUBLIC_SOCIAL_INSTAGRAM || 'https://instagram.com/bmvfinder', icon: Instagram },
    { name: 'GitHub', href: process.env.NEXT_PUBLIC_SOCIAL_GITHUB || 'https://github.com/TheLaughingGod1986/bmv-finder', icon: Github }
  ];

  return (
    <footer className={`bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white ${className}`}>
      {/* Main Footer Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          
          {/* Company Info */}
          <div className="lg:col-span-1">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 via-purple-500 to-indigo-600 rounded-xl flex items-center justify-center">
                <Building2 className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-xl font-bold">BMV Finder</h3>
                <p className="text-sm text-gray-400">UK Property Insights</p>
              </div>
            </div>
            <p className="text-gray-300 mb-6 leading-relaxed">
              The UK&apos;s most comprehensive property investment platform. Find below market value properties, analyze deals, and track your portfolio with AI-powered insights.
            </p>
            
            {/* Contact Info */}
            <div className="space-y-3 mb-6">
              <div className="flex items-center gap-3 text-gray-300">
                <Mail className="w-4 h-4 text-blue-400" />
                <a href={`mailto:${process.env.NEXT_PUBLIC_SUPPORT_EMAIL || 'support@bmvfinder.com'}`} className="hover:text-white transition-colors">
                  {process.env.NEXT_PUBLIC_SUPPORT_EMAIL || 'support@bmvfinder.com'}
                </a>
              </div>
              <div className="flex items-center gap-3 text-gray-300">
                <MapPin className="w-4 h-4 text-blue-400" />
                <span>United Kingdom</span>
              </div>
            </div>

            {/* Social Links */}
            <div className="flex gap-3">
              {socialLinks.map((social) => (
                <a
                  key={social.name}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-10 h-10 bg-gray-700 hover:bg-blue-600 rounded-lg flex items-center justify-center transition-all duration-200 hover:scale-110"
                  aria-label={social.name}
                >
                  <social.icon className="w-5 h-5" />
                </a>
              ))}
            </div>
          </div>

          {/* Product Links */}
          <div>
            <h4 className="text-lg font-semibold mb-6 flex items-center gap-2">
              <Target className="w-5 h-5 text-blue-400" />
              Products
            </h4>
            <div className="space-y-3">
              {productLinks.map((link) => (
                <Link
                  key={link.name}
                  href={link.href}
                  className="block text-gray-300 hover:text-white transition-colors group"
                >
                  <div className="flex items-center gap-2">
                    <link.icon className="w-4 h-4 text-blue-400 group-hover:scale-110 transition-transform" />
                    <span className="font-medium">{link.name}</span>
                  </div>
                  <p className="text-sm text-gray-500 ml-6 mt-1">{link.description}</p>
                </Link>
              ))}
            </div>
          </div>

          {/* Company & Support */}
          <div>
            <h4 className="text-lg font-semibold mb-6 flex items-center gap-2">
              <Users className="w-5 h-5 text-blue-400" />
              Company
            </h4>
            <div className="space-y-3 mb-8">
              {companyLinks.map((link) => (
                <Link
                  key={link.name}
                  href={link.href}
                  className="block text-gray-300 hover:text-white transition-colors group"
                >
                  <div className="flex items-center gap-2">
                    <ExternalLink className="w-4 h-4 text-blue-400 group-hover:scale-110 transition-transform" />
                    <span className="font-medium">{link.name}</span>
                  </div>
                  <p className="text-sm text-gray-500 ml-6 mt-1">{link.description}</p>
                </Link>
              ))}
            </div>

            <h4 className="text-lg font-semibold mb-6 flex items-center gap-2">
              <HelpCircle className="w-5 h-5 text-blue-400" />
              Support
            </h4>
            <div className="space-y-3">
              {supportLinks.map((link) => (
                <Link
                  key={link.name}
                  href={link.href}
                  className="block text-gray-300 hover:text-white transition-colors group"
                >
                  <div className="flex items-center gap-2">
                    <ExternalLink className="w-4 h-4 text-blue-400 group-hover:scale-110 transition-transform" />
                    <span className="font-medium">{link.name}</span>
                  </div>
                  <p className="text-sm text-gray-500 ml-6 mt-1">{link.description}</p>
                </Link>
              ))}
            </div>
          </div>

          {/* Legal & Resources */}
          <div>
            <h4 className="text-lg font-semibold mb-6 flex items-center gap-2">
              <Shield className="w-5 h-5 text-blue-400" />
              Legal
            </h4>
            <div className="space-y-3 mb-8">
              {legalLinks.map((link) => (
                <Link
                  key={link.name}
                  href={link.href}
                  className="block text-gray-300 hover:text-white transition-colors group"
                >
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-blue-400 group-hover:scale-110 transition-transform" />
                    <span className="font-medium">{link.name}</span>
                  </div>
                  <p className="text-sm text-gray-500 ml-6 mt-1">{link.description}</p>
                </Link>
              ))}
            </div>

            <h4 className="text-lg font-semibold mb-6 flex items-center gap-2">
              <Star className="w-5 h-5 text-blue-400" />
              Resources
            </h4>
            <div className="space-y-3">
              <Link href="/sitemap.xml" className="block text-gray-300 hover:text-white transition-colors group">
                <div className="flex items-center gap-2">
                  <ExternalLink className="w-4 h-4 text-blue-400 group-hover:scale-110 transition-transform" />
                  <span className="font-medium">Sitemap</span>
                </div>
                <p className="text-sm text-gray-500 ml-6 mt-1">All pages and content</p>
              </Link>
              <Link href="/api-docs" className="block text-gray-300 hover:text-white transition-colors group">
                <div className="flex items-center gap-2">
                  <ExternalLink className="w-4 h-4 text-blue-400 group-hover:scale-110 transition-transform" />
                  <span className="font-medium">API Docs</span>
                </div>
                <p className="text-sm text-gray-500 ml-6 mt-1">Developer resources</p>
              </Link>
              <Link href="/blog" className="block text-gray-300 hover:text-white transition-colors group">
                <div className="flex items-center gap-2">
                  <ExternalLink className="w-4 h-4 text-blue-400 group-hover:scale-110 transition-transform" />
                  <span className="font-medium">Blog</span>
                </div>
                <p className="text-sm text-gray-500 ml-6 mt-1">Property investment insights</p>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2 text-gray-400">
              <span>&copy; {currentYear} BMV Finder. All rights reserved.</span>
              <span className="hidden md:inline">•</span>
              <span className="hidden md:inline">Made with</span>
              <Heart className="w-4 h-4 text-red-500 hidden md:inline" />
              <span className="hidden md:inline">in the UK</span>
            </div>
            
            <div className="flex items-center gap-6 text-sm text-gray-400">
              <span>Data from Land Registry Price Paid Data</span>
              <span className="hidden md:inline">•</span>
              <span>Powered by AI & Machine Learning</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
} 