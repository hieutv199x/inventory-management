// Delete this entire file - remove the favicon API route
import fs from 'fs';
import path from 'path';

export async function GET() {
  try {
    const faviconPath = path.join(process.cwd(), 'public', 'favicon.ico');
    const favicon = fs.readFileSync(faviconPath);
    const faviconUint8 = new Uint8Array(favicon);

    return new Response(faviconUint8, {
      headers: {
        'Content-Type': 'image/x-icon',
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    });
  } catch (error) {
    return new Response('Favicon not found', { status: 404 });
  }
}
