export interface ContactProfile {
  id: string;
  cardName: string;
  firstName: string;
  lastName: string;
  prefix?: string;
  title: string;
  company: string;
  department?: string;
  headline?: string;
  phone: string; // Primary mobile number (saved to phone)
  workPhone?: string;
  whatsapp?: string;
  email: string;
  workEmail?: string;
  website?: string;
  linkedin?: string;
  twitter?: string;
  instagram?: string;
  github?: string;
  youtube?: string;
  calendly?: string;
  telegram?: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  postalCode?: string;
  note?: string;
  avatarUrl?: string;
  themeColor: string;
  qrForeground: string;
  qrBackground: string;
  qrMode: 'vcard' | 'landing'; // vcard = direct camera scan save; landing = digital card page
  qrCenterIcon: 'phone' | 'contact' | 'custom' | 'none';
  createdAt: number;
  updatedAt: number;
}

export type ProfileFormData = Omit<ContactProfile, 'id' | 'createdAt' | 'updatedAt'>;
