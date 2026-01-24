import { notFound, redirect } from 'next/navigation';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import TripPlannerClient from './TripPlannerClient';

export const dynamic = 'force-dynamic';

export default async function TripPlannerPage({
  params
}: {
  params: Promise<{ tripId: string }>;
}) {
  const { tripId } = await params;
  if (!tripId) {
    notFound();
  }
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

  const { data: trip } = await supabase
    .from('trips')
    .select('*')
    .eq('id', tripId)
    .single();

  if (!trip) {
    notFound();
  }

  const { data: items } = await supabase
    .from('trip_items')
    .select('*')
    .eq('trip_id', tripId)
    .order('day_index', { ascending: true })
    .order('order_index', { ascending: true })
    .order('start_time', { ascending: true });

  return <TripPlannerClient trip={trip} initialItems={items ?? []} />;
}
