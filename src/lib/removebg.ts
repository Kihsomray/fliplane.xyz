import sharp from 'sharp';

export async function removeBackground(imageBuffer: Buffer): Promise<Buffer> {
  const apiKey = process.env.REMOVE_BG_API_KEY;

  if (!apiKey) {
    throw new Error('REMOVE_BG_API_KEY is not configured');
  }

  const formData = new FormData();
  formData.append('image_file', new Blob([imageBuffer]), 'image.png');
  formData.append('size', 'auto');

  const response = await fetch('https://api.remove.bg/v1.0/removebg', {
    method: 'POST',
    headers: {
      'X-Api-Key': apiKey,
    },
    body: formData,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    console.error('Remove.bg error:', errorData);
    throw new Error(errorData.errors?.[0]?.title || 'Background removal failed');
  }

  const arrayBuffer = await response.arrayBuffer();
  const bgRemovedBuffer = Buffer.from(arrayBuffer);

  // Apply horizontal flip after background removal
  const flippedBuffer = await sharp(bgRemovedBuffer)
    .flop()
    .png()
    .toBuffer();

  return flippedBuffer;
}
