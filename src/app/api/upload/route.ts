import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { uploadToB2 } from '@/lib/backblaze';
import { removeBackground } from '@/lib/removebg';
import { v4 as uuidv4 } from 'uuid';

const DAILY_LIMIT = 10;

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const { count, error: countError } = await supabase
      .from('images')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .gte('created_at', today.toISOString());

    if (countError) {
      console.error('Count error:', countError);
    }

    const todayCount = count || 0;

    if (todayCount >= DAILY_LIMIT) {
      return NextResponse.json(
        {
          success: false,
          error: `Daily limit reached. You can process ${DAILY_LIMIT} images per day. Try again tomorrow.`,
          remaining: 0
        },
        { status: 429 }
      );
    }

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

    const imageId = uuidv4();
    const originalKey = `${user.id}/original/${imageId}.png`;
    const processedKey = `${user.id}/processed/${imageId}.png`;

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Store original file to B2
    await uploadToB2(originalKey, buffer, file.type);
    
    // Process image for background removal
    const processedBuffer = await removeBackground(buffer);
    const processedUrl = await uploadToB2(processedKey, processedBuffer, 'image/png');

    const { data: imageRecord, error: dbError } = await supabase
      .from('images')
      .insert({
        id: imageId,
        user_id: user.id,
        original_filename: file.name,
        storage_key: originalKey,
        processed_storage_key: processedKey,
        public_url: processedUrl,
        status: 'completed',
      })
      .select()
      .single();

    if (dbError) {
      console.error('Database error:', dbError);
      return NextResponse.json(
        { success: false, error: 'Failed to save image metadata' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      image: imageRecord,
      remaining: DAILY_LIMIT - todayCount - 1
    });

  } catch (error) {
    console.error('Upload error:', error);
    const message = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}
