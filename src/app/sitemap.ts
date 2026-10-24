import { MetadataRoute } from 'next';

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://strings-app.onrender.com';

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: `${APP_URL}/`, lastModified: new Date(), changeFrequency: 'daily', priority: 1 },
    { url: `${APP_URL}/login`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.5 },
    { url: `${APP_URL}/signup`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.8 },
    { url: `${APP_URL}/legal/terms`, lastModified: new Date(), changeFrequency: 'yearly', priority: 0.3 },
    { url: `${APP_URL}/legal/privacy`, lastModified: new Date(), changeFrequency: 'yearly', priority: 0.3 },
    { url: `${APP_URL}/guidelines`, lastModified: new Date(), changeFrequency: 'yearly', priority: 0.3 },
  ];
}
