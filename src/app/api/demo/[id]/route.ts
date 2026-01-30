import { NextRequest, NextResponse } from 'next/server';
import { deleteFromB2 } from '@/lib/backblaze';

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    if (!id || !/^[0-9a-f-]{36}$/i.test(id)) {
      return NextResponse.json(
        { success: false, error: 'Invalid image ID' },
        { status: 400 }
      );
    }

    const storageKey = `demo/${id}.png`;

    try {
      await deleteFromB2(storageKey);
    } catch (b2Error) {
      console.error('B2 deletion error:', b2Error);
      return NextResponse.json(
        { success: false, error: 'Image not found or already deleted' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Demo delete error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
