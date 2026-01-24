'use client';

import Link from 'next/link';
import { useRef, useState } from 'react';
import { createSupabaseBrowserClient } from '@/lib/supabase/client';
import { dayIndexToDate, getCountdownDays } from '@/lib/roadmap/dateUtils';

interface TripRecord {
  id: string;
  title: string;
  start_date: string;
  end_date: string;
  timezone: string;
}

const formatDateRange = (start: string, end: string) => {
  const startDate = new Date(`${start}T00:00:00Z`);
  const endDate = new Date(`${end}T00:00:00Z`);
  return `${startDate.toLocaleDateString('id-ID', { dateStyle: 'medium', timeZone: 'UTC' })} - ${endDate.toLocaleDateString('id-ID', { dateStyle: 'medium', timeZone: 'UTC' })}`;
};

export default function RoadmapListClient({
  coupleId,
  initialTrips
}: {
  coupleId: string | null;
  initialTrips: TripRecord[];
}) {
  const supabaseRef = useRef<ReturnType<typeof createSupabaseBrowserClient> | null>(null);
  const getSupabase = () => {
    if (!supabaseRef.current) {
      supabaseRef.current = createSupabaseBrowserClient();
    }
    return supabaseRef.current;
  };
  const [trips, setTrips] = useState<TripRecord[]>(initialTrips);
  const [title, setTitle] = useState('');
  const [startDate, setStartDate] = useState('');
  const [timezone, setTimezone] = useState('Asia/Makassar');
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const handleCreateTrip = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!coupleId) return;
    setSaving(true);
    setError(null);

    const endDate = dayIndexToDate(startDate, 6);
    const { data, error: createError } = await getSupabase()
      .from('trips')
      .insert({
        couple_id: coupleId,
        title,
        start_date: startDate,
        end_date: endDate,
        timezone
      })
      .select('*')
      .single();

    if (createError || !data) {
      setError(createError?.message || 'Gagal membuat trip.');
      setSaving(false);
      return;
    }

    setTrips((prev) => [...prev, data as TripRecord].sort((a, b) => a.start_date.localeCompare(b.start_date)));
    setTitle('');
    setStartDate('');
    setSaving(false);
  };

  return (
    <div className="space-y-10">
      <section className="rounded-3xl border border-white/10 bg-white/5 p-8 shadow-[0_25px_60px_rgba(0,0,0,0.35)] backdrop-blur">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.3em] text-white/50">Roadmap Trip</p>
            <h1 className="font-display text-3xl text-white">7-Day Journey Planner</h1>
            <p className="mt-2 text-sm text-white/60">Buat trip 7 hari dan isi itinerary per hari.</p>
          </div>
          <Link
            href="/us"
            className="inline-flex items-center justify-center rounded-full border border-white/20 px-5 py-2 text-sm text-white/80 transition hover:border-white/50"
          >
            Back to HQ
          </Link>
        </div>

        {!coupleId ? (
          <div className="mt-6 rounded-2xl border border-dashed border-white/10 bg-black/20 p-6 text-sm text-white/60">
            Kamu belum join couple. Arahkan ke <Link href="/us" className="text-amber-200">/us</Link> dulu.
          </div>
        ) : (
          <form onSubmit={handleCreateTrip} className="mt-6 grid gap-4 md:grid-cols-[2fr,1fr,1fr,auto]">
            <input
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="Judul trip"
              required
              className="rounded-full border border-white/10 bg-black/30 px-4 py-2 text-white outline-none transition focus:border-white/40"
            />
            <input
              type="date"
              value={startDate}
              onChange={(event) => setStartDate(event.target.value)}
              required
              className="rounded-full border border-white/10 bg-black/30 px-4 py-2 text-white outline-none transition focus:border-white/40"
            />
            <input
              value={timezone}
              onChange={(event) => setTimezone(event.target.value)}
              className="rounded-full border border-white/10 bg-black/30 px-4 py-2 text-white outline-none transition focus:border-white/40"
            />
            <button
              type="submit"
              disabled={saving}
              className="rounded-full bg-amber-200/90 px-5 py-2 text-sm font-semibold text-black transition hover:bg-amber-100 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {saving ? 'Creating...' : 'Create 7-day Trip'}
            </button>
          </form>
        )}

        {error ? (
          <div className="mt-4 rounded-2xl border border-rose-300/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-100">
            {error}
          </div>
        ) : null}
      </section>

      <section className="grid gap-4">
        {trips.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-white/10 bg-black/20 p-6 text-sm text-white/60">
            Belum ada trip. Buat satu untuk memulai.
          </div>
        ) : (
          trips.map((trip) => {
            const countdown = getCountdownDays(trip.start_date);
            const countdownLabel =
              countdown > 0 ? `D-${countdown}` : countdown === 0 ? 'Starts today' : 'In progress';
            return (
              <Link
                key={trip.id}
                href={`/roadmap/${trip.id}`}
                className="flex flex-col gap-3 rounded-2xl border border-white/10 bg-white/5 p-5 transition hover:border-white/30"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h2 className="font-display text-2xl text-white">{trip.title}</h2>
                  <span className="rounded-full bg-amber-200/20 px-3 py-1 text-xs uppercase tracking-[0.2em] text-amber-100">
                    {countdownLabel}
                  </span>
                </div>
                <p className="text-sm text-white/60">{formatDateRange(trip.start_date, trip.end_date)}</p>
                <p className="text-xs uppercase tracking-[0.3em] text-white/40">Timezone: {trip.timezone}</p>
              </Link>
            );
          })
        )}
      </section>
    </div>
  );
}
