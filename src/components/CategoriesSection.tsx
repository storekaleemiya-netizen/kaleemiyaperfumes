import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import SectionHeading from "./SectionHeading";
import categoryPerfumes from "@/assets/category-perfumes.jpg";
import categoryAttar from "@/assets/category-attar.jpg";
import categoryBakhoor from "@/assets/category-bakhoor.jpg";
import categoryGiftsets from "@/assets/category-giftsets.jpg";
import categoryTasbeeh from "@/assets/tasbeeh-1.png";

const categories = [
  { image: categoryPerfumes, title: "Perfumes", subtitle: "Signature scents", href: "/shop?category=perfumes" },
  { image: categoryAttar, title: "Attar", subtitle: "Pure oil fragrances", href: "/shop?category=attar" },
  { image: categoryBakhoor, title: "Bakhoor", subtitle: "Traditional incense", href: "/shop?category=bakhoor" },
  { image: categoryGiftsets, title: "Gift Sets", subtitle: "Curated collections", href: "/shop?category=giftsets" },
];

const CategoriesSection = () => {
  return (
    <section className="section-padding bg-[#310101]">
      <SectionHeading title="Shop by Category" subtitle="Explore our curated collections" light={true} />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 max-w-[1200px] mx-auto">
        {categories.map((cat, i) => (
          <Link key={cat.title} to={cat.href} className="group relative overflow-hidden rounded-sm aspect-[16/9] cursor-pointer block">
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.2 }}
              transition={{ duration: 0.7, delay: i * 0.1, ease: [0.16, 1, 0.3, 1] }}
              className="w-full h-full"
            >
              <img
                src={cat.image}
                alt={cat.title}
                className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                loading="lazy"
              />
              <div className="absolute inset-0 border border-white/10 group-hover:border-primary/20 rounded-sm transition-all duration-500" />
              <div className="absolute bottom-0 left-0 p-8 w-full bg-gradient-to-t from-black/60 via-black/20 to-transparent">
                <h3 className="font-serif text-2xl md:text-3xl text-white mb-1 drop-shadow-lg">{cat.title}</h3>
                <p className="text-white/90 font-sans text-sm tracking-wide drop-shadow-md">{cat.subtitle}</p>
              </div>
            </motion.div>
          </Link>
        ))}
      </div>
      <div className="mt-12 flex justify-center px-4 sm:px-0">
        <Link 
          to="/shop" 
          className="group relative w-full sm:w-auto min-w-[280px] max-w-xs sm:max-w-none px-10 py-4 bg-transparent border border-[#DEB87A]/30 hover:border-[#DEB87A] transition-all duration-500 rounded-full overflow-hidden flex items-center justify-center"
        >
          <div className="absolute inset-0 bg-[#DEB87A]/5 translate-y-full group-hover:translate-y-0 transition-transform duration-500" />
          <span className="relative text-[13px] font-black uppercase tracking-[0.3em] text-white">View All Collections</span>
        </Link>
      </div>
    </section>
  );
};

export default CategoriesSection;
