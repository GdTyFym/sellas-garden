import { redirect } from 'next/navigation';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import RoadmapListClient from './RoadmapListClient';

export const dynamic = 'force-dynamic';

export default async function RoadmapPage() {
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
    .select('couple_id, couples ( id, invite_code )')
    .eq('user_id', user.id)
    .maybeSingle();

  const coupleId = membership?.couple_id ?? null;

  const { data: trips } = coupleId
    ? await supabase
        .from('trips')
        .select('*')
        .eq('couple_id', coupleId)
        .order('start_date', { ascending: true })
    : { data: [] };

  return (
    <RoadmapListClient coupleId={coupleId} initialTrips={trips ?? []} />
  );
}
