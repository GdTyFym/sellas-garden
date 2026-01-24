import { redirect } from 'next/navigation';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import CoupleHQClient from './CoupleHQClient';

export const dynamic = 'force-dynamic';

export default async function UsPage() {
  const supabase = await createSupabaseServerClient();
  if (!supabase) {
    return (
      <div className="rounded-3xl border border-amber-200/20 bg-amber-200/5 p-8 text-sm text-amber-100">
        Supabase belum dikonfigurasi. Isi <code>.env.local</code> dengan
        <code> NEXT_PUBLIC_SUPABASE_URL</code> dan
        <code> NEXT_PUBLIC_SUPABASE_ANON_KEY</code>, lalu restart dev server.
      </div>
    );
  }
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const { data: membership } = await supabase
    .from('couple_members')
    .select('couple_id, couples ( id, invite_code, created_at )')
    .eq('user_id', user.id)
    .maybeSingle();

  const rawCouple = membership?.couples ?? null;
  const couple = (Array.isArray(rawCouple) ? rawCouple[0] ?? null : rawCouple) as
    | { id: string; invite_code: string; created_at: string }
    | null;
  const coupleId = membership?.couple_id ?? null;

  const { data: plans } = coupleId
    ? await supabase
        .from('plans')
        .select('*')
        .eq('couple_id', coupleId)
        .order('created_at', { ascending: false })
    : { data: [] };

  return (
    <CoupleHQClient
      userId={user.id}
      initialCouple={couple}
      initialPlans={plans ?? []}
    />
  );
}
