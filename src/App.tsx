import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate, useLocation } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useState, useEffect, useRef } from "react";
import Index from "./pages/Index.tsx";
import Shop from "./pages/Shop.tsx";
import Attar from "./pages/Attar.tsx";
import GiftSets from "./pages/GiftSets.tsx";
import PrayerMats from "./pages/PrayerMats.tsx";
import IslamicBooks from "./pages/IslamicBooks.tsx";
import Contact from "./pages/Contact.tsx";
import ProductDetail from "./pages/ProductDetail.tsx";
import AdminDashboard from "./pages/AdminDashboard.tsx";
import AdminLogin from "./pages/AdminLogin.tsx";
import AdminRequest from "./pages/AdminRequest.tsx";
import NotFound from "./pages/NotFound.tsx";
import AIChatbot from "./components/AIChatbot.tsx";
import WhatsAppButton from "./components/WhatsAppButton.tsx";
import GlobalBackButton from "./components/GlobalBackButton.tsx";
import { AnimatePresence } from "framer-motion";
import SplashScreen from "./components/SplashScreen.tsx";
import { CartProvider } from "./context/CartContext.tsx";
import { AuthProvider, useAuth } from "./context/AuthContext.tsx";
import PrivacyPolicy from "./pages/PrivacyPolicy.tsx";
import TermsOfService from "./pages/TermsOfService.tsx";
import RefundPolicy from "./pages/RefundPolicy.tsx";
import FAQ from "./pages/FAQ.tsx";
import TrackOrder from "./pages/TrackOrder.tsx";
import ShippingInfo from "./pages/ShippingInfo.tsx";
import Returns from "./pages/Returns.tsx";
import PWAInstallPrompt from "./components/PWAInstallPrompt.tsx";
import OfflineMessage from "./components/OfflineMessage.tsx";

import AddToCartConfirmation from "./components/AddToCartConfirmation.tsx";
import Checkout from "./pages/Checkout.tsx";
import MyOrders from "./pages/MyOrders.tsx";

import SEOHead from "./components/SEOHead.tsx";

import { UIProvider } from "./context/UIContext.tsx";

const queryClient = new QueryClient();

// Protected Route Component
const ProtectedAdminRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, role, loading, isSuperAdmin } = useAuth();

  if (loading) return null; // Or a loader

  if (!user) {
    return <Navigate to="/admin-login" replace />;
  }

  // Grant access if the user is a whitelisted super admin OR has an admin role in the DB
  if (!isSuperAdmin && role !== "admin") {
    return <Navigate to="/admin-request" replace />;
  }

  return <>{children}</>;
};

const SupportWidgets = () => {
  const location = useLocation();
  const pathname = location.pathname;
  const [isOverlayOpen, setIsOverlayOpen] = useState(false);

  useEffect(() => {
    const observer = new MutationObserver(() => {
      const isLocked = document.body.hasAttribute('data-radix-scroll-lock');
      setIsOverlayOpen(isLocked);
    });
    observer.observe(document.body, { attributes: true });
    return () => observer.disconnect();
  }, []);
  
  if (pathname.startsWith("/admin") || isOverlayOpen) return null;

  return (
    <>
      <WhatsAppButton />
      <AIChatbot />
      <GlobalBackButton />
    </>
  );
};

