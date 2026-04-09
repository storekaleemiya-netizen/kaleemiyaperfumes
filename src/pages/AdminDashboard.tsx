"use client";

import { useState, useEffect } from "react";
import { useProducts } from "@/hooks/useProducts";
import RevenueVelocity from "@/components/RevenueVelocity";
import { useAuth, SUPER_ADMIN_EMAILS } from "@/context/AuthContext";
import { db } from "@/lib/firebase";
import { 
  collection, 
  query, 
  where, 
  orderBy, 
  onSnapshot, 
  doc, 
  getDoc,
  updateDoc, 
  deleteDoc,
  writeBatch,
  setDoc,
  addDoc
} from "firebase/firestore";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Menu, X, PlusCircle, Edit2, Trash2, 
  LayoutDashboard, Package, ShoppingBag, 
  Users, Tag, Settings, Zap, ShieldAlert,
  Search, Filter, ChevronRight, LogOut,
  Bell, Calendar, ArrowUpRight, TrendingUp,
  FileText, Newspaper, Eye, CreditCard, Star,
  CheckCircle, Clock, ChevronDown, Loader2,
  Image, Send, Mail, Monitor, Smartphone
} from "lucide-react";
import { toast } from "sonner";

const AdminDashboard = () => {
  const { user, role, isSuperAdmin, logout } = useAuth();
  const [activeTab, setActiveTab] = useState("Dashboard");
  const [processingRequestId, setProcessingRequestId] = useState<string | null>(null);
  const [allInventory, setAllInventory] = useState<any[]>([]);
  const [inquiries, setInquiries] = useState<any[]>([]);
  const [systemHealth, setSystemHealth] = useState({
    db: "Checking...",
    cdn: "Checking...",
    api: "Checking..."
  });
  const [galleryItems, setGalleryItems] = useState<any[]>([]);
  const [isMediaLibraryOpen, setIsMediaLibraryOpen] = useState(false);
  const [mediaLibraryContext, setMediaLibraryContext] = useState<{ type: 'new' | 'edit', field: 'image' | 'extra', index?: number } | null>(null);
  const [heroSlides, setHeroSlides] = useState<any[]>([]);
  const [newHeroSlide, setNewHeroSlide] = useState({
    titleFirstLine: "",
    titleHighlight: "",
    titleLastLine: "",
    subtitle: "",
    buttonText: "Explore Collection",
    link: "/shop",
    image: "", // Desktop image
    mobileImage: "", // Mobile image
    order: 0,
    objectPosition: "top",
    displayMode: "cover",
    backgroundColor: "#0a0a0a",
    imageScale: 1,
    video: "",
    mobileVideo: ""
  });
  const [editingHeroSlide, setEditingHeroSlide] = useState<any>(null);
  const [isHeroUploading, setIsHeroUploading] = useState(false);
  const [heroImagePreview, setHeroImagePreview] = useState<string | null>(null);
  const [heroMobileImagePreview, setHeroMobileImagePreview] = useState<string | null>(null);
  const [heroVideoPreview, setHeroVideoPreview] = useState<string | null>(null);
  const [heroMobileVideoPreview, setHeroMobileVideoPreview] = useState<string | null>(null);

  useEffect(() => {
    const unsub = onSnapshot(query(collection(db, "hero_slides"), orderBy("order", "asc")), (snap) => {
      setHeroSlides(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    const checkSystems = async () => {
      // 1. Check DB (Simple Firestore ping)
      try {
        const testRef = doc(db, "metadata", "categories");
        await getDoc(testRef);
        setSystemHealth(prev => ({ ...prev, db: "Syncing" }));
      } catch (err) {
        setSystemHealth(prev => ({ ...prev, db: "Offline" }));
      }

      // 2. Check CDN (Cloudinary)
      try {
        const response = await fetch("https://res.cloudinary.com/demo/image/upload/sample.jpg", { mode: 'no-cors' });
        setSystemHealth(prev => ({ ...prev, cdn: "Optimal" }));
      } catch (err) {
        setSystemHealth(prev => ({ ...prev, cdn: "Latent" }));
      }
      
      // 3. API Simulation
      setSystemHealth(prev => ({ ...prev, api: "Optimal" }));
    };

    checkSystems();
    const interval = setInterval(checkSystems, 30000); // Check every 30s
    return () => clearInterval(interval);
  }, []);

  const [isSidebarOpen, setSidebarOpen] = useState(true);
  const [requestSearch, setRequestSearch] = useState("");
  
  const { 
    products: inventory, 
    loading: productsLoading, 
    addProduct, 
    updateProduct, 
    deleteProduct 
  } = useProducts();

  const { products } = useProducts();
  const bestsellers = products
    .filter(p => p.isLive !== false && p.isBestseller === true);

  const handleBootstrapCloud = async () => {
    // Widening check to allow any authenticated admin to bootstrap an empty inventory
    if (!user) {
      toast.error("Unauthorized: Please log in as an administrator.");
      return;
    }

    const initialData: any[] = [];

    const loadingId = toast.loading("Connecting to Cloud & Syncing Catalog...");
    try {
      const batch = writeBatch(db);
      initialData.forEach((item) => {
        const newRef = doc(collection(db, "products"));
        batch.set(newRef, { ...item, createdAt: new Date().toISOString() });
      });
      await batch.commit();
      toast.success("Signature Catalog Live!", { id: loadingId });
    } catch (err: any) {
      console.error("Migration Failed:", err);
      toast.error(`Database Error: ${err.message}`, { id: loadingId });
    }
  };

  const PAGE_SECTIONS = ["Main Store", "New Arrivals", "Featured", "Top Sellers", "Clearance"];

  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [editingProduct, setEditingProduct] = useState<any>(null);
  const [newProduct, setNewProduct] = useState({
    name: "",
    price: "",
    discountPrice: "",
    category: "Perfumes",
    image: "",
    description: "",
    isNew: false,
    isBestseller: false,
    highlights: ["", "", ""],
    specs: [{ label: "", value: "" }],
    stock: "50",
    section: "Main Store",
    subCategory: "Unisex",
    isLive: true,
    extraImages: ["", "", "", ""],
    video: ""
  });
  const [videoPreview, setVideoPreview] = useState<string | null>(null);
  const [filterCategory, setFilterCategory] = useState("All");
  const [isUploading, setIsUploading] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [inventorySearch, setInventorySearch] = useState("");
  const [debouncedInventorySearch, setDebouncedInventorySearch] = useState("");
  
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedInventorySearch(inventorySearch);
    }, 400); // 400ms Artisan Delay
    return () => clearTimeout(handler);
  }, [inventorySearch]);

  // Firestore Category Config
  const [globalCategories, setGlobalCategories] = useState<string[]>([]);
  const [subCategoriesConfig, setSubCategoriesConfig] = useState<Record<string, string[]>>({});

  // Firestore Real-time States
  const [allUsers, setAllUsers] = useState<any[]>([]);
  const [activeAdmins, setActiveAdmins] = useState<any[]>([]);
  const [adminRequests, setAdminRequests] = useState<any[]>([]);
  const [requestLogs, setRequestLogs] = useState<any[]>([]);
  const [news, setNews] = useState<any[]>([]);
  const [isNewsModalOpen, setIsNewsModalOpen] = useState(false);
  const [editingNews, setEditingNews] = useState<any>(null);
  const [newNews, setNewNews] = useState({ 
    title: "", 
    content: "", 
    category: "Announcement",
    startDate: "",
    endDate: "",
    targetCategory: "All",
    targetSubCategory: "All",
    discountPercent: "" 
  });
  const [allReviews, setAllReviews] = useState<any[]>([]);

  const [orders, setOrders] = useState([
    { 
      id: "ORD-7241", 
      customer: "Zaid Shaikh", 
      items: ["Oud Al Malikah", "Majestic Rose"], 
      qty: "2 Items", 
      payment: "Paid", 
      amount: "₹5,999", 
      status: "In Transit", 
      location: "Mumbai Central Hub — Sorting Center",
      history: [
        { time: "Yesterday, 10:00 AM", event: "Package arrived at Mumbai Hub" },
        { time: "Monday, 2:00 PM", event: "Dispatched from Warehouse" }
      ]
    },
    { 
      id: "ORD-7240", 
      customer: "Ayesha Ahmed", 
      items: ["Majestic Rose"], 
      qty: "1 Item", 
      payment: "Paid", 
      amount: "₹3,450", 
      status: "Delivered", 
      location: "Dubai Logistics Park — Out for Delivery",
      history: [
        { time: "Today, 04:30 PM", event: "Package Delivered" },
        { time: "Today, 09:00 AM", event: "Out for Delivery" }
      ]
    },
    { 
      id: "ORD-7239", 
      customer: "Omar Farooq", 
      items: ["Royal Bakhoor", "Sultan Blend", "Arabic Oud"], 
      qty: "3 Items", 
      payment: "Pending", 
      amount: "₹2,800", 
      status: "Pending", 
      location: "Warehouse — Awaiting Courier",
      history: [
        { time: "Just Now", event: "Order Received & Verified" }
      ]
    }
  ]);

  const handleUpdateOrderStatus = (orderId: string, newStatus: string) => {
    setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: newStatus } : o));
    if (selectedOrder?.id === orderId) {
      setSelectedOrder((prev: any) => ({ ...prev, status: newStatus }));
    }
    toast.success(`Order ${orderId} updated to ${newStatus}`);
  };

  // Real-time listener for database categories
  useEffect(() => {
    const unsub = onSnapshot(doc(db, "metadata", "categories"), (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        setGlobalCategories(data.list || []);
        setSubCategoriesConfig(data.subs || {});
      } else {
        const defaults = ["Perfumes", "Attar", "Oud", "Bakhoor", "Gift Sets", "Quran Box", "Tasbhi", "Prayer mats", "Books"];
        const defaultSubs: Record<string, string[]> = {
          "Perfumes": ["Men", "Women", "Unisex", "French", "Arabic", "Concentrated"],
          "Attar": ["Perfumes", "Spraybottle", "Bakhur", "Agarsetti", "Agarbatti"],
          "Oud": ["Cambodi", "Assami", "Indian", "Malaysian"],
          "Bakhoor": ["Spray Bottle", "Tablets", "Loose Wood", "Incense Sticks"],
          "Gift Sets": ["Bukhur Dan", "Quran Box", "Tasbeeh", "Luxury Boxes"],
          "Quran Box": ["Luxury Edition", "Travel Case", "Wooden Box", "Velvet Box"],
          "Tasbhi": ["Crystal", "Wooden", "Digital", "Stone"],
          "Prayer mats": ["Janimaaz", "Children Janimaaz", "Velvet", "Travel"],
          "Books": ["English", "Urdu", "Roman", "Holy Quran", "Hadith"],
        };
        setDoc(doc(db, "metadata", "categories"), { list: defaults, subs: defaultSubs });
      }
    });
    return () => unsub();
  }, []);

  // Real-time listener for all reviews
  useEffect(() => {
    const q = query(collection(db, "reviews"));
    const unsub = onSnapshot(q, (snap) => {
      const fetched = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      // Sort client-side to avoid index requirements
      fetched.sort((a: any, b: any) => {
        const dateA = a.createdAt?.toDate() || new Date(0);
        const dateB = b.createdAt?.toDate() || new Date(0);
        return dateB.getTime() - dateA.getTime();
      });
      setAllReviews(fetched);
    });
    return () => unsub();
  }, []);

  // Real-time listener for gallery images 
  useEffect(() => {
    const q = query(collection(db, "gallery"));
    const unsub = onSnapshot(q, (snap) => {
      const fetched = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      fetched.sort((a: any, b: any) => {
        const dateA = new Date(a.createdAt || 0);
        const dateB = new Date(b.createdAt || 0);
        return dateB.getTime() - dateA.getTime();
      });
      setGalleryItems(fetched);
    });
    return () => unsub();
  }, []);

  // Real-time listener for admin requests (only for super_admin)
  useEffect(() => {
    if (isSuperAdmin) {
      const q = query(
        collection(db, "adminRequests"), 
        where("status", "==", "pending")
      );
      const unsub = onSnapshot(q, (snap) => {
        setAdminRequests(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      });

      const newsQ = query(collection(db, "news"), orderBy("date", "desc"));
      const unsubNews = onSnapshot(newsQ, (snap) => {
        setNews(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      });

      const adminsQ = query(
        collection(db, "users"),
        where("role", "in", ["admin", "super_admin"])
      );
      const unsubAdmins = onSnapshot(adminsQ, (snapshot) => {
        setActiveAdmins(snapshot.docs
          .map(doc => ({ id: doc.id, ...doc.data() }))
          .filter(admin => admin.id !== user?.uid)
        );
      });

      const usersQ = query(collection(db, "users"));
      const unsubUsers = onSnapshot(usersQ, (snapshot) => {
        setAllUsers(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      });

      const logQ = query(
        collection(db, "adminRequests"), 
        where("status", "!=", "pending")
      );
      const unsubLogs = onSnapshot(logQ, (snapshot) => {
        setRequestLogs(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      });

      const inqQ = query(collection(db, "inquiries"), orderBy("createdAt", "desc"));
      const unsubInq = onSnapshot(inqQ, (snapshot) => {
        setInquiries(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      });

      // --- HIGH TRAFFIC OPTIMIZATION: Separate stats listener ---
      const allProdQ = query(collection(db, "products"));
      const unsubAll = onSnapshot(allProdQ, (snapshot) => {
        setAllInventory(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      });

      return () => {
        unsub();
        unsubAdmins();
        unsubUsers();
        unsubNews();
        unsubLogs();
        unsubInq();
        unsubAll();
      };
    }
  }, [role, isSuperAdmin, user?.uid]);

  const [storeSettings, setStoreSettings] = useState<any>({
    name: "Kaleemiya Perfumes",
    email: "contact@kaleemiya.com",
    currency: "INR (\u20B9)",
    maintenanceMode: false,
    accentColor: "#B0843D",
    publicLivePage: true,
    protectedMode: true,
    checkoutPromo: "FREE GIFT ON ALL PREPAID ORDERS",
    rotateAnnouncements: true
  });

  // Pull settings from Firestore on first load
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const snap = await getDoc(doc(db, "metadata", "settings"));
        if (snap.exists()) {
          setStoreSettings(snap.data());
        }
      } catch (e) {
        console.error("Failed to load global settings:", e);
      }
    };
    fetchSettings();
  }, []);

  useEffect(() => {
    localStorage.setItem("kaleemiya_store_settings", JSON.stringify(storeSettings));
    window.dispatchEvent(new CustomEvent("kaleemiya_settings_updated"));
  }, [storeSettings]);

  const [promptData, setPromptData] = useState<{isOpen: boolean, title: string, placeholder: string, value: string, onConfirm: (val: string) => void}>({isOpen: false, title: "", placeholder: "", value: "", onConfirm: () => {}});

  if (productsLoading) {
    return (
      <div className="min-h-screen bg-[#FDFCFB] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-12 h-12 text-[#310101] animate-spin opacity-20" />
          <p className="text-[15px] font-black uppercase tracking-[0.3em] text-[#310101]/90">Initialising Signature Engine...</p>
        </div>
      </div>
    );
  }

  const allSections = Array.from(new Set([
    ...PAGE_SECTIONS,
    ...inventory.map((p: any) => p.section).filter(Boolean)
  ]));

  const allCategories = Array.from(new Set([
    "Our Bestseller",
    "New Arrival",
    ...globalCategories.map(c => c.trim()),
    ...inventory.map(p => (p.category || "").trim())
  ])).filter(Boolean);

  const dynamicSubCategories: Record<string, string[]> = {};
  allCategories.forEach(cat => {
    // Correct case-insensitive lookup
    const matchingKey = Object.keys(subCategoriesConfig).find(
      k => k.toLowerCase() === cat.toLowerCase()
    );
    const savedSubs = matchingKey ? subCategoriesConfig[matchingKey] : [];
    
    const fromInventory = inventory
      .filter(p => (p.category || "").toLowerCase() === cat.toLowerCase())
      .map(p => p.subCategory)
      .filter(Boolean);
    
    const uniqueSubs = Array.from(new Set([...savedSubs, ...fromInventory]));
    dynamicSubCategories[cat] = uniqueSubs.map(s => s.charAt(0).toUpperCase() + s.slice(1));
    if (dynamicSubCategories[cat].length === 0) dynamicSubCategories[cat] = ["General"];
  });

  const handleAddCategory = () => {
    setPromptData({
      isOpen: true,
      title: "Add New Category",
      placeholder: "Enter new category name...",
      value: "",
      onConfirm: async (val: string) => {
        if (val.trim()) {
           const formatted = val.trim().charAt(0).toUpperCase() + val.trim().slice(1);
           if (!globalCategories.includes(formatted)) {
             await setDoc(doc(db, "metadata", "categories"), {
               list: [...globalCategories, formatted],
               subs: subCategoriesConfig
             }, { merge: true });
             toast.success("Category saved to database!");
           }
        }
        setPromptData(prev => ({ ...prev, isOpen: false }));
      }
    });
  };

  const handleAddSubCategory = (parentCat: string) => {
    setPromptData({
      isOpen: true,
      title: `Add Sub-category to "${parentCat}"`,
      placeholder: "Enter new sub-category name...",
      value: "",
      onConfirm: async (val: string) => {
        if (val.trim()) {
          const formatted = val.trim().charAt(0).toUpperCase() + val.trim().slice(1);
          const currentSubs = subCategoriesConfig[parentCat] || [];
          if (!currentSubs.includes(formatted)) {
            const updatedSubs = { ...subCategoriesConfig, [parentCat]: [...currentSubs, formatted] };
            await setDoc(doc(db, "metadata", "categories"), {
              list: globalCategories,
              subs: updatedSubs
            }, { merge: true });
            toast.success(`Sub-category added to ${parentCat}!`);
          }
        }
        setPromptData(prev => ({ ...prev, isOpen: false }));
      }
    });
  };

  const handleEditCategory = (oldCat: string) => {
    if (["Our Bestseller", "New Arrival"].includes(oldCat)) {
      toast.error(`${oldCat} is a system category and cannot be edited.`);
      return;
    }
    setPromptData({
      isOpen: true,
      title: `Rename Category "${oldCat}"`,
      placeholder: "Enter new category name...",
      value: oldCat,
      onConfirm: async (val: string) => {
        if (val.trim() && val.trim() !== oldCat) {
          const formatted = val.trim().charAt(0).toUpperCase() + val.trim().slice(1);
          if (globalCategories.includes(formatted)) {
            toast.error("This category already exists.");
            return;
          }
          const newGlobal = globalCategories.map(c => c === oldCat ? formatted : c);
          const newSubs = { ...subCategoriesConfig };
          if (newSubs[oldCat]) {
            newSubs[formatted] = newSubs[oldCat];
            delete newSubs[oldCat];
          }
          await setDoc(doc(db, "metadata", "categories"), {
            list: newGlobal,
            subs: newSubs
          }, { merge: true });
          toast.success(`Category renamed to "${formatted}".`);
        }
        setPromptData(prev => ({ ...prev, isOpen: false }));
      }
    });
  };

  const handleEditSubCategory = (parentCat: string, oldSub: string) => {
    if (["General"].includes(oldSub)) {
      toast.error(`"${oldSub}" is a system sub-category and cannot be edited.`);
      return;
    }
    setPromptData({
      isOpen: true,
      title: `Rename Sub-category "${oldSub}"`,
      placeholder: "Enter new sub-category name...",
      value: oldSub,
      onConfirm: async (val: string) => {
        if (val.trim() && val.trim() !== oldSub) {
          const formatted = val.trim().charAt(0).toUpperCase() + val.trim().slice(1);
          const currentSubs = subCategoriesConfig[parentCat] || [];
          if (currentSubs.includes(formatted)) {
             toast.error(`"${formatted}" already exists in ${parentCat}.`);
             return;
          }
          const updatedSubs = { ...subCategoriesConfig, [parentCat]: currentSubs.map(s => s === oldSub ? formatted : s) };
          await setDoc(doc(db, "metadata", "categories"), {
            list: globalCategories,
            subs: updatedSubs
          }, { merge: true });
          toast.success(`Sub-category renamed to "${formatted}".`);
        }
        setPromptData(prev => ({ ...prev, isOpen: false }));
      }
    });
  };

  const handleDeleteCategory = async (catName: string) => {
    if (["Our Bestseller", "New Arrival"].includes(catName)) {
      toast.error(`${catName} is a system category and cannot be deleted.`);
      return;
    }
    
    if (inventory.some(p => p.category?.toLowerCase() === catName.toLowerCase())) {
      toast.error(`Cannot delete ${catName}. It has active products assigned.`);
      return;
    }
    
    if (confirm(`Are you sure you want to delete the category "${catName}"?`)) {
      const newGlobal = globalCategories.filter(c => c !== catName);
      const newSubs = { ...subCategoriesConfig };
      delete newSubs[catName];
      
      try {
        await setDoc(doc(db, "metadata", "categories"), {
          list: newGlobal,
          subs: newSubs
        }, { merge: true });
        toast.success(`Category "${catName}" removed.`);
      } catch (err: any) {
        toast.error(err.message);
      }
    }
  };

  const handleDeleteSubCategory = async (parentCat: string, subName: string) => {
    if (inventory.some(p => p.category?.toLowerCase() === parentCat.toLowerCase() && p.subCategory?.toLowerCase() === subName.toLowerCase())) {
      toast.error(`Cannot delete "${subName}". It has active products assigned.`);
      return;
    }

    if (confirm(`Remove sub-category "${subName}" from ${parentCat}?`)) {
      const parentSubs = subCategoriesConfig[parentCat] || [];
      const newParentSubs = parentSubs.filter(s => s !== subName);
      
      try {
        await setDoc(doc(db, "metadata", "categories"), {
          list: globalCategories,
          subs: { ...subCategoriesConfig, [parentCat]: newParentSubs }
        }, { merge: true });
        toast.success(`Sub-category "${subName}" removed.`);
      } catch (err: any) {
        toast.error(err.message);
      }
    }
  };

  const handleSyncDefaults = async () => {
    const defaults = ["Perfumes", "Attar", "Oud", "Bakhoor", "Gift Sets", "Tasbhi", "Prayer mats", "Books"];
    const defaultSubs: Record<string, string[]> = {
      "Perfumes": ["Men", "Women", "Unisex", "French", "Arabic", "Concentrated"],
      "Attar": ["Perfumes", "Spraybottle", "Bakhur", "Agarsetti", "Agarbatti"],
      "Oud": ["Cambodi", "Assami", "Indian", "Malaysian"],
      "Bakhoor": ["Spray Bottle", "Tablets", "Loose Wood", "Incense Sticks"],
      "Gift Sets": ["Bukhur Dan", "Quran Book", "Tasbeeh", "Luxury Boxes"],
      "Tasbhi": ["Crystal", "Wooden", "Digital", "Stone"],
      "Prayer mats": ["Janimaaz", "Children Janimaaz", "Velvet", "Travel"],
      "Books": ["English", "Urdu", "Roman", "Quran", "Hadith"],
    };
    try {
      await setDoc(doc(db, "metadata", "categories"), { list: defaults, subs: defaultSubs });
      toast.success("Categories & Sub-categories Synced!");
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const filteredRequests = adminRequests.filter(req => {
    const term = requestSearch.toLowerCase();
    const nameMatch = req.name ? req.name.toLowerCase().includes(term) : false;
    const emailMatch = req.email ? req.email.toLowerCase().includes(term) : false;
    return nameMatch || emailMatch;
  });

  const handleUpdateHeroSlide = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingHeroSlide) return;
    try {
      const slideRef = doc(db, "hero_slides", editingHeroSlide.id);
      const { id, ...data } = editingHeroSlide;
      await updateDoc(slideRef, data);
      setEditingHeroSlide(null);
      toast.success("Flagship Slide Updated!");
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const handleEditHeroClick = (slide: any) => {
    setEditingHeroSlide(slide);
    setHeroImagePreview(slide.image || null);
    setHeroMobileImagePreview(slide.mobileImage || null);
    setHeroVideoPreview(slide.video || null);
    setHeroMobileVideoPreview(slide.mobileVideo || null);
    // Scroll to form or open modal logic
    const element = document.getElementById("hero-admin-form");
    if (element) element.scrollIntoView({ behavior: 'smooth' });
    else {
      // If no ID, at least scroll up
      window.scrollTo({ top: 300, behavior: 'smooth' });
    }
  };

  const handleHeroMediaChange = async (e: React.ChangeEvent<HTMLInputElement>, targetView: 'desktop' | 'mobile' = 'desktop') => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    const isVideo = file.type.startsWith('video/');
    const previewUrl = URL.createObjectURL(file);

    // Validation removed as per user request for absolute flexibility
    const isValid = true;

    if (targetView === 'desktop') {
      if (isVideo) {
        setHeroVideoPreview(previewUrl);
        setHeroImagePreview(null);
      } else {
        setHeroImagePreview(previewUrl);
        setHeroVideoPreview(null);
      }
    } else {
      if (isVideo) {
        setHeroMobileVideoPreview(previewUrl);
        setHeroMobileImagePreview(null);
      } else {
        setHeroMobileImagePreview(previewUrl);
        setHeroMobileVideoPreview(null);
      }
    }

    setIsHeroUploading(true);
    const loadingId = toast.loading(`Synchronizing ${targetView} media...`);
    try {
      const { uploadToCloudinary } = await import("@/utils/cloudinary");
      const cloudUrl = await uploadToCloudinary(file);
      
      const updateData: any = {};
      if (targetView === 'desktop') {
        if (isVideo) {
          updateData.video = cloudUrl;
          updateData.image = "";
        } else {
          updateData.image = cloudUrl;
          updateData.video = "";
        }
      } else {
        if (isVideo) {
          updateData.mobileVideo = cloudUrl;
          updateData.mobileImage = "";
        } else {
          updateData.mobileImage = cloudUrl;
          updateData.mobileVideo = "";
        }
      }
      
      if (editingHeroSlide) {
        setEditingHeroSlide((prev: any) => ({ ...prev, ...updateData }));
      } else {
        setNewHeroSlide((prev: any) => ({ ...prev, ...updateData }));
      }
      toast.success(`${targetView.charAt(0).toUpperCase() + targetView.slice(1)} media synchronized!`, { id: loadingId });
    } catch (err: any) {
      toast.error(err.message, { id: loadingId });
    } finally {
      setIsHeroUploading(false);
    }
  };

  const handleAddHeroSlide = async (e: React.FormEvent) => {
    e.preventDefault();
    const hasAnyMedia = newHeroSlide.image || newHeroSlide.video || newHeroSlide.mobileImage || newHeroSlide.mobileVideo;
    if (!hasAnyMedia) {
      toast.error("Waiting for flagship or mobile media upload...");
      return;
    }
    try {
      const slideData = { ...newHeroSlide, createdAt: new Date().toISOString() };
      await addDoc(collection(db, "hero_slides"), slideData);
      setNewHeroSlide({
        titleFirstLine: "",
        titleHighlight: "",
        titleLastLine: "",
        subtitle: "",
        buttonText: "",
        link: "/shop",
        image: "",
        mobileImage: "",
        order: heroSlides.length,
        objectPosition: "top",
        displayMode: "cover",
        backgroundColor: "#0a0a0a",
        imageScale: 1,
        video: "",
        mobileVideo: ""
      });
      setHeroImagePreview(null);
      setHeroMobileImagePreview(null);
      setHeroVideoPreview(null);
      setHeroMobileVideoPreview(null);
      toast.success("New Hero Slide Integrated!");
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const handleDeleteHeroSlide = async (id: string) => {
    if (confirm("ARCHIVE FLAGSHIP SLIDE? This action is permanent.")) {
      try {
        await deleteDoc(doc(db, "hero_slides", id));
        toast.success("Hero Slide Archived.");
      } catch (err: any) {
        toast.error(err.message);
      }
    }
  };

  const handleApproveReq = async (requestId: string, uid: string, name: string) => {
    if (!isSuperAdmin || processingRequestId) return;
    setProcessingRequestId(requestId);
    try {
       const { getFunctions, httpsCallable } = await import("firebase/functions");
       const functions = getFunctions();
       const processRequest = httpsCallable(functions, 'processAdminRequest');
       
       const loadingId = toast.loading(`Granting authority to ${name}...`);
       
       await processRequest({ 
         requestId, 
         targetUid: uid, 
         action: "approve" 
       });

       toast.success(`Access granted for ${name}.`, { id: loadingId });
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setProcessingRequestId(null);
    }
  };

  const handleDenyReq = async (requestId: string, name: string) => {
    if (!isSuperAdmin || processingRequestId) return;
    setProcessingRequestId(requestId);
    try {
      const { getFunctions, httpsCallable } = await import("firebase/functions");
      const functions = getFunctions();
      const processRequest = httpsCallable(functions, 'processAdminRequest');
      
      const loadingId = toast.loading(`Refusing request for ${name}...`);
      
      await processRequest({ 
        requestId, 
        action: "reject" 
      });

      toast.success(`Request for ${name} rejected.`, { id: loadingId });
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setProcessingRequestId(null);
    }
  };

  const handleDeleteUser = async (userId: string, name: string, email: string) => {
    if (!isSuperAdmin) return;
    const isWhitelisted = SUPER_ADMIN_EMAILS.includes(email?.toLowerCase() || "");
    if (isWhitelisted) {
      toast.error("Critical Security Alert: Whitelisted Super Admins cannot be deleted.");
      return;
    }
    if (!window.confirm(`WARNING: Permanent Delete ${name}?`)) return;
    try {
      await deleteDoc(doc(db, "users", userId));
      toast.success(`User ${name} removed.`);
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      toast.success("Signed out successfully");
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const StatCard = ({ title, value, icon: Icon, trend }: any) => (
    <div className="bg-white p-6 md:p-10 rounded-[35px] md:rounded-[45px] shadow-sm border border-gray-100 hover:shadow-2xl transition-all duration-500 group relative overflow-hidden">
      <div className="absolute top-0 right-0 w-32 h-32 bg-[#B0843D] opacity-0 group-hover:opacity-[0.05] rounded-full -mr-16 -mt-16 transition-all duration-700"></div>
      <div className="flex justify-between items-start mb-6 md:mb-8">
        <div className="p-4 md:p-5 bg-[#F9F6F2] rounded-[20px] md:rounded-[24px] group-hover:bg-[#310101] group-hover:text-white transition-colors duration-500 border border-[#E5D5C5]/40 shadow-sm text-[#310101]">
          <Icon className="w-6 h-6 md:w-8 md:h-8" />
        </div>
        {trend && (
          <div className="flex items-center gap-2 bg-green-50 px-3 py-1.5 md:px-4 md:py-2 rounded-full border border-green-100">
            <TrendingUp className="w-3 h-3 md:w-4 md:h-4 text-green-600" />
            <span className="text-[10px] md:text-[14px] font-black text-green-700 uppercase tracking-widest">{trend}</span>
          </div>
        )}
      </div>
      <div>
        <p className="text-[11px] md:text-[14px] font-black text-[#310101]/60 uppercase tracking-[0.2em] md:tracking-[0.3em] mb-1 md:mb-2">{title}</p>
        <p className="text-3xl md:text-5xl font-serif font-black text-[#310101] tracking-tighter italic">{value}</p>
      </div>
    </div>
  );

  const sidebarTabs = [
    { title: "Dashboard", icon: LayoutDashboard },
    { title: "Manage Stock", icon: Package },
    { title: "Store Gallery", icon: Image },
    { title: "Signature News and Announcements", icon: Newspaper },
    { title: "New Desk", icon: PlusCircle }, 
    { title: "Orders", icon: ShoppingBag },
    { title: "Clientele", icon: Users },
    { title: "Categories", icon: Tag },
    { title: "Hero Slider", icon: Calendar },
    ...(isSuperAdmin ? [{ title: "Admin Requests", icon: Zap }] : []),
    { title: "Customer Messages", icon: Mail },
    { title: "Settings", icon: Settings },
    { title: "Company Reviews", icon: Star },
  ];

  const filteredProducts = (inventory || []).filter(p => {
    let matchesCategory = false;
    const catSearch = filterCategory.trim().toUpperCase();
    if (catSearch === "ALL" || catSearch === "FULL COLLECTION") {
      matchesCategory = true;
    } else if (catSearch === "OUR BESTSELLER") {
      matchesCategory = p.isBestseller === true;
    } else if (catSearch === "NEW ARRIVAL") {
      matchesCategory = p.isNew === true;
    } else {
      matchesCategory = (p.category || "").trim().toLowerCase() === filterCategory.trim().toLowerCase();
    }

    const matchesSearch = (p.name || "").toLowerCase().includes(debouncedInventorySearch.toLowerCase()) || 
                          (p.category || "").toLowerCase().includes(debouncedInventorySearch.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImagePreview(URL.createObjectURL(file));
    setImageFile(file);
    setIsUploading(true);
    try {
      const { uploadToCloudinary } = await import("@/utils/cloudinary");
      const cloudUrl = await uploadToCloudinary(file);
      if (editingProduct) setEditingProduct((prev: any) => ({ ...prev, image: cloudUrl }));
      else setNewProduct((prev: any) => ({ ...prev, image: cloudUrl }));
      toast.success("Media uploaded!");
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setIsUploading(false);
    }
  };

  const handleVideoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setVideoPreview(URL.createObjectURL(file));
    setIsUploading(true);
    const loadingId = toast.loading("Processing Signature video...");
    try {
      const { uploadToCloudinary } = await import("@/utils/cloudinary");
      const cloudUrl = await uploadToCloudinary(file);
      if (editingProduct) setEditingProduct((prev: any) => ({ ...prev, video: cloudUrl }));
      else setNewProduct((prev: any) => ({ ...prev, video: cloudUrl }));
      toast.success("Signature video synchronized!", { id: loadingId });
    } catch (err: any) {
      toast.error(err.message, { id: loadingId });
    } finally {
      setIsUploading(false);
    }
  };

  const handleExtraImageChange = async (e: React.ChangeEvent<HTMLInputElement>, index: number) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploading(true);
    try {
      const { uploadToCloudinary } = await import("@/utils/cloudinary");
      const cloudUrl = await uploadToCloudinary(file);
      if (editingProduct) {
        const newExtras = [...(editingProduct.extraImages || ["", "", "", ""])];
        newExtras[index] = cloudUrl;
        setEditingProduct((prev: any) => ({ ...prev, extraImages: newExtras }));
      } else {
        const newExtras = [...(newProduct.extraImages || ["", "", "", ""])];
        newExtras[index] = cloudUrl;
        setNewProduct((prev: any) => ({ ...prev, extraImages: newExtras }));
      }
      toast.success(`Gallery Image ${index + 1} synchronized!`);
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setIsUploading(false);
    }
  };

  const handleResetNewProduct = () => {
    setNewProduct({
      name: "", price: "", discountPrice: "", category: "Perfumes", image: "", description: "",
      isNew: false, isBestseller: false, highlights: ["", "", ""],
      specs: [{ label: "", value: "" }], stock: "50", section: "Main Store",
      subCategory: "Unisex", isLive: true,
      extraImages: ["", "", "", ""],
      video: ""
    });
    setImageFile(null);
    setImagePreview(null);
    setVideoPreview(null);
  };

  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProduct.name) { toast.error("Please enter a Perfume Name at the top."); return; }
    if (!newProduct.price) { toast.error("Please enter a Retail Price."); return; }
    if (!newProduct.image) { toast.error("Waiting for image to upload... Please try again in a moment."); return; }
    try {
      const stockNum = parseInt(newProduct.stock) || 0;
      
      await addProduct({
        ...newProduct,
        price: `\u20B9${parseInt(newProduct.price).toLocaleString()}`,
        numericPrice: parseInt(newProduct.price),
        stock: stockNum,
        status: stockNum > 10 ? "In Stock" : stockNum > 0 ? "Low Stock" : "Out of Stock",
      } as any);
      handleResetNewProduct();
      setActiveTab("Manage Stock");
      toast.success("Product published!");
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const handleDeleteProduct = (id: string) => {
    if (confirm("Remove this product?")) {
      deleteProduct(id);
      toast.error("Product removed.");
    }
  };

  const handleUpdateProduct = (e: React.FormEvent) => {
    e.preventDefault();
    const stockNum = parseInt(editingProduct.stock) || 0;
    updateProduct({
      ...editingProduct,
      price: `\u20B9${parseInt(editingProduct.price).toLocaleString()}`,
      numericPrice: parseInt(editingProduct.price),
      stock: stockNum,
      status: stockNum > 10 ? "In Stock" : stockNum > 0 ? "Low Stock" : "Out of Stock",
    });
    toast.success("Product updated!");
    setEditingProduct(null);
  };

  const handleGalleryUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploading(true);
    const loadingId = toast.loading("Uploading to Gallery...");
    try {
      const { uploadToCloudinary } = await import("@/utils/cloudinary");
      const cloudUrl = await uploadToCloudinary(file);
      await addDoc(collection(db, "gallery"), {
        src: cloudUrl,
        alt: "Kaleemiya Signature Story",
        createdAt: new Date().toISOString(),
        order: galleryItems.length
      });
      toast.success("Image added to World of Kaleemiya!", { id: loadingId });
    } catch (err: any) {
      toast.error(err.message, { id: loadingId });
    } finally {
      setIsUploading(false);
    }
  };

  const handleDeleteGalleryItem = async (id: string) => {
    if (confirm("Permanently remove this photo from the library?")) {
      try {
        await deleteDoc(doc(db, "gallery", id));
        toast.success("Photo removed from gallery.");
      } catch (err: any) {
        toast.error(err.message);
      }
    }
  };

  const handleAddNews = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await addDoc(collection(db, "news"), {
        ...newNews,
        date: new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "long", year: "numeric" }),
        timestamp: new Date().getTime()
      });
      setIsNewsModalOpen(false);
      setNewNews({ 
        title: "", content: "", category: "Announcement", startDate: "", endDate: "",
        targetCategory: "All", targetSubCategory: "All", discountPercent: ""
      });
      toast.success("Bulletin published!");
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const handleUpdateNews = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const newsRef = doc(db, "news", editingNews.id);
      const { id, ...data } = editingNews;
      await updateDoc(newsRef, data);
      setIsNewsModalOpen(false);
      setEditingNews(null);
      toast.success("Broadcast updated!");
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const handleDeleteNews = async (id: string) => {
    if (confirm("Remove this bulletin?")) {
      await deleteDoc(doc(db, "news", id));
      toast.error("Bulletin removed.");
    }
  };

  const handleDeleteReview = async (id: string) => {
    if (confirm("Permanently remove this reflection from the Signature?")) {
      try {
        await deleteDoc(doc(db, "reviews", id));
        toast.success("Review removed.");
      } catch (err: any) {
        toast.error(err.message);
      }
    }
  };


  const handleSelectFromLibrary = (imageUrl: string) => {
    if (!mediaLibraryContext) return;

    if (mediaLibraryContext.type === 'new') {
      if (mediaLibraryContext.field === 'image') {
        setNewProduct(prev => ({ ...prev, image: imageUrl }));
        setImagePreview(imageUrl);
      } else if (mediaLibraryContext.field === 'extra' && typeof mediaLibraryContext.index === 'number') {
        const newExtras = [...(newProduct.extraImages || ["", "", "", ""])];
        newExtras[mediaLibraryContext.index] = imageUrl;
        setNewProduct(prev => ({ ...prev, extraImages: newExtras }));
      }
    } else {
      if (mediaLibraryContext.field === 'image') {
        setEditingProduct((prev: any) => ({ ...prev, image: imageUrl }));
      } else if (mediaLibraryContext.field === 'extra' && typeof mediaLibraryContext.index === 'number') {
        const newExtras = [...(editingProduct.extraImages || ["", "", "", ""])];
        newExtras[mediaLibraryContext.index] = imageUrl;
        setEditingProduct((prev: any) => ({ ...prev, extraImages: newExtras }));
      }
    }
    setIsMediaLibraryOpen(false);
    setMediaLibraryContext(null);
    toast.success("Media selected from library");
  };

  const allMediaUrls = Array.from(new Set([
    ...(inventory?.map(p => p.image) || []),
    ...(inventory?.flatMap(p => p.extraImages || []) || []),
    ...(galleryItems?.map(g => g.src) || [])
  ])).filter(url => url && typeof url === 'string' && url.startsWith('http'));

  return (
    <div className="min-h-screen bg-[#FDFCFB] flex font-sans overflow-x-hidden w-full relative">
      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 lg:hidden" 
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed inset-y-0 left-0 z-50 bg-[#310101] text-white transition-all duration-300 flex flex-col shrink-0 shadow-2xl h-screen
        ${isSidebarOpen ? "translate-x-0 w-64" : "-translate-x-full lg:translate-x-0 lg:w-20"}
        lg:sticky lg:top-0
      `}>
        <div className="p-4 border-b border-white/5 flex items-center justify-between">
          {isSidebarOpen && (
            <img 
              src="/logo.png" 
              alt="Kaleemiya Logo" 
              className="h-10 w-auto object-contain drop-shadow-xl" 
            />
          )}
          <button onClick={() => setSidebarOpen(!isSidebarOpen)} className="p-1.5 hover:bg-white/10 rounded-lg">
            <Menu className="w-5 h-5 text-[#E5D5C5]" />
          </button>
        </div>
        <nav className="flex-1 py-4 lg:py-6 px-3 lg:px-4 space-y-0.5 lg:space-y-1 overflow-y-auto custom-scrollbar">
          {sidebarTabs.map((tab) => (
            <button 
              key={tab.title} 
              onClick={() => setActiveTab(tab.title)} 
              className={`w-full flex items-center gap-2.5 lg:gap-3 px-3 py-2.5 lg:px-4 lg:py-3 rounded-lg lg:rounded-xl transition-all duration-300 ${activeTab === tab.title ? "bg-[#F9F6F2] text-[#310101] shadow-lg scale-[1.01]" : "hover:bg-white/5 text-white/50"}`}
            >
              <tab.icon className={`w-3.5 h-3.5 lg:w-5 lg:h-5 shrink-0 transition-colors ${activeTab === tab.title ? "text-[#310101]" : "text-[#E5D5C5]/60"}`} />
              {isSidebarOpen && (
                <span className="text-[10px] sm:text-[11px] lg:text-[13px] font-black uppercase tracking-[0.05em] text-left leading-none">
                  {tab.title === "Signature News and Announcements" ? "Broadcasts" : tab.title}
                </span>
              )}
            </button>
          ))}
        </nav>
        <div className="p-4 mt-12 mb-10">
          {isSidebarOpen && (
             <div className="px-2 pt-4 lg:pt-6 border-t border-white/10 mb-4 lg:mb-6">
                <p className="text-[9px] lg:text-[10px] font-black uppercase tracking-[0.3em] text-[#E5D5C5]/40 mb-3 lg:mb-4">Platform</p>
                <button 
                  onClick={() => window.location.href = "/"} 
                  className="w-full flex items-center gap-3 lg:gap-4 px-4 py-3 lg:px-6 lg:py-4 rounded-xl lg:rounded-2xl bg-white/5 hover:bg-white/10 transition-all text-white border border-white/5 shadow-xl group"
                >
                  <Eye className="w-4 h-4 lg:w-5 lg:h-5 text-[#E5D5C5] shrink-0 group-hover:scale-110 transition-transform" />
                  <span className="text-[10px] sm:text-[11px] lg:text-[14px] font-black uppercase tracking-[0.2em]">Main Portal</span>
                </button>
             </div>
          )}

          <div className="px-2">
             {isSidebarOpen ? (
               <div className="bg-white/5 rounded-xl lg:rounded-[25px] p-3 lg:p-5 border border-white/5 flex items-center gap-3 lg:gap-4 shadow-xl">
                  <div className="w-8 h-8 lg:w-12 lg:h-12 rounded-full bg-[#B0843D] flex items-center justify-center font-serif italic text-sm lg:text-xl font-bold text-white shadow-lg shrink-0">
                    {user?.displayName?.charAt(0) || user?.email?.charAt(0) || "K"}
                  </div>
                  <div className="flex-1 overflow-hidden">
                     <p className="text-[12px] lg:text-[18px] font-black uppercase tracking-tight text-white leading-tight truncate">
                        {user?.displayName || "Authorized User"}
                     </p>
                     <div className="flex items-center gap-1.5 mt-0.5">
                        <div className="w-1.5 h-1.5 lg:w-2 lg:h-2 rounded-full bg-green-400 animate-pulse" />
                        <span className="text-[8px] lg:text-[10px] font-black uppercase tracking-[0.1em] text-green-400">Authorized</span>
                     </div>
                  </div>
               </div>
             ) : (
                <button onClick={() => window.location.href = "/"} className="p-3 bg-white/5 rounded-xl text-[#E5D5C5] mx-auto block"><Eye className="w-5 h-5" /></button>
             )}
          </div>
        </div>

        <div className="p-4 mt-auto border-t border-white/10 pt-4 lg:pt-6">
          {isSidebarOpen ? (
            <button
               onClick={async () => { await logout(); window.location.href = "/"; }}
               className="w-full flex items-center justify-center gap-3 lg:gap-4 px-4 py-3 lg:px-8 lg:py-5 rounded-xl lg:rounded-2xl bg-white text-[#310101] hover:bg-red-500 hover:text-white transition-all duration-300 shadow-2xl font-black uppercase tracking-[0.1em] text-[10px] lg:text-[12px]"
            >
               <LogOut className="w-3.5 h-3.5 lg:w-4 lg:h-4" />
               Sign Out Account
            </button>
          ) : (
            <button onClick={async () => { await logout(); window.location.href = "/"; }} className="p-3 bg-white rounded-xl text-[#310101] mx-auto block"><LogOut className="w-5 h-5" /></button>
          )}
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden relative w-full min-w-0">
        <header className="bg-white/80 backdrop-blur-md border-b h-14 flex items-center justify-between px-4 md:px-6 shrink-0 shadow-sm z-30">
          <div className="flex items-center gap-2">
            <button 
              onClick={() => setSidebarOpen(!isSidebarOpen)}
              className="p-1.5 hover:bg-gray-100 rounded-lg lg:hidden text-[#310101]"
            >
              <Menu className="w-5 h-5" />
            </button>
            <h1 className="text-sm md:text-base font-serif text-[#310101] italic font-bold">{activeTab}</h1>
          </div>
          <div className="flex items-center gap-4">
            <button 
              onClick={() => window.location.reload()} 
              className="p-2 bg-gray-50 rounded-lg hover:bg-black hover:text-white transition-all group flex items-center gap-2"
              title="Refresh Assets"
            >
               <Zap className="w-3.5 h-3.5 text-[#B0843D] group-hover:animate-bounce" />
               <span className="text-[12px] font-black uppercase tracking-widest hidden md:block">Reload System</span>
            </button>
            <div className="flex items-center gap-4 border-l pl-4 border-gray-100">
              <div className="text-right hidden sm:block">
                <p className="text-[13px] font-black text-[#D4AF37] uppercase tracking-[0.1em] leading-none mb-0.5">Kaleemiya</p>
                <p className="text-[11px] text-[#D4AF37]/60 font-bold uppercase tracking-widest font-serif leading-none">Admin</p>
              </div>
              <div className="w-9 h-9 rounded-xl bg-[#310101] flex items-center justify-center text-[#F9F6F2] font-serif italic text-base shadow-lg border border-white/10 ring-2 ring-gray-50">K</div>
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-4 bg-[#FDFCFB] custom-scrollbar">

          {activeTab === "Dashboard" && (
            <div className="space-y-6 md:space-y-10 max-w-7xl mx-auto pb-10">
              <div className="pt-4 px-2">
                <div className="bg-white rounded-[40px] md:rounded-[70px] p-6 md:p-16 shadow-sm border border-gray-100 relative overflow-hidden group">
                  <div className="relative z-10 space-y-10">
                    <div className="flex items-center gap-4">
                      <div className="bg-[#310101] px-6 py-2 rounded-full flex items-center gap-3">
                        <span className="text-[14px] font-black text-[#E5D5C5] uppercase tracking-[0.2em]">Live Store Status</span>
                        <div className="w-2.5 h-2.5 rounded-full bg-green-400 border-2 border-white animate-pulse"></div>
                      </div>
                    </div>
                    <div className="space-y-4">
                      <h2 className="text-4xl md:text-7xl font-serif font-black text-[#310101] tracking-tighter leading-tight md:leading-[0.8] flex flex-wrap gap-x-4 items-baseline">
                        Welcome,
                        <span className="text-[#B0843D] italic font-medium lowercase decoration-[#B0843D]/20 underline underline-offset-8 decoration-8">{user?.displayName?.split(" ")[0] || "Tanveer"}!</span>
                      </h2>
                      <p className="text-base md:text-xl font-medium text-[#310101] max-w-3xl leading-relaxed mt-4 md:mt-6">
                        Curating the essence of elegance at <span className="font-bold text-[#310101] border-b-4 border-[#B0843D] pb-1 uppercase tracking-widest">Kaleemiya</span>.
                      </p>
                    </div>
                    <div className="flex flex-col sm:flex-row gap-4 md:gap-6 pt-4">
                      <button onClick={() => setActiveTab("New Desk")} className="bg-[#310101] text-white px-8 py-5 md:px-12 md:py-7 rounded-[20px] md:rounded-[30px] shadow-2xl hover:bg-[#1a0101] hover:scale-105 transition-all flex items-center justify-center gap-4 group/btn">
                        <PlusCircle className="w-5 h-5 md:w-6 md:h-6 text-[#E5D5C5] group-hover/btn:rotate-90 transition-transform" />
                        <span className="text-[12px] md:text-[14px] font-black uppercase tracking-[0.2em]">Publish New Item</span>
                      </button>
                      <button onClick={() => window.location.href = "/"} className="bg-white border border-[#310101]/10 text-[#310101] px-8 py-5 md:px-12 md:py-7 rounded-[20px] md:rounded-[30px] shadow-sm hover:shadow-xl hover:bg-gray-50 transition-all flex items-center justify-center gap-4">
                        <Eye className="w-5 h-5 md:w-6 md:h-6" />
                        <span className="text-[12px] md:text-[14px] font-black uppercase tracking-[0.2em]">Main Portal</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 px-2">
                <StatCard title="Total Assets" value={inventory.length} icon={Package} trend="+12.5%" />
                <StatCard title="Admin Core" value={activeAdmins.length + 1} icon={ShieldAlert} />
                <StatCard title="Clientele" value={allUsers.length} icon={Users} trend="+5%" />
                <StatCard title="System Load" value="Optimal" icon={Zap} />
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-10 px-2">
                <div className="lg:col-span-2 space-y-10">
                  <RevenueVelocity />
                  <div className="bg-white rounded-[40px] md:rounded-[60px] p-6 md:p-12 shadow-sm border border-gray-100 flex flex-col">
                    <h4 className="text-[13px] md:text-[15px] font-black text-[#1A1A1A] uppercase tracking-[0.4em] mb-8 md:mb-12">Recent Activity</h4>
                    <div className="space-y-6 md:space-y-8">
                      {inventory.slice(0, 4).map((item, i) => (
                        <div 
                          key={i} 
                          onClick={() => {
                            setActiveTab("Manage Stock");
                            setInventorySearch(item.name);
                          }}
                          className="flex items-center justify-between group p-6 -mx-4 rounded-[30px] hover:bg-[#F9F6F2] transition-all cursor-pointer group/item"
                        >
                           <div className="flex items-center gap-8">
                              <div className="w-14 h-14 rounded-full bg-[#F9F6F2] group-hover:bg-[#1A1A1A] group-hover:text-white flex items-center justify-center font-serif font-black text-[#1A1A1A] text-xl transition-all shadow-sm group-hover/item:scale-110">
                                {item.name.charAt(0)}
                              </div>
                              <p className="text-[18px] font-black text-[#1A1A1A]">Published: <span className="font-serif italic text-black/50">"{item.name}"</span></p>
                           </div>
                           <ChevronRight className="w-6 h-6 text-[#1A1A1A]/20 group-hover:text-[#B0843D] group-hover:translate-x-2 transition-all" />
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="space-y-10">
                  <div className="bg-[#F9F6F2] rounded-[55px] p-12 shadow-sm border border-[#310101]/5">
                    <h5 className="text-[14px] font-black text-[#B0843D] uppercase tracking-[0.4em] mb-12">Asset Index</h5>
                    <div className="space-y-8 max-h-[400px] overflow-y-auto pr-4 custom-scrollbar">
                      {allCategories.map((cat, i) => {
                        let count = 0;
                        const targetCat = cat.trim().toUpperCase();
                        
                        if (targetCat === "OUR BESTSELLER") {
                          count = allInventory.filter(p => p.isBestseller === true).length;
                        } else if (targetCat === "NEW ARRIVAL") {
                          count = allInventory.filter(p => p.isNew === true).length;
                        } else {
                          count = allInventory.filter(p => (p.category || "").trim().toUpperCase() === targetCat).length;
                        }
                        
                        const percent = allInventory.length > 0 ? (count / allInventory.length) * 100 : 0;
                        return (
                          <div key={i} className="space-y-4">
                            <div className="flex justify-between items-center text-[15px] font-black uppercase text-[#310101] tracking-widest opacity-80">
                               <span>{cat}</span><span>{count} ITEMS</span>
                            </div>
                            <div className="h-2 w-full bg-[#310101]/5 rounded-full overflow-hidden">
                               <motion.div initial={{ width: 0 }} animate={{ width: `${Math.max(percent, 2)}%` }} className="h-full bg-gradient-to-r from-[#310101] to-[#B0843D]" />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                  <div className="bg-white rounded-[50px] p-12 shadow-sm border border-[#F9F6F2]">
                    <h5 className="text-[14px] font-black text-[#1A1A1A] uppercase tracking-[0.4em] mb-12">System Status</h5>
                    <div className="space-y-10">
                       <div className="flex items-center gap-6">
                          <div className={`w-4 h-4 rounded-full animate-pulse shrink-0 ${systemHealth.cdn === "Optimal" ? "bg-green-500 shadow-[0_0_15px_rgba(34,197,94,0.4)]" : "bg-orange-500 shadow-[0_0_15px_rgba(249,115,22,0.4)]"}`} />
                          <div>
                            <p className="text-[16px] font-black text-[#1A1A1A] leading-none mb-1">Cloud Storage</p>
                            <p className="text-[11px] font-black uppercase tracking-[0.2em] text-black/30">{systemHealth.cdn === "Optimal" ? "Optimal Performance" : "High Latency"}</p>
                          </div>
                       </div>

                       <div className="flex items-center gap-6">
                          <div className={`w-4 h-4 rounded-full animate-pulse shrink-0 ${systemHealth.db === "Syncing" ? "bg-green-500 shadow-[0_0_15px_rgba(34,197,94,0.4)]" : "bg-red-500 shadow-[0_0_15px_rgba(239,68,68,0.4)]"}`} />
                          <div>
                            <p className="text-[16px] font-black text-[#1A1A1A] leading-none mb-1">Firestore Database</p>
                            <p className="text-[11px] font-black uppercase tracking-[0.2em] text-black/30">{systemHealth.db === "Syncing" ? "Low Latency" : "Connection Error"}</p>
                          </div>
                       </div>

                       <div className="flex items-center gap-6">
                          <div className="w-4 h-4 rounded-full bg-[#B0843D] animate-pulse shrink-0 shadow-[0_0_15px_rgba(176,132,61,0.4)]" />
                          <div>
                            <p className="text-[16px] font-black text-[#1A1A1A] leading-none mb-1">API Broadcast</p>
                            <p className="text-[11px] font-black uppercase tracking-[0.2em] text-black/30">High Traffic Alert</p>
                          </div>
                       </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === "Signature News and Announcements" && (
            <div className="space-y-12 pb-12 max-w-7xl mx-auto px-4">
              <div className="flex flex-col md:flex-row md:items-end justify-between gap-10">
                  <div className="space-y-4">
                    <h2 className="text-5xl font-serif font-black text-black tracking-tighter italic">Signature Broadcasts</h2>
                    <p className="text-xl font-serif italic text-black/40 max-w-2xl">Publish special offers, Eid greetings, and Signature announcements to your clientele.</p>
                  </div>
                  <button onClick={() => setIsNewsModalOpen(true)} className="bg-[#310101] text-[#E5D5C5] px-12 py-7 rounded-[40px] font-black uppercase text-[14px] shadow-2xl hover:scale-105 transition-all">Broadcast New Offer</button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mt-12">
                {news.length > 0 ? news.map((item) => (
                  <div key={item.id} className="bg-white border-2 border-gray-50 rounded-[55px] p-12 shadow-sm space-y-10 flex flex-col justify-between hover:border-[#B0843D]/20 transition-all group">
                    <div className="space-y-6">
                      <div className="flex items-center justify-between">
                         <span className="px-4 py-1.5 bg-[#F9F6F2] font-black uppercase text-[14px] rounded-full text-[#B0843D] tracking-widest">{item.category}</span>
                         <span className="text-[15px] font-black opacity-20 uppercase tracking-widest">{item.date}</span>
                      </div>
                      <h3 className="text-4xl font-serif font-black italic text-[#310101] leading-tight group-hover:text-[#B0843D] transition-colors line-clamp-2">{item.title}</h3>
                      <p className="text-lg font-serif italic opacity-50 leading-relaxed line-clamp-4">"{item.content}"</p>
                      
                      {(item.startDate || item.endDate) && (
                         <div className="pt-4 flex items-center gap-2 text-[14px] font-black uppercase tracking-widest text-[#B0843D]">
                            <Calendar className="w-3 h-3" />
                            <span>{item.startDate || "Ongoing"} — {item.endDate || "No Expiry"}</span>
                         </div>
                      )}
                    </div>
                    <div className="pt-6 border-t border-dashed flex justify-between items-center gap-4">
                       <span className="text-[14px] font-black uppercase opacity-20 tracking-widest flex-1">Live on Feed</span>
                       <div className="flex gap-2">
                          <button 
                            onClick={() => {
                               setEditingNews(item);
                               setIsNewsModalOpen(true);
                            }} 
                            className="p-4 bg-gray-50 text-black hover:bg-black hover:text-white transition-all rounded-2xl"
                          >
                             <Edit2 className="w-5 h-5" />
                          </button>
                          <button onClick={() => handleDeleteNews(item.id)} className="p-4 bg-red-50 text-red-500 rounded-2xl hover:bg-red-500 hover:text-white transition-all">
                             <Trash2 className="w-5 h-5" />
                          </button>
                       </div>
                    </div>
                  </div>
                )) : (
                  <div className="col-span-full py-40 text-center bg-white rounded-[60px] border-4 border-dashed border-gray-50">
                     <Newspaper className="w-24 h-24 text-black/5 mx-auto mb-8" />
                     <h4 className="text-4xl font-serif italic text-black/20">No active broadcasts yet.</h4>
                     <p className="text-sm font-black uppercase tracking-widest text-[#B0843D] mt-4">Start by announcing an offer or greeting!</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === "Company Reviews" && (
            <div className="space-y-12 max-w-7xl mx-auto pb-12 px-4">
              <div className="flex flex-col md:flex-row md:items-end justify-between gap-10">
                  <div className="space-y-4">
                    <h2 className="text-5xl font-serif font-black text-black tracking-tighter italic">Review Terminal</h2>
                    <p className="text-xl font-serif italic text-black/40 max-w-2xl">Monitor and manage the shared experiences of your clientele. Every reflection counts toward your Signature's excellence.</p>
                  </div>
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-12">
                 {allReviews.length > 0 ? allReviews.map((rev) => (
                    <div key={rev.id} className="bg-white border rounded-[50px] p-10 shadow-sm space-y-6 relative group overflow-hidden">
                       <div className="flex justify-between items-start">
                          <div className="flex items-center gap-4">
                             <div className="w-14 h-14 rounded-full bg-[#310101] flex items-center justify-center text-white font-serif italic text-xl shadow-lg">
                                {rev.userName ? rev.userName.charAt(0) : "G"}
                             </div>
                             <div>
                                <h4 className="text-[16px] font-black uppercase tracking-widest text-[#310101]">{rev.userName}</h4>
                                <p className="text-[11px] font-black uppercase tracking-widest opacity-30">{rev.createdAt ? rev.createdAt.toDate().toLocaleDateString('en-GB') : "Just Now"}</p>
                             </div>
                          </div>
                          <div className="flex gap-1">
                             {[...Array(5)].map((_, i) => (
                                <Star key={i} className={`w-4 h-4 ${i < (rev.rating || 0) ? "text-amber-500 fill-current" : "text-gray-100"}`} />
                             ))}
                          </div>
                       </div>
                       <div className="bg-[#F9F6F2] p-8 rounded-[35px] border border-[#310101]/5 italic font-serif text-lg text-black/70">
                          "{rev.comment}"
                       </div>
                       <div className="pt-6 border-t border-dashed flex justify-between items-center bg-white">
                          <p className="text-[12px] font-black uppercase tracking-widest text-[#B0843D]">Ref ID: {rev.id.slice(0,8)}</p>
                          <button onClick={() => handleDeleteReview(rev.id)} className="p-4 bg-red-50 text-red-500 rounded-2xl hover:bg-red-500 hover:text-white transition-all shadow-sm">
                             <Trash2 className="w-5 h-5" />
                          </button>
                       </div>
                    </div>
                 )) : (
                    <div className="col-span-full py-40 text-center bg-white rounded-[60px] border-4 border-dashed border-gray-50">
                       <Star className="w-24 h-24 text-black/5 mx-auto mb-8" />
                       <h4 className="text-4xl font-serif italic text-black/20">No reflections shared yet.</h4>
                       <p className="text-sm font-black uppercase tracking-widest text-[#B0843D] mt-4">Reviews will appear here as customers share their experiences.</p>
                    </div>
                 )}
              </div>
            </div>
          )}

          {activeTab === "Our Bestsellers" && (
            <div className="space-y-12 max-w-7xl mx-auto pb-12 px-4">
               <div className="flex flex-col md:flex-row md:items-end justify-between gap-12 bg-white p-16 rounded-[60px] border shadow-sm relative overflow-hidden">
                  <div className="relative z-10">
                    <h2 className="text-5xl font-serif font-black text-[#310101] tracking-tighter italic">Bestseller Hub</h2>
                    <p className="text-xl font-serif italic text-black/50 mt-4 leading-relaxed max-w-2xl">
                       Fine-tune your flagship collection. Items ranked here appear in the "Our Bestsellers" gallery on the homepage.
                    </p>
                  </div>
                  <div className="flex flex-col items-center gap-2 relative z-10 shrink-0">
                    <div className="w-24 h-24 rounded-[35px] bg-[#B0843D] flex items-center justify-center shadow-2xl">
                       <Star className="w-10 h-10 text-white fill-current" />
                    </div>
                  </div>
               </div>

               <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                  {inventory
                    .filter(p => p.isBestseller === true)
                    .map((p, i) => (
                      <div key={p.id} className="bg-white rounded-[45px] p-8 border border-gray-100 shadow-sm hover:shadow-xl transition-all group relative">
                         <div className="absolute top-6 left-6 w-12 h-12 bg-[#B0843D] text-white rounded-2xl flex items-center justify-center shadow-xl z-10">
                            <Star className="w-6 h-6 fill-current" />
                         </div>
                         <div className="aspect-square rounded-[35px] overflow-hidden mb-6 relative">
                            <img src={p.image} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" title={p.name} />
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                               <button onClick={() => setEditingProduct(p)} className="p-4 bg-white rounded-2xl hover:bg-[#B0843D] hover:text-white transition-all shadow-xl"><Edit2 className="w-5 h-5" /></button>
                               <button onClick={() => {
                                 const updated = { ...p, isBestseller: false };
                                 updateProduct(updated as any);
                                 toast.error("Removed from Bestsellers");
                               }} className="p-4 bg-white rounded-2xl hover:bg-black hover:text-white transition-all shadow-xl"><Trash2 className="w-5 h-5" /></button>
                            </div>
                         </div>
                         <h3 className="text-[16px] font-sans font-medium line-clamp-1 text-[#C29D59] mb-1">{p.name}</h3>
                         <p className="text-[14px] font-bold text-black/30 uppercase tracking-[0.2em]">{p.category}</p>
                      </div>
                    ))}
                  
                  {inventory.filter(p => p.isBestseller === true).length === 0 && (
                    <div className="col-span-full py-32 text-center bg-gray-50/50 rounded-[60px] border border-dashed flex flex-col items-center justify-center">
                       <Star className="w-16 h-16 text-black/10 mb-6" />
                       <h6 className="text-3xl font-serif font-black italic text-black/20">No Bestsellers Curated</h6>
                       <button onClick={() => setActiveTab("Manage Stock")} className="mt-8 text-[15px] font-black uppercase tracking-[0.3em] text-[#B0843D] border-b-2 border-[#B0843D]/20 pb-1 hover:border-[#B0843D] transition-all">Rank items in your list</button>
                    </div>
                  )}
               </div>
            </div>
            )}
           {activeTab === "Manage Stock" && (
            <div className="space-y-6 md:space-y-8 max-w-7xl mx-auto pb-10">
               {/* Controls Header Card */}
               <div className="bg-white rounded-2xl md:rounded-3xl p-5 md:p-8 shadow-sm border border-gray-100 flex flex-col gap-6 md:gap-8">
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-gray-50 pb-6 md:pb-8">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 md:w-12 md:h-12 bg-[#310101] rounded-xl flex items-center justify-center shadow-lg">
                        <Package className="w-5 h-5 md:w-6 md:h-6 text-[#E5D5C5]" />
                      </div>
                      <h2 className="text-2xl md:text-3xl font-serif font-black text-[#310101] italic">Live Inventory</h2>
                    </div>
                    <button onClick={() => setActiveTab("New Desk")} className="w-full sm:w-auto bg-[#310101] text-white px-6 py-3 md:px-8 md:py-4 rounded-xl font-black uppercase text-[11px] md:text-[12px] shadow-xl hover:bg-black hover:scale-[1.02] transition-all flex items-center justify-center gap-3">
                       <PlusCircle className="w-4 h-4 text-[#E5D5C5]" />
                       Create Entry
                    </button>
                  </div>

                  <div className="flex flex-col md:flex-row gap-4">
                    <div className="flex-1 relative group">
                      <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-black/20 group-focus-within:text-[#B0843D] transition-colors" />
                      <input 
                        placeholder="Search collection..." 
                        value={inventorySearch}
                        onChange={(e) => setInventorySearch(e.target.value)}
                        className="w-full bg-gray-50/50 border border-gray-100 h-12 pl-14 pr-6 rounded-xl font-serif italic outline-none focus:bg-white focus:border-[#B0843D]/20 transition-all"
                      />
                    </div>
                    <div className="w-full md:w-60">
                      <select value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)} className="w-full bg-gray-50/50 border border-gray-100 h-12 px-6 rounded-xl font-black uppercase text-[11px] tracking-widest outline-none cursor-pointer">
                        <option value="All">All Categories</option>
                        {allCategories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                      </select>
                    </div>
                  </div>
               </div>

               {/* Inventory Grid */}
               <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6 px-1 md:px-0">
                {filteredProducts.length > 0 ? (
                  filteredProducts.map((product) => (
                    <div key={product.id} className="bg-white rounded-2xl md:rounded-3xl overflow-hidden border border-gray-100 group hover:shadow-xl transition-all duration-500 flex flex-col">
                      <div className="aspect-[4/5] bg-[#F9F6F2] relative overflow-hidden group/media">
                         <img src={product.image} className={`w-full h-full object-cover transition-all duration-700 ${product.video ? 'group-hover/media:opacity-0' : 'group-hover:scale-105'}`} alt={product.name} />
                         {product.video && (
                            <video 
                              src={product.video} 
                              className="absolute inset-0 w-full h-full object-cover opacity-0 group-hover/media:opacity-100 transition-opacity duration-500"
                              muted loop onMouseEnter={(e) => e.currentTarget.play()} onMouseLeave={(e) => e.currentTarget.pause()}
                            />
                         )}
                         <div className="absolute top-3 right-3">
                            <span className={`text-[9px] font-black uppercase tracking-widest px-3 py-1.5 rounded-full border-2 border-white/50 backdrop-blur-sm ${
                               product.status === "In Stock" ? "bg-green-500 text-white" : 
                               product.status === "Low Stock" ? "bg-orange-500 text-white" : 
                               "bg-red-500 text-white"
                            }`}>
                              {product.status || "Stock"}
                            </span>
                         </div>
                      </div>
                      <div className="p-4 md:p-6 flex-1 flex flex-col justify-between space-y-4">
                        <div className="space-y-1">
                          <h3 className="font-sans font-medium text-[#C29D59] text-[16px] leading-tight line-clamp-2">{product.name}</h3>
                          <p className="text-[11px] font-black text-black/20 uppercase tracking-widest">{product.category} {product.subCategory && `• ${product.subCategory}`}</p>
                        </div>
                        
                        <div className="space-y-4">
                           <div className="flex items-center justify-between border-b border-gray-50 pb-3">
                              <div className="flex items-center gap-2">
                                <span className="text-[18px] font-bold text-[#111]">₹{parseInt(product.discountPrice?.replace(/[^\d]/g, "") || product.price?.replace(/[^\d]/g, "") || "0").toLocaleString()}</span>
                                {product.discountPrice && (
                                  <span className="text-black/30 line-through text-[12px]">₹{parseInt(product.price?.replace(/[^\d]/g, "") || "0").toLocaleString()}</span>
                                )}
                              </div>
                              <span className="text-[11px] font-black text-black/30 uppercase">Qty: {product.stock}</span>
                           </div>
                           
                           <div className="flex gap-2">
                              <button onClick={() => setEditingProduct({ ...product, price: product.numericPrice?.toString() || "", stock: product.stock?.toString() || "" })} className="flex-1 bg-[#310101] text-white py-3 rounded-xl text-[11px] font-black uppercase tracking-widest hover:bg-black transition-all">Edit</button>
                              <button onClick={() => handleDeleteProduct(product.id)} className="p-3 bg-red-50 text-red-500 rounded-xl hover:bg-red-500 hover:text-white transition-all"><Trash2 className="w-4 h-4" /></button>
                           </div>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="col-span-full py-20 text-center bg-white rounded-3xl border-2 border-dashed border-gray-100 italic font-serif text-black/20">
                    <p className="text-xl">Your collection portal is currently empty.</p>
                    <button onClick={() => setActiveTab("New Desk")} className="mt-4 text-sm font-black uppercase text-[#B0843D] hover:underline">Establish first entry</button>
                  </div>
                )}
               </div>
            </div>
          )}

          {activeTab === "Orders" && (
            <div className="space-y-6 pb-4">
              <h2 className="text-3xl md:text-5xl font-serif font-black text-black tracking-tighter italic">Fulfillment Portal</h2>
              <div className="bg-white rounded-[30px] border border-gray-100 overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                  <table className="w-full text-left min-w-[800px]">
                  <thead className="bg-[#FAF9F6] text-[14px] font-black uppercase tracking-[0.2em] text-[#310101]/90 border-b">
                    <tr>
                      <th className="px-10 py-6 text-left">Order ID</th>
                      <th className="px-10 py-6 text-left">Customer</th>
                      <th className="px-10 py-6 text-left">Items</th>
                      <th className="px-10 py-6 text-center">Volume</th>
                      <th className="px-10 py-6 text-center">Amount</th>
                      <th className="px-10 py-6 text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {orders.map((order, i) => (
                      <tr key={i} className="hover:bg-gray-50/40 transition-colors">
                        <td className="px-8 py-7 font-mono font-black">{order.id}</td>
                        <td className="px-8 py-7 font-black">{order.customer}</td>
                        <td className="px-8 py-7 font-serif italic">
                           <div className="flex flex-col gap-1">
                              {order.items.map((it, idx) => (
                                 <span key={idx} className="font-bold">{it}{idx < order.items.length - 1 ? "," : ""}</span>
                              ))}
                           </div>
                        </td>
                        <td className="px-10 py-7 text-center font-bold text-black/60 italic">{order.qty}</td>
                        <td className="px-10 py-7 text-center font-black">{"\u20B9"}{parseInt(order.amount.toString().replace(/[^\d]/g, "") || "0").toLocaleString()}</td>
                        <td className="px-10 py-7 text-center">
                           <button 
                             onClick={() => setSelectedOrder(order)} 
                             className={`px-8 py-3 rounded-full text-[14px] font-black uppercase tracking-widest text-white transition-all shadow-lg hover:scale-105 inline-block ${
                                order.status === "Delivered" ? "bg-green-600" : 
                                order.status === "In Transit" ? "bg-blue-600" : 
                                "bg-[#B0843D]"
                             }`}
                           >
                             {order.status}
                           </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {activeTab === "Clientele" && (
            <div className="space-y-16 pb-32 max-w-7xl mx-auto px-4">
              <div className="flex flex-col md:flex-row justify-between items-end gap-10">
                 <div className="space-y-4">
                    <h2 className="text-5xl font-serif font-black text-black tracking-tighter italic">Signature Clientele</h2>
                    <p className="text-xl font-serif italic text-black/40">Management of your exclusive community and their shopping profiles.</p>
                 </div>
                 <div className="bg-white px-8 py-5 rounded-[25px] border shadow-sm">
                    <p className="text-[14px] font-black uppercase opacity-30 tracking-widest mb-1">Total Members</p>
                    <p className="text-3xl font-black">{allUsers.length}</p>
                 </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
                {allUsers.map((cust) => {
                  const userOrders = orders.filter(o => o.customer === cust.name);
                  const totalSpent = userOrders.reduce((acc, curr) => acc + parseInt(curr.amount.replace(/[^0-9]/g, "")), 0);
                  
                  return (
                    <div key={cust.id} className="bg-white rounded-[50px] border border-gray-100 shadow-sm hover:shadow-2xl transition-all duration-700 group overflow-hidden">
                      <div className="p-10 space-y-8">
                        <div className="flex items-center gap-6">
                          <div className="w-20 h-20 rounded-[30px] bg-[#310101] text-[#E5D5C5] flex items-center justify-center font-serif text-3xl italic font-bold shadow-xl group-hover:rotate-6 transition-transform">
                             {cust.name?.charAt(0) || "?"}
                          </div>
                          <div>
                            <h4 className="text-2xl font-serif font-black text-black tracking-tight">{cust.name || "Guest User"}</h4>
                            <p className="text-[15px] font-black text-[#B0843D] uppercase tracking-[0.2em]">{cust.role}</p>
                          </div>
                        </div>

                        <div className="space-y-1">
                           <p className="text-[14px] font-black uppercase opacity-20 tracking-widest leading-none mb-1">Electronic Mail</p>
                           <p className="text-sm font-bold text-black group-hover:text-[#B0843D] transition-colors">{cust.email}</p>
                        </div>

                        <div className="grid grid-cols-2 gap-6 pt-4 border-t border-gray-50">
                           <div className="space-y-1">
                              <p className="text-[14px] font-black uppercase opacity-20 tracking-widest">Total Orders</p>
                              <p className="text-2xl font-black">{userOrders.length}</p>
                           </div>
                           <div className="space-y-1">
                              <p className="text-[14px] font-black uppercase opacity-20 tracking-widest">Total Spend</p>
                              <p className="text-2xl font-black text-green-600">₹{totalSpent.toLocaleString()}</p>
                           </div>
                        </div>
                      </div>
                      
                      <div className="px-10 py-6 bg-gray-50/50 flex justify-between items-center">
                         <span className="text-[11px] font-black uppercase opacity-30 tracking-widest">ID: {cust.id.slice(0, 8)}...</span>
                         <button 
                           onClick={() => handleDeleteUser(cust.id, cust.name || cust.email, cust.email)} 
                           className="flex items-center gap-2 text-red-500 hover:text-red-700 font-black text-[14px] uppercase tracking-widest transition-colors"
                         >
                            <Trash2 className="w-4 h-4" />
                            Dispose
                         </button>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Danger Zone */}
              {isSuperAdmin && (
                <div className="mt-20 pt-20 border-t-2 border-dashed border-red-100">
                   <div className="bg-red-50/50 rounded-[60px] p-16 border-2 border-red-100 flex flex-col md:flex-row items-center justify-between gap-12">
                      <div className="space-y-4 text-center md:text-left">
                         <div className="flex items-center gap-4 justify-center md:justify-start">
                            <ShieldAlert className="w-10 h-10 text-red-600" />
                            <h3 className="text-5xl font-serif font-black text-red-600 italic">Danger Zone</h3>
                         </div>
                         <p className="text-lg font-serif italic text-red-600/60 max-w-xl">
                            High-level administrative resets. These actions are permanent and cannot be undone. Proceed with extreme caution.
                         </p>
                      </div>
                      <div className="flex flex-col gap-4 w-full md:w-auto">
                         <button 
                           onClick={() => {
                             if(confirm("DANGER: WIPE ENTIRE CATALOG? This deletes all products.")) {
                               inventory.forEach((p: any) => deleteProduct(p.id));
                               toast.success("Catalog Wiped");
                             }
                           }}
                           className="bg-red-600 text-white px-12 py-6 rounded-[30px] font-black uppercase text-[14px] shadow-xl hover:bg-black transition-all"
                         >
                            Wipe Entire Catalog
                         </button>
                         <button 
                           onClick={() => {
                             if(confirm("DANGER: WIPE ALL ORDERS? (Mock Action)")) {
                               setOrders([]);
                               toast.success("Order History Cleared");
                             }
                           }}
                           className="bg-white border-2 border-red-600 text-red-600 px-12 py-6 rounded-[30px] font-black uppercase text-[14px] hover:bg-red-600 hover:text-white transition-all font-sans"
                         >
                            Clear Order History
                         </button>
                      </div>
                   </div>
                </div>
              )}
            </div>
          )}

          {activeTab === "Categories" && (
            <div className="space-y-4 pb-4 px-2 md:px-0">
               <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 bg-white p-4 md:p-6 rounded-2xl md:rounded-3xl border shadow-sm">
                  <h2 className="text-lg md:text-2xl font-serif font-black italic">Collection Directory</h2>
                  <button onClick={handleAddCategory} className="bg-black text-white w-full sm:w-auto px-5 md:px-8 py-2.5 md:py-3 rounded-full text-[10px] md:text-[13px] font-black uppercase tracking-widest">Add Category</button>
               </div>
               <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-5">
                   {allCategories.map((cat, i) => (
                     <div key={i} className="bg-white p-4 md:p-6 rounded-2xl md:rounded-3xl border shadow-sm flex flex-col group hover:shadow-xl transition-all">
                        <div className="flex justify-between items-start mb-3 md:mb-4">
                           <div className="p-2 md:p-3 bg-[#F9F6F2] rounded-lg md:rounded-xl shrink-0">
                              <Tag className="w-4 h-4 md:w-6 md:h-6 text-[#310101]/90" />
                           </div>
                           <div className="flex gap-1">
                             {!["Our Bestseller", "New Arrival"].includes(cat) && (
                               <>
                                 <button 
                                   onClick={() => handleDeleteCategory(cat)}
                                   className="p-1.5 md:p-2 bg-red-50 text-red-500 rounded-lg hover:bg-red-500 hover:text-white transition-all shrink-0"
                                   title="Delete Category"
                                 >
                                    <Trash2 className="w-3.5 h-3.5 md:w-4 md:h-4" />
                                 </button>
                                 <button 
                                   onClick={() => handleEditCategory(cat)}
                                   className="p-1.5 md:p-2 bg-blue-50 text-blue-500 rounded-lg hover:bg-blue-500 hover:text-white transition-all shrink-0"
                                   title="Rename Category"
                                 >
                                    <Edit2 className="w-3.5 h-3.5 md:w-4 md:h-4" />
                                 </button>
                               </>
                             )}
                             <button 
                               onClick={() => handleAddSubCategory(cat)}
                               className="p-1.5 md:p-2 bg-black text-white rounded-lg hover:opacity-80 transition-opacity shrink-0"
                               title="Add Sub-category"
                             >
                                <PlusCircle className="w-3.5 h-3.5 md:w-4 md:h-4" />
                             </button>
                           </div>
                        </div>
                        <h3 className="font-serif font-black text-base md:text-xl italic text-[#310101] mb-2 md:mb-3">{cat}</h3>
                        <div className="flex flex-wrap gap-1 md:gap-1.5">
                           {(dynamicSubCategories[cat] || []).map((sub, si) => (
                              <span key={si} className="flex items-center gap-1 md:gap-1.5 px-1.5 md:px-2 py-0.5 md:py-1 bg-gray-50 hover:bg-white rounded-md text-[8px] md:text-[12px] font-black uppercase tracking-tight text-black/40 border border-gray-100 relative shadow-sm transition-colors group/sub max-w-full">
                                 <span className="truncate">{sub}</span>
                                 {!["General"].includes(sub) && (
                                   <div className="flex items-center gap-0.5 md:gap-1 shrink-0 ml-1">
                                     <button 
                                       onClick={(e) => { e.stopPropagation(); handleEditSubCategory(cat, sub); }} 
                                       className="hover:text-blue-500 hover:bg-blue-50 rounded-full transition-all text-black/20 flex items-center justify-center p-0.5 md:p-1 shrink-0"
                                       title="Rename Sub-category"
                                     >
                                        <Edit2 className="w-3 h-3 md:w-3.5 md:h-3.5" />
                                     </button>
                                     <button 
                                       onClick={(e) => { e.stopPropagation(); handleDeleteSubCategory(cat, sub); }} 
                                       className="hover:text-red-500 hover:bg-red-50 rounded-full transition-all text-black/20 flex items-center justify-center p-0.5 md:p-1 shrink-0"
                                       title="Delete Sub-category"
                                     >
                                        <X className="w-3 h-3 md:w-3.5 md:h-3.5" />
                                     </button>
                                   </div>
                                 )}
                              </span>
                           ))}
                        </div>
                     </div>
                   ))}
                </div>
            </div>
          )}

          {activeTab === "Store Gallery" && (
             <div className="space-y-6 pb-4 px-2 md:px-0 max-w-6xl mx-auto">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 md:p-8 rounded-[30px] md:rounded-[40px] border shadow-sm">
                   <div className="space-y-1">
                      <h2 className="text-xl md:text-3xl font-serif font-black italic">World of Kaleemiya</h2>
                      <p className="text-[11px] md:text-[13px] font-black uppercase tracking-[0.2em] opacity-40 italic">Manage Signature Brand Story Images</p>
                   </div>
                   <div className="relative group overflow-hidden">
                      <button disabled={isUploading} className="bg-[#B0843D] text-white w-full sm:w-auto px-6 md:px-10 py-3 md:py-4 rounded-full text-[11px] md:text-[14px] font-black uppercase tracking-widest flex items-center justify-center gap-3 shadow-xl shadow-[#B0843D]/20 hover:bg-[#310101] active:scale-95 transition-all">
                        {isUploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <PlusCircle className="w-4 h-4" />}
                        {isUploading ? "Uploading..." : "Add New Image"}
                      </button>
                      <input type="file" disabled={isUploading} onChange={handleGalleryUpload} className="absolute inset-0 opacity-0 cursor-pointer" />
                   </div>
                </div>
 
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
                   {galleryItems.map((item) => (
                     <div key={item.id} className="relative group aspect-square bg-white rounded-[25px] md:rounded-[35px] overflow-hidden border shadow-sm hover:shadow-2xl transition-all duration-500">
                        <img src={item.src} alt={item.alt} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                           <button 
                             onClick={() => handleDeleteGalleryItem(item.id)}
                             className="p-4 bg-white/20 backdrop-blur-md rounded-2xl text-white hover:bg-red-500 transition-colors shadow-2xl"
                             title="Remove from Gallery"
                           >
                             <Trash2 className="w-6 h-6" />
                           </button>
                        </div>
                     </div>
                   ))}
 
                   {galleryItems.length === 0 && (
                     <div className="col-span-full py-24 bg-gray-50/50 rounded-[40px] border-2 border-dashed border-gray-200 flex flex-col items-center justify-center text-center">
                        <Image className="w-16 h-16 text-black/10 mb-4" />
                        <p className="text-xl font-serif font-black italic text-[#310101]/40 mb-2">No Gallery Photos Synchronized</p>
                        <p className="text-[13px] font-black uppercase tracking-widest text-[#310101]/20">Upload your storefront photos to establish public prestige</p>
                     </div>
                   )}
                </div>
                
                <div className="bg-[#F9F6F2] p-8 md:p-12 rounded-[40px] md:rounded-[50px] flex items-center gap-8 md:gap-10 shadow-sm border border-[#E5D5C5]/30">
                   <div className="p-5 md:p-6 bg-[#310101] rounded-2xl md:rounded-3xl shadow-xl shadow-[#310101]/10">
                      <ShieldAlert className="w-8 h-8 md:w-10 md:h-10 text-[#E5D5C5]" />
                   </div>
                   <div className="space-y-1">
                      <h4 className="text-[#310101] text-lg md:text-2xl font-serif font-black italic">Live Site Note</h4>
                      <p className="text-[#310101]/40 text-[11px] md:text-[14px] font-black uppercase tracking-widest italic">Changes made here are instantly reflected in the 'World of Kaleemiya' public section.</p>
                   </div>
                </div>
             </div>
           )}

          {activeTab === "Admin Requests" && isSuperAdmin && (
            <div className="space-y-12 max-w-6xl mx-auto pb-24">
              <div className="flex flex-col lg:flex-row justify-between lg:items-end gap-10">
                <h2 className="text-5xl font-serif font-black text-black tracking-tighter italic">Portal Permissions</h2>
                
                <div className="flex gap-6">
                  <div className="bg-[#310101] text-[#E5D5C5] px-10 py-6 rounded-3xl flex items-center gap-6 shadow-xl">
                    <ShieldAlert className="w-8 h-8" />
                    <div>
                      <p className="text-[14px] uppercase font-black tracking-[0.2em] opacity-50">Security Status</p>
                      <p className="text-2xl font-black">{activeAdmins.length + 1} Active Admins</p>
                    </div>
                  </div>
                  <div className="bg-[#B0843D] text-white px-10 py-6 rounded-3xl flex items-center gap-6 shadow-xl">
                    <Zap className="w-8 h-8" />
                    <div>
                      <p className="text-[14px] uppercase font-black tracking-[0.2em] opacity-50">Action Needed</p>
                      <p className="text-2xl font-black">{adminRequests.length} Pending</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="relative">
                <Search className="absolute left-8 top-1/2 -translate-y-1/2 w-6 h-6 text-black/30" />
                <input 
                  type="text" 
                  placeholder="Search requests by email or name..." 
                  value={requestSearch}
                  onChange={(e) => setRequestSearch(e.target.value)}
                  className="w-full bg-white p-8 pl-20 rounded-[40px] text-xl font-bold font-sans outline-none shadow-sm focus:shadow-xl transition-all border border-gray-100"
                />
              </div>
                <div className="bg-white rounded-[55px] shadow-sm border border-gray-100 overflow-hidden divide-y">
                {filteredRequests.map((item) => (
                  <div key={item.id} className={`p-6 md:p-12 flex flex-col lg:flex-row items-center justify-between gap-6 md:gap-12 hover:bg-gray-50/50 transition-all duration-300 ${processingRequestId === item.id ? "opacity-40 pointer-events-none" : ""}`}>
                    <div className="flex items-center gap-10">
                      <div className="w-28 h-28 rounded-[40px] bg-black text-[#E5D5C5] flex items-center justify-center font-serif text-5xl font-bold">
                        {processingRequestId === item.id ? <Loader2 className="w-10 h-10 animate-spin" /> : (item.name?.charAt(0) || "?")}
                      </div>
                      <div>
                        <h5 className="text-5xl font-serif font-black text-black tracking-tighter italic">{item.name}</h5>
                        <p className="text-[15px] font-black text-black opacity-30">{item.email}</p>
                        <p className="text-[14px] font-medium text-black/50 italic mt-4">"{item.reason}"</p>
                      </div>
                    </div>
                    <div className="flex gap-4">
                      <button 
                         disabled={!!processingRequestId}
                         onClick={() => handleApproveReq(item.id, item.uid, item.name)} 
                         className="bg-black text-white px-12 py-6 rounded-[30px] font-black uppercase text-[14px] disabled:opacity-50 disabled:cursor-not-allowed hover:scale-[1.02] active:scale-[0.98] transition-transform"
                      >
                         {processingRequestId === item.id ? "Processing..." : "Approve Access"}
                      </button>
                      <button 
                         disabled={!!processingRequestId}
                         onClick={() => handleDenyReq(item.id, item.name)} 
                         className="bg-white border text-black px-12 py-6 rounded-[30px] font-black uppercase hover:bg-red-50 text-[14px] disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                         {processingRequestId === item.id ? "..." : "Deny"}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="bg-[#F9F6F2] p-12 rounded-[55px] border border-[#E5D5C5]/50 flex items-center gap-10">
                 <ShieldAlert className="w-16 h-16 text-[#310101]" />
                 <div><h6 className="text-[16px] font-black uppercase mb-2">Security Protocol</h6><p className="opacity-50 text-sm font-bold uppercase tracking-widest">Access delegation enables full database visibility.</p></div>
              </div>

              <div className="space-y-8 pt-10">
                <h4 className="text-[16px] font-black uppercase tracking-[0.4em] text-black">Active Administrators</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {activeAdmins.map((admin) => (
                    <div key={admin.id} className="bg-white border border-gray-100 rounded-[40px] p-8 flex items-center justify-between shadow-sm group hover:shadow-xl transition-all duration-500">
                      <div className="flex items-center gap-6">
                        <div className="w-16 h-16 rounded-[22px] bg-black/5 flex items-center justify-center">
                          <Users className="w-8 h-8 text-black" />
                        </div>
                        <div>
                          <div className="flex flex-col">
                            <h5 className="text-[18px] font-black text-black leading-tight mb-1">{admin.name || "Administrator"}</h5>
                            <p className="text-[14px] font-bold text-black/40 truncate max-w-[180px]">{admin.email}</p>
                          </div>
                          <div className="flex items-center gap-2 mt-2">
                             <div className="w-2 h-2 rounded-full bg-green-500" />
                             <span className="text-[14px] font-black text-green-600 uppercase tracking-widest leading-none">ADMIN</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="p-4 rounded-2xl bg-orange-50 text-orange-500">
                           <ShieldAlert className="w-5 h-5" />
                        </div>
                        <button 
                          onClick={() => handleDeleteUser(admin.id, admin.name, admin.email)}
                          className="p-4 rounded-2xl bg-red-50 text-red-500 hover:bg-red-500 hover:text-white transition-all duration-300"
                        >
                           <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {requestLogs.length > 0 && (
                <div className="space-y-6 pt-16">
                  <h4 className="text-[14px] font-black uppercase tracking-[0.4em] opacity-30">Historical Logs</h4>
                  <div className="space-y-4">
                    {requestLogs.map(log => (
                      <div key={log.id} className="bg-white p-8 rounded-[35px] border flex justify-between items-center group">
                         <span className="text-lg font-serif font-black italic">{log.name}</span>
                         <span className={`px-6 py-2 rounded-full text-[14px] font-black uppercase ${log.status === "approved" ? "bg-green-50 text-green-700" : "bg-red-50 text-red-600"}`}>Access {log.status}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}



          {activeTab === "Customer Messages" && (
            <div className="space-y-6 pb-4 px-2 md:px-0 max-w-5xl mx-auto">
               <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 md:p-8 rounded-[30px] md:rounded-[40px] border shadow-sm">
                  <h2 className="text-xl md:text-3xl font-serif font-black italic">Customer Inquiries</h2>
                  <div className="bg-[#F9F6F2] px-6 md:px-10 py-3 md:py-4 rounded-full text-[11px] md:text-[14px] font-black uppercase tracking-widest text-[#310101] whitespace-nowrap">{inquiries.length} Messages</div>
               </div>
               
               <div className="grid grid-cols-1 gap-4 md:gap-6">
                 {inquiries.length === 0 ? (
                   <div className="bg-white p-12 rounded-[40px] border border-gray-100 text-center opacity-50 flex flex-col items-center shadow-sm">
                     <Mail className="w-12 h-12 mx-auto mb-4 text-[#B0843D]" />
                     <p className="font-black uppercase tracking-widest text-sm text-[#310101]">No inquiries found.</p>
                   </div>
                 ) : (
                   inquiries.map((inq) => (
                     <div key={inq.id} className="bg-white p-6 md:p-8 rounded-[30px] md:rounded-[40px] border border-gray-100 shadow-sm flex flex-col md:flex-row gap-6 relative group hover:shadow-xl transition-all">
                        <div className="w-12 h-12 md:w-16 md:h-16 bg-[#F9F6F2] rounded-[15px] md:rounded-[20px] flex items-center justify-center font-serif text-xl md:text-3xl font-bold shrink-0 text-[#310101]">
                          {inq.name.charAt(0)}
                        </div>
                        <div className="flex-1">
                          <div className="flex flex-col md:flex-row justify-between md:items-center mb-2 gap-1 md:gap-4">
                            <h3 className="text-xl md:text-2xl font-serif font-black italic text-[#310101]">{inq.name}</h3>
                            <span className="text-[10px] md:text-[12px] uppercase font-black tracking-widest text-black/30 bg-gray-50 px-3 py-1 rounded-md self-start md:self-auto">
                               {inq.createdAt?.toDate ? new Date(inq.createdAt.toDate()).toLocaleDateString() : 'Just now'}
                            </span>
                          </div>
                          <p className="text-[12px] md:text-[14px] font-black tracking-wider text-[#B0843D] mb-4 uppercase">{inq.email}</p>
                          <p className="text-[14px] md:text-[16px] border-l-4 border-[#E5D5C5] pl-5 italic text-black/70 leading-relaxed font-serif">"{inq.message}"</p>
                        </div>
                        <div className="md:absolute right-6 top-6 md:opacity-0 group-hover:opacity-100 transition-opacity flex gap-2 justify-end mt-4 md:mt-0">
                           <a href={`mailto:${inq.email}?subject=Reply to your Kaleemiya Inquiry`} title="Reply via Email" className="bg-[#B0843D] text-white p-3 md:p-4 rounded-xl md:rounded-2xl hover:scale-110 transition-transform shadow-lg">
                             <Send className="w-4 h-4 md:w-5 md:h-5" />
                           </a>
                           <button onClick={() => deleteDoc(doc(db, "inquiries", inq.id))} title="Delete Inquiry" className="bg-red-50 text-red-500 p-3 md:p-4 rounded-xl md:rounded-2xl hover:scale-110 transition-transform shadow-sm border border-red-100">
                             <Trash2 className="w-4 h-4 md:w-5 md:h-5" />
                           </button>
                        </div>
                     </div>
                   ))
                 )}
               </div>
            </div>
          )}

          {activeTab === "New Desk" && (
            <div className="max-w-3xl mx-auto pb-24 px-2">
              <div className="bg-[#1A1A1A] rounded-2xl md:rounded-3xl p-5 md:p-8 mb-6 md:mb-8 shadow-2xl flex flex-col md:flex-row items-center justify-between gap-4">
                   <h2 className="text-2xl md:text-3xl font-serif font-black text-white italic">New Creation Desk</h2>
                   <div className="flex flex-wrap justify-center gap-3">
                      <button onClick={handleSyncDefaults} className="bg-white/10 text-white/70 px-3 py-1.5 md:px-5 md:py-2.5 rounded-lg uppercase font-black text-[10px] md:text-[12px] hover:bg-[#B0843D] hover:text-white transition-all">Sync Structure</button>
                      <button onClick={handleResetNewProduct} className="bg-white/10 text-white/50 px-3 py-1.5 md:px-5 md:py-2.5 rounded-lg uppercase font-black text-[10px] md:text-[12px]">Reset</button>
                   </div>
              </div>
              <form onSubmit={handleAddProduct} className="bg-white rounded-3xl md:rounded-[40px] p-6 md:p-10 shadow-2xl space-y-6 md:space-y-8">
                <input required placeholder="Perfume Name..." value={newProduct.name} onChange={e => setNewProduct({...newProduct, name: e.target.value})} className="w-full text-3xl md:text-5xl font-serif font-black outline-none border-b focus:border-black italic pb-2" />
                <textarea placeholder="Aromatic Story details..." value={newProduct.description} onChange={e => setNewProduct({...newProduct, description: e.target.value})} className="w-full h-24 md:h-32 outline-none text-lg md:text-xl font-serif italic border-none resize-none opacity-50 focus:opacity-100 transition-all" />
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                   <div className="space-y-3">
                      <div className="flex justify-between items-center">
                         <label className="text-[12px] font-black uppercase opacity-30">Category</label>
                         <button type="button" onClick={handleSyncDefaults} className="text-[10px] font-black uppercase text-[#B0843D] hover:underline">Update List</button>
                      </div>
                      <select 
                        value={newProduct.category} 
                        onChange={e => {
                           const newCat = e.target.value;
                           const firstSub = dynamicSubCategories[newCat]?.[0] || "";
                           setNewProduct({...newProduct, category: newCat, subCategory: firstSub});
                        }} 
                        className="w-full p-4 bg-gray-50 rounded-xl font-bold outline-none text-[13px]"
                      >
                         {globalCategories.map(c => <option key={c}>{c}</option>)}
                      </select>
                   </div>
                   <div className="space-y-3">
                      <label className="text-[12px] font-black uppercase opacity-30">Sub Category</label>
                      <select value={newProduct.subCategory} onChange={e => setNewProduct({...newProduct, subCategory: e.target.value})} className="w-full p-4 bg-gray-50 rounded-xl font-bold outline-none text-[13px]">
                         {(dynamicSubCategories[newProduct.category] || ["No sub-categories"]).map(s => <option key={s}>{s}</option>)}
                      </select>
                   </div>
                  <div className="space-y-3">
                     <label className="text-[12px] font-black uppercase text-[#B0843D]">Retail Price (₹)</label>
                     <input type="number" placeholder="2999" value={newProduct.price} onChange={e => setNewProduct({...newProduct, price: e.target.value})} className="w-full p-4 bg-gray-50 rounded-xl font-bold border-none outline-none focus:ring-4 focus:ring-[#B0843D]/5 text-[13px]" />
                  </div>
                  <div className="space-y-3">
                     <label className="text-[12px] font-black uppercase text-[#B0843D]">Discount Price</label>
                     <input type="number" placeholder="1999" value={newProduct.discountPrice} onChange={e => setNewProduct({...newProduct, discountPrice: e.target.value})} className="w-full p-4 bg-gray-50 rounded-xl font-bold border-none outline-none focus:ring-4 focus:ring-[#B0843D]/5 text-[13px]" />
                  </div>
                   <div className="space-y-3">
                      <label className="text-[12px] font-black uppercase opacity-30">Reserve Units</label>
                      <input type="number" value={newProduct.stock} onChange={e => setNewProduct({...newProduct, stock: e.target.value})} className="w-full p-4 bg-gray-50 rounded-xl font-bold outline-none text-[13px]" />
                   </div>
                   
                   <div className="space-y-3">
                      <label className="text-[12px] font-black uppercase text-[#B0843D]">Status</label>
                      <div className="flex gap-2">
                         <button 
                           type="button"
                           onClick={() => setNewProduct({...newProduct, isNew: !newProduct.isNew})}
                           className={`flex-1 p-3.5 rounded-xl font-black uppercase text-[10px] tracking-widest transition-all flex items-center justify-center gap-2 ${newProduct.isNew ? 'bg-[#B0843D] text-white shadow-lg' : 'bg-gray-100 text-black/20'}`}
                         >
                            <Zap className={`w-3 h-3 ${newProduct.isNew ? 'fill-current' : ''}`} />
                            NEW
                         </button>
                         <button 
                           type="button"
                           onClick={() => setNewProduct({...newProduct, isBestseller: !newProduct.isBestseller})}
                           className={`flex-1 p-3.5 rounded-xl font-black uppercase text-[10px] tracking-widest transition-all flex items-center justify-center gap-2 ${newProduct.isBestseller ? 'bg-[#310101] text-[#E5D5C5] shadow-lg' : 'bg-gray-100 text-black/20'}`}
                         >
                            <Star className={`w-3 h-3 ${newProduct.isBestseller ? 'fill-current' : ''}`} />
                            TOP
                         </button>
                      </div>
                   </div>
                </div>

                <div className="space-y-4">
                  <label className="text-[12px] font-black uppercase text-[#B0843D] tracking-[0.2em]">Fragrance Highlights / Key Features</label>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {newProduct.highlights.map((highlight, idx) => (
                      <input 
                        key={idx}
                        placeholder={`Highlight ${idx + 1} (e.g. Long-lasting)`}
                        value={highlight}
                        onChange={(e) => {
                          const newHighlights = [...newProduct.highlights];
                          newHighlights[idx] = e.target.value;
                          setNewProduct({...newProduct, highlights: newHighlights});
                        }}
                        className="w-full p-5 bg-gray-50 rounded-2xl font-bold border-none outline-none focus:ring-4 focus:ring-[#B0843D]/10 text-[16px] italic font-serif text-[#1A1A1A] placeholder:text-black/20"
                      />
                    ))}
                  </div>
                  <p className="text-[10px] font-black uppercase opacity-20 tracking-widest italic">Visible as bullet points on the product page.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                   <div className="space-y-3">
                      <label className="text-[12px] font-black uppercase opacity-30">Main Product Image</label>
                      <div className="relative aspect-[4/3] bg-gray-50 rounded-2xl md:rounded-3xl border-2 border-dashed flex flex-col items-center justify-center overflow-hidden group">
                         {imagePreview ? <img src={imagePreview} className="w-full h-full object-contain" /> : <div className="text-center"><PlusCircle className="w-8 h-8 text-black/10 mx-auto mb-2" /><p className="font-serif italic opacity-30 text-base">Select Asset</p></div>}
                         <input type="file" onChange={handleImageChange} className="absolute inset-0 opacity-0 cursor-pointer" />
                         <button 
                           type="button"
                           onClick={() => { setMediaLibraryContext({ type: 'new', field: 'image' }); setIsMediaLibraryOpen(true); }}
                           className="absolute bottom-2 right-2 bg-black/60 backdrop-blur-md text-white px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-[#B0843D] transition-all z-10"
                         >
                            Library
                         </button>
                      </div>
                   </div>
                   <div className="space-y-3">
                      <label className="text-[12px] font-black uppercase text-[#B0843D]">Cinematic Preview (Video)</label>
                      <div className="relative aspect-[4/3] bg-gray-50 rounded-2xl md:rounded-3xl border-2 border-dashed flex flex-col items-center justify-center overflow-hidden group">
                         {videoPreview || newProduct.video ? (
                            <video src={videoPreview || newProduct.video} className="w-full h-full object-cover" muted loop autoPlay />
                         ) : (
                            <div className="text-center"><Zap className="w-8 h-8 text-black/10 mx-auto mb-2" /><p className="font-serif italic opacity-30 text-base">Add Video</p></div>
                         )}
                         <input type="file" accept="video/*" onChange={handleVideoChange} className="absolute inset-0 opacity-0 cursor-pointer" />
                      </div>
                   </div>
                </div>
 
                <div className="space-y-4">
                   <label className="text-[12px] font-black uppercase text-[#B0843D] tracking-widest">Optional Gallery (Extra Images)</label>
                   <div className="grid grid-cols-4 gap-3">
                     {[0, 1, 2, 3].map((idx) => (
                       <div key={idx} className="relative aspect-square bg-gray-50 rounded-2xl border-2 border-dashed flex flex-col items-center justify-center overflow-hidden group">
                         {newProduct.extraImages?.[idx] ? (
                           <img src={newProduct.extraImages[idx]} className="w-full h-full object-cover" alt={`Gallery ${idx + 1}`} />
                         ) : (
                           <div className="text-center p-1 opacity-20 group-hover:opacity-100 transition-opacity">
                             <PlusCircle className="w-6 h-6 mx-auto" />
                           </div>
                         )}
                         <input type="file" onChange={(e) => handleExtraImageChange(e, idx)} className="absolute inset-0 opacity-0 cursor-pointer" />
                         <button 
                           type="button"
                           onClick={() => { setMediaLibraryContext({ type: 'new', field: 'extra', index: idx }); setIsMediaLibraryOpen(true); }}
                           className="absolute bottom-1 right-1 bg-black/40 backdrop-blur-md text-white p-1 rounded-md text-[8px] font-black uppercase hover:bg-[#B0843D] transition-all z-10 opacity-0 group-hover:opacity-100"
                         >
                            Lib
                         </button>
                       </div>
                     ))}
                   </div>
                   <p className="text-[10px] font-black uppercase opacity-20 tracking-widest italic">These appear as secondary thumbnails on the product page.</p>
                </div>

                <button type="submit" disabled={isUploading} className="w-full bg-[#B0843D] text-white py-5 md:py-7 rounded-2xl md:rounded-3xl font-black uppercase text-[13px] md:text-[14px] shadow-xl hover:scale-[1.01] active:scale-95 transition-all">
                   {isUploading ? "Syncing Media..." : "Publish Achievement"}
                </button>
              </form>
            </div>
          )}

          {activeTab === "Hero Slider" && (
            <div className="max-w-6xl mx-auto space-y-12 pb-24 px-4">
               <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
                  <div>
                    <h2 className="text-4xl md:text-7xl font-serif font-black italic tracking-tighter text-[#310101]">Hero Management</h2>
                    <p className="text-[#B0843D] font-black uppercase tracking-[0.3em] text-[13px] mt-4">Curate your sanctuary's flagship entry message</p>
                  </div>
                  <div className="p-4 bg-white border rounded-2xl flex items-center gap-4 shadow-sm">
                    <ShieldAlert className="w-6 h-6 text-[#310101]/20" />
                    <p className="text-[11px] font-black uppercase text-black/40">Authorized Access Only</p>
                  </div>
               </div>

               <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
                  {/* Form */}
                  <div id="hero-admin-form" className="lg:col-span-1 bg-white p-10 rounded-[50px] shadow-sm border border-[#E5D5C5]/30">
                    <div className="flex justify-between items-center mb-8">
                       <h3 className="text-2xl font-serif font-black italic">{editingHeroSlide ? "Update Slide" : "Add New Slide"}</h3>
                       {editingHeroSlide && <button onClick={() => { setEditingHeroSlide(null); setHeroImagePreview(null); }} className="text-[11px] font-black uppercase text-red-500 hover:underline">Cancel Edit</button>}
                    </div>
                    <form onSubmit={editingHeroSlide ? handleUpdateHeroSlide : handleAddHeroSlide} className="space-y-6">
                      <div className="space-y-4">
                        <label className="text-[12px] font-black uppercase text-[#B0843D]">Title Line 1 (Optional)</label>
                        <input value={editingHeroSlide ? editingHeroSlide.titleFirstLine : newHeroSlide.titleFirstLine} onChange={e => editingHeroSlide ? setEditingHeroSlide({...editingHeroSlide, titleFirstLine: e.target.value}) : setNewHeroSlide({...newHeroSlide, titleFirstLine: e.target.value})} className="w-full p-5 bg-gray-50 rounded-2xl font-bold italic outline-none focus:ring-4 focus:ring-[#B0843D]/5" />
                      </div>
                      <div className="space-y-4">
                        <label className="text-[12px] font-black uppercase text-[#B0843D]">Gold Highlight Text (Optional)</label>
                        <input value={editingHeroSlide ? editingHeroSlide.titleHighlight : newHeroSlide.titleHighlight} onChange={e => editingHeroSlide ? setEditingHeroSlide({...editingHeroSlide, titleHighlight: e.target.value}) : setNewHeroSlide({...newHeroSlide, titleHighlight: e.target.value})} className="w-full p-5 bg-gray-50 rounded-2xl font-bold italic outline-none focus:ring-4 focus:ring-[#B0843D]/5" />
                      </div>
                      <div className="space-y-4">
                        <label className="text-[12px] font-black uppercase text-[#B0843D]">Title Line 2 (Optional)</label>
                        <input value={editingHeroSlide ? editingHeroSlide.titleLastLine : newHeroSlide.titleLastLine} onChange={e => editingHeroSlide ? setEditingHeroSlide({...editingHeroSlide, titleLastLine: e.target.value}) : setNewHeroSlide({...newHeroSlide, titleLastLine: e.target.value})} className="w-full p-5 bg-gray-50 rounded-2xl font-bold italic outline-none focus:ring-4 focus:ring-[#B0843D]/5" />
                      </div>
                      <div className="space-y-4">
                        <label className="text-[12px] font-black uppercase text-[#B0843D]">Aromatic Subtitle (Optional)</label>
                        <textarea value={editingHeroSlide ? editingHeroSlide.subtitle : newHeroSlide.subtitle} onChange={e => editingHeroSlide ? setEditingHeroSlide({...editingHeroSlide, subtitle: e.target.value}) : setNewHeroSlide({...newHeroSlide, subtitle: e.target.value})} className="w-full h-32 p-5 bg-gray-50 rounded-2xl font-medium italic outline-none resize-none" />
                      </div>
                      <div className="space-y-4">
                        <label className="text-[12px] font-black uppercase text-[#B0843D]">Button Text & Link</label>
                        <div className="grid grid-cols-2 gap-4">
                           <input required placeholder="BTN Text" value={editingHeroSlide ? editingHeroSlide.buttonText : newHeroSlide.buttonText} onChange={e => editingHeroSlide ? setEditingHeroSlide({...editingHeroSlide, buttonText: e.target.value}) : setNewHeroSlide({...newHeroSlide, buttonText: e.target.value})} className="w-full p-5 bg-gray-50 rounded-2xl font-bold outline-none" />
                           <input required placeholder="/shop" value={editingHeroSlide ? editingHeroSlide.link : newHeroSlide.link} onChange={e => editingHeroSlide ? setEditingHeroSlide({...editingHeroSlide, link: e.target.value}) : setNewHeroSlide({...newHeroSlide, link: e.target.value})} className="w-full p-5 bg-gray-50 rounded-2xl font-bold outline-none" />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-3">
                          <label className="text-[12px] font-black uppercase text-[#B0843D]">Media Focus</label>
                          <select value={editingHeroSlide ? editingHeroSlide.objectPosition : newHeroSlide.objectPosition} onChange={e => editingHeroSlide ? setEditingHeroSlide({...editingHeroSlide, objectPosition: e.target.value}) : setNewHeroSlide({...newHeroSlide, objectPosition: e.target.value})} className="w-full p-4 bg-gray-50 rounded-2xl font-bold outline-none appearance-none border-none">
                             <option value="top">Top</option>
                             <option value="center">Center</option>
                             <option value="bottom">Bottom</option>
                          </select>
                        </div>
                        <div className="space-y-3">
                          <label className="text-[12px] font-black uppercase text-[#B0843D]">Display Mode</label>
                          <select value={editingHeroSlide ? editingHeroSlide.displayMode : newHeroSlide.displayMode} onChange={e => editingHeroSlide ? setEditingHeroSlide({...editingHeroSlide, displayMode: e.target.value}) : setNewHeroSlide({...newHeroSlide, displayMode: e.target.value})} className="w-full p-4 bg-gray-50 rounded-2xl font-bold outline-none appearance-none border-none">
                             <option value="cover">Cover (Fill screen)</option>
                             <option value="contain">Full Frame (Show all)</option>
                          </select>
                        </div>
                      </div>

                      <div className="space-y-4">
                        <label className="text-[12px] font-black uppercase text-[#B0843D]">Masterpiece Zoom Control ({Math.round((editingHeroSlide?.imageScale || newHeroSlide.imageScale || 1) * 100)}%)</label>
                        <input type="range" min="0.5" max="1.5" step="0.01" value={editingHeroSlide ? (editingHeroSlide.imageScale || 1) : (newHeroSlide.imageScale || 1)} onChange={e => editingHeroSlide ? setEditingHeroSlide({...editingHeroSlide, imageScale: parseFloat(e.target.value)}) : setNewHeroSlide({...newHeroSlide, imageScale: parseFloat(e.target.value)})} className="w-full accent-[#B0843D] h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer" />
                        <p className="text-[10px] uppercase font-black text-black/20 italic tracking-tighter">Zoom out (below 100%) to fit the entire bottle without cutting.</p>
                      </div>

                      <div className="space-y-4">
                        <label className="text-[12px] font-black uppercase text-[#B0843D]">Background Atmosphere</label>
                        <div className="flex gap-4">
                          <input type="color" value={editingHeroSlide ? editingHeroSlide.backgroundColor : newHeroSlide.backgroundColor} onChange={e => editingHeroSlide ? setEditingHeroSlide({...editingHeroSlide, backgroundColor: e.target.value}) : setNewHeroSlide({...newHeroSlide, backgroundColor: e.target.value})} className="h-14 w-14 rounded-xl cursor-pointer bg-transparent border-none appearance-none" />
                          <input value={editingHeroSlide ? editingHeroSlide.backgroundColor : newHeroSlide.backgroundColor} onChange={e => editingHeroSlide ? setEditingHeroSlide({...editingHeroSlide, backgroundColor: e.target.value}) : setNewHeroSlide({...newHeroSlide, backgroundColor: e.target.value})} className="flex-1 p-4 bg-gray-50 rounded-2xl font-bold outline-none border-none" />
                        </div>
                        <p className="text-[10px] uppercase font-black text-black/20 italic tracking-tighter">Pro Tip: Zoom Out + Match Background = 100% Professional Look.</p>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-4">
                          <label className="text-[12px] font-black uppercase text-[#B0843D]">Desktop Asset (Wide View)</label>
                          <div className="relative aspect-video bg-gray-50 rounded-[30px] border-2 border-dashed border-[#B0843D]/20 flex flex-col items-center justify-center overflow-hidden group">
                             {heroImagePreview || heroVideoPreview ? (
                                heroVideoPreview ? <video src={heroVideoPreview} className="w-full h-full object-cover" muted autoPlay loop /> : <img src={heroImagePreview!} className="w-full h-full object-cover" />
                             ) : (
                                <div className="text-center opacity-30 group-hover:opacity-100 transition-opacity">
                                   <Monitor className="w-8 h-8 mx-auto mb-2 text-[#B0843D]" />
                                   <p className="text-[10px] uppercase font-black tracking-widest text-[#B0843D]">Desktop Upload</p>
                                </div>
                             )}
                             <input type="file" onChange={(e) => handleHeroMediaChange(e, 'desktop')} className="absolute inset-0 opacity-0 cursor-pointer" />
                          </div>
                        </div>

                        <div className="space-y-4">
                          <label className="text-[12px] font-black uppercase text-[#B0843D]">Mobile Asset (Optional Portrait)</label>
                          <div className="relative aspect-[9/16] bg-gray-50 rounded-[30px] border-2 border-dashed border-[#B0843D]/20 flex flex-col items-center justify-center overflow-hidden group max-h-[300px] mx-auto w-full">
                             {heroMobileImagePreview || heroMobileVideoPreview ? (
                                heroMobileVideoPreview ? <video src={heroMobileVideoPreview} className="w-full h-full object-cover" muted autoPlay loop /> : <img src={heroMobileImagePreview!} className="w-full h-full object-cover" />
                             ) : (
                                <div className="text-center opacity-30 group-hover:opacity-100 transition-opacity">
                                   <Smartphone className="w-8 h-8 mx-auto mb-2 text-[#B0843D]" />
                                   <p className="text-[10px] uppercase font-black tracking-widest text-[#B0843D]">Mobile Upload</p>
                                </div>
                             )}
                             <input type="file" onChange={(e) => handleHeroMediaChange(e, 'mobile')} className="absolute inset-0 opacity-0 cursor-pointer" />
                          </div>
                        </div>
                      </div>
                      {isHeroUploading && <p className="text-[10px] font-black uppercase text-[#B0843D] animate-pulse text-center">Syncing with High-Fidelity Cloud...</p>}

                      <button type="submit" disabled={isHeroUploading} className="w-full bg-[#B0843D] text-white py-6 rounded-3xl font-black uppercase tracking-widest shadow-xl hover:scale-105 active:scale-95 transition-all mt-4 disabled:opacity-50">
                        {isHeroUploading ? "Syncing Media..." : (editingHeroSlide ? "Update Masterpiece" : "Integrate Slide")}
                      </button>
                    </form>
                  </div>

                  {/* List */}
                  <div className="lg:col-span-2 space-y-8">
                    <h3 className="text-2xl font-serif font-black italic">Active Flagship Slides</h3>
                    {heroSlides.length === 0 ? (
                      <div className="bg-white p-20 rounded-[50px] border border-dashed flex flex-col items-center justify-center opacity-30 italic font-serif">
                         <Image className="w-16 h-16 mb-4" />
                         <p className="text-2xl">No Active Hero Portals</p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {heroSlides.map((slide) => (
                           <div key={slide.id} className="bg-white p-8 rounded-[40px] shadow-sm border group hover:shadow-2xl transition-all relative overflow-hidden flex flex-col">
                              <div className="absolute top-0 right-0 p-8 flex gap-2 z-10 translate-y-2 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all">
                                 <button onClick={() => handleEditHeroClick(slide)} className="w-12 h-12 rounded-full bg-white text-black border flex items-center justify-center shadow-lg hover:bg-black hover:text-white transition-all"><Settings className="w-5 h-5" /></button>
                                 <button onClick={() => handleDeleteHeroSlide(slide.id)} className="w-12 h-12 rounded-full bg-red-500 text-white flex items-center justify-center shadow-lg hover:scale-110 active:scale-90 transition-all"><Trash2 className="w-5 h-5" /></button>
                              </div>
                              <div className="aspect-[4/5] rounded-[30px] overflow-hidden mb-6 bg-gray-50 border relative">
                                 {/* Device Indicators */}
                                 <div className="absolute top-4 left-4 z-20 flex gap-1.5">
                                    {(slide.image || slide.video) && (
                                      <span className="w-6 h-6 rounded-md bg-black/60 backdrop-blur-md text-white text-[9px] font-black flex items-center justify-center border border-white/20">D</span>
                                    )}
                                    {(slide.mobileImage || slide.mobileVideo) && (
                                      <span className="w-6 h-6 rounded-md bg-[#B0843D]/80 backdrop-blur-md text-white text-[9px] font-black flex items-center justify-center border border-white/20">M</span>
                                    )}
                                 </div>

                                 {(slide.video || slide.mobileVideo || (slide.image || slide.mobileImage)?.match(/\.(mp4|mov|webm|quicktime)$|video\/upload/)) ? (
                                    <video 
                                      src={slide.video || slide.image || slide.mobileVideo || slide.mobileImage} 
                                      className="w-full h-full object-cover" 
                                      muted loop autoPlay 
                                    />
                                 ) : (
                                    <img 
                                      src={slide.image || slide.mobileImage} 
                                      className="w-full h-full object-cover" 
                                      style={{ objectPosition: slide.objectPosition || "top" }} 
                                    />
                                 )}
                                 <div className="absolute inset-x-0 bottom-0 p-6 bg-gradient-to-t from-black/80 to-transparent">
                                    <h5 className="text-[#E5D5C5] font-serif font-black italic text-xl leading-tight">
                                      {slide.titleFirstLine} {slide.titleHighlight} {slide.titleLastLine}
                                    </h5>
                                 </div>
                              </div>
                              <div className="space-y-4 px-2">
                                 <p className="text-[13px] font-medium text-black/50 italic line-clamp-2">"{slide.subtitle}"</p>
                                 <div className="flex items-center gap-4 pt-4 border-t border-gray-100">
                                    <span className="text-[10px] font-black uppercase tracking-widest text-[#B0843D] px-3 py-1.5 bg-[#B0843D]/5 rounded-full">{slide.buttonText || "PREVIEW"}</span>
                                    <span className="text-[10px] font-black uppercase tracking-widest opacity-20">{slide.link}</span>
                                 </div>
                              </div>
                           </div>
                        ))}
                      </div>
                    )}
                  </div>
               </div>
            </div>
          )}

          {activeTab === "Settings" && (
            <div className="max-w-6xl mx-auto space-y-8 md:space-y-12 pb-24 px-4">
               <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                  <h2 className="text-4xl md:text-7xl font-serif font-black italic tracking-tighter text-[#310101]">Dashboard Core</h2>
                  <span className="text-[12px] md:text-[15px] font-black uppercase tracking-[0.3em] text-[#B0843D] md:pb-3 border-b-2 border-[#B0843D]/20 inline-block">System Configuration</span>
               </div>
               
               <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 md:gap-12">
                  <div className="bg-white p-6 md:p-12 rounded-[40px] md:rounded-[60px] shadow-sm border border-[#E5D5C5]/30 space-y-8 md:space-y-10 relative overflow-hidden">
                     <div className="absolute top-0 right-0 w-40 h-40 bg-[#310101]/5 rounded-full -mr-20 -mt-20 blur-2xl"></div>
                     <h3 className="text-2xl md:text-3xl font-serif font-black italic text-[#310101]">Signature Profile</h3>
                     <div className="space-y-8 relative z-10">
                        <div className="space-y-3">
                           <label className="text-[14px] font-black uppercase text-[#B0843D] tracking-widest">Signature Name</label>
                           <input value={storeSettings.name || ""} onChange={e => setStoreSettings({...storeSettings, name: e.target.value})} className="w-full p-6 bg-gray-50 rounded-3xl font-bold outline-none focus:ring-4 focus:ring-[#B0843D]/10 transition-all border-none" />
                        </div>
                        <div className="space-y-3">
                           <label className="text-[14px] font-black uppercase text-[#B0843D] tracking-widest">Support Email</label>
                           <input type="email" value={storeSettings.email || ""} onChange={e => setStoreSettings({...storeSettings, email: e.target.value})} className="w-full p-6 bg-gray-50 rounded-3xl font-bold outline-none focus:ring-4 focus:ring-[#B0843D]/10 transition-all border-none" />
                        </div>
                        
                        <div className="grid grid-cols-2 gap-6">
                           <div className="space-y-3">
                              <label className="text-[14px] font-black uppercase text-[#B0843D] tracking-widest">Base Currency</label>
                              <select value={storeSettings.currency || "INR (\u20B9)"} onChange={e => setStoreSettings({...storeSettings, currency: e.target.value})} className="w-full p-6 bg-gray-50 rounded-3xl font-bold outline-none focus:ring-4 focus:ring-[#B0843D]/10 transition-all border-none appearance-none">
                                 <option>INR ({"\u20B9"})</option>
                                 <option>USD ($)</option>
                                 <option>AED ({"\u062F.\u0625"})</option>
                                 <option>GBP ({"\u00A3"})</option>
                                 <option>EUR ({"\u20AC"})</option>
                              </select>
                           </div>
                           <div className="space-y-3">
                              <label className="text-[14px] font-black uppercase text-[#B0843D] tracking-widest">Contact Phone</label>
                              <input placeholder="+91..." value={storeSettings.phone || ""} onChange={e => setStoreSettings({...storeSettings, phone: e.target.value})} className="w-full p-6 bg-gray-50 rounded-3xl font-bold outline-none focus:ring-4 focus:ring-[#B0843D]/10 transition-all border-none" />
                           </div>
                        </div>

                        <div className="space-y-3">
                           <label className="text-[14px] font-black uppercase text-[#B0843D] tracking-widest">Checkout Promo Message</label>
                           <input placeholder="E.g. FREE GIFT ON ALL PREPAID ORDERS" value={storeSettings.checkoutPromo || ""} onChange={e => setStoreSettings({...storeSettings, checkoutPromo: e.target.value})} className="w-full p-6 bg-gray-50 rounded-3xl font-bold outline-none focus:ring-4 focus:ring-[#B0843D]/10 transition-all border-none" />
                        </div>

                        <div className="grid grid-cols-2 gap-6">
                           <div className="space-y-3">
                              <label className="text-[14px] font-black uppercase text-[#B0843D] tracking-widest">Instagram Handle</label>
                              <input placeholder="@username" value={storeSettings.instagram || ""} onChange={e => setStoreSettings({...storeSettings, instagram: e.target.value})} className="w-full p-6 bg-gray-50 rounded-3xl font-bold outline-none focus:ring-4 focus:ring-[#B0843D]/10 transition-all border-none" />
                           </div>
                           <div className="space-y-3">
                              <label className="text-[14px] font-black uppercase text-[#B0843D] tracking-widest">WhatsApp Link</label>
                              <input placeholder="+91..." value={storeSettings.whatsapp || ""} onChange={e => setStoreSettings({...storeSettings, whatsapp: e.target.value})} className="w-full p-6 bg-gray-50 rounded-3xl font-bold outline-none focus:ring-4 focus:ring-[#B0843D]/10 transition-all border-none" />
                           </div>
                        </div>

                        <button onClick={() => toast.success("Signature Profile Synchronized")} className="w-full bg-[#310101] text-white py-6 rounded-[30px] font-black uppercase text-[14px] shadow-xl tracking-[0.2em] hover:scale-[1.02] active:scale-95 transition-all mt-4 border border-[#310101]/20 group">
                           <span className="group-hover:text-[#B0843D] transition-colors">Update Configuration</span>
                        </button>
                     </div>
                  </div>

                  <div className="space-y-8 md:space-y-12">
                     <div className="bg-white p-6 md:p-12 rounded-[40px] md:rounded-[60px] shadow-sm border border-[#E5D5C5]/30 space-y-8 md:space-y-10 group hover:shadow-xl transition-all relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-40 h-40 bg-[#B0843D]/10 rounded-full -mr-20 -mt-20 blur-2xl"></div>
                        <h3 className="text-2xl md:text-3xl font-serif font-black italic text-[#310101]">Security & Aesthetics</h3>
                        <div className="space-y-8 relative z-10">
                           <div className="space-y-4">
                              <label className="text-[14px] font-black uppercase text-[#B0843D] tracking-widest">Accent Brand Color</label>
                              <div className="flex flex-wrap gap-4">
                                 {["#310101", "#B0843D", "#4A5D23", "#1A1A1A", "#8B4513"].map(c => (
                                   <div 
                                     key={c} 
                                     onClick={async () => {
                                       const nextSets = {...storeSettings, accentColor: c};
                                       setStoreSettings(nextSets);
                                       await setDoc(doc(db, "metadata", "settings"), nextSets, { merge: true });
                                       toast.success("Brand Color Applied", {
                                         style: { background: c, color: '#fff' }
                                       });
                                     }} 
                                     style={{backgroundColor: c}} 
                                     className={`w-14 h-14 rounded-2xl cursor-pointer border-4 transition-all ${storeSettings.accentColor === c ? 'border-[#E5D5C5] scale-110 shadow-2xl ring-2 ring-black/10' : 'border-transparent opacity-60 hover:opacity-100'}`} 
                                   />
                                 ))}
                              </div>
                           </div>

                           <div className="space-y-4 pt-6">
                              <div className="p-8 bg-gray-50/80 backdrop-blur-sm rounded-[40px] flex items-center justify-between border border-transparent hover:border-[#E5D5C5]/50 transition-all">
                                 <div>
                                    <p className="font-black uppercase text-[15px] mb-1.5 text-[#310101] tracking-widest">Site Maintenance Mode</p>
                                    <p className="text-[14px] text-black/40 font-medium">Disable public access temporarily</p>
                                 </div>
                                 <div onClick={async () => {
                                   const next = !storeSettings.maintenanceMode;
                                   const nextSets = {...storeSettings, maintenanceMode: next};
                                   setStoreSettings(nextSets);
                                   await setDoc(doc(db, "metadata", "settings"), nextSets, { merge: true });
                                   toast.success(`Maintenance ${next ? "Active" : "Disabled"}`);
                                 }} className={`w-14 h-8 rounded-full p-1 cursor-pointer transition-all shadow-inner ${storeSettings.maintenanceMode ? 'bg-[#310101]' : 'bg-gray-300'}`}>
                                    <div className={`w-6 h-6 bg-white rounded-full transition-transform shadow-md ${storeSettings.maintenanceMode ? 'translate-x-6' : 'translate-x-0'}`} />
                                 </div>
                              </div>
                              
                              <div className="p-8 bg-gray-50/80 backdrop-blur-sm rounded-[40px] flex items-center justify-between border border-transparent hover:border-[#E5D5C5]/50 transition-all">
                                 <div>
                                    <p className="font-black uppercase text-[15px] mb-1.5 text-[#310101] tracking-widest">Public Catalog Live</p>
                                    <p className="text-[14px] text-black/40 font-medium">Keep catalog indexing open for SEO</p>
                                 </div>
                                 <div onClick={async () => {
                                   const next = typeof storeSettings.publicLivePage === 'undefined' ? false : !storeSettings.publicLivePage;
                                   const nextSets = {...storeSettings, publicLivePage: next};
                                   setStoreSettings(nextSets);
                                   await setDoc(doc(db, "metadata", "settings"), nextSets, { merge: true });
                                   toast.success(`Catalog ${next ? "Live" : "Private"}`);
                                 }} className={`w-14 h-8 rounded-full p-1 cursor-pointer transition-all shadow-inner ${storeSettings.publicLivePage !== false ? 'bg-green-500' : 'bg-gray-300'}`}>
                                    <div className={`w-6 h-6 bg-white rounded-full transition-transform shadow-md ${storeSettings.publicLivePage !== false ? 'translate-x-6' : 'translate-x-0'}`} />
                                 </div>
                              </div>

                              <div className="p-8 bg-gray-50/80 backdrop-blur-sm rounded-[40px] flex items-center justify-between border border-transparent hover:border-[#E5D5C5]/50 transition-all">
                                 <div>
                                    <p className="font-black uppercase text-[15px] mb-1.5 text-[#310101] tracking-widest">Rotate Announcements</p>
                                    <p className="text-[14px] text-black/40 font-medium">Cycle through all active announcements</p>
                                 </div>
                                 <button 
                                   onClick={async () => {
                                     const currentVal = storeSettings.rotateAnnouncements !== false;
                                     const next = !currentVal;
                                     const nextSets = {...storeSettings, rotateAnnouncements: next};
                                     setStoreSettings(nextSets);
                                     
                                     try {
                                       await setDoc(doc(db, "metadata", "settings"), nextSets, { merge: true });
                                       toast.success(`Rotation ${next ? "Enabled" : "Disabled"}`);
                                     } catch (err) {
                                       toast.error("Failed to sync setting");
                                       // Revert local state on error
                                       setStoreSettings(storeSettings);
                                     }
                                   }} 
                                   className={`w-14 h-8 rounded-full p-1 transition-all duration-300 shadow-inner relative flex items-center ${storeSettings.rotateAnnouncements !== false ? 'bg-[#310101]' : 'bg-gray-300'}`}
                                 >
                                    <div className={`w-6 h-6 bg-white rounded-full transition-transform duration-300 shadow-md ${storeSettings.rotateAnnouncements !== false ? 'translate-x-6' : 'translate-x-0'}`} />
                                 </button>
                              </div>

                              <div className="p-8 bg-gray-50/80 backdrop-blur-sm rounded-[40px] flex items-center justify-between border border-[#310101]/5 hover:border-red-200 transition-all">
                                 <div>
                                    <p className="font-black uppercase text-[15px] mb-1.5 text-[#310101] tracking-widest flex items-center gap-2">
                                       <ShieldAlert className="w-3.5 h-3.5 text-red-500" /> 
                                       Protected Auth Mode
                                    </p>
                                    <p className="text-[14px] text-black/40 font-medium">Require strict Admin rules for sign-ins</p>
                                 </div>
                                 <div onClick={() => setStoreSettings({...storeSettings, protectedMode: typeof storeSettings.protectedMode === 'undefined' ? true : !storeSettings.protectedMode})} className={`w-14 h-8 rounded-full p-1 cursor-pointer transition-all shadow-inner ${storeSettings.protectedMode !== false ? 'bg-red-900' : 'bg-gray-300'}`}>
                                    <div className={`w-6 h-6 bg-white rounded-full transition-transform shadow-md ${storeSettings.protectedMode !== false ? 'translate-x-6' : 'translate-x-0'}`} />
                                 </div>
                              </div>
                           </div>
                        </div>
                     </div>
                  </div>
               </div>
            </div>
          )}

        </div>
      </main>



      <AnimatePresence>
        {selectedOrder && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-md">
             <motion.div initial={{ y: 50, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 50, opacity: 0 }} className="bg-white p-16 rounded-[60px] shadow-2xl max-w-2xl w-full relative overflow-hidden">
                <div className="absolute top-0 right-0 p-12 opacity-5 pointer-events-none">
                   <ShoppingBag className="w-40 h-40" />
                </div>
                
                <h3 className="text-6xl font-serif font-black italic mb-12 tracking-tighter">Order Details</h3>
                
                <div className="grid grid-cols-2 gap-12 mb-12">
                   <div className="space-y-2">
                      <p className="text-[14px] font-black uppercase opacity-30 tracking-[0.2em]">Customer</p>
                      <p className="text-xl font-bold font-serif italic">{selectedOrder.customer}</p>
                   </div>
                   <div className="space-y-2">
                      <p className="text-[14px] font-black uppercase opacity-30 tracking-[0.2em]">Order ID</p>
                      <p className="text-xl font-mono font-black">{selectedOrder.id}</p>
                   </div>
                </div>

                <div className="space-y-6 mb-12">
                   <p className="text-[14px] font-black uppercase opacity-30 tracking-[0.2em]">Purchased Items</p>
                   <div className="space-y-3">
                      {selectedOrder.items.map((it: string, idx: number) => (
                         <div key={idx} className="p-4 bg-gray-50 rounded-2xl flex items-center justify-between">
                            <span className="font-serif italic font-bold text-lg">{it}</span>
                            <span className="text-[15px] font-black uppercase opacity-40">1x Unit</span>
                         </div>
                      ))}
                   </div>
                </div>

                <div className="space-y-6 mb-12">
                   <p className="text-[14px] font-black uppercase opacity-30 tracking-[0.2em]">Journey History</p>
                   <div className="space-y-4 border-l-2 border-dashed border-gray-100 ml-4 pl-8">
                      {selectedOrder.history.map((h: any, idx: number) => (
                         <div key={idx} className="relative">
                            <div className="absolute -left-[37px] top-1.5 w-4 h-4 rounded-full bg-white border-4 border-[#B0843D]" />
                            <p className="text-[14px] font-black uppercase tracking-widest">{h.event}</p>
                            <p className="text-[15px] font-medium opacity-40">{h.time}</p>
                         </div>
                      ))}
                   </div>
                </div>

                <div className="space-y-6 mb-12">
                   <p className="text-[14px] font-black uppercase opacity-30 tracking-[0.2em]">Update Status</p>
                   <div className="flex gap-4">
                      {["Pending", "In Transit", "Delivered"].map((st) => (
                         <button 
                           key={st}
                           onClick={() => handleUpdateOrderStatus(selectedOrder.id, st)}
                           className={`flex-1 py-4 rounded-2xl text-[14px] font-black uppercase tracking-widest transition-all ${
                             selectedOrder.status === st ? 'bg-black text-white shadow-xl' : 'bg-gray-50 text-black/20 hover:bg-gray-100'
                           }`}
                         >
                            {st}
                         </button>
                      ))}
                   </div>
                </div>

                <button onClick={() => setSelectedOrder(null)} className="w-full py-8 bg-[#310101] text-white rounded-[35px] font-black uppercase shadow-2xl tracking-[0.4em] text-[14px] hover:scale-[1.02] active:scale-95 transition-all">Close Portal</button>
                <button onClick={() => setSelectedOrder(null)} className="absolute top-12 right-12 p-4 bg-gray-100 rounded-full hover:bg-black hover:text-white transition-all"><X /></button>
             </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Modals */}
      <AnimatePresence>
        {isNewsModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-2 md:p-4 bg-black/50 backdrop-blur-md overflow-y-auto">
            <motion.div initial={{ scale: 0.95, y: 20, opacity: 0 }} animate={{ scale: 1, y: 0, opacity: 1 }} exit={{ scale: 0.95, y: 20, opacity: 0 }} className="bg-white w-full max-w-4xl rounded-[40px] md:rounded-[60px] shadow-2xl relative overflow-hidden my-8">
                <div className="bg-[#310101] p-6 md:p-12 flex justify-between items-center text-[#E5D5C5]">
                   <div className="flex items-center gap-6">
                      <div className="w-16 h-16 rounded-[22px] bg-[#B0843D] flex items-center justify-center shadow-2xl">
                         <Newspaper className="w-8 h-8 text-white" />
                      </div>
                      <div>
                         <h2 className="text-4xl font-serif font-black uppercase italic tracking-tighter">Broadcast Desk</h2>
                         <p className="text-[14px] font-black uppercase tracking-[0.3em] opacity-50">Publish announcements to your Signature clientele</p>
                      </div>
                   </div>
                   <button onClick={() => {
                        setIsNewsModalOpen(false);
                        setEditingNews(null);
                    }} className="w-12 h-12 rounded-full hover:bg-white/10 flex items-center justify-center transition-all"><X /></button>
                </div>
                <form onSubmit={editingNews ? handleUpdateNews : handleAddNews} className="p-16 space-y-12">
                   <div className="space-y-4">
                      <label className="text-[12px] md:text-[14px] font-black uppercase text-[#B0843D] tracking-widest">Message Headline</label>
                      <input 
                        required 
                        placeholder="E.g. Eid-ul-Fitr Special Offer: 20% off!" 
                        value={editingNews ? editingNews.title : newNews.title} 
                        onChange={e => editingNews ? setEditingNews({...editingNews, title: e.target.value}) : setNewNews({...newNews, title: e.target.value})} 
                        className="w-full text-2xl md:text-5xl font-serif font-black outline-none border-b-4 border-gray-50 focus:border-[#B0843D] transition-all italic text-[#310101]" 
                      />
                   </div>
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
                      <div className="space-y-4">
                         <label className="text-[12px] md:text-[14px] font-black uppercase text-[#B0843D] tracking-widest">Valid From</label>
                         <input 
                           type="date" 
                           value={editingNews ? editingNews.startDate : newNews.startDate} 
                           onChange={e => editingNews ? setEditingNews({...editingNews, startDate: e.target.value}) : setNewNews({...newNews, startDate: e.target.value})} 
                           className="w-full p-4 md:p-6 bg-gray-50 rounded-2xl md:rounded-3xl font-bold border-none outline-none focus:ring-2 focus:ring-[#B0843D]/20 transition-all text-sm md:text-base" 
                         />
                      </div>
                      <div className="space-y-4">
                         <label className="text-[12px] md:text-[14px] font-black uppercase text-[#B0843D] tracking-widest">Valid Until (Expiry)</label>
                         <input 
                           type="date" 
                           value={editingNews ? editingNews.endDate : newNews.endDate} 
                           onChange={e => editingNews ? setEditingNews({...editingNews, endDate: e.target.value}) : setNewNews({...newNews, endDate: e.target.value})} 
                           className="w-full p-4 md:p-6 bg-gray-50 rounded-2xl md:rounded-3xl font-bold border-none outline-none focus:ring-2 focus:ring-[#B0843D]/20 transition-all text-sm md:text-base" 
                         />
                      </div>
                   </div>

                   <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
                      <div className="space-y-4">
                         <label className="text-[12px] md:text-[14px] font-black uppercase text-[#B0843D] tracking-widest">Target Category</label>
                         <select 
                           value={editingNews ? editingNews.targetCategory : newNews.targetCategory} 
                           onChange={e => {
                              const val = e.target.value;
                              if (editingNews) setEditingNews({...editingNews, targetCategory: val, targetSubCategory: "All"});
                              else setNewNews({...newNews, targetCategory: val, targetSubCategory: "All"});
                           }} 
                           className="w-full p-4 md:p-6 bg-gray-50 rounded-2xl md:rounded-3xl font-bold border-none outline-none text-sm md:text-base"
                         >
                            <option value="All">Apply to All Categories</option>
                            {allCategories.map(c => <option key={c} value={c}>{c}</option>)}
                         </select>
                      </div>
                      <div className="space-y-4">
                         <label className="text-[12px] md:text-[14px] font-black uppercase text-[#B0843D] tracking-widest">Target Sub-Category</label>
                         <select 
                           value={editingNews ? editingNews.targetSubCategory : newNews.targetSubCategory} 
                           onChange={e => {
                              const val = e.target.value;
                              if (editingNews) setEditingNews({...editingNews, targetSubCategory: val});
                              else setNewNews({...newNews, targetSubCategory: val});
                           }} 
                           className="w-full p-4 md:p-6 bg-gray-50 rounded-2xl md:rounded-3xl font-bold border-none outline-none text-sm md:text-base"
                         >
                            <option value="All">Apply to All Sub-Categories</option>
                            {(dynamicSubCategories[editingNews ? editingNews.targetCategory : newNews.targetCategory] || []).map(s => <option key={s} value={s}>{s}</option>)}
                         </select>
                      </div>
                      <div className="space-y-4">
                         <label className="text-[12px] md:text-[14px] font-black uppercase text-[#B0843D] tracking-widest">Discount Percentage (%)</label>
                         <input 
                           type="number" 
                           placeholder="E.g. 20" 
                           value={editingNews ? editingNews.discountPercent : newNews.discountPercent} 
                           onChange={e => editingNews ? setEditingNews({...editingNews, discountPercent: e.target.value}) : setNewNews({...newNews, discountPercent: e.target.value})} 
                           className="w-full p-4 md:p-6 bg-gray-50 rounded-2xl md:rounded-3xl font-bold border-none outline-none text-sm md:text-base" 
                         />
                      </div>
                   </div>
                   
                   <div className="space-y-4">
                      <label className="text-[12px] md:text-[14px] font-black uppercase text-[#B0843D] tracking-widest">Message Body / Details <span className="text-[10px] opacity-40 lowercase">(optional)</span></label>
                      <textarea 
                        placeholder="Write the full details of your offer or announcement here..." 
                        value={editingNews ? editingNews.content : newNews.content} 
                        onChange={e => editingNews ? setEditingNews({...editingNews, content: e.target.value}) : setNewNews({...newNews, content: e.target.value})} 
                        className="w-full h-32 md:h-48 outline-none text-lg md:text-2xl font-serif italic border-none resize-none opacity-50 focus:opacity-100 transition-all text-[#310101]" 
                      />
                   </div>
                   <button type="submit" className="w-full bg-[#B0843D] text-white py-6 md:py-10 rounded-[25px] md:rounded-[35px] font-black uppercase tracking-[0.2em] md:tracking-[0.5em] shadow-xl hover:bg-[#310101] transition-all text-[14px] md:text-[15px] hover:scale-[1.02] active:scale-95">
                      {editingNews ? "Update Live Broadcast" : "Send to Live Feed"}
                   </button>
                </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {editingProduct && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-8 bg-black/60 backdrop-blur-md overflow-hidden font-sans">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }} 
              animate={{ scale: 1, opacity: 1 }} 
              className="bg-white rounded-[32px] md:rounded-[40px] shadow-2xl max-w-4xl w-full max-h-[90vh] flex flex-col relative overflow-hidden"
            >
               {/* Header */}
               <div className="px-8 py-6 md:px-12 md:py-8 border-b border-gray-50 flex justify-between items-center shrink-0">
                  <h3 className="text-2xl md:text-3xl font-serif font-black italic text-[#310101]">Edit Product</h3>
                  <button onClick={() => setEditingProduct(null)} className="p-2 hover:bg-gray-100 rounded-full transition-all text-black/20 hover:text-black"><X className="w-6 h-6" /></button>
               </div>

               {/* Content Area */}
               <div className="flex-1 overflow-y-auto p-8 md:p-12 custom-scrollbar">
                  <form onSubmit={handleUpdateProduct} className="grid grid-cols-1 md:grid-cols-2 gap-8 text-black">
                     <div className="md:col-span-2 space-y-2.5">
                        <label className="text-[12px] font-black uppercase opacity-30 tracking-widest">Name</label>
                        <input value={editingProduct.name} onChange={e => setEditingProduct({...editingProduct, name: e.target.value})} className="w-full p-5 bg-gray-50 rounded-2xl font-bold border-none outline-none focus:ring-2 focus:ring-[#B0843D]/10" />
                     </div>
                     <div className="md:col-span-2 space-y-2.5">
                        <label className="text-[12px] font-black uppercase opacity-30 tracking-widest">Aromatic Story / Description</label>
                        <textarea value={editingProduct.description} onChange={e => setEditingProduct({...editingProduct, description: e.target.value})} className="w-full h-32 p-5 bg-gray-50 rounded-2xl font-serif italic text-lg border-none resize-none outline-none focus:ring-2 focus:ring-[#B0843D]/10" placeholder="Aromatic Story details..." />
                     </div>
                     
                     <div className="space-y-2.5">
                        <label className="text-[12px] font-black uppercase text-[#B0843D] tracking-widest">Product Category</label>
                        <select value={editingProduct.category} onChange={e => setEditingProduct({...editingProduct, category: e.target.value})} className="w-full p-5 bg-gray-50 rounded-2xl font-bold border-none outline-none">
                           {globalCategories.map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                     </div>
                     <div className="space-y-2.5">
                        <label className="text-[12px] font-black uppercase text-[#B0843D] tracking-widest">Sub Category</label>
                        <select value={editingProduct.subCategory} onChange={e => setEditingProduct({...editingProduct, subCategory: e.target.value})} className="w-full p-5 bg-gray-50 rounded-2xl font-bold border-none outline-none">
                           <option value="">No sub-category</option>
                           {(subCategoriesConfig[editingProduct.category] || []).map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                     </div>
                     <div className="space-y-2.5"><label className="text-[12px] font-black uppercase opacity-30 tracking-widest">Price (numeric)</label><input type="number" value={editingProduct.price} onChange={e => setEditingProduct({...editingProduct, price: e.target.value})} className="w-full p-5 bg-gray-50 rounded-2xl font-bold border-none outline-none" /></div>
                     <div className="space-y-2.5"><label className="text-[12px] font-black uppercase opacity-30 tracking-widest">Discount Price (numeric)</label><input type="number" value={editingProduct.discountPrice} onChange={e => setEditingProduct({...editingProduct, discountPrice: e.target.value})} className="w-full p-5 bg-gray-50 rounded-2xl font-bold border-none outline-none" /></div>
                     <div className="space-y-2.5"><label className="text-[12px] font-black uppercase opacity-30 tracking-widest">Stock Units</label><input type="number" value={editingProduct.stock} onChange={e => setEditingProduct({...editingProduct, stock: e.target.value})} className="w-full p-5 bg-gray-50 rounded-2xl font-bold border-none outline-none" /></div>
                     <div className="space-y-2.5">
                        <label className="text-[12px] font-black uppercase text-[#B0843D] tracking-widest">Arrival Status</label>
                        <button 
                          type="button"
                          onClick={() => setEditingProduct({...editingProduct, isNew: !editingProduct.isNew})}
                          className={`w-full p-5 rounded-2xl font-black uppercase text-[12px] tracking-widest transition-all flex items-center justify-center gap-3 ${editingProduct.isNew ? 'bg-[#B0843D] text-white shadow-xl' : 'bg-gray-100 text-black/20'}`}
                        >
                           <Zap className={`w-4 h-4 ${editingProduct.isNew ? 'fill-current' : ''}`} />
                           {editingProduct.isNew ? "In New Arrivals" : "Mark as New"}
                        </button>
                     </div>
                     <div className="space-y-2.5">
                        <label className="text-[12px] font-black uppercase text-[#B0843D] tracking-widest">Bestseller Status</label>
                        <button 
                          type="button"
                          onClick={() => setEditingProduct({...editingProduct, isBestseller: !editingProduct.isBestseller})}
                          className={`w-full p-5 rounded-2xl font-black uppercase text-[12px] tracking-widest transition-all flex items-center justify-center gap-3 ${editingProduct.isBestseller ? 'bg-[#310101] text-[#E5D5C5] shadow-xl' : 'bg-gray-100 text-black/20'}`}
                        >
                           <Star className={`w-4 h-4 ${editingProduct.isBestseller ? 'fill-current' : ''}`} />
                           {editingProduct.isBestseller ? "In Bestsellers" : "Add to Bestsellers"}
                        </button>
                     </div>

                     <div className="md:col-span-2 space-y-4 pt-4 border-t border-gray-50">
                        <label className="text-[12px] font-black uppercase text-[#B0843D] tracking-[0.2em]">Product Highlights</label>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                           {(editingProduct.highlights || ["", "", ""]).map((highlight: string, idx: number) => (
                              <input 
                                 key={idx}
                                 placeholder={`Highlight ${idx + 1}`}
                                 value={highlight}
                                 onChange={(e) => {
                                    const newHighlights = [...(editingProduct.highlights || ["", "", ""])];
                                    newHighlights[idx] = e.target.value;
                                    setEditingProduct({...editingProduct, highlights: newHighlights});
                                 }}
                                 className="w-full p-5 bg-gray-50 rounded-2xl font-bold border-none outline-none focus:ring-4 focus:ring-[#B0843D]/10 text-[16px] italic font-serif text-[#1A1A1A] placeholder:text-black/20"
                              />
                           ))}
                        </div>
                     </div>

                     <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="space-y-2.5">
                           <label className="text-[12px] font-black uppercase opacity-30 tracking-widest">Main Product Asset</label>
                           <div className="relative aspect-video bg-gray-50 rounded-3xl border-2 border-dashed flex flex-col items-center justify-center overflow-hidden group">
                              {isUploading ? (
                                 <div className="text-center font-black uppercase tracking-widest text-[#B0843D] animate-pulse">Synchronizing...</div>
                              ) : (editingProduct.image || imagePreview) ? (
                                 <img src={imagePreview || editingProduct.image} className="w-full h-full object-contain" />
                              ) : (
                                 <div className="text-center"><PlusCircle className="w-10 h-10 text-black/10 mx-auto mb-2" /><p className="font-serif italic opacity-30 text-lg">Select asset</p></div>
                              )}
                              <input type="file" onChange={handleImageChange} className="absolute inset-0 opacity-0 cursor-pointer" />
                              <button 
                                 type="button"
                                 onClick={() => { setMediaLibraryContext({ type: 'edit', field: 'image' }); setIsMediaLibraryOpen(true); }}
                                 className="absolute bottom-2 right-2 bg-black/60 backdrop-blur-md text-white px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-[#B0843D] transition-all z-10"
                              >
                                 Library
                              </button>
                           </div>
                        </div>
                        <div className="space-y-2.5">
                           <label className="text-[12px] font-black uppercase text-[#B0843D] tracking-widest">Cinematic Highlight (Video)</label>
                           <div className="relative aspect-video bg-gray-50 rounded-3xl border-2 border-dashed flex flex-col items-center justify-center overflow-hidden group">
                              {isUploading ? (
                                 <div className="text-center font-black uppercase tracking-widest text-[#B0843D] animate-pulse">Synchronizing...</div>
                              ) : (videoPreview || editingProduct.video) ? (
                                 <video src={videoPreview || editingProduct.video} className="w-full h-full object-cover" muted loop autoPlay />
                              ) : (
                                 <div className="text-center"><Zap className="w-10 h-10 text-black/10 mx-auto mb-2" /><p className="font-serif italic opacity-30 text-lg">Add Video</p></div>
                              )}
                              <input type="file" accept="video/*" onChange={handleVideoChange} className="absolute inset-0 opacity-0 cursor-pointer" />
                           </div>
                        </div>
                     </div>

                     <div className="md:col-span-2 space-y-2.5">
                        <label className="text-[12px] font-black uppercase text-[#B0843D] tracking-widest">Optional Gallery</label>
                        <div className="grid grid-cols-4 gap-3">
                          {[0, 1, 2, 3].map((idx) => (
                            <div key={idx} className="relative aspect-square bg-gray-50 rounded-xl border border-dashed flex flex-col items-center justify-center overflow-hidden group">
                              {editingProduct.extraImages?.[idx] ? (
                                <img src={editingProduct.extraImages[idx]} className="w-full h-full object-cover" />
                              ) : (
                                <div className="text-center p-1 opacity-20 group-hover:opacity-100 transition-opacity">
                                  <PlusCircle className="w-5 h-5 mx-auto" />
                                </div>
                              )}
                              <input type="file" onChange={(e) => handleExtraImageChange(e, idx)} className="absolute inset-0 opacity-0 cursor-pointer" />
                              <button 
                                 type="button"
                                 onClick={() => { setMediaLibraryContext({ type: 'edit', field: 'extra', index: idx }); setIsMediaLibraryOpen(true); }}
                                 className="absolute bottom-1 right-1 bg-black/40 backdrop-blur-md text-white p-1 rounded-md text-[8px] font-black uppercase hover:bg-[#B0843D] transition-all z-10 opacity-0 group-hover:opacity-100"
                               >
                                  Lib
                               </button>
                            </div>
                          ))}
                        </div>
                     </div>

                     <div className="md:col-span-2 pt-4">
                        <button type="submit" disabled={isUploading} className="w-full bg-black text-white py-5 rounded-[20px] font-black uppercase shadow-xl disabled:opacity-50 text-[13px] tracking-widest hover:scale-[1.01] transition-transform">
                           {isUploading ? "Syncing..." : "Commit Changes"}
                        </button>
                     </div>
                  </form>
               </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      <AnimatePresence>
        {promptData.isOpen && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="bg-white p-12 rounded-[40px] shadow-2xl max-w-lg w-full relative">
               <h3 className="text-4xl font-serif font-black italic mb-2 text-[#310101]">{promptData.title}</h3>
               <p className="text-[#C29D59] font-bold uppercase tracking-widest text-[14px] mb-8">System Prompt</p>
               
               <form onSubmit={(e) => { e.preventDefault(); promptData.onConfirm(promptData.value); }}>
                  <input 
                    autoFocus
                    placeholder={promptData.placeholder} 
                    value={promptData.value} 
                    onChange={e => setPromptData({...promptData, value: e.target.value})} 
                    className="w-full p-6 bg-gray-50 rounded-2xl font-bold border-none outline-none mb-8 text-xl" 
                  />
                  <div className="flex gap-4">
                     <button type="button" onClick={() => setPromptData({...promptData, isOpen: false})} className="flex-1 py-4 font-black uppercase text-black/40 hover:bg-gray-100 rounded-full transition-all">Cancel</button>
                     <button type="submit" className="flex-1 bg-black text-white py-4 font-black uppercase rounded-full shadow-lg hover:bg-[#310101] transition-all">Confirm</button>
                  </div>
               </form>
               <button onClick={() => setPromptData({...promptData, isOpen: false})} className="absolute top-6 right-6 p-2 bg-gray-50 rounded-full hover:bg-gray-200 transition-all text-black/40"><X className="w-5 h-5" /></button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
         {isMediaLibraryOpen && (
           <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
             <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="bg-white rounded-[40px] shadow-2xl max-w-5xl w-full max-h-[85vh] flex flex-col overflow-hidden">
                <div className="p-8 border-b border-gray-100 flex justify-between items-center bg-[#1A1A1A] text-white">
                   <div>
                      <h3 className="text-2xl font-serif font-black italic tracking-tighter">Signature Media Library</h3>
                      <p className="text-[10px] uppercase font-black tracking-widest text-[#B0843D]">Reuse existing Signature assets</p>
                   </div>
                   <button onClick={() => setIsMediaLibraryOpen(false)} className="p-3 hover:bg-white/10 rounded-full transition-all"><X className="w-6 h-6" /></button>
                </div>
                
                <div className="flex-1 overflow-y-auto p-8 custom-scrollbar bg-gray-50 text-black">
                   <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                      {allMediaUrls.map((url, idx) => (
                        <div 
                          key={url + idx} 
                          onClick={() => handleSelectFromLibrary(url)}
                          className="group relative aspect-square bg-white rounded-2xl overflow-hidden border-2 border-transparent hover:border-[#B0843D] cursor-pointer shadow-sm hover:shadow-xl transition-all"
                        >
                           <img src={url} className="w-full h-full object-cover transition-transform group-hover:scale-110" alt="Cloud Asset" />
                           <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all flex items-center justify-center">
                              <div className="bg-white text-black text-[10px] font-black uppercase px-3 py-1.5 rounded-full opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0 transition-all">Select</div>
                           </div>
                        </div>
                      ))}
                   </div>
                </div>
                
                <div className="p-6 border-t border-gray-100 bg-white text-center">
                   <p className="text-[11px] font-black uppercase text-black/30 tracking-widest">Total Assets Available: {allMediaUrls.length}</p>
                </div>
             </motion.div>
           </div>
         )}
       </AnimatePresence>
    </div>
  );
};

export default AdminDashboard;

