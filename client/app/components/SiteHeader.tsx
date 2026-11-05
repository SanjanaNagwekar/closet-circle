'use client';

import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useUser } from '@auth0/nextjs-auth0/client';

const navItems = [
  { href: '/explore', label: 'Explore' },
  { href: '/about', label: 'Our purpose' },
];

function CartIcon() {
  return (
    <svg aria-hidden="true" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.7">
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.75 3.75h2l1.65 9.15a2 2 0 0 0 1.97 1.65h8.76a2 2 0 0 0 1.94-1.52l1.18-4.73H5.6m3.15 10.2h.01m7.49 0h.01" />
    </svg>
  );
}

function HeartIcon() {
  return (
    <svg aria-hidden="true" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.7">
      <path strokeLinecap="round" strokeLinejoin="round" d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78L12 21.23l7.78-7.78a5.5 5.5 0 0 0 0-7.78Z" />
    </svg>
  );
}

export default function SiteHeader() {
  const { user } = useUser();
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!menuOpen) return;
    const closeMenu = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', closeMenu);
    return () => document.removeEventListener('mousedown', closeMenu);
  }, [menuOpen]);

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  return (
    <header className="site-header">
      <div className="site-header__inner">
        <Link className="site-header__brand" href="/" aria-label="Closet Circle home">
          <Image
            alt="Closet Circle"
            height={72}
            priority
            src="https://cdn.builder.io/api/v1/image/assets/TEMP/cbcbc59fadb92cbfa94f7a46414d883263e97dc4"
            unoptimized
            width={220}
          />
        </Link>

        <nav aria-label="Primary navigation" className="site-header__nav">
          {navItems.map((item) => (
            <Link
              className={pathname === item.href ? 'is-active' : ''}
              href={item.href}
              key={item.href}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="site-header__actions">
          {user ? (
            <>
              <Link className="icon-button" href="/favorites" aria-label="Favorites">
                <HeartIcon />
              </Link>
              <Link className="icon-button" href="/cart" aria-label="Shopping cart">
                <CartIcon />
              </Link>
              <div className="profile-menu" ref={menuRef}>
                <button
                  aria-expanded={menuOpen}
                  aria-haspopup="menu"
                  className="profile-menu__trigger"
                  onClick={() => setMenuOpen((open) => !open)}
                  type="button"
                >
                  <span>{user.name?.split(' ')[0] || 'Account'}</span>
                  <span aria-hidden="true">⌄</span>
                </button>
                {menuOpen ? (
                  <div className="profile-menu__panel" role="menu">
                    <Link href="/profile" role="menuitem">My closet</Link>
                    <Link href="/profile/rentals" role="menuitem">Rental dashboard</Link>
                    <Link href="/profile/order-history" role="menuitem">Order history</Link>
                    <a href="/api/auth/logout" role="menuitem">Log out</a>
                  </div>
                ) : null}
              </div>
            </>
          ) : (
            <>
              <a className="header-login" href="/api/auth/login?returnTo=/profile">Log in</a>
              <a className="button button--small" href="/api/auth/login?screen_hint=signup">Join the circle</a>
            </>
          )}
          <button
            aria-expanded={mobileOpen}
            aria-label="Toggle navigation"
            className="mobile-menu-button"
            onClick={() => setMobileOpen((open) => !open)}
            type="button"
          >
            <span />
            <span />
          </button>
        </div>
      </div>

      {mobileOpen ? (
        <nav aria-label="Mobile navigation" className="site-header__mobile-nav">
          {navItems.map((item) => <Link href={item.href} key={item.href}>{item.label}</Link>)}
          {user ? (
            <>
              <Link href="/profile">My closet</Link>
              <Link href="/profile/rentals">Rental dashboard</Link>
              <a href="/api/auth/logout">Log out</a>
            </>
          ) : null}
        </nav>
      ) : null}
    </header>
  );
}
