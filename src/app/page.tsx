'use client';

import React, { useState, useEffect, useRef } from 'react';
import { ContactProfile } from '@/types/contact';
import { SAMPLE_PROFILES, DEFAULT_NEW_PROFILE } from '@/lib/templates';
import { generateVCard, downloadVCardFile } from '@/lib/vcard';
import { generateQRDataUrl, generateQRSvg } from '@/lib/qr';
import { TwitterIcon, LinkedInIcon, InstagramIcon, GithubIcon, WhatsAppIcon } from '@/components/icons';
import confetti from 'canvas-confetti';
import {
  QrCode,
  Smartphone,
  User,
  Phone,
  Mail,
  Globe,
  Calendar,
  Send,
  Building,
  Briefcase,
  MapPin,
  Sparkles,
  Download,
  Copy,
  Check,
  Printer,
  ExternalLink,
  Eye,
  Info,
  CheckCircle2,
  RefreshCw,
  PlusCircle,
  FolderOpen,
  Zap
} from 'lucide-react';

const AVATAR_PRESETS = [
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=400&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=400&auto=format&fit=crop&q=80',
];

// AI Founder Hub Curated Palette
const THEME_COLORS = [
  '#ccf244', // AI Founder Hub Signature Electric Lime
  '#b5a1ff', // Cyber Lavender
  '#38bdf8', // Cyber Cyan
  '#22c55e', // Emerald
  '#febc2e', // Warm Gold
  '#f43f5e', // Neon Rose
  '#ffffff', // Pure White
];

