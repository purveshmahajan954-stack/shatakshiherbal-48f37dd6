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

export type Product = {
  slug: string;
  name: string;
  image: string;
  desc: string;
  longDesc: string;
  price: number;
  oldPrice: number;
  save: number;
  rating: number;
  reviews: number;
  badge: string | null;
  badgeColor: string;
  discount: number;
  category: string;
  benefits: string[];
  usage: string;
  ingredients: string;
  categories: string[];
};

export const CATEGORY_LABELS: Record<string, string> = {
  "diabetes-care": "Diabetes, thyroid BP and cholesterol Care",
  "arthritis-care": "Arthritis Joints pain care",
  "liver-kidney-care": "Liver kidney care",
  "asthma-allergy-care": "Asthma allergy care",
  "skin-care": "Skin Psoriasis, Charm Rog care",
  "piles-care": "Piles care",
  "acidity-care": "Acidity digestive care",
  "wellness-care": "Wellness Weakness care",
  "vital-care": "Vital Vitiligo sex power",
  "stree-care": "Stree rog care",
};

const categoryMap: Record<string, string[]> = {
  "Acidic Capsules": ["acidity-care"],
  "Active G5": ["diabetes-care"],
  "Active Green": ["diabetes-care"],
  "Arsho F Powder": ["piles-care"],
  "Aarogya Jeevan": ["asthma-allergy-care"],
  "Active Z Tablets": ["diabetes-care"],
  "Active Green XT": ["diabetes-care"],
  "Active Glucose": ["diabetes-care"],
  "Artho Z": ["arthritis-care"],
  "Arthovit M": ["arthritis-care", "piles-care"],
  "Asthometic Capsule": ["asthma-allergy-care"],
  "C.N.Z Capsule": ["wellness-care"],
  "Charma R Capsule": ["skin-care"],
  "Dr. Sona Artho Tablets": ["arthritis-care"],
  "Dr Sona Vatplus Capsule": ["arthritis-care"],
  "Omega Capsule": ["wellness-care"],
  "Multivitamin Complex": ["wellness-care", "acidity-care"],
  "Glow up Capsules": ["skin-care"],
  "Multi Shine Herbal Capsules": ["wellness-care"],
  "Gaso Touch Capsules": ["acidity-care"],
  "Power Booster Powder": ["wellness-care", "acidity-care"],
  "Purify Capsules": ["skin-care"],
  "RX Gold Capsules": ["vital-care"],
  "Safa Amrit Capsules": ["acidity-care"],
  "Sakhi Sundari": ["stree-care"],
  "Skin Z Capsules": ["skin-care"],
  "TH - Z Capsules": ["diabetes-care"],
  "Vat Nashak Capsules": ["arthritis-care"],
  "Active Risup": ["diabetes-care"],
  "BP Tablets": ["diabetes-care"],
  "Active Z Premium Tablets": ["diabetes-care"],
  "Vedantak Powder": ["arthritis-care"],
  "Camrop capsule": ["arthritis-care"],
  "Vayam powder": ["arthritis-care"],
  "Cartilage Tablets": ["arthritis-care"],
  "Aaram oil": ["arthritis-care"],
  "Vatmaniras": ["arthritis-care"],
  "Liver Maniras": ["liver-kidney-care", "acidity-care"],
  "Kidney cure capsule": ["liver-kidney-care"],
  "KFT XL 2": ["liver-kidney-care"],
  "Livona Syrup": ["liver-kidney-care"],
  "Asthmatic capsule": ["asthma-allergy-care"],
  "Alc Maniras tablets": ["asthma-allergy-care"],
  "Max cold powder": ["asthma-allergy-care"],
  "Charmer capsules": ["skin-care"],
  "Derma cream": ["skin-care"],
  "Beauty cream": ["skin-care"],
  "Acid capsule": ["acidity-care"],
  "Multicomplex capsule": ["wellness-care"],
  "Multi vitamin": ["wellness-care"],
  "X gold Powder": ["vital-care"],
  "Shat Prabha Tab": ["stree-care"],
  "Femina Careers tablets": ["stree-care"],
};

export const slugify = (s: string) =>
  s.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");



