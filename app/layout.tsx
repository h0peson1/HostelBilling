import type { Metadata } from 'next';
import { Plus_Jakarta_Sans, Inter } from 'next/font/google';
import '@/css/style.css';

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ['latin'],
  variable: '--font-heading',
  display: 'swap',
});

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap',
});

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
                      sans: ['var(--font-sans)', 'var(--font-inter)', 'Inter', 'sans-serif'],
                      heading: ['var(--font-heading)', 'var(--font-plus-jakarta-sans)', 'Plus Jakarta Sans', 'sans-serif'],
                      'headline-lg': ['var(--font-heading)', 'Plus Jakarta Sans', 'sans-serif'],
                      'headline-md': ['var(--font-heading)', 'Plus Jakarta Sans', 'sans-serif'],
                      'headline-sm': ['var(--font-heading)', 'Plus Jakarta Sans', 'sans-serif'],
                      'label-lg': ['var(--font-sans)', 'Inter', 'sans-serif'],
                      'label-md': ['var(--font-sans)', 'Inter', 'sans-serif'],
                      'body-lg': ['var(--font-sans)', 'Inter', 'sans-serif'],
                      'body-md': ['var(--font-sans)', 'Inter', 'sans-serif'],
                      'body-sm': ['var(--font-sans)', 'Inter', 'sans-serif']
                    }
                  }
                }
              }
            `,
          }}
        />
      </head>
      <body className={`${inter.variable} ${plusJakartaSans.variable} font-sans min-h-full flex flex-col justify-between text-slate-900 selection:bg-indigo-600 selection:text-white relative overflow-x-hidden`}>
        {children}
      </body>
    </html>
  );
}
