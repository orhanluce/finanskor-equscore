import React, { Suspense, lazy } from 'react';
import { Routes, Route } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import Layout from '@/components/Layout.jsx';
import HomePage from '@/pages/HomePage.jsx';

// HomePage + Layout are eager (first paint / landing). Every other route is
// code-split so the initial bundle stays small — most visitors land, browse a
// page or two, and never download the whole app.
const MarketPage = lazy(() => import('@/pages/MarketPage.jsx'));
const StockDetailPage = lazy(() => import('@/pages/StockDetailPage.jsx'));
const ShariaPage = lazy(() => import('@/pages/ShariaPage.jsx'));
const LeaderboardPage = lazy(() => import('@/pages/LeaderboardPage.jsx'));
const PredictPage = lazy(() => import('@/pages/PredictPage.jsx'));
const JournalPage = lazy(() => import('@/pages/JournalPage.jsx'));
const MethodologyPage = lazy(() => import('@/pages/MethodologyPage.jsx'));
const NotFound = lazy(() => import('@/pages/NotFound.jsx'));
const ComparePage = lazy(() => import('@/pages/ComparePage.jsx'));
const ExplorePage = lazy(() => import('@/pages/ExplorePage.jsx'));
const FearGreedPage = lazy(() => import('@/pages/FearGreedPage.jsx'));
const MoneyFlowPage = lazy(() => import('@/pages/MoneyFlowPage.jsx'));
const RumorsPage = lazy(() => import('@/pages/RumorsPage.jsx'));
const EfsahFlashPage = lazy(() => import('@/pages/EfsahFlashPage.jsx'));
const SignalsPage = lazy(() => import('@/pages/SignalsPage.jsx'));
const HeatmapPage = lazy(() => import('@/pages/HeatmapPage.jsx'));
const MacroCompassPage = lazy(() => import('@/pages/MacroCompassPage.jsx'));
const ShowcasePage = lazy(() => import('@/pages/ShowcasePage.jsx'));
const ForeignFlowPage = lazy(() => import('@/pages/ForeignFlowPage.jsx'));
const SentimentPage = lazy(() => import('@/pages/SentimentPage.jsx'));
const FinancialHealthPage = lazy(() => import('@/pages/FinancialHealthPage.jsx'));
const AcademyPage = lazy(() => import('@/pages/AcademyPage.jsx'));
const EventsPage = lazy(() => import('@/pages/EventsPage.jsx'));
const IpoPage = lazy(() => import('@/pages/IpoPage.jsx'));
const StrategiesPage = lazy(() => import('@/pages/StrategiesPage.jsx'));
const StrategyDetailPage = lazy(() => import('@/pages/StrategyDetailPage.jsx'));
const BasketsPage = lazy(() => import('@/pages/BasketsPage.jsx'));
const BrokersPage = lazy(() => import('@/pages/BrokersPage.jsx'));
const StoriesPage = lazy(() => import('@/pages/StoriesPage.jsx'));
const AccountPage = lazy(() => import('@/pages/AccountPage.jsx'));
const PortfolioPage = lazy(() => import('@/pages/PortfolioPage.jsx'));
const CompetitionPage = lazy(() => import('@/pages/CompetitionPage.jsx'));
const PremiumPage = lazy(() => import('@/pages/PremiumPage.jsx'));
const MembershipPage = lazy(() => import('@/pages/MembershipPage.jsx'));
const VerifyPage = lazy(() => import('@/pages/VerifyPage.jsx'));
const InvestorsPage = lazy(() => import('@/pages/InvestorsPage.jsx'));
const AdminPage = lazy(() => import('@/pages/AdminPage.jsx'));

