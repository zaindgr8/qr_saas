import { ContactProfile } from '@/types/contact';

/**
 * Escapes characters for vCard standard compliance
 */
function escapeVCardValue(value?: string): string {
  if (!value) return '';
  return value
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\n/g, '\\n');
}

/**
 * Formats social URL to complete address
 */
function cleanUrl(url?: string, defaultPrefix = 'https://'): string {
  if (!url) return '';
  const trimmed = url.trim();
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    return trimmed;
  }
  return `${defaultPrefix}${trimmed}`;
}

/**
 * Generates an RFC-compliant vCard 3.0 text payload
 * Optimized for native iOS Camera "Add to Contacts" and Android Google Contacts auto-detection
 */
export function generateVCard(profile: Partial<ContactProfile>): string {
  const firstName = profile.firstName || '';
  const lastName = profile.lastName || '';
  const prefix = profile.prefix || '';
  const fullName = [prefix, firstName, lastName].filter(Boolean).join(' ') || 'Contact';

  const lines: string[] = [
    'BEGIN:VCARD',
    'VERSION:3.0',
    `N:${escapeVCardValue(lastName)};${escapeVCardValue(firstName)};;${escapeVCardValue(prefix)};`,
    `FN:${escapeVCardValue(fullName)}`,
  ];

  if (profile.company || profile.department) {
    const org = [profile.company || '', profile.department || ''].filter(Boolean).join(';');
    lines.push(`ORG:${escapeVCardValue(org)}`);
  }

  if (profile.title) {
    lines.push(`TITLE:${escapeVCardValue(profile.title)}`);
  }

  // Primary Mobile Phone - This is what gets saved to phone contacts
  if (profile.phone) {
    // Standard cell phone representation
    const cleanPhone = profile.phone.replace(/[^\d+]/g, '');
    lines.push(`TEL;TYPE=CELL,VOICE:${cleanPhone || profile.phone}`);
  }

  // Work Phone
  if (profile.workPhone) {
    const cleanWorkPhone = profile.workPhone.replace(/[^\d+]/g, '');
    lines.push(`TEL;TYPE=WORK,VOICE:${cleanWorkPhone || profile.workPhone}`);
  }

  // WhatsApp
  if (profile.whatsapp) {
    const cleanWa = profile.whatsapp.replace(/[^\d+]/g, '');
    lines.push(`TEL;TYPE=OTHER,MSG:${cleanWa || profile.whatsapp}`);
  }

  // Primary Email
  if (profile.email) {
    lines.push(`EMAIL;TYPE=HOME,INTERNET:${escapeVCardValue(profile.email.trim())}`);
  }

  // Work Email
  if (profile.workEmail) {
    lines.push(`EMAIL;TYPE=WORK,INTERNET:${escapeVCardValue(profile.workEmail.trim())}`);
  }

  // Website
  if (profile.website) {
    lines.push(`URL;TYPE=WORK:${cleanUrl(profile.website)}`);
  }

  // Social profiles (supported by iOS Contacts and modern Android contacts)
  if (profile.linkedin) {
    const url = profile.linkedin.includes('linkedin.com')
      ? cleanUrl(profile.linkedin)
      : `https://www.linkedin.com/in/${profile.linkedin.replace(/^@/, '')}`;
    lines.push(`X-SOCIALPROFILE;TYPE=linkedin:${url}`);
    lines.push(`URL;TYPE=LinkedIn:${url}`);
  }

  if (profile.twitter) {
    const handle = profile.twitter.replace(/^@/, '').replace('https://twitter.com/', '').replace('https://x.com/', '');
    const url = `https://x.com/${handle}`;
    lines.push(`X-SOCIALPROFILE;TYPE=twitter:${url}`);
  }

  if (profile.instagram) {
    const handle = profile.instagram.replace(/^@/, '').replace('https://instagram.com/', '');
    const url = `https://instagram.com/${handle}`;
    lines.push(`X-SOCIALPROFILE;TYPE=instagram:${url}`);
  }

  if (profile.github) {
    const handle = profile.github.replace(/^@/, '').replace('https://github.com/', '');
    const url = `https://github.com/${handle}`;
    lines.push(`X-SOCIALPROFILE;TYPE=github:${url}`);
  }

  if (profile.telegram) {
    const handle = profile.telegram.replace(/^@/, '').replace('https://t.me/', '');
    const url = `https://t.me/${handle}`;
    lines.push(`X-SOCIALPROFILE;TYPE=telegram:${url}`);
  }

  if (profile.calendly) {
    const url = cleanUrl(profile.calendly);
    lines.push(`URL;TYPE=Calendly:${url}`);
  }

  // Address
  if (profile.address || profile.city || profile.country) {
    const adr = `;;${escapeVCardValue(profile.address || '')};${escapeVCardValue(profile.city || '')};${escapeVCardValue(profile.state || '')};${escapeVCardValue(profile.postalCode || '')};${escapeVCardValue(profile.country || '')}`;
    lines.push(`ADR;TYPE=WORK:${adr}`);
  }

  // Note
  const notes: string[] = [];
  if (profile.headline) notes.push(profile.headline);
  if (profile.note) notes.push(profile.note);
  notes.push('Powered by AI Founder Hub (aifounderhub.com)');
  lines.push(`NOTE:${escapeVCardValue(notes.join(' | '))}`);

  // Base64 Photo if provided (small avatar)
  if (profile.avatarUrl && profile.avatarUrl.startsWith('data:image/')) {
    const parts = profile.avatarUrl.split(';base64,');
    if (parts.length === 2) {
      const type = parts[0].includes('png') ? 'PNG' : 'JPEG';
      // Truncate/limit huge photos to prevent QR overflow if in direct mode
      if (parts[1].length < 1500) {
        lines.push(`PHOTO;ENCODING=b;TYPE=${type}:${parts[1]}`);
      }
    }
  }

  lines.push('END:VCARD');
  return lines.join('\r\n');
}

/**
 * Creates a browser downloadable blob and triggers download
 */
export function downloadVCardFile(profile: Partial<ContactProfile>, filename?: string): void {
  if (typeof window === 'undefined') return;
  const vcard = generateVCard(profile);
  const blob = new Blob([vcard], { type: 'text/vcard;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  
  const nameSlug = [profile.firstName, profile.lastName].filter(Boolean).join('_') || 'contact';
  link.href = url;
  link.download = filename || `${nameSlug}.vcf`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}
