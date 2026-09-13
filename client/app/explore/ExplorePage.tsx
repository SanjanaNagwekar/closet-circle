'use client';

import React, { useState, useMemo, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useUser } from '@auth0/nextjs-auth0/client';
import { clearPreviewData } from 'next/dist/server/api-utils';

/* ============================================
   BRAND COLORS
============================================ */
const brandNavy = '#284472';
const brandLightPink = "#fdf5f3";
const brandPink = "#FDEEEA";
const brandLightBrown = "#efe4e1";
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
const Header: React.FC = () => {
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
                    <img src="https://cdn.builder.io/api/v1/image/assets/TEMP/cbcbc59fadb92cbfa94f7a46414d883263e97dc4"
                         alt="Logo" className="w-[200px] h-auto"/>
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
    setExplorePageItems: React.Dispatch<React.SetStateAction<Product[]>>;
    userEmail?: string | null;
}

const ProductCard: React.FC<ProductCardProps> = ({product, initialFav = false, setExplorePageItems, userEmail}) => {
    const { user } = useUser();  
    const router = useRouter(); 
    const [fav, setFav] = useState(initialFav);
    const [open, setOpen] = useState(false);
    const [i,   setI]     = useState(0);
    const ref= useRef<HTMLDivElement|null>(null);

    const handleAction = (type: 'forSale' | 'forRent') => {
        if (!user) {
            // Redirect to sign-in/register page if user is not signed in
            router.push('/api/auth/login');
            return;
        }

        // Call addToCart if the user is signed in
        addToCart(product, type, user, setExplorePageItems);
    };

    const addToCart = async (product: Product, type: 'forSale' | 'forRent', user: any, setExplorePageItems: React.Dispatch<React.SetStateAction<Product[]>>) => {
        try {
            const transactionIdResponse = await fetch(`http://localhost:8800/api/profile/cart/id?email=${user?.email}`)

            const transactionIdData = await transactionIdResponse.json();
            if (!transactionIdResponse.ok || !transactionIdData.transactionId) {
                console.error('Failed to retrieve transaction ID:', transactionIdData.message || transactionIdData.error);
                alert('Failed to retrieve transaction ID. Please try again.');
                return;
            }

            const response = await fetch(`http://localhost:8800/api/profile/cart/addItem`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    transactionId: transactionIdData.transactionId,
                    postId: product.id,
                }),
            });
            
            const data = await response.json();

            if (!response.ok) {
                console.error(`Failed to add item to cart (${type}):`, data.error);
                alert(`Failed to add item to cart. Please try again.`);
                return;
            }

            // Update the product's availability in the frontend state
            setExplorePageItems((prevItems) =>
                prevItems.map((item) =>
                    item.id === product.id
                        ? { ...item, [type]: false } // Update forSale or forRent to false
                        : item
                )
            );

            alert(`Item added to cart successfully!`);
        } catch (error) {
            console.error(`Error adding item to cart (${type}):`, error);
            alert("An error occured. Please try again.");
        }
    }

    /* click-away */
    useEffect(() => {
        if (!open) return;
        const h = (e: MouseEvent) =>
            ref.current && !ref.current.contains(e.target as Node) && setOpen(false);
        document.addEventListener('mousedown', h);
        return () => document.removeEventListener('mousedown', h);
    }, [open]);

    const imgs      = product.images ?? [];
    const imgCount  = imgs.length;
    const nextImg   = () => setI((i+1)%imgCount);
    const prevImg   = () => setI((i-1+imgCount)%imgCount);
    const unavailable = (!product.forSale && !product.forRent) || product.sold;

    return (
        <div ref={ref} className="relative bg-gray-100 rounded-lg border overflow-visible">
            <Link href={`/profile/${product.lister.username}`}
                  className="absolute top-2 left-2 z-[60] flex items-center gap-1
                       bg-white/90 backdrop-blur-sm px-2 py-0.5 rounded-full">
                <img src={product.lister.avatarUrl} alt={product.lister.display}
                     className="w-5 h-5 rounded-full"/>
                <span className="text-xs font-medium text-black">{product.lister.display}</span>
            </Link>

            {/* favourite heart */}
            <button onClick={async () => {
                        if (fav) { // Remove from wishlist
                            const response = await fetch('http://localhost:8800/api/profile/wishlist', {
                                method: 'DELETE',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ email: userEmail, post_id: product.id }),
                            });
                            if (response.ok) setFav(false);
                            else alert("Failed to remove from wishlist.");
                        } else {  // Add to wishlist
                            const response = await fetch('http://localhost:8800/api/profile/wishlist', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ name: "Favorites", email: userEmail, post_id: product.id }),
                            });
                            if (response.ok) setFav(true);
                            else alert("Failed to add to wishlist.");
                        }
                    }}
                    className="absolute top-2 right-2 z-[55] w-8 h-8 rounded-full bg-white
                         flex items-center justify-center"
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
                <div className="relative">
                    <img src={imgs[i]} alt={product.title}
                         className="aspect-square w-full object-cover" />
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
                </div>
            ) : (
                <div className="bg-gray-200 aspect-square w-full" />
            )}
            {/* title + toggle */}
            <div className="p-3">
                <div className="flex justify-between items-start">
                    <h3 className="text-sm font-medium text-black mb-2 pr-2 line-clamp-2">{product.title}</h3>
                    <button onClick={()=>setOpen(!open)} className="flex items-center gap-1 text-sm text-black">
                        <span>See more</span>
                        <svg className={`w-5 h-5 transition-transform ${open?'rotate-180':''}`} viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 10.94l3.71-3.71a.75.75 0 011.08 1.04l-4.25 4.25a.75.75 0 01-1.08 0L5.25 8.27a.75.75 0 01-.02-1.06z" clipRule="evenodd"/>
                        </svg>
                    </button>
                </div>

                {/* CTAs */}
                <div className="flex gap-2">
                    {unavailable
                        ? <div className="bg-gray-300 text-center py-1 px-3 rounded-sm w-full text-sm">Unavailable</div>
                        : <>
                            {product.forSale &&
                                <button style={{ backgroundColor: brandBrown }} className="text-white text-sm py-1 px-3 rounded-sm flex-1"
                                onClick={() => handleAction('forSale')}>
                                    Buy for ${product.price}
                                </button>}
                            {product.forRent &&
                                <button style={{ color: brandBrown }} className="border border-gray-400 text-sm py-1 px-3 rounded-sm flex-1"
                                onClick={() => handleAction('forRent')}>
                                    Rent for ${product.price} Per Day
                                </button>}
                        </>}
                </div>
            </div>

            {/* dropdown */}
            {open && (
                <div className="absolute left-0 right-0 top-full mt-1 bg-gray-100
                        border border-gray-300 border-t-0 rounded-b-md p-4
                        text-sm text-black z-[100]">
                    <p><strong>Sizes:</strong> {product.sizes.join(', ')}</p>
                    <p><strong>Colors:</strong> {product.colors.join(', ')}</p>
                    <p><strong>Condition:</strong> {product.condition}</p>
                    {product.description && <p><strong>Description:</strong> {product.description}</p>}
                </div>
            )}
        </div>
    );
};

