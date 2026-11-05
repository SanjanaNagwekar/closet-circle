'use client';
import React, { useState, useEffect, useRef, JSX } from 'react';
import Link from 'next/link';
import { useUser } from '@auth0/nextjs-auth0/client';
import { apiUrl } from '@/lib/api';

const brandNavy = '#284472';
const brandLightPink = '#fdf5f3';
const brandPink = '#FDEEEA';
const brandLightBrown = '#efe4e1';
const brandBrown = '#675a5e';

interface Lister {
    display   : string;   // “Nancy L.”
    username  : string;   // “nancy-l”   (used in /profile/{username})
    avatarUrl : string;
}

const avatar = (name: string) =>
    `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&size=64&background=DDDDDD&color=000`;

interface Product {
    id        : number;
    title     : string;
    price     : number;
    forSale   : boolean;
    forRent   : boolean;
    type      : string[]; //'Tops'|'Bottoms'|'Outerwear'|'Dresses'|'Shoes'|'Accessories';
    audience  : string[]; //"Men's" |"Women's"|"Kids";
    colors    : string[];
    sizes     : string[];
    condition : string;
    description?: string;
    images    : string[];          // empty ⇒ gray placeholder
    lister    : Lister;            // NEW
}

const Header: React.FC = () => {
    const { user } = useUser();

    const [menuOpen, setMenuOpen] = useState(false);
    const dropRef = useRef<HTMLDivElement | null>(null);

    /* click-away to close the profile dropdown */
    useEffect(() => {
        const onClick = (e: MouseEvent) => {
            if (dropRef.current && !dropRef.current.contains(e.target as Node)) {
                setMenuOpen(false);
            }
        };
        if (menuOpen) document.addEventListener('mousedown', onClick);
        return () => document.removeEventListener('mousedown', onClick);
    }, [menuOpen]);

    return (
        <header
            style={{ backgroundColor: brandNavy }}
            className="flex justify-between items-center p-4 drop-shadow-sm"
        >
            {/* left-hand nav */}
            <nav className="flex gap-4 items-center">
                <Link
                    href="/about"
                    className="text-lg md:text-xl font-semibold tracking-wide text-white p-2"
                >
                    About
                </Link>
                <Link
                    href="/explore"
                    className="text-lg md:text-xl font-semibold tracking-wide text-white p-2"
                >
                    Explore
                </Link>
            </nav>

            {/* right-hand area */}
            <div className="flex gap-4 items-center">
                {/* ---------- logged-OUT ---------- */}
                {!user ? (
                    <div className="flex gap-2.5">
                        <a
                            href="/api/auth/login?returnTo=/profile"
                            style={{ backgroundColor: brandLightPink, color: brandNavy }}
                            className="px-5 py-2 text-lg md:text-xl font-semibold tracking-wide text-center rounded"
                        >
                            Log&nbsp;In
                        </a>
                        <a
                            href="/api/auth/login?screen_hint=signup"
                            style={{ backgroundColor: brandLightPink, color: brandBrown }}
                            className="px-5 py-2 text-lg md:text-xl font-semibold tracking-wide text-center rounded"
                        >
                            Sign&nbsp;Up
                        </a>
                    </div>
                ) : (
                    /* ---------- logged-IN ----------- */
                    <>
                        {/* shopping cart (only visible when logged in) */}
                    
                        <Link href="/cart">
                            <button className="p-2" style={{ color: 'white'}} aria-label='Shopping Cart'>
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
                
                        {/* favourites */}
                        <Link
                            href="/favorites"
                            className="p-2"
                            style={{ color: 'white' }}
                            aria-label="Favourites"
                        >
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                viewBox="0 0 24 24"
                                strokeWidth={1.5}
                                stroke="currentColor"
                                fill="none"
                                className="w-6 h-6"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12Z"
                                />
                            </svg>
                        </Link>

                        {/* profile dropdown */}
                        <div className="relative" ref={dropRef}>
                            <button
                                onClick={() => setMenuOpen(!menuOpen)}
                                className="p-2 flex items-center gap-1"
                                style={{ color: 'white' }}
                            >
                                {/* profile icon */}
                                <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    strokeWidth={1.5}
                                    stroke="currentColor"
                                    className="w-6 h-6"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0ZM4.5 20.118a7.5 7.5 0 0115 0A18 18 0 0112 21.75c-2.676 0-5.216-.584-7.5-1.632z"
                                    />
                                </svg>
                                {/* caret */}
                                <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    viewBox="0 0 20 20"
                                    fill="currentColor"
                                    className="w-4 h-4"
                                >
                                    <path
                                        fillRule="evenodd"
                                        d="M5.23 7.21a.75.75 0 011.06.02L10 10.94l3.71-3.71a.75.75 0 011.08 1.04l-4.25 4.25a.75.75 0 01-1.08 0L5.25 8.27a.75.75 0 01-.02-1.06z"
                                        clipRule="evenodd"
                                    />
                                </svg>
                            </button>

                            {/* dropdown */}
                            {menuOpen && (
                                <div
                                    className="absolute right-0 mt-2 w-40 rounded-md shadow-lg py-1"
                                    style={{ backgroundColor: brandNavy }}
                                >
                                    <Link
                                        href="/profile"
                                        className="block px-4 py-2 hover:bg-opacity-80"
                                        style={{ color: 'white' }}
                                        onClick={() => setMenuOpen(false)}
                                    >
                                        View&nbsp;Profile
                                    </Link>
                                    <a
                                        href="/api/auth/logout"
                                        className="block px-4 py-2 hover:bg-opacity-80"
                                        style={{ color: 'white' }}
                                    >
                                        Logout
                                    </a>
                                </div>
                            )}
                        </div>
                    </>
                )}
            </div>
        </header>
    );
};

