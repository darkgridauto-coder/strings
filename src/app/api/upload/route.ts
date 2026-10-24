import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { v2 as cloudinary } from 'cloudinary';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';

export const runtime = 'nodejs';
export const maxDuration = 60;

// Configure Cloudinary
cloudinary.config({
  cloudinary_url: process.env.CLOUDINARY_URL,
});

export async function POST(req: NextRequest) {
  const session = getSession();
  if (!session) return NextResponse.json({ ok: false, error: 'Not signed in' }, { status: 401 });

  try {
    const formData = await req.formData();
    const file = formData.get('file') as File;
    if (!file) return NextResponse.json({ ok: false, error: 'No file provided' }, { status: 400 });

    const allowed = /^(image\/(png|jpe?g|gif|webp)|audio\/(webm|mpeg|mp4|ogg))$/;
    if (!allowed.test(file.type)) {
      return NextResponse.json({ ok: false, error: 'Unsupported file type.' }, { status: 400 });
    }
    
    const maxBytes = 15 * 1024 * 1024;
    if (file.size > maxBytes) {
      return NextResponse.json({ ok: false, error: 'File too large (max 15 MB)' }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // If Cloudinary is configured, upload to the cloud
    if (process.env.CLOUDINARY_URL) {
      const uploadResult = await new Promise<any>((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
          { resource_type: 'auto', folder: 'strings' },
          (error, result) => {
            if (error) reject(error);
            else resolve(result);
          }
        );
        uploadStream.end(buffer);
      });

      return NextResponse.json({ 
        ok: true, 
        url: uploadResult.secure_url, 
        kind: file.type.startsWith('audio/') ? 'voice' : 'image' 
      });
    } 
    
    // Fallback to local storage (for offline local dev)
    const ext = (file.name.split('.').pop() || 'bin').toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 6);
    const filename = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext || 'bin'}`;
    const uploadDir = join(process.cwd(), 'public', 'uploads');
    
    await mkdir(uploadDir, { recursive: true });
    await writeFile(join(uploadDir, filename), buffer);
    
    return NextResponse.json({ 
      ok: true, 
      url: `/uploads/${filename}`, 
      kind: file.type.startsWith('audio/') ? 'voice' : 'image' 
    });
  } catch (e: any) {
    console.error('[upload]', e);
    return NextResponse.json({ ok: false, error: 'Upload failed.' }, { status: 500 });
  }
}
