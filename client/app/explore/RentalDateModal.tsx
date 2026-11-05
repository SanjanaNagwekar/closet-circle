'use client';

import { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';

interface RentalDateModalProps {
  isSaving: boolean;
  onClose: () => void;
  onConfirm: (startDate: string, endDate: string) => Promise<boolean>;
  open: boolean;
  rate: number;
  title: string;
}

function todayDate() {
  return new Date().toISOString().slice(0, 10);
}

function rentalDays(startDate: string, endDate: string) {
  if (!startDate || !endDate || endDate < startDate) return 0;
  const start = Date.parse(`${startDate}T00:00:00Z`);
  const end = Date.parse(`${endDate}T00:00:00Z`);
  return Math.floor((end - start) / 86_400_000) + 1;
}

export default function RentalDateModal({
  isSaving,
  onClose,
  onConfirm,
  open,
  rate,
  title,
}: RentalDateModalProps) {
  const today = todayDate();
  const [startDate, setStartDate] = useState(today);
  const [endDate, setEndDate] = useState(today);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!open) return;
    const currentDate = todayDate();
    setStartDate(currentDate);
    setEndDate(currentDate);
    setError('');
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !isSaving) onClose();
    };
    document.addEventListener('keydown', closeOnEscape);
    return () => document.removeEventListener('keydown', closeOnEscape);
  }, [isSaving, onClose, open]);

  const days = useMemo(() => rentalDays(startDate, endDate), [endDate, startDate]);

  if (!open) return null;

  const submit = async () => {
    if (startDate < today) {
      setError('Start date cannot be in the past.');
      return;
    }
    if (endDate < startDate) {
      setError('End date must be on or after the start date.');
      return;
    }

    setError('');
    if (await onConfirm(startDate, endDate)) onClose();
  };

  return createPortal(
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/50 px-4">
      <div
        aria-labelledby="rental-date-title"
        aria-modal="true"
        className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl"
        role="dialog"
      >
        <p className="text-sm font-medium text-[#675a5e]">Rental request</p>
        <h2 className="mt-1 text-xl font-semibold text-[#284472]" id="rental-date-title">
          Choose dates for {title}
        </h2>
        <p className="mt-2 text-sm text-gray-600">
          The seller will review your request before the rental is confirmed.
        </p>

        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <label className="text-sm font-medium text-gray-800">
            Start date
            <input
              autoFocus
              className="mt-1 w-full rounded-md border px-3 py-2"
              min={today}
              onChange={(event) => {
                const value = event.target.value;
                setStartDate(value);
                if (endDate < value) setEndDate(value);
              }}
              type="date"
              value={startDate}
            />
          </label>
          <label className="text-sm font-medium text-gray-800">
            End date
            <input
              className="mt-1 w-full rounded-md border px-3 py-2"
              min={startDate || today}
              onChange={(event) => setEndDate(event.target.value)}
              type="date"
              value={endDate}
            />
          </label>
        </div>

        <div className="mt-5 rounded-lg bg-[#fdf5f3] p-4 text-sm text-[#675a5e]">
          <div className="flex justify-between">
            <span>{days} {days === 1 ? 'day' : 'days'} × ${rate.toFixed(2)}</span>
            <span className="font-semibold">${(days * rate).toFixed(2)}</span>
          </div>
          <p className="mt-1 text-xs text-gray-600">Estimated rental total; no payment is collected now.</p>
        </div>

        {error && <p className="mt-3 text-sm text-red-600" role="alert">{error}</p>}

        <div className="mt-6 flex justify-end gap-3">
          <button className="rounded-md border px-4 py-2" disabled={isSaving} onClick={onClose} type="button">
            Cancel
          </button>
          <button
            className="rounded-md bg-[#284472] px-4 py-2 text-white disabled:opacity-60"
            disabled={isSaving || days === 0}
            onClick={submit}
            type="button"
          >
            {isSaving ? 'Adding…' : 'Add rental request'}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
