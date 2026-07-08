import type { Metadata, Viewport } from "next";
import Script from "next/script";
import { Analytics } from '@vercel/analytics/react';
import { SpeedInsights } from '@vercel/speed-insights/next';
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Header } from "@/components/header";
import { MobileBottomNav } from "@/components/mobile-bottom-nav";
import { FloatingOverlays } from "@/components/floating-overlays";
import { AuthProvider } from "@/lib/auth-context";
import { AppConfigProvider } from "@/hooks/use-app-config";
import { LoginModal } from "@/components/auth/login-modal";
import { SettingsInitializer } from "@/components/settings-initializer";
import { Toaster } from "@/components/ui/sonner";
import { ErrorBoundary } from "@/components/error-boundary";
import { GlobalErrorHandler } from "@/components/global-error-handler";
import { PwaInstallManager } from "@/components/pwa-install-manager";
import { WhatsAppFloatingButton } from "@/components/whatsapp-floating-button";
import PushPermissionManager from "@/components/push-permission-manager";
import { SwrProvider } from "@/components/swr-provider";

export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';
export const revalidate = 0;

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const viewport: Viewport = {
  themeColor: '#4169E1',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
};

export async function generateMetadata(): Promise<Metadata> {
  const { db } = await import('@/lib/db');
  let settings: any = null;
  try {
    settings = await db.siteSetting.findFirst();
  } catch (e) {
    console.error('Failed to fetch settings for metadata:', e);
  }

  const faviconUrl = settings?.pwaIconUrl || settings?.faviconUrl || '/icons/icon-192x192.png?v=new';
  const ogImageUrl = settings?.ogImageUrl || settings?.appLogoUrl || settings?.logoUrl || '/brand-logo.png';
  const metaTitle = settings?.metaTitle || "చౌటుప్పల్ సూపర్ యాప్ | Choutuppal App";
  const metaDescription = settings?.metaDescription || "ఇకపై మన ఊరి షాపులు, హాస్పిటల్స్, రియల్ ఎస్టేట్ వివరాలు అన్నీ ఒకే క్లిక్ లో! చౌటుప్పల్ సొంత సూపర్ యాప్ ని ఇప్పుడే ఓపెన్ చేయండి.";
  const appName = settings?.appName || "Choutuppal App";

  return {
    metadataBase: new URL('https://choutuppal.in'),
    title: metaTitle,
    description: metaDescription,
    manifest: '/manifest.json',
    icons: {
      apple: '/logo.png',
      icon: '/logo.png',
    },
    openGraph: {
      title: metaTitle,
      description: metaDescription,
      url: 'https://choutuppal.in',
      siteName: appName,
      images: [{ url: ogImageUrl, width: 1200, height: 630, alt: appName }],
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: metaTitle,
      description: metaDescription,
      images: [ogImageUrl],
    },
    keywords: ["Choutuppal", "local business", "real estate", "Telangana", "hyper-local", "super app"],
    authors: [{ name: "Choutuppal App Team" }],
  };
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning={true}>
      <body
        suppressHydrationWarning={true}
        className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-screen w-full bg-gray-50 flex flex-col`}
      >
        {process.env.NEXT_PUBLIC_FB_PIXEL_ID && (
          <>
            <Script id="fb-pixel-script" strategy="afterInteractive">
              {`
                !function(f,b,e,v,n,t,s)
                {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
                n.callMethod.apply(n,arguments):n.queue.push(arguments)};
                if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
                n.queue=[];t=b.createElement(e);t.async=!0;
                t.src=v;s=b.getElementsByTagName(e)[0];
                s.parentNode.insertBefore(t,s)}(window, document,'script',
                'https://connect.facebook.net/en_US/fbevents.js');
                fbq('init', '${process.env.NEXT_PUBLIC_FB_PIXEL_ID}');
                fbq('track', 'PageView');
              `}
            </Script>
            <noscript>
              <img height="1" width="1" style={{ display: 'none' }}
                src={`https://www.facebook.com/tr?id=${process.env.NEXT_PUBLIC_FB_PIXEL_ID}&ev=PageView&noscript=1`} alt=""
              />
            </noscript>
          </>
        )}
        <SwrProvider>
          <GlobalErrorHandler />
          <ErrorBoundary name="AuthProvider">
            <AuthProvider>
              <AppConfigProvider>
                <ErrorBoundary name="SettingsInitializer">
                  <SettingsInitializer />
                </ErrorBoundary>
                <ErrorBoundary name="Header">
                  <Header className="flex-none" />
                </ErrorBoundary>

                <main className="flex-1 w-full max-w-7xl mx-auto flex flex-col pt-0 pb-16 md:pb-0 safe-bottom">
                    {children}
                </main>

                <ErrorBoundary name="MobileBottomNav">
                  <MobileBottomNav />
                </ErrorBoundary>

                <ErrorBoundary name="FloatingOverlays">
                  <FloatingOverlays />
                </ErrorBoundary>

                <ErrorBoundary name="LoginModal">
                  <LoginModal />
                </ErrorBoundary>

                <ErrorBoundary name="PwaInstallManager">
                  <PwaInstallManager />
                </ErrorBoundary>

                <ErrorBoundary name="PushPermissionManager">
                  <PushPermissionManager />
                </ErrorBoundary>

                <ErrorBoundary name="WhatsAppFloatingButton">
                  <WhatsAppFloatingButton />
                </ErrorBoundary>

                <ErrorBoundary name="Toaster">
                  <Toaster
                    position="bottom-center"
                    toastOptions={{
                      className: "!bg-white !text-gray-900 !border !border-gray-200 !shadow-lg !rounded-xl",
                    }}
                    richColors
                  />
                </ErrorBoundary>
              </AppConfigProvider>
            </AuthProvider>
          </ErrorBoundary>
        </SwrProvider>
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
