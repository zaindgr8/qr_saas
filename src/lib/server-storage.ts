import fs from 'fs';
import path from 'path';
import { ContactProfile } from '@/types/contact';
import { SAMPLE_PROFILES } from './templates';
import { supabaseAdmin } from './supabase';

// In-memory cache
const memoryStore = new Map<string, ContactProfile>();

// Initialize with sample profiles
SAMPLE_PROFILES.forEach((p) => memoryStore.set(p.id, p));

const DATA_DIR = path.join(process.cwd(), '.data');
const DATA_FILE = path.join(DATA_DIR, 'cards.json');

function ensureDataFile() {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    if (!fs.existsSync(DATA_FILE)) {
      const initial: Record<string, ContactProfile> = {};
      SAMPLE_PROFILES.forEach((p) => {
        initial[p.id] = p;
      });
      fs.writeFileSync(DATA_FILE, JSON.stringify(initial, null, 2), 'utf-8');
    }
  } catch (err) {
    console.error('Failed to initialize storage file:', err);
  }
}

/**
 * Fetch card by ID from Memory -> Supabase -> Local File -> Sample Profiles
 */
export async function getCardById(id: string): Promise<ContactProfile | null> {
  // 1. Fast memory check
  if (memoryStore.has(id)) {
    return memoryStore.get(id)!;
  }

  // 2. Check Supabase 'cards' table first
  try {
    const { data, error } = await supabaseAdmin
      .from('cards')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (!error && data) {
      const card: ContactProfile = data.raw_data || {
        id: data.id,
        cardName: data.card_name || 'Contact Card',
        firstName: data.first_name || '',
        lastName: data.last_name || '',
        prefix: data.prefix || '',
        title: data.title || '',
        company: data.company || '',
        department: data.department || '',
        headline: data.headline || '',
        phone: data.phone || '',
        workPhone: data.work_phone || '',
        whatsapp: data.whatsapp || '',
        email: data.email || '',
        workEmail: data.work_email || '',
        website: data.website || '',
        linkedin: data.linkedin || '',
        twitter: data.twitter || '',
        instagram: data.instagram || '',
        github: data.github || '',
        youtube: data.youtube || '',
        calendly: data.calendly || '',
        telegram: data.telegram || '',
        address: data.address || '',
        city: data.city || '',
        state: data.state || '',
        country: data.country || '',
        postalCode: data.postal_code || '',
        note: data.note || '',
        avatarUrl: data.avatar_url || '',
        themeColor: data.theme_color || '#6366f1',
        qrForeground: data.qr_foreground || '#0f172a',
        qrBackground: data.qr_background || '#ffffff',
        qrMode: data.qr_mode || 'vcard',
        qrCenterIcon: data.qr_center_icon || 'phone',
        createdAt: data.created_at ? new Date(data.created_at).getTime() : Date.now(),
        updatedAt: data.updated_at ? new Date(data.updated_at).getTime() : Date.now(),
      };
      memoryStore.set(id, card);
      return card;
    }
  } catch (e) {
    console.warn('Supabase cards table lookup error, checking app_settings fallback...', e);
  }

  // 3. Check Supabase 'app_settings' fallback table
  try {
    const { data: settingData, error: settingError } = await supabaseAdmin
      .from('app_settings')
      .select('value')
      .eq('key', `qr_card_${id}`)
      .maybeSingle();

    if (!settingError && settingData?.value) {
      const card: ContactProfile = JSON.parse(settingData.value);
      memoryStore.set(id, card);
      return card;
    }
  } catch (e) {
    console.warn('Supabase app_settings lookup error:', e);
  }

  // 4. Fallback to local filesystem
  ensureDataFile();
  try {
    if (fs.existsSync(DATA_FILE)) {
      const content = fs.readFileSync(DATA_FILE, 'utf-8');
      const cards: Record<string, ContactProfile> = JSON.parse(content);
      if (cards[id]) {
        memoryStore.set(id, cards[id]);
        return cards[id];
      }
    }
  } catch (e) {
    console.error('Error reading card from local file:', e);
  }

  // 5. Check sample profiles
  const sample = SAMPLE_PROFILES.find((p) => p.id === id);
  if (sample) {
    memoryStore.set(id, sample);
    return sample;
  }

  return null;
}

/**
 * Save card to Supabase ('cards' table and 'app_settings'), memory, and local filesystem
 */
