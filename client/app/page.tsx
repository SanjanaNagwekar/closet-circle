'use client';

import { type PointerEvent as ReactPointerEvent, useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useUser } from '@auth0/nextjs-auth0/client';
import { apiUrl } from '@/lib/api';
import SiteFooter from './components/SiteFooter';
import SiteHeader from './components/SiteHeader';

interface FeaturedProduct {
  id: number;
  title: string;
  price: number;
  images: string[];
  forRent: boolean;
  forSale: boolean;
}

const fallbackImages = [
  'https://cdn.builder.io/api/v1/image/assets/TEMP/cbedef64488709f872118a3e1474e860e98284e0',
  'https://cdn.builder.io/api/v1/image/assets/TEMP/970d6bada2549fae2f02e22d0da0c759bfd691bb',
  'https://cdn.builder.io/api/v1/image/assets/TEMP/ab67ce25c2ee816ba98839f705a997a4a2e753ca',
];

function ArrowIcon() {
  return (
    <svg aria-hidden="true" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8">
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14m-5-5 5 5-5 5" />
    </svg>
  );
}

function FeatureIcon({ type }: { type: 'discover' | 'share' | 'repeat' }) {
  const paths = {
    discover: 'M4 6.5h16M6.5 3v3.5M17.5 3v3.5M5 10h14v10H5z',
    share: 'M12 3v12m0-12L8 7m4-4 4 4M5 13v7h14v-7',
    repeat: 'M7 7h10l-2.5-2.5M17 17H7l2.5 2.5M20 9a7 7 0 0 1 0 6M4 15a7 7 0 0 1 0-6',
  };
  return (
    <svg aria-hidden="true" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
      <path strokeLinecap="round" strokeLinejoin="round" d={paths[type]} />
    </svg>
  );
}

function ProductImage({ product, index }: { product?: FeaturedProduct; index: number }) {
  const src = product?.images?.[0] || fallbackImages[index % fallbackImages.length];
  return (
    <Image
      alt={product?.title || 'Curated clothing from Closet Circle'}
      fill
      priority={index < 2}
      sizes="(max-width: 720px) 45vw, 24vw"
      src={src}
      unoptimized
    />
  );
}

function HeroOrbit({ products }: { products: FeaturedProduct[] }) {
  const sceneRef = useRef<HTMLDivElement>(null);

  const handlePointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const bounds = event.currentTarget.getBoundingClientRect();
    const x = (event.clientX - bounds.left) / bounds.width;
    const y = (event.clientY - bounds.top) / bounds.height;
    const scene = sceneRef.current;
    if (!scene) return;

    scene.style.setProperty('--orbit-tilt-x', `${(0.5 - y) * 9}deg`);
    scene.style.setProperty('--orbit-tilt-y', `${(x - 0.5) * 11}deg`);
    scene.style.setProperty('--orbit-light-x', `${x * 100}%`);
    scene.style.setProperty('--orbit-light-y', `${y * 100}%`);
  };

  const resetScene = () => {
    const scene = sceneRef.current;
    if (!scene) return;
    scene.style.setProperty('--orbit-tilt-x', '0deg');
    scene.style.setProperty('--orbit-tilt-y', '0deg');
    scene.style.setProperty('--orbit-light-x', '50%');
    scene.style.setProperty('--orbit-light-y', '45%');
  };

  return (
    <div
      aria-label="Interactive Closet Circle community wardrobe"
      className="hero-orbit"
      onPointerLeave={resetScene}
      onPointerMove={handlePointerMove}
      ref={sceneRef}
    >
      <div className="hero-orbit__spotlight" aria-hidden="true" />
      <div className="hero-orbit__stage">
        <div className="hero-orbit__line hero-orbit__line--one" aria-hidden="true" />
        <div className="hero-orbit__line hero-orbit__line--two" aria-hidden="true" />
        <i className="hero-orbit__spark hero-orbit__spark--one" aria-hidden="true" />
        <i className="hero-orbit__spark hero-orbit__spark--two" aria-hidden="true" />
        <i className="hero-orbit__spark hero-orbit__spark--three" aria-hidden="true" />

        <div className="hero-brand-card">
          <span className="hero-brand-card__eyebrow">Welcome to the circle</span>
          <Image
            alt="Closet Circle"
            height={130}
            priority
            src="https://cdn.builder.io/api/v1/image/assets/TEMP/cbcbc59fadb92cbfa94f7a46414d883263e97dc4"
            unoptimized
            width={310}
          />
          <p>Share more. Wear differently.</p>
          <Link href="/explore">Open the closet <ArrowIcon /></Link>
        </div>

        <div className="hero-item hero-item--one"><ProductImage index={1} product={products[0]} /><span>find</span></div>
        <div className="hero-item hero-item--two"><ProductImage index={2} product={products[1]} /><span>style</span></div>
        <div className="hero-item hero-item--three"><ProductImage index={0} product={products[2]} /><span>share</span></div>
        <span className="hero-orbit__pill hero-orbit__pill--top">pre-loved</span>
        <span className="hero-orbit__pill hero-orbit__pill--bottom">community first</span>
        <span className="hero-orbit__hint" aria-hidden="true">move to explore</span>
      </div>
    </div>
  );
}

