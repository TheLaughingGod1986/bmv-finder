'use client';

import React, { useState } from 'react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

declare module 'jspdf' {
  interface jsPDF {
    lastAutoTable?: { finalY: number };
  }
}

interface CompSale {
  address: string;
  price: number;
  date: string;
}

interface Result {
  suggestedRange: [number, number];
  comps: CompSale[];
  alert: string | null;
  explanation: string[];
}

const DUMMY_COMPS: CompSale[] = [
  {
    address: '12 Example Rd, SW1A 1AA',
    price: 525000,
    date: '2023-11-10',
  },
  {
    address: '14 Example Rd, SW1A 1AA',
    price: 510000,
    date: '2023-09-22',
  },
  {
    address: '10 Example Rd, SW1A 1AA',
    price: 540000,
    date: '2023-08-15',
  },
];

function calculatePercentile(sorted: number[], p: number) {
  if (sorted.length === 0) return 0;
  const idx = (sorted.length - 1) * p;
  const lower = Math.floor(idx);
  const upper = Math.ceil(idx);
  if (lower === upper) return sorted[lower];
  return sorted[lower] + (sorted[upper] - sorted[lower]) * (idx - lower);
}

function getSuggestedOffer(comps: CompSale[], askingPrice?: number): Result {
  const prices = comps.map(c => c.price).sort((a, b) => a - b);
  const min = Math.round(calculatePercentile(prices, 0.1));
  const max = Math.round(calculatePercentile(prices, 0.9));
  const avg = Math.round(prices.reduce((a, b) => a + b, 0) / prices.length);
  let alert: string | null = null;
  if (askingPrice && askingPrice > avg * 1.1) {
    alert = 'Warning: Asking price is more than 10% above the local average.';
  }
  return {
    suggestedRange: [min, max],
    comps: comps.slice(0, 3),
    alert,
    explanation: [
      `Based on ${comps.length} recent sales in this postcode.`,
      `Average price: £${avg.toLocaleString()}`,
      `Closest sales: ${comps.map((c: CompSale) => `${c.address} (£${c.price.toLocaleString()})`).join(', ')}`,
    ],
  };
}

// --- Modular Bonus Feature Components (Dummy Logic) ---

function SaveReportButton({ report }: { report: any }) {
  // Dummy: No-op, just a button
  return (
    <button className="btn btn-outline w-full mb-3" disabled title="Sign in to save reports (coming soon)">
      Save this report
    </button>
  );
}

function RiskFlag({ result, askingPrice }: { result: any; askingPrice?: string }) {
  if (!result) return null;
  const avg = result.explanation?.[1]?.match(/\d[\d,]+/g)?.[0]?.replace(/,/g, '') || '0';
  const avgNum = Number(avg);
  const askNum = Number(askingPrice);
  let riskFlag = '';
  let riskType: 'bad' | 'good' | null = null;
  if (result.comps.length === 0) {
    riskFlag = 'No similar sales found. Please use extra caution and seek professional advice.';
    riskType = 'bad';
  } else if (askNum && avgNum && askNum > avgNum * 1.2) {
    riskFlag = 'Asking price is 20%+ above local average. This may indicate overpricing or a hot market.';
    riskType = 'bad';
  } else if (result.comps.length > 0) {
    riskFlag = 'No major risks detected. Comparable sales support this valuation.';
    riskType = 'good';
  }
  if (!riskType) return null;
  if (riskType === 'bad') {
    return (
      <div className="bg-red-100 border border-red-300 text-red-900 rounded-lg px-4 py-4 mb-4 flex items-start gap-3">
        <span className="text-3xl mt-1">⚠️</span>
        <div>
          <div className="font-bold text-lg mb-1">Risk Flag</div>
          <div className="text-base font-medium">{riskFlag}</div>
        </div>
      </div>
    );
  }
  if (riskType === 'good') {
    return (
      <div className="bg-green-100 border border-green-300 text-green-900 rounded-lg px-4 py-4 mb-4 flex items-start gap-3">
        <span className="text-3xl mt-1">✅</span>
        <div>
          <div className="font-bold text-lg mb-1">All Clear</div>
          <div className="text-base font-medium">{riskFlag}</div>
        </div>
      </div>
    );
  }
  return null;
}

