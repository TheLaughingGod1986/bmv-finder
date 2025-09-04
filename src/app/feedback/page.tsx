'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Send, 
  Star, 
  ThumbsUp, 
  ThumbsDown, 
  MessageCircle, 
  Bug, 
  Lightbulb, 
  Heart,
  CheckCircle,
  AlertCircle
} from 'lucide-react';

export default function FeedbackPage() {
  const [feedbackType, setFeedbackType] = useState('feature');
  const [rating, setRating] = useState(0);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    email: '',
    category: 'feature'
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const feedbackTypes = [
    { id: 'feature', label: 'Feature Request', icon: Lightbulb, color: 'blue' },
    { id: 'bug', label: 'Bug Report', icon: Bug, color: 'red' },
    { id: 'improvement', label: 'Improvement', icon: ThumbsUp, color: 'green' },
    { id: 'general', label: 'General Feedback', icon: MessageCircle, color: 'purple' }
  ];

  const categories = [
    'Property Search',
    'Valuation Engine',
    'Chrome Extension',
    'Portfolio Management',
    'Market Analysis',
    'User Interface',
    'Performance',
    'Mobile Experience',
    'API',
    'Other'
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    setIsSubmitting(false);
    setIsSubmitted(true);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-emerald-50 flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white rounded-xl shadow-lg p-8 max-w-md mx-auto text-center"
        >
          <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Thank You!
          </h2>
          <p className="text-gray-600 mb-6">
            Your feedback has been submitted successfully. We'll review it and get back to you if needed.
          </p>
          <button
            onClick={() => {
              setIsSubmitted(false);
              setFormData({ title: '', description: '', email: '', category: 'feature' });
              setRating(0);
            }}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
          >
            Submit Another
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-emerald-50">
      <div className="container mx-auto px-4 py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-4xl md:text-5xl font-bold text-gray-900 mb-4"
          >
            Share Your Feedback
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-xl text-gray-600 max-w-3xl mx-auto"
          >
            Help us improve by sharing your thoughts, reporting bugs, or suggesting new features
          </motion.p>
        </div>

        <div className="max-w-4xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Feedback Types */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-xl shadow-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Feedback Type</h3>
                <div className="space-y-3">
                  {feedbackTypes.map((type) => (
                    <button
                      key={type.id}
                      onClick={() => {
                        setFeedbackType(type.id);
                        setFormData({ ...formData, category: type.id });
                      }}
                      className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-left transition-colors ${
                        feedbackType === type.id
                          ? `bg-${type.color}-100 text-${type.color}-700 border-2 border-${type.color}-200`
                          : 'text-gray-600 hover:bg-gray-100 border-2 border-transparent'
                      }`}
                    >
                      <type.icon className="w-5 h-5" />
                      <span>{type.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Rating */}
              <div className="bg-white rounded-xl shadow-lg p-6 mt-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Overall Rating</h3>
                <div className="flex items-center space-x-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      onClick={() => setRating(star)}
                      className="focus:outline-none"
                    >
                      <Star
                        className={`w-8 h-8 ${
                          star <= rating
                            ? 'text-yellow-400 fill-current'
                            : 'text-gray-300'
                        }`}
                      />
                    </button>
                  ))}
                </div>
                <p className="text-sm text-gray-600 mt-2">
                  {rating === 0 ? 'Rate your experience' : 
                   rating === 1 ? 'Poor' :
                   rating === 2 ? 'Fair' :
                   rating === 3 ? 'Good' :
                   rating === 4 ? 'Very Good' : 'Excellent'}
                </p>
              </div>
            </div>

            {/* Feedback Form */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-xl shadow-lg p-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">
                  {feedbackTypes.find(t => t.id === feedbackType)?.label}
                </h2>

                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Title */}
                  <div>
                    <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
                      Title *
                    </label>
                    <input
                      type="text"
                      id="title"
                      name="title"
                      value={formData.title}
                      onChange={handleInputChange}
                      required
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Brief description of your feedback"
                    />
                  </div>

                  {/* Category */}
                  <div>
                    <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-2">
                      Category
                    </label>
                    <select
                      id="category"
                      name="category"
                      value={formData.category}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      {categories.map((category) => (
                        <option key={category} value={category.toLowerCase().replace(' ', '-')}>
                          {category}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Description */}
                  <div>
                    <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
                      Description *
                    </label>
                    <textarea
                      id="description"
                      name="description"
                      value={formData.description}
                      onChange={handleInputChange}
                      required
                      rows={6}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Please provide detailed information about your feedback..."
                    />
                  </div>

                  {/* Email */}
                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                      Email (Optional)
                    </label>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="your@email.com"
                    />
                    <p className="text-sm text-gray-500 mt-1">
                      We'll only use this to follow up if needed
                    </p>
                  </div>

                  {/* Submit Button */}
                  <div className="flex items-center justify-between pt-6">
                    <div className="text-sm text-gray-600">
                      * Required fields
                    </div>
                    <button
                      type="submit"
                      disabled={isSubmitting || !formData.title || !formData.description}
                      className="flex items-center space-x-2 px-8 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isSubmitting ? (
                        <>
                          <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          <span>Submitting...</span>
                        </>
                      ) : (
                        <>
                          <Send className="w-5 h-5" />
                          <span>Submit Feedback</span>
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>

          {/* Additional Information */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="mt-12 grid grid-cols-1 md:grid-cols-2 gap-6"
          >
            <div className="bg-white rounded-xl shadow-lg p-6">
              <div className="flex items-center space-x-3 mb-4">
                <Heart className="w-6 h-6 text-red-500" />
                <h3 className="text-lg font-semibold text-gray-900">We Value Your Input</h3>
              </div>
              <p className="text-gray-600">
                Your feedback helps us prioritize features and improvements. We review all submissions 
                and use them to guide our product development roadmap.
              </p>
            </div>

            <div className="bg-white rounded-xl shadow-lg p-6">
              <div className="flex items-center space-x-3 mb-4">
                <AlertCircle className="w-6 h-6 text-blue-500" />
                <h3 className="text-lg font-semibold text-gray-900">Response Time</h3>
              </div>
              <p className="text-gray-600">
                We typically respond to feedback within 2-3 business days. For urgent issues, 
                please contact our support team directly.
              </p>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
