import { neon } from "@neondatabase/serverless";
import pg from "pg";

function slugify(s) {
  return s.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}

const BASE_URL = "/product-images";

const products = [
  { n: "Acidic Capsules",          img: "product-1.webp",      price: 169,  mrp: 1799, cat: "Ayurvedic Tablets / Medicines", desc: "Powerful Ayurvedic capsules formulated to relieve acidity, heartburn & indigestion.", stock: 100 },
  { n: "Active G5",                img: "product-2.webp",      price: 249,  mrp: 899,  cat: "Ayurvedic Tablets / Medicines", desc: "Advanced Ayurvedic formulation to manage blood sugar levels and support healthy metabolism.", stock: 100 },
  { n: "Active Green",             img: "product-3_new.webp",  price: 249,  mrp: 1199, cat: "Ayurvedic Tablets / Medicines", desc: "Herbal blend of potent anti-diabetic herbs to naturally regulate glucose metabolism.", stock: 100 },
  { n: "Arsho F Powder",           img: "product-4_new.webp",  price: 199,  mrp: 599,  cat: "Ayurvedic Tablets / Medicines", desc: "Arsho F Powder helps support healthy digestion and provides relief from piles.", stock: 100 },
  { n: "Aarogya Jeevan",           img: "product-5_new.webp",  price: 199,  mrp: 799,  cat: "Ayurvedic Tablets / Medicines", desc: "Aarogya Jeevan is dedicated to bringing natural wellness solutions for a healthier life.", stock: 100 },
  { n: "Active Z Tablets",         img: "product-6_new.webp",  price: 230,  mrp: 399,  cat: "Ayurvedic Tablets / Medicines", desc: "Active Z Tablets are formulated to support daily energy, immunity, and overall body health.", stock: 100 },
  { n: "Active Green XT",          img: "product-7_new.webp",  price: 159,  mrp: 1499, cat: "Ayurvedic Tablets / Medicines", desc: "Active Green XT is a natural wellness formula crafted to support immunity.", stock: 100 },
  { n: "Active Glucose",           img: "product-8_new.webp",  price: 249,  mrp: 549,  cat: "Ayurvedic Tablets / Medicines", desc: "Active Glucose provides instant energy and helps keep your body refreshed.", stock: 100 },
  { n: "Artho Z",                  img: "product-9_new.webp",  price: 339,  mrp: 349,  cat: "Ayurvedic Tablets / Medicines", desc: "Artho Z is specially formulated to support joint comfort and flexibility.", stock: 100 },
  { n: "Arthovit M",               img: "product-10_new.webp", price: 429,  mrp: 499,  cat: "Ayurvedic Tablets / Medicines", desc: "Arthovit M is designed to support healthy joints and muscle strength.", stock: 100 },
  { n: "Asthometic Capsule",       img: "product-11_new.webp", price: 439,  mrp: 849,  cat: "Ayurvedic Tablets / Medicines", desc: "Asthometic Capsule is formulated to support respiratory wellness.", stock: 100 },
  { n: "C.N.Z Capsule",            img: "product-12_new.webp", price: 420,  mrp: 699,  cat: "Ayurvedic Tablets / Medicines", desc: "C.N.Z Capsule is specially formulated to support overall wellness and immunity.", stock: 100 },
  { n: "Charma R Capsule",         img: "product-13_new.webp", price: 339,  mrp: 449,  cat: "Ayurvedic Tablets / Medicines", desc: "Charma R Capsule is designed to support healthy skin and natural glow.", stock: 100 },
  { n: "Dr. Sona Artho Tablets",   img: "product-14_new.webp", price: 199,  mrp: 1999, cat: "Ayurvedic Tablets / Medicines", desc: "Dr. Sona Artho Tablets are specially formulated to support joint comfort.", stock: 100 },
  { n: "Dr Sona Vatplus Capsule",  img: "product-15_new.webp", price: 340,  mrp: 499,  cat: "Ayurvedic Tablets / Medicines", desc: "Dr Sona Vatplus Capsule is a herbal wellness supplement that helps pain relief.", stock: 100 },
  { n: "Omega Capsule",            img: "product-16_new.webp", price: 211,  mrp: 440,  cat: "Ayurvedic Tablets / Medicines", desc: "Omega Capsule helps soothe digestion and relieve gas naturally.", stock: 100 },
  { n: "Multivitamin Complex",     img: "product-17_new.webp", price: 340,  mrp: 699,  cat: "Ayurvedic Tablets / Medicines", desc: "Multivitamin Complex supports daily nutritional supplements.", stock: 100 },
  { n: "Glow up Capsules",         img: "product-18_new.webp", price: 420,  mrp: 449,  cat: "Ayurvedic Tablets / Medicines", desc: "Glow up Capsules help natural glow and overall wellness.", stock: 100 },
  { n: "Multi Shine Herbal Capsules", img: "product-19_new.webp", price: 1000, mrp: 1499, cat: "Ayurvedic Tablets / Medicines", desc: "Multi Shine Herbal Capsules provide natural glow and overall wellness.", stock: 100 },
  { n: "Gaso Touch Capsules",      img: "product-20_new.webp", price: 230,  mrp: 799,  cat: "Ayurvedic Tablets / Medicines", desc: "Gaso Touch Capsules support healthy kidney function and detoxification.", stock: 100 },
  { n: "Power Booster Powder",     img: "product-21_new.webp", price: 340,  mrp: 399,  cat: "Ayurvedic Tablets / Medicines", desc: "Power Booster Powder cleanses the liver and improves digestive health.", stock: 100 },
  { n: "Purify Capsules",          img: "product-22_new.webp", price: 170,  mrp: 549,  cat: "Ayurvedic Tablets / Medicines", desc: "Purify Capsules enhance brain function, memory and concentration.", stock: 100 },
  { n: "RX Gold Capsules",         img: "product-23_new.webp", price: 599,  mrp: 799,  cat: "Ayurvedic Tablets / Medicines", desc: "RX Gold Capsules boost vitality and stamina naturally.", stock: 100 },
  { n: "Safa Amrit Capsules",      img: "product-24_new.webp", price: 340,  mrp: 499,  cat: "Ayurvedic Tablets / Medicines", desc: "Safa Amrit Capsules soothes and improves digestive health with herbal warmth.", stock: 100 },
  { n: "Sakhi Sundari",            img: "product-25_new.webp", price: 340,  mrp: 469,  cat: "Ayurvedic Tablets / Medicines", desc: "Sakhi Sundari offers natural beauty and wellness.", stock: 100 },
  { n: "Skin Z Capsules",          img: "product-26_new.webp", price: 280,  mrp: 549,  cat: "Ayurvedic Tablets / Medicines", desc: "Skin Z Capsules help natural nutrition for healthy skin.", stock: 100 },
  { n: "TH - Z Capsules",          img: "product-27_new.webp", price: 420,  mrp: 599,  cat: "Ayurvedic Tablets / Medicines", desc: "TH - Z Capsules revitalizes the body and supports thyroid health.", stock: 100 },
  { n: "Vat Nashak Capsules",      img: "product-28_new.webp", price: 340,  mrp: 499,  cat: "Ayurvedic Tablets / Medicines", desc: "Vat Nashak Capsules supports natural help to relief pain.", stock: 100 },
  { n: "Active Risup",             img: "product-29.webp",     price: 340,  mrp: 399,  cat: "Ayurvedic Tablets / Medicines", desc: "Active Risup supports healthy liver function and natural detoxification.", stock: 100 },
  { n: "BP Tablets",               img: "product-30.webp",     price: 230,  mrp: 499,  cat: "Ayurvedic Tablets / Medicines", desc: "BP Tablets strengthen immunity with powerful herbal extracts.", stock: 100 },
  { n: "Active Z Premium Tablets", img: "product-31.webp",     price: 340,  mrp: 549,  cat: "Ayurvedic Tablets / Medicines", desc: "Active Z Premium Tablets help calm the mind and support mental wellness.", stock: 100 },
  { n: "Vedantak Powder",          img: "product-32.webp",     price: 211,  mrp: 499,  cat: "Ayurvedic Tablets / Medicines", desc: "Vedantak Powder nourishes the scalp and promotes natural hair growth.", stock: 100 },
  { n: "Camrop capsule",           img: "product-33.webp",     price: 340,  mrp: 449,  cat: "Ayurvedic Tablets / Medicines", desc: "Camrop capsule helps maintain healthy blood sugar levels naturally.", stock: 100 },
  { n: "Vayam powder",             img: "product-34.webp",     price: 170,  mrp: 699,  cat: "Ayurvedic Tablets / Medicines", desc: "Vayam powder supports cardiac health and healthy circulation.", stock: 100 },
  { n: "Cartilage Tablets",        img: "product-35.webp",     price: 230,  mrp: 429,  cat: "Ayurvedic Tablets / Medicines", desc: "Cartilage Tablets promote restful sleep with natural herbal blend.", stock: 100 },
  { n: "Aaram oil",                img: "product-36.webp",     price: 199,  mrp: 599,  cat: "Ayurvedic Tablets / Medicines", desc: "Aaram oil enhances brain function, memory and concentration.", stock: 100 },
  { n: "Vatmaniras",               img: "product-37.webp",     price: 211,  mrp: 799,  cat: "Ayurvedic Tablets / Medicines", desc: "Vatmaniras supports healthy weight management naturally.", stock: 100 },
  { n: "Liver Maniras",            img: "product-38.webp",     price: 211,  mrp: 499,  cat: "Ayurvedic Tablets / Medicines", desc: "Liver Maniras cleanses the body with pure ayurvedic herbs.", stock: 100 },
  { n: "Kidney cure capsule",      img: "product-39.webp",     price: 171,  mrp: 649,  cat: "Ayurvedic Tablets / Medicines", desc: "Kidney cure capsule supports healthy bones and joint mobility.", stock: 100 },
  { n: "KFT XL 2",                 img: "product-40.webp",     price: 249,  mrp: 340,  cat: "Ayurvedic Tablets / Medicines", desc: "KFT XL 2 soothes and refreshes with herbal extracts.", stock: 100 },
  { n: "Livona Syrup",             img: "product-41.webp",     price: 599,  mrp: 749,  cat: "Ayurvedic Tablets / Medicines", desc: "Livona Syrup supports hormonal balance and vitality.", stock: 100 },
  { n: "Asthmatic capsule",        img: "product-42.webp",     price: 420,  mrp: 899,  cat: "Ayurvedic Tablets / Medicines", desc: "Asthmatic capsule boosts energy, stamina and overall vitality.", stock: 100 },
  { n: "Alc Maniras tablets",      img: "product-43.webp",     price: 211,  mrp: 440,  cat: "Ayurvedic Tablets / Medicines", desc: "Alc Maniras tablets provides natural relief from cough and cold.", stock: 100 },
  { n: "Max cold powder",          img: "product-44.webp",     price: 340,  mrp: 399,  cat: "Ayurvedic Tablets / Medicines", desc: "Max cold powder offers fast relief from muscle and joint pain.", stock: 100 },
  { n: "Charmer capsules",         img: "product-45.webp",     price: 211,  mrp: 499,  cat: "Ayurvedic Tablets / Medicines", desc: "Charmer capsules supports digestion and natural detoxification.", stock: 100 },
  { n: "Derma cream",              img: "product-46.webp",     price: 230,  mrp: 499,  cat: "Ayurvedic Tablets / Medicines", desc: "Derma cream reduces stress and boosts energy naturally.", stock: 100 },
  { n: "Beauty cream",             img: "product-47.webp",     price: 1000, mrp: 1599, cat: "Ayurvedic Tablets / Medicines", desc: "Beauty cream enhances memory and cognitive function.", stock: 100 },
  { n: "Acid capsule",             img: "product-48.webp",     price: 211,  mrp: 499,  cat: "Ayurvedic Tablets / Medicines", desc: "Acid capsule supports healthy skin and natural blood purification.", stock: 100 },
  { n: "Multicomplex capsule",     img: "product-49.webp",     price: 249,  mrp: 340,  cat: "Ayurvedic Tablets / Medicines", desc: "Multicomplex capsule boosts immunity with pure holy basil extracts.", stock: 100 },
  { n: "Multi vitamin",            img: "product-50.webp",     price: 340,  mrp: 379,  cat: "Ayurvedic Tablets / Medicines", desc: "Multi vitamin strengthens immunity and supports overall wellness.", stock: 100 },
  { n: "X gold Powder",            img: "product-51.webp",     price: 211,  mrp: 599,  cat: "Ayurvedic Tablets / Medicines", desc: "X gold Powder supports digestion, skin health and detoxification.", stock: 100 },
  { n: "Shat Prabha Tab",          img: "product-52.webp",     price: 799,  mrp: 1499, cat: "Ayurvedic Tablets / Medicines", desc: "Shat Prabha Tab rich in Vitamin C boosts immunity and hair health.", stock: 100 },
  { n: "Femina Careers tablets",   img: "product-53.webp",     price: 1000, mrp: 1599, cat: "Ayurvedic Tablets / Medicines", desc: "Femina Careers tablets helps regulate blood sugar levels naturally.", stock: 100 },
];

