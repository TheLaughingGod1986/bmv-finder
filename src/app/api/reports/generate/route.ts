import { NextRequest, NextResponse } from 'next/server';
import { reportGenerator } from '@/lib/reportGenerator';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { type, data, config } = body;

    if (!type || !data) {
      return NextResponse.json(
        { error: 'Missing required fields: type and data' },
        { status: 400 }
      );
    }

    let reportBlob: Blob;

    switch (type) {
      case 'property':
        reportBlob = await reportGenerator.generatePropertyReport(data, config);
        break;
      case 'portfolio':
        reportBlob = await reportGenerator.generatePortfolioReport(data, config);
        break;
      case 'market':
        reportBlob = await reportGenerator.generateMarketReport(data, config);
        break;
      default:
        return NextResponse.json(
          { error: `Unsupported report type: ${type}` },
          { status: 400 }
        );
    }

    // Convert blob to base64 for response
    const arrayBuffer = await reportBlob.arrayBuffer();
    const base64 = Buffer.from(arrayBuffer).toString('base64');

    return NextResponse.json({
      success: true,
      report: {
        type,
        data: base64,
        mimeType: 'application/pdf',
        size: reportBlob.size,
        filename: `${type}_report_${new Date().toISOString().split('T')[0]}.pdf`
      }
    });

  } catch (error: any) {
    console.error('Error generating report:', error);
    return NextResponse.json(
      { error: 'Failed to generate report', details: error.message },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    success: true,
    supportedTypes: ['property', 'portfolio', 'market'],
    formats: ['pdf'],
    message: 'Report generation API endpoint'
  });
}
