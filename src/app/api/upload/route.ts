import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { v2 as cloudinary } from 'cloudinary';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';

export const runtime = 'nodejs';
export const maxDuration = 60;
cloudinary.config({ cloudinary_url: process.env.CLOUDINARY_URL });

function detectMime(buf: Buffer): string | null {
  if (buf.length < 12) return null;
  if (buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4e && buf[3] === 0x47) return 'image/png';
  if (buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return 'image/jpeg';
  if (buf[0] === 0x47 && buf[1] === 0x49 && buf[2] === 0x46) return 'image/gif';
  if (buf[0] === 0x52 && buf[1] === 0x49 && buf[2] === 0x46 && buf[3] === 0x46 && buf[8] === 0x57 && buf[9] === 0x45 && buf[10] === 0x42 && buf[11] === 0x50) return 'image/webp';
  if (buf[0] === 0x1a && buf[1] === 0x45 && buf[2] === 0xdf && buf[3] === 0xa3) return 'audio/webm';
  if (buf[0] === 0x4f && buf[1] === 0x67 && buf[2] === 0x67 && buf[3] === 0x53) return 'audio/ogg';
  if (buf[4] === 0x66 && buf[5] === 0x74 && buf[6] === 0x79 && buf[7] === 0x70) return 'audio/mp4';
  return null;
}
const ALLOWED = new Set(['image/png','image/jpeg','image/gif','image/webp','audio/webm','audio/ogg','audio/mp4']);

export async function POST(req: NextRequest) {
  const s = await getSession();
  if (!s) return NextResponse.json({ ok: false, error: 'Not signed in' }, { status: 401 });
  try {
    const fd = await req.formData();
    const file = fd.get('file') as File;
    if (!file) return NextResponse.json({ ok: false, error: 'No file' }, { status: 400 });
    if (file.size > 15 * 1024 * 1024) return NextResponse.json({ ok: false, error: 'File too large (max 15 MB)' }, { status: 400 });

    const buffer = Buffer.from(await file.arrayBuffer());
    const detected = detectMime(buffer);
    if (!detected || !ALLOWED.has(detected)) {
      return NextResponse.json({ ok: false, error: 'Unsupported file type.' }, { status: 400 });
    }
    const kind = detected.startsWith('audio/') ? 'voice' : 'image';

    if (process.env.CLOUDINARY_URL) {
      const result = await new Promise<any>((res, rej) => {
        const stream = cloudinary.uploader.upload_stream(
          { resource_type: 'auto', folder: 'strings' },
          (e, r) => e ? rej(e) : res(r)
        );
        stream.end(buffer);
      });
      return NextResponse.json({ ok: true, url: result.secure_url, kind });
    }
    const extMap: Record<string, string> = { 'image/png':'png','image/jpeg':'jpg','image/gif':'gif','image/webp':'webp','audio/webm':'webm','audio/ogg':'ogg','audio/mp4':'m4a' };
    const filename = Date.now() + '-' + Math.random().toString(36).slice(2, 8) + '.' + (extMap[detected] || 'bin');
    const dir = join(process.cwd(), 'public', 'uploads');
    await mkdir(dir, { recursive: true });
    await writeFile(join(dir, filename), buffer);
    return NextResponse.json({ ok: true, url: '/uploads/' + filename, kind });
  } catch (e: any) {
    console.error('[upload]', e);
    return NextResponse.json({ ok: false, error: 'Upload failed.' }, { status: 500 });
  }
}
