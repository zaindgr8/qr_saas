import { NextRequest, NextResponse } from 'next/server';
import { getCardById } from '@/lib/server-storage';
import { generateVCard } from '@/lib/vcard';
import { ContactProfile } from '@/types/contact';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');

  let profile: Partial<ContactProfile> | null = null;

  if (id) {
    profile = await getCardById(id);
  }

  // Also support query param fallback if no id
  if (!profile) {
    const firstName = searchParams.get('firstName') || '';
    const lastName = searchParams.get('lastName') || '';
    const phone = searchParams.get('phone') || '';
    const email = searchParams.get('email') || '';
    const company = searchParams.get('company') || '';
    const title = searchParams.get('title') || '';
    const website = searchParams.get('website') || '';
    const linkedin = searchParams.get('linkedin') || '';

    if (firstName || lastName || phone) {
      profile = {
        firstName,
        lastName,
        phone,
        email,
        company,
        title,
        website,
        linkedin,
      };
    }
  }

  if (!profile) {
    return new NextResponse('Contact not found', { status: 404 });
  }

  const vcardText = generateVCard(profile);
  const filename = [profile.firstName, profile.lastName].filter(Boolean).join('_') || 'contact';

  return new NextResponse(vcardText, {
    status: 200,
    headers: {
      'Content-Type': 'text/vcard; charset=utf-8',
      'Content-Disposition': `attachment; filename="${filename}.vcf"`,
      'Cache-Control': 'public, max-age=60',
    },
  });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const vcardText = generateVCard(body);
    const filename = [body.firstName, body.lastName].filter(Boolean).join('_') || 'contact';

    return new NextResponse(vcardText, {
      status: 200,
      headers: {
        'Content-Type': 'text/vcard; charset=utf-8',
        'Content-Disposition': `attachment; filename="${filename}.vcf"`,
      },
    });
  } catch (error) {
    console.error('Error generating vcard from post:', error);
    return new NextResponse('Error generating vCard', { status: 500 });
  }
}