/***************
 * Hero Section
 ***************/
const HeroSection: React.FC = () => (
    <section style={{ backgroundColor: brandLightPink }} className="flex flex-col items-start px-6 py-10 bg-opacity-50">
        <img
            src="https://cdn.builder.io/api/v1/image/assets/TEMP/cbcbc59fadb92cbfa94f7a46414d883263e97dc4"
            alt="Hero"
            className="w-full max-w-5xl h-auto mb-10 self-center"
        />
        <div className="max-w-4xl md:ml-24 space-y-6">
            <h1
                style={{ color: brandBrown }}
                className="text-3xl md:text-4xl font-semibold tracking-wide text-left"
            >
                A convenient new way to buy, borrow, and sell clothes within your community and friends.
            </h1>
            <Link
                href="/explore"
                style={{ backgroundColor: brandNavy }}
                className="flex gap-2.5 items-center px-4 py-3 md:px-4 md:py-3 text-lg md:text-xl font-medium text-white w-fit rounded"
            >
                Explore Products
                <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={1.5}
                    stroke="currentColor"
                    className="w-5 h-5 md:w-6 md:h-6"
                >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M17.25 8.25 21 12m0 0-3.75 3.75M21 12H3" />
                </svg>
            </Link>
        </div>
    </section>
);

/***************
 * Features
 ***************/
const FeatureItem: React.FC<{ title: string; description: string; icon: JSX.Element }> = ({ title, description, icon }) => (
    <article className="flex items-start gap-3 text-left max-w-xs">
        <div className="mt-1 text-brandBrown">{icon}</div>
        <div>
            <h2 className="mb-1 text-xl font-semibold text-zinc-800">{title}</h2>
            <p style={{ color: brandBrown }} className="text-sm md:text-base">
                {description}
            </p>
        </div>
    </article>
);

const FeaturesSection: React.FC = () => (
    <section style={{ backgroundColor: brandPink }} className="py-10 flex justify-center items-start gap-20 md:gap-24 flex-wrap">
        <FeatureItem
            title="Buy"
            description="Purchase secondhand items"
            icon={
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke={brandBrown} className="w-6 h-6 md:w-8 md:h-8">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5V6a3.75 3.75 0 1 0-7.5 0v4.5m11.356-1.993 1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 0 1-1.12-1.243l1.264-12A1.125 1.125 0 0 1 5.513 7.5h12.974c.576 0 1.059.435 1.119 1.007ZM8.625 10.5a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm7.5 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z" />
                </svg>
            }
        />
        <FeatureItem
            title="Borrow"
            description="Lend items out to friends"
            icon={
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke={brandBrown} className="w-6 h-6 md:w-8 md:h-8">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992m-17.03 10.296v-4.992m0 0h4.992m-4.992 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182m0-4.991v4.99" />
                </svg>
            }
        />
        <FeatureItem
            title="Sell"
            description="List items to be sold"
            icon={
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke={brandBrown} className="w-6 h-6 md:w-8 md:h-8">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9.568 3H5.25A2.25 2.25 0 0 0 3 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581c.699.699 1.78.872 2.607.33a18.095 18.095 0 0 0 5.223-5.223c.542-.827.369-1.908-.33-2.607L11.16 3.66A2.25 2.25 0 0 0 9.568 3Z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 6h.008v.008H6V6Z" />
                </svg>
            }
        />
    </section>
);

/***************
 * Registration CTA
 ***************/
