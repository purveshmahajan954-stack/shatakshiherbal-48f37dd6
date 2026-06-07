import { neon } from "@neondatabase/serverless";

const sql = neon(process.env.NEON_DATABASE_URL);

const fullSchema = `
CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS "profiles" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "email" text NOT NULL UNIQUE,
  "full_name" text,
  "password_hash" text,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL
);

DO $$ BEGIN
  CREATE TYPE "app_role" AS ENUM('admin','manager','user');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS "user_roles" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "user_id" uuid NOT NULL REFERENCES "profiles"("id") ON DELETE CASCADE,
  "role" "app_role" DEFAULT 'user' NOT NULL,
  "created_at" timestamp DEFAULT now() NOT NULL
);
CREATE UNIQUE INDEX IF NOT EXISTS "user_roles_user_id_role_idx" ON "user_roles"("user_id","role");

CREATE TABLE IF NOT EXISTS "user_sessions" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "token" text NOT NULL UNIQUE,
  "profile_id" uuid NOT NULL REFERENCES "profiles"("id") ON DELETE CASCADE,
  "expires_at" timestamp NOT NULL,
  "created_at" timestamp DEFAULT now() NOT NULL
);
CREATE INDEX IF NOT EXISTS "user_sessions_token_idx" ON "user_sessions"("token");

CREATE TABLE IF NOT EXISTS "admin_sessions" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "token" text NOT NULL UNIQUE,
  "profile_id" uuid NOT NULL REFERENCES "profiles"("id") ON DELETE CASCADE,
  "expires_at" timestamp NOT NULL,
  "created_at" timestamp DEFAULT now() NOT NULL
);
CREATE INDEX IF NOT EXISTS "admin_sessions_token_idx" ON "admin_sessions"("token");

CREATE TABLE IF NOT EXISTS "products" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "name" text NOT NULL,
  "slug" text NOT NULL UNIQUE,
  "description" text,
  "price" numeric DEFAULT '0' NOT NULL,
  "mrp" numeric,
  "stock" integer DEFAULT 0 NOT NULL,
  "image_url" text,
  "category" text,
  "active" boolean DEFAULT true NOT NULL,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "orders" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "user_id" uuid NOT NULL REFERENCES "profiles"("id") ON DELETE CASCADE,
  "items" jsonb NOT NULL,
  "total" numeric(10,2) NOT NULL,
  "subtotal" numeric DEFAULT '0' NOT NULL,
  "gst" numeric DEFAULT '0' NOT NULL,
  "delivery_charge" numeric DEFAULT '0' NOT NULL,
  "discount" numeric DEFAULT '0' NOT NULL,
  "coupon_code" text,
  "status" text DEFAULT 'pending' NOT NULL,
  "shipping_name" text,
  "shipping_phone" text,
  "shipping_address" text,
  "email" text,
  "razorpay_order_id" text UNIQUE,
  "razorpay_payment_id" text,
  "payment_status" text DEFAULT 'created' NOT NULL,
  "tracking_id" text UNIQUE,
  "tracking_status" text DEFAULT 'Order Placed' NOT NULL,
  "tracking_location" text,
  "tracking_eta" text,
  "tracking_updated_at" timestamp DEFAULT now() NOT NULL,
  "created_at" timestamp DEFAULT now() NOT NULL
);
CREATE INDEX IF NOT EXISTS "orders_user_id_created_at_idx" ON "orders"("user_id","created_at");
CREATE INDEX IF NOT EXISTS "orders_razorpay_order_id_idx" ON "orders"("razorpay_order_id");
CREATE INDEX IF NOT EXISTS "orders_tracking_id_idx" ON "orders"("tracking_id");

CREATE TABLE IF NOT EXISTS "contact_messages" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "name" text NOT NULL,
  "email" text NOT NULL,
  "phone" text,
  "message" text NOT NULL,
  "status" text DEFAULT 'new' NOT NULL,
  "assigned_to" uuid,
  "notes" text,
  "created_at" timestamp DEFAULT now() NOT NULL
);
`;

try {
  await sql.query(fullSchema);
  console.log("✓ Neon schema created successfully (all tables)");
} catch (err) {
  console.error("✗ Schema push failed:", err.message ?? err);
  process.exit(1);
}
