import { motion, AnimatePresence } from "framer-motion";
import { User, X, LogOut, ShieldCheck, ShoppingBag, ArrowRight, Chrome, Mail, UserCircle } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { useState } from "react";

interface AccountDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

const AccountDrawer = ({ isOpen, onClose }: AccountDrawerProps) => {
  const { user, role, logout, signInWithGoogle, isSuperAdmin } = useAuth();
  const navigate = useNavigate();
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  const handleLogin = async () => {
    setIsLoggingIn(true);
    try {
      await signInWithGoogle();
      toast.success("Identity Verified. Welcome back.");
      onClose();
    } catch (err) {
      toast.error("Verification failed. Please try again.");
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      toast.success("Successfully Signed Out");
      onClose();
      navigate("/");
    } catch (err) {
      toast.error("Logout failed.");
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[100]"
          />

          {/* Drawer Content */}
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 300 }}
            className="fixed top-0 right-0 h-full w-full max-w-md bg-[#FDFCFB] shadow-[-20px_0_60px_rgba(49,1,1,0.15)] z-[101] flex flex-col"
          >
            {/* Header Area */}
            <div className="p-8 border-b border-[#310101]/5 flex items-center justify-between bg-[#F9F6F2]">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-[#310101] rounded-2xl text-[#E5D5C5]">
                  <User size={24} />
                </div>
                <div>
                   <h2 className="font-serif text-2xl text-[#310101]">Identity Portal</h2>
                   <p className="text-[12px] uppercase tracking-[0.2em] font-black text-[#B0843D] opacity-60">Manage your Profile</p>
                </div>
              </div>
              <button 
                onClick={onClose}
                className="p-3 hover:bg-black/5 rounded-full transition-colors text-[#310101]"
              >
                <X size={24} />
              </button>
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto p-8">
              {!user ? (
                // Guest / Login State
                <div className="space-y-10 text-center py-10">
                   <div className="space-y-4">
                      <h3 className="font-serif text-3xl text-[#310101]">Welcome to Kaleemiya</h3>
                      <p className="font-sans text-black/60 italic text-sm max-w-[280px] mx-auto">
                        Join our exclusive curated world to track your reflections, manage orders, and unlock artisan access.
                      </p>
                   </div>

                   <button 
                     onClick={handleLogin}
                     disabled={isLoggingIn}
                     className="w-full flex items-center justify-center gap-4 bg-white border-2 border-[#310101]/10 p-6 rounded-[30px] hover:border-[#310101]/30 transition-all group shadow-sm hover:shadow-xl"
                   >
                     <div className="w-8 h-8 rounded-full bg-red-50 flex items-center justify-center">
                        <Chrome className="w-4 h-4 text-red-500" />
                     </div>
                     <span className="font-black uppercase tracking-[0.2em] text-[14px] text-[#310101]">
                        {isLoggingIn ? "Verifying..." : "Verify with Google"}
                     </span>
                   </button>

                   <div className="pt-10 border-t border-dashed border-[#310101]/10 text-center">
                      <p className="text-[11px] font-black uppercase tracking-[0.3em] text-[#310101]/30 mb-2">Heritage Security</p>
                      <p className="text-xs text-black/40 px-6">Your data is secured with AES-256 artisan encryption standards.</p>
                   </div>
                </div>
              ) : (
                // Authenticated State
                <div className="space-y-12">
                   {/* User Profile Header */}
                   <div className="bg-white p-8 rounded-[40px] border border-[#310101]/5 shadow-sm text-center space-y-6">
                      <div className="w-24 h-24 mx-auto rounded-[35px] bg-[#310101] flex items-center justify-center text-[#E5D5C5] text-4xl font-serif italic font-bold shadow-2xl relative">
                        {user.photoURL ? (
                           <img src={user.photoURL} alt={user.displayName || ""} className="w-full h-full object-cover rounded-[35px]" />
                        ) : (
                           user.displayName?.charAt(0) || <UserCircle className="w-12 h-12 opacity-20" />
                        )}
                        <div className="absolute -bottom-2 -right-2 bg-green-500 w-6 h-6 rounded-full border-4 border-white shadow-lg" />
                      </div>
                      <div>
                        <h4 className="text-2xl font-serif font-black text-[#310101] tracking-tight">{user.displayName || "Artisan Member"}</h4>
                        <p className="text-sm font-sans font-medium text-black/40">{user.email}</p>
                      </div>
                      
                      <div className="pt-4 border-t border-[#310101]/5">
                        <span className="inline-block px-5 py-2 bg-[#B0843D] text-[#E5D5C5] rounded-full text-[12px] font-black uppercase tracking-[0.2em] shadow-lg shadow-[#B0843D]/20">
                           PREMIUM Signature MEMBER
                        </span>
                      </div>
                   </div>

                   {/* Quick Links Nav */}
                      <button 
                        onClick={() => { onClose(); navigate("/track-order"); }}
                        className="w-full flex items-center justify-between p-6 bg-[#310101] text-[#E5D5C5] rounded-[30px] shadow-xl hover:scale-[1.02] active:scale-95 transition-all group"
                      >
                         <div className="flex items-center gap-4">
                            <ShoppingBag className="w-6 h-6" />
                            <span className="font-black uppercase tracking-widest text-[14px]">Track Active Orders</span>
                         </div>
                         <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                      </button>
                </div>
              )}
            </div>

            {/* Sticky Footer for Logout */}
            {user && (
              <div className="p-8 bg-[#F9F6F2] border-t border-[#310101]/5">
                <button 
                  onClick={handleLogout}
                  className="w-full flex items-center justify-center gap-4 p-6 border-2 border-red-500/10 text-red-600 rounded-[30px] hover:bg-red-500 hover:text-white transition-all font-black uppercase tracking-[0.2em] text-[14px] shadow-sm"
                >
                   <LogOut className="w-5 h-5" />
                   End Session
                </button>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default AccountDrawer;
