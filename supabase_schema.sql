-- QuickContact QR SaaS - Supabase Schema
-- Run this in your Supabase SQL Editor (https://supabase.com/dashboard/project/idttbtyqglgdtxlyujlv/sql)

CREATE TABLE IF NOT EXISTS public.cards (
  id TEXT PRIMARY KEY,
  card_name TEXT NOT NULL,
  first_name TEXT,
  last_name TEXT,
  prefix TEXT,
  title TEXT,
  company TEXT,
  department TEXT,
  headline TEXT,
  phone TEXT,
  work_phone TEXT,
  whatsapp TEXT,
  email TEXT,
  work_email TEXT,
  website TEXT,
  linkedin TEXT,
  twitter TEXT,
  instagram TEXT,
  github TEXT,
  youtube TEXT,
  calendly TEXT,
  telegram TEXT,
  address TEXT,
  city TEXT,
  state TEXT,
  country TEXT,
  postal_code TEXT,
  note TEXT,
  avatar_url TEXT,
  theme_color TEXT DEFAULT '#6366f1',
  qr_foreground TEXT DEFAULT '#0f172a',
  qr_background TEXT DEFAULT '#ffffff',
  qr_mode TEXT DEFAULT 'vcard',
  qr_center_icon TEXT DEFAULT 'phone',
  raw_data JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for speedy lookups
CREATE INDEX IF NOT EXISTS idx_cards_id ON public.cards(id);

-- Enable Row Level Security (RLS)
ALTER TABLE public.cards ENABLE ROW LEVEL SECURITY;

-- Allow public read access (so anyone scanning the QR code can load the card)
DROP POLICY IF EXISTS "Public Read Access to Cards" ON public.cards;
CREATE POLICY "Public Read Access to Cards" ON public.cards
  FOR SELECT USING (true);

-- Allow write access via API (anon & service_role)
DROP POLICY IF EXISTS "Allow Insert and Update to Cards" ON public.cards;
CREATE POLICY "Allow Insert and Update to Cards" ON public.cards
  FOR ALL USING (true);
