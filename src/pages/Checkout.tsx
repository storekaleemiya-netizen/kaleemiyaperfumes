import React from "react";
import { useCart } from "@/context/CartContext";
import { ChevronLeft, Lock, ShoppingCart, Tag, User, ShieldCheck, CheckCircle2, ChevronDown, Check, MapPin, XCircle, AlertTriangle } from "lucide-react";
import { useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import { auth } from "@/lib/firebase";
import { 
  RecaptchaVerifier, 
  signInWithPhoneNumber, 
  ConfirmationResult 
} from "firebase/auth";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";

const Checkout = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { cart, totalCount, clearCart } = useCart();
  const [mobileNumber, setMobileNumber] = React.useState("");
  const [promoMessage, setPromoMessage] = React.useState("FREE GIFT ON ALL PREPAID ORDERS");
  const [checkoutStep, setCheckoutStep] = React.useState<'login' | 'otp' | 'address' | 'success'>('login');
  const [otp, setOtp] = React.useState(["", "", "", "", "", ""]);
  const [isSummaryOpen, setIsSummaryOpen] = React.useState(false);
  const [timer, setTimer] = React.useState(30);
  const [showExitModal, setShowExitModal] = React.useState(false);
  
  const [confirmationResult, setConfirmationResult] = React.useState<ConfirmationResult | null>(null);
  const [isProcessing, setIsProcessing] = React.useState(false);
  const verifierRef = React.useRef<any>(null);

  const userName = user?.displayName || user?.email?.split('@')[0] || "";

  const [address, setAddress] = React.useState({
    fullName: "",
    pincode: "",
    city: "",
    state: "",
    fullAddress: "",
    landmark: ""
  });

  React.useEffect(() => {
    let interval: any;
    if (checkoutStep === 'otp' && timer > 0) {
      interval = setInterval(() => setTimer(t => t - 1), 1000);
    }
    return () => clearInterval(interval);
  }, [checkoutStep, timer]);

  const onCaptchaVerify = () => {
    if (!verifierRef.current) {
        verifierRef.current = new RecaptchaVerifier(auth, 'recaptcha-container', {
            'size': 'normal',
            'callback': (response: any) => {
                console.log("Recaptcha verified:", response);
            },
            'expired-callback': () => {
                toast.error("Captcha expired. Please verify again.");
            }
        });
    }
  };

  React.useEffect(() => {
    if (checkoutStep === 'login') {
        const t = setTimeout(onCaptchaVerify, 500);
        return () => {
            clearTimeout(t);
            if (verifierRef.current) {
                verifierRef.current.clear();
                verifierRef.current = null;
            }
        };
    }
  }, [checkoutStep]);

  const totalPrice = cart.reduce((sum, item) => {
    const price = parseInt(item.price.replace(/[^\d]/g, ""));
    return sum + (price * item.quantity);
  }, 0);

  const discountedPrice = totalPrice - 300;
  const [selectedReason, setSelectedReason] = React.useState<number | null>(null);

  const handleOtpChange = (index: number, value: string) => {
    if (value.length > 1) return;
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);
    if (value && index < 5) {
      const nextInput = document.getElementById(`otp-${index + 1}`);
      nextInput?.focus();
    }
  };

  const handleContinue = async () => {
    if (isProcessing) return;

    if (checkoutStep === 'login') {
      if (mobileNumber.length === 10) {
        setIsProcessing(true);
        try {
          onCaptchaVerify();
          const appVerifier = verifierRef.current;
          const formatPh = `+91${mobileNumber}`;
          
          const result = await signInWithPhoneNumber(auth, formatPh, appVerifier);
          setConfirmationResult(result);
          setCheckoutStep('otp');
          setTimer(60);
          toast.success("Identity verification code sent.");
        } catch (error: any) {
             console.error("Auth Error:", error);
             toast.error("Identity check failed. Please ensure localhost is authorized in Firebase Console.");
             if (verifierRef.current) {
                verifierRef.current.clear();
                verifierRef.current = null;
                onCaptchaVerify();
             }
        } finally {
          setIsProcessing(false);
        }
      } else {
        toast.error("Please enter a valid 10-digit mobile number.");
      }
    } else if (checkoutStep === 'otp') {
      const otpValue = otp.join("");
      if (otpValue.length === 6) {
        setIsProcessing(true);
        try {
          if (confirmationResult) {
            await confirmationResult.confirm(otpValue);
            setCheckoutStep('address');
            toast.success("Identity verified.");
          }
        } catch (error) {
          toast.error("Invalid verification code.");
        } finally {
          setIsProcessing(false);
        }
      } else {
        toast.error("Please enter the complete 6-digit code.");
      }
    } else if (checkoutStep === 'address') {
      if (address.fullName && address.fullAddress && address.pincode) {
        setCheckoutStep('success');
        setTimeout(() => {
          clearCart();
          navigate("/");
        }, 3500);
      } else {
        toast.error("Please complete your delivery details.");
      }
    }
  };

  const handleBack = () => {
     if (checkoutStep === 'login') {
        setShowExitModal(true);
     } else if (checkoutStep === 'otp') {
        setCheckoutStep('login');
     } else if (checkoutStep === 'address') {
        setCheckoutStep('otp');
     }
  };

  const handleHeaderContinueShopping = () => setShowExitModal(true);

  if (cart.length === 0 && checkoutStep !== 'success') {
    return (
      <div className="min-h-screen bg-[#FDFBF7] flex flex-col items-center justify-center p-8 space-y-8">
        <ShoppingCart className="w-20 h-20 text-[#B0843D]" />
        <div className="text-center space-y-4">
           <h2 className="font-serif text-4xl text-black italic font-black text-center">Your bag is empty</h2>
           <p className="text-[12px] font-black text-black/60 uppercase tracking-[0.4em] text-center">No selections established</p>
        </div>
        <Button onClick={() => navigate("/")} className="bg-[#310101] text-white rounded-full px-16 py-8 font-black tracking-widest uppercase text-[15px] shadow-2xl hover:scale-105 transition-all">Continue Shopping</Button>
      </div>
    );
  }

  if (checkoutStep === 'success') {
    return (
      <div className="min-h-screen bg-[#1A0101] flex flex-col items-center justify-center p-12 text-center space-y-12 animate-in fade-in zoom-in duration-1000 font-sans">
        <div className="relative">
           <div className="w-40 h-40 rounded-full bg-white/5 flex items-center justify-center border-[1px] border-[#B0843D]/30 shadow-2xl backdrop-blur-sm">
              <ShieldCheck className="w-20 h-20 text-[#B0843D]" />
           </div>
           <div className="absolute inset-0 bg-[#B0843D]/5 rounded-full animate-pulse" />
        </div>
        <div className="space-y-6">
           <h3 className="font-serif text-5xl text-[#B0843D] italic font-black tracking-tight">Artisan Journey Confirmed</h3>
           <p className="text-white/60 font-black uppercase tracking-[0.3em] text-[15px]">Establishing final transit protocol</p>
           <p className="text-white/40 max-w-sm mx-auto italic leading-relaxed text-lg">
             Your essence journey is reaching its zenith. 
             Thank you for choosing the legacy of Kaleemiya.
           </p>
        </div>
        <div className="flex items-center gap-3 bg-white/5 px-10 py-5 rounded-full border border-[#B0843D]/20 shadow-sm backdrop-blur-sm">
           <div className="w-3 h-3 bg-[#B0843D] rounded-full animate-ping" />
           <span className="text-[14px] font-black uppercase tracking-[0.3em] text-[#B0843D]">Dispatching Details...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100/50 flex items-center justify-center p-0 sm:p-8 font-sans">
      <div className="w-full max-w-[480px] bg-white sm:rounded-[40px] shadow-[0_20px_100px_rgba(0,0,0,0.12)] overflow-hidden flex flex-col min-h-screen sm:min-h-fit relative border border-gray-100 transition-all">
        
        <div className="px-6 sm:px-8 py-5 flex items-center bg-white sticky top-0 z-50 border-b border-gray-50">
          <div className="flex-1 flex items-center justify-start gap-1">
             <button onClick={handleBack} className="p-2 sm:p-3 hover:bg-[#F9F6F2] rounded-full transition-all group shrink-0">
                <ChevronLeft className="w-7 h-7 text-black group-hover:-translate-x-1 transition-transform" />
             </button>
             <button onClick={handleHeaderContinueShopping} className="text-[10px] sm:text-[11px] font-black text-black uppercase tracking-[0.15em] sm:tracking-[0.2em] px-2 hover:text-[#B0843D] transition-colors hidden md:block whitespace-nowrap">
                Continue Shopping
             </button>
          </div>
          
          <div className="flex-shrink-0 flex items-center justify-center">
             <Link to="/" className="block">
                <img src="/logo.png" alt="Kaleemiya Perfumes Logo" className="h-[45px] sm:h-[65px] w-auto object-contain transition-all drop-shadow-sm brightness-[0.8]" />
             </Link>
          </div>
          
          <div className="flex-1 flex flex-col items-end gap-0.5 justify-center">
             <div className="flex items-center gap-1.5 text-black font-black uppercase tracking-[0.1em] text-[10px] sm:text-[11px]">
               <span className="hidden xs:inline">Secured</span>
               <Lock className="w-3.5 h-3.5 sm:w-4 h-4 text-[#B0843D]" />
             </div>
             <span className="text-[8px] font-black text-[#B0843D] uppercase tracking-widest leading-none">PCI DSS</span>
          </div>
        </div>

        <div className="bg-[#310101] text-[#DEB87A] text-center py-4 text-[12px] font-black tracking-[0.3em] uppercase -mt-[1px]">
          {promoMessage}
        </div>

        <div className="flex-1 overflow-y-auto px-8 py-8 space-y-6">
          <div className="bg-white border-2 border-[#F9F6F2] rounded-[30px] shadow-[0_8px_30px_rgba(0,0,0,0.02)] overflow-hidden transition-all duration-500">
            <div className="p-6 flex items-center justify-between cursor-pointer group" onClick={() => setIsSummaryOpen(!isSummaryOpen)}>
               <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-[#F9F6F2] rounded-2xl flex items-center justify-center group-hover:scale-105 transition-transform">
                     <ShoppingCart className="w-6 h-6 text-[#B0843D]" />
                  </div>
                  <h3 className="font-serif font-black italic text-2xl text-black">Order Bag</h3>
               </div>
               <div className="flex items-center gap-3">
                  <span className="block text-[22px] font-black text-black">₹{discountedPrice.toLocaleString()}</span>
                  <ChevronDown className={`w-6 h-6 text-[#B0843D] transition-transform duration-500 ${isSummaryOpen ? 'rotate-180' : ''}`} />
               </div>
            </div>

            {isSummaryOpen && (
              <div className="flex flex-col animate-in slide-in-from-top-2 duration-500 bg-[#F9F6F2]/30">
                <div className="p-6 space-y-8">
                   {cart.map((item) => {
                      const itemPrice = parseInt(item.price.replace(/[^\d]/g, ""));
                      return (
                        <div key={item.id} className="flex gap-5 items-center">
                           <div className="w-20 h-20 bg-white rounded-2xl p-2 shrink-0 shadow-sm overflow-hidden border border-gray-50">
                              <img src={item.image} alt={item.name} className="w-full h-full object-contain mix-blend-multiply" />
                           </div>
                           <div className="flex-1 flex justify-between gap-6">
                              <div className="space-y-2">
                                 <h4 className="text-[17px] font-serif font-black italic text-black leading-tight">{item.name}</h4>
                                 <p className="text-[13px] font-black text-[#B0843D] uppercase tracking-[0.2em]">Qty: {item.quantity}</p>
                              </div>
                              <span className="text-[18px] font-black text-black">₹{(itemPrice * item.quantity).toLocaleString()}</span>
                           </div>
                        </div>
                      );
                   })}
                </div>

                <div className="m-6 p-8 bg-[#F9F6F2] rounded-[28px] space-y-4 shadow-inner">
                   <div className="flex justify-between items-center text-[14px] font-black text-black uppercase tracking-widest opacity-80">
                      <span>MRP Total</span>
                      <span>₹{totalPrice.toLocaleString()}</span>
                   </div>
                   <div className="flex justify-between items-center text-[14px] font-black text-green-700 uppercase tracking-widest">
                      <span>Privilege Discount</span>
                      <span className="font-black">- ₹300</span>
                   </div>
                   <div className="flex justify-between items-center text-[16px] font-black text-black uppercase tracking-widest pt-4 border-t border-black/5">
                      <span>Subtotal</span>
                      <span className="text-xl">₹{discountedPrice.toLocaleString()}</span>
                   </div>
                </div>
              </div>
            )}
          </div>

          <div className="space-y-8">
            {checkoutStep === 'login' && (
              <div className="bg-white border border-[#F9F6F2] rounded-[32px] p-8 shadow-[0_15px_40px_rgba(0,0,0,0.02)] space-y-10 animate-in slide-in-from-bottom-6 duration-700">
                <div className="flex items-center gap-4">
                   <User className="w-6 h-6 text-[#B0843D]" />
                   <h3 className="font-serif font-black italic text-[22px] text-black">
                     {user ? `Welcome, ${userName}` : "Signature Login"}
                   </h3>
                </div>
                <div className="relative">
                   <div className="absolute -top-4 left-6 bg-white px-3 text-[12px] font-black text-black uppercase tracking-[0.2em] z-10">
                     Mobile Identity
                   </div>
                   <div className="flex items-center border-[2.5px] border-black rounded-[24px] p-6 text-[24px] font-black focus-within:shadow-[0_15px_40px_rgba(0,0,0,0.06)] transition-all">
                      <span className="mr-4 text-black">+91</span>
                      <input 
                        type="tel" maxLength={10} value={mobileNumber}
                        onChange={(e) => setMobileNumber(e.target.value.replace(/\D/g, ''))}
                        className="flex-1 outline-none placeholder:text-black/5 bg-transparent"
                        placeholder="XXXXXXXXXX"
                      />
                   </div>
                </div>
              </div>
            )}

            {checkoutStep === 'otp' && (
              <div className="bg-white border border-[#F9F6F2] rounded-[32px] p-8 shadow-[0_15px_40px_rgba(0,0,0,0.02)] space-y-10 animate-in slide-in-from-right-10 duration-700 text-center">
                 <div className="flex flex-col items-center space-y-6">
                    <div className="w-20 h-20 rounded-full bg-[#FDFBF7] flex items-center justify-center border border-[#E5D5C5]/40 relative">
                       <Lock className="w-8 h-8 text-[#B0843D]" />
                    </div>
                    <div className="space-y-2">
                       <h3 className="font-serif font-black italic text-3xl text-black">Verify OTP</h3>
                       <p className="text-black/40 text-[13px] font-black uppercase tracking-widest">Sent to +91 {mobileNumber}</p>
                    </div>
                 </div>

                 <div className="space-y-6">
                    <div className="flex justify-center gap-2">
                       {otp.map((digit, i) => (
                         <input 
                           key={i} id={`otp-${i}`} type="tel" maxLength={1} value={digit} autoFocus={i === 0}
                           onChange={(e) => handleOtpChange(i, e.target.value)}
                           className="w-10 h-14 sm:w-12 sm:h-16 border-2 border-black rounded-xl text-center text-2xl font-black focus:shadow-lg focus:shadow-[#B0843D]/10 outline-none transition-all"
                         />
                       ))}
                    </div>

                    <p className="text-[13px] font-black text-gray-400 uppercase tracking-widest">
                       Resend in 00:{timer < 10 ? `0${timer}` : timer}
                    </p>
                 </div>
              </div>
            )}

            {checkoutStep === 'address' && (
              <div className="bg-white border border-[#F9F6F2] rounded-[32px] p-8 shadow-[0_15px_40px_rgba(0,0,0,0.02)] space-y-8 animate-in slide-in-from-right-10 duration-700">
                 <div className="flex items-center gap-4 border-b border-gray-100 pb-6">
                    <MapPin className="w-7 h-7 text-[#B0843D]" />
                    <h3 className="font-serif font-black italic text-2xl text-black">Delivery Details</h3>
                 </div>

                 <div className="space-y-5">
                    <div className="space-y-2">
                       <label className="text-[11px] font-black text-black uppercase tracking-widest ml-1">Full Name</label>
                       <input 
                         type="text" value={address.fullName} onChange={(e) => setAddress({...address, fullName: e.target.value})}
                         className="w-full border-2 border-gray-100 rounded-2xl p-5 text-lg font-bold outline-none focus:border-black transition-colors"
                         placeholder="Enter your name"
                       />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                       <div className="space-y-2">
                          <label className="text-[11px] font-black text-black uppercase tracking-widest ml-1">Pincode</label>
                          <input 
                            type="tel" maxLength={6} value={address.pincode} onChange={(e) => setAddress({...address, pincode: e.target.value})}
                            className="w-full border-2 border-gray-100 rounded-2xl p-5 text-lg font-bold outline-none focus:border-black transition-colors"
                            placeholder="600001"
                          />
                       </div>
                       <div className="space-y-2">
                          <label className="text-[11px] font-black text-black uppercase tracking-widest ml-1">City</label>
                          <input 
                            type="text" value={address.city} onChange={(e) => setAddress({...address, city: e.target.value})}
                            className="w-full border-2 border-gray-100 rounded-2xl p-5 text-lg font-bold outline-none focus:border-black transition-colors"
                            placeholder="Your City"
                          />
                       </div>
                    </div>

                    <div className="space-y-2">
                       <label className="text-[11px] font-black text-black uppercase tracking-widest ml-1">Full Address</label>
                       <textarea 
                         rows={2} value={address.fullAddress} onChange={(e) => setAddress({...address, fullAddress: e.target.value})}
                         className="w-full border-2 border-gray-100 rounded-2xl p-5 text-lg font-bold outline-none focus:border-black transition-colors"
                         placeholder="House No, Street, Area..."
                       />
                    </div>
                 </div>
              </div>
            )}
          </div>
        </div>

        <div className="p-8 bg-white space-y-6 rounded-t-[40px] shadow-[0_-30px_60px_rgba(0,0,0,0.03)] shrink-0">
           <div id="recaptcha-container" className="flex justify-center mb-4 overflow-hidden rounded-xl"></div>
           
           <button 
             onClick={handleContinue} disabled={isProcessing}
             className="w-full py-7 bg-[#B0843D] text-white rounded-[24px] font-black uppercase tracking-[0.4em] text-[17px] shadow-[0_15px_40px_rgba(176,132,61,0.25)] hover:bg-[#967034] active:scale-[0.98] transition-all disabled:opacity-50"
           >
             {isProcessing ? "PROCESSING..." : "CONTINUE"}
           </button>
           
           <div className="text-center px-4">
              <span className="text-[11px] font-black text-gray-400 uppercase tracking-widest leading-relaxed">
                 By Selecting Continue, you grant adherence to Artisan Protocols
              </span>
           </div>
        </div>
      </div>

      <AnimatePresence>
        {showExitModal && (
          <div className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center p-4 sm:p-6 bg-black/60 backdrop-blur-sm">
             <motion.div initial={{ opacity: 0, scale: 0.95, y: 100 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 100 }} className="bg-white rounded-[40px] w-full max-w-md overflow-hidden p-8 space-y-8">
                <h2 className="text-3xl font-serif font-black italic text-[#310101]">Are you sure?</h2>
                <div className="gap-4 flex flex-col">
                    <button onClick={() => setShowExitModal(false)} className="w-full py-6 bg-black text-white rounded-[24px] font-black uppercase tracking-[0.3em] text-[11px]">Continue Shopping</button>
                    <button onClick={() => navigate("/")} className="w-full py-6 border-[2px] border-gray-100 text-[#310101]/40 rounded-[24px] font-black uppercase tracking-[0.3em] text-[11px]">Exit Checkout</button>
                </div>
             </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Checkout;
