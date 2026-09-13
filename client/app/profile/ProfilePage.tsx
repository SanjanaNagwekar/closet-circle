'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useUser, withPageAuthRequired } from '@auth0/nextjs-auth0/client';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

/* ============================================
   BRAND COLORS
============================================ */
const brandNavy = '#284472';
const brandLightPink = "#fdf5f3";
const brandPink = "#FDEEEA";
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
}

interface Friend {
    email       : string;
    first_name  : string;
    last_name   : string;
    profile_url : string | null;
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
                    <img
                        src="https://cdn.builder.io/api/v1/image/assets/TEMP/cbcbc59fadb92cbfa94f7a46414d883263e97dc4"
                        alt="Closet Circle"
                        className="w-[200px] h-auto"
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
const ClosetCard: React.FC<{ product: ClosetProduct; onDelete: (id: number | string) => void }> = ({ product, onDelete }) => {
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
            {/* Delete Button */}
            <button
                onClick={() => onDelete(product.id)}
                className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 shadow-md z-50"
                aria-label="Delete Item"
            >
                <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth="1.5"
                    stroke="currentColor"
                    className="w-4 h-4"
                >
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M6 18L18 6M6 6l12 12"
                    />
                </svg>
            </button>

            {/* image / carousel */}
            {imgCount ? (
                <div className="relative">
                    <img
                        src={imgs[idx]}
                        alt={product.title}
                        className="aspect-square w-full object-cover"
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
                <div className="flex justify-between items-start">
                    <h3 className="text-sm font-medium text-black mb-2 pr-2 line-clamp-2">
                        {product.title}
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
   FOOTER
============================================ */
const FooterColumn: React.FC<{ title: string; links: string[] }> = ({
                                                                        title,
                                                                        links,
                                                                    }) => (
    <div className="flex-1">
        <h3 className="mb-5 text-xs tracking-normal leading-4 text-white uppercase">
            {title}
        </h3>
        <ul className="flex flex-col gap-1 text-sm leading-5 text-neutral-400">
            {links.map((l) => (
                <li key={l}>
                    <a href="#" className="hover:text-white transition-colors">
                        {l}
                    </a>
                </li>
            ))}
        </ul>
    </div>
);

const NewsletterForm: React.FC = () => {
    const [email, setEmail] = useState('');
    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        setEmail('');
    };
    return (
        <form onSubmit={submit} className="flex flex-col gap-5">
            <div className="flex flex-col gap-1.5">
                <div className="flex px-3.5 py-3 border border-neutral-300">
                    <input
                        type="email"
                        placeholder="Enter your email address"
                        className="flex-1 text-sm leading-5 text-black bg-transparent"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                    />
                </div>
                <p className="text-sm leading-5 text-neutral-400">
                    By signing up, you agree to our{' '}
                    <a href="#" className="underline">
                        Privacy Policy
                    </a>{' '}
                    and{' '}
                    <a href="#" className="underline">
                        Terms of Service
                    </a>
                    .
                </p>
            </div>
            <button
                type="submit"
                className="px-5 py-3 text-base leading-5 bg-white w-fit"
                style={{ backgroundColor: brandLightPink, color: brandNavy }}
            >
                Subscribe
            </button>
        </form>
    );
};

const Footer: React.FC = () => (
    <footer
        style={{ backgroundColor: brandNavy }}
        className="px-0 pt-20 pb-11 border border-orange-950"
    >
        <div className="flex justify-between px-10 max-md:flex-col max-md:gap-10">
            <div className="flex gap-6 max-md:flex-col">
                <FooterColumn
                    title="CONTACT US"
                    links={['+1 (844) 326-6000', 'Email Us', 'Mon-Fri 9am-3pm PT']}
                />
                <FooterColumn
                    title="CUSTOMERS"
                    links={['Start a Return', 'Return Policy', 'FAQ']}
                />
                <FooterColumn
                    title="COMPANY"
                    links={['About Us', 'Sustainability', 'Careers']}
                />
            </div>
            <div className="px-6 w-[491px] max-md:w-full">
                <h3 className="mb-6 text-base leading-6 text-white">
                    Get the latest news from us
                </h3>
                <NewsletterForm />
            </div>
        </div>
        <div className="px-10 mt-20 text-sm leading-5 text-neutral-600">©CEIN</div>
    </footer>
);

/* ============================================
   ADD-PRODUCT MODAL
   (put this just above ProfilePage in page.tsx
   or extract to components/AddProductModal.tsx)
============================================ */
import { createPortal } from 'react-dom';


/* ----- dropdown option sets (mirrors ExplorePage) ----- */
const colorOptions     = ['black','white','red','blue','green','pink'];
const sizeOptions      = ['XX-Small','X-Small','Small','Medium','Large','X-Large','XX-Large','3X-Large','4X-Large'];
const conditionOptions = ['Brand new','Used – Like new','Used – Good','Used – Fair'];


/* ----- local type (id comes from parent) ----- */
type NewProduct = Omit<ClosetProduct, 'id'>;

const emptyProduct: NewProduct = {
    title : '',
    price : '', 
    forSale: true,
    forRent: false,
    type  : 'Tops',
    audience: "Women's",
    colors: [],
    sizes : [],
    condition: conditionOptions[0],
    description: '',
    images: [''],
};

interface AddProductModalProps {
    open: boolean;
    onClose: () => void;
    onSave: (p: NewProduct) => void;
}

export const AddProductModal: React.FC<AddProductModalProps> = ({ open, onClose, onSave }) => {
    const [draft,  setDraft ] = useState<NewProduct>(emptyProduct);
    const [errors, setErrors] = useState<Record<string,string>>({});

    /* -------- helpers -------- */
    const update  = <K extends keyof NewProduct>(field: K, value: NewProduct[K]) =>
        setDraft(prev => ({ ...prev, [field]: value }));

    const outline = `border-2 rounded px-2 py-1 w-full focus:outline-none`;

    const validate = (p: NewProduct) => {
        const e: Record<string,string> = {};
        if (!p.title.trim())   e.title    = 'Title is required';
        if (!p.price || Number(p.price) <= 0) e.price = 'Price must be greater than 0';
        if (!p.forSale && !p.forRent)     e.saleRent = 'Select at least one';
        if (p.colors == undefined || p.colors.length === 0)        e.colors   = 'Choose at least one colour';
        if (p.sizes == undefined || p.sizes.length  === 0)        e.sizes    = 'Choose at least one size';
        if (!p.images[0].trim())          e.images   = 'At least one image URL is required';
        return e;
    };

    const resetAndClose = () => {
        setDraft(emptyProduct);
        setErrors({});
        onClose();
    };

    if (!open) return null;

    return createPortal(
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
            <div
                className="bg-white w-full max-w-lg rounded-lg shadow-lg p-6 overflow-y-auto max-h-[90vh] space-y-4"
                style={{ color: brandBrown }}
            >
                <h2 className="text-2xl font-semibold mb-2">Add a new item</h2>

                {/* ---------- TITLE ---------- */}
                <label className="block">
                    <span className="font-medium">Title</span>
                    <input
                        className={outline}
                        style={{ borderColor: errors.title ? 'red' : brandLightBrown }}
                        value={draft.title}
                        onChange={e => update('title', e.target.value)}
                    />
                    {errors.title && <p className="text-sm text-red-600">{errors.title}</p>}
                </label>

                {/* ---------- PRICE ---------- */}
                <label className="block">
                    <span className="font-medium">Price ($)</span>
                    <input
                        type="number"
                        min={0}
                        className={outline}
                        style={{ borderColor: errors.price ? 'red' : brandLightBrown }}
                        value={draft.price}
                        onChange={e => {
                            const val = e.target.value;
                            // ensure only digits or empty strings and replace leading 0's
                            if (/^\d*$/.test(val)) update('price', val.replace(/^0+(?=\d)/, '')); 
                        }}
                        placeholder="Enter price"
                    />
                    {errors.price && <p className="text-sm text-red-600">{errors.price}</p>}
                </label>


                {/* ---------- SALE / RENT ---------- */}
                <div className="flex gap-20">
                    <label className="flex items-center gap-2">
                        <input
                            type="radio"
                            name="radioSellRent"
                            checked={draft.forSale}
                            onChange={e => {
                                update('forSale', true);
                                update('forRent', false);
                                }
                            }
                        /> For&nbsp;Sale
                    </label>
                    <label className="flex items-center gap-2">
                        <input
                            type="radio"
                            name="radioSellRent"
                            checked={draft.forRent}
                            onChange={e => {
                                update('forRent', true);
                                update('forSale', false);
                                }
                            }
                        /> For&nbsp;Rent
                    </label>
                </div>
                {errors.saleRent && <p className="text-sm text-red-600">{errors.saleRent}</p>}

                {/* ---------- TYPE & AUDIENCE ---------- */}
                <div className="flex gap-4">
                    <label className="flex-1">
                        <span className="font-medium">Type</span>
                        <select
                            className={outline}
                            style={{ borderColor: brandLightBrown }}
                            value={draft.type}
                            onChange={e => update('type', e.target.value as NewProduct['type'])}
                        >
                            {['Tops','Bottoms','Outerwear','Dresses','Shoes','Accessories'].map(t=>(
                                <option key={t}>{t}</option>
                            ))}
                        </select>
                    </label>

                    <label className="flex-1">
                        <span className="font-medium">Audience</span>
                        <select
                            className={outline}
                            style={{ borderColor: brandPink }}
                            value={draft.audience}
                            onChange={e => update('audience', e.target.value as NewProduct['audience'])}
                        >
                            {["Men's","Women's","Kids"].map(a=>(
                                <option key={a}>{a}</option>
                            ))}
                        </select>
                    </label>
                </div>

                {/* ---------- COLOURS ---------- */}
                <label className="block">
                    <span className="font-medium">Colours (⌘/Ctrl-click for multiple)</span>
                    <select
                        multiple
                        className={outline}
                        style={{ borderColor: errors.colors ? 'red' : brandLightBrown, height: '6rem' }}
                        value={draft.colors}
                        onChange={e => update(
                            'colors',
                            Array.from(e.target.selectedOptions).map(o=>o.value)
                        )}
                    >
                        {colorOptions.map(c => <option key={c}>{c}</option>)}
                    </select>
                    {errors.colors && <p className="text-sm text-red-600">{errors.colors}</p>}
                </label>

                {/* ---------- SIZES ---------- */}
                <label className="block">
                    <span className="font-medium">Sizes</span>
                    <select
                        multiple
                        className={outline}
                        style={{ borderColor: errors.sizes ? 'red' : brandLightBrown, height: '8rem' }}
                        value={draft.sizes}
                        onChange={e => update(
                            'sizes',
                            Array.from(e.target.selectedOptions).map(o=>o.value)
                        )}
                    >
                        {sizeOptions.map(s => <option key={s}>{s}</option>)}
                    </select>
                    {errors.sizes && <p className="text-sm text-red-600">{errors.sizes}</p>}
                </label>

                {/* ---------- CONDITION ---------- */}
                <label className="block">
                    <span className="font-medium">Condition</span>
                    <select
                        className={outline}
                        style={{ borderColor: brandLightBrown }}
                        value={draft.condition}
                        onChange={e => update('condition', e.target.value)}
                    >
                        {conditionOptions.map(c => <option key={c}>{c}</option>)}
                    </select>
                </label>

                {/* ---------- DESCRIPTION ---------- */}
                <label className="block">
                    <span className="font-medium">Description</span>
                    <textarea
                        className={outline + ' min-h-[80px]'}
                        style={{ borderColor: brandLightBrown }}
                        value={draft.description}
                        onChange={e => update('description', e.target.value)}
                    />
                </label>

                {/* ---------- IMAGES ---------- */}
                <label className="block">
                    <span className="font-medium">Image URLs (first required)</span>
                    {draft.images.map((url, i) => (
                        <input
                            key={i}
                            className={outline + ' mt-1'}
                            style={{ borderColor: (errors.images && i===0) ? 'red' : brandLightBrown }}
                            placeholder={`Image ${i+1} URL`}
                            value={url}
                            onChange={e => {
                                const next = [...draft.images];
                                next[i] = e.target.value;
                                update('images', next);
                            }}
                        />
                    ))}
                    {errors.images && <p className="text-sm text-red-600">{errors.images}</p>}
                    <button
                        type="button"
                        onClick={() => update('images', [...draft.images, ''])}
                        className="mt-1 underline text-sm"
                    >
                        + Add another image
                    </button>
                </label>

                {/* ---------- ACTION BUTTONS ---------- */}
                <div className="flex justify-end gap-3 pt-2">
                    <button
                        onClick={resetAndClose}
                        className="px-4 py-2 rounded border"
                        style={{ color: brandBrown, borderColor: brandBrown }}
                    >
                        Cancel
                    </button>

                    <button
                        onClick={()=>{
                            const errs = validate(draft);
                            if (Object.keys(errs).length) { setErrors(errs); return; }
                            //console.log(draft);
                            // console.log(draft.audience);
                            onSave(draft);
                            resetAndClose();
                        }}
                        className="px-4 py-2 rounded text-white"
                        style={{ backgroundColor: brandBrown }}
                    >
                        
                        Save
                    </button>
                </div>
            </div>
        </div>,
        document.body
    );
};

/* ============================================
   PROFILE PAGE
============================================ */
const ProfilePage: React.FC = () => {
    const [showAddModal, setShowAddModal] = useState(false);
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
        useState<'All' | 'Available' | 'For Rent' | 'Sold'>(
            'All'
        );
    const closetTabs = ['All', 'Available', 'For Rent', 'Sold'] as const;

    /* closet data */
    const [closetItems, setClosetItems] = useState<ClosetProduct[]>([]);
    const [friends,   setFriends  ] = useState<Friend[]>([]);
    const [followers,   setFollowers  ] = useState<Friend[]>([]);

    const [unavailablePostIDs, setUnavailableArr] = useState<Number[]>([]);

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

    // Ensure user is logged in - O.C.
    if (!user) {
        return;
    }

    // Check if new user has completed account creation - O.C.
    const newUserCompleted = sessionStorage.getItem("newuser_complete");

    // Redirect to continue account creation page if new user
    // Otherwise display profile name
    useEffect(() => {
        if (!isLoading && user) {
            setEmail(user.email || ''); // email from Auth0
            console.log("here: email - " + user.email);

            // Get specific user information from db - O.C.
            fetch(`http://localhost:8800/api/profile?email=${user.email}`)
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

    /* fetch unavailable items */
    useEffect(() => {
        if (!user) return;
        fetch(`http://localhost:8800/api/profile/seller-history?email=${user.email}`)
                .then((response) => response.json())
                .then((data) => {
                    console.log('Fetched sold posts: ', data);
        
                    if (!Array.isArray(data.orders)) {
                        console.error("Invalid data format:", data);
                        return;
                    }

                    // IDs of unavailable items (to be marked as sold)
                    setUnavailableArr(data.orders.map((item: { post_id: any; }) => item.post_id));
                })
                .catch((error) => console.log('Error fetching ordered items: ', error));
    }, [user]);

    /* fetch user’s closet */
    useEffect(() => {
        if (!user) return;
        fetch(`http://localhost:8800/api/profile/posts?ownerID=${user.email}`)
            .then((r) => r.json())
            .then((data) => {
                console.log(data);
                const transformed: ClosetProduct[] = data.posts.map((p: any) => ({
                    id        : p.post_id,
                    title     : p.title,
                    price     : p.price ?? 20,
                    forSale   : p.sflag === 1,
                    forRent   : p.bflag === 1,
                    sold      : unavailablePostIDs.includes(p.post_id),//p.sold ?? false,
                    images    : p.images,
                    type      : getUIType(p.categories),
                    audience  : getUIAudience(p.categories),
                    colors    : getUIColors(p.categories),
                    sizes     : [p.size],
                    condition : getUICondition(p.item_condition),
                    description: p.description,
                }));
                
                setClosetItems(
                    transformed.length ? [...transformed] : []
                );
            })
            .catch(console.error);
    }, [user, unavailablePostIDs]);

    /* fetch user friend list */
    useEffect(() => {
        if(!user) return;
        fetch(`http://localhost:8800/api/profile/friends?email=${user.email}`)
            .then((r) => r.json())
            .then((data) => {
                setFriends(data.friends);
            })
    }, [user]);

    /* fetch user followers list */
    useEffect(() => {
        if(!user) return;
        fetch(`http://localhost:8800/api/profile/followers?email=${user.email}`)
            .then((r) => r.json())
            .then((data) => {
                setFollowers(data.followers);
            })
    }, [user]);


    /* filtered view */
    const filtered = closetItems.filter((item) => {
        if (activeClosetTab === 'All') return true;
        if (activeClosetTab === 'Available') return !item.sold;
        if (activeClosetTab === 'For Rent') return item.forRent && !item.sold;
        return item.sold;
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

    // Format date yyyy-mm-dd
    function getFormattedDate() {
        const date = new Date();
        const month = date.getMonth() + 1;
        const day = date.getDate();
        const yr = date.getFullYear();
        const formattedDate = `${yr}-${month}-${day}`
        return formattedDate;
    }

    // map UI labels to db values
    const audienceMap = [
        { label: "Women's", db_val: 1 },
        { label: "Men's", db_val: 2 },
        { label: "Kids", db_val: 3 }
    ];

    const typesMap = [
        { label: "Tops", db_val: 4 },
        { label: "Bottoms", db_val: 5 },
        { label: "Outerwear", db_val: 6 },
        { label: "Dresses", db_val: 7 },
        { label: "Shoes", db_val: 8 },
        { label: "Accessories", db_val: 9 }
    ];

    const colorsMap = [
        { label: colorOptions[0], db_val: 10 },
        { label: colorOptions[1], db_val: 11 },
        { label: colorOptions[2], db_val: 12 },
        { label: colorOptions[3], db_val: 13 },
        { label: colorOptions[4], db_val: 14 },
        { label: colorOptions[5], db_val: 15 }
    ];

    // array of all mappings
    const dbCategories = audienceMap.concat(typesMap, colorsMap);

    const dbConditionVals = [
        { label: conditionOptions[0], db_val: "new"},
        { label: conditionOptions[1], db_val: "excellent"},
        { label: conditionOptions[2], db_val: "good"},
        { label: conditionOptions[3], db_val: "worn"},
    ];

    /* Returns an array of the db_vals for all categories user selected in uploading a post */
    function getDBCategories(type: any, audience: any, colors: string[] | undefined) {
        var dbCategoryID: any = [];
        dbCategories.forEach(cat => {
            // find type and audience (1 type and 1 audience can be selected)
            if (type == cat.label || audience == cat.label) {
                dbCategoryID.push(cat.db_val);
            }

            if (colors != undefined) {
                // find colors (multiple colors can be selected)
                colors.forEach(c  => {
                    if (c == cat.label) {
                        dbCategoryID.push(cat.db_val);
                    }
                })
            }
        });
        return dbCategoryID;
    }

    /* Returns the db_val for the user selected condition */
    function getDBCondition(condition: string | undefined) {
        var dbCondition;
        dbConditionVals.forEach(conditionOption => {
            if (condition == conditionOption.label) {
                dbCondition = conditionOption.db_val;
            }
        });
        return dbCondition;
    }

    // returns one string for type ("Women's", "Men's", or "Kids")
    function getUIAudience(dbVals: any) {
        return audienceMap.filter(item => dbVals.includes(item.db_val)).map(item => item.label);
    }

    // returns one string for type (Tops, Bottoms, Outerwear, ...)
    function getUIType(dbVals: any) {
        return typesMap.filter(item => dbVals.includes(item.db_val)).map(item => item.label);
    }

    // returns array of colors as strings
    function getUIColors(dbVals: any) {
        return colorsMap.filter(item => dbVals.includes(item.db_val)).map(item => item.label);
    }

    // returns one string for condition
    function getUICondition(condition: string) {
        var matchedCondition = dbConditionVals.find(item => item.db_val == condition);
        return matchedCondition?.label;
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
                            <div className="flex gap-2 mb-6">
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
                        
                        {/* grid */}
                        {activeProfileTab === 'My Closet' && (
                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                                {filtered.map((p) => (
                                    <ClosetCard
                                        key={p.id}
                                        product={p}
                                        onDelete={(id) => {
                                            setItemToDelete(id);
                                            setShowDeleteModal(true);
                                        }}
                                    />
                                ))}

                                <div
                                    className="bg-gray-100 rounded-lg aspect-square flex items-center justify-center cursor-pointer"
                                    onClick={() => setShowAddModal(true)}
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
                                            Click to Upload More Items
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )}
                        <AddProductModal
                            open={showAddModal}
                            onClose={() => setShowAddModal(false)}
                            onSave={(p) => {

                                // Information to be stored - O.C.
                                const postInfoDB = {
                                    closet_id: 0, // default value
                                    owner_id: user.email,
                                    title: p.title,
                                    likes: 0, // default value
                                    item_pictures: p.images, 
                                    description: p.description,
                                    date_posted: getFormattedDate(),
                                    item_condition: getDBCondition(p.condition), // return either 'new', 'excellent', 'good', 'worn'
                                    categories: getDBCategories(p.type, p.audience, p.colors), // array of category_id
                                    size: p.sizes? p.sizes[0] : p.sizes, 
                                    for_sale: p.forSale == true ? 1 : 0,
                                    for_rent: p.forRent == true ? 1 : 0,
                                    price: Number(p.price),
                                    rental_date: ""
                                };

                                // 1) send to backend
                                fetch('http://localhost:8800/api/profile/upload-item', {
                                    method : 'POST',
                                    headers: { 'Content-Type': 'application/json' },
                                    body   : JSON.stringify(postInfoDB),
                                }).catch(console.error);

                                // 2) optimistic UI update
                                setClosetItems([
                                    { id: Date.now(), ...p },        // temp id
                                    ...closetItems,
                                ]);
                                setShowAddModal(false);
                            }}
                        />

                        <ConfirmationModal
                            open={showDeleteModal}
                            onClose={() => setShowDeleteModal(false)}
                            onConfirm={() => {
                                if (itemToDelete !== null) {
                                    // Send delete request to the backend
                                    fetch('http://localhost:8800/api/profile/delete-item', {
                                        method: 'POST',
                                        headers: { 'Content-Type': 'application/json' },
                                        body: JSON.stringify({ post_id: itemToDelete }),
                                    })
                                        .then((response) => {
                                            if (!response.ok) {
                                                throw new Error('Failed to delete item');
                                            }
                                            // Update the frontend state
                                            setClosetItems((prevItems) => prevItems.filter((item) => item.id !== itemToDelete));
                                        })
                                        .catch((error) => console.error('Error deleting item:', error))
                                        .finally(() => {
                                            setShowDeleteModal(false); // Close the modal
                                            setItemToDelete(null); // Reset the item to delete
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

            <Footer />
        </div>
    );
};

export default withPageAuthRequired(ProfilePage);