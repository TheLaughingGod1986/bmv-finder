import { NextResponse } from 'next/server';
import { exec } from 'child_process';
import path from 'path';
import { NextRequest } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  // Verify the request is from Vercel Cron
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    console.error('Unauthorized access attempt to cron endpoint');
    return NextResponse.json(
      { error: 'Unauthorized' }, 
      { status: 401 }
    );
  }

  try {
    console.log('Starting land registry update...');
    
    // Run the update script
    const scriptPath = path.join(process.cwd(), 'scripts/update-land-registry.ts');
    
    interface ScriptResult {
      success: boolean;
      message: string;
      error?: string;
      stats?: any;
      output?: string;
    }
    
    const result = await new Promise<ScriptResult>((resolve) => {
      exec(
        `npx tsx ${scriptPath}`,
        { maxBuffer: 1024 * 1024 * 5 }, // 5MB buffer
        (error, stdout, stderr) => {
          if (stdout) console.log('Script output:', stdout);
          if (stderr) console.error('Script errors:', stderr);
          
          if (error) {
            console.error('Error executing script:', error);
            return resolve({
              success: false,
              message: 'Script execution failed',
              error: stderr || error.message
            });
          }
          
          // Try to parse the last line of output as JSON
          try {
            const lines = stdout.trim().split('\n');
            const lastLine = lines[lines.length - 1];
            const jsonResult = JSON.parse(lastLine);
            resolve(jsonResult);
          } catch (e) {
            // If we can't parse JSON, return the text output
            resolve({
              success: true,
              message: 'Update completed (no structured output)',
              output: stdout
            });
          }
        }
      );
    });

    if (result.success) {
      return NextResponse.json(result);
    } else {
      return NextResponse.json(
        { 
          success: false,
          message: result.message,
          error: result.error
        },
        { status: 500 }
      );
    }
  } catch (error: any) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Cron job failed:', errorMessage);
    return NextResponse.json(
      { 
        success: false,
        error: 'Cron job failed', 
        details: errorMessage,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}
