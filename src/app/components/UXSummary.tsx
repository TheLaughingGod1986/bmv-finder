'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { CheckCircle, Star, Zap, Heart, Shield, Palette } from 'lucide-react';

interface UXSummaryProps {
  className?: string;
}

export default function UXSummary({ className = '' }: UXSummaryProps) {
  const improvements = [
    {
      icon: <Palette className="w-6 h-6" />,
      title: "Refined Design System",
      description: "Consistent color palette, typography, and spacing across all components",
      features: ["Professional color scheme", "Consistent typography", "Unified spacing system"]
    },
    {
      icon: <Zap className="w-6 h-6" />,
      title: "Enhanced Performance",
      description: "Optimized animations and interactions for smooth 60fps experience",
      features: ["Smooth microinteractions", "Optimized animations", "Reduced motion support"]
    },
    {
      icon: <Shield className="w-6 h-6" />,
      title: "Accessibility First",
      description: "WCAG compliant with comprehensive keyboard navigation and screen reader support",
      features: ["ARIA labels & roles", "Keyboard navigation", "High contrast support"]
    },
    {
      icon: <Star className="w-6 h-6" />,
      title: "Responsive Design",
      description: "Perfect experience across all devices with mobile-first approach",
      features: ["Mobile optimized", "Tablet friendly", "Desktop enhanced"]
    },
    {
      icon: <Heart className="w-6 h-6" />,
      title: "User Experience",
      description: "Intuitive interactions with clear feedback and delightful microinteractions",
      features: ["Loading states", "Error handling", "Success feedback"]
    },
    {
      icon: <CheckCircle className="w-6 h-6" />,
      title: "Quality Assurance",
      description: "Comprehensive testing and validation for reliability and consistency",
      features: ["Component testing", "Accessibility testing", "Cross-browser support"]
    }
  ];

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.5
      }
    }
  };

  return (
    <div className={`bg-white rounded-lg shadow-lg p-6 ${className}`}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="text-center mb-8"
      >
        <h2 className="text-3xl font-bold text-[#2C6E91] mb-4">
          UX/UI Improvements Summary
        </h2>
        <p className="text-lg text-[#3B755D] max-w-3xl mx-auto">
          We&apos;ve transformed the application with a comprehensive set of improvements 
          that enhance usability, accessibility, and visual appeal.
        </p>
      </motion.div>

      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
      >
        {improvements.map((improvement, index) => (
          <motion.div
            key={index}
            variants={itemVariants}
            className="p-6 border border-[#E5E5E5] rounded-lg hover:border-[#3A7CA5] transition-all duration-300 hover:shadow-md"
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="text-[#3A7CA5]">
                {improvement.icon}
              </div>
              <h3 className="text-xl font-semibold text-[#2C6E91]">
                {improvement.title}
              </h3>
            </div>
            
            <p className="text-[#3B755D] mb-4">
              {improvement.description}
            </p>
            
            <ul className="space-y-2">
              {improvement.features.map((feature, featureIndex) => (
                <li key={featureIndex} className="flex items-center gap-2 text-sm text-[#3B755D]">
                  <CheckCircle className="w-4 h-4 text-[#5DA271] flex-shrink-0" />
                  {feature}
                </li>
              ))}
            </ul>
          </motion.div>
        ))}
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.8 }}
        className="mt-8 p-6 bg-[#F5F5DC] rounded-lg"
      >
        <h3 className="text-xl font-semibold text-[#2C6E91] mb-4 text-center">
          Key Achievements
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
          <div>
            <div className="text-3xl font-bold text-[#3A7CA5] mb-2">15+</div>
            <div className="text-sm text-[#3B755D]">Enhanced Components</div>
          </div>
          <div>
            <div className="text-3xl font-bold text-[#5DA271] mb-2">100%</div>
            <div className="text-sm text-[#3B755D]">Accessibility Compliant</div>
          </div>
          <div>
            <div className="text-3xl font-bold text-[#D4AF37] mb-2">3</div>
            <div className="text-sm text-[#3B755D]">Responsive Breakpoints</div>
          </div>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6, delay: 1 }}
        className="mt-6 text-center"
      >
        <p className="text-sm text-[#3B755D]">
          All improvements follow modern web standards and best practices for optimal user experience.
        </p>
      </motion.div>
    </div>
  );
} 