function MortgageInsight({ price }: { price: number }) {
  // Dummy: 85% LTV, 15% deposit
  const ltv = 0.85;
  const maxLoan = Math.round(price * ltv);
  const deposit = price - maxLoan;
  return (
    <div className="mb-3">
      <div className="font-medium mb-1">Mortgage Insight</div>
      <div className="text-gray-700 text-sm">
        Max loan (85% LTV): <span className="font-semibold">£{maxLoan.toLocaleString()}</span><br />
        Required deposit: <span className="font-semibold">£{deposit.toLocaleString()}</span>
      </div>
    </div>
  );
}

function YieldPrediction({ postcode, price }: { postcode: string; price: number }) {
  // Dummy: Rent = £2000/mo in London, £1000 elsewhere
  const rent = postcode.startsWith('SW') ? 2000 : 1000;
  const annual = rent * 12;
  const yieldPct = price ? ((annual / price) * 100).toFixed(1) : '0';
  return (
    <div className="mb-3">
      <div className="font-medium mb-1">Estimated Rent Yield</div>
      <div className="text-gray-700 text-sm">
        Est. rent: <span className="font-semibold">£{rent.toLocaleString()}/mo</span> &bull; Gross yield: <span className="font-semibold">{yieldPct}%</span>
      </div>
    </div>
  );
}

// Helper to format date as DD/MM/YYYY
function formatDateDMY(dateStr: string) {
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  return `${day}/${month}/${year}`;
}