const base = [
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
  { name: "Dr Sona Vatplus Capsule", image: img15, desc: "Dr Sona Vatplus Capsule is a herbal wellness supplement that helps pain .....", price: 340, oldPrice: 499, save: 159, rating: 4.6, reviews: 178, badge: null, badgeColor: "", discount: 32 },
  { name: "Omega Capsule", image: img16, desc: "Omega Capsule helps soothe digestion and relieve gas naturally....", price: 199, oldPrice: 299, save: 100, rating: 4.5, reviews: 134, badge: "NEW", badgeColor: "bg-primary-light", discount: 33 },
  { name: "Multivitamin Complex", image: img17, desc: "Multivitamin Complex is support to help a daily nutritional supplements...", price: 340, oldPrice: 699, save: 359, rating: 4.7, reviews: 245, badge: "BESTSELLER", badgeColor: "bg-primary", discount: 51 },
  { name: "Glow up Capsules", image: img18, desc: "Glow up Capsules is a help to natural glow and overall wellness...", price: 499, oldPrice: 449, save: -50, rating: 4.8, reviews: 367, badge: "TOP RATED", badgeColor: "bg-gold", discount: 0 },
  { name: "Multi Shine Herbal Capsules", image: img19, desc: "Multi Shine Herbal Capsules provides to natural glow and overall wellness...", price: 269, oldPrice: 349, save: 80, rating: 4.6, reviews: 198, badge: null, badgeColor: "", discount: 23 },
  { name: "Gaso Touch Capsules", image: img20, desc: "Gaso Touch Capsules support healthy kidney function and detoxification....", price: 230, oldPrice: 799, save: 569, rating: 4.7, reviews: 156, badge: null, badgeColor: "", discount: 71 },
  { name: "Power Booster Powder", image: img21, desc: "Power Booster Powder cleanses the liver and improves digestive health....", price: 340, oldPrice: 399, save: 59, rating: 4.6, reviews: 212, badge: "NEW", badgeColor: "bg-primary-light", discount: 15 },
  { name: "Purify Capsules", image: img22, desc: "Purify Capsules enhance brain function, memory and concentration....", price: 399, oldPrice: 549, save: 150, rating: 4.8, reviews: 289, badge: "BESTSELLER", badgeColor: "bg-primary", discount: 27 },
  { name: "RX Gold Capsules", image: img23, desc: "RX Gold Capsules provide instant relief from nasal congestion and cold....", price: 599, oldPrice: 179, save: -420, rating: 4.5, reviews: 167, badge: null, badgeColor: "", discount: 0 },
  { name: "Safa Amrit Capsules", image: img24, desc: "Safa Amrit Capsules soothes improves digestive health with herbal warmth....", price: 340, oldPrice: 499, save: 159, rating: 4.7, reviews: 234, badge: null, badgeColor: "", discount: 32 },
  { name: "Sakhi Sundari", image: img25, desc: "Sakhi Sundari offer natural beauty and wellness....", price: 340, oldPrice: 469, save: 129, rating: 4.6, reviews: 145, badge: "NEW", badgeColor: "bg-primary-light", discount: 28 },
  { name: "Skin Z Capsules", image: img26, desc: "Skin Z Capsules help to natural nutrition for healthy skin....", price: 280, oldPrice: 549, save: 269, rating: 4.8, reviews: 312, badge: "TOP RATED", badgeColor: "bg-gold", discount: 49 },
  { name: "TH - Z Capsules", image: img27, desc: "TH - Z Capsules revitalizes the body and supports thyroid health....", price: 499, oldPrice: 599, save: 100, rating: 4.7, reviews: 276, badge: "BESTSELLER", badgeColor: "bg-primary", discount: 17 },
  { name: "Vat Nashak Capsules", image: img28, desc: "Vat Nashak Capsules supports natural help to relief pain...", price: 340, oldPrice: 499, save: 159, rating: 4.6, reviews: 198, badge: "NEW", badgeColor: "bg-primary-light", discount: 32 },
  { name: "Active Risup", image: img1, desc: "Active Risup supports healthy liver function and natural detoxification....", price: 340, oldPrice: 399, save: 59, rating: 4.7, reviews: 184, badge: "NEW", badgeColor: "bg-primary-light", discount: 15 },
  { name: "BP Tablets", image: img2, desc: "BP Tablets strengthen immunity with powerful herbal extracts....", price: 299, oldPrice: 499, save: 200, rating: 4.8, reviews: 312, badge: "BESTSELLER", badgeColor: "bg-primary", discount: 40 },
  { name: "Active Z Premium Tablets", image: img3, desc: "Active Z Premium Tablets help calm the mind and support mental wellness....", price: 329, oldPrice: 549, save: 220, rating: 4.6, reviews: 198, badge: null, badgeColor: "", discount: 40 },
  { name: "Vedantak Powder", image: img4, desc: "Vedantak Powder nourishes the scalp and promotes natural hair growth....", price: 199, oldPrice: 349, save: 150, rating: 4.7, reviews: 423, badge: "TOP RATED", badgeColor: "bg-gold", discount: 43 },
  { name: "Camrop capsule", image: img5, desc: "Camrop capsule helps maintain healthy blood sugar levels naturally....", price: 279, oldPrice: 449, save: 170, rating: 4.8, reviews: 267, badge: "BESTSELLER", badgeColor: "bg-primary", discount: 38 },
  { name: "Vayam powder", image: img6, desc: "Vayam powder support cardiac health and healthy circulation....", price: 399, oldPrice: 699, save: 300, rating: 4.9, reviews: 345, badge: "TOP RATED", badgeColor: "bg-gold", discount: 43 },
  { name: "Cartilage Tablets", image: img7, desc: "Cartilage Tablets promote restful sleep with natural herbal blend....", price: 259, oldPrice: 429, save: 170, rating: 4.6, reviews: 156, badge: "NEW", badgeColor: "bg-primary-light", discount: 40 },
  { name: "Aaram oil", image: img8, desc: "Aaram oil enhance brain function, memory and concentration....", price: 349, oldPrice: 599, save: 250, rating: 4.7, reviews: 289, badge: null, badgeColor: "", discount: 42 },
  { name: "Vatmaniras", image: img9, desc: "Vatmaniras supports healthy weight management naturally....", price: 449, oldPrice: 799, save: 350, rating: 4.5, reviews: 178, badge: null, badgeColor: "", discount: 44 },
  { name: "Liver Maniras", image: img10, desc: "Liver Maniras cleanses the body with pure ayurvedic herbs....", price: 199, oldPrice: 349, save: 150, rating: 4.6, reviews: 234, badge: "NEW", badgeColor: "bg-primary-light", discount: 43 },
  { name: "Kidney cure capsule", image: img11, desc: "Kidney cure capsule support healthy bones and joint mobility....", price: 379, oldPrice: 649, save: 270, rating: 4.7, reviews: 198, badge: null, badgeColor: "", discount: 42 },
  { name: "KFT XL 2", image: img12, desc: "KFT XL 2 soothe and refresh tired eyes with herbal extracts....", price: 149, oldPrice: 340, save: 191, rating: 4.5, reviews: 145, badge: null, badgeColor: "", discount: 56 },
  { name: "Livona Syrup", image: img13, desc: "Livona Syrup support hormonal balance and vitality....", price: 459, oldPrice: 749, save: 290, rating: 4.8, reviews: 267, badge: "BESTSELLER", badgeColor: "bg-primary", discount: 39 },
  { name: "Asthmatic capsule", image: img14, desc: "Asthmatic capsule boost energy, stamina and overall vitality....", price: 499, oldPrice: 899, save: 400, rating: 4.7, reviews: 312, badge: "TOP RATED", badgeColor: "bg-gold", discount: 44 },
  { name: "Alc Maniras tablets", image: img15, desc: "Alc Maniras tablets provides natural relief from cough and cold....", price: 179, oldPrice: 299, save: 120, rating: 4.6, reviews: 234, badge: null, badgeColor: "", discount: 40 },
  { name: "Max cold powder", image: img16, desc: "Max cold powder offers fast relief from muscle and joint pain....", price: 229, oldPrice: 399, save: 170, rating: 4.7, reviews: 289, badge: "BESTSELLER", badgeColor: "bg-primary", discount: 43 },
  { name: "Charmer capsules", image: img17, desc: "Charmer capsules supports digestion and natural detoxification....", price: 199, oldPrice: 329, save: 130, rating: 4.8, reviews: 412, badge: "TOP RATED", badgeColor: "bg-gold", discount: 40 },
  { name: "Derma cream", image: img18, desc: "Derma cream reduce stress and boost energy naturally....", price: 299, oldPrice: 499, save: 200, rating: 4.9, reviews: 523, badge: "BESTSELLER", badgeColor: "bg-primary", discount: 40 },
  { name: "Beauty cream", image: img19, desc: "Beauty cream enhance memory and cognitive function....", price: 269, oldPrice: 449, save: 180, rating: 4.7, reviews: 234, badge: null, badgeColor: "", discount: 40 },
  { name: "Acid capsule", image: img20, desc: "Acid capsule support healthy skin and natural blood purification....", price: 199, oldPrice: 349, save: 150, rating: 4.6, reviews: 198, badge: "NEW", badgeColor: "bg-primary-light", discount: 43 },
  { name: "Multicomplex capsule", image: img21, desc: "Multicomplex capsule boost immunity with pure holy basil extracts....", price: 149, oldPrice: 340, save: 191, rating: 4.7, reviews: 267, badge: null, badgeColor: "", discount: 56 },
  { name: "Multi vitamin", image: img22, desc: "Multi vitamin strengthens immunity and supports overall wellness....", price: 229, oldPrice: 379, save: 150, rating: 4.6, reviews: 178, badge: null, badgeColor: "", discount: 39 },
  { name: "X gold Powder", image: img23, desc: "X gold Powder supports digestion, skin health and detoxification....", price: 199, oldPrice: 329, save: 130, rating: 4.7, reviews: 312, badge: "BESTSELLER", badgeColor: "bg-primary", discount: 40 },
  { name: "Shat Prabha Tab", image: img24, desc: "Shat Prabha Tab rich in Vitamin C boosts immunity and hair health....", price: 189, oldPrice: 299, save: 110, rating: 4.8, reviews: 345, badge: "TOP RATED", badgeColor: "bg-gold", discount: 37 },
  { name: "Femina Careers tablets", image: img25, desc: "Femina Careers tablets helps regulate blood sugar levels naturally....", price: 219, oldPrice: 359, save: 140, rating: 4.6, reviews: 189, badge: null, badgeColor: "", discount: 39 },
];