export async function saveCard(card: ContactProfile): Promise<ContactProfile> {
  // Update memory
  memoryStore.set(card.id, card);

  // 1. Save to Supabase 'app_settings' table (guaranteed table)
  try {
    await supabaseAdmin.from('app_settings').upsert({
      key: `qr_card_${card.id}`,
      value: JSON.stringify(card),
      updated_at: new Date().toISOString(),
    });
  } catch (err) {
    console.error('Failed to save card to Supabase app_settings:', err);
  }

  // 2. Also attempt to save to dedicated 'cards' table in Supabase
  try {
    await supabaseAdmin.from('cards').upsert({
      id: card.id,
      card_name: card.cardName,
      first_name: card.firstName,
      last_name: card.lastName,
      prefix: card.prefix || null,
      title: card.title || null,
      company: card.company || null,
      department: card.department || null,
      headline: card.headline || null,
      phone: card.phone || null,
      work_phone: card.workPhone || null,
      whatsapp: card.whatsapp || null,
      email: card.email || null,
      work_email: card.workEmail || null,
      website: card.website || null,
      linkedin: card.linkedin || null,
      twitter: card.twitter || null,
      instagram: card.instagram || null,
      github: card.github || null,
      youtube: card.youtube || null,
      calendly: card.calendly || null,
      telegram: card.telegram || null,
      address: card.address || null,
      city: card.city || null,
      state: card.state || null,
      country: card.country || null,
      postal_code: card.postalCode || null,
      note: card.note || null,
      avatar_url: card.avatarUrl || null,
      theme_color: card.themeColor || '#6366f1',
      qr_foreground: card.qrForeground || '#0f172a',
      qr_background: card.qrBackground || '#ffffff',
      qr_mode: card.qrMode || 'vcard',
      qr_center_icon: card.qrCenterIcon || 'phone',
      raw_data: card,
      updated_at: new Date().toISOString(),
    });
  } catch {
    // If cards table doesn't exist yet, app_settings already secured it
  }

  // 3. Persist to local filesystem as backup
  ensureDataFile();
  try {
    let cards: Record<string, ContactProfile> = {};
    if (fs.existsSync(DATA_FILE)) {
      try {
        cards = JSON.parse(fs.readFileSync(DATA_FILE, 'utf-8'));
      } catch {
        cards = {};
      }
    }
    cards[card.id] = card;
    fs.writeFileSync(DATA_FILE, JSON.stringify(cards, null, 2), 'utf-8');
  } catch (e) {
    console.error('Error saving card to local file:', e);
  }

  return card;
}

/**
 * Get all cards merged from Supabase and local cache
 */
export async function getAllCards(): Promise<ContactProfile[]> {
  const map = new Map<string, ContactProfile>();

  // Initialize with samples
  SAMPLE_PROFILES.forEach((p) => map.set(p.id, p));

  // Load from local file
  ensureDataFile();
  try {
    if (fs.existsSync(DATA_FILE)) {
      const content = fs.readFileSync(DATA_FILE, 'utf-8');
      const cards: Record<string, ContactProfile> = JSON.parse(content);
      Object.values(cards).forEach((c) => map.set(c.id, c));
    }
  } catch {
    // ignore
  }

  // Load from Supabase 'cards' table
  try {
    const { data, error } = await supabaseAdmin.from('cards').select('*');
    if (!error && data) {
      data.forEach((row: any) => {
        const card: ContactProfile = row.raw_data || {
          id: row.id,
          cardName: row.card_name,
          firstName: row.first_name,
          lastName: row.last_name,
          prefix: row.prefix,
          title: row.title,
          company: row.company,
          phone: row.phone,
          email: row.email,
          themeColor: row.theme_color || '#6366f1',
          qrForeground: row.qr_foreground || '#0f172a',
          qrBackground: row.qr_background || '#ffffff',
          qrMode: row.qr_mode || 'vcard',
          qrCenterIcon: row.qr_center_icon || 'phone',
          createdAt: row.created_at ? new Date(row.created_at).getTime() : Date.now(),
          updatedAt: row.updated_at ? new Date(row.updated_at).getTime() : Date.now(),
        };
        map.set(card.id, card);
      });
    }
  } catch {
    // ignore
  }

  // Load from Supabase 'app_settings'
  try {
    const { data: settings, error: sErr } = await supabaseAdmin
      .from('app_settings')
      .select('key, value')
      .like('key', 'qr_card_%');

    if (!sErr && settings) {
      settings.forEach((item) => {
        try {
          const card: ContactProfile = JSON.parse(item.value);
          map.set(card.id, card);
        } catch {
          // ignore corrupted json
        }
      });
    }
  } catch {
    // ignore
  }

  // Also include in-memory
  memoryStore.forEach((c) => map.set(c.id, c));

  return Array.from(map.values());
}
