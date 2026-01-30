import { NextRequest, NextResponse } from 'next/server';
import { removeBackground } from '@/lib/removebg';
import { uploadToB2, getSignedDownloadUrl } from '@/lib/backblaze';
import { checkDemoRateLimit } from '@/lib/ratelimit';
import { v4 as uuidv4 } from 'uuid';

export async function POST(request: NextRequest) {
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0] ||
             request.headers.get('x-real-ip') ||
             'unknown';

  const rateLimit = checkDemoRateLimit(ip);

  if (!rateLimit.allowed) {
    return NextResponse.json(
      {
        success: false,
        error: 'Rate limit exceeded. Please try again later.',
        resetIn: Math.ceil(rateLimit.resetIn / 1000 / 60)
      },
      {
        status: 429,
        headers: {
          'X-RateLimit-Remaining': '0',
          'X-RateLimit-Reset': String(Math.ceil(rateLimit.resetIn / 1000))
        }
      }
    );
  }

  try {
    const formData = await request.formData();
    const file = formData.get('image') as File | null;

    if (!file) {
      return NextResponse.json(
        { success: false, error: 'No image file provided' },
        { status: 400 }
      );
    }

    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { success: false, error: 'Invalid file type. Allowed: JPEG, PNG, WebP, GIF' },
        { status: 400 }
      );
    }

    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      return NextResponse.json(
        { success: false, error: 'File size exceeds 10MB limit' },
        { status: 400 }
      );
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const processedBuffer = await removeBackground(buffer);

    const imageId = uuidv4();
    const storageKey = `demo/${imageId}.png`;

    const publicUrl = await uploadToB2(storageKey, processedBuffer, 'image/png');

    // For demo (anonymous) uploads, the bucket might be private.
    // We should generate a signed URL for display, similar to how we fixed the user upload.
    
    let displayUrl = publicUrl;
    try {
        displayUrl = await getSignedDownloadUrl(storageKey, 3600);
    } catch (e) {
        console.warn('Failed to generate signed URL for demo display, using public URL');
    }

    return NextResponse.json(
      {
        success: true,
        imageId,
        url: displayUrl, // Use signed URL for immediate display
        storageKey,
      },
      {
        headers: {
          'X-RateLimit-Remaining': String(rateLimit.remaining),
        }
      }
    );

  } catch (error) {
    console.error('Demo processing error:', error);
    const message = error instanceof Error ? error.message : 'Failed to process image';
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}
