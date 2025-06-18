import { NextRequest, NextResponse } from 'next/server';
import { spawn } from 'child_process';

export async function POST(request: NextRequest) {
  return new Promise((resolve) => {
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
          output: outputMsg 
        }));
      } else {
        resolve(NextResponse.json({ 
          success: false, 
          error: errorMsg || 'Failed to update data.',
          output: outputMsg,
          exitCode: code 
        }, { status: 500 }));
      }
    });
    
    proc.on('error', (err) => {
      resolve(NextResponse.json({ 
        success: false, 
        error: `Process error: ${err.message}` 
      }, { status: 500 }));
    });
  });
} 