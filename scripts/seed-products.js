import pg from "pg";
import crypto from "node:crypto";

const { Pool } = pg;
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

const slugify = (s) =>
  s.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");

const categoryMap = {
  "Acidic Capsules": "acidity-care",
  "Active G5": "diabetes-care",
  "Active Green": "diabetes-care",
  "Arsho F Powder": "piles-care",
  "Aarogya Jeevan": "asthma-allergy-care",
  "Active Z Tablets": "diabetes-care",
  "Active Green XT": "diabetes-care",
  "Active Glucose": "diabetes-care",
  "Artho Z": "arthritis-care",
  "Arthovit M": "arthritis-care",
  "Asthometic Capsule": "asthma-allergy-care",
  "C.N.Z Capsule": "wellness-care",
  "Charma R Capsule": "skin-care",
  "Dr. Sona Artho Tablets": "arthritis-care",
  "Dr Sona Vatplus Capsule": "arthritis-care",
  "Omega Capsule": "wellness-care",
  "Multivitamin Complex": "wellness-care",
  "Glow up Capsules": "skin-care",
  "Multi Shine Herbal Capsules": "wellness-care",
  "Gaso Touch Capsules": "acidity-care",
  "Power Booster Powder": "wellness-care",
  "Purify Capsules": "skin-care",
  "RX Gold Capsules": "vital-care",
  "Safa Amrit Capsules": "acidity-care",
  "Sakhi Sundari": "stree-care",
  "Skin Z Capsules": "skin-care",
  "TH - Z Capsules": "diabetes-care",
  "Vat Nashak Capsules": "arthritis-care",
  "Active Risup": "diabetes-care",
  "BP Tablets": "diabetes-care",
  "Active Z Premium Tablets": "diabetes-care",
  "Vedantak Powder": "arthritis-care",
  "Camrop capsule": "arthritis-care",
  "Vayam powder": "arthritis-care",
  "Cartilage Tablets": "arthritis-care",
  "Aaram oil": "arthritis-care",
  "Vatmaniras": "arthritis-care",
  "Liver Maniras": "liver-kidney-care",
  "Kidney cure capsule": "liver-kidney-care",
  "KFT XL 2": "liver-kidney-care",
  "Livona Syrup": "liver-kidney-care",
  "Asthmatic capsule": "asthma-allergy-care",
  "Alc Maniras tablets": "asthma-allergy-care",
  "Max cold powder": "asthma-allergy-care",
  "Charmer capsules": "skin-care",
  "Derma cream": "skin-care",
  "Beauty cream": "skin-care",
  "Acid capsule": "acidity-care",
  "Multicomplex capsule": "wellness-care",
  "Multi vitamin": "wellness-care",
  "X gold Powder": "vital-care",
  "Shat Prabha Tab": "stree-care",
  "Femina Careers tablets": "stree-care",
};

