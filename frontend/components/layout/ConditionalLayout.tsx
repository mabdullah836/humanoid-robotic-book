'use client';

import { usePathname } from 'next/navigation';
import { Navbar } from './Navbar';
import { InstantChatProvider } from '../instant-chat';
import { NAVBAR_HEIGHT } from '@/lib/constants';

interface ConditionalLayoutProps {
  children: React.ReactNode;
}

export default function ConditionalLayout({ children }: ConditionalLayoutProps) {
  const pathname = usePathname();

  // Routes where navbar should be hidden
  const hideNavbarRoutes = ['/login', '/register'];
  const showNavbar = !hideNavbarRoutes.some(route => pathname?.startsWith(route));

  return (
    <>
      {showNavbar && <Navbar />}
      <main style={{ paddingTop: showNavbar ? NAVBAR_HEIGHT : 0 }}>
        {children}
      </main>
      <InstantChatProvider />
    </>
  );
}