export default function Home() {
  const { user } = useUser();
  const [featuredItems, setFeaturedItems] = useState<FeaturedProduct[]>([]);

  useEffect(() => {
    fetch(apiUrl('/api/posts/trending'))
      .then((response) => response.json())
      .then((data) => {
        if (!Array.isArray(data.trending)) return;
        setFeaturedItems(data.trending.slice(0, 4).map((post: any) => ({
          id: post.post_id,
          title: post.title,
          price: Number(post.price ?? 20),
          images: post.images ?? [],
          forSale: post.sflag === 1,
          forRent: post.bflag === 1,
        })));
      })
      .catch(() => setFeaturedItems([]));
  }, []);

  useEffect(() => {
    if (!user) sessionStorage.removeItem('newuser_complete');
  }, [user]);

  return (
    <div className="page-shell">
      <SiteHeader />

      <main>
        <section className="home-hero">
          <div className="home-hero__copy home-hero__copy--animated">
            <p className="eyebrow">A more circular way to dress</p>
            <h1 className="display-title">More style.<br />Less waste.</h1>
            <p className="home-hero__lede">
              Discover pre-loved pieces, share what is already in your closet, and give great clothing a longer life within your community.
            </p>
            <div className="home-hero__actions">
              <Link className="button" href="/explore">Explore the marketplace <ArrowIcon /></Link>
              <Link className="home-hero__text-link" href="/about">Why Closet Circle</Link>
            </div>
            <div className="home-hero__note">
              <span className="home-hero__note-mark">CC</span>
              <p><strong>Buy, rent, or list.</strong><br />One community, more possibilities for every piece.</p>
            </div>
          </div>

          <HeroOrbit products={featuredItems} />
        </section>

        <section className="home-marquee" aria-label="Marketplace benefits">
          <div className="home-marquee__track">
            <span>Pre-loved pieces</span><i /><span>Flexible rentals</span><i /><span>Community closets</span><i /><span>Longer garment life</span><i />
            <span aria-hidden="true">Pre-loved pieces</span><i aria-hidden="true" /><span aria-hidden="true">Flexible rentals</span><i aria-hidden="true" /><span aria-hidden="true">Community closets</span><i aria-hidden="true" /><span aria-hidden="true">Longer garment life</span><i aria-hidden="true" />
          </div>
        </section>

        <section className="how-it-works page-container">
          <div className="how-it-works__intro">
            <p className="eyebrow">Made for real closets</p>
            <h2 className="section-title">A simple way to keep clothes moving.</h2>
          </div>
          <div className="how-it-works__grid">
            {[
              ['01', 'discover', 'Find your next favorite', 'Browse community listings and filter by fit, category, condition, and color.'],
              ['02', 'share', 'List what you love', 'Create a listing for pieces you are ready to sell or make available for rent.'],
              ['03', 'repeat', 'Keep it in circulation', 'Manage purchases, rental requests, and your closet from one account.'],
            ].map(([number, icon, title, copy]) => (
              <article className="process-card" key={number}>
                <div className="process-card__top"><span>{number}</span><FeatureIcon type={icon as 'discover' | 'share' | 'repeat'} /></div>
                <h3>{title}</h3>
                <p>{copy}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="featured-section">
          <div className="page-container">
            <div className="featured-section__heading">
              <div>
                <p className="eyebrow">Fresh from the circle</p>
                <h2 className="section-title">Pieces worth a second look.</h2>
              </div>
              <Link href="/explore">View all listings <ArrowIcon /></Link>
            </div>
            <div className="featured-grid">
              {Array.from({ length: 4 }, (_, index) => {
                const product = featuredItems[index];
                return (
                  <Link className="featured-card" href="/explore" key={product?.id ?? index}>
                    <div className="featured-card__image"><ProductImage index={index} product={product} /></div>
                    <div className="featured-card__meta">
                      <div><h3>{product?.title || ['Everyday layers', 'Statement accessories', 'Weekend favorites', 'Wardrobe staples'][index]}</h3><p>{product?.forRent ? 'Available to rent' : 'Pre-loved find'}</p></div>
                      {product ? <span>${product.price}</span> : null}
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        </section>

        <section className="purpose-banner page-container">
          <div className="purpose-banner__visual" aria-hidden="true">
            <span>wear</span><span>share</span><span>repeat</span>
          </div>
          <div className="purpose-banner__copy">
            <p className="eyebrow">The idea behind Closet Circle</p>
            <h2 className="section-title">Your closet can do more than hold clothes.</h2>
            <p className="section-copy">
              Closet Circle was created to make reuse feel as convenient and personal as buying new. It brings discovery, resale, and short-term rental into one neighborhood-minded experience.
            </p>
            <Link className="button button--secondary" href="/about">Read our purpose <ArrowIcon /></Link>
          </div>
        </section>

        <section className="home-cta">
          <p className="eyebrow">Ready when you are</p>
          <h2>Find something new to you.</h2>
          <Link className="button" href="/explore">Start exploring <ArrowIcon /></Link>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
