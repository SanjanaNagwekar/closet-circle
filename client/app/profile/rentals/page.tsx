'use client';

import { useCallback, useEffect, useState } from 'react';
import Image from 'next/image';
import { withPageAuthRequired } from '@auth0/nextjs-auth0/client';

import { apiUrl } from '@/lib/api';
import { Footer, Header } from '../../explore/ExplorePage';

type RentalStatus = 'pending' | 'approved' | 'declined' | 'cancelled' | 'completed';

interface RentalRequest {
  rental_id: number;
  post_id: number;
  title: string;
  description: string;
  images: string[];
  start_date: string;
  end_date: string;
  daily_rate: number;
  status: RentalStatus;
  renter_first_name: string;
  renter_last_name: string;
  seller_first_name: string;
  seller_last_name: string;
}

interface RentalCardProps {
  isSeller: boolean;
  isUpdating: boolean;
  onStatusChange: (rentalId: number, status: RentalStatus) => void;
  rental: RentalRequest;
}

function daysBetween(startDate: string, endDate: string) {
  return Math.floor(
    (Date.parse(`${endDate}T00:00:00Z`) - Date.parse(`${startDate}T00:00:00Z`))
    / 86_400_000,
  ) + 1;
}

function displayDate(date: string) {
  return new Date(`${date}T00:00:00`).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function displayStatus(rental: RentalRequest) {
  const today = new Date().toISOString().slice(0, 10);
  if (rental.status === 'approved' && today >= rental.start_date && today <= rental.end_date) {
    return 'Active';
  }
  if (rental.status === 'approved' && today > rental.end_date) return 'Return due';
  return rental.status.charAt(0).toUpperCase() + rental.status.slice(1);
}

function RentalCard({ isSeller, isUpdating, onStatusChange, rental }: RentalCardProps) {
  const days = daysBetween(rental.start_date, rental.end_date);
  const today = new Date().toISOString().slice(0, 10);
  const otherParty = isSeller
    ? `${rental.renter_first_name} ${rental.renter_last_name}`
    : `${rental.seller_first_name} ${rental.seller_last_name}`;

  return (
    <article className="grid gap-5 rounded-xl border bg-white p-5 shadow-sm sm:grid-cols-[140px_1fr]">
      {rental.images[0] ? (
        <Image
          alt={rental.title}
          className="aspect-square w-full rounded-lg object-cover"
          height={280}
          src={rental.images[0]}
          unoptimized
          width={280}
        />
      ) : (
        <div className="flex aspect-square items-center justify-center rounded-lg bg-gray-100 text-sm text-gray-500">
          No image
        </div>
      )}

      <div>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-[#284472]">{rental.title}</h2>
            <p className="text-sm text-gray-600">
              {isSeller ? 'Requested by' : 'Seller'}: {otherParty}
            </p>
          </div>
          <span className="rounded-full bg-[#fdf5f3] px-3 py-1 text-xs font-semibold text-[#675a5e]">
            {displayStatus(rental)}
          </span>
        </div>

        <dl className="mt-4 grid gap-2 text-sm text-gray-700 sm:grid-cols-2">
          <div>
            <dt className="font-medium">Rental dates</dt>
            <dd>{displayDate(rental.start_date)}–{displayDate(rental.end_date)}</dd>
          </div>
          <div>
            <dt className="font-medium">Estimated total</dt>
            <dd>{days} {days === 1 ? 'day' : 'days'} · ${(days * rental.daily_rate).toFixed(2)}</dd>
          </div>
        </dl>

        <div className="mt-5 flex flex-wrap gap-2">
          {!isSeller && rental.status === 'pending' && (
            <button
              className="rounded-md border border-red-300 px-4 py-2 text-sm text-red-700 disabled:opacity-60"
              disabled={isUpdating}
              onClick={() => onStatusChange(rental.rental_id, 'cancelled')}
              type="button"
            >
              Cancel request
            </button>
          )}
          {isSeller && rental.status === 'pending' && (
            <>
              <button
                className="rounded-md bg-[#284472] px-4 py-2 text-sm text-white disabled:opacity-60"
                disabled={isUpdating}
                onClick={() => onStatusChange(rental.rental_id, 'approved')}
                type="button"
              >
                Approve
              </button>
              <button
                className="rounded-md border px-4 py-2 text-sm text-[#675a5e] disabled:opacity-60"
                disabled={isUpdating}
                onClick={() => onStatusChange(rental.rental_id, 'declined')}
                type="button"
              >
                Decline
              </button>
            </>
          )}
          {isSeller && rental.status === 'approved' && today >= rental.start_date && (
            <button
              className="rounded-md bg-[#675a5e] px-4 py-2 text-sm text-white disabled:opacity-60"
              disabled={isUpdating}
              onClick={() => onStatusChange(rental.rental_id, 'completed')}
              type="button"
            >
              Mark returned
            </button>
          )}
        </div>
      </div>
    </article>
  );
}

function RentalsPage() {
  const [activeView, setActiveView] = useState<'buyer' | 'seller'>('buyer');
  const [buyerRentals, setBuyerRentals] = useState<RentalRequest[]>([]);
  const [sellerRentals, setSellerRentals] = useState<RentalRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<number | null>(null);
  const [message, setMessage] = useState('');

  const loadRentals = useCallback(async () => {
    setIsLoading(true);
    setMessage('');
    try {
      const [buyerResponse, sellerResponse] = await Promise.all([
        fetch(apiUrl('/api/profile/rentals/buyer')),
        fetch(apiUrl('/api/profile/rentals/seller')),
      ]);
      const [buyerData, sellerData] = await Promise.all([
        buyerResponse.json(),
        sellerResponse.json(),
      ]);
      if (!buyerResponse.ok) throw new Error(buyerData.error || 'Could not load your rentals');
      if (!sellerResponse.ok) throw new Error(sellerData.error || 'Could not load rental requests');
      setBuyerRentals(buyerData.rentals);
      setSellerRentals(sellerData.rentals);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Could not load rentals');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadRentals();
  }, [loadRentals]);

  const changeStatus = async (rentalId: number, status: RentalStatus) => {
    setUpdatingId(rentalId);
    setMessage('');
    try {
      const response = await fetch(apiUrl(`/api/profile/rentals/${rentalId}/status`), {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Could not update this rental');
      const updateRental = (rental: RentalRequest) => (
        rental.rental_id === rentalId
          ? { ...rental, status: data.rental.status as RentalStatus }
          : rental
      );
      setBuyerRentals((current) => current.map(updateRental));
      setSellerRentals((current) => current.map(updateRental));
      setMessage(`Rental request ${status}.`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Could not update this rental');
    } finally {
      setUpdatingId(null);
    }
  };

  const rentals = activeView === 'buyer' ? buyerRentals : sellerRentals;

  return (
    <div className="account-page flex min-h-screen flex-col bg-[#fafafa]">
      <Header />
      <main className="account-content container mx-auto flex-1 px-4 py-8">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-[#675a5e]">Rental dashboard</p>
            <h1 className="text-3xl font-semibold text-[#284472]">Manage rentals</h1>
          </div>
          <div className="flex rounded-lg border bg-white p-1">
            <button
              className={`rounded-md px-4 py-2 text-sm ${activeView === 'buyer' ? 'bg-[#284472] text-white' : 'text-gray-700'}`}
              onClick={() => setActiveView('buyer')}
              type="button"
            >
              My requests ({buyerRentals.length})
            </button>
            <button
              className={`rounded-md px-4 py-2 text-sm ${activeView === 'seller' ? 'bg-[#284472] text-white' : 'text-gray-700'}`}
              onClick={() => setActiveView('seller')}
              type="button"
            >
              Seller requests ({sellerRentals.length})
            </button>
          </div>
        </div>

        {message && (
          <p className="mt-6 rounded-md bg-[#fdf5f3] px-4 py-3 text-sm text-[#675a5e]" role="status">
            {message}
          </p>
        )}

        <div className="mt-8 space-y-5">
          {isLoading ? (
            <p className="text-gray-600">Loading rentals…</p>
          ) : rentals.length === 0 ? (
            <div className="rounded-xl border bg-white p-10 text-center text-gray-600">
              {activeView === 'buyer'
                ? 'You have not submitted any rental requests.'
                : 'You do not have any rental requests to review.'}
            </div>
          ) : rentals.map((rental) => (
            <RentalCard
              isSeller={activeView === 'seller'}
              isUpdating={updatingId === rental.rental_id}
              key={rental.rental_id}
              onStatusChange={changeStatus}
              rental={rental}
            />
          ))}
        </div>
      </main>
      <Footer />
    </div>
  );
}

export default withPageAuthRequired(RentalsPage);