function PageLoader() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
    </div>
  );
}

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<HomePage />} />
        <Route path="/market" element={<Suspense fallback={<PageLoader />}><MarketPage /></Suspense>} />
        <Route path="/stock/:ticker" element={<Suspense fallback={<PageLoader />}><StockDetailPage /></Suspense>} />
        <Route path="/sharia" element={<Suspense fallback={<PageLoader />}><ShariaPage /></Suspense>} />
        <Route path="/compare" element={<Suspense fallback={<PageLoader />}><ComparePage /></Suspense>} />
        <Route path="/explore" element={<Suspense fallback={<PageLoader />}><ExplorePage /></Suspense>} />
        <Route path="/fear-greed" element={<Suspense fallback={<PageLoader />}><FearGreedPage /></Suspense>} />
        <Route path="/money-flow" element={<Suspense fallback={<PageLoader />}><MoneyFlowPage /></Suspense>} />
        <Route path="/foreign-flow" element={<Suspense fallback={<PageLoader />}><ForeignFlowPage /></Suspense>} />
        <Route path="/rumors" element={<Suspense fallback={<PageLoader />}><RumorsPage /></Suspense>} />
        <Route path="/sentiment" element={<Suspense fallback={<PageLoader />}><SentimentPage /></Suspense>} />
        <Route path="/financial-health" element={<Suspense fallback={<PageLoader />}><FinancialHealthPage /></Suspense>} />
        <Route path="/efsah-flash" element={<Suspense fallback={<PageLoader />}><EfsahFlashPage /></Suspense>} />
        <Route path="/signals" element={<Suspense fallback={<PageLoader />}><SignalsPage /></Suspense>} />
        <Route path="/heatmap" element={<Suspense fallback={<PageLoader />}><HeatmapPage /></Suspense>} />
        <Route path="/macro" element={<Suspense fallback={<PageLoader />}><MacroCompassPage /></Suspense>} />
        <Route path="/ipo" element={<Suspense fallback={<PageLoader />}><IpoPage /></Suspense>} />
        <Route path="/strategies" element={<Suspense fallback={<PageLoader />}><StrategiesPage /></Suspense>} />
        <Route path="/strategy/:slug" element={<Suspense fallback={<PageLoader />}><StrategyDetailPage /></Suspense>} />
        <Route path="/baskets" element={<Suspense fallback={<PageLoader />}><BasketsPage /></Suspense>} />
        <Route path="/brokers" element={<Suspense fallback={<PageLoader />}><BrokersPage /></Suspense>} />
        <Route path="/stories" element={<Suspense fallback={<PageLoader />}><StoriesPage /></Suspense>} />
        <Route path="/academy" element={<Suspense fallback={<PageLoader />}><AcademyPage /></Suspense>} />
        <Route path="/predict" element={<Suspense fallback={<PageLoader />}><PredictPage /></Suspense>} />
        <Route path="/journal" element={<Suspense fallback={<PageLoader />}><JournalPage /></Suspense>} />
        <Route path="/leaderboard" element={<Suspense fallback={<PageLoader />}><LeaderboardPage /></Suspense>} />
        <Route path="/competition" element={<Suspense fallback={<PageLoader />}><CompetitionPage /></Suspense>} />
        <Route path="/events" element={<Suspense fallback={<PageLoader />}><EventsPage /></Suspense>} />
        <Route path="/methodology" element={<Suspense fallback={<PageLoader />}><MethodologyPage /></Suspense>} />
        <Route path="/account" element={<Suspense fallback={<PageLoader />}><AccountPage /></Suspense>} />
        <Route path="/portfolio" element={<Suspense fallback={<PageLoader />}><PortfolioPage /></Suspense>} />
        <Route path="/showcase" element={<Suspense fallback={<PageLoader />}><ShowcasePage /></Suspense>} />
        <Route path="/premium" element={<Suspense fallback={<PageLoader />}><PremiumPage /></Suspense>} />
        <Route path="/membership" element={<Suspense fallback={<PageLoader />}><MembershipPage /></Suspense>} />
        <Route path="/verify" element={<Suspense fallback={<PageLoader />}><VerifyPage /></Suspense>} />
        <Route path="/investors" element={<Suspense fallback={<PageLoader />}><InvestorsPage /></Suspense>} />
        <Route path="/admin" element={<Suspense fallback={<PageLoader />}><AdminPage /></Suspense>} />
        <Route path="*" element={<Suspense fallback={<PageLoader />}><NotFound /></Suspense>} />
      </Route>
    </Routes>
  );
}
