'use client';

import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useUser, withPageAuthRequired } from '@auth0/nextjs-auth0/client';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { apiUrl } from '@/lib/api';
import ListingEditorModal, {
    ListingEditorValues,
    ListingStatus,
} from './ListingEditorModal';
import SiteFooter from '../components/SiteFooter';

/* ============================================
   BRAND COLORS
============================================ */
const brandNavy = '#284472';
const brandLightPink = "#fdf5f3";
const brandLightBrown = "#efe4e1";
const brandBrown = "#675a5e";
/* ============================================
   TYPES
============================================ */
interface ClosetProduct {
    id         : number | string;
    title      : string;
    price      : string; 
    forSale    : boolean;
    forRent    : boolean;
    sold?      : boolean;
    type?      : string;
    audience?  : string;
    colors?    : string[];
    sizes?     : string[];
    condition? : string;
    description?: string;
    images     : string[];          // [] ⇒ gray placeholder
    status     : ListingStatus;
}

interface Friend {
    email       : string;
    first_name  : string;
    last_name   : string;
    profile_url : string | null;
}

const AUDIENCE_CATEGORIES = [
    { label: "Women's", id: 1 },
    { label: "Men's", id: 2 },
    { label: 'Kids', id: 3 },
];
const TYPE_CATEGORIES = [
    { label: 'Tops', id: 4 },
    { label: 'Bottoms', id: 5 },
    { label: 'Outerwear', id: 6 },
    { label: 'Dresses', id: 7 },
    { label: 'Shoes', id: 8 },
    { label: 'Accessories', id: 9 },
];
const COLOR_CATEGORIES = ['black', 'white', 'red', 'blue', 'green', 'pink']
    .map((label, index) => ({ label, id: index + 10 }));
const LISTING_CATEGORIES = [
    ...AUDIENCE_CATEGORIES,
    ...TYPE_CATEGORIES,
    ...COLOR_CATEGORIES,
];

function getDBCategories(type: string, audience: string, colors: string[] = []) {
    return LISTING_CATEGORIES
        .filter(({ label }) => label === type || label === audience || colors.includes(label))
        .map(({ id }) => id);
}

function getCategoryLabels(categoryIds: number[], categories: typeof LISTING_CATEGORIES) {
    return categories
        .filter(({ id }) => categoryIds.includes(id))
        .map(({ label }) => label);
}

function getUIAudience(categoryIds: number[]) {
    return getCategoryLabels(categoryIds, AUDIENCE_CATEGORIES);
}

function getUIType(categoryIds: number[]) {
    return getCategoryLabels(categoryIds, TYPE_CATEGORIES);
}

function getUIColors(categoryIds: number[]) {
    return getCategoryLabels(categoryIds, COLOR_CATEGORIES);
}