/* ============================================
   FOOTER
============================================ */
const FooterColumn: React.FC<{ title: string; links: string[] }> = ({ title, links }) => (
    <div className="flex-1">
        <h3 className="mb-5 text-xs tracking-normal leading-4 text-white uppercase">{title}</h3>
        <ul className="flex flex-col gap-1 text-sm leading-5 text-neutral-400">
            {links.map((link) => (
                <li key={link}>
                    <a href="#" className="hover:text-white transition-colors">{link}</a>
                </li>
            ))}
        </ul>
    </div>
);

const NewsletterForm: React.FC = () => {
    const [email, setEmail] = useState('');
    const handleSubmit = (e: React.FormEvent) => { e.preventDefault(); setEmail(''); };
    return (
        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            <div className="flex flex-col gap-1.5">
                <div className="flex px-3.5 py-3 border border-neutral-300">
                    <input
                        type="email"
                        placeholder="Enter your email address"
                        className="flex-1 text-sm leading-5 text-black bg-transparent"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                    />
                </div>
                <p className="text-sm leading-5 text-neutral-400">
                    By signing up, you agree to our{' '}
                    <a href="#" className="underline">Privacy Policy</a> and{' '}
                    <a href="#" className="underline">Terms of Service</a>.
                </p>
            </div>
            <button type="submit" className="px-5 py-3 text-base leading-5 bg-white w-fit"
                    style={{ backgroundColor: brandLightPink, color: brandNavy }}>
                Subscribe
            </button>
        </form>
    );
};

