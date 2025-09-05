import { 
  Shield, 
  Eye, 
  Lock, 
  Users, 
  FileText, 
  CheckCircle,
  Calendar,
  Mail,
  Phone,
  MapPin
} from 'lucide-react';
import Link from 'next/link';
import { 
  MotionDiv, 
  MotionSection, 
  MotionH1, 
  MotionH2, 
  MotionH3, 
  MotionP 
} from '../components/MotionWrapper';

export default function PrivacyPage() {
  const lastUpdated = 'January 15, 2025';

  const dataWeCollect = [
    {
      category: 'Account Information',
      items: ['Name', 'Email address', 'Password (encrypted)', 'Account preferences']
    },
    {
      category: 'Property Data',
      items: ['Search queries', 'Saved properties', 'Watchlist items', 'Portfolio data']
    },
    {
      category: 'Usage Data',
      items: ['Search history', 'Feature usage', 'Page visits', 'Interaction data']
    },
    {
      category: 'Technical Data',
      items: ['IP address', 'Browser type', 'Device information', 'Cookies']
    }
  ];

  const howWeUseData = [
    {
      purpose: 'Provide Services',
      description: 'To deliver our property search, analysis, and portfolio tracking features'
    },
    {
      purpose: 'Improve Platform',
      description: 'To enhance user experience and develop new features based on usage patterns'
    },
    {
      purpose: 'Communicate',
      description: 'To send important updates, support responses, and marketing communications (with consent)'
    },
    {
      purpose: 'Security',
      description: 'To protect against fraud, abuse, and ensure platform security'
    }
  ];

  const dataSharing = [
    {
      partner: 'Land Registry',
      purpose: 'Property sales data and market information',
      type: 'Public data access'
    },
    {
      partner: 'Analytics Services',
      purpose: 'Website performance and user experience optimization',
      type: 'Anonymous usage data'
    },
    {
      partner: 'Payment Processors',
      purpose: 'Secure payment processing for premium subscriptions',
      type: 'Payment information only'
    }
  ];

  const userRights = [
    {
      right: 'Access',
      description: 'Request a copy of your personal data'
    },
    {
      right: 'Rectification',
      description: 'Correct inaccurate or incomplete data'
    },
    {
      right: 'Erasure',
      description: 'Request deletion of your personal data'
    },
    {
      right: 'Portability',
      description: 'Receive your data in a portable format'
    },
    {
      right: 'Objection',
      description: 'Object to processing of your data'
    },
    {
      right: 'Restriction',
      description: 'Limit how we process your data'
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Hero Section */}
      <section className="relative py-20 bg-gradient-to-r from-blue-600 to-purple-600 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <MotionDiv
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center"
          >
            <div className="inline-flex items-center justify-center w-20 h-20 bg-white/20 rounded-full mb-8">
              <Shield className="w-10 h-10" />
            </div>
            <h1 className="text-4xl md:text-6xl font-bold mb-6">
              Privacy Policy
            </h1>
            <p className="text-xl md:text-2xl text-blue-100 max-w-3xl mx-auto leading-relaxed">
              How we protect and handle your personal information
            </p>
            <div className="mt-8 flex items-center justify-center gap-4 text-blue-100">
              <Calendar className="w-5 h-5" />
              <span>Last updated: {lastUpdated}</span>
            </div>
          </MotionDiv>
        </div>
      </section>

      {/* Overview Section */}
      <section className="py-20 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <MotionDiv
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">
              Your Privacy Matters
            </h2>
            <p className="text-lg text-gray-600 leading-relaxed">
              At Property Intelligence Platform, we are committed to protecting your privacy and ensuring the security of your personal information. 
              This Privacy Policy explains how we collect, use, and safeguard your data when you use our platform.
            </p>
          </MotionDiv>

          <MotionDiv
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            viewport={{ once: true }}
            className="bg-blue-50 rounded-2xl p-8 mb-12"
          >
            <div className="flex items-start gap-4">
              <Lock className="w-8 h-8 text-blue-600 mt-1" />
              <div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">Our Commitment</h3>
                <p className="text-gray-600 leading-relaxed">
                  We follow industry best practices for data protection and are fully compliant with GDPR (General Data Protection Regulation) 
                  and other applicable privacy laws. Your data is encrypted, securely stored, and never sold to third parties.
                </p>
              </div>
            </div>
          </MotionDiv>
        </div>
      </section>

      {/* Data Collection Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <MotionDiv
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">
              Data We Collect
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              We collect only the data necessary to provide you with our services and improve your experience
            </p>
          </MotionDiv>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {dataWeCollect.map((category, index) => (
              <MotionDiv
                key={category.category}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                viewport={{ once: true }}
                className="bg-white p-6 rounded-xl shadow-sm"
              >
                <h3 className="text-xl font-bold text-gray-900 mb-4">{category.category}</h3>
                <ul className="space-y-2">
                  {category.items.map((item) => (
                    <li key={item} className="flex items-center gap-2 text-gray-600">
                      <CheckCircle className="w-4 h-4 text-green-500" />
                      {item}
                    </li>
                  ))}
                </ul>
              </MotionDiv>
            ))}
          </div>
        </div>
      </section>

      {/* How We Use Data Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <MotionDiv
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">
              How We Use Your Data
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              We use your data responsibly and only for purposes that benefit your experience
            </p>
          </MotionDiv>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {howWeUseData.map((use, index) => (
              <MotionDiv
                key={use.purpose}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                viewport={{ once: true }}
                className="bg-gray-50 p-6 rounded-xl"
              >
                <h3 className="text-lg font-bold text-gray-900 mb-3">{use.purpose}</h3>
                <p className="text-gray-600">{use.description}</p>
              </MotionDiv>
            ))}
          </div>
        </div>
      </section>

      {/* Data Sharing Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <MotionDiv
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">
              Data Sharing
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              We share data only with trusted partners and never sell your personal information
            </p>
          </MotionDiv>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {dataSharing.map((partner, index) => (
              <MotionDiv
                key={partner.partner}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                viewport={{ once: true }}
                className="bg-white p-6 rounded-xl shadow-sm"
              >
                <h3 className="text-lg font-bold text-gray-900 mb-2">{partner.partner}</h3>
                <p className="text-gray-600 mb-3">{partner.purpose}</p>
                <span className="inline-block bg-blue-100 text-blue-800 text-sm px-3 py-1 rounded-full">
                  {partner.type}
                </span>
              </MotionDiv>
            ))}
          </div>
        </div>
      </section>

      {/* User Rights Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <MotionDiv
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">
              Your Rights
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Under GDPR and other privacy laws, you have several rights regarding your personal data
            </p>
          </MotionDiv>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {userRights.map((right, index) => (
              <MotionDiv
                key={right.right}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                viewport={{ once: true }}
                className="bg-gray-50 p-6 rounded-xl"
              >
                <h3 className="text-lg font-bold text-gray-900 mb-3">{right.right}</h3>
                <p className="text-gray-600">{right.description}</p>
              </MotionDiv>
            ))}
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section className="py-20 bg-gradient-to-r from-blue-600 to-purple-600 text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <MotionDiv
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-6">
              Questions About Privacy?
            </h2>
            <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
              We're here to help. Contact our privacy team for any questions about your data or privacy rights.
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="flex items-center justify-center gap-3">
                <Mail className="w-5 h-5" />
                <a href="mailto:privacy@bmvfinder.com" className="hover:underline">
                  privacy@bmvfinder.com
                </a>
              </div>
              <div className="flex items-center justify-center gap-3">
                <Phone className="w-5 h-5" />
                <span>+44 (0) 20 1234 5678</span>
              </div>
              <div className="flex items-center justify-center gap-3">
                <MapPin className="w-5 h-5" />
                <span>United Kingdom</span>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/terms"
                className="inline-flex items-center gap-2 px-8 py-4 bg-white text-blue-600 font-semibold rounded-lg hover:bg-gray-100 transition-colors"
              >
                <FileText className="w-5 h-5" />
                Terms of Service
              </Link>
              <Link
                href="/cookies"
                className="inline-flex items-center gap-2 px-8 py-4 border-2 border-white text-white font-semibold rounded-lg hover:bg-white hover:text-blue-600 transition-colors"
              >
                <Eye className="w-5 h-5" />
                Cookie Policy
              </Link>
            </div>
          </MotionDiv>
        </div>
      </section>
    </div>
  );
} 