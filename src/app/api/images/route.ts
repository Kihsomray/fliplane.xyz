import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getSignedDownloadUrl } from '@/lib/backblaze';

const DAILY_LIMIT = 10;

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { data: images, error: dbError } = await supabase
      .from('images')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (dbError) {
      console.error('Database error:', dbError);
      return NextResponse.json(
        { success: false, error: 'Failed to fetch images' },
        { status: 500 }
      );
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const { count } = await supabase
      .from('images')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .gte('created_at', today.toISOString());

    const todayCount = count || 0;

    const imagesWithSignedUrls = await Promise.all(
      (images || []).map(async (image) => {
        if (image.processed_storage_key) {
          try {
            const signedUrl = await getSignedDownloadUrl(image.processed_storage_key, 3600);
            return { ...image, public_url: signedUrl };
          } catch (error) {
            console.error('Failed to generate signed URL:', error);
            return image;
          }
        }
        return image;
      })
    );

    return NextResponse.json({
      success: true,
      images: imagesWithSignedUrls,
      quota: {
        used: todayCount,
        limit: DAILY_LIMIT,
        remaining: Math.max(0, DAILY_LIMIT - todayCount)
      }
    });

  } catch (error) {
    console.error('Fetch images error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
