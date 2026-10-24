import type { Metadata, Viewport } from 'next';
import './globals.css';
import { UserProvider } from '@/components/UserProvider';
import { SocketProvider } from '@/components/chat/SocketProvider';
import { ToastProvider } from '@/components/ui/Toast';
import { SheetProvider } from '@/components/ui/Sheet';
import { Splash } from '@/components/Splash';
import { ImageViewer } from '@/components/ui/ImageViewer';
import { SWRegister } from '@/components/pwa/SWRegister';
import { InstallPrompt } from '@/components/pwa/InstallPrompt';

export const metadata: Metadata = {
  title: 'Strings',
  description: 'Connect in transparency... black and white.',
  manifest: '/manifest.webmanifest',
  applicationName: 'Strings',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Strings',
  },
  icons: {
    icon: [
      { url: '/icons/favicon-32.png', sizes: '32x32', type: 'image/png' },
      { url: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
    ],
    apple: [{ url: '/icons/apple-touch-icon.png', sizes: '180x180', type: 'image/png' }],
    shortcut: '/icons/favicon-32.png',
  },
  formatDetection: { telephone: false },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  userScalable: true,
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#0b0b0b' },
  ],
};

const THEME_SCRIPT = `(function(){
  try {
    var t = localStorage.getItem('strings-theme');
    if (t) document.documentElement.setAttribute('data-theme', JSON.parse(t));
    else if (window.matchMedia('(prefers-color-scheme: dark)').matches)
      document.documentElement.setAttribute('data-theme', 'dark');
    var s = localStorage.getItem('strings-font-scale');
    if (s) document.documentElement.style.fontSize = (16 * JSON.parse(s)) + 'px';
    var hc = localStorage.getItem('strings-hc');
    if (hc && JSON.parse(hc)) document.documentElement.setAttribute('data-hc', '1');
  } catch(e) {}
})();`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" data-theme="light" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_SCRIPT }} />
        <link rel="apple-touch-startup-image" href="/icons/apple-touch-icon.png" />
      </head>
      <body>
        <UserProvider>
          <SocketProvider>
            <ToastProvider>
              <SheetProvider>
                <Splash />
                {children}
                <ImageViewer />
                <InstallPrompt />
              </SheetProvider>
            </ToastProvider>
          </SocketProvider>
        </UserProvider>
        <SWRegister />
      </body>
    </html>
  );
}
