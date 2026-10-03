'use client';

import React, { useState, useEffect } from 'react';
import { ContactProfile } from '@/types/contact';
import { downloadVCardFile } from '@/lib/vcard';
import { generateQRDataUrl } from '@/lib/qr';
import {
  Phone,
  Mail,
  Globe,
  Calendar,
  Send,
  MapPin,
  QrCode,
  Share2,
  Check,
  Copy,
  UserPlus,
  Briefcase,
  Building,
  Sparkles,
  ExternalLink,
  Smartphone,
  Zap
} from 'lucide-react';
import { TwitterIcon, LinkedInIcon, InstagramIcon, GithubIcon, WhatsAppIcon } from '@/components/icons';

interface Props {
  card: ContactProfile;
}

export default function PublicCardClient({ card }: Props) {
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [showQrModal, setShowQrModal] = useState(false);
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('');
  const [isSaving, setIsSaving] = useState(false);

  const fullName = [card.prefix, card.firstName, card.lastName].filter(Boolean).join(' ') || 'Contact Card';
  const cleanPhone = card.phone ? card.phone.replace(/[^\d+]/g, '') : '';
  const cleanWa = card.whatsapp ? card.whatsapp.replace(/[^\d]/g, '') : cleanPhone.replace(/[^\d]/g, '');

  useEffect(() => {
    // Generate QR code for the current card link
    if (typeof window !== 'undefined') {
      const currentUrl = window.location.href;
      generateQRDataUrl(currentUrl, {
        foreground: card.qrForeground || '#07070b',
        background: '#ffffff',
        width: 380,
        centerIcon: 'phone',
      }).then(setQrCodeUrl);
    }
  }, [card]);

  const handleCopy = (text: string, fieldName: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedField(fieldName);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handleSaveContact = () => {
    setIsSaving(true);
    try {
      // Trigger native download of .vcf file
      window.location.href = `/api/vcard?id=${card.id}`;
    } catch {
      downloadVCardFile(card);
    } finally {
      setTimeout(() => setIsSaving(false), 1200);
    }
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${fullName} - Contact Card | AI Founder Hub`,
          text: `Save ${fullName}'s contact number and details directly to your phone. Powered by AI Founder Hub.`,
          url: window.location.href,
        });
      } catch {
        // user cancelled or share failed
      }
    } else {
      handleCopy(window.location.href, 'share');
    }
  };

  return (
    <div className="public-card-container">
      {/* Background ambient lighting */}
      <div 
        className="ambient-glow" 
        style={{ background: `radial-gradient(circle, ${card.themeColor || '#ccf244'}26 0%, rgba(7,7,11,0) 70%)` }} 
      />

      <main className="public-card-wrapper">
        {/* Card Header & Profile Banner */}
        <div className="card-hero" style={{ borderColor: `${card.themeColor || '#ccf244'}44` }}>
          <div className="hero-top-actions">
            <span className="badge-verified">
              <Zap size={13} fill="#ccf244" /> AI Founder Hub Verified
            </span>
            <div className="action-buttons-group">
              <button 
                onClick={() => setShowQrModal(true)} 
                className="icon-circle-btn" 
                title="Display QR code"
                aria-label="Display QR Code"
              >
                <QrCode size={18} />
              </button>
              <button 
                onClick={handleShare} 
                className="icon-circle-btn" 
                title="Share Contact"
                aria-label="Share Contact"
              >
                <Share2 size={18} />
              </button>
            </div>
          </div>

          {/* Avatar Section */}
          <div className="avatar-wrapper">
            {card.avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img 
                src={card.avatarUrl} 
                alt={fullName} 
                className="avatar-img" 
                style={{ borderColor: card.themeColor || '#ccf244' }}
              />
            ) : (
              <div 
                className="avatar-fallback" 
                style={{ background: card.themeColor || '#ccf244' }}
              >
                <span>{card.firstName?.[0] || 'A'}{card.lastName?.[0] || 'I'}</span>
              </div>
            )}
          </div>

          {/* Profile Identity */}
          <h1 className="hero-name">{fullName}</h1>
          
          {(card.title || card.company) && (
            <div className="hero-subtext">
              {card.title && <span className="hero-title">{card.title}</span>}
              {card.title && card.company && <span className="hero-dot">•</span>}
              {card.company && <span className="hero-company">{card.company}</span>}
            </div>
          )}

          {card.headline && (
            <p className="hero-headline">{card.headline}</p>
          )}

          {/* PRIMARY CALL TO ACTION: Save To Phone Contacts */}
          <div className="save-cta-section">
            <button 
              onClick={handleSaveContact} 
              className="save-contact-btn"
              style={{
                background: card.themeColor || '#ccf244',
                color: '#07070b',
                boxShadow: `0 8px 24px -4px ${(card.themeColor || '#ccf244')}66`
              }}
              disabled={isSaving}
            >
              <UserPlus size={20} className="cta-icon" />
              <div className="cta-text-wrapper">
                <span className="cta-title">Save to Phone Contacts</span>
                <span className="cta-subtitle">Auto-adds number, email &amp; social profiles</span>
              </div>
            </button>
            <p className="cta-hint">
              <Smartphone size={13} /> Scanned on mobile? Tapping opens your native Contacts app
            </p>
          </div>

          {/* QUICK 1-TAP CONNECT BAR */}
          <div className="quick-connect-bar">
            {card.phone && (
              <a href={`tel:${cleanPhone}`} className="quick-btn" title="Call">
                <div className="quick-icon-wrap phone-accent"><Phone size={18} /></div>
                <span>Call</span>
              </a>
            )}

            {(card.whatsapp || card.phone) && (
              <a 
                href={`https://wa.me/${cleanWa}`} 
                target="_blank" 
                rel="noreferrer" 
                className="quick-btn" 
                title="WhatsApp"
              >
                <div className="quick-icon-wrap wa-accent"><WhatsAppIcon size={18} /></div>
                <span>WhatsApp</span>
              </a>
            )}

            {card.email && (
              <a href={`mailto:${card.email}`} className="quick-btn" title="Email">
                <div className="quick-icon-wrap mail-accent"><Mail size={18} /></div>
                <span>Email</span>
              </a>
            )}

            {card.website && (
              <a 
                href={card.website.startsWith('http') ? card.website : `https://${card.website}`} 
                target="_blank" 
                rel="noreferrer" 
                className="quick-btn" 
                title="Website"
              >
                <div className="quick-icon-wrap web-accent"><Globe size={18} /></div>
                <span>Website</span>
              </a>
            )}
          </div>
        </div>

        {/* DETAILED CONTACT INFORMATION */}
        <div className="card-section">
          <h2 className="section-heading">Contact Information</h2>

          <div className="info-list">
            {card.phone && (
              <div className="info-item">
                <div className="info-icon"><Phone size={18} /></div>
                <div className="info-content">
                  <span className="info-label">Mobile Phone (Primary)</span>
                  <a href={`tel:${cleanPhone}`} className="info-value">{card.phone}</a>
                </div>
                <button 
                  onClick={() => handleCopy(card.phone, 'phone')} 
                  className="copy-btn"
                  title="Copy Phone Number"
                >
                  {copiedField === 'phone' ? <Check size={16} className="text-success" /> : <Copy size={16} />}
                </button>
              </div>
            )}

            {card.workPhone && (
              <div className="info-item">
                <div className="info-icon"><Briefcase size={18} /></div>
                <div className="info-content">
                  <span className="info-label">Office / Work Phone</span>
                  <a href={`tel:${card.workPhone.replace(/[^\d+]/g, '')}`} className="info-value">{card.workPhone}</a>
                </div>
                <button 
                  onClick={() => handleCopy(card.workPhone!, 'workPhone')} 
                  className="copy-btn"
                >
                  {copiedField === 'workPhone' ? <Check size={16} className="text-success" /> : <Copy size={16} />}
                </button>
              </div>
            )}

            {card.email && (
              <div className="info-item">
                <div className="info-icon"><Mail size={18} /></div>
                <div className="info-content">
                  <span className="info-label">Personal Email</span>
                  <a href={`mailto:${card.email}`} className="info-value">{card.email}</a>
                </div>
                <button 
                  onClick={() => handleCopy(card.email, 'email')} 
                  className="copy-btn"
                >
                  {copiedField === 'email' ? <Check size={16} className="text-success" /> : <Copy size={16} />}
                </button>
              </div>
            )}

            {card.workEmail && (
              <div className="info-item">
                <div className="info-icon"><Building size={18} /></div>
                <div className="info-content">
                  <span className="info-label">Work Email</span>
                  <a href={`mailto:${card.workEmail}`} className="info-value">{card.workEmail}</a>
                </div>
                <button 
                  onClick={() => handleCopy(card.workEmail!, 'workEmail')} 
                  className="copy-btn"
                >
                  {copiedField === 'workEmail' ? <Check size={16} className="text-success" /> : <Copy size={16} />}
                </button>
              </div>
            )}

            {(card.address || card.city || card.country) && (
              <div className="info-item">
                <div className="info-icon"><MapPin size={18} /></div>
                <div className="info-content">
                  <span className="info-label">Location / Address</span>
                  <span className="info-value">
                    {[card.address, card.city, card.state, card.country].filter(Boolean).join(', ')}
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* SOCIAL & WEB PROFILES */}
        {(card.linkedin || card.twitter || card.instagram || card.github || card.calendly || card.telegram || card.website) && (
          <div className="card-section">
            <h2 className="section-heading">Social &amp; Digital Links</h2>
            <div className="social-grid">
              {card.linkedin && (
                <a 
                  href={card.linkedin.includes('linkedin.com') ? card.linkedin : `https://linkedin.com/in/${card.linkedin.replace(/^@/, '')}`} 
                  target="_blank" 
                  rel="noreferrer" 
                  className="social-card-pill linkedin"
                >
                  <LinkedInIcon size={20} />
                  <span>LinkedIn</span>
                  <ExternalLink size={14} className="pill-arrow" />
                </a>
              )}

              {card.twitter && (
                <a 
                  href={`https://x.com/${card.twitter.replace(/^@/, '').replace('https://x.com/', '').replace('https://twitter.com/', '')}`} 
                  target="_blank" 
                  rel="noreferrer" 
                  className="social-card-pill twitter"
                >
                  <TwitterIcon size={20} />
                  <span>X / Twitter</span>
                  <ExternalLink size={14} className="pill-arrow" />
                </a>
              )}

              {card.instagram && (
                <a 
                  href={`https://instagram.com/${card.instagram.replace(/^@/, '').replace('https://instagram.com/', '')}`} 
                  target="_blank" 
                  rel="noreferrer" 
                  className="social-card-pill instagram"
                >
                  <InstagramIcon size={20} />
                  <span>Instagram</span>
                  <ExternalLink size={14} className="pill-arrow" />
                </a>
              )}

              {card.github && (
                <a 
                  href={`https://github.com/${card.github.replace(/^@/, '').replace('https://github.com/', '')}`} 
                  target="_blank" 
                  rel="noreferrer" 
                  className="social-card-pill github"
                >
                  <GithubIcon size={20} />
                  <span>GitHub</span>
                  <ExternalLink size={14} className="pill-arrow" />
                </a>
              )}

              {card.calendly && (
                <a 
                  href={card.calendly.startsWith('http') ? card.calendly : `https://${card.calendly}`} 
                  target="_blank" 
                  rel="noreferrer" 
                  className="social-card-pill calendly"
                >
                  <Calendar size={20} />
                  <span>Schedule Meeting</span>
                  <ExternalLink size={14} className="pill-arrow" />
                </a>
              )}

              {card.telegram && (
                <a 
                  href={`https://t.me/${card.telegram.replace(/^@/, '')}`} 
                  target="_blank" 
                  rel="noreferrer" 
                  className="social-card-pill telegram"
                >
                  <Send size={20} />
                  <span>Telegram</span>
                  <ExternalLink size={14} className="pill-arrow" />
                </a>
              )}
            </div>
          </div>
        )}

        {/* NOTE / BIO */}
        {card.note && (
          <div className="card-section">
            <h2 className="section-heading">About / Notes</h2>
            <div className="note-box">
              <p>{card.note}</p>
            </div>
          </div>
        )}

        {/* FOOTER: POWERED BY AI FOUNDER HUB */}
        <footer className="public-card-footer">
          <a 
            href="https://aifounderhub.com" 
            target="_blank" 
            rel="noreferrer" 
            className="powered-by-banner"
          >
            <Zap size={13} fill="#ccf244" />
            <span>POWERED BY AI FOUNDER HUB</span>
            <ExternalLink size={12} />
          </a>
          <p style={{ marginTop: '0.2rem', fontSize: '0.78rem' }}>
            The community where AI builders are made • <a href="https://aifounderhub.com" target="_blank" rel="noreferrer" className="footer-link">aifounderhub.com</a>
          </p>
          <a href="/" className="footer-link" style={{ fontSize: '0.74rem', color: 'var(--text-subtle)' }}>
            Create Your Own Contact QR Card →
          </a>
        </footer>
      </main>

      {/* QR MODAL */}
      {showQrModal && (
        <div className="modal-backdrop" onClick={() => setShowQrModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3 className="modal-title">Scan to Save Contact</h3>
            <p className="modal-subtitle">Point any smartphone camera at this QR code</p>
            
            <div className="qr-preview-box">
              {qrCodeUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={qrCodeUrl} alt="Contact QR code" className="qr-image" />
              ) : (
                <div className="qr-loading">Generating QR...</div>
              )}
            </div>

            <div className="modal-actions">
              <button onClick={handleSaveContact} className="modal-primary-btn">
                <UserPlus size={18} /> Download Contact Card (.vcf)
              </button>
              <button onClick={() => setShowQrModal(false)} className="modal-close-btn">
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
