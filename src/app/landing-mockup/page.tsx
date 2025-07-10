import React from 'react';

export default function LandingMockup() {
  return (
    <div className="min-h-screen bg-[#F5F5DC] flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-white/90 backdrop-blur border-b border-[#E5E5E5]">
        <div className="max-w-7xl mx-auto flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-2">
            <span className="text-2xl font-extrabold text-[#3A7CA5] tracking-tight">🏡 UK Property Insights</span>
          </div>
          <nav className="hidden md:flex gap-6 text-[#2C6E91] font-medium">
            <a href="#features" className="hover:text-[#5DA271] transition">Features</a>
            <a href="#plans" className="hover:text-[#5DA271] transition">Plans</a>
            <a href="#testimonials" className="hover:text-[#5DA271] transition">Testimonials</a>
            <a href="#footer" className="hover:text-[#5DA271] transition">Contact</a>
          </nav>
          <a href="/account" className="ml-4 px-5 py-2 rounded-lg bg-[#3A7CA5] text-white font-semibold shadow hover:bg-[#2C6E91] transition">Login / Register</a>
        </div>
      </header>

      {/* Hero Section */}
      <section className="bg-gradient-to-b from-[#F5F5DC] to-[#E5E5E5] py-20 px-4 text-center">
        <h1 className="text-4xl md:text-5xl font-extrabold text-[#2C6E91] mb-4">Discover the True Value of UK Homes</h1>
        <p className="text-lg md:text-xl text-[#3B755D] mb-8 max-w-2xl mx-auto">Instantly see recent sales, market trends, and get smart tools to help you decide what’s a fair price—whether you’re buying, selling, or investing.</p>
        <form className="max-w-lg mx-auto flex flex-col sm:flex-row gap-3 justify-center">
          <input type="text" placeholder="Search by postcode, street, or town" className="flex-1 px-4 py-3 rounded-lg border border-[#D2B48C] focus:ring-2 focus:ring-[#3A7CA5] outline-none" />
          <button type="submit" className="px-6 py-3 rounded-lg bg-[#5DA271] text-white font-semibold shadow hover:bg-[#3B755D] transition">Search</button>
        </form>
        <div className="flex flex-wrap justify-center gap-6 mt-10 text-[#2C6E91]">
          <div className="flex flex-col items-center"><span className="text-2xl font-bold">2.5M+</span><span className="text-sm">Properties</span></div>
          <div className="flex flex-col items-center"><span className="text-2xl font-bold">BMV Score</span><span className="text-sm">Investment Rating</span></div>
          <div className="flex flex-col items-center"><span className="text-2xl font-bold">⚡</span><span className="text-sm">Live Data</span></div>
          <div className="flex flex-col items-center"><span className="text-2xl font-bold">🔒</span><span className="text-sm">Trusted & Secure</span></div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="max-w-6xl mx-auto py-16 px-4 grid md:grid-cols-3 gap-10">
        <div className="bg-white rounded-xl shadow p-8 flex flex-col items-center text-center border border-[#E5E5E5]">
          <span className="text-3xl mb-3">📈</span>
          <h3 className="text-xl font-bold text-[#2C6E91] mb-2">Comprehensive Analytics</h3>
          <p className="text-[#3B755D]">Analyse local markets, trends, and yields with up-to-date Land Registry data.</p>
        </div>
        <div className="bg-white rounded-xl shadow p-8 flex flex-col items-center text-center border border-[#E5E5E5]">
          <span className="text-3xl mb-3">🔍</span>
          <h3 className="text-xl font-bold text-[#2C6E91] mb-2">Smart Search Tools</h3>
          <p className="text-[#3B755D]">Find properties by postcode, street, or town. Filter by price, type, and more.</p>
        </div>
        <div className="bg-white rounded-xl shadow p-8 flex flex-col items-center text-center border border-[#E5E5E5]">
          <span className="text-3xl mb-3">💡</span>
          <h3 className="text-xl font-bold text-[#2C6E91] mb-2">Investor Insights</h3>
          <p className="text-[#3B755D]">Get BMV scores, investment ratings, and actionable insights for every property.</p>
        </div>
      </section>

      {/* Plans Section */}
      <section id="plans" className="bg-[#E5E5E5] py-16 px-4">
        <h2 className="text-3xl font-extrabold text-[#2C6E91] text-center mb-10">Simple, Transparent Plans</h2>
        <div className="max-w-5xl mx-auto grid md:grid-cols-3 gap-8">
          {/* Starter Plan */}
          <div className="rounded-xl border-2 border-[#E5E5E5] bg-white shadow-sm p-8 flex flex-col items-center">
            <h3 className="text-xl font-bold mb-2">Starter</h3>
            <p className="text-3xl font-extrabold text-[#3A7CA5] mb-4">Free</p>
            <ul className="mb-6 text-left text-[#3B755D] text-sm">
              <li>✔️ Basic search & analytics</li>
              <li>✔️ Access to public data</li>
              <li>✔️ Limited saved searches</li>
            </ul>
            <a href="/account" className="inline-block px-6 py-2 rounded-lg bg-[#5DA271] text-white font-semibold hover:bg-[#3B755D] transition">Get Started</a>
          </div>
          {/* Pro Plan */}
          <div className="rounded-xl border-2 border-[#D4AF37] bg-[#FFFBEA] shadow-md p-8 flex flex-col items-center relative">
            <span className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-[#D4AF37] text-white text-xs font-semibold shadow">Most Popular</span>
            <h3 className="text-xl font-bold mb-2">Pro</h3>
            <p className="text-3xl font-extrabold text-[#3A7CA5] mb-4">£14<span className="text-base font-normal">/mo</span></p>
            <ul className="mb-6 text-left text-[#3B755D] text-sm">
              <li>✔️ All Starter features</li>
              <li>✔️ Unlimited searches</li>
              <li>✔️ Download CSV</li>
              <li>✔️ Priority support</li>
            </ul>
            <a href="/account" className="inline-block px-6 py-2 rounded-lg bg-[#3A7CA5] text-white font-semibold hover:bg-[#2C6E91] transition">Upgrade to Pro</a>
          </div>
          {/* Elite Plan */}
          <div className="rounded-xl border-2 border-[#C0C0C0] bg-white shadow-sm p-8 flex flex-col items-center">
            <h3 className="text-xl font-bold mb-2">Elite</h3>
            <p className="text-3xl font-extrabold text-[#3A7CA5] mb-4">£29<span className="text-base font-normal">/mo</span></p>
            <ul className="mb-6 text-left text-[#3B755D] text-sm">
              <li>✔️ All Pro features</li>
              <li>✔️ API access</li>
              <li>✔️ Advanced analytics</li>
              <li>✔️ Early feature access</li>
            </ul>
            <a href="/account" className="inline-block px-6 py-2 rounded-lg bg-[#5DA271] text-white font-semibold hover:bg-[#3B755D] transition">Go Elite</a>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section id="testimonials" className="max-w-5xl mx-auto py-16 px-4">
        <h2 className="text-3xl font-extrabold text-[#2C6E91] text-center mb-10">What Our Users Say</h2>
        <div className="grid md:grid-cols-3 gap-8">
          <div className="bg-white rounded-xl shadow p-6 border border-[#E5E5E5] flex flex-col items-center text-center">
            <span className="text-4xl mb-2">⭐️⭐️⭐️⭐️⭐️</span>
            <p className="text-[#3B755D] mb-2">“The analytics and search tools are a game changer for my investment strategy.”</p>
            <span className="text-[#2C6E91] font-semibold">Tom H.</span>
          </div>
          <div className="bg-white rounded-xl shadow p-6 border border-[#E5E5E5] flex flex-col items-center text-center">
            <span className="text-4xl mb-2">⭐️⭐️⭐️⭐️⭐️</span>
            <p className="text-[#3B755D] mb-2">“I love the clean interface and the depth of data available.”</p>
            <span className="text-[#2C6E91] font-semibold">Michelle T.</span>
          </div>
          <div className="bg-white rounded-xl shadow p-6 border border-[#E5E5E5] flex flex-col items-center text-center">
            <span className="text-4xl mb-2">⭐️⭐️⭐️⭐️⭐️</span>
            <p className="text-[#3B755D] mb-2">“A must-have tool for any serious property investor.”</p>
            <span className="text-[#2C6E91] font-semibold">Richard D.</span>
          </div>
        </div>
        <div className="flex justify-center gap-6 mt-10">
          <img src="/public/trustpilot.svg" alt="Trustpilot" className="h-8" />
          <img src="/public/press-logo.svg" alt="Press" className="h-8" />
        </div>
      </section>

      {/* Footer */}
      <footer id="footer" className="bg-[#2C6E91] text-white py-8 mt-auto">
        <div className="max-w-7xl mx-auto px-4 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="text-lg font-bold">UK Property Insights</div>
          <div className="flex gap-6 text-sm">
            <a href="#features" className="hover:underline">Features</a>
            <a href="#plans" className="hover:underline">Plans</a>
            <a href="#testimonials" className="hover:underline">Testimonials</a>
            <a href="mailto:support@propertyinsights.co.uk" className="hover:underline">Support</a>
          </div>
          <div className="text-xs text-[#C0C0C0]">&copy; {new Date().getFullYear()} UK Property Insights. All rights reserved.</div>
        </div>
      </footer>
    </div>
  );
} 