/* ============================================
   HEADER
============================================ */
const Header: React.FC = () => {
    const { user }        = useUser();
    const [open, setOpen] = useState(false);
    const dropdownRef     = useRef<HTMLDivElement | null>(null);

    useEffect(() => {
        if (!open) return;
        const h = (e: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) setOpen(false);
        };
        document.addEventListener('mousedown', h);
        return () => document.removeEventListener('mousedown', h);
    }, [open]);

    return (
        <header className="flex items-center justify-between p-4 border-b shadow-md bg-white relative z-30">
            {/* left nav */}
            <nav className="flex gap-5 items-center ml-4">
                <Link href="/about"   className="text-xl font-medium tracking-wide text-gray-700">About</Link>
                <Link href="/explore" className="text-xl font-medium tracking-wide text-gray-700">Explore</Link>
            </nav>

            {/* centre logo */}
            <div className="flex-grow flex justify-center">
                <Link href="/">
                    <Image
                        src="https://cdn.builder.io/api/v1/image/assets/TEMP/cbcbc59fadb92cbfa94f7a46414d883263e97dc4"
                        alt="Closet Circle"
                        className="w-[200px] h-auto"
                        height={80}
                        priority
                        unoptimized
                        width={200}
                    />
                </Link>
            </div>

            {/* right buttons */}
            <div className="flex gap-4 items-center mr-4">
                {/* shopping cart (only visible when logged in) */}
                {user && (
                    <Link href="/cart">
                        <button className="p-2" style={{ color: brandNavy }} aria-label='Shopping Cart'>
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                fill="none"
                                viewBox="0 0 24 24"
                                strokeWidth="1.5"
                                stroke="currentColor"
                                className="w-6 h-6"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-1.5 6h11L17 13M9 21a1 1 0 1 1-2 0 1 1 0 0 1 2 0Zm8 0a1 1 0 1 1-2 0 1 1 0 0 1 2 0Z"
                                />
                            </svg>
                        </button>
                    </Link>
                )}
                
                {/* favourites always visible */}
                <Link href="/favorites">
                    <button className="p-2" style={{ color: brandNavy }} aria-label="Favourites">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"
                             strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                            <path strokeLinecap="round" strokeLinejoin="round"
                                  d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312
                 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3
                 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12Z" />
                        </svg>
                    </button>
                </Link>

                {!user ? (
                    <>
                        <a
                            href="/api/auth/login"
                            style={{ backgroundColor: brandLightPink, color: brandNavy }}
                            className="px-4 py-2 text-sm font-semibold rounded"
                        >
                            Log In
                        </a>
                        <a
                            href="/api/auth/login?screen_hint=signup"
                            style={{ backgroundColor: brandLightPink, color: brandBrown }}
                            className="px-4 py-2 text-sm font-semibold rounded"
                        >
                            Sign Up
                        </a>
                    </>
                ) : (
                    <div className="relative" ref={dropdownRef}>
                        <button
                            onClick={() => setOpen(!open)}
                            className="p-2 flex items-center gap-1"
                            style={{ color: brandNavy }}
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"
                                 strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                                <path strokeLinecap="round" strokeLinejoin="round"
                                      d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501
                   20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0
                   0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
                            </svg>
                            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4"
                                 viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd"
                                      d="M5.23 7.21a.75.75 0 011.06.02L10 10.94l3.71-3.71a.75.75 0
                   011.08 1.04l-4.25 4.25a.75.75 0 01-1.08 0L5.25
                   8.27a.75.75 0 01-.02-1.06z"
                                      clipRule="evenodd" />
                            </svg>
                        </button>

                        {open && (
                            <div className="absolute right-0 mt-2 w-40 bg-white border rounded-md shadow-lg py-1 text-sm">
                                <Link
                                    href="/profile"
                                    className="block px-4 py-2 hover:bg-gray-100"
                                    style={{ color: brandNavy }}
                                    onClick={() => setOpen(false)}
                                >
                                    View Profile
                                </Link>
                                <Link
                                    href="/profile/rentals"
                                    className="block px-4 py-2 hover:bg-gray-100"
                                    style={{ color: brandNavy }}
                                    onClick={() => setOpen(false)}
                                >
                                    Rental Dashboard
                                </Link>
                                <a
                                    href="/api/auth/logout"
                                    className="block px-4 py-2 hover:bg-gray-100"
                                    style={{ color: brandNavy }}
                                >
                                    Logout
                                </a>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </header>
    );
};

/* ============================================
   SIDEBAR & TAB BUTTON
============================================ */
const SidebarItem = ({
                         label,
                         active,
                         onClick,
                     }: {
    label: string;
    active: boolean;
    onClick: () => void;
}) => (
    <div
        onClick={onClick}
        className={`flex items-center p-4 cursor-pointer ${
            active ? 'font-semibold' : 'font-normal'
        } text-black text-lg`}
    >
        <span>{label}</span>
        <span className="ml-auto">
      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16"
           viewBox="0 0 24 24" fill="none" stroke="currentColor"
           strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="9 18 15 12 9 6" />
      </svg>
    </span>
    </div>
);

const TabButton = ({
                       label,
                       active,
                       onClick,
                   }: {
    label: string;
    active: boolean;
    onClick: () => void;
}) => (
    <button
        onClick={onClick}
        className={`py-2 px-4 text-sm font-medium rounded-md ${
            active ? 'text-white' : 'text-gray-800 bg-gray-100'
        }`}
        style={{ backgroundColor: active ? brandNavy : undefined }}
    >
        {label}
    </button>
);

/* ============================================
   CLOSET CARD
============================================ */
const ClosetCard: React.FC<{
    product: ClosetProduct;
    onArchive: (id: number | string) => void;
    onDelete: (id: number | string) => void;
    onEdit: (product: ClosetProduct) => void;
}> = ({ product, onArchive, onDelete, onEdit }) => {
    const [idx, setIdx]   = useState(0);
    const [open, setOpen] = useState(false);
    const ref = useRef<HTMLDivElement | null>(null);

    useEffect(() => {
        if (!open) return;
        const h = (e: MouseEvent) =>
            ref.current && !ref.current.contains(e.target as Node) && setOpen(false);
        document.addEventListener('mousedown', h);
        return () => document.removeEventListener('mousedown', h);
    }, [open]);

    const imgs       = product.images;
    const imgCount   = imgs.length;
    const nextImg    = () => setIdx((idx + 1) % imgCount);
    const prevImg    = () => setIdx((idx - 1 + imgCount) % imgCount);
    const unavailable =
        product.sold || (!product.forSale && !product.forRent);

    return (
        <div ref={ref} className="relative bg-gray-100 rounded-lg border overflow-visible">
            <div className="absolute right-2 top-2 z-50 flex gap-1">
                <button
                    aria-label={`Edit ${product.title || 'draft listing'}`}
                    className="rounded-full bg-white px-2 py-1 text-xs shadow"
                    onClick={() => onEdit(product)}
                    type="button"
                >
                    Edit
                </button>
                {product.status !== 'archived' && (
                    <button
                        aria-label={`Archive ${product.title || 'draft listing'}`}
                        className="rounded-full bg-gray-800 px-2 py-1 text-xs text-white shadow"
                        onClick={() => onArchive(product.id)}
                        type="button"
                    >
                        Archive
                    </button>
                )}
                <button
                    aria-label={`Delete ${product.title || 'draft listing'}`}
                    className="rounded-full bg-red-600 px-2 py-1 text-xs text-white shadow"
                    onClick={() => onDelete(product.id)}
                    type="button"
                >
                    Delete
                </button>
            </div>

            {/* image / carousel */}
            {imgCount ? (
                <div className="relative">
                    <Image
                        src={imgs[idx]}
                        alt={product.title}
                        className="aspect-square w-full object-cover"
                        height={600}
                        unoptimized
                        width={600}
                    />
                    {imgCount > 1 && (
                        <>
                            <button
                                onClick={prevImg}
                                className="absolute left-1 top-1/2 -translate-y-1/2
                  bg-black/70 text-white rounded-full p-1"
                            >
                                <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                    <path
                                        fillRule="evenodd"
                                        d="M12.293 4.293a1 1 0 010 1.414L8.414
                      10l3.879 4.293a1 1 0 11-1.586
                      1.414l-4.5-5a1 1 0
                      010-1.414l4.5-5a1 1 0
                      011.586 0z"
                                        clipRule="evenodd"
                                    />
                                </svg>
                            </button>
                            <button
                                onClick={nextImg}
                                className="absolute right-1 top-1/2 -translate-y-1/2
                  bg-black/70 text-white rounded-full p-1"
                            >
                                <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                    <path
                                        fillRule="evenodd"
                                        d="M7.707 4.293a1 1 0 000 1.414L11.586
                      10l-3.879 4.293a1 1 0
                      001.586 1.414l4.5-5a1 1 0
                      000-1.414l-4.5-5a1 1 0
                      00-1.586 0z"
                                        clipRule="evenodd"
                                    />
                                </svg>
                            </button>
                        </>
                    )}
                </div>
            ) : (
                <div className="bg-gray-200 aspect-square w-full" />
            )}

            {/* title + buy/rent */}
            <div className="p-3">
                <span className="mb-2 inline-block rounded-full bg-white px-2 py-1 text-xs font-medium capitalize text-[#675a5e]">
                    {product.sold ? 'sold' : product.status}
                </span>
                <div className="flex justify-between items-start">
                    <h3 className="text-sm font-medium text-black mb-2 pr-2 line-clamp-2">
                        {product.title || 'Untitled draft'}
                    </h3>
                    <button
                        onClick={() => setOpen(!open)}
                        className="flex items-center gap-1 text-sm text-black"
                    >
                        <span>See more</span>
                        <svg
                            className={`w-5 h-5 transition-transform ${
                                open ? 'rotate-180' : ''
                            }`}
                            viewBox="0 0 20 20"
                            fill="currentColor"
                        >
                            <path
                                fillRule="evenodd"
                                d="M5.23 7.21a.75.75 0 011.06.02L10
                  10.94l3.71-3.71a.75.75 0
                  011.08 1.04l-4.25 4.25a.75.75 0
                  01-1.08 0L5.25 8.27a.75.75 0
                  01-.02-1.06z"
                                clipRule="evenodd"
                            />
                        </svg>
                    </button>
                </div>

                <div className="flex gap-2">
                    {unavailable ? (
                        <div className="bg-gray-300 text-center py-1 px-3 rounded-sm w-full text-sm">
                            Unavailable
                        </div>
                    ) : (
                        <>
                            {product.forSale && (
                                <button
                                    className="text-white text-sm py-1 px-3 rounded-sm flex-1"
                                    style={{ backgroundColor: brandBrown }}
                                >
                                    Buy for ${product.price}
                                </button>
                            )}
                            {product.forRent && (
                                <button
                                    className="border border-gray-400 text-sm py-1 px-3 rounded-sm flex-1"
                                    style={{ color: brandBrown }}
                                >
                                    Rent for ${product.price} Per Day
                                </button>
                            )}
                        </>
                    )}
                </div>
            </div>

            {open && (
                <div
                    className="absolute left-0 right-0 top-full mt-1 bg-gray-100
            border border-gray-300 border-t-0 rounded-b-md p-4
            text-sm text-black z-[100]"
                >
                    {product.sizes?.length && (
                        <p>
                            <strong>Size:</strong> {product.sizes.join(', ')}
                        </p>
                    )}
                    {product.colors?.length && (
                        <p>
                            <strong>Colors:</strong> {product.colors.join(', ')}
                        </p>
                    )}
                    {product.condition && (
                        <p>
                            <strong>Condition:</strong> {product.condition}
                        </p>
                    )}
                    {product.description && (
                        <p>
                            <strong>Description:</strong> {product.description}
                        </p>
                    )}
                </div>
            )}
        </div>
    );
};

/* ============================================
   PROFILE PAGE
============================================ */
const ProfilePage: React.FC = () => {
    const [showListingEditor, setShowListingEditor] = useState(false);
    const [editingListing, setEditingListing] = useState<ListingEditorValues | null>(null);
    const [isSavingListing, setIsSavingListing] = useState(false);
    const [listingRefreshKey, setListingRefreshKey] = useState(0);
    const [sellerMessage, setSellerMessage] = useState('');
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [itemToDelete, setItemToDelete] = useState<number | string | null>(null);
    const { user, isLoading } = useUser();
    const router               = useRouter();

    /* basic profile state */
    const [firstName, setFirstName] = useState('');
    const [lastName,  setLastName ] = useState('');
    const [email,     setEmail    ] = useState('');
    const [bio,       setBio      ] = useState('');

    /* ui state */
    const [activeTab]       = useState('Profile');
    const [activeProfileTab, setActiveProfileTab] = useState< 'My Closet' | 'Following' | 'Followers'>(
        'My Closet'
    );
    const [activeClosetTab, setActiveClosetTab] =
        useState<'All' | 'Published' | 'Drafts' | 'Archived' | 'Sold'>(
            'All'
        );
    const closetTabs = ['All', 'Published', 'Drafts', 'Archived', 'Sold'] as const;

    /* closet data */
    const [closetItems, setClosetItems] = useState<ClosetProduct[]>([]);
    const [friends,   setFriends  ] = useState<Friend[]>([]);
    const [followers,   setFollowers  ] = useState<Friend[]>([]);

    // reusable confirmation model
    const ConfirmationModal: React.FC<{
        open: boolean;
        onClose: () => void;
        onConfirm: () => void;
        message: string;
    }> = ({ open, onClose, onConfirm, message }) => {
        if (!open) return null;
    
        return createPortal(
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
                <div className="bg-white w-full max-w-md rounded-lg shadow-lg p-6 space-y-4">
                    <p className="text-lg text-gray-800">{message}</p>
                    <div className="flex justify-end gap-4">
                        <button
                            onClick={onClose}
                            className="px-4 py-2 rounded border"
                            style={{ color: brandBrown, borderColor: brandBrown }}
                        >
                            Cancel
                        </button>
                        <button
                            onClick={onConfirm}
                            className="px-4 py-2 rounded text-white"
                            style={{ backgroundColor: brandBrown }}
                        >
                            Confirm
                        </button>
                    </div>
                </div>
            </div>,
            document.body
        );
    };

    // Redirect to continue account creation page if new user
    // Otherwise display profile name
    useEffect(() => {
        if (!isLoading && user) {
            const newUserCompleted = sessionStorage.getItem('newuser_complete');
            setEmail(user.email || ''); // email from Auth0
            console.log("here: email - " + user.email);

            // Get specific user information from db - O.C.
            fetch(apiUrl(`/api/profile?email=${user.email}`))
            .then(response => response.json())
            .then(data => {
                // I added code in auth0 that stores first_login claim - O.C.
                const firstLogin = user['http://localhost:3000/first_login'];
                // Redirect to continue account creation page (where new users are saved to db after completion) - O.C.
                if (data.users.length <= 0 && (firstLogin && !newUserCompleted)) {
                    router.push('/users/new');

                } else { // otherwise stay on profile page with subsequent logins
                    console.log("returned: " + data.users[0]); // 1 user should be returned (1 account per email)
                    setFirstName(data.users[0].first_name);
                    setLastName(data.users[0].last_name);
                    setBio(data.users[0].bio);
                }
            })
            .catch(error => console.error('Error:', error));
         }
     }, [user, isLoading, router]);

    /* fetch user’s closet */
    useEffect(() => {
        if (!user) return;
        fetch(apiUrl('/api/profile/listings'))
            .then(async (response) => {
                const data = await response.json();
                if (!response.ok) throw new Error(data.error || 'Could not load listings');
                return data;
            })
            .then((data) => {
                const transformed: ClosetProduct[] = data.listings.map((p: any) => ({
                    id        : p.post_id,
                    title     : p.title,
                    price     : p.price === null ? '' : String(p.price),
                    forSale   : p.sflag === 1,
                    forRent   : p.bflag === 1,
                    sold      : p.sold === 1,
                    images    : p.images,
                    type      : getUIType(p.categories)[0] || 'Tops',
                    audience  : getUIAudience(p.categories)[0] || "Women's",
                    colors    : getUIColors(p.categories),
                    sizes     : p.size ? [p.size] : [],
                    condition : p.item_condition || 'new',
                    description: p.description,
                    status    : p.listing_status,
                }));
                setClosetItems(transformed);
            })
            .catch((error) => setSellerMessage(error.message));
    }, [user, listingRefreshKey]);

    /* fetch user friend list */
    useEffect(() => {
        if(!user) return;
        fetch(apiUrl(`/api/profile/friends?email=${user.email}`))
            .then((r) => r.json())
            .then((data) => {
                setFriends(data.friends);
            })
    }, [user]);

    /* fetch user followers list */
    useEffect(() => {
        if(!user) return;
        fetch(apiUrl(`/api/profile/followers?email=${user.email}`))
            .then((r) => r.json())
            .then((data) => {
                setFollowers(data.followers);
            })
    }, [user]);


    /* filtered view */
    const filtered = closetItems.filter((item) => {
        if (activeClosetTab === 'All') return true;
        if (activeClosetTab === 'Published') return item.status === 'published' && !item.sold;
        if (activeClosetTab === 'Drafts') return item.status === 'draft';
        if (activeClosetTab === 'Archived') return item.status === 'archived';
        return Boolean(item.sold);
    });

    /* loading / unauth */
    if (isLoading)
        return (
            <div
                style={{ color: brandBrown }}
                className="min-h-screen flex items-center justify-center"
            >
                Loading…
            </div>
        );

    if (!user) return null;

    function listingEditorValues(product: ClosetProduct): ListingEditorValues {
        return {
            id: product.id,
            title: product.title,
            price: product.price,
            forSale: product.forSale,
            forRent: product.forRent,
            type: product.type || 'Tops',
            audience: product.audience || "Women's",
            colors: product.colors || [],
            size: product.sizes?.[0] || 'Medium',
            condition: product.condition || 'new',
            description: product.description || '',
            existingImages: product.images,
            newImages: [],
        };
    }

    async function saveListing(
        listing: ListingEditorValues,
        status: 'draft' | 'published',
    ) {
        const formData = new FormData();
        formData.set('title', listing.title);
        formData.set('price', listing.price);
        formData.set('forSale', String(listing.forSale));
        formData.set('forRent', String(listing.forRent));
        formData.set('itemCondition', listing.condition);
        formData.set('size', listing.size);
        formData.set('description', listing.description);
        formData.set('categories', JSON.stringify(
            getDBCategories(listing.type, listing.audience, listing.colors),
        ));
        formData.set('existingImages', JSON.stringify(listing.existingImages));
        formData.set('status', status);
        listing.newImages.forEach((image) => formData.append('images', image));

        setIsSavingListing(true);
        setSellerMessage('');
        try {
            const isEditing = listing.id !== undefined;
            const response = await fetch(
                isEditing
                    ? apiUrl(`/api/profile/listings/${listing.id}`)
                    : apiUrl('/api/profile/listings'),
                {
                    method: isEditing ? 'PUT' : 'POST',
                    body: formData,
                },
            );
            const result = await response.json();
            if (!response.ok) throw new Error(result.error || 'Could not save the listing');

            setShowListingEditor(false);
            setEditingListing(null);
            setSellerMessage(status === 'published' ? 'Listing published.' : 'Draft saved.');
            setListingRefreshKey((current) => current + 1);
        } finally {
            setIsSavingListing(false);
        }
    }

    async function archiveListing(postId: number | string) {
        setSellerMessage('');
        try {
            const response = await fetch(apiUrl(`/api/profile/listings/${postId}/status`), {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: 'archived' }),
            });
            const result = await response.json();
            if (!response.ok) throw new Error(result.error || 'Could not archive the listing');
            setSellerMessage('Listing archived.');
            setListingRefreshKey((current) => current + 1);
        } catch (error) {
            setSellerMessage(error instanceof Error ? error.message : 'Could not archive the listing');
        }
    }

    async function deleteListing(postId: number | string) {
        const response = await fetch(apiUrl(`/api/profile/listings/${postId}`), {
            method: 'DELETE',
        });
        if (!response.ok) {
            const result = await response.json();
            throw new Error(result.error || 'Could not delete the listing');
        }
        setClosetItems((current) => current.filter((item) => item.id !== postId));
        setSellerMessage('Listing deleted.');
    }

    /* page */
    return (
        <div className="min-h-screen bg-white">
            <Header />

            <div className="container mx-auto py-6 px-4">
                <h1 style={{ color: brandBrown }} className="text-4xl font-medium mb-8">
                    My Account
                </h1>

                <div className="flex flex-col md:flex-row gap-8">
                    {/* sidebar */}
                    <div className="w-full md:w-1/4 border rounded-lg overflow-hidden">
                        <SidebarItem
                            label="Profile"
                            active
                            onClick={() => router.push('/profile')}
                        />
                        <SidebarItem
                            label="Order History"
                            active={false}
                            onClick={() => router.push('/profile/order-history')}
                        />
                        <SidebarItem
                            label="Seller History"
                            active={false}
                            onClick={() => router.push('/profile/seller-history')}
                        />
                        <SidebarItem
                            label="Rental Dashboard"
                            active={false}
                            onClick={() => router.push('/profile/rentals')}
                        />
                    </div>

                    {/* main */}
                    <div className="w-full md:w-3/4">
                        {/* profile header */}
                        <div className="flex items-center mb-8">
                            <div className="w-24 h-24 rounded-full overflow-hidden bg-gray-200 mr-6 border-4 border-white shadow-lg flex items-center justify-center">
                                <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    strokeWidth="1.5"
                                    stroke="currentColor"
                                    className="size-9"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0
                      0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1
                      14.998 0A17.933 17.933 0 0 1 12
                      21.75c-2.676 0-5.216-.584-7.499-1.632Z"
                                    />
                                </svg>
                            </div>
                            <div>
                                <h2
                                    style={{ color: brandBrown }}
                                    className="text-2xl font-semibold mb-2"
                                >
                                    {firstName || 'Full'} {lastName || 'Name'}
                                </h2>
                                <div className="flex items-center text-sm text-gray-600">
                                    <svg
                                        xmlns="http://www.w3.org/2000/svg"
                                        width="16"
                                        height="16"
                                        viewBox="0 0 24 24"
                                        fill="none"
                                        stroke="currentColor"
                                        strokeWidth="2"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        className="mr-2"
                                    >
                                        <path d="M4 4h16c1.1 0 2 .9 2 2v12c0
                                                1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2
                                                2-2z" />
                                        <polyline points="22,6 12,13 2,6" />
                                    </svg>
                                    {email}
                                </div>
                                <div className="flex items-center text-sm text-gray-600 mt-2">
                                    <span className="mr-2">Rating:</span>
                                    <div className="flex gap-1">
                                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="size-6">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 0 1 1.04 0l2.125 5.111a.563.563 0 0 0 .475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 0 0-.182.557l1.285 5.385a.562.562 0 0 1-.84.61l-4.725-2.885a.562.562 0 0 0-.586 0L6.982 20.54a.562.562 0 0 1-.84-.61l1.285-5.386a.562.562 0 0 0-.182-.557l-4.204-3.602a.562.562 0 0 1 .321-.988l5.518-.442a.563.563 0 0 0 .475-.345L11.48 3.5Z" />
                                        </svg>
                                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="size-6">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 0 1 1.04 0l2.125 5.111a.563.563 0 0 0 .475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 0 0-.182.557l1.285 5.385a.562.562 0 0 1-.84.61l-4.725-2.885a.562.562 0 0 0-.586 0L6.982 20.54a.562.562 0 0 1-.84-.61l1.285-5.386a.562.562 0 0 0-.182-.557l-4.204-3.602a.562.562 0 0 1 .321-.988l5.518-.442a.563.563 0 0 0 .475-.345L11.48 3.5Z" />
                                        </svg>
                                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="size-6">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 0 1 1.04 0l2.125 5.111a.563.563 0 0 0 .475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 0 0-.182.557l1.285 5.385a.562.562 0 0 1-.84.61l-4.725-2.885a.562.562 0 0 0-.586 0L6.982 20.54a.562.562 0 0 1-.84-.61l1.285-5.386a.562.562 0 0 0-.182-.557l-4.204-3.602a.562.562 0 0 1 .321-.988l5.518-.442a.563.563 0 0 0 .475-.345L11.48 3.5Z" />
                                        </svg>
                                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="size-6">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 0 1 1.04 0l2.125 5.111a.563.563 0 0 0 .475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 0 0-.182.557l1.285 5.385a.562.562 0 0 1-.84.61l-4.725-2.885a.562.562 0 0 0-.586 0L6.982 20.54a.562.562 0 0 1-.84-.61l1.285-5.386a.562.562 0 0 0-.182-.557l-4.204-3.602a.562.562 0 0 1 .321-.988l5.518-.442a.563.563 0 0 0 .475-.345L11.48 3.5Z" />
                                        </svg>
                                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="size-6">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 0 1 1.04 0l2.125 5.111a.563.563 0 0 0 .475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 0 0-.182.557l1.285 5.385a.562.562 0 0 1-.84.61l-4.725-2.885a.562.562 0 0 0-.586 0L6.982 20.54a.562.562 0 0 1-.84-.61l1.285-5.386a.562.562 0 0 0-.182-.557l-4.204-3.602a.562.562 0 0 1 .321-.988l5.518-.442a.563.563 0 0 0 .475-.345L11.48 3.5Z" />
                                        </svg>
                                        <span className="ml-2">_ / 5</span>
                                    </div>
                                </div>
                                <p className="mt-2 text-gray-600">{bio}</p>
                            </div>
                        </div>

                        {/* closet nav */}
                        <div className="mb-6 border-b">
                            <div className="flex gap-4">
                                <button
                                    className={`pb-2 px-1 font-medium text-xl ${
                                        activeProfileTab === 'My Closet' ? 'border-b-2' : ''
                                    }`}
                                    style={{
                                        color: brandNavy,
                                        borderColor:
                                            activeProfileTab === 'My Closet' ? brandNavy : undefined,
                                    }}
                                    onClick={() => setActiveProfileTab('My Closet')}
                                >
                                    My Closet
                                </button>
                                <button
                                    className={`pb-2 px-1 font-medium text-xl ${
                                        activeProfileTab === 'Following' ? 'border-b-2' : ''
                                    }`}
                                    style={{ 
                                        color: brandNavy,
                                        borderColor:
                                            activeProfileTab === 'Following' ? brandNavy : undefined,
                                     }}
                                    onClick={() => setActiveProfileTab('Following')}
                                >
                                    Following
                                </button>
                                <button
                                    className={`pb-2 px-1 font-medium text-xl ${
                                        activeProfileTab === 'Followers' ? 'border-b-2' : ''
                                    }`}
                                    style={{ 
                                        color: brandNavy,
                                        borderColor:
                                            activeProfileTab === 'Followers' ? brandNavy : undefined,
                                     }}
                                    onClick={() => setActiveProfileTab('Followers')}
                                >
                                    Followers
                                </button>
                            </div>
                        </div>

                        {/* filter tabs */}
                        {activeProfileTab === 'My Closet' && (
                            <div className="mb-6 flex flex-wrap gap-2">
                                {closetTabs.map((t) => (
                                    <TabButton
                                        key={t}
                                        label={t}
                                        active={activeClosetTab === t}
                                        onClick={() =>
                                            setActiveClosetTab(t as typeof activeClosetTab)
                                        }
                                    />
                                ))}
                            </div>
                        )}

                        {activeProfileTab === 'My Closet' && sellerMessage && (
                            <p
                                className="mb-4 rounded-md bg-[#fdf5f3] px-4 py-3 text-sm text-[#675a5e]"
                                role="status"
                            >
                                {sellerMessage}
                            </p>
                        )}
                        
                        {/* grid */}
                        {activeProfileTab === 'My Closet' && (
                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                                {filtered.map((p) => (
                                    <ClosetCard
                                        key={p.id}
                                        product={p}
                                        onArchive={(id) => archiveListing(id)}
                                        onDelete={(id) => {
                                            setItemToDelete(id);
                                            setShowDeleteModal(true);
                                        }}
                                        onEdit={(product) => {
                                            setEditingListing(listingEditorValues(product));
                                            setShowListingEditor(true);
                                        }}
                                    />
                                ))}

                                <button
                                    className="flex aspect-square items-center justify-center rounded-lg bg-gray-100"
                                    onClick={() => {
                                        setEditingListing(null);
                                        setShowListingEditor(true);
                                    }}
                                    type="button"
                                >
                                    <div className="flex flex-col items-center">
                                        <svg
                                            xmlns="http://www.w3.org/2000/svg"
                                            width="40"
                                            height="40"
                                            viewBox="0 0 24 24"
                                            fill="none"
                                            stroke="currentColor"
                                            strokeWidth="1"
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            className="text-gray-600"
                                        >
                                            <line x1="12" y1="5" x2="12" y2="19" />
                                            <line x1="5" y1="12" x2="19" y2="12" />
                                        </svg>
                                        <p className="mt-2 text-sm text-gray-600">
                                            Create a new listing
                                        </p>
                                    </div>
                                </button>
                            </div>
                        )}
                        <ListingEditorModal
                            initialListing={editingListing}
                            isSaving={isSavingListing}
                            open={showListingEditor}
                            onClose={() => {
                                setShowListingEditor(false);
                                setEditingListing(null);
                            }}
                            onSave={saveListing}
                        />

                        <ConfirmationModal
                            open={showDeleteModal}
                            onClose={() => setShowDeleteModal(false)}
                            onConfirm={() => {
                                if (itemToDelete !== null) {
                                    deleteListing(itemToDelete)
                                        .catch((error) => setSellerMessage(error.message))
                                        .finally(() => {
                                            setShowDeleteModal(false);
                                            setItemToDelete(null);
                                        });
                                }
                            }}
                            message="Are you sure you want to delete this item?"
                        />

                        {/* Friends list */}
                        {activeProfileTab === 'Following' && (
                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                                {friends.map((friend, index) => (
                                    <div
                                        key={index}
                                        className="bg-gray-100 rounded-lg p-4 flex flex-col items-center text-center"
                                    >
                                        {/* Placeholder for profile image */}
                                        <div className="w-20 h-20 rounded-full bg-gray-300 flex items-center justify-center mb-4">
                                            <svg
                                                xmlns="http://www.w3.org/2000/svg"
                                                fill="none"
                                                viewBox="0 0 24 24"
                                                strokeWidth="1.5"
                                                stroke="currentColor"
                                                className="w-10 h-10 text-gray-500"
                                            >
                                                <path
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                    d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501
                                                    20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0
                                                    0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z"
                                                />
                                            </svg>
                                        </div>

                                        {/* Friend's name */}
                                        <h3 className="text-lg font-medium text-gray-800">
                                            {friend.first_name} {friend.last_name}
                                        </h3>

                                        {/* Friend's email */}
                                        <p className="text-sm text-gray-600">{friend.email}</p>

                                        {/* Placeholder for profile link */}
                                        <button
                                            className="mt-4 px-4 py-2 text-sm font-medium text-white rounded-md"
                                            style={{ backgroundColor: brandNavy }}
                                            onClick={() => {
                                                // Handle profile navigation
                                                router.push(`/profile/${friend.email}`);
                                                console.log(`Navigate to profile of ${friend.email}`);
                                            }}
                                        >
                                            View Profile
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Friends list */}
                        {activeProfileTab === 'Followers' && (
                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                                {followers.map((follower, index) => (
                                    <div
                                        key={index}
                                        className="bg-gray-100 rounded-lg p-4 flex flex-col items-center text-center"
                                    >
                                        {/* Placeholder for profile image */}
                                        <div className="w-20 h-20 rounded-full bg-gray-300 flex items-center justify-center mb-4">
                                            <svg
                                                xmlns="http://www.w3.org/2000/svg"
                                                fill="none"
                                                viewBox="0 0 24 24"
                                                strokeWidth="1.5"
                                                stroke="currentColor"
                                                className="w-10 h-10 text-gray-500"
                                            >
                                                <path
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                    d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501
                                                    20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0
                                                    0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z"
                                                />
                                            </svg>
                                        </div>

                                        {/* Friend's name */}
                                        <h3 className="text-lg font-medium text-gray-800">
                                            {follower.first_name} {follower.last_name}
                                        </h3>

                                        {/* Friend's email */}
                                        <p className="text-sm text-gray-600">{follower.email}</p>

                                        {/* Placeholder for profile link */}
                                        <button
                                            className="mt-4 px-4 py-2 text-sm font-medium text-white rounded-md"
                                            style={{ backgroundColor: brandNavy }}
                                            onClick={() => {
                                                // Handle profile navigation
                                                router.push(`/profile/${follower.email}`);
                                                console.log(`Navigate to profile of ${follower.email}`);
                                            }}
                                        >
                                            View Profile
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <SiteFooter />
        </div>
    );
};

export default withPageAuthRequired(ProfilePage);
