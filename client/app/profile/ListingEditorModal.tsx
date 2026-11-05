'use client';

import { ChangeEvent, useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import Image from 'next/image';

export type ListingStatus = 'draft' | 'published' | 'archived';

export interface ListingEditorValues {
  id?: number | string;
  title: string;
  price: string;
  forSale: boolean;
  forRent: boolean;
  type: string;
  audience: string;
  colors: string[];
  size: string;
  condition: string;
  description: string;
  existingImages: string[];
  newImages: File[];
}

interface ListingEditorModalProps {
  initialListing?: ListingEditorValues | null;
  isSaving: boolean;
  open: boolean;
  onClose: () => void;
  onSave: (listing: ListingEditorValues, status: 'draft' | 'published') => Promise<void>;
}

const TYPES = ['Tops', 'Bottoms', 'Outerwear', 'Dresses', 'Shoes', 'Accessories'];
const AUDIENCES = ["Women's", "Men's", 'Kids'];
const COLORS = ['black', 'white', 'red', 'blue', 'green', 'pink'];
const SIZES = [
  'XX-Small', 'X-Small', 'Small', 'Medium', 'Large', 'X-Large',
  'XX-Large', '3X-Large', '4X-Large',
];
const CONDITIONS = [
  { label: 'Brand new', value: 'new' },
  { label: 'Used – Like new', value: 'excellent' },
  { label: 'Used – Good', value: 'good' },
  { label: 'Used – Fair', value: 'worn' },
];
const ACCEPTED_IMAGE_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);

const EMPTY_LISTING: ListingEditorValues = {
  title: '',
  price: '',
  forSale: true,
  forRent: false,
  type: 'Tops',
  audience: "Women's",
  colors: [],
  size: 'Medium',
  condition: 'new',
  description: '',
  existingImages: [],
  newImages: [],
};

function validateForPublishing(listing: ListingEditorValues): Record<string, string> {
  const errors: Record<string, string> = {};
  if (!listing.title.trim()) errors.title = 'Add a title';
  if (!listing.description.trim()) errors.description = 'Add a description';
  if (!listing.price || Number(listing.price) <= 0) errors.price = 'Enter a price greater than zero';
  if (!listing.forSale && !listing.forRent) errors.availability = 'Choose sale, rental, or both';
  if (listing.colors.length === 0) errors.colors = 'Choose at least one color';
  if (listing.existingImages.length + listing.newImages.length === 0) {
    errors.images = 'Add at least one image';
  }
  return errors;
}

