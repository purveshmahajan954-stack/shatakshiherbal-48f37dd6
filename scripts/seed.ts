import { Pool } from "pg";
import { drizzle } from "drizzle-orm/node-postgres";
import { profiles, userRoles, products } from "../shared/schema";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";
import * as schema from "../shared/schema";

const connectionString = process.env.DATABASE_URL || process.env.NEON_DATABASE_URL;
if (!connectionString) throw new Error("DATABASE_URL not set");

const pool = new Pool({ connectionString });
const db = drizzle(pool, { schema });

const slugify = (s: string) =>
  s.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");

function imgPath(i: number): string {
  if (i <= 2) return `/images/product-${i}.webp`;
  if (i <= 28) return `/images/product-${i}_new.webp`;
  return `/images/product-${i}.webp`;
}

const categoryMap: Record<string, string> = {
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
  { name: "Acidic Capsules", price: 169, mrp: 1799, desc: "Powerful Ayurvedic capsules formulated to relieve acidity, heartburn & indigestion." },
  { name: "Active G5", price: 249, mrp: 899, desc: "Advanced Ayurvedic formulation to manage blood sugar levels and support healthy metabolism." },
  { name: "Active Green", price: 249, mrp: 1199, desc: "Herbal blend of potent anti-diabetic herbs to naturally regulate glucose metabolism." },
  { name: "Arsho F Powder", price: 199, mrp: 599, desc: "Arsho F Powder helps support healthy digestion and provides relief from piles." },
  { name: "Aarogya Jeevan", price: 199, mrp: 799, desc: "Aarogya Jeevan is dedicated to bringing natural wellness solutions for a healthier life." },
  { name: "Active Z Tablets", price: 230, mrp: 399, desc: "Active Z Tablets are formulated to support daily energy, immunity, and overall body wellness." },
  { name: "Active Green XT", price: 159, mrp: 1499, desc: "Active Green XT is a natural wellness formula crafted to support immunity." },
  { name: "Active Glucose", price: 249, mrp: 549, desc: "Active Glucose provides instant energy and helps keep your body refreshed." },
  { name: "Artho Z", price: 339, mrp: 349, desc: "Artho Z is specially formulated to support joint comfort, flexibility and mobility." },
  { name: "Arthovit M", price: 429, mrp: 499, desc: "Arthovit M is designed to support healthy joints, muscle strength and flexibility." },
  { name: "Asthometic Capsule", price: 439, mrp: 849, desc: "Asthometic Capsule is formulated to support respiratory wellness." },
  { name: "C.N.Z Capsule", price: 420, mrp: 699, desc: "C.N.Z Capsule is specially formulated to support overall wellness and immunity." },
  { name: "Charma R Capsule", price: 339, mrp: 449, desc: "Charma R Capsule is designed to support healthy skin and natural glow." },
  { name: "Dr. Sona Artho Tablets", price: 199, mrp: 1999, desc: "Dr. Sona Artho Tablets are specially formulated to support joint comfort." },
  { name: "Dr Sona Vatplus Capsule", price: 340, mrp: 499, desc: "Dr Sona Vatplus Capsule is a herbal wellness supplement that helps relieve pain." },
  { name: "Omega Capsule", price: 211, mrp: 440, desc: "Omega Capsule helps soothe digestion and relieve gas naturally." },
  { name: "Multivitamin Complex", price: 340, mrp: 699, desc: "Multivitamin Complex supports daily nutritional needs." },
  { name: "Glow up Capsules", price: 420, mrp: 449, desc: "Glow up Capsules help achieve natural glow and overall wellness." },
  { name: "Multi Shine Herbal Capsules", price: 1000, mrp: 1499, desc: "Multi Shine Herbal Capsules provide natural glow and overall wellness." },
  { name: "Gaso Touch Capsules", price: 230, mrp: 799, desc: "Gaso Touch Capsules support healthy kidney function and detoxification." },
  { name: "Power Booster Powder", price: 340, mrp: 399, desc: "Power Booster Powder cleanses the liver and improves digestive health." },
  { name: "Purify Capsules", price: 170, mrp: 549, desc: "Purify Capsules enhance brain function, memory and concentration." },
  { name: "RX Gold Capsules", price: 599, mrp: 799, desc: "RX Gold Capsules provide natural energy and vitality support." },
  { name: "Safa Amrit Capsules", price: 340, mrp: 499, desc: "Safa Amrit Capsules soothes and improves digestive health with herbal warmth." },
  { name: "Sakhi Sundari", price: 340, mrp: 469, desc: "Sakhi Sundari offers natural beauty and wellness support for women." },
  { name: "Skin Z Capsules", price: 280, mrp: 549, desc: "Skin Z Capsules provide natural nutrition for healthy skin." },
  { name: "TH - Z Capsules", price: 420, mrp: 599, desc: "TH - Z Capsules revitalize the body and support thyroid health." },
  { name: "Vat Nashak Capsules", price: 340, mrp: 499, desc: "Vat Nashak Capsules support natural relief from pain." },
  { name: "Active Risup", price: 340, mrp: 399, desc: "Active Risup supports healthy liver function and natural detoxification." },
  { name: "BP Tablets", price: 230, mrp: 499, desc: "BP Tablets strengthen immunity with powerful herbal extracts." },
  { name: "Active Z Premium Tablets", price: 340, mrp: 549, desc: "Active Z Premium Tablets help calm the mind and support mental wellness." },
  { name: "Vedantak Powder", price: 211, mrp: 499, desc: "Vedantak Powder nourishes the scalp and promotes natural hair growth." },
  { name: "Camrop capsule", price: 340, mrp: 449, desc: "Camrop capsule helps maintain healthy blood sugar levels naturally." },
  { name: "Vayam powder", price: 170, mrp: 699, desc: "Vayam powder supports cardiac health and healthy circulation." },
  { name: "Cartilage Tablets", price: 230, mrp: 429, desc: "Cartilage Tablets promote restful sleep with natural herbal blend." },
  { name: "Aaram oil", price: 199, mrp: 599, desc: "Aaram oil enhances brain function, memory and concentration." },
  { name: "Vatmaniras", price: 211, mrp: 799, desc: "Vatmaniras supports healthy weight management naturally." },
  { name: "Liver Maniras", price: 211, mrp: 499, desc: "Liver Maniras cleanses the body with pure ayurvedic herbs." },
  { name: "Kidney cure capsule", price: 171, mrp: 649, desc: "Kidney cure capsule supports healthy bones and joint mobility." },
  { name: "KFT XL 2", price: 249, mrp: 340, desc: "KFT XL 2 soothes and refreshes with herbal extracts." },
  { name: "Livona Syrup", price: 599, mrp: 749, desc: "Livona Syrup supports hormonal balance and vitality." },
  { name: "Asthmatic capsule", price: 420, mrp: 899, desc: "Asthmatic capsule boosts energy, stamina and overall vitality." },
  { name: "Alc Maniras tablets", price: 211, mrp: 440, desc: "Alc Maniras tablets provide natural relief from cough and cold." },
  { name: "Max cold powder", price: 340, mrp: 399, desc: "Max cold powder offers fast relief from muscle and joint pain." },
  { name: "Charmer capsules", price: 211, mrp: 499, desc: "Charmer capsules support digestion and natural detoxification." },
  { name: "Derma cream", price: 230, mrp: 499, desc: "Derma cream reduces stress and boosts energy naturally." },
  { name: "Beauty cream", price: 1000, mrp: 1599, desc: "Beauty cream enhances memory and cognitive function." },
  { name: "Acid capsule", price: 211, mrp: 499, desc: "Acid capsule supports healthy skin and natural blood purification." },
  { name: "Multicomplex capsule", price: 249, mrp: 340, desc: "Multicomplex capsule boosts immunity with pure herbal extracts." },
  { name: "Multi vitamin", price: 340, mrp: 379, desc: "Multi vitamin strengthens immunity and supports overall wellness." },
  { name: "X gold Powder", price: 211, mrp: 599, desc: "X gold Powder supports digestion, skin health and detoxification." },
  { name: "Shat Prabha Tab", price: 799, mrp: 1499, desc: "Shat Prabha Tab rich in Vitamin C boosts immunity and hair health." },
  { name: "Femina Careers tablets", price: 1000, mrp: 1599, desc: "Femina Careers tablets help regulate blood sugar levels naturally." },
];

