import { motion } from "framer-motion";
import { Droplets, Clock, Gem, Heart } from "lucide-react";
import SectionHeading from "./SectionHeading";

const features = [
  { icon: Droplets, title: "Alcohol-Free", desc: "Pure oil-based fragrances, gentle on skin" },
  { icon: Clock, title: "Long Lasting", desc: "Scents that stay with you from dawn to dusk" },
  { icon: Gem, title: "Premium Ingredients", desc: "Sourced from the finest regions worldwide" },
  { icon: Heart, title: "Inspired by Sunnah", desc: "Rooted in the prophetic tradition of fragrance" },
];

const WhyChooseUs = () => {
  return (
    <section className="section-padding bg-[#310101]">
      <SectionHeading title="Why Kaleemiya" subtitle="What makes our fragrances extraordinary" light={true} />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 max-w-[1200px] mx-auto">
        {features.map((f, i) => (
          <motion.div
            key={f.title}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.6, delay: i * 0.1, ease: [0.16, 1, 0.3, 1] }}
            className="text-center group"
          >
            <div className="w-16 h-16 mx-auto mb-6 rounded-full border border-[#B0843D]/30 flex items-center justify-center group-hover:border-[#B0843D] group-hover:gold-glow transition-all duration-500 bg-white/5">
              <f.icon className="w-7 h-7 text-[#B0843D] transition-colors duration-300" />
            </div>
            <h3 className="font-serif text-xl mb-2 text-white">{f.title}</h3>
            <p className="text-white/60 font-sans text-sm leading-relaxed">{f.desc}</p>
          </motion.div>
        ))}
      </div>
    </section>
  );
};

export default WhyChooseUs;
