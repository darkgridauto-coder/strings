import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getSession } from '@/lib/auth';

export async function GET() {
  const s = await getSession();
  if (!s) return NextResponse.json({ ok: false }, { status: 401 });
  const user = await prisma.user.findUnique({
    where: { id: s.userId },
    select: {
      id: true, handle: true, displayName: true, email: true, bio: true,
      avatar: true, cover: true, isPrivate: true, createdAt: true,
      emailVerified: true, twoFactorEnabled: true, verifiedTier: true, staffRole: true,
      settings: true,
    },
  });
  if (!user) return NextResponse.json({ ok: false }, { status: 404 });
  
  let parsedSettings = {};
  try { parsedSettings = JSON.parse(user.settings || '{}'); } catch {}
  
  return NextResponse.json({ 
    ok: true, 
    user: { ...user, settings: parsedSettings } 
  });
}

export async function PATCH(req: NextRequest) {
  const s = await getSession();
  if (!s) return NextResponse.json({ ok: false }, { status: 401 });
  
  const body = await req.json();
  const updates: any = {};

  if (body.displayName) updates.displayName = body.displayName;
  if (body.bio !== undefined) updates.bio = body.bio;
  if (body.avatar !== undefined) updates.avatar = body.avatar;
  if (body.cover !== undefined) updates.cover = body.cover;
  if (typeof body.isPrivate === 'boolean') updates.isPrivate = body.isPrivate;
  
  // Handle Settings JSON
  if (body.settings) {
    const current = await prisma.user.findUnique({ where: { id: s.userId }, select: { settings: true } });
    let currentSettings = {};
    try { currentSettings = JSON.parse(current?.settings || '{}'); } catch {}
    
    const newSettings = { ...currentSettings, ...body.settings };
    updates.settings = JSON.stringify(newSettings);
  }

  // Handle Email change
  if (body.email && typeof body.email === 'string') {
    const newEmail = body.email.trim().toLowerCase();
    if (!/^\S+@\S+\.\S+$/.test(newEmail)) return NextResponse.json({ ok: false, error: 'Enter a valid email address.' }, { status: 400 });
    const existing = await prisma.user.findUnique({ where: { email: newEmail } });
    if (existing && existing.id !== s.userId) return NextResponse.json({ ok: false, error: 'That email is already in use.' }, { status: 409 });
    
    updates.email = newEmail;
    const currentUser = await prisma.user.findUnique({ where: { id: s.userId }, select: { email: true } });
    if (currentUser?.email !== newEmail) {
      updates.emailVerified = false;
      updates.emailVerifyHash = '';
      updates.emailVerifyExp = null;
    }
  }

  if (Object.keys(updates).length === 0) return NextResponse.json({ ok: false, error: 'Nothing to update' }, { status: 400 });

  const user = await prisma.user.update({ where: { id: s.userId }, data: updates });
  
  let parsedSettings = {};
  try { parsedSettings = JSON.parse(user.settings || '{}'); } catch {}

  return NextResponse.json({ ok: true, user: { ...user, settings: parsedSettings } });
}
