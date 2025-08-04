import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

// Force dynamic rendering to prevent build-time issues
export const dynamic = 'force-dynamic';

// Initialize Stripe client only when environment variable is available
const getStripe = () => {
  if (!process.env.STRIPE_SECRET_KEY) {
    throw new Error('STRIPE_SECRET_KEY is not set');
  }
  return new Stripe(process.env.STRIPE_SECRET_KEY, {
    apiVersion: '2025-07-30.basil',
  });
};

// Initialize Supabase admin client
const getSupabaseAdmin = () => {
  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error('SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY is not set');
  }
  return createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
};

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const sessionId = searchParams.get('session_id');

    if (!sessionId) {
      return NextResponse.json({ error: 'Missing session_id' }, { status: 400 });
    }

    // Verify the payment was successful
    const stripe = getStripe();
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    
    if (session.payment_status !== 'paid') {
      return NextResponse.json({ error: 'Payment not completed' }, { status: 400 });
    }

    const propertyData = session.metadata?.propertyData ? JSON.parse(session.metadata.propertyData) : null;
    if (!propertyData) {
      return NextResponse.json({ error: 'No property data found' }, { status: 400 });
    }

    // Generate HTML content for the report
    const htmlContent = generatePDFContent(propertyData);
    
    // Return the HTML content that can be converted to PDF on the client side
    return new NextResponse(htmlContent, {
      headers: {
        'Content-Type': 'text/html',
        'Content-Disposition': `attachment; filename="property-valuation-report-${Date.now()}.html"`,
        'Cache-Control': 'no-cache'
      }
    });

  } catch (error: any) {
    console.error('Error generating PDF report:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { userId, propertyData, isEliteMember } = body;

    if (!userId || !propertyData) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // For Elite members, verify their tier
    if (isEliteMember) {
      try {
        const supabaseAdmin = getSupabaseAdmin();
        const { data: profile, error } = await supabaseAdmin
          .from('profiles')
          .select('tier')
          .eq('id', userId)
          .single();
        
        if (error || !profile || profile.tier !== 'elite') {
          return NextResponse.json({ error: 'Elite membership verification failed' }, { status: 403 });
        }
        
      } catch (error) {
        console.error('Error verifying Elite membership:', error);
        return NextResponse.json({ error: 'Failed to verify Elite membership' }, { status: 500 });
      }
    }

    // Generate HTML content for the report
    const htmlContent = generatePDFContent(propertyData);
    
    // Return the HTML content that can be converted to PDF on the client side
    return new NextResponse(htmlContent, {
      headers: {
        'Content-Type': 'text/html',
        'Content-Disposition': `attachment; filename="property-valuation-report-${Date.now()}.html"`,
        'Cache-Control': 'no-cache'
      }
    });

  } catch (error: any) {
    console.error('Error generating PDF report:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

function generatePDFContent(data: any): string {
  const {
    avgValue,
    suggestedOffer,
    offerMargin,
    comps,
    searchCriteria,
    confidence,
    latestYoY,
    marketInsights,
    priceRange
  } = data;

  const totalComps = comps.length;
  const avgSimilarity = comps.reduce((sum: number, comp: any) => sum + (comp.similarityScore || 0), 0) / totalComps;
  const highSimilarityComps = comps.filter((comp: any) => (comp.similarityScore || 0) >= 80).length;

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>Professional Property Valuation Report</title>
      <style>
        body {
          font-family: 'Arial', sans-serif;
          line-height: 1.6;
          color: #333;
          max-width: 800px;
          margin: 0 auto;
          padding: 20px;
        }
        .header {
          text-align: center;
          border-bottom: 3px solid #3A7CA5;
          padding-bottom: 20px;
          margin-bottom: 30px;
        }
        .header h1 {
          color: #3A7CA5;
          margin: 0;
          font-size: 28px;
        }
        .header p {
          color: #666;
          margin: 5px 0;
        }
        .summary-box {
          background: #f8f9fa;
          border: 2px solid #3A7CA5;
          border-radius: 8px;
          padding: 20px;
          margin: 20px 0;
          text-align: center;
        }
        .summary-box h2 {
          color: #3A7CA5;
          margin: 0 0 15px 0;
          font-size: 24px;
        }
        .key-metric {
          display: inline-block;
          margin: 10px 20px;
          text-align: center;
        }
        .key-metric .value {
          font-size: 32px;
          font-weight: bold;
          color: #5DA271;
        }
        .key-metric .label {
          font-size: 14px;
          color: #666;
          margin-top: 5px;
        }
        .section {
          margin: 30px 0;
          page-break-inside: avoid;
        }
        .section h3 {
          color: #3A7CA5;
          border-bottom: 2px solid #E5E5E5;
          padding-bottom: 10px;
          margin-bottom: 20px;
        }
        .methodology {
          background: #f8f9fa;
          padding: 20px;
          border-radius: 8px;
          margin: 20px 0;
        }
        .methodology h4 {
          color: #3A7CA5;
          margin-top: 0;
        }
        .step {
          margin: 15px 0;
          padding-left: 20px;
        }
        .step-number {
          background: #3A7CA5;
          color: white;
          border-radius: 50%;
          width: 25px;
          height: 25px;
          display: inline-block;
          text-align: center;
          line-height: 25px;
          margin-right: 10px;
          font-weight: bold;
        }
        .comparable-table {
          width: 100%;
          border-collapse: collapse;
          margin: 20px 0;
        }
        .comparable-table th,
        .comparable-table td {
          border: 1px solid #ddd;
          padding: 12px;
          text-align: left;
        }
        .comparable-table th {
          background: #3A7CA5;
          color: white;
          font-weight: bold;
        }
        .comparable-table tr:nth-child(even) {
          background: #f9f9f9;
        }
        .confidence-indicator {
          display: inline-block;
          padding: 8px 16px;
          border-radius: 20px;
          font-weight: bold;
          color: white;
        }
        .confidence-high { background: #5DA271; }
        .confidence-medium { background: #D4AF37; }
        .confidence-low { background: #C0C0C0; }
        .market-insights {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 20px;
          margin: 20px 0;
        }
        .insight-card {
          background: #f8f9fa;
          padding: 15px;
          border-radius: 8px;
          border-left: 4px solid #3A7CA5;
        }
        .insight-card h4 {
          margin: 0 0 10px 0;
          color: #3A7CA5;
        }
        .insight-value {
          font-size: 24px;
          font-weight: bold;
          color: #5DA271;
        }
        .footer {
          margin-top: 40px;
          padding-top: 20px;
          border-top: 2px solid #E5E5E5;
          text-align: center;
          color: #666;
          font-size: 12px;
        }
        .disclaimer {
          background: #fff3cd;
          border: 1px solid #ffeaa7;
          border-radius: 8px;
          padding: 15px;
          margin: 20px 0;
          font-size: 14px;
        }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>Professional Property Valuation Report</h1>
        <p>Generated on ${new Date().toLocaleDateString('en-GB')}</p>
        <p>Property Analysis for ${searchCriteria.postcode}</p>
      </div>

      <div class="summary-box">
        <h2>Valuation Summary</h2>
        <div class="key-metric">
          <div class="value">£${suggestedOffer.toLocaleString()}</div>
          <div class="label">Suggested Offer</div>
        </div>
        <div class="key-metric">
          <div class="value">£${avgValue.toLocaleString()}</div>
          <div class="label">Market Value</div>
        </div>
        <div class="key-metric">
          <div class="value">${(offerMargin * 100).toFixed(0)}%</div>
          <div class="label">Investor Discount</div>
        </div>
        <div class="key-metric">
          <div class="value">${confidence.score}%</div>
          <div class="label">Confidence Level</div>
        </div>
      </div>

      <div class="section">
        <h3>Valuation Methodology</h3>
        <div class="methodology">
          <h4>Our Professional Approach</h4>
          <div class="step">
            <span class="step-number">1</span>
            <strong>Comparable Property Analysis:</strong> We identified ${totalComps} properties in ${searchCriteria.postcode} that match your criteria, with an average similarity score of ${Math.round(avgSimilarity)}%.
          </div>
          <div class="step">
            <span class="step-number">2</span>
            <strong>Market Inflation Adjustment:</strong> All sale prices were adjusted for market changes using official House Price Index (HPI) data. Current market growth: ${latestYoY ? (latestYoY * 100).toFixed(1) : 'N/A'}% year-over-year.
          </div>
          <div class="step">
            <span class="step-number">3</span>
            <strong>Average Market Value Calculation:</strong> The average of all inflation-adjusted comparable sales is £${avgValue.toLocaleString()}.
          </div>
          <div class="step">
            <span class="step-number">4</span>
            <strong>Investor Discount Application:</strong> Applied a ${(offerMargin * 100).toFixed(0)}% discount to account for investor margins and negotiation room.
          </div>
        </div>
      </div>

      <div class="section">
        <h3>Data Quality & Confidence</h3>
        <p><strong>Confidence Level:</strong> <span class="confidence-indicator confidence-${confidence.rating}">${confidence.score}% - ${confidence.rating} confidence</span></p>
        <p><strong>High-Quality Matches:</strong> ${highSimilarityComps} properties with 80%+ similarity</p>
        <p><strong>Location Match:</strong> ${Math.round(avgSimilarity)}% average similarity score</p>
        
        <div class="disclaimer">
          <strong>Confidence Assessment:</strong> ${confidence.reason}
          ${totalComps < 3 ? '<br><br><strong>Note:</strong> We found fewer than 3 comparable sales. Consider expanding your search area or relaxing some criteria for more accurate valuations.' : ''}
        </div>
      </div>

      <div class="section">
        <h3>Comparable Sales Analysis</h3>
        <table class="comparable-table">
          <thead>
            <tr>
              <th>Similarity</th>
              <th>Date</th>
              <th>Address</th>
              <th>Bedrooms</th>
              <th>Size (m²)</th>
              <th>Original Price</th>
              <th>HPI-Adjusted</th>
            </tr>
          </thead>
          <tbody>
            ${comps.map((comp: any) => `
              <tr>
                <td>${comp.similarityScore}%</td>
                <td>${comp.date}</td>
                <td>${comp.full_address}</td>
                <td>${comp.epc_bedrooms || 'N/A'}</td>
                <td>${comp.epc_size || 'N/A'}</td>
                <td>£${comp.price.toLocaleString()}</td>
                <td>£${comp.hpiAdjustedPrice ? comp.hpiAdjustedPrice.toLocaleString() : comp.price.toLocaleString()}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>

      <div class="section">
        <h3>Market Insights</h3>
        <div class="market-insights">
          <div class="insight-card">
            <h4>Price Stability</h4>
            <div class="insight-value">${marketInsights?.priceStability || 'N/A'}%</div>
            <div class="label">${marketInsights?.priceStabilityLabel || 'Variation'}</div>
          </div>
          <div class="insight-card">
            <h4>Recent Sales</h4>
            <div class="insight-value">${marketInsights?.recentSales || 'N/A'}</div>
            <div class="label">Last 24 months</div>
          </div>
          <div class="insight-card">
            <h4>Data Quality</h4>
            <div class="insight-value">${marketInsights?.dataQuality || 'N/A'}</div>
            <div class="label">High-quality matches</div>
          </div>
          <div class="insight-card">
            <h4>Market Growth</h4>
            <div class="insight-value">${marketInsights?.marketGrowth || 'N/A'}%</div>
            <div class="label">24 months</div>
          </div>
        </div>
      </div>

      <div class="section">
        <h3>Price Range Analysis</h3>
        <p><strong>Lowest Comparable:</strong> £${priceRange?.lowest?.toLocaleString() || 'N/A'}</p>
        <p><strong>Median Price:</strong> £${priceRange?.median?.toLocaleString() || 'N/A'}</p>
        <p><strong>Highest Comparable:</strong> £${priceRange?.highest?.toLocaleString() || 'N/A'}</p>
      </div>

      <div class="section">
        <h3>Negotiation Strategy</h3>
        <p>Based on our analysis, we recommend starting negotiations at <strong>£${suggestedOffer.toLocaleString()}</strong>. This represents a ${((1 - offerMargin) * 100).toFixed(0)}% discount from the estimated market value, providing room for negotiation while maintaining a strong investment position.</p>
        
        <p><strong>Key Talking Points:</strong></p>
        <ul>
          <li>Our valuation is based on ${totalComps} comparable properties in the same area</li>
          <li>All prices have been adjusted for current market conditions</li>
          <li>The suggested offer accounts for typical investor margins</li>
          <li>Market growth in this area is ${latestYoY ? (latestYoY * 100).toFixed(1) : 'N/A'}% year-over-year</li>
        </ul>
      </div>

      <div class="footer">
        <p>This report was generated by UK Property Insights using official Land Registry data, EPC certificates, and House Price Index information.</p>
        <p>For professional advice, please consult with a qualified property surveyor or financial advisor.</p>
      </div>
    </body>
    </html>
  `;
} 