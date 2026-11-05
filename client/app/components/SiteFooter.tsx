import Link from 'next/link';

export default function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="site-footer__inner">
        <div>
          <p className="site-footer__eyebrow">Keep good clothes in circulation</p>
          <p className="site-footer__title">Closet Circle</p>
          <p className="site-footer__copy">
            A community marketplace for buying, selling, and renting pre-loved clothing.
          </p>
        </div>
        <nav aria-label="Footer navigation" className="site-footer__nav">
          <Link href="/explore">Explore</Link>
          <Link href="/about">Our purpose</Link>
          <a
            href="https://github.com/SanjanaNagwekar/closet-circle"
            rel="noreferrer"
            target="_blank"
          >
            GitHub
          </a>
        </nav>
      </div>
      <div className="site-footer__bottom">
        <span>Designed for more circular closets.</span>
        <span>Portfolio project · Simulated checkout</span>
      </div>
    </footer>
  );
}