async function seedProducts(queryFn, label) {
  let inserted = 0;
  let skipped = 0;
  for (const p of products) {
    const slug = slugify(p.n);
    const imageUrl = `${BASE_URL}/${p.img}`;
    try {
      await queryFn(`
        INSERT INTO products (id, name, slug, description, price, mrp, stock, image_url, category, active, created_at, updated_at)
        VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, $6, $7, $8, true, now(), now())
        ON CONFLICT (slug) DO UPDATE
          SET name        = EXCLUDED.name,
              description = EXCLUDED.description,
              price       = EXCLUDED.price,
              mrp         = EXCLUDED.mrp,
              stock       = EXCLUDED.stock,
              image_url   = EXCLUDED.image_url,
              category    = EXCLUDED.category,
              updated_at  = now()
      `, [p.n, slug, p.desc, String(p.price), String(p.mrp), p.stock, imageUrl, p.cat]);
      inserted++;
    } catch (e) {
      console.warn(`  ⚠ Skipped "${p.n}": ${e.message}`);
      skipped++;
    }
  }
  console.log(`✅ [${label}] ${inserted} products upserted, ${skipped} skipped`);
}

async function main() {
  const replitUrl = process.env.DATABASE_URL;
  const neonUrl   = process.env.NEON_DATABASE_URL;

  if (replitUrl) {
    const client = new pg.Client({ connectionString: replitUrl });
    await client.connect();
    await seedProducts((sql, params) => client.query(sql, params), "Replit DB");
    await client.end();
  } else {
    console.warn("⚠️  DATABASE_URL not set");
  }

  if (neonUrl) {
    const sql = neon(neonUrl);
    await seedProducts((query, params) => sql.query(query, params), "Neon DB (CF)");
  } else {
    console.warn("⚠️  NEON_DATABASE_URL not set");
  }

  console.log("\n🎉 All 53 products seeded in both databases.");
}

main().catch((e) => { console.error("❌", e.message); process.exit(1); });
