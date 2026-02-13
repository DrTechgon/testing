import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';
import { createClient } from '@supabase/supabase-js';

type InvitePayload = {
  contact?: string;
};

const normalizeContact = (value: string) => value.replace(/[^\d+]/g, '');

/** Normalize to E.164: if already has + use it, else assume India for 10 digits. */
const normalizeContactToE164 = (value: string): string => {
  const trimmed = value.trim();
  const digits = trimmed.replace(/\D/g, '');
  if (trimmed.startsWith('+')) {
    return `+${digits}`;
  }
  if (digits.length === 10) {
    return `+91${digits}`;
  }
  if (digits.startsWith('91') && digits.length === 12) {
    return `+${digits}`;
  }
  return digits ? `+${digits}` : trimmed;
};

export async function POST(request: Request) {
  // Check for Bearer token in Authorization header (for mobile apps)
  const authHeader = request.headers.get('authorization');
  let user: { id: string } | null = null;

  if (authHeader?.startsWith('Bearer ')) {
    // Mobile app authentication via Bearer token
    const token = authHeader.replace('Bearer ', '');
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        global: {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      }
    );
    const { data: { user: authUser }, error: authError } = await supabase.auth.getUser(token);
    if (!authError && authUser) {
      user = authUser;
    }
  } else {
    // Web app authentication via cookies
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options);
            });
          },
        },
      }
    );
    const { data: { user: authUser }, error: authError } = await supabase.auth.getUser();
    if (!authError && authUser) {
      user = authUser;
    }
  }

  if (!user) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return NextResponse.json(
      { message: 'Service role key is missing.' },
      { status: 500 }
    );
  }

  const payload = (await request.json()) as InvitePayload;
  const contact = payload.contact?.trim();

  if (!contact) {
    return NextResponse.json({ message: 'Contact is required.' }, { status: 400 });
  }

  const adminClient = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    {
      auth: { persistSession: false },
    }
  );

  let recipientId: string | null = null;

  if (contact.includes('@')) {
    return NextResponse.json(
      { message: 'Email invites are not supported. Use a phone number instead.' },
      { status: 400 }
    );
  }

  if (!recipientId) {
    const normalized = normalizeContact(contact);
    const withCountryCode = normalizeContactToE164(contact);
    const variants = new Set<string>();
    if (contact) variants.add(contact);
    if (normalized) variants.add(normalized);
    if (withCountryCode) variants.add(withCountryCode);
    if (normalized && !normalized.startsWith('+')) {
      variants.add(`+${normalized}`);
    }
    if (normalized.startsWith('+')) {
      variants.add(normalized.replace(/^\+/, ''));
    }

    const { data: people, error: personalError } = await adminClient
      .from('personal')
      .select('id')
      .in('phone', Array.from(variants));

    if (personalError) {
      return NextResponse.json(
        { message: personalError.message },
        { status: 500 }
      );
    }

    recipientId = people?.[0]?.id ?? null;
  }

  if (!recipientId) {
    return NextResponse.json(
      { message: 'No registered user found with that contact.' },
      { status: 404 }
    );
  }

  if (recipientId === user.id) {
    return NextResponse.json({ message: 'You cannot invite yourself.' }, { status: 400 });
  }

  const { error: inviteError } = await adminClient.from('care_circle_links').insert({
    requester_id: user.id,
    recipient_id: recipientId,
  });

  if (inviteError) {
    const message =
      inviteError.code === '23505'
        ? 'An invite already exists for this member.'
        : inviteError.message;
    return NextResponse.json({ message }, { status: 400 });
  }

  return NextResponse.json({ recipientId });
}
