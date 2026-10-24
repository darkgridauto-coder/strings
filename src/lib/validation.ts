import { z } from 'zod';

export const handleRegex = /^[a-z0-9_]{3,20}$/;

export const registerSchema = z.object({
  displayName: z.string().min(1, 'Display name is required').max(60),
  handle: z.string().regex(handleRegex, 'Username must be 3-20 lowercase letters, numbers, or underscores'),
  email: z.string().email('Enter a valid email'),
  password: z.string().min(8, 'Password must be at least 8 characters').max(200),
});

export const loginSchema = z.object({
  email: z.string().min(1, 'Email is required'),
  password: z.string().min(1, 'Password is required'),
});

export const postSchema = z.object({
  body: z.string().trim().max(500, 'Posts are limited to 500 characters').default(''),
  media: z.string().default(''),
  mediaUrls: z.array(z.string()).max(4).optional(),
  quoteOfId: z.string().cuid().optional().nullable(),
  quoteText: z.string().max(500).optional().default(''),
  poll: z.object({
    question: z.string().trim().min(1).max(120),
    options: z.array(z.string().trim().min(1).max(80)).min(2).max(4),
    closesAt: z.string().optional(),
  }).optional().nullable(),
  isDraft: z.boolean().optional().default(false),
}).refine(
  (d) => d.body.trim().length > 0 || (d.mediaUrls && d.mediaUrls.length > 0) || !!d.quoteOfId || !!d.poll,
  { message: 'Write something, add media, quote a post, or add a poll.' }
);

export const commentSchema = z.object({
  body: z.string().trim().min(1).max(500),
  parentId: z.string().cuid().optional().nullable(),
});

export const messageSchema = z.object({
  body: z.string().trim().min(1).max(4000),
  replyToId: z.string().cuid().optional().nullable(),
});

export const profileSchema = z.object({
  displayName: z.string().trim().min(1).max(60),
  bio: z.string().max(160).optional(),
  avatar: z.string().optional(),
  cover: z.string().optional(),
  isPrivate: z.boolean().optional(),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type PostInput = z.infer<typeof postSchema>;
