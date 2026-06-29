import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Layout from '@/components/Layout.jsx';
import HomePage from '@/pages/HomePage.jsx';
import MarketPage from '@/pages/MarketPage.jsx';
import StockDetailPage from '@/pages/StockDetailPage.jsx';
import ShariaPage from '@/pages/ShariaPage.jsx';
import LeaderboardPage from '@/pages/LeaderboardPage.jsx';
import PredictPage from '@/pages/PredictPage.jsx';
import JournalPage from '@/pages/JournalPage.jsx';
import MethodologyPage from '@/pages/MethodologyPage.jsx';
import NotFound from '@/pages/NotFound.jsx';

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<HomePage />} />
        <Route path="/market" element={<MarketPage />} />
        <Route path="/stock/:ticker" element={<StockDetailPage />} />
        <Route path="/sharia" element={<ShariaPage />} />
        <Route path="/predict" element={<PredictPage />} />
        <Route path="/journal" element={<JournalPage />} />
        <Route path="/leaderboard" element={<LeaderboardPage />} />
        <Route path="/methodology" element={<MethodologyPage />} />
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  );
}
