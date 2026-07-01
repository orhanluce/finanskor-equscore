import React from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from '@/components/Sidebar.jsx';
import Footer from '@/components/Footer.jsx';
import AiAsk from '@/components/AiAsk.jsx';

export default function Layout() {
  const { pathname } = useLocation();
  React.useEffect(() => { window.scrollTo(0, 0); }, [pathname]);
  return (
    <div className="min-h-screen">
      <Sidebar />
      <div className="flex min-h-screen flex-col lg:pl-60 lg:pr-60">
        <main className="flex-1">
          <Outlet />
        </main>
        <Footer />
      </div>
      <AiAsk />
    </div>
  );
}
