'use client';

import Link from 'next/link';
import { useRef, useState } from 'react';
import { createSupabaseBrowserClient } from '@/lib/supabase/client';
import { generateTripDates, getCountdownDays } from '@/lib/roadmap/dateUtils';
import { sumBudgets } from '@/lib/roadmap/budgetUtils';

interface TripRecord {
  id: string;
  title: string;
  start_date: string;
  end_date: string;
  timezone: string;
}

interface TripItemRecord {
  id: string;
  trip_id: string;
  day_index: number;
  start_time: string | null;
  end_time: string | null;
  title: string;
  location: string | null;
  notes: string | null;
  budget: number | string | null;
  status: string;
  assigned_to: string | null;
  order_index: number;
}

const formatDate = (value: string) => {
  const date = new Date(`${value}T00:00:00Z`);
  return date.toLocaleDateString('id-ID', { dateStyle: 'full', timeZone: 'UTC' });
};

const formatBudget = (amount: number) => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0
  }).format(amount);
};

const blankDraft = {
  title: '',
  start_time: '',
  end_time: '',
  location: '',
  notes: '',
  budget: '',
  assigned_to: '',
  status: 'planned'
};

export default function TripPlannerClient({
  trip,
  initialItems
}: {
  trip: TripRecord;
  initialItems: TripItemRecord[];
}) {
  const supabaseRef = useRef<ReturnType<typeof createSupabaseBrowserClient> | null>(null);
  const getSupabase = () => {
    if (!supabaseRef.current) {
      supabaseRef.current = createSupabaseBrowserClient();
    }
    return supabaseRef.current;
  };
  const [items, setItems] = useState<TripItemRecord[]>(initialItems);
  const [drafts, setDrafts] = useState<Record<number, typeof blankDraft>>(
    Object.fromEntries(Array.from({ length: 7 }, (_, index) => [index, { ...blankDraft }]))
  );
  const [error, setError] = useState<string | null>(null);
  const [savingDay, setSavingDay] = useState<number | null>(null);

  const dates = generateTripDates(trip.start_date);
  const countdown = getCountdownDays(trip.start_date);
  const totalBudget = sumBudgets(items);
  const doneCount = items.filter((item) => item.status === 'done').length;
  const plannedCount = items.length - doneCount;

  const getDayItems = (dayIndex: number) =>
    items
      .filter((item) => item.day_index === dayIndex)
      .sort((a, b) => {
        if (a.order_index !== b.order_index) {
          return a.order_index - b.order_index;
        }
        return (a.start_time || '').localeCompare(b.start_time || '');
      });

  const updateDraft = (dayIndex: number, field: keyof typeof blankDraft, value: string) => {
    setDrafts((prev) => ({
      ...prev,
      [dayIndex]: {
        ...prev[dayIndex],
        [field]: value
      }
    }));
  };

  const handleAddItem = async (dayIndex: number) => {
    const draft = drafts[dayIndex];
    if (!draft.title.trim()) {
      setError('Judul kegiatan wajib diisi.');
      return;
    }
    if (dayIndex < 0 || dayIndex > 6) {
      setError('Hari tidak valid.');
      return;
    }

    setSavingDay(dayIndex);
    setError(null);

    const dayItems = getDayItems(dayIndex);
    const nextOrder = dayItems.length
      ? Math.max(...dayItems.map((item) => item.order_index)) + 1
      : 0;

    const { data, error: createError } = await getSupabase()
      .from('trip_items')
      .insert({
        trip_id: trip.id,
        day_index: dayIndex,
        title: draft.title,
        start_time: draft.start_time || null,
        end_time: draft.end_time || null,
        location: draft.location || null,
        notes: draft.notes || null,
        budget: draft.budget ? Number(draft.budget) : null,
        status: draft.status,
        assigned_to: draft.assigned_to || null,
        order_index: nextOrder
      })
      .select('*')
      .single();

    if (createError || !data) {
      setError(createError?.message || 'Gagal menambahkan item.');
      setSavingDay(null);
      return;
    }

    setItems((prev) => [...prev, data as TripItemRecord]);
    setDrafts((prev) => ({
      ...prev,
      [dayIndex]: { ...blankDraft }
    }));
    setSavingDay(null);
  };

  const toggleStatus = async (item: TripItemRecord) => {
    const nextStatus = item.status === 'done' ? 'planned' : 'done';
    const { data, error: updateError } = await getSupabase()
      .from('trip_items')
      .update({ status: nextStatus })
      .eq('id', item.id)
      .select('*')
      .single();

    if (updateError || !data) {
      setError(updateError?.message || 'Gagal update status.');
      return;
    }

    setItems((prev) => prev.map((entry) => (entry.id === item.id ? (data as TripItemRecord) : entry)));
  };

  const moveItem = async (item: TripItemRecord, direction: 'up' | 'down') => {
    const dayItems = getDayItems(item.day_index);
    const currentIndex = dayItems.findIndex((entry) => entry.id === item.id);
    const swapIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;

    if (swapIndex < 0 || swapIndex >= dayItems.length) return;

    const target = dayItems[swapIndex];

    const { error: firstError } = await getSupabase()
      .from('trip_items')
      .update({ order_index: target.order_index })
      .eq('id', item.id);

    const { error: secondError } = await getSupabase()
      .from('trip_items')
      .update({ order_index: item.order_index })
      .eq('id', target.id);

    if (firstError || secondError) {
      setError(firstError?.message || secondError?.message || 'Gagal reorder item.');
      return;
    }

    setItems((prev) =>
      prev.map((entry) => {
        if (entry.id === item.id) {
          return { ...entry, order_index: target.order_index };
        }
        if (entry.id === target.id) {
          return { ...entry, order_index: item.order_index };
        }
        return entry;
      })
    );
  };

  return (
    <div className="space-y-10">
      <section className="rounded-3xl border border-white/10 bg-white/5 p-8 shadow-[0_25px_60px_rgba(0,0,0,0.35)] backdrop-blur">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.3em] text-white/50">Trip Planner</p>
            <h1 className="font-display text-3xl text-white">{trip.title}</h1>
            <p className="mt-2 text-sm text-white/60">{formatDate(trip.start_date)} - {formatDate(trip.end_date)}</p>
          </div>
          <Link
            href="/roadmap"
            className="inline-flex items-center justify-center rounded-full border border-white/20 px-5 py-2 text-sm text-white/80 transition hover:border-white/50"
          >
            Back to Roadmap
          </Link>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-3">
          <div className="rounded-2xl border border-white/10 bg-black/30 p-4">
            <p className="text-xs uppercase tracking-[0.3em] text-white/40">Countdown</p>
            <p className="mt-2 text-2xl font-semibold text-white">
              {countdown > 0 ? `D-${countdown}` : countdown === 0 ? 'Starts today' : 'In progress'}
            </p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-black/30 p-4">
            <p className="text-xs uppercase tracking-[0.3em] text-white/40">Progress</p>
            <p className="mt-2 text-2xl font-semibold text-white">
              {doneCount} / {items.length}
            </p>
            <p className="text-xs text-white/50">{plannedCount} planned</p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-black/30 p-4">
            <p className="text-xs uppercase tracking-[0.3em] text-white/40">Budget est.</p>
            <p className="mt-2 text-2xl font-semibold text-white">
              {totalBudget > 0 ? formatBudget(totalBudget) : '—'}
            </p>
          </div>
        </div>

        {error ? (
          <div className="mt-6 rounded-2xl border border-rose-300/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-100">
            {error}
          </div>
        ) : null}
      </section>

      <section className="space-y-6">
        {dates.map((date, dayIndex) => {
          const dayItems = getDayItems(dayIndex);
          const draft = drafts[dayIndex];

          return (
            <div
              key={date}
              className="rounded-3xl border border-white/10 bg-white/5 p-6 shadow-[0_20px_40px_rgba(0,0,0,0.3)] backdrop-blur"
            >
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-xs uppercase tracking-[0.3em] text-white/40">Day {dayIndex + 1}</p>
                  <h2 className="font-display text-2xl text-white">{formatDate(date)}</h2>
                </div>
                <span className="rounded-full border border-white/10 bg-black/40 px-3 py-1 text-xs text-white/60">
                  {dayItems.length} item
                </span>
              </div>

              <div className="mt-5 space-y-3">
                {dayItems.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-white/10 bg-black/20 p-5 text-sm text-white/50">
                    Belum ada itinerary untuk hari ini.
                  </div>
                ) : (
                  dayItems.map((item) => (
                    <div
                      key={item.id}
                      className="flex flex-col gap-3 rounded-2xl border border-white/10 bg-black/30 p-4"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div>
                          <p className="text-lg font-semibold text-white">{item.title}</p>
                          <p className="text-xs uppercase tracking-[0.3em] text-white/40">
                            {item.start_time || item.end_time
                              ? `${item.start_time || '??'} - ${item.end_time || '??'}`
                              : 'Jam fleksibel'}
                          </p>
                        </div>
                        <span
                          className={`rounded-full px-3 py-1 text-xs uppercase tracking-[0.2em] ${
                            item.status === 'done'
                              ? 'bg-emerald-400/20 text-emerald-100'
                              : 'bg-amber-400/20 text-amber-100'
                          }`}
                        >
                          {item.status === 'done' ? 'Done' : 'Planned'}
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-3 text-sm text-white/60">
                        {item.location ? <span>📍 {item.location}</span> : null}
                        {item.assigned_to ? <span>👥 {item.assigned_to}</span> : null}
                        {item.budget ? <span>💸 {formatBudget(Number(item.budget))}</span> : null}
                      </div>
                      {item.notes ? <p className="text-sm text-white/60">{item.notes}</p> : null}
                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={() => moveItem(item, 'up')}
                          className="rounded-full border border-white/20 px-3 py-1 text-xs text-white/70"
                        >
                          Up
                        </button>
                        <button
                          type="button"
                          onClick={() => moveItem(item, 'down')}
                          className="rounded-full border border-white/20 px-3 py-1 text-xs text-white/70"
                        >
                          Down
                        </button>
                        <button
                          type="button"
                          onClick={() => toggleStatus(item)}
                          className="rounded-full border border-white/20 px-3 py-1 text-xs text-white/70"
                        >
                          {item.status === 'done' ? 'Mark Planned' : 'Mark Done'}
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>

              <div className="mt-6 grid gap-3 md:grid-cols-2">
                <input
                  value={draft.title}
                  onChange={(event) => updateDraft(dayIndex, 'title', event.target.value)}
                  placeholder="Judul kegiatan"
                  className="rounded-full border border-white/10 bg-black/30 px-4 py-2 text-white outline-none"
                />
                <div className="grid grid-cols-2 gap-3">
                  <input
                    type="time"
                    value={draft.start_time}
                    onChange={(event) => updateDraft(dayIndex, 'start_time', event.target.value)}
                    className="rounded-full border border-white/10 bg-black/30 px-4 py-2 text-white outline-none"
                  />
                  <input
                    type="time"
                    value={draft.end_time}
                    onChange={(event) => updateDraft(dayIndex, 'end_time', event.target.value)}
                    className="rounded-full border border-white/10 bg-black/30 px-4 py-2 text-white outline-none"
                  />
                </div>
                <input
                  value={draft.location}
                  onChange={(event) => updateDraft(dayIndex, 'location', event.target.value)}
                  placeholder="Lokasi"
                  className="rounded-full border border-white/10 bg-black/30 px-4 py-2 text-white outline-none"
                />
                <input
                  value={draft.budget}
                  onChange={(event) => updateDraft(dayIndex, 'budget', event.target.value)}
                  placeholder="Budget (opsional)"
                  className="rounded-full border border-white/10 bg-black/30 px-4 py-2 text-white outline-none"
                />
                <select
                  value={draft.assigned_to}
                  onChange={(event) => updateDraft(dayIndex, 'assigned_to', event.target.value)}
                  className="rounded-full border border-white/10 bg-black/30 px-4 py-2 text-white outline-none"
                >
                  <option value="">Assigned to</option>
                  <option value="me">Me</option>
                  <option value="her">Her</option>
                  <option value="both">Both</option>
                </select>
                <select
                  value={draft.status}
                  onChange={(event) => updateDraft(dayIndex, 'status', event.target.value)}
                  className="rounded-full border border-white/10 bg-black/30 px-4 py-2 text-white outline-none"
                >
                  <option value="planned">Planned</option>
                  <option value="done">Done</option>
                </select>
                <textarea
                  value={draft.notes}
                  onChange={(event) => updateDraft(dayIndex, 'notes', event.target.value)}
                  placeholder="Notes"
                  rows={3}
                  className="md:col-span-2 rounded-2xl border border-white/10 bg-black/30 px-4 py-2 text-white outline-none"
                />
                <button
                  type="button"
                  onClick={() => handleAddItem(dayIndex)}
                  disabled={savingDay === dayIndex}
                  className="md:col-span-2 rounded-full bg-amber-200/90 px-5 py-2 text-sm font-semibold text-black transition hover:bg-amber-100 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {savingDay === dayIndex ? 'Saving...' : 'Add Item'}
                </button>
              </div>
            </div>
          );
        })}
      </section>
    </div>
  );
}
