import img1 from "@/assets/product-1.jpg";
import img2 from "@/assets/product-2.png";
import img3 from "@/assets/product-3_new.png";
import img4 from "@/assets/product-4_new.png";
import img5 from "@/assets/product-5_new.png";
import img6 from "@/assets/product-6_new.png";
import img7 from "@/assets/product-7_new.png";
import img8 from "@/assets/product-8_new.png";
import img9 from "@/assets/product-9_new.png";
import img10 from "@/assets/product-10_new.png";
import img11 from "@/assets/product-11_new.png";
import img12 from "@/assets/product-12_new.png";
import img13 from "@/assets/product-13_new.png";
import img14 from "@/assets/product-14_new.png";
import img15 from "@/assets/product-15_new.png";
import img16 from "@/assets/product-16_new.png";
import img17 from "@/assets/product-17_new.png";
import img18 from "@/assets/product-18_new.png";
import img19 from "@/assets/product-19_new.png";
import img20 from "@/assets/product-20_new.png";
import img21 from "@/assets/product-21_new.png";
import img22 from "@/assets/product-22_new.png";
import img23 from "@/assets/product-23_new.png";
import img24 from "@/assets/product-24_new.png";
import img25 from "@/assets/product-25_new.png";
import img26 from "@/assets/product-26_new.png";
import img27 from "@/assets/product-27_new.png";
import img28 from "@/assets/product-28_new.png";
import { ArrowRight, Plus, Star, Zap } from "lucide-react";
import { Link, useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { useCart } from "@/lib/cart";

const products = [
  { name: "Acidic Capsules", image: img1, desc: "Powerful Ayurvedic capsules formulated to relieve acidity, heartburn & indigestion…", price: 169, oldPrice: 1799, save: 1630, rating: 4.8, reviews: 234, badge: "BESTSELLER", badgeColor: "bg-primary", discount: 28 },
  { name: "Active G5", image: img2, desc: "Advanced Ayurvedic formulation to manage blood sugar levels and support healthy…", price: 139, oldPrice: 899, save: 760, rating: 4.7, reviews: 189, badge: "NEW", badgeColor: "bg-primary-light", discount: 28 },
  { name: "Active Green", image: img3, desc: "Herbal blend of potent anti-diabetic herbs to naturally regulate glucose metabolism…", price: 149, oldPrice: 1199, save: 1050, rating: 4.9, reviews: 412, badge: "TOP RATED", badgeColor: "bg-gold", discount: 25 },
  { name: "Arsho F Powder", image: img4, desc: "Arsho F Powder helps support healthy digestion and provides relief from piles....", price: 349, oldPrice: 599, save: 250, rating: 4.6, reviews: 156, badge: null, badgeColor: "", discount: 25 },
  { name: "Aarogya Jeevan", image: img5, desc: "Aarogya Jeevan is dedicated to bringing natural wellness solutions for a healthier....", price: 349, oldPrice: 799, save: 450, rating: 4.8, reviews: 521, badge: "BESTSELLER", badgeColor: "bg-primary", discount: 31 },
  { name: "Active Z Tablets", image: img6, desc: "Active Z Tablets are formulated to support daily energy, immunity, and overall body.....", price: 230, oldPrice: 399, save: 169, rating: 4.7, reviews: 387, badge: null, badgeColor: "", discount: 25 },
  { name: "Active Green XT", image: img7, desc: "Active Green XT is a natural wellness formula crafted to support immunity....", price: 159, oldPrice: 1499, save: 1340, rating: 4.9, reviews: 612, badge: "TOP RATED", badgeColor: "bg-gold", discount: 33 },
  { name: "Active Glucose", image: img8, desc: "Active Glucose provides instant energy and helps keep your body refreshed....", price: 149, oldPrice: 549, save: 400, rating: 4.7, reviews: 298, badge: "NEW", badgeColor: "bg-primary-light", discount: 27 },
  { name: "Artho Z", image: img9, desc: "Artho Z is specially formulated to support joint comfort, flexibility....", price: 339, oldPrice: 349, save: 100, rating: 4.6, reviews: 174, badge: null, badgeColor: "", discount: 28 },
  { name: "Arthovit M", image: img10, desc: "Arthovit M is designed to support healthy joints, muscle strength....", price: 429, oldPrice: 499, save: 70, rating: 4.7, reviews: 221, badge: null, badgeColor: "", discount: 30 },
  { name: "Asthometic Capsule", image: img11, desc: "Asthometic Capsule is formulated to support respiratory wellness ....", price: 439, oldPrice: 849, save: 410, rating: 4.8, reviews: 456, badge: "BESTSELLER", badgeColor: "bg-primary", discount: 29 },
  { name: "C.N.Z Capsule", image: img12, desc: "C.N.Z Capsule is specially formulated to support overall wellness, immunity....", price: 499, oldPrice: 699, save: 200, rating: 4.6, reviews: 142, badge: null, badgeColor: "", discount: 28 },
  { name: "Charma R Capsule", image: img13, desc: "Charma R Capsule is designed to support healthy skin, natural glow....", price: 339, oldPrice: 449, save: 110, rating: 4.5, reviews: 167, badge: null, badgeColor: "", discount: 33 },
  { name: "Dr. Sona Artho Tablets", image: img14, desc: "Dr. Sona Artho Tablets are specially formulated to support joint comfort.....", price: 349, oldPrice: 1999, save: 1650, rating: 4.9, reviews: 389, badge: "TOP RATED", badgeColor: "bg-gold", discount: 25 },
  { name: "Dr Sona Vatplus Capsule ", image: img15, desc: "Dr Sona Vatplus Capsule support women's hormonal balance and overall wellness....", price: 299, oldPrice: 499, save: 200, rating: 4.6, reviews: 178, badge: null, badgeColor: "", discount: 28 },
  { name: "Omega Capsule ", image: img16, desc: "Omega Capsule helps soothe digestion and relieve gas naturally....", price: 189, oldPrice: 299, save: 110, rating: 4.5, reviews: 134, badge: "NEW", badgeColor: "bg-primary-light", discount: 25 },
  { name: "Multivitamin Complex ", image: img17, desc: "Multivitamin Complex nourish hair roots and promote natural hair growth....", price: 399, oldPrice: 699, save: 300, rating: 4.7, reviews: 245, badge: "BESTSELLER", badgeColor: "bg-primary", discount: 30 },
  { name: "Glow up Capsules", image: img18, desc: "Glow up Capsules strengthen immunity with powerful Ayurvedic herbs....", price: 249, oldPrice: 449, save: 200, rating: 4.8, reviews: 367, badge: "TOP RATED", badgeColor: "bg-gold", discount: 27 },
  { name: "Multi Shine Herbal Capsules", image: img19, desc: "Multi Shine Herbal Capsules provides relief from joint pain and stiffness naturally....", price: 199, oldPrice: 349, save: 150, rating: 4.6, reviews: 198, badge: null, badgeColor: "", discount: 25 },
  { name: "Gaso Touch Capsules", image: img20, desc: "Gaso Touch Capsules support healthy kidney function and detoxification....", price: 459, oldPrice: 799, save: 340, rating: 4.7, reviews: 156, badge: null, badgeColor: "", discount: 28 },
  { name: "Power Booster Powder", image: img21, desc: "Power Booster Powder cleanses the liver and improves digestive health....", price: 219, oldPrice: 399, save: 180, rating: 4.6, reviews: 212, badge: "NEW", badgeColor: "bg-primary-light", discount: 25 },
  { name: "Purify Capsules", image: img22, desc: "Purify Capsules enhance brain function, memory and concentration....", price: 329, oldPrice: 549, save: 220, rating: 4.8, reviews: 289, badge: "BESTSELLER", badgeColor: "bg-primary", discount: 29 },
  { name: "RX Gold Capsules", image: img23, desc: "RX Gold Capsules provide instant relief from nasal congestion and cold....", price: 99, oldPrice: 179, save: 80, rating: 4.5, reviews: 167, badge: null, badgeColor: "", discount: 25 },
  { name: "Safa Amrit Capsules", image: img24, desc: "Safa Amrit Capsules soothes muscle and joint pain with herbal warmth....", price: 179, oldPrice: 299, save: 120, rating: 4.7, reviews: 234, badge: null, badgeColor: "", discount: 28 },
  { name: "Sakhi Sundari ", image: img25, desc: "Sakhi Sundari  offer natural relief from piles, fissures and constipation....", price: 269, oldPrice: 469, save: 200, rating: 4.6, reviews: 145, badge: "NEW", badgeColor: "bg-primary-light", discount: 25 },
  { name: "Skin Z Capsules", image: img26, desc: "Skin Z Capsules calm the mind and promote restful sleep naturally....", price: 299, oldPrice: 549, save: 250, rating: 4.8, reviews: 312, badge: "TOP RATED", badgeColor: "bg-gold", discount: 27 },
  { name: "Vita Energy Tonic", image: img27, desc: "Vita Energy Tonic revitalizes the body and boosts daily stamina naturally....", price: 349, oldPrice: 599, save: 250, rating: 4.7, reviews: 276, badge: "BESTSELLER", badgeColor: "bg-primary", discount: 30 },
  { name: "Wellness Herbal Mix", image: img28, desc: "Wellness Herbal Mix supports overall health with a blend of pure Ayurvedic herbs....", price: 279, oldPrice: 499, save: 220, rating: 4.6, reviews: 198, badge: "NEW", badgeColor: "bg-primary-light", discount: 28 },
];

export function FeaturedProducts() {
  const { add } = useCart();
  const navigate = useNavigate();
  const handleAdd = (name: string, price: number) => {
    add(name, price);
    toast.success(`${name} added to cart`);
  };
  const handleBuyNow = (name: string, price: number) => {
    add(name, price);
    toast.success(`Proceeding to checkout with ${name}`);
    navigate({ to: "/shop" });
  };
  return (
    <section id="products" className="py-24 bg-cream scroll-mt-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-6">
          <div className="max-w-xl">
            <div className="text-sm font-semibold text-primary-light tracking-[0.2em] uppercase mb-3">Handpicked For You</div>
            <h2 className="font-display text-4xl sm:text-5xl text-foreground mb-4">Featured Products</h2>
            <p className="text-muted-foreground">Our most loved Ayurvedic formulations — trusted by thousands of wellness seekers.</p>
          </div>
          <Link to="/shop" className="inline-flex items-center gap-2 border border-primary/40 px-6 py-3 rounded-full font-medium text-primary hover:bg-primary hover:text-primary-foreground transition-all">
            View All Products <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {products.map((p) => (
            <article key={p.name} className="group bg-white rounded-2xl overflow-hidden shadow-card hover:shadow-soft transition-all">
              <div className="relative bg-accent/30">
                {p.badge && (
                  <span className={`absolute top-4 left-4 z-10 ${p.badgeColor} text-primary-foreground text-[10px] font-bold tracking-wider px-3 py-1.5 rounded`}>{p.badge}</span>
                )}
                <span className="absolute top-12 left-4 z-10 bg-gold text-white text-[10px] font-bold tracking-wider px-3 py-1.5 rounded">-{p.discount}%</span>
                <img src={p.image} alt={p.name} loading="lazy" width={400} height={400} className="w-full aspect-square object-cover group-hover:scale-105 transition-transform duration-500" />
                <button onClick={() => handleAdd(p.name, p.price)} className="absolute bottom-0 left-0 right-0 bg-primary text-primary-foreground py-3 font-semibold tracking-wider text-sm opacity-0 group-hover:opacity-100 transition-opacity">QUICK ADD</button>
              </div>
              <div className="p-5">
                <div className="text-[10px] font-bold tracking-wider text-primary-light uppercase mb-2">Ayurvedic Tablets / Medicines</div>
                <h3 className="font-display text-xl font-semibold mb-2">{p.name}</h3>
                <p className="text-sm text-muted-foreground line-clamp-2 mb-4">{p.desc}</p>
                <div className="flex items-center gap-2 mb-4">
                  <div className="flex gap-0.5">
                    {[1,2,3,4,5].map(i => <Star key={i} className={`w-3.5 h-3.5 ${i <= Math.floor(p.rating) ? 'fill-gold text-gold' : 'text-muted'}`} />)}
                  </div>
                  <span className="text-sm font-semibold">{p.rating}</span>
                  <span className="text-xs text-muted-foreground">({p.reviews})</span>
                </div>
                <div className="pt-4 border-t border-border">
                  <div className="flex items-end justify-between mb-3">
                    <div>
                      <div className="flex items-baseline gap-2">
                        <span className="text-2xl font-bold text-foreground">₹{p.price}</span>
                        <span className="text-sm text-muted-foreground line-through">₹{p.oldPrice}</span>
                      </div>
                      <div className="inline-block mt-1 text-[10px] font-semibold text-primary bg-accent px-2 py-0.5 rounded">Save ₹{p.save}</div>
                    </div>
                    <button onClick={() => handleAdd(p.name, p.price)} aria-label={`Add ${p.name} to cart`} className="w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center hover:scale-110 transition-transform">
                      <Plus className="w-5 h-5" />
                    </button>
                  </div>
                  <button onClick={() => handleBuyNow(p.name, p.price)} className="w-full inline-flex items-center justify-center gap-2 bg-gold text-white py-2.5 rounded-md font-semibold text-sm hover:bg-gold/90 transition-colors">
                    <Zap className="w-4 h-4" /> Buy Now
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
