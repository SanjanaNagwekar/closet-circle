'use client';

import React, { useState, useMemo, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useUser } from '@auth0/nextjs-auth0/client';
import { apiUrl } from '@/lib/api';
import RentalDateModal from './RentalDateModal';
import SiteFooter from '../components/SiteFooter';
import SiteHeader from '../components/SiteHeader';

/* ============================================
   BRAND COLORS
============================================ */
const brandNavy = '#284472';
const brandLightPink = "#fdf5f3";
const brandBrown = "#675a5e";

/* -------------------------------------------
   TYPES
------------------------------------------- */
interface Lister {
    display   : string;   // “Nancy L.”
    username  : string;   // “nancy-l”   (used in /profile/{username})
    avatarUrl : string;
}

interface Product {
    id        : number;
    title     : string;
    price     : number;
    forSale   : boolean;
    forRent   : boolean;
    sold?      : boolean;
    type      : string[]; //'Tops'|'Bottoms'|'Outerwear'|'Dresses'|'Shoes'|'Accessories';
    audience  : string[]; //"Men's" |"Women's"|"Kid's";
    colors    : string[];
    sizes     : string[];
    condition : string;
    description?: string;
    images    : string[];       
    lister    : Lister;           
}

/* helper to create avatar url */
const avatar = (name: string) =>
    `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&size=64&background=DDDDDD&color=000`;

