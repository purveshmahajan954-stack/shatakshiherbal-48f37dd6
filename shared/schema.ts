import {
  pgTable,
  pgEnum,
  text,
  timestamp,
  uuid,
  integer,
  boolean,
  numeric,
  jsonb,
  index,
  uniqueIndex,
} from "drizzle-orm/pg-core";

export const appRoleEnum = pgEnum("app_role", ["admin", "manager", "user"]);

export type SavedAddress = {
  id: string;
  label: string;
  flatHouse: string;
  areaStreet: string;
  landmark?: string;
  district: string;
  pincode: string;
  city: string;
  state: string;
  isDefault?: boolean;
};

export const profiles = pgTable("profiles", {
  id: uuid("id").primaryKey().defaultRandom(),
  email: text("email").unique(),
  phone: text("phone").unique(),
  fullName: text("full_name"),
  passwordHash: text("password_hash"),
  googleId: text("google_id").unique(),
  avatarUrl: text("avatar_url"),
  address: text("address"),
  savedAddresses: jsonb("saved_addresses").$type<SavedAddress[]>().default([]),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const userRoles = pgTable(
  "user_roles",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => profiles.id, { onDelete: "cascade" }),
    role: appRoleEnum("role").notNull().default("user"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (t) => [uniqueIndex("user_roles_user_id_role_idx").on(t.userId, t.role)],
);

export const userSessions = pgTable(
  "user_sessions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    token: text("token").notNull().unique(),
    profileId: uuid("profile_id")
      .notNull()
      .references(() => profiles.id, { onDelete: "cascade" }),
    expiresAt: timestamp("expires_at").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (t) => [index("user_sessions_token_idx").on(t.token)],
);

export const adminSessions = pgTable(
  "admin_sessions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    token: text("token").notNull().unique(),
    profileId: uuid("profile_id")
      .notNull()
      .references(() => profiles.id, { onDelete: "cascade" }),
    expiresAt: timestamp("expires_at").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (t) => [index("admin_sessions_token_idx").on(t.token)],
);

export const otpCodes = pgTable(
  "otp_codes",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    phone: text("phone").notNull(),
    code: text("code").notNull(),
    expiresAt: timestamp("expires_at").notNull(),
    used: boolean("used").notNull().default(false),
    attempts: integer("attempts").notNull().default(0),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (t) => [index("otp_codes_phone_idx").on(t.phone)],
);

export const products = pgTable(
  "products",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    name: text("name").notNull(),
    slug: text("slug").notNull().unique(),
    description: text("description"),
    price: numeric("price").notNull().default("0"),
    mrp: numeric("mrp"),
    stock: integer("stock").notNull().default(0),
    imageUrl: text("image_url"),
    category: text("category"),
    active: boolean("active").notNull().default(true),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (t) => [
    index("products_active_idx").on(t.active),
    index("products_active_created_idx").on(t.active, t.createdAt),
  ],
);

export const orders = pgTable(
  "orders",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => profiles.id, { onDelete: "cascade" }),
    items: jsonb("items").notNull(),
    total: numeric("total", { precision: 10, scale: 2 }).notNull(),
    subtotal: numeric("subtotal").notNull().default("0"),
    gst: numeric("gst").notNull().default("0"),
    deliveryCharge: numeric("delivery_charge").notNull().default("0"),
    discount: numeric("discount").notNull().default("0"),
    couponCode: text("coupon_code"),
    status: text("status").notNull().default("pending"),
    shippingName: text("shipping_name"),
    shippingPhone: text("shipping_phone"),
    shippingAddress: text("shipping_address"),
    email: text("email"),
    razorpayOrderId: text("razorpay_order_id").unique(),
    razorpayPaymentId: text("razorpay_payment_id"),
    paymentMethod: text("payment_method").notNull().default("razorpay"),
    paymentStatus: text("payment_status").notNull().default("created"),
    trackingId: text("tracking_id").unique(),
    trackingStatus: text("tracking_status").notNull().default("Order Placed"),
    trackingLocation: text("tracking_location"),
    trackingEta: text("tracking_eta"),
    trackingUpdatedAt: timestamp("tracking_updated_at").defaultNow().notNull(),
    trackingEvents: jsonb("tracking_events").$type<Array<{ status: string; location: string; timestamp: string; description?: string }>>().default([]),
    ckshipShipmentId: text("ckship_shipment_id"),
    ckshipOrderNumber: text("ckship_order_number"),
    awbNumber: text("awb_number"),
    courierName: text("courier_name"),
    shippingCost: numeric("shipping_cost"),
    labelUrl: text("label_url"),
    shipmentStatus: text("shipment_status").notNull().default("Not Created"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (t) => [
    index("orders_user_id_created_at_idx").on(t.userId, t.createdAt),
    index("orders_razorpay_order_id_idx").on(t.razorpayOrderId),
    index("orders_tracking_id_idx").on(t.trackingId),
  ],
);

export const paymentEvents = pgTable(
  "payment_events",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    orderId: uuid("order_id"),
    razorpayOrderId: text("razorpay_order_id"),
    razorpayPaymentId: text("razorpay_payment_id"),
    event: text("event").notNull(),
    amount: numeric("amount"),
    customerName: text("customer_name"),
    customerEmail: text("customer_email"),
    customerPhone: text("customer_phone"),
    items: jsonb("items").$type<Array<{ name: string; qty: number; price: number }>>(),
    notificationsSent: jsonb("notifications_sent").$type<{
      email?: boolean;
      telegram?: boolean;
      sms?: boolean;
      emailError?: string;
      telegramError?: string;
    }>().default({}),
    rawPayload: jsonb("raw_payload"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (t) => [
    index("payment_events_order_id_idx").on(t.orderId),
    index("payment_events_created_at_idx").on(t.createdAt),
  ]
);

export const notificationQueue = pgTable(
  "notification_queue",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    orderId: uuid("order_id"),
    razorpayOrderId: text("razorpay_order_id"),
    channel: text("channel").notNull(),
    payload: jsonb("payload").notNull(),
    attempts: integer("attempts").notNull().default(0),
    maxAttempts: integer("max_attempts").notNull().default(5),
    lastError: text("last_error"),
    status: text("status").notNull().default("pending"),
    nextRetryAt: timestamp("next_retry_at").defaultNow().notNull(),
    processedAt: timestamp("processed_at"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (t) => [
    index("notification_queue_status_idx").on(t.status),
    index("notification_queue_next_retry_idx").on(t.nextRetryAt),
  ],
);

export const contactMessages = pgTable("contact_messages", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  email: text("email").notNull(),
  phone: text("phone"),
  message: text("message").notNull(),
  status: text("status").notNull().default("new"),
  assignedTo: uuid("assigned_to"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