async function seed() {
  console.log("Seeding database...");

  const ADMIN_EMAIL = "admin@shatakshiherbal.com";
  const ADMIN_PASSWORD = "shatakshiherbal";

  const existing = await db.select({ id: profiles.id }).from(profiles).where(eq(profiles.email, ADMIN_EMAIL)).limit(1);

  if (existing.length === 0) {
    console.log("Creating admin account...");
    const passwordHash = await bcrypt.hash(ADMIN_PASSWORD, 12);
    const [admin] = await db.insert(profiles).values({
      email: ADMIN_EMAIL,
      fullName: "Admin",
      passwordHash,
    } as any).returning();

    await db.insert(userRoles).values([
      { userId: admin.id, role: "admin" },
      { userId: admin.id, role: "manager" },
    ]);
    console.log("Admin account created.");
  } else {
    console.log("Admin account already exists, skipping.");
  }

  const existingProducts = await db.select({ id: products.id }).from(products).limit(1);
  if (existingProducts.length > 0) {
    console.log("Products already seeded, skipping.");
    await pool.end();
    return;
  }

  console.log("Seeding 53 products...");
  const toInsert = base.map((p, i) => ({
    name: p.name,
    slug: slugify(p.name),
    description: p.desc,
    price: String(p.price),
    mrp: String(p.mrp),
    stock: 100,
    imageUrl: imgPath(i + 1),
    category: categoryMap[p.name] ?? "wellness-care",
    active: true,
  }));

  await db.insert(products).values(toInsert);
  console.log(`Seeded ${toInsert.length} products.`);

  await pool.end();
  console.log("Done!");
}

seed().catch((e) => { console.error(e); process.exit(1); });