export const products: Product[] = base.map((p) => ({
  ...p,
  slug: slugify(p.name),
  longDesc: `${p.name} is a premium Ayurvedic formulation crafted from time-tested herbs and natural ingredients. ${p.desc.replace(/\.+$/, "")}. Made following authentic Ayurvedic principles, each batch is tested for purity and potency to deliver consistent wellness benefits.`,
  category: "Ayurvedic Tablets / Medicines",
  benefits: [
    "100% natural and AYUSH certified ingredients",
    "Traditional Ayurvedic formulation",
    "No artificial preservatives or chemicals",
    "Safe for daily use with no side effects",
  ],
  usage: "Take 1-2 capsules twice daily after meals with warm water, or as directed by your physician.",
  ingredients: "A proprietary blend of authentic Ayurvedic herbs including traditional rasayanas, processed as per classical texts.",
  categories: categoryMap[p.name] ?? [],
}));

export const getProductBySlug = (slug: string) => products.find((p) => p.slug === slug);

export type Review = { author: string; rating: number; date: string; title: string; body: string };

export const sampleReviews: Review[] = [
  { author: "Priya S.", rating: 5, date: "2 weeks ago", title: "Truly effective!", body: "I've been using this for a month and the results are amazing. Highly recommended for anyone looking for a natural solution." },
  { author: "Rahul M.", rating: 5, date: "1 month ago", title: "Authentic Ayurveda", body: "Quality is top-notch. You can feel the purity of ingredients. Will definitely repurchase." },
  { author: "Anjali K.", rating: 4, date: "1 month ago", title: "Good product", body: "Works well, packaging is great. Takes a couple of weeks to show full results but worth the wait." },
  { author: "Vikram P.", rating: 5, date: "2 months ago", title: "Best in the market", body: "Tried several brands, this one stands out. Genuine herbal product without any side effects." },
];
