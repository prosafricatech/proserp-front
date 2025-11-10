import type { Metadata, Viewport } from 'next';
import '@/styles/style.css';
import '@assets/fonts/noir-pro/styles.css';
import { ReactNode } from 'react';
import { Providers } from '../providers';
import { getDictionary } from './dictionaries';
import { DictionaryProvider } from './contexts/DictionaryContext';
import { LanguageProvider } from './contexts/LanguageContext';
import Script from 'next/script';

interface RootLayoutProps {
  children: ReactNode;
  params: Promise<{ lang: string }>;
}

const APP_NAME = 'ProsERP';
const APP_DEFAULT_TITLE = 'ProsERP';
const APP_TITLE_TEMPLATE = '%s | ProsERP';
const APP_DESCRIPTION = 'Robust ERP for accounting, project management, payroll, inventory, and requisitions.';

export async function generateStaticParams() {
  return [{ lang: 'en-US' }];
}

export const viewport: Viewport = {
  themeColor: [{ media: '(prefers-color-scheme: light)', color: '#2113AD' }],
  width: 'device-width',
  initialScale: 1,
  minimumScale: 1,
  maximumScale: 5,
  userScalable: true,
};

export const metadata: Metadata = {
  title: {
    default: APP_DEFAULT_TITLE,
    template: APP_TITLE_TEMPLATE,
  },
  description: APP_DESCRIPTION,
  generator: 'Next.js',
  manifest: '/manifest.json',
  keywords: ['nextjs', 'next14', 'pwa', 'next-pwa'],
  icons: [
    { rel: 'apple-touch-icon', url: '/assets/images/icons/logo512.png' },
    { rel: 'icon', url: '/assets/images/icons/logo512.png' },
  ],
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: APP_DEFAULT_TITLE,
  },
  formatDetection: {
    telephone: false,
  },
  openGraph: {
    type: 'website',
    siteName: APP_NAME,
    title: {
      default: APP_DEFAULT_TITLE,
      template: APP_TITLE_TEMPLATE,
    },
    description: APP_DESCRIPTION,
  },
  twitter: {
    card: 'summary',
    title: {
      default: APP_DEFAULT_TITLE,
      template: APP_TITLE_TEMPLATE,
    },
    description: APP_DESCRIPTION,
  },
  other: {
    'msapplication-TileColor': '#2113AD',
    keywords:
      'Robust ERP, ProsERP, Accounts, Project Management, Inventory Management, Payroll, Requisitions',
  },
};

export default async function RootLayout({ children, params }: RootLayoutProps) {
  const { lang } = await params;
  const dictionary = await getDictionary(lang);
  const isProd = process.env.NODE_ENV === 'production';

  return (
    <html lang={lang} data-lt-installed="true">
      <head>
        <link rel="manifest" href={`/api/manifest?lang=${lang}`} />
        <link rel="icon" href="/assets/images/icons/logo512.png" />
        <link rel="apple-touch-icon" href="/assets/images/icons/logo512.png" />
      </head>
      <body cz-shortcut-listen="true">
        <div id="root">
          <LanguageProvider lang={lang}>
            <DictionaryProvider dictionary={dictionary}>
              <Providers>{children}</Providers>
            </DictionaryProvider>
          </LanguageProvider>
        </div>
        {isProd && (
          <Script strategy="afterInteractive">
            {`
              if ('serviceWorker' in navigator) {
                window.addEventListener('load', () => {
                  navigator.serviceWorker.register('/sw.js').then(
                    (registration) => {
                      console.log('Service Worker registered:', registration);
                    },
                    (err) => {
                      console.error('Service Worker registration failed:', err);
                    }
                  );
                });
              }

              window.addEventListener('beforeinstallprompt', (e) => {
                e.preventDefault(); // Prevent the default prompt
              });
            `}
          </Script>
        )}
      </body>
    </html>
  );
}