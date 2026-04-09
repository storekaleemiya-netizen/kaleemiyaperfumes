import React, { useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import { LayoutDashboard, ShieldAlert, Loader2 } from "lucide-react";
import { toast } from "sonner";

const AdminLogin = () => {
  const { user, role, loading, signInWithGoogle } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && user) {
      if (role === "admin" || role === "super_admin") {
        navigate("/admin");
      } else {
        toast.error("Unauthorized access. Request admin access first.");
        navigate("/admin-request");
      }
    }
  }, [user, role, loading, navigate]);

  const handleLogin = async () => {
    try {
      await signInWithGoogle();
      toast.success("Identity verified successfully!");
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#310101] flex items-center justify-center">
        <Loader2 className="w-12 h-12 text-white animate-spin opacity-20" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FDFCFB] flex flex-col lg:flex-row relative overflow-hidden">
      {/* Decorative Accents */}
      <div className="absolute top-0 right-0 w-full h-full pointer-events-none opacity-[0.4]">
        <img src="/logo.png" alt="" className="absolute -right-20 -top-20 w-[600px] mix-blend-multiply opacity-30" />
      </div>

      {/* Brand Side (Left/Top) */}
      <div className="flex-1 bg-[#310101] p-12 md:p-24 flex flex-col justify-between relative overflow-hidden text-white">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_right,#B0843D_0%,transparent_40%)] opacity-20 pointer-events-none"></div>
        
        <div className="space-y-12 relative z-10 animate-in fade-in slide-in-from-left-10 duration-1000">
          <img 
            src="/logo.png" 
            alt="Kaleemiya Logo" 
            className="h-24 md:h-32 w-auto drop-shadow-2xl transition-all duration-700 hover:scale-110 brightness-110" 
          />
          
          <div className="space-y-6">
            <div className="inline-flex items-center gap-3 bg-white/10 px-4 py-1.5 rounded-full border border-white/10">
              <ShieldAlert className="w-4 h-4 text-[#B0843D]" />
              <span className="text-[14px] font-black uppercase tracking-[0.3em] text-[#B0843D]">Access Protocol Verification</span>
            </div>
            <h1 className="text-7xl font-serif font-black tracking-tighter leading-[0.9] italic lowercase first-letter:uppercase">Signature authority</h1>
            <p className="text-xl font-medium text-white/40 max-w-lg leading-relaxed uppercase tracking-widest text-[15px]">
              Access restricted to the administrative elite of <span className="text-white font-black">Kaleemiya Perfumes</span>.
            </p>
          </div>
        </div>

        <div className="relative z-10 space-y-2 opacity-30 mt-12">
          <p className="text-[15px] font-black uppercase tracking-[0.5em]">Luxe Management Suite</p>
          <p className="text-[14px] font-bold uppercase tracking-widest leading-relaxed">Secured with enterprise-grade encryption • v4.2.0-Elite</p>
        </div>
      </div>

      {/* Login Side (Right/Bottom) */}
      <div className="flex-1 bg-white p-12 md:p-24 flex items-center justify-center relative overflow-hidden">
        <div className="max-w-md w-full space-y-12 animate-in fade-in slide-in-from-right-10 duration-1000 delay-200">
          <div className="space-y-4">
            <h2 className="text-5xl font-serif font-black text-black tracking-tighter italic">Identity Gateway</h2>
            <p className="text-[14px] font-bold text-black/30 uppercase tracking-[0.2em]">Verify your administrative credentials via Google SSO</p>
          </div>

          <div className="space-y-6">
            <button 
              onClick={handleLogin}
              className="w-full bg-[#310101] text-white py-6 rounded-[30px] flex items-center justify-center gap-6 group hover:scale-[1.02] active:scale-[0.98] transition-all shadow-2xl relative overflow-hidden"
            >
              <div className="absolute inset-0 bg-[#B0843D] translate-y-full group-hover:translate-y-0 transition-transform duration-500 opacity-10"></div>
              <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" className="w-7 h-7 bg-white p-1 rounded-full relative z-10" />
              <span className="text-[15px] font-black uppercase tracking-[0.3em] relative z-10">Authorize Access</span>
            </button>

            <div className="flex flex-col items-center gap-4 pt-6 border-t border-gray-50">
              <p className="text-[14px] font-black text-black/30 uppercase tracking-widest">New team member?</p>
              <button 
                onClick={() => navigate("/admin-request")}
                className="text-[15px] font-black uppercase tracking-widest text-[#B0843D] hover:text-[#310101] transition-colors pb-1 border-b border-[#B0843D]/20 animate-pulse"
              >
                Apply for Admin Authority
              </button>
            </div>
          </div>

          <div className="pt-12 text-center opacity-20">
            <p className="text-[14px] font-bold uppercase tracking-widest">© Kaleemiya Perfumes • All Rights Reserved</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminLogin;
