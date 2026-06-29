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
import ComparePage from '@/pages/ComparePage.jsx';
import ExplorePage from '@/pages/ExplorePage.jsx';
import FearGreedPage from '@/pages/FearGreedPage.jsx';
import MoneyFlowPage from '@/pages/MoneyFlowPage.jsx';
import RumorsPage from '@/pages/RumorsPage.jsx';
import EfsahFlashPage from '@/pages/EfsahFlashPage.jsx';
import SignalsPage from '@/pages/SignalsPage.jsx';
import IpoPage from '@/pages/IpoPage.jsx';
import StrategiesPage from '@/pages/StrategiesPage.jsx';
import StrategyDetailPage from '@/pages/StrategyDetailPage.jsx';
import BasketsPage from '@/pages/BasketsPage.jsx';
import BrokersPage from '@/pages/BrokersPage.jsx';
import StoriesPage from '@/pages/StoriesPage.jsx';

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<HomePage />} />
        <Route path="/market" element={<MarketPage />} />
        <Route path="/stock/:ticker" element={<StockDetailPage />} />
        <Route path="/sharia" element={<ShariaPage />} />
        <Route path="/compare" element={<ComparePage />} />
        <Route path="/explore" element={<ExplorePage />} />
        <Route path="/fear-greed" element={<FearGreedPage />} />
        <Route path="/money-flow" element={<MoneyFlowPage />} />
        <Route path="/rumors" element={<RumorsPage />} />
        <Route path="/efsah-flash" element={<EfsahFlashPage />} />
        <Route path="/signals" element={<SignalsPage />} />
        <Route path="/ipo" element={<IpoPage />} />
        <Route path="/strategies" element={<StrategiesPage />} />
        <Route path="/strategy/:slug" element={<StrategyDetailPage />} />
        <Route path="/baskets" element={<BasketsPage />} />
        <Route path="/brokers" element={<BrokersPage />} />
        <Route path="/stories" element={<StoriesPage />} />
        <Route path="/predict" element={<PredictPage />} />
        <Route path="/journal" element={<JournalPage />} />
        <Route path="/leaderboard" element={<LeaderboardPage />} />
        <Route path="/methodology" element={<MethodologyPage />} />
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  );
}