function NegotiationBriefPDF({ report }: { report: any }) {
  const [show, setShow] = useState(false);
  if (!report) return null;

  // Extract data
  const comps = report.comps || [];
  const valueRange = report.suggestedRange || [0, 0];
  const avg = report.explanation?.[1]?.match(/\d[\d,]+/g)?.[0] || '';
  const rent = comps.length && comps[0].address.startsWith('SW') ? 2000 : 1000;
  const annual = rent * 12;
  const yieldPct = valueRange[0] ? ((annual / valueRange[0]) * 100).toFixed(1) : '0';

  // Key bullet points
  const bullets = [
    avg ? `Recent sales in this postcode average £${avg}.` : '',
    `The suggested offer range is £${valueRange[0].toLocaleString()}–£${valueRange[1].toLocaleString()} based on local comps.`,
    `Estimated gross yield is ${yieldPct}% at this price (est. rent £${rent}/mo).`,
    `Comparable sales: ${comps.map((c: CompSale) => `${c.address} (£${c.price.toLocaleString()})`).join(', ')}`,
    `This offer is based on objective, recent market data.`,
  ].filter(Boolean);

  // PDF generation logic
  const handleDownloadPDF = async () => {
    const doc = new jsPDF();
    // Add logo (SVG or PNG from public/icon.svg)
    try {
      const img = new Image();
      img.src = '/icon.svg';
      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = reject;
      });
      doc.addImage(img, 'SVG', 80, 10, 50, 20); // Centered
    } catch {
      // fallback: no logo
    }
    doc.setFontSize(18);
    doc.text('Negotiation Brief', 105, 40, { align: 'center' });
    doc.setFontSize(12);
    doc.text('Comparable Sales', 14, 55);
    autoTable(doc, {
      startY: 58,
      head: [['Address', 'Price', 'Date']],
      body: comps.map((c: CompSale) => [c.address, `£${c.price.toLocaleString()}`, formatDateDMY(c.date)]),
      styles: { fontSize: 10 },
      headStyles: { fillColor: [58, 124, 165] },
    });
    let y = doc.lastAutoTable ? doc.lastAutoTable.finalY + 8 : 70;

    // --- Risk Flag Section ---
    let riskFlag = '';
    const avgNum = Number(avg.replace(/,/g, ''));
    const askNum = Number(report.askingPrice);
    if (comps.length === 0) {
      riskFlag = '🚨 No similar sales found';
    } else if (askNum && avgNum && askNum > avgNum * 1.2) {
      riskFlag = '🚨 Asking price is 20%+ above local average';
    }
    if (riskFlag) {
      doc.setFontSize(12);
      doc.setTextColor(200, 50, 50);
      doc.text('Risk Flag', 14, y);
      doc.setFontSize(11);
      doc.text(riskFlag, 14, y + 7);
      doc.setTextColor(0, 0, 0);
      y += 18;
    }

    doc.setFontSize(12);
    doc.text('Estimated Value Range', 14, y);
    doc.setFontSize(11);
    doc.text(`£${valueRange[0].toLocaleString()} – £${valueRange[1].toLocaleString()}`, 14, y + 7);
    y += 18;
    doc.setFontSize(12);
    doc.text('Yield Calculation', 14, y);
    doc.setFontSize(11);
    doc.text(`Est. rent: £${rent}/mo   Gross yield: ${yieldPct}%`, 14, y + 7);
    y += 18;
    doc.setFontSize(12);
    doc.text('Key Points for Estate Agents', 14, y);
    doc.setFontSize(11);
    bullets.forEach((b, i) => {
      doc.text(`• ${b}`, 16, y + 7 + i * 6);
    });
    // Disclaimer
    doc.setFontSize(9);
    doc.setTextColor(120);
    doc.text('This is a data-driven estimate. Always consult professionals before making property decisions.', 14, 285);
    doc.save('Negotiation_Brief.pdf');
  };

  return (
    <>
      <button
        className="btn btn-outline w-full mb-3"
        onClick={handleDownloadPDF}
      >
        Download Negotiation Brief (PDF)
      </button>
      {show && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
          <div className="bg-white rounded-xl shadow-lg max-w-lg w-full p-6 relative">
            <button className="absolute top-2 right-2 text-gray-400 hover:text-gray-700" onClick={() => setShow(false)}>&times;</button>
            <h3 className="text-lg font-bold mb-3">Negotiation Brief</h3>
            <div className="mb-3">
              <div className="font-medium mb-1">Comparable Sales</div>
              <ul className="list-disc pl-5 text-sm">
                {comps.map((c: CompSale, i: number) => (
                  <li key={i}>{c.address} — <span className="font-semibold">£{c.price.toLocaleString()}</span> <span className="text-gray-500">({c.date})</span></li>
                ))}
              </ul>
            </div>
            <div className="mb-3">
              <div className="font-medium mb-1">Estimated Value Range</div>
              <div className="text-sm">£{valueRange[0].toLocaleString()} – £{valueRange[1].toLocaleString()}</div>
            </div>
            <div className="mb-3">
              <div className="font-medium mb-1">Yield Calculation</div>
              <div className="text-sm">Est. rent: £{rent}/mo &bull; Gross yield: {yieldPct}%</div>
            </div>
            <div className="mb-3">
              <div className="font-medium mb-1">Key Points for Estate Agents</div>
              <ul className="list-disc pl-5 text-sm">
                {bullets.map((b, i) => <li key={i}>{b}</li>)}
              </ul>
            </div>
            <button className="btn btn-primary w-full mt-2" onClick={() => setShow(false)}>Close</button>
          </div>
        </div>
      )}
    </>
  );
}

function Disclaimer() {
  return (
    <div className="text-xs text-gray-500 mt-4">
      This is a data-driven estimate. Always consult professionals before making property decisions.
    </div>
  );
}