const base = [
  { name: "Acidic Capsules", desc: "Powerful Ayurvedic capsules formulated to relieve acidity, heartburn & indigestion…", price: 169, mrp: 1799 },
  { name: "Active G5", desc: "Advanced Ayurvedic formulation to manage blood sugar levels and support healthy…", price: 249, mrp: 899 },
  { name: "Active Green", desc: "Herbal blend of potent anti-diabetic herbs to naturally regulate glucose metabolism…", price: 249, mrp: 1199 },
  { name: "Arsho F Powder", desc: "Arsho F Powder helps support healthy digestion and provides relief from piles....", price: 199, mrp: 599 },
  { name: "Aarogya Jeevan", desc: "Aarogya Jeevan is dedicated to bringing natural wellness solutions for a healthier....", price: 199, mrp: 799 },
  { name: "Active Z Tablets", desc: "Active Z Tablets are formulated to support daily energy, immunity, and overall body.....", price: 230, mrp: 399 },
  { name: "Active Green XT", desc: "Active Green XT is a natural wellness formula crafted to support immunity....", price: 159, mrp: 1499 },
  { name: "Active Glucose", desc: "Active Glucose provides instant energy and helps keep your body refreshed....", price: 249, mrp: 549 },
  { name: "Artho Z", desc: "Artho Z is specially formulated to support joint comfort, flexibility....", price: 339, mrp: 349 },
  { name: "Arthovit M", desc: "Arthovit M is designed to support healthy joints, muscle strength....", price: 429, mrp: 499 },
  { name: "Asthometic Capsule", desc: "Asthometic Capsule is formulated to support respiratory wellness ....", price: 439, mrp: 849 },
  { name: "C.N.Z Capsule", desc: "C.N.Z Capsule is specially formulated to support overall wellness, immunity....", price: 420, mrp: 699 },
  { name: "Charma R Capsule", desc: "Charma R Capsule is designed to support healthy skin, natural glow....", price: 339, mrp: 449 },
  { name: "Dr. Sona Artho Tablets", desc: "Dr. Sona Artho Tablets are specially formulated to support joint comfort.....", price: 199, mrp: 1999 },
  { name: "Dr Sona Vatplus Capsule", desc: "Dr Sona Vatplus Capsule is a herbal wellness supplement that helps pain .....", price: 340, mrp: 499 },
  { name: "Omega Capsule", desc: "Omega Capsule helps soothe digestion and relieve gas naturally....", price: 211, mrp: 440 },
  { name: "Multivitamin Complex", desc: "Multivitamin Complex is support to help a daily nutritional supplements...", price: 340, mrp: 699 },
  { name: "Glow up Capsules", desc: "Glow up Capsules is a help to natural glow and overall wellness...", price: 420, mrp: 449 },
  { name: "Multi Shine Herbal Capsules", desc: "Multi Shine Herbal Capsules provides to natural glow and overall wellness...", price: 1000, mrp: 1499 },
  { name: "Gaso Touch Capsules", desc: "Gaso Touch Capsules support healthy kidney function and detoxification....", price: 230, mrp: 799 },
  { name: "Power Booster Powder", desc: "Power Booster Powder cleanses the liver and improves digestive health....", price: 340, mrp: 399 },
  { name: "Purify Capsules", desc: "Purify Capsules enhance brain function, memory and concentration....", price: 170, mrp: 549 },
  { name: "RX Gold Capsules", desc: "RX Gold Capsules provide instant relief from nasal congestion and cold....", price: 599, mrp: 799 },
  { name: "Safa Amrit Capsules", desc: "Safa Amrit Capsules soothes improves digestive health with herbal warmth....", price: 340, mrp: 499 },
  { name: "Sakhi Sundari", desc: "Sakhi Sundari offer natural beauty and wellness....", price: 340, mrp: 469 },
  { name: "Skin Z Capsules", desc: "Skin Z Capsules help to natural nutrition for healthy skin....", price: 280, mrp: 549 },
  { name: "TH - Z Capsules", desc: "TH - Z Capsules revitalizes the body and supports thyroid health....", price: 420, mrp: 599 },
  { name: "Vat Nashak Capsules", desc: "Vat Nashak Capsules supports natural help to relief pain...", price: 340, mrp: 499 },
  { name: "Active Risup", desc: "Active Risup supports healthy liver function and natural detoxification....", price: 340, mrp: 399 },
  { name: "BP Tablets", desc: "BP Tablets strengthen immunity with powerful herbal extracts....", price: 230, mrp: 499 },
  { name: "Active Z Premium Tablets", desc: "Active Z Premium Tablets help calm the mind and support mental wellness....", price: 340, mrp: 549 },
  { name: "Vedantak Powder", desc: "Vedantak Powder nourishes the scalp and promotes natural hair growth....", price: 211, mrp: 499 },
  { name: "Camrop capsule", desc: "Camrop capsule helps maintain healthy blood sugar levels naturally....", price: 340, mrp: 449 },
  { name: "Vayam powder", desc: "Vayam powder support cardiac health and healthy circulation....", price: 170, mrp: 699 },
  { name: "Cartilage Tablets", desc: "Cartilage Tablets promote restful sleep with natural herbal blend....", price: 230, mrp: 429 },
  { name: "Aaram oil", desc: "Aaram oil enhance brain function, memory and concentration....", price: 199, mrp: 599 },
  { name: "Vatmaniras", desc: "Vatmaniras supports healthy weight management naturally....", price: 211, mrp: 799 },
  { name: "Liver Maniras", desc: "Liver Maniras cleanses the body with pure ayurvedic herbs....", price: 211, mrp: 499 },
  { name: "Kidney cure capsule", desc: "Kidney cure capsule support healthy bones and joint mobility....", price: 171, mrp: 649 },
  { name: "KFT XL 2", desc: "KFT XL 2 soothe and refresh tired eyes with herbal extracts....", price: 249, mrp: 340 },
  { name: "Livona Syrup", desc: "Livona Syrup support hormonal balance and vitality....", price: 599, mrp: 749 },
  { name: "Asthmatic capsule", desc: "Asthmatic capsule boost energy, stamina and overall vitality....", price: 420, mrp: 899 },
  { name: "Alc Maniras tablets", desc: "Alc Maniras tablets provides natural relief from cough and cold....", price: 211, mrp: 440 },
  { name: "Max cold powder", desc: "Max cold powder offers fast relief from muscle and joint pain....", price: 340, mrp: 399 },
  { name: "Charmer capsules", desc: "Charmer capsules supports digestion and natural detoxification....", price: 211, mrp: 499 },
  { name: "Derma cream", desc: "Derma cream reduce stress and boost energy naturally....", price: 230, mrp: 499 },
  { name: "Beauty cream", desc: "Beauty cream enhance memory and cognitive function....", price: 1000, mrp: 1599 },
  { name: "Acid capsule", desc: "Acid capsule support healthy skin and natural blood purification....", price: 211, mrp: 499 },
  { name: "Multicomplex capsule", desc: "Multicomplex capsule boost immunity with pure holy basil extracts....", price: 249, mrp: 340 },
  { name: "Multi vitamin", desc: "Multi vitamin strengthens immunity and supports overall wellness....", price: 340, mrp: 379 },
  { name: "X gold Powder", desc: "X gold Powder supports digestion, skin health and detoxification....", price: 211, mrp: 599 },
  { name: "Shat Prabha Tab", desc: "Shat Prabha Tab rich in Vitamin C boosts immunity and hair health....", price: 799, mrp: 1499 },
  { name: "Femina Careers tablets", desc: "Femina Careers tablets helps regulate blood sugar levels naturally....", price: 1000, mrp: 1599 },
];

async function seed() {
  const client = await pool.connect();
  try {
    let inserted = 0;
    let skipped = 0;
    for (const p of base) {
      const slug = slugify(p.name);
      const category = categoryMap[p.name] ?? "wellness-care";

      const existing = await client.query(
        "SELECT id FROM products WHERE slug = $1",
        [slug]
      );

      if (existing.rows.length > 0) {
        skipped++;
        continue;
      }

      await client.query(
        `INSERT INTO products (id, name, slug, description, price, mrp, stock, category, active, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, now(), now())`,
        [
          crypto.randomUUID(),
          p.name,
          slug,
          p.desc,
          p.price,
          p.mrp,
          100,
          category,
          true,
        ]
      );
      inserted++;
    }
    console.log(`✓ Seeded ${inserted} products (${skipped} already existed)`);
  } finally {
    client.release();
    await pool.end();
  }
}

seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
