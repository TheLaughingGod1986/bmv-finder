import { NextRequest, NextResponse } from 'next/server';
import { readFile } from 'fs/promises';
import { join } from 'path';

export async function GET(
  request: NextRequest,
  { params }: { params: { filename: string } }
) {
  try {
    const filename = params.filename;
    
    // Security: Only allow markdown files
    if (!filename.endsWith('.md')) {
      return NextResponse.json({ error: 'Invalid file type' }, { status: 400 });
    }
    
    // Construct path to the markdown file in the project root
    const filePath = join(process.cwd(), filename);
    
    // Read the markdown file
    const content = await readFile(filePath, 'utf-8');
    
    // Return the content with markdown content type
    return new NextResponse(content, {
      headers: {
        'Content-Type': 'text/markdown',
        'Cache-Control': 'public, max-age=3600', // Cache for 1 hour
      },
    });
  } catch (error) {
    console.error('Error reading markdown file:', error);
    return NextResponse.json(
      { error: 'File not found or could not be read' },
      { status: 404 }
    );
  }
} 