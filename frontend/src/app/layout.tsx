import './globals.css';
import { Toaster } from 'react-hot-toast';
import { Manrope } from 'next/font/google';
import Nav from '../components/Nav';
import NotificationListener from '../components/NotificationListener';
import ThemeBoot from '../components/ThemeBoot';

export const metadata = { title: 'Opendesk', description: 'Opendesk frontend' };
const manrope = Manrope({ subsets: ['latin'], weight: ['400', '500', '600', '700'] });

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={manrope.className}>
        <ThemeBoot />
        <Nav />
        <NotificationListener />
        <main className="mx-auto w-full max-w-none px-3 py-5 sm:max-w-[1240px] sm:px-4 md:px-6">{children}</main>
        <Toaster position="top-right" />
      </body>
    </html>
  );
}
