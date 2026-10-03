import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getCardById } from '@/lib/server-storage';
import PublicCardClient from './card-client';

interface PageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  const card = await getCardById(id);

  if (!card) {
    return {
      title: 'Contact Profile | QuickContact QR',
      description: 'Scan and save contact directly to your phone contacts',
    };
  }

  const name = [card.prefix, card.firstName, card.lastName].filter(Boolean).join(' ') || 'Contact Card';
  const title = card.title ? `${name} - ${card.title} at ${card.company || ''}` : name;

  return {
    title: `${title} | QuickContact`,
    description: card.headline || `Scan or tap to save ${name}'s contact number and social links directly into your phone.`,
    openGraph: {
      title: `${name} | Digital Contact Card`,
      description: card.headline || `Save ${name}'s phone number, email, and social profiles directly to contacts.`,
      images: card.avatarUrl ? [card.avatarUrl] : [],
    },
  };
}

export default async function PublicContactPage({ params }: PageProps) {
  const { id } = await params;
  const card = await getCardById(id);

  if (!card) {
    notFound();
  }

  return <PublicCardClient card={card} />;
}