export default function ListingEditorModal({
  initialListing,
  isSaving,
  open,
  onClose,
  onSave,
}: ListingEditorModalProps) {
  const [listing, setListing] = useState<ListingEditorValues>(EMPTY_LISTING);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitError, setSubmitError] = useState('');

  useEffect(() => {
    if (!open) return;
    setListing(initialListing ? { ...initialListing, newImages: [] } : EMPTY_LISTING);
    setErrors({});
    setSubmitError('');
  }, [initialListing, open]);

  const newImagePreviews = useMemo(
    () => listing.newImages.map((file) => URL.createObjectURL(file)),
    [listing.newImages],
  );

  useEffect(() => {
    return () => {
      newImagePreviews.forEach((previewUrl) => URL.revokeObjectURL(previewUrl));
    };
  }, [newImagePreviews]);

  if (!open) return null;

  const update = <K extends keyof ListingEditorValues>(
    field: K,
    value: ListingEditorValues[K],
  ) => {
    setListing((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: '' }));
  };

  const handleImages = (event: ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(event.target.files || []);
    const availableSlots = 5 - listing.existingImages.length - listing.newImages.length;
    const invalidFile = selectedFiles.find(
      (file) => !ACCEPTED_IMAGE_TYPES.has(file.type) || file.size > 5 * 1024 * 1024,
    );

    if (invalidFile) {
      setErrors((current) => ({
        ...current,
        images: 'Images must be JPEG, PNG, or WebP files no larger than 5 MB',
      }));
      event.target.value = '';
      return;
    }

    update('newImages', [...listing.newImages, ...selectedFiles.slice(0, availableSlots)]);
    if (selectedFiles.length > availableSlots) {
      setErrors((current) => ({
        ...current,
        images: 'A listing can include up to five images',
      }));
    }
    event.target.value = '';
  };

  const submit = async (status: 'draft' | 'published') => {
    const nextErrors = status === 'published' ? validateForPublishing(listing) : {};
    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      return;
    }

    setSubmitError('');
    try {
      await onSave(listing, status);
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : 'Could not save the listing');
    }
  };

  const previewImage = listing.existingImages[0] || newImagePreviews[0];
  const isEditing = Boolean(initialListing?.id);

  return createPortal(
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/50 px-4 py-8">
      <div
        aria-labelledby="listing-editor-title"
        aria-modal="true"
        className="mx-auto grid w-full max-w-5xl gap-6 rounded-xl bg-white p-6 shadow-xl lg:grid-cols-[1fr_340px]"
        role="dialog"
      >
        <form className="space-y-5" onSubmit={(event) => event.preventDefault()}>
          <div>
            <p className="text-sm font-medium text-[#675a5e]">Seller listing</p>
            <h2 id="listing-editor-title" className="text-2xl font-semibold text-[#284472]">
              {isEditing ? 'Edit listing' : 'Create a listing'}
            </h2>
            <p className="mt-1 text-sm text-gray-600">
              Save an unfinished draft or preview the listing and publish it when it is ready.
            </p>
          </div>

          <label className="block text-sm font-medium text-gray-800">
            Title
            <input
              className="mt-1 w-full rounded-md border px-3 py-2"
              maxLength={50}
              onChange={(event) => update('title', event.target.value)}
              placeholder="Vintage denim jacket"
              value={listing.title}
            />
            {errors.title && <span className="mt-1 block text-red-600">{errors.title}</span>}
          </label>

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="text-sm font-medium text-gray-800">
              Price
              <input
                className="mt-1 w-full rounded-md border px-3 py-2"
                min="0.01"
                onChange={(event) => update('price', event.target.value)}
                placeholder="25.00"
                step="0.01"
                type="number"
                value={listing.price}
              />
              {errors.price && <span className="mt-1 block text-red-600">{errors.price}</span>}
            </label>

            <label className="text-sm font-medium text-gray-800">
              Size
              <select
                className="mt-1 w-full rounded-md border px-3 py-2"
                onChange={(event) => update('size', event.target.value)}
                value={listing.size}
              >
                {SIZES.map((size) => <option key={size}>{size}</option>)}
              </select>
            </label>
          </div>

          <fieldset>
            <legend className="text-sm font-medium text-gray-800">Available for</legend>
            <div className="mt-2 flex gap-6">
              <label className="flex items-center gap-2 text-sm">
                <input
                  checked={listing.forSale}
                  onChange={(event) => update('forSale', event.target.checked)}
                  type="checkbox"
                />
                Sale
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input
                  checked={listing.forRent}
                  onChange={(event) => update('forRent', event.target.checked)}
                  type="checkbox"
                />
                Rental
              </label>
            </div>
            {errors.availability && (
              <span className="mt-1 block text-sm text-red-600">{errors.availability}</span>
            )}
          </fieldset>

          <div className="grid gap-4 sm:grid-cols-3">
            <label className="text-sm font-medium text-gray-800">
              Item type
              <select
                className="mt-1 w-full rounded-md border px-3 py-2"
                onChange={(event) => update('type', event.target.value)}
                value={listing.type}
              >
                {TYPES.map((type) => <option key={type}>{type}</option>)}
              </select>
            </label>
            <label className="text-sm font-medium text-gray-800">
              Audience
              <select
                className="mt-1 w-full rounded-md border px-3 py-2"
                onChange={(event) => update('audience', event.target.value)}
                value={listing.audience}
              >
                {AUDIENCES.map((audience) => <option key={audience}>{audience}</option>)}
              </select>
            </label>
            <label className="text-sm font-medium text-gray-800">
              Condition
              <select
                className="mt-1 w-full rounded-md border px-3 py-2"
                onChange={(event) => update('condition', event.target.value)}
                value={listing.condition}
              >
                {CONDITIONS.map((condition) => (
                  <option key={condition.value} value={condition.value}>{condition.label}</option>
                ))}
              </select>
            </label>
          </div>

          <fieldset>
            <legend className="text-sm font-medium text-gray-800">Colors</legend>
            <div className="mt-2 flex flex-wrap gap-2">
              {COLORS.map((color) => {
                const selected = listing.colors.includes(color);
                return (
                  <button
                    aria-pressed={selected}
                    className={`rounded-full border px-3 py-1 text-sm ${selected ? 'bg-[#284472] text-white' : 'bg-white'}`}
                    key={color}
                    onClick={() => update(
                      'colors',
                      selected
                        ? listing.colors.filter((value) => value !== color)
                        : [...listing.colors, color],
                    )}
                    type="button"
                  >
                    {color}
                  </button>
                );
              })}
            </div>
            {errors.colors && <span className="mt-1 block text-sm text-red-600">{errors.colors}</span>}
          </fieldset>

          <label className="block text-sm font-medium text-gray-800">
            Description
            <textarea
              className="mt-1 min-h-28 w-full rounded-md border px-3 py-2"
              maxLength={500}
              onChange={(event) => update('description', event.target.value)}
              placeholder="Describe the fit, material, condition, and any details a buyer or renter should know."
              value={listing.description}
            />
            <span className="mt-1 flex justify-between text-xs text-gray-500">
              <span>{errors.description || 'Include details that help someone decide.'}</span>
              <span>{listing.description.length}/500</span>
            </span>
          </label>

          <div>
            <label className="block text-sm font-medium text-gray-800" htmlFor="listing-images">
              Photos
            </label>
            <input
              accept="image/jpeg,image/png,image/webp"
              className="mt-1 block w-full text-sm"
              id="listing-images"
              multiple
              onChange={handleImages}
              type="file"
            />
            <p className="mt-1 text-xs text-gray-500">Up to five JPEG, PNG, or WebP images; 5 MB each.</p>
            {errors.images && <p className="mt-1 text-sm text-red-600">{errors.images}</p>}

            {(listing.existingImages.length > 0 || newImagePreviews.length > 0) && (
              <div className="mt-3 grid grid-cols-3 gap-3 sm:grid-cols-5">
                {listing.existingImages.map((imageUrl) => (
                  <div className="relative" key={imageUrl}>
                    <Image
                      alt="Existing listing"
                      className="aspect-square w-full rounded object-cover"
                      height={160}
                      src={imageUrl}
                      unoptimized
                      width={160}
                    />
                    <button
                      aria-label="Remove image"
                      className="absolute right-1 top-1 rounded-full bg-black/70 px-2 py-1 text-xs text-white"
                      onClick={() => update(
                        'existingImages',
                        listing.existingImages.filter((url) => url !== imageUrl),
                      )}
                      type="button"
                    >
                      ×
                    </button>
                  </div>
                ))}
                {newImagePreviews.map((previewUrl, index) => (
                  <div className="relative" key={previewUrl}>
                    <Image
                      alt="New listing preview"
                      className="aspect-square w-full rounded object-cover"
                      height={160}
                      src={previewUrl}
                      unoptimized
                      width={160}
                    />
                    <button
                      aria-label="Remove image"
                      className="absolute right-1 top-1 rounded-full bg-black/70 px-2 py-1 text-xs text-white"
                      onClick={() => update(
                        'newImages',
                        listing.newImages.filter((file, fileIndex) => fileIndex !== index),
                      )}
                      type="button"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {submitError && (
            <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700" role="alert">
              {submitError}
            </p>
          )}

          <div className="flex flex-wrap justify-end gap-3 border-t pt-4">
            <button className="rounded-md border px-4 py-2" disabled={isSaving} onClick={onClose} type="button">
              Cancel
            </button>
            <button
              className="rounded-md border border-[#284472] px-4 py-2 text-[#284472]"
              disabled={isSaving}
              onClick={() => submit('draft')}
              type="button"
            >
              Save draft
            </button>
            <button
              className="rounded-md bg-[#284472] px-4 py-2 text-white disabled:opacity-60"
              disabled={isSaving}
              onClick={() => submit('published')}
              type="button"
            >
              {isSaving ? 'Saving…' : isEditing ? 'Save and publish' : 'Publish listing'}
            </button>
          </div>
        </form>

        <aside className="rounded-lg bg-[#fdf5f3] p-4 lg:sticky lg:top-4 lg:self-start">
          <p className="text-xs font-semibold uppercase tracking-wide text-[#675a5e]">Live preview</p>
          <div className="mt-3 overflow-hidden rounded-lg border bg-white shadow-sm">
            {previewImage ? (
              <Image
                alt="Listing preview"
                className="aspect-square w-full object-cover"
                height={600}
                src={previewImage}
                unoptimized
                width={600}
              />
            ) : (
              <div className="flex aspect-square items-center justify-center bg-gray-100 text-sm text-gray-500">
                Add a photo to preview the listing
              </div>
            )}
            <div className="space-y-2 p-4">
              <h3 className="font-semibold text-[#284472]">{listing.title || 'Untitled listing'}</h3>
              <p className="text-sm text-gray-600">{listing.size} · {listing.condition}</p>
              <div className="flex flex-wrap gap-2 text-xs">
                {listing.forSale && <span className="rounded bg-[#675a5e] px-2 py-1 text-white">For sale</span>}
                {listing.forRent && <span className="rounded border px-2 py-1">For rent</span>}
              </div>
              <p className="font-medium">{listing.price ? `$${Number(listing.price).toFixed(2)}` : 'Price not set'}</p>
              <p className="line-clamp-4 text-sm text-gray-600">
                {listing.description || 'Your description will appear here.'}
              </p>
            </div>
          </div>
        </aside>
      </div>
    </div>,
    document.body,
  );
}