// Smart Scroll Restoration: Save position when leaving a page, restore when going back
const ScrollRestoration = () => {
  const location = useLocation();
  const prevPath = useRef<string>(location.pathname);

  useEffect(() => {
    // Save scroll position of the page we're leaving
    const savePos = () => {
      if (prevPath.current) {
        sessionStorage.setItem(`scroll_${prevPath.current}`, window.scrollY.toString());
      }
    };

    savePos();
    prevPath.current = location.pathname;

    const savedPosStr = sessionStorage.getItem(`scroll_${location.pathname}`);
    const savedPos = savedPosStr ? parseInt(savedPosStr) : 0;
    
    if (savedPos > 0) {
      let attempts = 0;
      const maxAttempts = 50; // Try for ~5 seconds (50 * 100ms)
      
      const tryRestore = () => {
        const docHeight = document.documentElement.scrollHeight;
        
        // Scroll as much as possible, keep trying until we reach the target or time out
        window.scrollTo({ top: savedPos, behavior: 'instant' as ScrollBehavior });
        
        // If we haven't reached the saved position yet because content is loading
        if (Math.abs(window.scrollY - savedPos) > 5 && attempts < maxAttempts) {
          attempts++;
          setTimeout(tryRestore, 100);
        }
      };
      
      setTimeout(tryRestore, 50);
    } else {
      window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior });
    }
  }, [location.pathname]);

  return null;
};

const App = () => {
  const [loading, setLoading] = useState(() => {
    // Immediate bypass for admin panel to keep management efficient
    if (window.location.pathname.startsWith("/admin")) return false;
    
    const splashCount = parseInt(sessionStorage.getItem("kaleemiya_splash_count") || "0");
    return splashCount < 3;
  });

  // Removed strict refresh redirect to allow staying on current page (e.g. product details) after reload
  useEffect(() => {
    // Ensuring scroll stability on remount
    if ('scrollRestoration' in window.history) {
      window.history.scrollRestoration = 'manual';
    }
  }, []);

  const handleSplashComplete = () => {
    const currentCount = parseInt(sessionStorage.getItem("kaleemiya_splash_count") || "0");
    sessionStorage.setItem("kaleemiya_splash_count", (currentCount + 1).toString());
    setLoading(false);
  };

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AuthProvider>
          <UIProvider>
            <CartProvider>
              <AnimatePresence mode="wait">
                {loading && <SplashScreen onComplete={handleSplashComplete} />}
              </AnimatePresence>
              
              {!loading && (
              <BrowserRouter 
                future={{ 
                  v7_startTransition: true,
                  v7_relativeSplatPath: true, 
                }}
              >
                <SEOHead />
                <ScrollRestoration />
                <Toaster />
                <Sonner />
                <PWAInstallPrompt />
                <OfflineMessage />
                <AddToCartConfirmation />
                <Routes>
                  <Route path="/" element={<Index />} />
                  <Route path="/shop" element={<Shop />} />
                  <Route path="/my-orders" element={<MyOrders />} />
                  <Route path="/attar" element={<Attar />} />
                  <Route path="/gift-sets" element={<GiftSets />} />
                  <Route path="/prayer-mats" element={<PrayerMats />} />
                  <Route path="/books" element={<IslamicBooks />} />
                  <Route path="/contact" element={<Contact />} />
                  <Route path="/product/:id" element={<ProductDetail />} />
                  
                  {/* Policy & Support Routes */}
                  <Route path="/privacy-policy" element={<PrivacyPolicy />} />
                  <Route path="/terms-of-service" element={<TermsOfService />} />
                  <Route path="/refund-policy" element={<RefundPolicy />} />
                  <Route path="/faq" element={<FAQ />} />
                  <Route path="/track-order" element={<TrackOrder />} />
                  <Route path="/shipping-info" element={<ShippingInfo />} />
                  <Route path="/returns" element={<Returns />} />
                  <Route path="/checkout" element={<Checkout />} />
                  
                  {/* Admin Routes */}
                  <Route path="/admin-login" element={<AdminLogin />} />
                  <Route path="/admin-request" element={<AdminRequest />} />
                  <Route 
                    path="/admin" 
                    element={
                      <ProtectedAdminRoute>
                        <AdminDashboard />
                      </ProtectedAdminRoute>
                    } 
                  />
                  
                  <Route path="*" element={<NotFound />} />
                </Routes>
                
                <SupportWidgets />
              </BrowserRouter>
            )}
          </CartProvider>
          </UIProvider>
        </AuthProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
