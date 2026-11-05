import Link from 'next/link';
import SiteFooter from '../components/SiteFooter';
import SiteHeader from '../components/SiteHeader';

const principles = [
  {
    number: '01',
    title: 'Use what already exists',
    copy: 'Great clothes should not disappear into the back of a closet. Resale and rental give each piece more chances to be worn.',
  },
  {
    number: '02',
    title: 'Make sharing feel simple',
    copy: 'A circular closet only works when discovery, listing, and coordination are convenient enough to become everyday habits.',
  },
  {
    number: '03',
    title: 'Build around community',
    copy: 'Closet Circle makes fashion more personal by connecting each item to the people who list, rent, and discover it.',
  },
];

export default function AboutPage() {
  return (
    <div className="page-shell">
      <SiteHeader />
      <main>
        <section className="about-hero page-container">
          <div className="about-hero__content">
            <p className="eyebrow">Our purpose</p>
            <h1 className="display-title">A better next chapter for every closet.</h1>
            <p className="about-hero__lede">
              Closet Circle was created around a simple idea: the most sustainable piece of clothing is often the one that is already here. We make it easier to discover, share, rent, and resell what is already in our communities.
            </p>
            <Link className="about-hero__link" href="/explore">See the community closet <span aria-hidden="true">↗</span></Link>
          </div>
          <div className="about-hero__motif" aria-hidden="true">
            <span>discover</span><i /><span>share</span><i /><span>repeat</span>
          </div>
        </section>

        <section className="about-origin">
          <div className="page-container about-origin__inner">
            <div className="about-origin__art" aria-hidden="true">
              <div className="about-origin__ring"><span>wear it</span><span>share it</span><span>love it</span></div>
            </div>
            <div className="about-origin__copy">
              <p className="eyebrow">Why it exists</p>
              <h2 className="section-title">Because a full closet should create possibilities, not waste.</h2>
              <p className="section-copy">
                People often own pieces they still value but rarely wear. At the same time, finding a specific outfit for an event or trying a new style can lead to another short-lived purchase. Closet Circle brings those two realities together.
              </p>
              <p className="section-copy">
                The product combines a secondhand marketplace with flexible rental workflows so a garment can move between closets instead of being forgotten or discarded. It is designed as one approachable place to list, browse, save, purchase, and coordinate rentals.
              </p>
            </div>
          </div>
        </section>

        <section className="about-principles page-container">
          <div className="about-principles__heading">
            <p className="eyebrow">What guides the product</p>
            <h2 className="section-title">Circular fashion should feel natural.</h2>
          </div>
          <div className="about-principles__grid">
            {principles.map((principle) => (
              <article key={principle.number}>
                <span>{principle.number}</span>
                <h3>{principle.title}</h3>
                <p>{principle.copy}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="about-product">
          <div className="page-container about-product__inner">
            <div>
              <p className="eyebrow">What it aims to solve</p>
              <h2 className="section-title">One product for both sides of the closet.</h2>
            </div>
            <div className="about-product__paths">
              <article>
                <span>For the person searching</span>
                <h3>Find something distinct without defaulting to new.</h3>
                <p>Explore listings, narrow the selection, save favorites, and choose whether buying or renting makes the most sense.</p>
              </article>
              <article>
                <span>For the person sharing</span>
                <h3>Turn an underused wardrobe into an active closet.</h3>
                <p>Create and manage listings, respond to rental requests, and track the items that have found their next wearer.</p>
              </article>
            </div>
          </div>
        </section>

        <section className="about-cta page-container">
          <p className="eyebrow">See the idea in action</p>
          <h2>Explore what is already in the circle.</h2>
          <Link className="button" href="/explore">Browse the marketplace <span aria-hidden="true">→</span></Link>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
