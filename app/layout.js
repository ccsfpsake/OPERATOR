import { Inter } from 'next/font/google';
import './ui/globals.css';
import Favicon from '../app/dashboard/favicon/favicon';

const inter = Inter({ subsets: ['latin'] });

export const metadata = {
  title: 'Operator',
  description: 'Sake',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <Favicon />
      </head>
      <body className={inter.className}>{children}</body>
    </html>
  );
}