export default function WhatShouldIPayPage() {
  const [postcode, setPostcode] = useState('');
  const [houseNumber, setHouseNumber] = useState('');
  const [askingPrice, setAskingPrice] = useState<string>('');
  const [result, setResult] = useState<Result | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setResult(null);
    if (!postcode.trim() || !houseNumber.trim()) {
      setError('Please enter both postcode and house number.');
      return;
    }
    setLoading(true);
    setTimeout(() => {
      // Dummy logic: filter comps by postcode (simulate)
      const comps = DUMMY_COMPS.filter(c => c.address.includes(postcode.trim().toUpperCase()));
      const res = getSuggestedOffer(comps.length ? comps : DUMMY_COMPS, askingPrice ? Number(askingPrice) : undefined);
      setResult(res);
      setLoading(false);
    }, 700);
  };

  return (
    <div className="max-w-xl mx-auto py-12 px-4">
      <h1 className="text-3xl font-bold mb-6 text-center">What Should I Pay?</h1>
      <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow p-6 space-y-4 border border-gray-200">
        <div>
          <label className="block text-sm font-medium mb-1">Postcode <span className="text-red-500">*</span></label>
          <input
            type="text"
            className="input"
            value={postcode}
            onChange={e => setPostcode(e.target.value)}
            required
            placeholder="e.g. SW1A 1AA"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">House Number <span className="text-red-500">*</span></label>
          <input
            type="text"
            className="input"
            value={houseNumber}
            onChange={e => setHouseNumber(e.target.value)}
            required
            placeholder="e.g. 12"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Your Asking Price <span className="text-gray-400">(optional)</span></label>
          <input
            type="number"
            className="input"
            value={askingPrice}
            onChange={e => setAskingPrice(e.target.value)}
            placeholder="e.g. 550000"
            min={0}
          />
        </div>
        <button
          type="submit"
          className="btn btn-primary w-full mt-2"
          disabled={loading}
        >
          {loading ? 'Calculating...' : 'Get value'}
        </button>
        {error && <div className="text-red-600 text-sm mt-2">{error}</div>}
      </form>

      {result && (
        <div className="mt-8 bg-white rounded-xl shadow p-6 border border-gray-200">
          <h2 className="text-xl font-semibold mb-2 text-primary-700">Suggested Offer Range</h2>
          <div className="text-2xl font-bold text-green-700 mb-2">
            £{result.suggestedRange[0].toLocaleString()} &ndash; £{result.suggestedRange[1].toLocaleString()}
          </div>
          <div className="mb-4 text-gray-700">
            For: <span className="font-medium">{houseNumber} {postcode.toUpperCase()}</span>
            {askingPrice && (
              <>
                <br />Your asking price: <span className="font-semibold">£{Number(askingPrice).toLocaleString()}</span>
              </>
            )}
          </div>
          {result.alert && (
            <div className="bg-red-100 text-red-700 rounded p-3 mb-3 font-medium">
              {result.alert}
            </div>
          )}
          <div className="mb-2 font-medium">How we calculated this:</div>
          <ul className="list-disc pl-6 text-gray-700 space-y-1 mb-4">
            {result.explanation.map((ex, i) => (
              <li key={i}>{ex}</li>
            ))}
          </ul>
          <div className="mb-2 font-medium">Closest sales:</div>
          <ul className="list-disc pl-6 text-gray-700 space-y-1">
            {result.comps.map((c, i) => (
              <li key={i}>{c.address} — <span className="font-semibold">£{c.price.toLocaleString()}</span> <span className="text-gray-500">({c.date})</span></li>
            ))}
          </ul>
          <RiskFlag result={result} askingPrice={askingPrice} />
          <div className="mb-2 font-medium">Estimated Value Range</div>
          <div className="text-sm">£{result.suggestedRange[0].toLocaleString()} – £{result.suggestedRange[1].toLocaleString()}</div>
          <SaveReportButton report={result} />
          <MortgageInsight price={result.suggestedRange[0]} />
          <YieldPrediction postcode={postcode} price={result.suggestedRange[0]} />
          <NegotiationBriefPDF report={result} />
          <Disclaimer />
        </div>
      )}
    </div>
  );
} 