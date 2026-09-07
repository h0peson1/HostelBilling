import type { Metadata } from 'next';
import '@/css/style.css';

export const metadata: Metadata = {
  title: "Hopeson’s Net — Hostel Wi-Fi Portal",
  description: "High-speed hostel campus Wi-Fi access with silent instant resident onboarding.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-full bg-slate-50">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700&family=Space+Grotesk:wght@500;600;700&display=swap"
          rel="stylesheet"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200"
          rel="stylesheet"
        />
        <script src="https://cdn.tailwindcss.com"></script>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              tailwind.config = {
                theme: {
                  extend: {
                    colors: {
                      primary: '#4338ca',
                      'primary-container': '#3730a3',
                      'on-primary': '#ffffff',
                      secondary: '#059669',
                      'secondary-container': '#d1fae5',
                      'on-secondary-container': '#065f46',
                      surface: '#ffffff',
                      'surface-container-lowest': '#ffffff',
                      'surface-container-low': '#f8fafc',
                      'surface-container': '#f1f5f9',
                      'surface-container-high': '#e2e8f0',
                      'on-surface': '#0f172a',
                      'on-surface-variant': '#475569',
                      outline: '#94a3b8',
                      'outline-variant': '#cbd5e1'
                    },
                    fontFamily: {
                      'headline-lg': ['Space Grotesk', 'sans-serif'],
                      'headline-md': ['Space Grotesk', 'sans-serif'],
                      'headline-sm': ['Space Grotesk', 'sans-serif'],
                      'label-lg': ['Space Grotesk', 'sans-serif'],
                      'label-md': ['Space Grotesk', 'sans-serif'],
                      'body-lg': ['Plus Jakarta Sans', 'sans-serif'],
                      'body-md': ['Plus Jakarta Sans', 'sans-serif'],
                      'body-sm': ['Plus Jakarta Sans', 'sans-serif']
                    }
                  }
                }
              }
            `,
          }}
        />
      </head>
      <body className="min-h-full flex flex-col justify-between text-slate-900 selection:bg-indigo-600 selection:text-white relative overflow-x-hidden">
        {children}
      </body>
    </html>
  );
}