const RegistrationCTA: React.FC = () => (
    <section className="flex flex-col md:flex-row justify-center items-center gap-4 p-6 text-center">
        <p style={{ color: brandNavy }} className="text-lg md:text-2xl leading-6">
            Register now to add your friends and start listing your items.
        </p>
        <Link
            href="/api/auth/login?screen_hint=signup"
            className="px-5 py-2 text-lg md:text-xl font-semibold tracking-wide text-white rounded"
            style={{ backgroundColor: brandNavy }}
        >
            Register
        </Link>
    </section>
);

/***************
 * Product Showcase
 ***************/
const ProductShowcase: React.FC = () => (
    <section className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-6 p-6">
        {[
            {
                src: 'https://cdn.builder.io/api/v1/image/assets/TEMP/cbedef64488709f872118a3e1474e860e98284e0',
                alt: 'Shop Women',
            },
            {
                src: 'https://cdn.builder.io/api/v1/image/assets/TEMP/970d6bada2549fae2f02e22d0da0c759bfd691bb',
                alt: 'Shop Men',
            },
            {
                src: 'https://cdn.builder.io/api/v1/image/assets/TEMP/ab67ce25c2ee816ba98839f705a997a4a2e753ca',
                alt: 'Shop Accessories',
            },
        ].map(({ src, alt }, index) => (
            <div key={index} className="relative w-full h-64 md:h-80 overflow-hidden rounded-lg">
                <img src={src} alt={alt} className="w-full h-full object-cover" />
                <div className="absolute bottom-3 left-3">
                    <h2 className="text-white text-lg md:text-xl font-semibold drop-shadow-md">{alt}</h2>
                </div>
            </div>
        ))}
    </section>
);

/***************
 * Trending Items
 ***************/
const ProductCard: React.FC<{ image: string; title: string; buyPrice: string }> = ({ image, title, buyPrice }) => (
    <article className="flex flex-col">
        <img src={image} alt={title} className="w-full h-60 object-cover rounded-xl mb-4" />
        <h3 className="mb-3 text-lg md:text-xl font-medium text-black">{title}</h3>
        <div className="flex gap-2.5">
            <button
                style={{ backgroundColor: brandBrown }}
                className="px-4 py-2 text-lg md:text-lg font-semibold tracking-wide text-white rounded"
            >
                Buy for {buyPrice}
            </button>
            <button
                style={{ color: brandBrown }}
                className="px-4 py-2 text-lg md:text-lg font-semibold tracking-wide border-2 border-zinc-600 text-zinc-600 rounded"
            >
                Rent
            </button>
        </div>
    </article>
);

const TrendingItems: React.FC<{ products: Product[] }> = ({ products }) => {
    return (
        <section className="mb-10 text-center px-4">
            <h2 className="mb-8 text-3xl md:text-4xl font-semibold text-black">Trending Items</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
                {products.map((product) => (
                    <ProductCard
                    key={product.id}
                    image={product.images?.[0] ?? '/placeholder.jpg'}
                    title={product.title}
                    buyPrice={`$${product.price}`}
                />
                ))}
            </div>
            <Link 
                href="/explore"
                className="px-10 py-3 mt-8 text-sm md:text-base font-medium text-black border border-black border-opacity-10 rounded-full text-center">
                View All
            </Link>
        </section>
    );
};

/***************
 * Purpose Section
 ***************/
const PurposeSection: React.FC = () => (
    <section style={{ backgroundColor: brandLightBrown }} className="px-4 pt-16 pb-24 text-center space-y-6">
        <h2 style={{ color: brandBrown }} className="text-3xl md:text-4xl font-medium leading-8">
            Our Purpose
        </h2>
        <p style={{ color: brandBrown }} className="mx-auto text-lg md:text-xl leading-7 max-w-3xl">
            Fast fashion has transformed the way people consume clothing, but at an enormous environmental cost. Each year, the fashion industry generates 92 million tons of textile waste, much of which ends up in landfills or is incinerated, releasing harmful emissions. Additionally, synthetic fabrics shed microplastics, contributing to 35% of ocean plastic pollution. With clothing production doubling in the past 15 years but garments being worn 40% less, the need for sustainable fashion solutions has never been more urgent.
        </p>
        <p style={{ color: brandBrown }} className="mx-auto text-lg md:text-xl leading-7 max-w-3xl">
            Closet Circle is a platform designed to extend the life cycle of clothing and combat fast fashion’s wasteful practices. By enabling users to borrow, sell, and rent clothing within their communities, we make it easier to embrace reuse over disposal. Our platform fosters a circular economy, reducing the demand for new clothing production while giving pre-loved pieces a second life.
        </p>
        <p style={{ color: brandBrown }} className="mx-auto text-lg md:text-xl leading-7 max-w-3xl">
            Through Closet Circle, we empower individuals to shop consciously, share responsibly, and reduce textile waste, all while staying stylish. Fashion should be about expression, not excess—and with Closet Circle, we make sustainability a shared effort, one outfit at a time.
        </p>
    </section>
);