const Footer: React.FC = () => (
    <footer style={{ backgroundColor: brandNavy }}
            className="px-0 pt-20 pb-11 border border-orange-950">
        <div className="flex justify-between px-10 max-md:flex-col max-md:gap-10">
            <div className="flex gap-6 max-md:flex-col">
                <FooterColumn title="CONTACT US" links={['+1 (844) 326-6000', 'Email Us', 'Mon-Fri 9am-3pm PT']} />
                <FooterColumn title="CUSTOMERS" links={['Start a Return', 'Return Policy', 'FAQ']} />
                <FooterColumn title="COMPANY"   links={['About Us', 'Sustainability', 'Careers']} />
            </div>
            <div className="px-6 w-[491px] max-md:w-full">
                <h3 className="mb-6 text-base leading-6 text-white">Get the latest news from us</h3>
                <NewsletterForm />
            </div>
        </div>
        <div className="px-10 mt-20 text-sm leading-5 text-neutral-600">©CEIN</div>
    </footer>
);

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
    const [unavailablePostIDs, setUnavailableArr] = useState<Number[]>([]);

    // convert strings to numbers so can be used for filtering
    const price = [priceInput[0] === '' ? 0 : Number(priceInput[0]), priceInput[1] === '' ? 0 : Number(priceInput[1]),];

    // Fetch wishlist items for user
    useEffect(() => {
        if (!user) return;
        fetch(`http://localhost:8800/api/profile/wishlist?email=${user.email}`)
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

    /* fetch unavailable items */
    useEffect(() => {
        console.log("in use effect for sold posts")
        fetch(`http://localhost:8800/api/all-unavailable`)
                .then((response) => response.json())
                .then((data) => {
                    console.log('Fetched sold posts: ', data);
           
                    if (!Array.isArray(data.orders)) {
                        console.error("Invalid data format:", data);
                        return;
                    }
   
                    // IDs of unavailable items (to be marked as sold)
                    setUnavailableArr(data.orders.map((item: { post_id: any; }) => item.post_id));
                    console.log("unavailable post ids first: " + unavailablePostIDs);
                })
                .catch((error) => console.log('Error fetching ordered items: ', error));
    }, []);


    // Fetch products from backend
    useEffect(() => {
        console.log("in use effect")
        fetch('http://localhost:8800/api/posts-all')
            .then((response) => {
                console.log("Response status: ", response.status);
                return response.json();
            })
            .then((data) => {
                console.log('Fetched posts: ', data);
                console.log("unavailable post ids: " + unavailablePostIDs);

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
                    sold: unavailablePostIDs.includes(post.post_id), //post.sold ?? false,
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


                console.log("transformed items: ", transformed);
                // setExplorePageItems(transformed);
                setExplorePageItems((prevItems) => {
                    // Compare the new items with the previous items to ensure a change
                    if (JSON.stringify(prevItems) !== JSON.stringify(transformed)) {
                        console.log("state updated withh new items")
                        return transformed;
                    }
                    console.log("state is the same")
                    return prevItems;
                })
            })
            .catch((error) => console.log('Error fetching explore page items: ', error));
    }, [unavailablePostIDs]);

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
            <Header/>

            <div className="container mx-auto py-6 px-4 flex-1 flex gap-6">
                {/* SIDEBAR */}
                <aside className="w-64 space-y-6 text-black">
                    {/* sort */}
                    <div>
                        <h3 className="font-semibold mb-2">Sort by</h3>
                        <select value={sort} onChange={e=>{setSort(e.target.value);setPage(1);}}
                                className="w-full border p-2 text-black">
                            <option>Most Popular</option><option>Price: Low to High</option><option>Price: High to Low</option>
                        </select>
                    </div>

                    {/* gender */}
                    <div>
                        <h3 className="font-semibold mb-2">Audience</h3>
                        {genderOptions.map(g=>(
                            <label key={g} className="flex items-center mb-1">
                                <input type="checkbox" className="mr-2" checked={selGender.includes(g)}
                                       onChange={()=>toggle(g,selGender,setGender)}/> {g}
                            </label>
                        ))}
                    </div>

                    {/* type */}
                    <div>
                        <h3 className="font-semibold mb-2">Type</h3>
                        {typeOptions.map(t=>(
                            <label key={t} className="flex items-center mb-1">
                                <input type="checkbox" className="mr-2" checked={selTypes.includes(t)}
                                       onChange={()=>toggle(t,selTypes,setTypes)}/> {t}
                            </label>
                        ))}
                    </div>

                    {/* category */}
                    <div>
                        <h3 className="font-semibold mb-2">Category</h3>
                        {categoryOptions.map(c=>(
                            <label key={c} className="flex items-center mb-1">
                                <input type="checkbox" className="mr-2" checked={selCats.includes(c)}
                                       onChange={()=>toggle(c,selCats,setCats)}/> {c}
                            </label>
                        ))}
                    </div>

                    {/* price */}
                    <div>
                        <h3 className="font-semibold mb-2">Price ($)</h3>
                        <div className="flex gap-2 items-center">
                            <input type="number" value={priceInput[0]} onChange={e => handlePriceChange(0, e.target.value)} className="border px-2 w-20"/>
                            <span>-</span>
                            <input type="number" value={priceInput[1]} onChange={e => handlePriceChange(1, e.target.value)} className="border px-2 w-20"/>
                        </div>
                    </div>

                    {/* colours */}
                    <div>
                        <h3 className="font-semibold mb-2">Colors</h3>
                        <div className="flex flex-wrap gap-2">
                            {colorOptions.map(c=>(
                                <button key={c} onClick={()=>toggle(c,selColors,setColors)}
                                        className={`w-6 h-6 rounded-full border-2 ${selColors.includes(c)?'ring-2 ring-offset-1 ring-gray-600':''}`}
                                        style={{ backgroundColor:c }} aria-label={c}/>
                            ))}
                        </div>
                    </div>

                    {/* size */}
                    <div>
                        <h3 className="font-semibold mb-2">Size</h3>
                        <div className="flex flex-wrap gap-2">
                            {sizeOptions.map(s=>(
                                <button key={s} onClick={()=>toggle(s,selSizes,setSizes)}
                                        className={`px-2 py-1 border text-xs ${selSizes.includes(s)?'bg-gray-200':''}`}>{s}</button>
                            ))}
                        </div>
                    </div>

                    {/* condition */}
                    <div>
                        <h3 className="font-semibold mb-2">Condition</h3>
                        {conditionOpts.map(c=>(
                            <label key={c} className="flex items-center mb-1">
                                <input type="checkbox" className="mr-2" checked={selConds.includes(c)}
                                       onChange={()=>toggle(c,selConds,setConds)}/> {c}
                            </label>
                        ))}
                    </div>
                </aside>

                {/* MAIN GRID */}
                <main className="flex-1">
                    <h2 className="text-2xl font-semibold mb-4">Shop Products</h2>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                        {items.map(p=><ProductCard key={p.id} product={p} setExplorePageItems={setExplorePageItems} initialFav={wishlistIds.includes(p.id)} userEmail={user?.email} />)}
                    </div>

                    {/* pagination */}
                    <div className="flex justify-center items-center gap-2 mt-8">
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
    Header,
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