export default function SaaSStudioPage() {
  const [profiles, setProfiles] = useState<ContactProfile[]>(SAMPLE_PROFILES);
  const [currentProfile, setCurrentProfile] = useState<ContactProfile>(SAMPLE_PROFILES[0]);
  const [activeTab, setActiveTab] = useState<'details' | 'reach' | 'social' | 'styling' | 'saved'>('details');
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [phoneViewMode, setPhoneViewMode] = useState<'ios-contact' | 'web-card'>('ios-contact');
  const [showTestModal, setShowTestModal] = useState(false);
  const [showPrintModal, setShowPrintModal] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const qrRef = useRef<HTMLDivElement>(null);

  // Sync profile to server database so dynamic URLs work seamlessly
  const persistToServer = async (profileToSave: ContactProfile) => {
    try {
      await fetch('/api/cards', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(profileToSave),
      });
    } catch (e) {
      console.error('Failed to sync to server storage:', e);
    }
  };

  // Fetch cards saved in Supabase on mount
  useEffect(() => {
    async function loadSavedCards() {
      try {
        const res = await fetch('/api/cards');
        if (res.ok) {
          const data = await res.json();
          if (data.cards && data.cards.length > 0) {
            setProfiles(data.cards);
          }
        }
      } catch (err) {
        console.error('Failed to fetch cards from Supabase:', err);
      }
    }
    loadSavedCards();
  }, []);

  // Re-generate QR code whenever relevant profile fields update
  useEffect(() => {
    let active = true;

    async function updateQR() {
      if (!currentProfile) return;

      let qrPayload = '';
      if (currentProfile.qrMode === 'vcard') {
        qrPayload = generateVCard(currentProfile);
      } else {
        const origin = typeof window !== 'undefined' ? window.location.origin : 'https://aifounderhub.com';
        qrPayload = `${origin}/c/${currentProfile.id}`;
      }

      try {
        const url = await generateQRDataUrl(qrPayload, {
          foreground: currentProfile.qrForeground || '#07070b',
          background: currentProfile.qrBackground || '#ffffff',
          width: 600,
          centerIcon: currentProfile.qrCenterIcon,
        });

        if (active) {
          setQrDataUrl(url);
        }
      } catch (err) {
        console.error('Error generating QR code:', err);
      }
    }

    const timer = setTimeout(() => {
      updateQR();
    }, 150);

    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [currentProfile]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleFieldChange = (field: keyof ContactProfile, value: string) => {
    setCurrentProfile((prev) => ({
      ...prev,
      [field]: value,
      updatedAt: Date.now(),
    }));
  };

  const handleSelectTemplate = (template: ContactProfile) => {
    setCurrentProfile({
      ...template,
      id: template.id || `card-${Date.now()}`,
    });
    persistToServer(template);
    showToast(`Loaded ${template.cardName} template!`);
  };

  const handleCreateNew = () => {
    const newId = `card-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const newCard: ContactProfile = {
      ...DEFAULT_NEW_PROFILE,
      id: newId,
      cardName: 'Untitled Founder Card',
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    setCurrentProfile(newCard);
    setProfiles((prev) => [newCard, ...prev]);
    setActiveTab('details');
    showToast('Created new contact profile! Fill in your details.');
  };

  const handleSaveProfile = async () => {
    setIsSaving(true);
    try {
      await persistToServer(currentProfile);
      setProfiles((prev) => {
        const idx = prev.findIndex((p) => p.id === currentProfile.id);
        if (idx >= 0) {
          const next = [...prev];
          next[idx] = currentProfile;
          return next;
        }
        return [currentProfile, ...prev];
      });

      confetti({
        particleCount: 90,
        spread: 80,
        colors: ['#ccf244', '#b5a1ff', '#ffffff', '#22c55e'],
        origin: { y: 0.6 },
      });

      showToast('Contact card & QR saved to Supabase successfully!');
    } catch {
      showToast('Card saved locally');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDownloadQR = (format: 'png' | 'svg') => {
    if (format === 'png' && qrDataUrl) {
      const link = document.createElement('a');
      const filename = [currentProfile.firstName, currentProfile.lastName].filter(Boolean).join('_') || 'contact';
      link.href = qrDataUrl;
      link.download = `${filename}_aifounderhub_qr.png`;
      link.click();
      showToast('QR Code (PNG) downloaded!');
    } else if (format === 'svg') {
      const payload = currentProfile.qrMode === 'vcard' 
        ? generateVCard(currentProfile) 
        : `${window.location.origin}/c/${currentProfile.id}`;
      
      generateQRSvg(payload, {
        foreground: currentProfile.qrForeground,
        background: currentProfile.qrBackground,
      }).then((svgString) => {
        const blob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        const filename = [currentProfile.firstName, currentProfile.lastName].filter(Boolean).join('_') || 'contact';
        link.href = url;
        link.download = `${filename}_aifounderhub_qr.svg`;
        link.click();
        URL.revokeObjectURL(url);
        showToast('Vector QR Code (SVG) downloaded!');
      });
    }
  };

  const handleDownloadVCF = () => {
    downloadVCardFile(currentProfile);
    showToast('Downloaded .vcf file!');
  };

  const handleCopyLink = () => {
    const url = `${window.location.origin}/c/${currentProfile.id}`;
    navigator.clipboard.writeText(url);
    showToast('Public card URL copied to clipboard!');
  };

  const fullName = [currentProfile.prefix, currentProfile.firstName, currentProfile.lastName].filter(Boolean).join(' ') || 'Your Name';

  return (
    <div className="saas-app-root">
      {/* Ambient background glow */}
      <div 
        className="ambient-glow" 
        style={{ background: `radial-gradient(circle, ${currentProfile.themeColor || '#ccf244'}20 0%, rgba(7,7,11,0) 70%)` }} 
      />

      {/* TOP AI FOUNDER HUB NAVIGATION */}
      <header className="app-header">
        <div className="header-container">
          <div className="brand-wrapper">
            <div className="brand-icon-box">
              {/* AI Founder Hub Lightning Bolt Logo */}
              <svg viewBox="0 0 24 24" fill="#07070b" width="22" height="22">
                <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
              </svg>
            </div>
            <div>
              <div className="brand-title">
                AI Founder Hub <span className="brand-badge">QR Studio</span>
              </div>
              <div className="brand-subtitle">
                Powered by{' '}
                <a 
                  href="https://aifounderhub.com" 
                  target="_blank" 
                  rel="noreferrer" 
                  className="brand-link-hub"
                >
                  AI Founder Hub ↗
                </a>
              </div>
            </div>
          </div>

          <div className="header-right-actions">
            <div className="header-pill-badge">
              <span className="pulse-dot"></span>
              <span>1-Scan Mobile Auto-Save Active</span>
            </div>

            <button 
              onClick={() => setShowTestModal(true)} 
              className="btn-secondary-action"
              title="How mobile scanning auto-saves contact"
            >
              <Info size={16} /> How It Saves
            </button>
          </div>
        </div>
      </header>

      {/* MAIN STUDIO GRID */}
      <div className="studio-container">
        {/* ========================================================
            LEFT COLUMN: FORM BUILDER & CUSTOMIZATION
           ======================================================== */}
        <section className="studio-card">
          <div className="section-top-bar">
            <h1 className="panel-title">
              <Zap size={22} fill="#ccf244" color="#ccf244" /> AI Founder Contact &amp; QR Studio
            </h1>

            {/* Template Quick Presets */}
            <div className="template-selector-wrap">
              <span style={{ color: 'var(--text-muted)', fontSize: '0.78rem' }}>Presets:</span>
              {SAMPLE_PROFILES.map((tpl) => (
                <button
                  key={tpl.id}
                  onClick={() => handleSelectTemplate(tpl)}
                  className={`template-btn ${currentProfile.id === tpl.id ? 'active' : ''}`}
                >
                  {tpl.firstName}
                </button>
              ))}
              <button onClick={handleCreateNew} className="template-btn" title="Start empty card">
                <PlusCircle size={14} /> New
              </button>
            </div>
          </div>

          {/* STUDIO NAVIGATION TABS */}
          <nav className="tabs-nav" aria-label="Studio Configuration Tabs">
            <button
              onClick={() => setActiveTab('details')}
              className={`tab-btn ${activeTab === 'details' ? 'active' : ''}`}
            >
              <User size={16} /> Identity &amp; Role
            </button>
            <button
              onClick={() => setActiveTab('reach')}
              className={`tab-btn ${activeTab === 'reach' ? 'active' : ''}`}
            >
              <Phone size={16} /> Phone &amp; Reach
            </button>
            <button
              onClick={() => setActiveTab('social')}
              className={`tab-btn ${activeTab === 'social' ? 'active' : ''}`}
            >
              <Globe size={16} /> Social &amp; Links
            </button>
            <button
              onClick={() => setActiveTab('styling')}
              className={`tab-btn ${activeTab === 'styling' ? 'active' : ''}`}
            >
              <Sparkles size={16} /> QR Mode &amp; Style
            </button>
            <button
              onClick={() => setActiveTab('saved')}
              className={`tab-btn ${activeTab === 'saved' ? 'active' : ''}`}
            >
              <FolderOpen size={16} /> Profiles ({profiles.length})
            </button>
          </nav>

          {/* TAB 1: IDENTITY & ROLE */}
          {activeTab === 'details' && (
            <div className="form-grid">
              <div className="form-group">
                <label className="form-label" htmlFor="first-name">First Name *</label>
                <div className="input-icon-wrap">
                  <input
                    id="first-name"
                    type="text"
                    className="text-input no-icon"
                    placeholder="e.g. Alex"
                    value={currentProfile.firstName}
                    onChange={(e) => handleFieldChange('firstName', e.target.value)}
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="last-name">Last Name *</label>
                <div className="input-icon-wrap">
                  <input
                    id="last-name"
                    type="text"
                    className="text-input no-icon"
                    placeholder="e.g. Rivers"
                    value={currentProfile.lastName}
                    onChange={(e) => handleFieldChange('lastName', e.target.value)}
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="prefix">Prefix / Title Honorific</label>
                <div className="input-icon-wrap">
                  <input
                    id="prefix"
                    type="text"
                    className="text-input no-icon"
                    placeholder="e.g. Dr. / Founder / Eng."
                    value={currentProfile.prefix || ''}
                    onChange={(e) => handleFieldChange('prefix', e.target.value)}
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="job-title">Job Title / Role</label>
                <div className="input-icon-wrap">
                  <input
                    id="job-title"
                    type="text"
                    className="text-input"
                    placeholder="e.g. Founder & AI Systems Lead"
                    value={currentProfile.title}
                    onChange={(e) => handleFieldChange('title', e.target.value)}
                  />
                  <Briefcase size={16} className="field-icon" />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="company">Company / Agency</label>
                <div className="input-icon-wrap">
                  <input
                    id="company"
                    type="text"
                    className="text-input"
                    placeholder="e.g. AI Founder Hub / Acme AI"
                    value={currentProfile.company}
                    onChange={(e) => handleFieldChange('company', e.target.value)}
                  />
                  <Building size={16} className="field-icon" />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="department">Department / Track</label>
                <div className="input-icon-wrap">
                  <input
                    id="department"
                    type="text"
                    className="text-input no-icon"
                    placeholder="e.g. AAA Accelerator / Voice AI"
                    value={currentProfile.department || ''}
                    onChange={(e) => handleFieldChange('department', e.target.value)}
                  />
                </div>
              </div>

              <div className="form-group form-full">
                <label className="form-label" htmlFor="headline">Headline / Bio</label>
                <textarea
                  id="headline"
                  className="text-textarea"
                  rows={2}
                  placeholder="e.g. Building and deploying autonomous AI lead management systems and voice agents ⚡️"
                  value={currentProfile.headline || ''}
                  onChange={(e) => handleFieldChange('headline', e.target.value)}
                />
              </div>

              {/* Avatar Preset Picker */}
              <div className="form-group form-full">
                <label className="form-label">
                  Profile Photo / Avatar
                  <span className="label-tag">Click to Select</span>
                </label>
                <div className="avatar-selection-row">
                  {AVATAR_PRESETS.map((preset, index) => (
                    <button
                      key={index}
                      type="button"
                      onClick={() => handleFieldChange('avatarUrl', preset)}
                      className={`avatar-choice-btn ${currentProfile.avatarUrl === preset ? 'selected' : ''}`}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={preset} alt={`Avatar option ${index + 1}`} />
                    </button>
                  ))}
                  <div className="input-icon-wrap" style={{ flex: 1, minWidth: '220px' }}>
                    <input
                      type="text"
                      className="text-input no-icon"
                      placeholder="Or paste custom image URL..."
                      value={currentProfile.avatarUrl || ''}
                      onChange={(e) => handleFieldChange('avatarUrl', e.target.value)}
                      style={{ fontSize: '0.82rem' }}
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: PHONE & REACH */}
          {activeTab === 'reach' && (
            <div className="form-grid">
              <div className="form-group form-full">
                <div style={{
                  background: 'rgba(204, 242, 68, 0.08)',
                  border: '1px solid rgba(204, 242, 68, 0.25)',
                  borderRadius: 'var(--radius-md)',
                  padding: '0.85rem 1rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem',
                  marginBottom: '0.5rem'
                }}>
                  <Phone size={22} style={{ color: '#ccf244', flexShrink: 0 }} />
                  <div>
                    <strong style={{ color: '#ccf244', fontSize: '0.88rem' }}>Primary Mobile Phone Number</strong>
                    <p style={{ color: '#a1a1aa', fontSize: '0.78rem' }}>
                      This is the target number that automatically gets saved into the phone contacts when the QR code is scanned.
                    </p>
                  </div>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="phone">
                  Primary Mobile Phone *
                  <span className="label-tag">Auto-Saved Target</span>
                </label>
                <div className="input-icon-wrap">
                  <input
                    id="phone"
                    type="tel"
                    className="text-input"
                    placeholder="+1 (555) 349-8201"
                    value={currentProfile.phone}
                    onChange={(e) => handleFieldChange('phone', e.target.value)}
                  />
                  <Phone size={16} className="field-icon" />
                </div>
                <span className="form-tip">Include country code (+1, +971, +44, etc.)</span>
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="work-phone">Work / Office Phone</label>
                <div className="input-icon-wrap">
                  <input
                    id="work-phone"
                    type="tel"
                    className="text-input"
                    placeholder="+971 4 399 2200"
                    value={currentProfile.workPhone || ''}
                    onChange={(e) => handleFieldChange('workPhone', e.target.value)}
                  />
                  <Briefcase size={16} className="field-icon" />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="whatsapp">WhatsApp Direct Number</label>
                <div className="input-icon-wrap">
                  <input
                    id="whatsapp"
                    type="tel"
                    className="text-input"
                    placeholder="+15553498201 (no spaces)"
                    value={currentProfile.whatsapp || ''}
                    onChange={(e) => handleFieldChange('whatsapp', e.target.value)}
                  />
                  <div className="field-icon" style={{ display: 'flex', alignItems: 'center' }}>
                    <WhatsAppIcon size={16} />
                  </div>
                </div>
                <span className="form-tip">Used for 1-click WhatsApp messaging</span>
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="email">Personal / Primary Email *</label>
                <div className="input-icon-wrap">
                  <input
                    id="email"
                    type="email"
                    className="text-input"
                    placeholder="alex@aifounderhub.com"
                    value={currentProfile.email}
                    onChange={(e) => handleFieldChange('email', e.target.value)}
                  />
                  <Mail size={16} className="field-icon" />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="work-email">Work Email</label>
                <div className="input-icon-wrap">
                  <input
                    id="work-email"
                    type="email"
                    className="text-input"
                    placeholder="founders@aifounderhub.com"
                    value={currentProfile.workEmail || ''}
                    onChange={(e) => handleFieldChange('workEmail', e.target.value)}
                  />
                  <Building size={16} className="field-icon" />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="city">City &amp; Country</label>
                <div className="input-icon-wrap">
                  <input
                    id="city"
                    type="text"
                    className="text-input"
                    placeholder="Dubai, UAE"
                    value={[currentProfile.city, currentProfile.country].filter(Boolean).join(', ')}
                    onChange={(e) => {
                      const parts = e.target.value.split(',');
                      handleFieldChange('city', parts[0]?.trim() || '');
                      handleFieldChange('country', parts[1]?.trim() || '');
                    }}
                  />
                  <MapPin size={16} className="field-icon" />
                </div>
              </div>

              <div className="form-group form-full">
                <label className="form-label" htmlFor="note">Custom Note (Saved in Phone Contact)</label>
                <textarea
                  id="note"
                  className="text-textarea"
                  rows={2}
                  placeholder="e.g. Connected via AI Founder Hub (aifounderhub.com). Reach out regarding AI agency builds and partnerships."
                  value={currentProfile.note || ''}
                  onChange={(e) => handleFieldChange('note', e.target.value)}
                />
              </div>
            </div>
          )}

          {/* TAB 3: SOCIAL & LINKS */}
          {activeTab === 'social' && (
            <div className="form-grid">
              <div className="form-group">
                <label className="form-label" htmlFor="linkedin">
                  LinkedIn Profile
                  <span className="label-tag">Essential</span>
                </label>
                <div className="input-icon-wrap">
                  <input
                    id="linkedin"
                    type="text"
                    className="text-input"
                    placeholder="username or full linkedin.com/in/... URL"
                    value={currentProfile.linkedin || ''}
                    onChange={(e) => handleFieldChange('linkedin', e.target.value)}
                  />
                  <div className="field-icon" style={{ display: 'flex', alignItems: 'center' }}>
                    <LinkedInIcon size={16} />
                  </div>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="website">Website / AI Agency</label>
                <div className="input-icon-wrap">
                  <input
                    id="website"
                    type="text"
                    className="text-input"
                    placeholder="https://aifounderhub.com"
                    value={currentProfile.website || ''}
                    onChange={(e) => handleFieldChange('website', e.target.value)}
                  />
                  <Globe size={16} className="field-icon" />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="twitter">X / Twitter</label>
                <div className="input-icon-wrap">
                  <input
                    id="twitter"
                    type="text"
                    className="text-input"
                    placeholder="@handle or full link"
                    value={currentProfile.twitter || ''}
                    onChange={(e) => handleFieldChange('twitter', e.target.value)}
                  />
                  <div className="field-icon" style={{ display: 'flex', alignItems: 'center' }}>
                    <TwitterIcon size={16} />
                  </div>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="instagram">Instagram</label>
                <div className="input-icon-wrap">
                  <input
                    id="instagram"
                    type="text"
                    className="text-input"
                    placeholder="@handle"
                    value={currentProfile.instagram || ''}
                    onChange={(e) => handleFieldChange('instagram', e.target.value)}
                  />
                  <div className="field-icon" style={{ display: 'flex', alignItems: 'center' }}>
                    <InstagramIcon size={16} />
                  </div>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="github">GitHub</label>
                <div className="input-icon-wrap">
                  <input
                    id="github"
                    type="text"
                    className="text-input"
                    placeholder="github-username"
                    value={currentProfile.github || ''}
                    onChange={(e) => handleFieldChange('github', e.target.value)}
                  />
                  <div className="field-icon" style={{ display: 'flex', alignItems: 'center' }}>
                    <GithubIcon size={16} />
                  </div>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="calendly">Calendly / Booking Link</label>
                <div className="input-icon-wrap">
                  <input
                    id="calendly"
                    type="text"
                    className="text-input"
                    placeholder="https://calendly.com/your-name"
                    value={currentProfile.calendly || ''}
                    onChange={(e) => handleFieldChange('calendly', e.target.value)}
                  />
                  <Calendar size={16} className="field-icon" />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="telegram">Telegram</label>
                <div className="input-icon-wrap">
                  <input
                    id="telegram"
                    type="text"
                    className="text-input"
                    placeholder="@telegram_username"
                    value={currentProfile.telegram || ''}
                    onChange={(e) => handleFieldChange('telegram', e.target.value)}
                  />
                  <Send size={16} className="field-icon" />
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: QR MODE & STYLING */}
          {activeTab === 'styling' && (
            <div className="form-grid single-col">
              {/* QR SCAN BEHAVIOR MODE */}
              <div className="form-group">
                <label className="form-label">
                  Scanning Action Mode
                  <span className="label-tag">Essential</span>
                </label>
                <div className="qr-mode-options">
                  <button
                    type="button"
                    onClick={() => handleFieldChange('qrMode', 'vcard')}
                    className={`mode-option-btn ${currentProfile.qrMode === 'vcard' ? 'selected' : ''}`}
                  >
                    <div className="mode-icon-box">
                      <Smartphone size={20} />
                    </div>
                    <div>
                      <div className="mode-title">Direct Camera Auto-Save (Offline)</div>
                      <div className="mode-desc">
                        Standard vCard 3.0. When an iPhone camera or Android Google Lens scans it, it instantly opens native <strong>&quot;Add to Contacts&quot;</strong> with phone number, email &amp; social profiles! Works 100% offline.
                      </div>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleFieldChange('qrMode', 'landing')}
                    className={`mode-option-btn ${currentProfile.qrMode === 'landing' ? 'selected' : ''}`}
                  >
                    <div className="mode-icon-box">
                      <Globe size={20} />
                    </div>
                    <div>
                      <div className="mode-title">Smart Digital Profile Page (Online)</div>
                      <div className="mode-desc">
                        Opens a sleek mobile web card with your avatar, quick call/WhatsApp buttons, social badges, and a prominent <strong>&quot;1-Tap Save to Contacts&quot;</strong> button.
                      </div>
                    </div>
                  </button>
                </div>
              </div>

              {/* THEME COLOR */}
              <div className="form-group">
                <label className="form-label">Digital Card Accent Color (AI Founder Hub Palette)</label>
                <div className="swatches-row">
                  {THEME_COLORS.map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => handleFieldChange('themeColor', c)}
                      className={`swatch-btn ${currentProfile.themeColor === c ? 'selected' : ''}`}
                      style={{ background: c }}
                      title={c}
                    />
                  ))}
                  <input
                    type="color"
                    value={currentProfile.themeColor || '#ccf244'}
                    onChange={(e) => handleFieldChange('themeColor', e.target.value)}
                    style={{ width: '32px', height: '32px', border: 'none', background: 'none', cursor: 'pointer' }}
                    title="Custom color"
                  />
                </div>
              </div>

              {/* QR CODE FOREGROUND COLOR */}
              <div className="form-group">
                <label className="form-label">QR Code Foreground Color</label>
                <div className="swatches-row">
                  {['#07070b', '#141420', '#1e1e2a', '#2a2a38', '#0369a1', '#71930b'].map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => handleFieldChange('qrForeground', c)}
                      className={`swatch-btn ${currentProfile.qrForeground === c ? 'selected' : ''}`}
                      style={{ background: c }}
                      title={c}
                    />
                  ))}
                  <input
                    type="color"
                    value={currentProfile.qrForeground || '#07070b'}
                    onChange={(e) => handleFieldChange('qrForeground', e.target.value)}
                    style={{ width: '32px', height: '32px', border: 'none', background: 'none', cursor: 'pointer' }}
                    title="Custom QR color"
                  />
                </div>
              </div>

              {/* CENTER ICON BADGE */}
              <div className="form-group">
                <label className="form-label">QR Center Badge Icon</label>
                <div className="swatches-row">
                  <button
                    type="button"
                    onClick={() => handleFieldChange('qrCenterIcon', 'phone')}
                    className={`template-btn ${currentProfile.qrCenterIcon === 'phone' ? 'active' : ''}`}
                  >
                    <Phone size={14} /> Telephone Handset (Recommended)
                  </button>
                  <button
                    type="button"
                    onClick={() => handleFieldChange('qrCenterIcon', 'none')}
                    className={`template-btn ${currentProfile.qrCenterIcon === 'none' ? 'active' : ''}`}
                  >
                    Pure QR (No Icon)
                  </button>
                </div>
                <span className="form-tip">The center phone icon signals to scanners that scanning will save your phone contact.</span>
              </div>
            </div>
          )}

          {/* TAB 5: SAVED PROFILES */}
          {activeTab === 'saved' && (
            <div className="form-grid single-col">
              <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                All generated QR contact cards are synced with your Supabase database.
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                {profiles.map((p) => (
                  <div
                    key={p.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '0.85rem 1rem',
                      background: p.id === currentProfile.id ? 'rgba(204, 242, 68, 0.12)' : 'var(--bg-surface-elevated)',
                      border: `1px solid ${p.id === currentProfile.id ? '#ccf244' : 'var(--border-subtle)'}`,
                      borderRadius: 'var(--radius-md)',
                    }}
                  >
                    <div>
                      <strong style={{ fontSize: '0.92rem', color: p.id === currentProfile.id ? '#ccf244' : '#f4f1e8' }}>
                        {p.cardName || `${p.firstName} ${p.lastName}`}
                      </strong>
                      <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                        {p.phone || 'No phone'} • {p.email || 'No email'} • {p.qrMode === 'vcard' ? 'Direct Camera Save' : 'Smart Web Card'}
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button
                        onClick={() => {
                          setCurrentProfile(p);
                          showToast(`Switched to ${p.cardName}`);
                        }}
                        className="template-btn active"
                      >
                        {p.id === currentProfile.id ? 'Current' : 'Load Card'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* BOTTOM ACTIONS BAR */}
          <div className="studio-footer-bar">
            <div style={{ display: 'flex', gap: '0.65rem', flexWrap: 'wrap' }}>
              <button
                onClick={handleSaveProfile}
                className="btn-primary-action"
                disabled={isSaving}
              >
                <CheckCircle2 size={18} /> {isSaving ? 'Saving to Supabase...' : 'Save & Sync Card'}
              </button>
              <button
                onClick={() => setShowPrintModal(true)}
                className="btn-secondary-action"
              >
                <Printer size={16} /> Print Business Card
              </button>
            </div>

            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button
                onClick={handleDownloadVCF}
                className="btn-secondary-action"
                title="Download raw .vcf file"
              >
                <Download size={15} /> Export .VCF
              </button>
            </div>
          </div>
        </section>

        {/* ========================================================
            RIGHT COLUMN: LIVE QR & PHONE MOCKUP PREVIEW
           ======================================================== */}
        <aside className="preview-sticky-col">
          {/* THE MASTER QR CODE CARD */}
          <div className="qr-master-card" ref={qrRef}>
            <div className="scan-prompt-banner">
              <Zap size={13} fill="#ccf244" />
              <span>
                {currentProfile.qrMode === 'vcard' 
                  ? 'Scan with iPhone or Android Camera to Auto-Save' 
                  : 'Scan to View Smart Profile & 1-Tap Save'}
              </span>
            </div>

            {/* QR CODE CANVAS */}
            <div className="qr-stage">
              {qrDataUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={qrDataUrl} alt={`QR Code for ${fullName}`} />
              ) : (
                <div style={{ color: '#07070b', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <RefreshCw size={18} className="animate-spin" /> Generating QR...
                </div>
              )}
            </div>

            {/* TARGET NUMBER DISPLAY */}
            <div className="qr-target-phone">
              <div className="target-number">
                {currentProfile.phone || '+1 (555) 000-0000'}
              </div>
              <div className="target-badge">
                <Check size={13} style={{ color: '#ccf244' }} />
                <span>Number saved to phone when scanned</span>
              </div>
            </div>

            {/* QUICK ACTIONS TOOLBAR */}
            <div className="qr-toolbar">
              <button 
                onClick={() => handleDownloadQR('png')} 
                className="qr-tool-btn primary"
                title="Download high-resolution PNG image"
              >
                <Download size={16} />
                <span>Download PNG</span>
              </button>

              <button 
                onClick={() => handleDownloadQR('svg')} 
                className="qr-tool-btn"
                title="Download scalable vector SVG for print & banners"
              >
                <QrCode size={16} />
                <span>Vector SVG</span>
              </button>

              <button 
                onClick={handleCopyLink} 
                className="qr-tool-btn"
                title="Copy dynamic link"
              >
                <Copy size={16} />
                <span>Copy Link</span>
              </button>
            </div>
          </div>

          {/* SIMULATED PHONE RECEIVER SCREEN */}
          <div className="phone-mockup-wrap">
            <div className="phone-view-tabs">
              <div className="phone-view-title">
                <Smartphone size={16} /> Recipient Phone Screen
              </div>

              <div className="view-toggle-pills">
                <button
                  onClick={() => setPhoneViewMode('ios-contact')}
                  className={`toggle-pill-btn ${phoneViewMode === 'ios-contact' ? 'active' : ''}`}
                >
                  Native Contacts
                </button>
                <button
                  onClick={() => setPhoneViewMode('web-card')}
                  className={`toggle-pill-btn ${phoneViewMode === 'web-card' ? 'active' : ''}`}
                >
                  Web Profile Card
                </button>
              </div>
            </div>

            {/* VIEW A: Native iOS / Android Contacts App Simulation */}
            {phoneViewMode === 'ios-contact' && (
              <div className="ios-contact-card">
                <div className="ios-contact-avatar">
                  {currentProfile.avatarUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={currentProfile.avatarUrl} alt={fullName} />
                  ) : (
                    <span>{currentProfile.firstName?.[0] || 'A'}{currentProfile.lastName?.[0] || 'I'}</span>
                  )}
                </div>

                <div className="ios-contact-name">{fullName}</div>
                {(currentProfile.title || currentProfile.company) && (
                  <div className="ios-contact-org">
                    {[currentProfile.title, currentProfile.company].filter(Boolean).join(' • ')}
                  </div>
                )}

                <div className="ios-quick-actions">
                  <div className="ios-action-circle">
                    <Phone size={16} />
                    <span>call</span>
                  </div>
                  <div className="ios-action-circle">
                    <Send size={16} />
                    <span>message</span>
                  </div>
                  <div className="ios-action-circle">
                    <Mail size={16} />
                    <span>email</span>
                  </div>
                </div>

                <div className="ios-field-row">
                  <span className="ios-field-label">Mobile (Auto-saved)</span>
                  <span className="ios-field-val">{currentProfile.phone || 'No phone set'}</span>
                </div>

                {currentProfile.email && (
                  <div className="ios-field-row">
                    <span className="ios-field-label">Email</span>
                    <span className="ios-field-val" style={{ fontSize: '0.82rem' }}>{currentProfile.email}</span>
                  </div>
                )}

                {currentProfile.website && (
                  <div className="ios-field-row">
                    <span className="ios-field-label">Website</span>
                    <span className="ios-field-val" style={{ fontSize: '0.82rem' }}>{currentProfile.website}</span>
                  </div>
                )}

                <div className="ios-save-banner">
                  <CheckCircle2 size={15} />
                  <span>Prompted automatically on camera scan!</span>
                </div>
              </div>
            )}

            {/* VIEW B: Interactive Web Profile Card Simulation */}
            {phoneViewMode === 'web-card' && (
              <div style={{
                background: 'var(--bg-surface-elevated)',
                borderRadius: '16px',
                border: '1px solid var(--border-subtle)',
                padding: '1.25rem',
                textAlign: 'center',
                position: 'relative'
              }}>
                <div style={{
                  width: '64px',
                  height: '64px',
                  borderRadius: '50%',
                  margin: '0 auto 0.75rem',
                  overflow: 'hidden',
                  border: `2px solid ${currentProfile.themeColor}`
                }}>
                  {currentProfile.avatarUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={currentProfile.avatarUrl} alt={fullName} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    <div style={{ width: '100%', height: '100%', background: currentProfile.themeColor, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#07070b', fontWeight: 'bold' }}>
                      {currentProfile.firstName?.[0] || 'A'}
                    </div>
                  )}
                </div>

                <h3 style={{ fontSize: '1.1rem', fontWeight: 800 }}>{fullName}</h3>
                <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
                  {[currentProfile.title, currentProfile.company].filter(Boolean).join(' at ')}
                </p>

                <button
                  onClick={() => {
                    window.open(`/c/${currentProfile.id}`, '_blank');
                  }}
                  className="btn-primary-action"
                  style={{ width: '100%', justifyContent: 'center', padding: '0.65rem', fontSize: '0.84rem' }}
                >
                  <Eye size={15} /> Open Live Landing Page
                  <ExternalLink size={13} />
                </button>
              </div>
            )}
          </div>
        </aside>
      </div>

      {/* FOOTER: POWERED BY AI FOUNDER HUB */}
      <footer style={{
        textAlign: 'center',
        padding: '2.5rem 1rem 3rem',
        borderTop: '1px solid var(--border-subtle)',
        marginTop: '2rem',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '0.65rem',
        position: 'relative',
        zIndex: 1
      }}>
        <a 
          href="https://aifounderhub.com" 
          target="_blank" 
          rel="noreferrer" 
          className="powered-by-banner"
        >
          <Zap size={14} fill="#ccf244" />
          <span>POWERED BY AI FOUNDER HUB</span>
          <ExternalLink size={13} />
        </a>
        <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', maxWidth: '500px' }}>
          The community where AI builders are made. Build and sell AI automation systems, voice agents, and lead management engines.
        </p>
        <div style={{ display: 'flex', gap: '1.25rem', fontSize: '0.78rem', color: 'var(--text-subtle)' }}>
          <a href="https://aifounderhub.com" target="_blank" rel="noreferrer" className="footer-link">aifounderhub.com</a>
          <span>•</span>
          <a href="https://aifounderhub.com/#membership" target="_blank" rel="noreferrer" className="footer-link">Courses &amp; Membership</a>
          <span>•</span>
          <a href="https://aifounderhub.com/#bootcamp" target="_blank" rel="noreferrer" className="footer-link">AI Builder Bootcamp</a>
        </div>
      </footer>

      {/* TOAST NOTIFICATION */}
      {toastMessage && (
        <div className="toast-notice">
          <Zap size={18} fill="#ccf244" style={{ color: '#ccf244' }} />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* MODAL 1: HOW IT AUTO-SAVES TO PHONE CONTACTS */}
      {showTestModal && (
        <div className="modal-backdrop" onClick={() => setShowTestModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '520px', textAlign: 'left' }}>
            <h3 className="modal-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Smartphone size={22} style={{ color: '#ccf244' }} />
              How Mobile Phone Auto-Save Works
            </h3>
            <p className="modal-subtitle">
              AI Founder Hub QR uses standard RFC vCard 3.0 protocols that native phone operating systems recognize instantly.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', margin: '1rem 0' }}>
              <div style={{ background: 'var(--bg-surface-elevated)', padding: '0.85rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
                <strong style={{ color: '#ccf244', fontSize: '0.9rem' }}>📱 Apple iOS (iPhone &amp; iPad):</strong>
                <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                  Open the built-in iOS <strong>Camera</strong> app and point it at the QR code. A yellow banner pops up: <em>&quot;Add to Contacts&quot;</em>. Tapping it opens the pre-filled contact card with one-touch <strong>Create New Contact</strong>!
                </p>
              </div>

              <div style={{ background: 'var(--bg-surface-elevated)', padding: '0.85rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
                <strong style={{ color: '#38bdf8', fontSize: '0.9rem' }}>🤖 Android (Google Lens / Samsung Camera):</strong>
                <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                  Point your camera or Google Lens at the QR code. Android recognizes the contact record and displays <em>&quot;Save Contact&quot;</em> or opens Google Contacts directly.
                </p>
              </div>

              <div style={{ background: 'var(--bg-surface-elevated)', padding: '0.85rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
                <strong style={{ color: '#b5a1ff', fontSize: '0.9rem' }}>⚡️ Offline vs Hosted Mode:</strong>
                <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                  In <strong>Direct Camera Save</strong> mode, the contact data is baked directly into the QR pattern itself — no internet connection is required to save the contact!
                </p>
              </div>
            </div>

            <div className="modal-actions">
              <button onClick={() => setShowTestModal(false)} className="modal-primary-btn">
                Got it, let&apos;s build!
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: PRINTABLE BUSINESS CARD PREVIEW */}
      {showPrintModal && (
        <div className="modal-backdrop" onClick={() => setShowPrintModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '480px' }}>
            <h3 className="modal-title">Printable Business Card Template</h3>
            <p className="modal-subtitle">Ready for print shops, badge lanyards, or networking events</p>

            <div className="print-card-paper">
              <div className="print-card-info">
                <span className="print-name">{fullName}</span>
                {currentProfile.title && <span className="print-title">{currentProfile.title}</span>}
                {currentProfile.company && <span className="print-company">{currentProfile.company}</span>}

                <div className="print-contact">
                  <div>📞 {currentProfile.phone || 'Phone'}</div>
                  <div>✉️ {currentProfile.email || 'Email'}</div>
                  {currentProfile.website && <div>🌐 {currentProfile.website.replace('https://', '')}</div>}
                </div>

                <div className="print-hub-tag">
                  ⚡️ Powered by AI Founder Hub
                </div>
              </div>

              <div className="print-qr-box">
                {qrDataUrl && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={qrDataUrl} alt="Printable QR Code" />
                )}
              </div>
            </div>

            <div className="modal-actions" style={{ marginTop: '1.5rem' }}>
              <button
                onClick={() => {
                  window.print();
                }}
                className="modal-primary-btn"
              >
                <Printer size={16} /> Print Card Template
              </button>
              <button onClick={() => setShowPrintModal(false)} className="modal-close-btn">
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
