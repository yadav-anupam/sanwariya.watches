-- ====================================================================
-- SANWARIYA WATCHES - SUPERBASE BACKEND SCHEMAS & RLS POLICIES
-- ====================================================================
-- Execute this entire script inside your Supabase SQL Editor.
-- It establishes a production-grade Shopify-style architecture with RLS security, 
-- cascade triggers, activity logs, inventory history tracking, and coupon setups.

-- Enable UUID Extension if not exists
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. ADMINS RELATION TABLE
-- Maps authenticated auth.users to specific administrative roles
CREATE TABLE IF NOT EXISTS public.admins (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email VARCHAR(255) NOT NULL UNIQUE,
    role VARCHAR(50) DEFAULT 'admin' CHECK (role IN ('superadmin', 'admin', 'editor')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS on Admins
ALTER TABLE public.admins ENABLE ROW LEVEL SECURITY;

-- 2. CATEGORIES TABLE
CREATE TABLE IF NOT EXISTS public.categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL UNIQUE,
    description TEXT,
    image_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS on Categories
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

-- 3. BRANDS TABLE
CREATE TABLE IF NOT EXISTS public.brands (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL UNIQUE,
    logo_url TEXT,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS on Brands
ALTER TABLE public.brands ENABLE ROW LEVEL SECURITY;

-- 4. PRODUCTS TABLE
CREATE TABLE IF NOT EXISTS public.products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(255) NOT NULL UNIQUE,
    short_description TEXT,
    full_description TEXT,
    category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
    brand_id UUID REFERENCES public.brands(id) ON DELETE SET NULL,
    sku VARCHAR(100) UNIQUE,
    barcode VARCHAR(100),
    tags TEXT[], -- Array of strings for tag categorization
    
    -- Pricing Metrics
    pricing_original DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    pricing_selling DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    pricing_discount_percentage DECIMAL(5,2) DEFAULT 0.00,
    pricing_discount_amount DECIMAL(12,2) DEFAULT 0.00,
    pricing_tax DECIMAL(5,2) DEFAULT 0.00,
    pricing_shipping DECIMAL(12,2) DEFAULT 0.00,
    
    -- Inventory Control
    stock_quantity INT NOT NULL DEFAULT 0,
    stock_status VARCHAR(50) DEFAULT 'in_stock' CHECK (stock_status IN ('in_stock', 'low_stock', 'out_of_stock')),
    low_stock_warning INT DEFAULT 5,
    unlimited_stock BOOLEAN DEFAULT FALSE,
    
    -- Variants / Physical Properties
    variant_size VARCHAR(100),
    variant_color VARCHAR(100),
    variant_weight VARCHAR(100),
    variant_dimensions VARCHAR(100),
    variant_material VARCHAR(255),
    
    -- SEO Metadata
    seo_title VARCHAR(255),
    seo_description TEXT,
    seo_keywords TEXT,
    
    -- Visual Toggles
    status VARCHAR(50) DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'hidden')),
    is_featured BOOLEAN DEFAULT FALSE,
    is_trending BOOLEAN DEFAULT FALSE,
    is_best_seller BOOLEAN DEFAULT FALSE,
    is_new_arrival BOOLEAN DEFAULT FALSE,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS on Products
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

-- 5. PRODUCT IMAGES RELATION
CREATE TABLE IF NOT EXISTS public.product_images (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    image_url TEXT NOT NULL,
    sort_order INT DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS on Product Images
ALTER TABLE public.product_images ENABLE ROW LEVEL SECURITY;

-- 6. INVENTORY CHANGES HISTORY
CREATE TABLE IF NOT EXISTS public.inventory_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    change_amount INT NOT NULL, -- e.g. +10, -3
    current_stock INT NOT NULL,
    reason VARCHAR(255) NOT NULL, -- e.g. "manual adjustment", "order fulfillment", "return"
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS on Inventory History
ALTER TABLE public.inventory_history ENABLE ROW LEVEL SECURITY;

-- 7. COUPONS & DISCOUNTS CODES
CREATE TABLE IF NOT EXISTS public.discounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(100) NOT NULL UNIQUE,
    discount_type VARCHAR(50) NOT NULL CHECK (discount_type IN ('percentage', 'flat')),
    discount_value DECIMAL(12,2) NOT NULL,
    start_date TIMESTAMP WITH TIME ZONE,
    end_date TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS on Coupons
ALTER TABLE public.discounts ENABLE ROW LEVEL SECURITY;

-- 8. SECURE SYSTEM ACTIVITY LOGS
CREATE TABLE IF NOT EXISTS public.activity_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    admin_id UUID REFERENCES public.admins(id) ON DELETE SET NULL,
    action TEXT NOT NULL, -- e.g. "Create Product", "Delete Category"
    details JSONB,
    ip_address VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS on Activity Logs
ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;


-- ==========================================
-- INDEXES FOR HIGH-VELOCITY QUERY TUNING
-- ==========================================
CREATE INDEX IF NOT EXISTS idx_products_slug ON public.products(slug);
CREATE INDEX IF NOT EXISTS idx_products_status ON public.products(status);
CREATE INDEX IF NOT EXISTS idx_products_category ON public.products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_brand ON public.products(brand_id);
CREATE INDEX IF NOT EXISTS idx_product_images_product ON public.product_images(product_id);
CREATE INDEX IF NOT EXISTS idx_inventory_history_product ON public.inventory_history(product_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_created ON public.activity_logs(created_at);


-- ==========================================
-- AUTOMATION TRIGGERS: STOCK & METRICS UPDATES
-- ==========================================

-- Trigger to automatically calculate discount amount or percentage 
-- and update stock_status before saving products
CREATE OR REPLACE FUNCTION public.sync_product_metrics()
RETURNS TRIGGER AS $$
BEGIN
    -- Calc Discount Percentage if Selling & Original provided
    IF NEW.pricing_original > 0 THEN
        NEW.pricing_discount_amount := NEW.pricing_original - NEW.pricing_selling;
        NEW.pricing_discount_percentage := (NEW.pricing_discount_amount / NEW.pricing_original) * 100;
    END IF;

    -- Update Stock Status string dynamically based on amount
    IF NEW.unlimited_stock = TRUE THEN
        NEW.stock_status := 'in_stock';
    ELSIF NEW.stock_quantity <= 0 THEN
        NEW.stock_status := 'out_of_stock';
    ELSIF NEW.stock_quantity <= NEW.low_stock_warning THEN
        NEW.stock_status := 'low_stock';
    ELSE
        NEW.stock_status := 'in_stock';
    END IF;

    NEW.updated_at := now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER trg_sync_product_metrics
BEFORE INSERT OR UPDATE ON public.products
FOR EACH ROW EXECUTE FUNCTION public.sync_product_metrics();


-- ==========================================
-- SECURITY: ROW LEVEL SECURITY POLICIES
-- ==========================================

-- Helper SQL Function: check if current user is active admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.admins 
        WHERE id = auth.uid()
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- Policies for ADMNNS Table
CREATE POLICY "Admins can view all admin records"
ON public.admins FOR SELECT
USING (public.is_admin() OR auth.uid() = id);

CREATE POLICY "Superadmins can insert/update admins"
ON public.admins FOR ALL
USING (public.is_admin());


-- Policies for CATEGORIES
CREATE POLICY "Anyone can view categories"
ON public.categories FOR SELECT
USING (true);

CREATE POLICY "Only admins can modify categories"
ON public.categories FOR ALL
USING (public.is_admin());


-- Policies for BRANDS
CREATE POLICY "Anyone can view brands"
ON public.brands FOR SELECT
USING (true);

CREATE POLICY "Only admins can modify brands"
ON public.brands FOR ALL
USING (public.is_admin());


-- Policies for PRODUCTS
CREATE POLICY "Anyone can view published/hidden products"
ON public.products FOR SELECT
USING (status = 'published' OR public.is_admin());

CREATE POLICY "Only admins can modify products"
ON public.products FOR ALL
USING (public.is_admin());


-- Policies for PRODUCT IMAGES
CREATE POLICY "Anyone can view product images"
ON public.product_images FOR SELECT
USING (true);

CREATE POLICY "Only admins can modify product images"
ON public.product_images FOR ALL
USING (public.is_admin());


-- Policies for INVENTORY HISTORY
CREATE POLICY "Only admins can view inventory history"
ON public.inventory_history FOR SELECT
USING (public.is_admin());

CREATE POLICY "Only admins can modify inventory history"
ON public.inventory_history FOR ALL
USING (public.is_admin());


-- Policies for DISCOUNTS & COUPONS
CREATE POLICY "Anyone can view active coupons"
ON public.discounts FOR SELECT
USING (is_active = true OR public.is_admin());

CREATE POLICY "Only admins can modify discounts"
ON public.discounts FOR ALL
USING (public.is_admin());


-- Policies for ACTIVITY LOGS
CREATE POLICY "Only admins can view activity logs"
ON public.activity_logs FOR SELECT
USING (public.is_admin());

CREATE POLICY "Only admins can create activity logs"
ON public.activity_logs FOR INSERT
WITH CHECK (public.is_admin());


-- ==========================================================
-- SEED DATA SETUP: ADDS THE INITIAL ADMIN ACCORDING TO USER EMAIL
-- ==========================================================
-- Note: Replace with actual auth UUID once signed up or signed in.
-- INSERT INTO public.admins (id, email, role) 
-- VALUES ('USER_UUID_HERE', 'yadavanupam9119@gmail.com', 'superadmin') 
-- ON CONFLICT (id) DO NOTHING;


-- ==========================================================
-- 9. BOOKINGS & ORDERS TABLE FOR PAYMENT FLOWS
-- ==========================================================
CREATE TABLE IF NOT EXISTS public.bookings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    phone VARCHAR(100) NOT NULL,
    address TEXT NOT NULL,
    notes TEXT,
    items JSONB NOT NULL,
    total_price DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    status VARCHAR(50) DEFAULT 'Pending' CHECK (status IN ('Pending', 'Approved', 'Rejected')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    phone VARCHAR(100) NOT NULL,
    address TEXT NOT NULL,
    notes TEXT,
    items JSONB NOT NULL,
    total_price DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    status VARCHAR(50) DEFAULT 'Pending' CHECK (status IN ('Pending', 'Approved', 'Rejected')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS on Bookings and Orders
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

-- Allow anyone to insert bookings/orders (unauthenticated public checkout)
CREATE POLICY "Anyone can create bookings" ON public.bookings FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can create orders" ON public.orders FOR INSERT WITH CHECK (true);

-- Allow admins to view/modify bookings/orders
CREATE POLICY "Admins can view and manage bookings" ON public.bookings FOR ALL USING (public.is_admin());
CREATE POLICY "Admins can view and manage orders" ON public.orders FOR ALL USING (public.is_admin());

-- Ensure status column is present on existing tables
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'Pending';
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'Pending';

