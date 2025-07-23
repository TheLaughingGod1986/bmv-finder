'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { Analytics } from '@vercel/analytics/react';
import { SpeedInsights } from '@vercel/speed-insights/next';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  TrendingUp, BarChart3, Calculator, Search, Home as HomeIcon, 
  Target, Award, Shield, Zap, Clock, Users, CheckCircle, 
  ArrowRight, Star, MapPin, PoundSterling, ChartBar, 
  FileText, Building, Eye, ArrowUpRight
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useToast } from './components/ToastProvider';
import AddressSearchInput from './components/AddressSearchInput';

export default function Home() {
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { showToast } = useToast();
  const router = useRouter();

  const handleSearch = useCallback(async (searchInput: string) => {
    if (!searchInput.trim()) {
      showToast({
        type: 'warning',
        title: 'Search Required',
        message: 'Please enter a postcode or address to search.',
      });
      return;
    }
    
    setIsLoading(true);
    // Navigate to search results
    router.push(`/search?q=${encodeURIComponent(searchInput.trim())}`);
  }, [showToast, router]);

  const features = [
    {
      icon: <Search className="w-6 h-6" />,
      title: "25M+ Property Sales",
      description: "Instant access to every UK property sale since 1995",
      highlight: "Largest database"
    },
    {
      icon: <TrendingUp className="w-6 h-6" />,
      title: "BMV Score Analysis",
      description: "AI-powered below market value detection for investors",
      highlight: "Exclusive feature"
    },
    {
      icon: <Calculator className="w-6 h-6" />,
      title: "Deal Calculator",
      description: "Calculate ROI, yields, and investment potential instantly",
      highlight: "Free tool"
    },
    {
      icon: <BarChart3 className="w-6 h-6" />,
      title: "Market Trends",
      description: "Track price movements and market performance over time",
      highlight: "Real-time data"
    },
    {
      icon: <Target className="w-6 h-6" />,
      title: "Investment Insights",
      description: "Identify high-growth areas and investment opportunities",
      highlight: "Pro feature"
    },
    {
      icon: <FileText className="w-6 h-6" />,
      title: "Professional Reports",
      description: "Generate detailed PDF reports for negotiations",
      highlight: "Elite feature"
    }
  ];

  const benefits = [
    "Save hours of research time",
    "Make data-driven investment decisions", 
    "Negotiate better deals with evidence",
    "Track your portfolio performance",
    "Identify emerging market trends",
    "Access professional-grade tools"
  ];

  const testimonials = [
    {
      name: "Sarah Mitchell",
      role: "Property Investor",
      content: "Found my best investment property using the BMV score. Made £45k profit in 6 months!",
      rating: 5
    },
    {
      name: "David Chen", 
      role: "First-time Buyer",
      content: "The deal calculator helped me understand exactly what I could afford. Saved me £12k on my purchase.",
      rating: 5
    },
    {
      name: "Emma Thompson",
      role: "Property Developer",
      content: "The market trends feature is incredible. I can spot opportunities before anyone else.",
      rating: 5
    }
  ];

  return (
    <>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
        <Analytics />
        <SpeedInsights />

        {/* Hero Section */}
        <section className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 opacity-10"></div>
          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-16">
            <div className="text-center">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                className="mb-6"
              >
                <span className="inline-flex items-center px-4 py-2 rounded-full text-sm font-medium bg-blue-100 text-blue-800 mb-4">
                  <Star className="w-4 h-4 mr-2" />
                  Trusted by 50,000+ property professionals
                </span>
              </motion.div>

              <motion.h1
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.1 }}
                className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 mb-6 leading-tight"
              >
                The UK's Most Powerful
                <span className="block text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600">
                  Property Research Platform
                </span>
              </motion.h1>

              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
                className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto"
              >
                Access 25 million property sales, AI-powered BMV analysis, and professional tools to make smarter property decisions.
              </motion.p>

              {/* Search Bar */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.3 }}
                className="max-w-2xl mx-auto mb-8"
              >
                <AddressSearchInput
                  value={searchTerm}
                  onChange={setSearchTerm}
                  onSearch={handleSearch}
                  isLoading={isLoading}
                  placeholder="Enter a postcode or address to start..."
                  showHistory={true}
                  showSuggestions={true}
                  className="w-full"
                />
              </motion.div>

              {/* CTA Buttons */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.4 }}
                className="flex flex-col sm:flex-row gap-4 justify-center items-center"
              >
                <button
                  onClick={() => router.push('/advanced-deal-analysis')}
                  className="inline-flex items-center px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold rounded-lg shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200"
                >
                  Try Deal Analysis
                  <ArrowRight className="w-5 h-5 ml-2" />
                </button>
                <button
                  onClick={() => router.push('/pricing')}
                  className="inline-flex items-center px-8 py-4 bg-white text-gray-900 font-semibold rounded-lg shadow-lg hover:shadow-xl border border-gray-200 transform hover:-translate-y-0.5 transition-all duration-200"
                >
                  View Pricing
                  <ArrowUpRight className="w-5 h-5 ml-2" />
                </button>
              </motion.div>

              {/* Trust Indicators */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.5 }}
                className="mt-12 flex flex-wrap justify-center items-center gap-8 text-sm text-gray-500"
              >
                <div className="flex items-center gap-2">
                  <Shield className="w-4 h-4" />
                  <span>Bank-level security</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  <span>Real-time data</span>
                </div>
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4" />
                  <span>50,000+ users</span>
                </div>
              </motion.div>
            </div>
          </div>
        </section>

        {/* Features Grid */}
        <section className="py-20 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
                Everything You Need to Succeed in Property
              </h2>
              <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                From basic searches to advanced investment analysis, we've got all the tools you need.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {features.map((feature, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  viewport={{ once: true }}
                  className="bg-gradient-to-br from-gray-50 to-white p-8 rounded-2xl border border-gray-200 hover:shadow-xl transition-all duration-300 group"
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className="p-3 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg text-white group-hover:scale-110 transition-transform duration-200">
                      {feature.icon}
                    </div>
                    <span className="text-xs font-semibold text-blue-600 bg-blue-100 px-2 py-1 rounded-full">
                      {feature.highlight}
                    </span>
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-3">{feature.title}</h3>
                  <p className="text-gray-600 leading-relaxed">{feature.description}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Benefits Section */}
        <section className="py-20 bg-gradient-to-r from-blue-50 to-purple-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6 }}
                viewport={{ once: true }}
              >
                <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-6">
                  Why Property Professionals Choose Us
                </h2>
                <div className="space-y-4">
                  {benefits.map((benefit, index) => (
                    <div key={index} className="flex items-start gap-3">
                      <CheckCircle className="w-6 h-6 text-green-500 mt-0.5 flex-shrink-0" />
                      <span className="text-lg text-gray-700">{benefit}</span>
                    </div>
                  ))}
                </div>
                <div className="mt-8">
                  <button
                    onClick={() => router.push('/account/upgrade')}
                    className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold rounded-lg hover:shadow-lg transition-all duration-200"
                  >
                    Start Your Free Trial
                    <ArrowRight className="w-5 h-5 ml-2" />
                  </button>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, x: 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6 }}
                viewport={{ once: true }}
                className="relative"
              >
                <div className="bg-white p-8 rounded-2xl shadow-xl">
                  <div className="flex items-center gap-4 mb-6">
                    <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                      <TrendingUp className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-gray-900">Average User Results</h3>
                      <p className="text-gray-600">Based on 50,000+ users</p>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Time saved per search</span>
                      <span className="font-bold text-green-600">2.5 hours</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Average deal savings</span>
                      <span className="font-bold text-green-600">£15,000</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Investment ROI improvement</span>
                      <span className="font-bold text-green-600">+23%</span>
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </section>

        {/* Testimonials */}
        <section className="py-20 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
                What Our Users Say
              </h2>
              <p className="text-xl text-gray-600">
                Join thousands of satisfied property professionals
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {testimonials.map((testimonial, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  viewport={{ once: true }}
                  className="bg-gradient-to-br from-gray-50 to-white p-8 rounded-2xl border border-gray-200"
                >
                  <div className="flex items-center gap-1 mb-4">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <Star key={i} className="w-5 h-5 text-yellow-400 fill-current" />
                    ))}
                  </div>
                  <p className="text-gray-700 mb-6 italic">"{testimonial.content}"</p>
                  <div>
                    <div className="font-semibold text-gray-900">{testimonial.name}</div>
                    <div className="text-sm text-gray-600">{testimonial.role}</div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-20 bg-gradient-to-r from-blue-600 to-purple-600">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
              className="text-3xl sm:text-4xl font-bold text-white mb-6"
            >
              Ready to Transform Your Property Business?
            </motion.h2>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              viewport={{ once: true }}
              className="text-xl text-blue-100 mb-8"
            >
              Join 50,000+ property professionals who trust us with their research
            </motion.p>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              viewport={{ once: true }}
              className="flex flex-col sm:flex-row gap-4 justify-center"
            >
              <button
                onClick={() => router.push('/account/upgrade')}
                className="inline-flex items-center px-8 py-4 bg-white text-blue-600 font-semibold rounded-lg hover:bg-gray-100 transition-colors duration-200"
              >
                Start Free Trial
                <ArrowRight className="w-5 h-5 ml-2" />
              </button>
              <button
                onClick={() => router.push('/pricing')}
                className="inline-flex items-center px-8 py-4 border-2 border-white text-white font-semibold rounded-lg hover:bg-white hover:text-blue-600 transition-colors duration-200"
              >
                View All Plans
                <ArrowUpRight className="w-5 h-5 ml-2" />
              </button>
            </motion.div>
          </div>
        </section>
      </div>
    </>
  );
}




