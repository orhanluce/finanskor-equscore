import React from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Header from '@/components/Header.jsx';
import Footer from '@/components/Footer.jsx';
import IslamicCalendarStrip from '@/components/IslamicCalendarStrip.jsx';

export default function Layout() {
  const { pathname } = useLocation();
  React.useEffect(() => { window.scrollTo(0, 0); }, [pathname]);
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <IslamicCalendarStrip />
      <main className="flex-1">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}