/***************
 * Footer
 ***************/
const FooterColumn: React.FC<{ title: string; links: string[] }> = ({ title, links }) => (
    <div className="flex-1 min-w-[120px]">
        <h3 className="mb-4 text-xs tracking-normal leading-4 text-white uppercase">{title}</h3>
        <ul className="flex flex-col gap-1 text-xs md:text-sm leading-5 text-neutral-400">
            {links.map((link, index) => (
                <li key={index}>
                    <a href="#" className="hover:text-white transition-colors">
                        {link}
                    </a>
                </li>
            ))}
        </ul>
    </div>
);

const NewsletterForm: React.FC = () => {
    const [email, setEmail] = useState('');
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        console.log('Subscribing email:', email);
        setEmail('');
    };

    return (
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
                <div className="flex px-3.5 py-2 border border-neutral-300">
                    <input
                        type="email"
                        placeholder="Enter your email address"
                        className="flex-1 text-sm leading-5 text-gray-200 bg-transparent"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                    />
                </div>
                <p className="text-xs md:text-sm leading-5 text-neutral-400">
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
                style={{ backgroundColor: brandLightPink, color: brandNavy }}
                type="submit"
                className="px-4 py-2 text-sm md:text-base leading-5 w-fit rounded"
            >
                Subscribe
            </button>
        </form>
    );
};

const Footer: React.FC = () => (
    <footer style={{ backgroundColor: brandNavy }} className="px-0 pt-16 pb-10 border-t border-opacity-10 border-white">
        <div className="flex flex-wrap justify-between px-6 md:px-10 gap-10">
            <div className="flex flex-wrap gap-6">
                <FooterColumn title="CONTACT US" links={['+1 (844) 326-6000', 'Email Us', 'Mon-Fri 9am-3pm PT']} />
                <FooterColumn title="CUSTOMERS" links={['Start a Return', 'Return Policy', 'FAQ']} />
                <FooterColumn title="COMPANY" links={['About Us', 'Sustainability', 'Careers']} />
            </div>
            <div className="w-full md:w-[420px] px-4 md:px-6">
                <h3 className="mb-4 text-sm md:text-base leading-6 text-white">Get the latest news from us</h3>
                <NewsletterForm />
            </div>
        </div>
        <div className="mt-16 px-6 md:px-10 text-xs md:text-sm leading-5 text-neutral-600">©CEIN</div>
    </footer>
);

/***************
 * Page Export
 ***************/
export default function Home() {
    const { user } = useUser();

    const [featuredItems, setFeaturedItems] = useState<Product[]>([]);

    /* filter options */
    const typeOptions    = ['Tops','Bottoms','Outerwear','Dresses','Shoes','Accessories'];
    const genderOptions  = ["Men's","Women's","Kids"];
    const categoryOptions= ['For Rent','For Sale'];
    const conditionOpts  = ['Brand new','Used – Like new','Used – Good','Used – Fair'];
    const sizeOptions    = ['XX-Small','X-Small','Small','Medium','Large','X-Large','XX-Large','3X-Large','4X-Large'];
    const colorOptions   = ['black','white','red','blue','green','pink'];

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

    useEffect(() => {
        fetch(apiUrl('/api/posts/trending'))
            .then((response) => {
                console.log("Response status: ", response.status);
                return response.json();
            })
            .then((data) => {
                console.log('Fetched posts: ', data);

                if (!data.trending || !Array.isArray(data.trending)) {
                    console.error("Invalid data format:", data);
                    setFeaturedItems([]);
                    return;
                }

                const transformed: Product[] = data.trending.map((post: any) => ({
                    id: post.post_id,
                    title: post.title,
                    price: post.price ?? 20, // Default price if not provided
                    forSale: post.sflag === 1,
                    forRent: post.bflag === 1,
                    sold: post.sold ?? false,
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
                setFeaturedItems(transformed);
            })
            .catch((error) => console.log('Error fetching landing page featured items: ', error));
    }, []);

    // Remove sessionStorage item when there is no user logged in - O.C.
    useEffect(() => {
        if (!user) {
            sessionStorage.removeItem('newuser_complete');
        }
    }, [user]);

    return (
        <main className="min-h-screen flex flex-col bg-white">
            <Header />
            <HeroSection />
            <FeaturesSection />
            <RegistrationCTA />
            <ProductShowcase />
            <TrendingItems products={featuredItems} />
            <PurposeSection />
            <Footer />
        </main>
    );
}
