import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import ScrollToTop from './components/ScrollToTop';
import { CartProvider } from './components/layout/CartContext';
import Header from './components/layout/Header';
import TopCountdownBanner from './components/layout/TopCountdownBanner';
import Footer from './components/layout/Footer';
import HomePage from './pages/HomePage';
import ProductsPage from './pages/ProductsPage';
import ProductDetailPage from './pages/ProductDetailPage';
import CartPage from './pages/CartPage';
import CheckoutPage from './pages/CheckoutPage';
import SearchPage from './pages/SearchPage';
import NewArrivalsPage from './pages/NewArrivalsPage';
import InfoPage from './pages/InfoPage';
import TrackOrderPage from './pages/TrackOrderPage';
import { initMetaPixel, pixelPageView } from './lib/metaPixel';

import { useEffect } from 'react';

/** Dispara PageView do Meta Pixel em cada mudança de rota */
function MetaPixelTracker() {
  const location = useLocation();
  useEffect(() => {
    pixelPageView();
  }, [location.pathname]);
  return null;
}

function App() {
  useEffect(() => {
    // Inicializa o Meta Pixel uma vez
    initMetaPixel();

    const params = new URLSearchParams(window.location.search);
    const utms = {
      utm_source: params.get('utm_source'),
      utm_medium: params.get('utm_medium'),
      utm_campaign: params.get('utm_campaign'),
      utm_content: params.get('utm_content'),
      utm_term: params.get('utm_term'),
      src: params.get('src'),
      sck: params.get('sck')
    };

    // Só salva se houver algum UTM presente
    if (Object.values(utms).some(v => v !== null)) {
      sessionStorage.setItem('vapex_utms', JSON.stringify(utms));
    }
  }, []);

  return (
    <BrowserRouter>
      <ScrollToTop />
      <MetaPixelTracker />
      <CartProvider>
        <div className="min-h-screen bg-[#050505] text-white">
          <TopCountdownBanner />
          <Header />
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/produtos" element={<ProductsPage />} />
            <Route path="/lancamentos" element={<NewArrivalsPage />} />
            <Route path="/sobre" element={<InfoPage />} />
            <Route path="/privacidade" element={<InfoPage />} />
            <Route path="/termos" element={<InfoPage />} />
            <Route path="/trocas" element={<InfoPage />} />
            <Route path="/faq" element={<InfoPage />} />
            <Route path="/rastrear" element={<TrackOrderPage />} />
            <Route path="/categoria/:slug" element={<ProductsPage />} />
            <Route path="/produto/:slug" element={<ProductDetailPage />} />
            <Route path="/carrinho" element={<CartPage />} />
            <Route path="/checkout" element={<CheckoutPage />} />
            <Route path="/busca" element={<SearchPage />} />
          </Routes>
          <Footer />
        </div>
      </CartProvider>
    </BrowserRouter>
  );
}

export default App;
