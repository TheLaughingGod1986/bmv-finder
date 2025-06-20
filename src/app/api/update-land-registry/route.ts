import { NextRequest, NextResponse } from 'next/server';
import { spawn } from 'child_process';

export async function POST(request: NextRequest): Promise<Response> {
  return new Promise<Response>((resolve) => {
    const proc = spawn('node', ['import_land_registry.js'], { cwd: process.cwd() });
    let errorMsg = '';
    let outputMsg = '';
    
    proc.stderr.on('data', (data) => {
      errorMsg += data.toString();
    });
    
    proc.stdout.on('data', (data) => {
      outputMsg += data.toString();
    });
    
    proc.on('close', (code) => {
      if (code === 0) {
        resolve(NextResponse.json({ 
          success: true, 
          message: 'Land Registry data updated successfully!',
          output: outputMsg,
          timestamp: new Date().toISOString()
        }));
      } else {
        resolve(NextResponse.json({ 
          success: false, 
          error: errorMsg || 'Failed to update data.',
          output: outputMsg,
          exitCode: code,
          timestamp: new Date().toISOString()
        }, { status: 500 }));
      }
    });
    
    proc.on('error', (err) => {
      resolve(NextResponse.json({ 
        success: false, 
        error: `Process error: ${err.message}`,
        timestamp: new Date().toISOString()
      }, { status: 500 }));
    });
  });
}

// GET endpoint for health checks and manual triggers
export async function GET() {
  return NextResponse.json({ 
    status: 'ok',
    message: 'Land Registry update endpoint is running',
    timestamp: new Date().toISOString()
  });
} 