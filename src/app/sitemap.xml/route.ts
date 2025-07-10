import { NextResponse } from 'next/server';

export async function GET() {
  // Static/user-facing pages only
  const staticPages = [
    '',
    'pricing',
    'account',
    'account/upgrade',
    'hpi-dashboard',
    'what-should-i-pay',
    'deal-calculator',
    'portfolio-tracker',
    'saved-searches',
    'privacy',
    'terms',
  ];

  const siteUrl = 'https://bmv-finder.vercel.app';

  const urls = staticPages.map((page) => `${siteUrl}/${page}`);

  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  ${urls
    .map(
      (url) => `<url><loc>${url.replace(/\/$/, '')}</loc></url>`
    )
    .join('\n  ')}
</urlset>`;

  return new NextResponse(sitemap, {
    status: 200,
    headers: {
      'Content-Type': 'application/xml',
    },
  });
} 