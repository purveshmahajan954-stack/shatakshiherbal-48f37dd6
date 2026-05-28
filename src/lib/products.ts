import img1 from "@/assets/product-1.webp";
import img2 from "@/assets/product-2.webp";
import img3 from "@/assets/product-3_new.webp";
import img4 from "@/assets/product-4_new.webp";
import img5 from "@/assets/product-5_new.webp";
import img6 from "@/assets/product-6_new.webp";
import img7 from "@/assets/product-7_new.webp";
import img8 from "@/assets/product-8_new.webp";
import img9 from "@/assets/product-9_new.webp";
import img10 from "@/assets/product-10_new.webp";
import img11 from "@/assets/product-11_new.webp";
import img12 from "@/assets/product-12_new.webp";
import img13 from "@/assets/product-13_new.webp";
import img14 from "@/assets/product-14_new.webp";
import img15 from "@/assets/product-15_new.webp";
import img16 from "@/assets/product-16_new.webp";
import img17 from "@/assets/product-17_new.webp";
import img18 from "@/assets/product-18_new.webp";
import img19 from "@/assets/product-19_new.webp";
import img20 from "@/assets/product-20_new.webp";
import img21 from "@/assets/product-21_new.webp";
import img22 from "@/assets/product-22_new.webp";
import img23 from "@/assets/product-23_new.webp";
import img24 from "@/assets/product-24_new.webp";
import img25 from "@/assets/product-25_new.webp";
import img26 from "@/assets/product-26_new.webp";
import img27 from "@/assets/product-27_new.webp";
import img28 from "@/assets/product-28_new.webp";
import img29 from "@/assets/product-29_new.webp";
import img30 from "@/assets/product-30_new.webp";
import img31 from "@/assets/product-31_new.webp";
import img32 from "@/assets/product-32_new.webp";
import img33 from "@/assets/product-33_new.webp";
import img34 from "@/assets/product-34_new.webp";
import img35 from "@/assets/product-35_new.webp";
import img36 from "@/assets/product-36_new.webp";
import img37 from "@/assets/product-37_new.webp";
import img38 from "@/assets/product-38_new.webp";
import img39 from "@/assets/product-39_new.webp";
import img40 from "@/assets/product-40_new.webp";
import img41 from "@/assets/product-41_new.webp";
import img42 from "@/assets/product-42_new.webp";
import img43 from "@/assets/product-43_new.webp";
import img44 from "@/assets/product-44_new.webp";
import img45 from "@/assets/product-45_new.webp";
import img46 from "@/assets/product-46_new.webp";
import img47 from "@/assets/product-47_new.webp";
import img48 from "@/assets/product-48_new.webp";
import img49 from "@/assets/product-49_new.webp";
import img50 from "@/assets/product-50_new.webp";
import img51 from "@/assets/product-51_new.webp";
import img52 from "@/assets/product-52_new.webp";
import img53 from "@/assets/product-53_new.webp";

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
  { name: "Active G5", image: img2, desc: "Advanced Ayurvedic formulation to manage blood sugar levels and support healthy…", price: 249, oldPrice: 899, save: 650, rating: 4.7, reviews: 189, badge: "NEW", badgeColor: "bg-primary-light", discount: 72 },
  { name: "Active Green", image: img3, desc: "Herbal blend of potent anti-diabetic herbs to naturally regulate glucose metabolism…", price: 249, oldPrice: 1199, save: 950, rating: 4.9, reviews: 412, badge: "TOP RATED", badgeColor: "bg-gold", discount: 79 },
  { name: "Active Risup", image: img29, desc: "Active Risup supports healthy liver function and natural detoxification....", price: 340, oldPrice: 399, save: 59, rating: 4.7, reviews: 184, badge: "NEW", badgeColor: "bg-primary-light", discount: 15 },
  { name: "BP Tablets", image: img30, desc: "BP Tablets strengthen immunity with powerful herbal extracts....", price: 230, oldPrice: 499, save: 269, rating: 4.8, reviews: 312, badge: "BESTSELLER", badgeColor: "bg-primary", discount: 54 },
  { name: "Active Z Premium Tablets", image: img31, desc: "Active Z Premium Tablets help calm the mind and support mental wellness....", price: 340, oldPrice: 549, save: 209, rating: 4.6, reviews: 198, badge: null, badgeColor: "", discount: 38 },
  { name: "Vedantak Powder", image: img32, desc: "Vedantak Powder nourishes the scalp and promotes natural hair growth....", price: 211, oldPrice: 499, save: 288, rating: 4.7, reviews: 423, badge: "TOP RATED", badgeColor: "bg-gold", discount: 58 },
  { name: "Camrop capsule", image: img33, desc: "Camrop capsule helps maintain healthy blood sugar levels naturally....", price: 340, oldPrice: 449, save: 109, rating: 4.8, reviews: 267, badge: "BESTSELLER", badgeColor: "bg-primary", discount: 24 },
  { name: "Vayam powder", image: img34, desc: "Vayam powder support cardiac health and healthy circulation....", price: 170, oldPrice: 699, save: 529, rating: 4.9, reviews: 345, badge: "TOP RATED", badgeColor: "bg-gold", discount: 76 },
  { name: "Cartilage Tablets", image: img35, desc: "Cartilage Tablets promote restful sleep with natural herbal blend....", price: 230, oldPrice: 429, save: 199, rating: 4.6, reviews: 156, badge: "NEW", badgeColor: "bg-primary-light", discount: 46 },
  { name: "Aaram oil", image: img36, desc: "Aaram oil enhance brain function, memory and concentration....", price: 199, oldPrice: 599, save: 400, rating: 4.7, reviews: 289, badge: null, badgeColor: "", discount: 67 },
  { name: "Vatmaniras", image: img37, desc: "Vatmaniras supports healthy weight management naturally....", price: 211, oldPrice: 799, save: 588, rating: 4.5, reviews: 178, badge: null, badgeColor: "", discount: 74 },
  { name: "Liver Maniras", image: img38, desc: "Liver Maniras cleanses the body with pure ayurvedic herbs....", price: 211, oldPrice: 499, save: 288, rating: 4.6, reviews: 234, badge: "NEW", badgeColor: "bg-primary-light", discount: 58 },
  { name: "Kidney cure capsule", image: img39, desc: "Kidney cure capsule support healthy bones and joint mobility....", price: 171, oldPrice: 649, save: 478, rating: 4.7, reviews: 198, badge: null, badgeColor: "", discount: 74 },
  { name: "KFT XL 2", image: img40, desc: "KFT XL 2 soothe and refresh tired eyes with herbal extracts....", price: 249, oldPrice: 340, save: 91, rating: 4.5, reviews: 145, badge: null, badgeColor: "", discount: 27 },
  { name: "Livona Syrup", image: img41, desc: "Livona Syrup support hormonal balance and vitality....", price: 599, oldPrice: 749, save: 150, rating: 4.8, reviews: 267, badge: "BESTSELLER", badgeColor: "bg-primary", discount: 20 },
  { name: "Asthmatic capsule", image: img42, desc: "Asthmatic capsule boost energy, stamina and overall vitality....", price: 420, oldPrice: 899, save: 479, rating: 4.7, reviews: 312, badge: "TOP RATED", badgeColor: "bg-gold", discount: 53 },
  { name: "Alc Maniras tablets", image: img43, desc: "Alc Maniras tablets provides natural relief from cough and cold....", price: 211, oldPrice: 440, save: 229, rating: 4.6, reviews: 234, badge: null, badgeColor: "", discount: 52 },
  { name: "Max cold powder", image: img44, desc: "Max cold powder offers fast relief from muscle and joint pain....", price: 340, oldPrice: 399, save: 59, rating: 4.7, reviews: 289, badge: "BESTSELLER", badgeColor: "bg-primary", discount: 15 },
  { name: "Charmer capsules", image: img45, desc: "Charmer capsules supports digestion and natural detoxification....", price: 211, oldPrice: 499, save: 288, rating: 4.8, reviews: 412, badge: "TOP RATED", badgeColor: "bg-gold", discount: 58 },
  { name: "Derma cream", image: img46, desc: "Derma cream reduce stress and boost energy naturally....", price: 230, oldPrice: 499, save: 269, rating: 4.9, reviews: 523, badge: "BESTSELLER", badgeColor: "bg-primary", discount: 54 },
  { name: "Beauty cream", image: img47, desc: "Beauty cream enhance memory and cognitive function....", price: 1000, oldPrice: 1599, save: 599, rating: 4.7, reviews: 234, badge: null, badgeColor: "", discount: 37 },
  { name: "Acid capsule", image: img48, desc: "Acid capsule support healthy skin and natural blood purification....", price: 211, oldPrice: 499, save: 288, rating: 4.6, reviews: 198, badge: "NEW", badgeColor: "bg-primary-light", discount: 58 },
  { name: "Multicomplex capsule", image: img49, desc: "Multicomplex capsule boost immunity with pure holy basil extracts....", price: 249, oldPrice: 340, save: 91, rating: 4.7, reviews: 267, badge: null, badgeColor: "", discount: 27 },
  { name: "Multi vitamin", image: img50, desc: "Multi vitamin strengthens immunity and supports overall wellness....", price: 340, oldPrice: 379, save: 39, rating: 4.6, reviews: 178, badge: null, badgeColor: "", discount: 10 },
  { name: "X gold Powder", image: img51, desc: "X gold Powder supports digestion, skin health and detoxification....", price: 211, oldPrice: 599, save: 388, rating: 4.7, reviews: 312, badge: "BESTSELLER", badgeColor: "bg-primary", discount: 65 },
  { name: "Shat Prabha Tab", image: img52, desc: "Shat Prabha Tab rich in Vitamin C boosts immunity and hair health....", price: 799, oldPrice: 1499, save: 700, rating: 4.8, reviews: 345, badge: "TOP RATED", badgeColor: "bg-gold", discount: 47 },
  { name: "Femina Careers tablets", image: img53, desc: "Femina Careers tablets helps regulate blood sugar levels naturally....", price: 1000, oldPrice: 1599, save: 599, rating: 4.6, reviews: 189, badge: null, badgeColor: "", discount: 37 },
  { name: "Active Risup", image: img1, desc: "Active Risup supports healthy liver function and natural detoxification....", price: 340, oldPrice: 399, save: 59, rating: 4.7, reviews: 184, badge: "NEW", badgeColor: "bg-primary-light", discount: 15 },
  { name: "BP Tablets", image: img2, desc: "BP Tablets strengthen immunity with powerful herbal extracts....", price: 230, oldPrice: 499, save: 269, rating: 4.8, reviews: 312, badge: "BESTSELLER", badgeColor: "bg-primary", discount: 54 },
  { name: "Active Z Premium Tablets", image: img3, desc: "Active Z Premium Tablets help calm the mind and support mental wellness....", price: 340, oldPrice: 549, save: 209, rating: 4.6, reviews: 198, badge: null, badgeColor: "", discount: 38 },
  { name: "Vedantak Powder", image: img4, desc: "Vedantak Powder nourishes the scalp and promotes natural hair growth....", price: 211, oldPrice: 499, save: 288, rating: 4.7, reviews: 423, badge: "TOP RATED", badgeColor: "bg-gold", discount: 58 },
  { name: "Camrop capsule", image: img5, desc: "Camrop capsule helps maintain healthy blood sugar levels naturally....", price: 340, oldPrice: 449, save: 109, rating: 4.8, reviews: 267, badge: "BESTSELLER", badgeColor: "bg-primary", discount: 24 },
  { name: "Vayam powder", image: img6, desc: "Vayam powder support cardiac health and healthy circulation....", price: 170, oldPrice: 699, save: 529, rating: 4.9, reviews: 345, badge: "TOP RATED", badgeColor: "bg-gold", discount: 76 },
  { name: "Cartilage Tablets", image: img7, desc: "Cartilage Tablets promote restful sleep with natural herbal blend....", price: 230, oldPrice: 429, save: 199, rating: 4.6, reviews: 156, badge: "NEW", badgeColor: "bg-primary-light", discount: 46 },
  { name: "Aaram oil", image: img8, desc: "Aaram oil enhance brain function, memory and concentration....", price: 199, oldPrice: 599, save: 400, rating: 4.7, reviews: 289, badge: null, badgeColor: "", discount: 67 },
  { name: "Vatmaniras", image: img9, desc: "Vatmaniras supports healthy weight management naturally....", price: 211, oldPrice: 799, save: 588, rating: 4.5, reviews: 178, badge: null, badgeColor: "", discount: 74 },
  { name: "Liver Maniras", image: img10, desc: "Liver Maniras cleanses the body with pure ayurvedic herbs....", price: 211, oldPrice: 499, save: 288, rating: 4.6, reviews: 234, badge: "NEW", badgeColor: "bg-primary-light", discount: 58 },
  { name: "Kidney cure capsule", image: img11, desc: "Kidney cure capsule support healthy bones and joint mobility....", price: 171, oldPrice: 649, save: 478, rating: 4.7, reviews: 198, badge: null, badgeColor: "", discount: 74 },
  { name: "KFT XL 2", image: img12, desc: "KFT XL 2 soothe and refresh tired eyes with herbal extracts....", price: 249, oldPrice: 340, save: 91, rating: 4.5, reviews: 145, badge: null, badgeColor: "", discount: 27 },
  { name: "Livona Syrup", image: img13, desc: "Livona Syrup support hormonal balance and vitality....", price: 599, oldPrice: 749, save: 150, rating: 4.8, reviews: 267, badge: "BESTSELLER", badgeColor: "bg-primary", discount: 20 },
  { name: "Asthmatic capsule", image: img14, desc: "Asthmatic capsule boost energy, stamina and overall vitality....", price: 420, oldPrice: 899, save: 479, rating: 4.7, reviews: 312, badge: "TOP RATED", badgeColor: "bg-gold", discount: 53 },
  { name: "Alc Maniras tablets", image: img15, desc: "Alc Maniras tablets provides natural relief from cough and cold....", price: 211, oldPrice: 440, save: 229, rating: 4.6, reviews: 234, badge: null, badgeColor: "", discount: 52 },
  { name: "Max cold powder", image: img16, desc: "Max cold powder offers fast relief from muscle and joint pain....", price: 340, oldPrice: 399, save: 59, rating: 4.7, reviews: 289, badge: "BESTSELLER", badgeColor: "bg-primary", discount: 15 },
  { name: "Charmer capsules", image: img17, desc: "Charmer capsules supports digestion and natural detoxification....", price: 211, oldPrice: 499, save: 288, rating: 4.8, reviews: 412, badge: "TOP RATED", badgeColor: "bg-gold", discount: 58 },
  { name: "Derma cream", image: img18, desc: "Derma cream reduce stress and boost energy naturally....", price: 230, oldPrice: 499, save: 269, rating: 4.9, reviews: 523, badge: "BESTSELLER", badgeColor: "bg-primary", discount: 54 },
  { name: "Beauty cream", image: img19, desc: "Beauty cream enhance memory and cognitive function....", price: 1000, oldPrice: 1599, save: 599, rating: 4.7, reviews: 234, badge: null, badgeColor: "", discount: 37 },
  { name: "Acid capsule", image: img20, desc: "Acid capsule support healthy skin and natural blood purification....", price: 211, oldPrice: 499, save: 288, rating: 4.6, reviews: 198, badge: "NEW", badgeColor: "bg-primary-light", discount: 58 },
  { name: "Multicomplex capsule", image: img21, desc: "Multicomplex capsule boost immunity with pure holy basil extracts....", price: 249, oldPrice: 340, save: 91, rating: 4.7, reviews: 267, badge: null, badgeColor: "", discount: 27 },
  { name: "Multi vitamin", image: img22, desc: "Multi vitamin strengthens immunity and supports overall wellness....", price: 340, oldPrice: 379, save: 39, rating: 4.6, reviews: 178, badge: null, badgeColor: "", discount: 10 },
  { name: "X gold Powder", image: img23, desc: "X gold Powder supports digestion, skin health and detoxification....", price: 211, oldPrice: 599, save: 388, rating: 4.7, reviews: 312, badge: "BESTSELLER", badgeColor: "bg-primary", discount: 65 },
  { name: "Shat Prabha Tab", image: img24, desc: "Shat Prabha Tab rich in Vitamin C boosts immunity and hair health....", price: 799, oldPrice: 1499, save: 700, rating: 4.8, reviews: 345, badge: "TOP RATED", badgeColor: "bg-gold", discount: 47 },
  { name: "Femina Careers tablets", image: img25, desc: "Femina Careers tablets helps regulate blood sugar levels naturally....", price: 1000, oldPrice: 1599, save: 599, rating: 4.6, reviews: 189, badge: null, badgeColor: "", discount: 37 },
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
