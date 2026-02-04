import { createServerClient } from '@supabase/ssr';
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

const FAMILY_FOLDERS = ['reports', 'prescriptions', 'insurance', 'bills'] as const;
type FamilyFolder = (typeof FAMILY_FOLDERS)[number];

export async function GET(request: Request) {
  try {
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
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          },
        },
      }
    );

    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session?.user) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const url = new URL(request.url);
    const memberId = url.searchParams.get('memberId');
    const folder = url.searchParams.get('folder') as FamilyFolder | null;
    const name = url.searchParams.get('name');

    if (!memberId || !folder || !name) {
      return NextResponse.json({ message: 'Missing required parameters.' }, { status: 400 });
    }

    if (!FAMILY_FOLDERS.includes(folder)) {
      return NextResponse.json({ message: 'Invalid folder.' }, { status: 400 });
    }

    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
      return NextResponse.json({ message: 'Service role key is missing.' }, { status: 500 });
    }

    const { data: viewerMember, error: viewerError } = await supabase
      .from('family_members')
      .select('family_id')
      .eq('user_id', session.user.id)
      .maybeSingle();

    if (viewerError || !viewerMember?.family_id) {
      return NextResponse.json({ message: 'Not allowed for this family member.' }, { status: 403 });
    }

    const { data: targetMember, error: targetError } = await supabase
      .from('family_members')
      .select('family_id')
      .eq('user_id', memberId)
      .eq('family_id', viewerMember.family_id)
      .maybeSingle();

    if (targetError || !targetMember) {
      return NextResponse.json({ message: 'Not allowed for this family member.' }, { status: 403 });
    }

    const adminClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY,
      { auth: { persistSession: false } }
    );

    const path = `${memberId}/${folder}/${name}`;
    const { data, error } = await adminClient.storage
      .from('medical-vault')
      .createSignedUrl(path, 60);

    if (error || !data?.signedUrl) {
      return NextResponse.json({ message: 'Unable to create signed URL.' }, { status: 500 });
    }

    return NextResponse.json({ url: data.signedUrl });
  } catch (error) {
    console.error('Error creating vault signed url:', error);
    return NextResponse.json(
      { message: 'Failed to create signed url' },
      { status: 500 }
    );
  }
}
