import { NextRequest, NextResponse } from 'next/server';
import { dataExportService } from '@/lib/dataExportService';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, data, config } = body;

    if (!userId || !data) {
      return NextResponse.json(
        { error: 'Missing required fields: userId and data' },
        { status: 400 }
      );
    }

    const jobId = await dataExportService.createExportJob(userId, data, config);

    return NextResponse.json({
      success: true,
      jobId,
      message: 'Export job created successfully'
    });

  } catch (error: any) {
    console.error('Error creating export job:', error);
    return NextResponse.json(
      { error: 'Failed to create export job', details: error.message },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    success: true,
    supportedFormats: ['csv', 'xlsx', 'json', 'xml', 'pdf'],
    message: 'Data export API endpoint'
  });
}
