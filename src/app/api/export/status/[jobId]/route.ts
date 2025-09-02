import { NextRequest, NextResponse } from 'next/server';
import { dataExportService } from '@/lib/dataExportService';

export async function GET(
  request: NextRequest,
  { params }: { params: { jobId: string } }
) {
  try {
    const { jobId } = params;

    if (!jobId) {
      return NextResponse.json(
        { error: 'Job ID is required' },
        { status: 400 }
      );
    }

    const job = dataExportService.getJobStatus(jobId);

    if (!job) {
      return NextResponse.json(
        { error: 'Export job not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      job: {
        id: job.id,
        status: job.status,
        progress: job.progress,
        createdAt: job.createdAt,
        completedAt: job.completedAt,
        error: job.error,
        downloadUrl: job.downloadUrl,
        expiresAt: job.expiresAt
      }
    });

  } catch (error: any) {
    console.error('Error getting export job status:', error);
    return NextResponse.json(
      { error: 'Failed to get export job status', details: error.message },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { jobId: string } }
) {
  try {
    const { jobId } = params;

    if (!jobId) {
      return NextResponse.json(
        { error: 'Job ID is required' },
        { status: 400 }
      );
    }

    const cancelled = dataExportService.cancelJob(jobId);

    if (!cancelled) {
      return NextResponse.json(
        { error: 'Job could not be cancelled' },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Export job cancelled successfully'
    });

  } catch (error: any) {
    console.error('Error cancelling export job:', error);
    return NextResponse.json(
      { error: 'Failed to cancel export job', details: error.message },
      { status: 500 }
    );
  }
}
