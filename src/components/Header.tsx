import { useState, useEffect } from "react";
import { Search, Menu, X, ChevronDown, ShoppingBag, User, ArrowLeft } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import MegaMenu from "./MegaMenu";
import CartDrawer from "./CartDrawer";
import AnnouncementBanner from "./AnnouncementBanner";
const navLinks = [
  { name: "Home", href: "/" },
  { name: "Shop", href: "/shop" },
  { name: "Attar", href: "/attar" },
  { name: "Gift Sets", href: "/gift-sets" },
  { name: "Prayer Mats", href: "/prayer-mats" },
  { name: "Books", href: "/books" },
  { name: "Track Order", href: "/track-order" },
  { name: "My Orders", href: "/my-orders" },
  { name: "Contact", href: "/contact" }
];

import AccountDrawer from "./AccountDrawer";
import { useUI } from "@/context/UIContext.tsx";

const Header = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const { accountOpen, setAccountOpen } = useUI();
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [megaMenuOpen, setMegaMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [megaMenuTimer, setMegaMenuTimer] = useState<any>(null);

  const handleOpenMegaMenu = () => {
    if (megaMenuTimer) clearTimeout(megaMenuTimer);
    setMegaMenuOpen(true);
  };

  const handleCloseMegaMenu = () => {
    const timer = setTimeout(() => {
      setMegaMenuOpen(false);
    }, 300); // 300ms delay to help mouse reach menu
    setMegaMenuTimer(timer);
  };

  const [isLiveEnabled, setIsLiveEnabled] = useState(true);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", onScroll);
    
    // Check initial settings
    const stored = localStorage.getItem("kaleemiya_store_settings");
    if (stored) {
      const settings = JSON.parse(stored);
      setIsLiveEnabled(settings.publicLivePage ?? true);
    }

    // Real-time synchronization
    const handleSettingsUpdate = () => {
      const stored = localStorage.getItem("kaleemiya_store_settings");
      if (stored) {
        const settings = JSON.parse(stored);
        setIsLiveEnabled(settings.publicLivePage ?? true);
      }
    };
    
    window.addEventListener("storage", handleSettingsUpdate);
    window.addEventListener("kaleemiya_settings_updated", handleSettingsUpdate);
    
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("storage", handleSettingsUpdate);
      window.removeEventListener("kaleemiya_settings_updated", handleSettingsUpdate);
    };
  }, []);

  // Premium Dark Background Color
  const headerBg = "#310101"; 

  return (
    <>
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 shadow-xl backdrop-blur-md`}
      style={{ backgroundColor: `${headerBg}F0` }} // Added transparency for blur effect
    >
      <AnnouncementBanner />

      <div className="w-full" style={{ backgroundColor: headerBg }}>
        <div className="max-w-screen-2xl mx-auto px-4 md:px-6 flex items-center h-20 sm:h-24 lg:h-28 relative">
          
          {/* Logo - Fixed Left */}
          <div className="flex-shrink-0 z-20 flex items-center">
            <Link to="/" className="block transition-transform active:scale-95 pr-1">
              <img 
                src="/logo.png?v=4" 
                alt="Kaleemiya Perfumes Logo" 
                style={{ filter: "contrast(1.15) brightness(1.05) saturate(1.1)" }}
                className="h-14 sm:h-18 lg:h-24 w-auto object-contain transition-all duration-700 hover:scale-105 drop-shadow-[0_4px_12px_rgba(0,0,0,0.08)]" 
              />
            </Link>
          </div>

          <nav className="hidden xl:flex absolute inset-0 items-center justify-center pointer-events-none px-40">
            <ul className="flex items-center pointer-events-auto mr-16">
              {( [
                ...navLinks
                  .filter(l => !["Home", "Track Order", "My Orders"].includes(l.name))
                  .map(l => ({ name: l.name, path: l.href })),
                { name: "All Collections", path: "/shop", isMega: true },
              ] as any[]).map((link, index, array) => (
                <li key={link.name} className="flex items-center">
                  {link.isMega ? (
                    <div 
                      onMouseEnter={handleOpenMegaMenu}
                      onMouseLeave={handleCloseMegaMenu}
                      className="relative h-full flex items-center"
                    >
                      <Link
                        to={link.path}
                        className="text-[9.5px] 2xl:text-[12px] font-bold uppercase tracking-[0.15em] text-white hover:text-[#DEB87A] transition-all whitespace-nowrap px-2 2xl:px-4 flex items-center gap-1"
                      >
                        {link.name}
                        <ChevronDown className="w-3 h-3 opacity-50 shrink-0 text-[#DEB87A]" />
                      </Link>
                    </div>
                  ) : (
                    <Link
                      to={link.path}
                      className="text-[9.5px] 2xl:text-[12px] font-bold uppercase tracking-[0.15em] text-white hover:text-[#DEB87A] transition-all whitespace-nowrap px-2 2xl:px-4"
                    >
                      {link.name}
                    </Link>
                  )}
                  {/* Subtle Separator */}
                  {index < array.length - 1 && (
                    <span className="w-[1px] h-3 bg-white/10 shrink-0" />
                  )}
                </li>
              ))}
            </ul>
          </nav>

          {/* Actions - Fixed Right */}
          <div className="flex items-center gap-1.5 sm:gap-3 lg:gap-5 ml-auto z-20">
            {/* Desktop Search Icon */}
            <button 
              onClick={() => setSearchOpen(true)}
              className="hidden lg:flex p-2 text-white/80 hover:text-[#DEB87A] active:scale-90 transition-all"
            >
              <Search className="w-6 h-6" />
            </button>

            {/* Mobile Persistent Search Bar (Always visible on mobile) */}
            <div className="xl:hidden flex-1 relative ml-[-12px] mr-0.5 sm:mr-2">
              <input 
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && searchQuery.trim()) {
                    navigate(`/shop?search=${encodeURIComponent(searchQuery)}`);
                    setSearchQuery('');
                  }
                }}
                placeholder="Product Search..."
                className="w-full bg-white/10 border border-white/20 rounded-full py-2 sm:py-2.5 pl-4 pr-10 text-[11px] sm:text-[13px] font-sans text-white focus:bg-white/20 focus:border-[#DEB87A]/50 focus:outline-none transition-all placeholder:text-white/40"
              />
              <button 
                onClick={() => {
                  if (searchQuery.trim()) {
                    navigate(`/shop?search=${encodeURIComponent(searchQuery)}`);
                    setSearchQuery('');
                  }
                }}
                className="absolute right-3.5 top-1/2 -translate-y-1/2"
              >
                <Search className="w-4.5 h-4.5 text-[#DEB87A]" />
              </button>
            </div>

            {/* Account */}
            <button 
              onClick={() => setAccountOpen(true)}
              className="text-white hover:text-[#DEB87A] transition-colors hidden md:flex items-center gap-2 group"
            >
              <User className="w-5 h-5 text-white group-hover:text-[#DEB87A] transition-colors" />
              <span className="hidden 2xl:inline text-[12px] uppercase tracking-[0.2em] font-black whitespace-nowrap">
                {user ? (user.displayName || user.email?.split('@')[0]) : "Account"}
              </span>
            </button>
            
            {/* Cart */}
            <div className="scale-110 sm:scale-125 origin-right">
              <CartDrawer />
            </div>
            
            {/* Hamburger Trigger */}
            <button 
              className="xl:hidden text-white p-2 active:scale-95 transition-all hover:bg-white/5 rounded-full"
              onClick={() => setMobileOpen(!mobileOpen)}
            >
              {mobileOpen ? <X className="w-7 h-7" /> : <Menu className="w-7 h-7" />}
            </button>
          </div>
        </div>

        {/* Universal Search Overlay Slide-down (All Devices) */}
        <AnimatePresence>
          {searchOpen && (
            <>
              {/* Backdrop for outside-click closing */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setSearchOpen(false)}
                className="fixed inset-0 bg-black/40 backdrop-blur-[6px] z-[90]"
              />
              
              <motion.div
                initial={{ y: -100, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: -100, opacity: 0 }}
                className="fixed left-0 right-0 top-0 bg-[#F9F6F2] border-b border-black/10 shadow-2xl z-[100]"
              >
                <div className="max-w-3xl mx-auto px-6 py-10 sm:py-14 flex flex-col items-center gap-6 relative">
                   <button 
                     onClick={() => setSearchOpen(false)}
                     className="absolute right-4 top-4 p-2 text-black/40 hover:text-black transition-colors"
                   >
                     <X className="w-6 h-6" />
                   </button>

                   <h3 className="text-[14px] uppercase tracking-[0.25em] font-bold text-black/80 mb-2">What are you looking for?</h3>
                  
                  <div className="relative w-full">
                    <input 
                      autoFocus
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && searchQuery.trim()) {
                          navigate(`/shop?search=${encodeURIComponent(searchQuery)}`);
                          setSearchOpen(false);
                          setSearchQuery('');
                        }
                      }}
                      placeholder="Enter search terms..."
                      className="w-full bg-white border border-black/10 rounded-full py-4 px-8 pr-16 text-[16px] font-sans text-black focus:border-[#B0843D] focus:ring-1 focus:ring-[#B0843D]/20 transition-all placeholder:text-black/20 shadow-inner text-center"
                    />
                    <button 
                      onClick={() => {
                        if (searchQuery.trim()) {
                           navigate(`/shop?search=${encodeURIComponent(searchQuery)}`);
                           setSearchOpen(false);
                           setSearchQuery('');
                        }
                      }}
                      className="absolute right-6 top-1/2 -translate-y-1/2 p-2 hover:scale-110 active:scale-95 transition-all"
                    >
                      <Search className="w-6 h-6 text-[#B0843D]" />
                    </button>
                  </div>
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </div>

      <MegaMenu 
        isOpen={megaMenuOpen} 
        onMouseEnter={handleOpenMegaMenu}
        onMouseLeave={handleCloseMegaMenu}
        onClose={() => setMegaMenuOpen(false)}
      />

      {/* Mobile Drawer Overlay & Menu */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[998] xl:hidden"
              onClick={() => setMobileOpen(false)}
            />
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "tween", duration: 0.4, ease: [0.25, 1, 0.5, 1] }}
              className="fixed top-0 right-0 h-[100dvh] w-[85vw] max-w-[400px] bg-[#FDFCFB] z-[999] shadow-[-20px_0_40px_rgba(0,0,0,0.2)] flex flex-col xl:hidden overflow-y-auto"
            >
              {/* Drawer Header */}
              <div className="flex items-center justify-between p-6 pt-10 border-b border-black/5 bg-white">
                <span className="font-serif text-2xl text-black">Menu</span>
                <button 
                  onClick={() => setMobileOpen(false)}
                  className="p-2 -mr-2 text-black/60 hover:text-black transition-colors rounded-full hover:bg-black/5"
                >
                  <X className="w-7 h-7" />
                </button>
              </div>

              {/* Drawer Content */}
              <nav className="flex-1 px-8 py-8 flex flex-col gap-2 bg-[#FDFCFB]">
                {navLinks.map((link, i) => (
                  <Link
                    key={link.name}
                    to={link.href}
                    onClick={() => setMobileOpen(false)}
                    className="group"
                  >
                    <motion.div
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.1 + i * 0.05, duration: 0.4, ease: "easeOut" }}
                      className="text-black text-[13px] font-bold tracking-[0.2em] uppercase py-5 border-b border-black/10 flex items-center justify-between group-hover:text-[#B0843D] transition-colors"
                    >
                      {link.name}
                      <span className="opacity-0 -translate-x-4 group-hover:opacity-100 group-hover:translate-x-0 transition-all text-[#B0843D] text-[12px]">→</span>
                    </motion.div>
                  </Link>
                ))}
                
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.1 + navLinks.length * 0.05, duration: 0.4 }}
                  className="pt-8"
                >
                  <button
                    className="w-full py-5 bg-black text-white text-[12px] tracking-[0.2em] uppercase font-bold hover:bg-[#B0843D] active:scale-[0.98] transition-all shadow-xl rounded-full"
                    onClick={() => {
                      setMobileOpen(false);
                      setMegaMenuOpen(true);
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                  >
                    All Collections
                  </button>
                </motion.div>
              </nav>

              {/* Drawer Footer */}
              <div className="p-8 bg-[#F9F6F2] mt-auto border-t border-black/5">
                <button 
                  onClick={() => { setMobileOpen(false); setAccountOpen(true); }}
                  className="flex items-center justify-center gap-3 w-full py-5 text-black text-[12px] font-bold uppercase tracking-[0.15em] hover:text-[#B0843D] transition-colors bg-white rounded-full shadow-sm border border-black/10"
                >
                  <User size={18} className="text-[#B0843D]" /> 
                  {user ? "View Profile" : "Identity Sign-In"}
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </header>

    <AccountDrawer isOpen={accountOpen} onClose={() => setAccountOpen(false)} />
    </>
  );
};

export default Header;
