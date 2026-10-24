import { Metadata } from 'next';
import { prisma } from '@/lib/db';
import ProfileClientPage from './ProfileClientPage';

// 1. Dynamic Metadata for the Profile
export async function generateMetadata({ params }: { params: { h: string } }): Promise<Metadata> {
  const user = await prisma.user.findUnique({
    where: { handle: params.h },
    select: { displayName: true, bio: true, avatar: true, isPrivate: true },
  });

  if (!user) return { title: 'Profile Not Found' };

  const title = `${user.displayName} (@${params.h})`;
  const description = user.isPrivate ? `This account is private. Follow @${params.h} on Strings.` : (user.bio || `View @${params.h}'s profile on Strings.`);

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: 'profile',
      images: user.avatar ? [{ url: user.avatar }] : [],
    },
    twitter: {
      card: 'summary',
      title,
      description,
      images: user.avatar ? [user.avatar] : [],
    },
  };
}

// 2. The Server Page
export default function Page({ params }: { params: { h: string } }) {
  return <ProfileClientPage params={params} />;
}
