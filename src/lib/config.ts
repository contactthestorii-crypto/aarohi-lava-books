// Public configuration. Safe to import from client and server code:
// only NEXT_PUBLIC_* values are read here.

export const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000").replace(/\/$/, "");

export const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
export const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

export const ORDER_PAYMENT_WINDOW_MINUTES = 30;
export const PRODUCTS_PER_PAGE = 12;
export const MAX_CART_LINE_QUANTITY = 20;
