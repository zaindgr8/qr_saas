import { NextRequest, NextResponse } from 'next/server';
import { getAllCards, getCardById, saveCard } from '@/lib/server-storage';
import { ContactProfile } from '@/types/contact';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');

  if (id) {
    const card = await getCardById(id);
    if (!card) {
      return NextResponse.json({ error: 'Card not found' }, { status: 404 });
    }
    return NextResponse.json({ card });
  }

  const cards = await getAllCards();
  return NextResponse.json({ cards });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const id = body.id || `card-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    
    const card: ContactProfile = {
      ...body,
      id,
      createdAt: body.createdAt || Date.now(),
      updatedAt: Date.now(),
    };

    await saveCard(card);
    return NextResponse.json({ success: true, card });
  } catch (error) {
    console.error('Error saving card:', error);
    return NextResponse.json({ error: 'Failed to save contact profile' }, { status: 500 });
  }
}