/* ============================================
   HEADER
============================================ */
const LegacyHeader: React.FC = () => {
    const { user } = useUser();
    const [menuOpen, setMenuOpen] = useState(false);
    const dropRef                 = useRef<HTMLDivElement|null>(null);

    /* click-away for profile drop-down */
    useEffect(() => {
        const cb = (e: MouseEvent) => {
            if (dropRef.current && !dropRef.current.contains(e.target as Node)) setMenuOpen(false);
        };
        if (menuOpen) document.addEventListener('mousedown', cb);
        return () => document.removeEventListener('mousedown', cb);
    }, [menuOpen]);

    return (
        <header className="flex justify-between items-center p-4 border-b shadow-md bg-white relative z-30">
            {/* left nav */}
            <nav className="flex gap-5 items-center ml-4">
                <Link href="/about"   className="text-xl font-medium tracking-wide text-gray-700">About</Link>
                <Link href="/explore" className="text-xl font-medium tracking-wide text-gray-700">Explore</Link>
            </nav>

            {/* centre logo */}
            <div className="flex-grow flex justify-center">
                <Link href="/">
                    <Image
                        alt="Closet Circle"
                        className="w-[200px] h-auto"
                        height={80}
                        priority
                        src="https://cdn.builder.io/api/v1/image/assets/TEMP/cbcbc59fadb92cbfa94f7a46414d883263e97dc4"
                        unoptimized
                        width={200}
                    />
                </Link>
            </div>

            {/* right-side buttons */}
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
                
                {/* favourites stays visible for everyone */}
                <Link href="/favorites">
                    <button className="p-2" style={{ color: brandNavy }} aria-label="Favourites">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"
                             strokeWidth="1.5" stroke="currentColor" className="w-6 h-6">
                            <path strokeLinecap="round" strokeLinejoin="round"
                                  d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12Z"/>
                        </svg>
                    </button>
                </Link>

                {/* ——— conditional area ——— */}
                {!user ? (
                    /* ------------- logged-OUT ------------- */
                    <div className="flex gap-2.5">
                        <a href="/api/auth/login"
                           style={{ backgroundColor: brandLightPink, color: brandNavy }}
                           className="px-4 py-2 text-sm font-semibold rounded">
                            Log In
                        </a>
                        <a href="/api/auth/login?screen_hint=signup"
                           style={{ backgroundColor: brandLightPink, color: brandBrown }}
                           className="px-4 py-2 text-sm font-semibold rounded">
                            Sign Up
                        </a>
                    </div>
                ) : (
                    /* ------------- logged-IN -------------- */
                    <div className="relative" ref={dropRef}>
                        <button onClick={()=>setMenuOpen(!menuOpen)}
                                className="p-2 flex items-center gap-1" style={{ color: brandNavy }}>
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"
                                 strokeWidth="1.5" stroke="currentColor" className="w-6 h-6">
                                <path strokeLinecap="round" strokeLinejoin="round"
                                      d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z"/>
                            </svg>
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"
                                 fill="currentColor" className="w-4 h-4">
                                <path fillRule="evenodd"
                                      d="M5.23 7.21a.75.75 0 011.06.02L10 10.94l3.71-3.71a.75.75 0 011.08 1.04l-4.25 4.25a.75.75 0 01-1.08 0L5.25 8.27a.75.75 0 01-.02-1.06z"
                                      clipRule="evenodd"/>
                            </svg>
                        </button>

                        {menuOpen && (
                            <div className="absolute right-0 mt-2 w-40 bg-white border rounded-md shadow-lg py-1 text-sm">

                                <Link href="/profile"
                                      className="block px-4 py-2 hover:bg-gray-100"
                                      style={{ color: brandNavy }}
                                      onClick={()=>setMenuOpen(false)}>
                                    View Profile
                                </Link>
                                <Link href="/profile/rentals"
                                      className="block px-4 py-2 hover:bg-gray-100"
                                      style={{ color: brandNavy }}
                                      onClick={()=>setMenuOpen(false)}>
                                    Rental Dashboard
                                </Link>
                                <a href="/api/auth/logout"
                                   className="block px-4 py-2 hover:bg-gray-100"
                                   style={{ color: brandNavy }}>
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

/* -------------------------------------------
   PRODUCT CARD
------------------------------------------- */
interface ProductCardProps {
    product: Product;
    /** start filled if true */
    initialFav?: boolean;
}

const ProductCard: React.FC<ProductCardProps> = ({product, initialFav = false}) => {
    const { user } = useUser();  
    const router = useRouter(); 
    const [fav, setFav] = useState(initialFav);
    const [open, setOpen] = useState(false);
    const [i,   setI]     = useState(0);
    const [isAdding, setIsAdding] = useState(false);
    const [isUpdatingFavorite, setIsUpdatingFavorite] = useState(false);
    const [rentalModalOpen, setRentalModalOpen] = useState(false);
    const [feedback, setFeedback] = useState('');
    const closeButtonRef = useRef<HTMLButtonElement | null>(null);

    useEffect(() => {
        setFav(initialFav);
    }, [initialFav]);

    const addToCart = async (
        intent: 'purchase' | 'rental',
        startDate?: string,
        endDate?: string,
    ) => {
        if (!user) {
            router.push('/api/auth/login');
            return false;
        }

        setIsAdding(true);
        setFeedback('');
        try {
            const response = await fetch(apiUrl('/api/profile/cart/items'), {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    postId: product.id,
                    intent,
                    startDate,
                    endDate,
                }),
            });
            const data = await response.json();
            setFeedback(response.ok ? data.message : data.error || 'Could not add this item');
            return response.ok;
        } catch (error) {
            setFeedback('Could not reach the server. Please try again.');
            return false;
        } finally {
            setIsAdding(false);
        }
    };

    const toggleFavorite = async () => {
        if (!user) {
            router.push('/api/auth/login');
            return;
        }

        setIsUpdatingFavorite(true);
        setFeedback('');
        try {
            const response = await fetch(apiUrl('/api/profile/wishlist'), {
                method: fav ? 'DELETE' : 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ post_id: product.id }),
            });
            if (response.ok) {
                setFav(!fav);
            } else {
                const data = await response.json();
                setFeedback(data.error || 'Could not update this favorite');
            }
        } catch (error) {
            setFeedback('Could not reach the server. Please try again.');
        } finally {
            setIsUpdatingFavorite(false);
        }
    };

    useEffect(() => {
        if (!open) return;
        const previousOverflow = document.body.style.overflow;
        const closeOnEscape = (event: KeyboardEvent) => {
            if (event.key === 'Escape') setOpen(false);
        };
        document.body.style.overflow = 'hidden';
        document.addEventListener('keydown', closeOnEscape);
        closeButtonRef.current?.focus();
        return () => {
            document.body.style.overflow = previousOverflow;
            document.removeEventListener('keydown', closeOnEscape);
        };
    }, [open]);

    const imgs      = product.images ?? [];
    const imgCount  = imgs.length;
    const nextImg   = () => setI((i+1)%imgCount);
    const prevImg   = () => setI((i-1+imgCount)%imgCount);
    const unavailable = (!product.forSale && !product.forRent) || product.sold;

    return (
        <article className="marketplace-card">
            <Link href={`/profile/${product.lister.username}`}
                  className="marketplace-card__seller">
                <Image
                    alt={product.lister.display}
                    className="w-5 h-5 rounded-full"
                    height={20}
                    src={product.lister.avatarUrl}
                    unoptimized
                    width={20}
                />
                <span>{product.lister.display}</span>
            </Link>

            {/* favourite heart */}
            <button onClick={toggleFavorite}
                    aria-label={fav ? `Remove ${product.title} from favorites` : `Add ${product.title} to favorites`}
                    className="marketplace-card__favorite"
                    disabled={isUpdatingFavorite}
                    style={{ color: brandNavy }}>
                <svg width="18" height="18" viewBox="0 0 24 24"
                     fill={fav ? 'currentColor' : 'none'}
                     stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78
                   7.78l1.06 1.06L12 21.23l7.78-7.78
                   1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
                </svg>
            </button>

            {/* image section */}
            {imgCount ? (
                <div className="marketplace-card__media">
                    <Image
                        alt={product.title}
                        className="marketplace-card__image"
                        height={600}
                        src={imgs[i]}
                        unoptimized
                        width={600}
                    />
                    {imgCount > 1 && (
                        <>
                            <button onClick={prevImg}
                                    className="absolute left-1 top-1/2 -translate-y-1/2
                                 bg-black/70 text-white rounded-full p-1"
                                    aria-label="Prev">
                                <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd"
                                          d="M12.293 4.293a1 1 0 010 1.414L8.414 10l3.879 4.293a1 1 0
                           11-1.586 1.414l-4.5-5a1 1 0 010-1.414l4.5-5a1 1 0
                           011.586 0z" clipRule="evenodd"/>
                                </svg>
                            </button>
                            <button onClick={nextImg}
                                    className="absolute right-1 top-1/2 -translate-y-1/2
                                 bg-black/70 text-white rounded-full p-1"
                                    aria-label="Next">
                                <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd"
                                          d="M7.707 4.293a1 1 0 000 1.414L11.586 10l-3.879
                           4.293a1 1 0 001.586 1.414l4.5-5a1 1 0
                           000-1.414l-4.5-5a1 1 0 00-1.586 0z" clipRule="evenodd"/>
                                </svg>
                            </button>
                        </>
                    )}
                    <button
                        className="marketplace-card__quick-view"
                        onClick={() => setOpen(true)}
                        type="button"
                    >
                        Quick view <span aria-hidden="true">↗</span>
                    </button>
                </div>
            ) : (
                <div className="marketplace-card__media">
                    <div className="marketplace-card__placeholder" />
                    <button className="marketplace-card__quick-view" onClick={() => setOpen(true)} type="button">
                        Quick view <span aria-hidden="true">↗</span>
                    </button>
                </div>
            )}
            {/* title + toggle */}
            <div className="marketplace-card__body">
                <div className="marketplace-card__title-row">
                    <div>
                      <h3>{product.title}</h3>
                      <p>{[product.condition, product.sizes?.[0]].filter(Boolean).join(' · ') || 'Pre-loved piece'}</p>
                    </div>
                    <span className="marketplace-card__price">${product.price}</span>
                </div>

                {/* CTAs */}
                <div className="marketplace-card__actions">
                    {unavailable
                        ? <div className="marketplace-card__unavailable">Unavailable</div>
                        : <>
                            {product.forSale &&
                                <button className="marketplace-card__buy"
                                disabled={isAdding}
                                onClick={() => addToCart('purchase')}>
                                    Buy
                                </button>}
                            {product.forRent &&
                                <button className="marketplace-card__rent"
                                disabled={isAdding}
                                onClick={() => {
                                    if (!user) {
                                        router.push('/api/auth/login');
                                        return;
                                    }
                                    setRentalModalOpen(true);
                                }}>
                                    Rent · ${product.price}/day
                                </button>}
                        </>}
                </div>
                {feedback && <p className="mt-2 text-xs text-[#675a5e]" role="status">{feedback}</p>}
            </div>

            {open && typeof document !== 'undefined' ? createPortal(
                <div
                    className="quick-view"
                    onMouseDown={(event) => {
                        if (event.currentTarget === event.target) setOpen(false);
                    }}
                >
                    <section
                        aria-labelledby={`quick-view-title-${product.id}`}
                        aria-modal="true"
                        className="quick-view__dialog"
                        role="dialog"
                    >
                        <button
                            aria-label="Close quick view"
                            className="quick-view__close"
                            onClick={() => setOpen(false)}
                            ref={closeButtonRef}
                            type="button"
                        >
                            <span aria-hidden="true">×</span>
                        </button>

                        <div className="quick-view__media">
                            {imgCount ? (
                                <Image
                                    alt={product.title}
                                    className="quick-view__image"
                                    height={900}
                                    src={imgs[i]}
                                    unoptimized
                                    width={760}
                                />
                            ) : <div className="quick-view__placeholder">No image available</div>}
                            {imgCount > 1 ? (
                                <div className="quick-view__gallery-controls">
                                    <button aria-label="Previous image" onClick={prevImg} type="button">←</button>
                                    <span>{i + 1} / {imgCount}</span>
                                    <button aria-label="Next image" onClick={nextImg} type="button">→</button>
                                </div>
                            ) : null}
                        </div>

                        <div className="quick-view__content">
                            <p className="quick-view__eyebrow">Quick view</p>
                            <h2 id={`quick-view-title-${product.id}`}>{product.title}</h2>
                            <p className="quick-view__price">${product.price}{product.forRent ? <span> / day to rent</span> : null}</p>

                            <Link className="quick-view__seller" href={`/profile/${product.lister.username}`}>
                                <Image alt="" height={32} src={product.lister.avatarUrl} unoptimized width={32} />
                                <span>Listed by <strong>{product.lister.display}</strong></span>
                            </Link>

                            <div className="quick-view__facts">
                                <div><span>Size</span><strong>{product.sizes.join(', ') || 'Not listed'}</strong></div>
                                <div><span>Condition</span><strong>{product.condition || 'Not listed'}</strong></div>
                                <div><span>Color</span><strong>{product.colors.join(', ') || 'Not listed'}</strong></div>
                                <div><span>Available</span><strong>{[product.forSale && 'Buy', product.forRent && 'Rent'].filter(Boolean).join(' · ')}</strong></div>
                            </div>

                            <div className="quick-view__description">
                                <h3>About this piece</h3>
                                <p>{product.description || 'The seller has not added a description for this piece yet.'}</p>
                            </div>

                            <div className="quick-view__actions">
                                {unavailable ? <div className="marketplace-card__unavailable">Unavailable</div> : (
                                    <>
                                        {product.forSale ? (
                                            <button disabled={isAdding} onClick={() => addToCart('purchase')} type="button">Buy for ${product.price}</button>
                                        ) : null}
                                        {product.forRent ? (
                                            <button
                                                className="quick-view__rent"
                                                disabled={isAdding}
                                                onClick={() => {
                                                    if (!user) {
                                                        router.push('/api/auth/login');
                                                        return;
                                                    }
                                                    setOpen(false);
                                                    setRentalModalOpen(true);
                                                }}
                                                type="button"
                                            >
                                                Choose rental dates
                                            </button>
                                        ) : null}
                                    </>
                                )}
                            </div>
                            {feedback ? <p className="quick-view__feedback" role="status">{feedback}</p> : null}
                        </div>
                    </section>
                </div>,
                document.body,
            ) : null}
            <RentalDateModal
                isSaving={isAdding}
                onClose={() => setRentalModalOpen(false)}
                onConfirm={(startDate, endDate) => addToCart('rental', startDate, endDate)}
                open={rentalModalOpen}
                rate={product.price}
                title={product.title}
            />
        </article>
    );
};

const Footer = SiteFooter;

/* ============================================
   EXPLORE PAGE
============================================ */

    /* filter options */
    const typeOptions    = ['Tops','Bottoms','Outerwear','Dresses','Shoes','Accessories'];
    const genderOptions  = ["Men's","Women's","Kids"];
    const categoryOptions= ['For Rent','For Sale'];
    const conditionOpts  = ['Brand New','Used – Like New','Used – Good','Used – Fair'];
    const sizeOptions    = ['XX-Small','X-Small','Small','Medium','Large','X-Large','XX-Large','3X-Large','4X-Large'];
    const colorOptions   = ['Black','White','Red','Blue','Green','Pink'];

    // map UI labels to db values
    const audienceMap = [
        { label: genderOptions[1], db_val: 1 }, // Women's
        { label: genderOptions[0], db_val: 2 }, // Men's
        { label: genderOptions[2], db_val: 3 } // Kids
    ];

    const typesMap = [
        { label: typeOptions[0], db_val: 4 },
        { label: typeOptions[1], db_val: 5 },
        { label: typeOptions[2], db_val: 6 },
        { label: typeOptions[3], db_val: 7 },
        { label: typeOptions[4], db_val: 8 },
        { label: typeOptions[5], db_val: 9 }
    ];

    const colorsMap = [
        { label: colorOptions[0], db_val: 10 },
        { label: colorOptions[1], db_val: 11 },
        { label: colorOptions[2], db_val: 12 },
        { label: colorOptions[3], db_val: 13 },
        { label: colorOptions[4], db_val: 14 },
        { label: colorOptions[5], db_val: 15 }
    ];

    const dbConditionVals = [
        { label: conditionOpts[0], db_val: "new"},
        { label: conditionOpts[1], db_val: "excellent"},
        { label: conditionOpts[2], db_val: "good"},
        { label: conditionOpts[3], db_val: "worn"},
    ];

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

const ExplorePage: React.FC = () => {
    /* state */
    const [explorePageItems, setExplorePageItems] = useState<Product[]>([]);
    const { user } = useUser();
    const [wishlistIds, setWishlistIds] = useState<number[]>([]);
    
    const [selTypes,  setTypes]  = useState<string[]>([]);
    const [selCats,   setCats]   = useState<string[]>([]);
    const [selConds,  setConds]  = useState<string[]>([]);
    const [selSizes,  setSizes]  = useState<string[]>([]);
    const [selColors, setColors] = useState<string[]>([]);
    const [selGender, setGender] = useState<string[]>([]);
    const [priceInput, setPrice] = useState<[string, string]>(['0','80']);
    const [sort,      setSort]   = useState('Most Popular');
    const [page,      setPage]   = useState(1);
    const perPage = 9;
    const price = useMemo(
        () => [
            priceInput[0] === '' ? 0 : Number(priceInput[0]),
            priceInput[1] === '' ? 0 : Number(priceInput[1]),
        ],
        [priceInput],
    );

    // Fetch wishlist items for user
    useEffect(() => {
        if (!user) return;
        fetch(apiUrl('/api/profile/wishlist'))
            .then(res => res.json())
            .then(data => {
                if (Array.isArray(data.wishlist)) {
                    setWishlistIds(data.wishlist.map((item: any) => item.post_id));
                } else {
                    setWishlistIds([]);
                }
            })
            .catch(err => {
                console.error("Failed to fetch wishlist:", err);
                setWishlistIds([]);
            });
    }, [user]);

    // Fetch products from backend
    useEffect(() => {
        fetch(apiUrl('/api/posts-all'))
            .then((response) => response.json())
            .then((data) => {
                if (!data.posts || !Array.isArray(data.posts)) {
                    console.error("Invalid data format:", data);
                    setExplorePageItems([]);
                    return;
                }


                const transformed: Product[] = data.posts.map((post: any) => ({
                    id: post.post_id,
                    title: post.title,
                    price: post.price ?? 20, // Default price if not provided
                    forSale: post.sflag === 1,
                    forRent: post.bflag === 1,
                    sold: false,
                    type: getUIType(post.categories), //post.type ?? '',
                    audience: getUIAudience(post.categories), //post.audience ?? '',
                    colors: getUIColors(post.categories), //post.colors ?? [],
                    sizes: post.size ? [post.size] : [], // Wrap size in an array
                    condition: getUICondition(post.item_condition), //post.item_condition,
                    description: post.description,
                    images: post.images, // Use the images array directly
                    lister: {
                        display: post.lister?.display ?? 'Unknown',
                        username: post.lister?.username ?? 'unknown-user',
                        avatarUrl: post.lister?.avatarUrl ?? avatar(post.lister?.display ?? 'Unknown'),
                    },
                }));


                setExplorePageItems(transformed);
            })
            .catch((error) => {
                console.log('Error fetching explore page items: ', error);
                fetch('/explore-fallback.json')
                    .then((response) => response.json())
                    .then((fallbackItems: Product[]) => setExplorePageItems(fallbackItems))
                    .catch((fallbackError) => console.error('Error loading fallback explore items: ', fallbackError));
            });
    }, []);

    /* filter logic */
    const filtered = useMemo(()=> explorePageItems.filter((p) => {
        if (selTypes.length && (!p.type || !p.type.some((c) => selTypes.includes(c)))) return false;
        if (selGender.length && (!p.audience || !p.audience.some((c) => selGender.includes(c)))) return false;

        if(selCats.length){
            const rentMatch = selCats.includes('For Rent') && p.forRent;
            const saleMatch = selCats.includes('For Sale') && p.forSale;
            if(!rentMatch && !saleMatch) return false;
        }
        if (selConds.length && (!p.condition || !selConds.includes(p.condition))) return false;
        if (selSizes.length && (!p.sizes || !p.sizes.some((s) => selSizes.includes(s)))) return false;
        if (selColors.length && (!p.colors || !p.colors.some((c) => selColors.includes(c)))) return false;
        if (p.price < price[0] || p.price > price[1]) return false;
        return true;
    }).sort((a, b) => {
        if (sort === 'Price: Low to High') return a.price - b.price;
        if (sort === 'Price: High to Low') return b.price - a.price;
        return Number(b.id) - Number(a.id);
    }),[selTypes,selGender,selCats,selConds,selSizes,selColors,price,sort,explorePageItems]);

    /* pagination */
    const pages = Math.ceil(filtered.length/perPage);
    const items = filtered.slice((page-1)*perPage,page*perPage);

    /* toggle helper */
    const toggle = (v:string,l:string[],s:React.Dispatch<React.SetStateAction<string[]>>)=>{s(l.includes(v)?l.filter(x=>x!==v):[...l,v]);setPage(1);};
   
    const handlePriceChange = (idx: 0 | 1, val: string) => {
    if (/^\d*$/.test(val)) {  // ensure only digits or empty string
        setPrice(idx === 0 ? [val, priceInput[1]] : [priceInput[0], val]);
    }
    };

    /* render */
    return (
        <div className="min-h-screen flex flex-col bg-white">
            <SiteHeader/>

            <section className="explore-hero">
                <div className="page-container">
                    <p className="eyebrow">The community closet</p>
                    <div className="explore-hero__row">
                        <h1>Find your next favorite.</h1>
                        <p>Shop pre-loved pieces or borrow something special. Filter the circle to find exactly what fits your style.</p>
                    </div>
                </div>
            </section>

            <div className="explore-layout page-container">
                {/* SIDEBAR */}
                <aside className="explore-filters">
                    <div className="explore-filters__heading">
                        <div><span>Refine</span><h2>Filters</h2></div>
                        <button type="button" onClick={() => { setTypes([]); setCats([]); setConds([]); setSizes([]); setColors([]); setGender([]); setPrice(['0', '80']); setPage(1); }}>Clear all</button>
                    </div>
                    {/* sort */}
                    <div className="filter-group">
                        <h3>Sort by</h3>
                        <select value={sort} onChange={e=>{setSort(e.target.value);setPage(1);}}
                                className="w-full border p-2 text-black">
                            <option>Most Popular</option><option>Price: Low to High</option><option>Price: High to Low</option>
                        </select>
                    </div>

                    {/* gender */}
                    <div className="filter-group">
                        <h3>Audience</h3>
                        {genderOptions.map(g=>(
                            <label key={g} className="flex items-center mb-1">
                                <input type="checkbox" className="mr-2" checked={selGender.includes(g)}
                                       onChange={()=>toggle(g,selGender,setGender)}/> {g}
                            </label>
                        ))}
                    </div>

                    {/* type */}
                    <div className="filter-group">
                        <h3>Type</h3>
                        {typeOptions.map(t=>(
                            <label key={t} className="flex items-center mb-1">
                                <input type="checkbox" className="mr-2" checked={selTypes.includes(t)}
                                       onChange={()=>toggle(t,selTypes,setTypes)}/> {t}
                            </label>
                        ))}
                    </div>

                    {/* category */}
                    <div className="filter-group">
                        <h3>Shop by</h3>
                        {categoryOptions.map(c=>(
                            <label key={c} className="flex items-center mb-1">
                                <input type="checkbox" className="mr-2" checked={selCats.includes(c)}
                                       onChange={()=>toggle(c,selCats,setCats)}/> {c}
                            </label>
                        ))}
                    </div>

                    {/* price */}
                    <div className="filter-group">
                        <h3>Price ($)</h3>
                        <div className="flex gap-2 items-center">
                            <input type="number" value={priceInput[0]} onChange={e => handlePriceChange(0, e.target.value)} className="border px-2 w-20"/>
                            <span>-</span>
                            <input type="number" value={priceInput[1]} onChange={e => handlePriceChange(1, e.target.value)} className="border px-2 w-20"/>
                        </div>
                    </div>

                    {/* colours */}
                    <div className="filter-group">
                        <h3>Colors</h3>
                        <div className="flex flex-wrap gap-2">
                            {colorOptions.map(c=>(
                                <button key={c} onClick={()=>toggle(c,selColors,setColors)}
                                        className={`w-6 h-6 rounded-full border-2 ${selColors.includes(c)?'ring-2 ring-offset-1 ring-gray-600':''}`}
                                        style={{ backgroundColor:c }} aria-label={c}/>
                            ))}
                        </div>
                    </div>

                    {/* size */}
                    <div className="filter-group">
                        <h3>Size</h3>
                        <div className="flex flex-wrap gap-2">
                            {sizeOptions.map(s=>(
                                <button key={s} onClick={()=>toggle(s,selSizes,setSizes)}
                                        className={`px-2 py-1 border text-xs ${selSizes.includes(s)?'bg-gray-200':''}`}>{s}</button>
                            ))}
                        </div>
                    </div>

                    {/* condition */}
                    <div className="filter-group">
                        <h3>Condition</h3>
                        {conditionOpts.map(c=>(
                            <label key={c} className="flex items-center mb-1">
                                <input type="checkbox" className="mr-2" checked={selConds.includes(c)}
                                       onChange={()=>toggle(c,selConds,setConds)}/> {c}
                            </label>
                        ))}
                    </div>
                </aside>

                {/* MAIN GRID */}
                <main className="explore-results">
                    <div className="explore-results__heading">
                        <div><p>Curated from the community</p><h2>{filtered.length} pieces</h2></div>
                        <span>Page {Math.min(page, Math.max(pages, 1))} of {Math.max(pages, 1)}</span>
                    </div>

                    <div className="explore-grid">
                        {items.map((product) => (
                            <ProductCard
                                initialFav={wishlistIds.includes(product.id)}
                                key={product.id}
                                product={product}
                            />
                        ))}
                    </div>

                    {/* pagination */}
                    <div className="explore-pagination">
                        <button disabled={page===1} onClick={()=>setPage(p=>p-1)}
                                style={{ color: brandBrown }} className="px-3 py-1 border disabled:opacity-50">Previous</button>
                        {[...Array(pages)].map((_,i)=>(
                            <button key={i} onClick={()=>setPage(i+1)}
                                    style={{ color: brandBrown }}
                                    className={`px-3 py-1 border ${page===i+1?'bg-gray-200':''}`}>{i+1}</button>
                        ))}
                        <button disabled={page===pages} onClick={()=>setPage(p=>p+1)}
                                style={{ color: brandBrown }} className="px-3 py-1 border disabled:opacity-50">Next</button>
                    </div>
                </main>
            </div>
            <Footer/>
        </div>
    );
};

export default ExplorePage;
export {
    SiteHeader as Header,
    ProductCard,
    Footer,
    type Product,
    getUIType, // export for favorites page
    getUIAudience, 
    getUIColors, 
    getUICondition, 
    avatar,
    audienceMap, 
    typesMap, 
    colorsMap, 
    dbConditionVals
};
