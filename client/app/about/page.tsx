'use client';

import React from 'react';
import { Header, Footer } from '../explore/ExplorePage';

/* ============================================
   BRAND COLORS
============================================ */
const brandNavy = '#284472';
const brandLightPink = "#fdf5f3";
const brandPink = "#FDEEEA";
const brandLightBrown = "#efe4e1";
const brandBrown = "#675a5e";

export default function AboutPage() {
    const team = [
        { name: 'Nina Wang', role: 'Full-Stack Engineer', photo: '/images/nina.png' },
        { name: 'Olivia Joy Cacdac', role: 'Backend Engineer', photo: '/images/olivia.jpg' },
        { name: 'Sanjana Nagwekar', role: 'Frontend Engineer', photo: '/images/sanjana.jpg' },
        { name: 'Xiao Qi Lee', role: 'Database Designer', photo: '/images/xiao.png' },
    ];

    const stats = [
        { value: '10%', label: 'of global carbon emissions stem from garment production' },
        { value: '92M', label: 'tonnes of clothing waste enter landfills each year' },
        { value: '35%', label: 'of ocean microplastics originate from synthetic textiles' },
        { value: '7×', label: 'average wears per garment before it\'s discarded' },
    ];

    return (
        <div className="min-h-screen flex flex-col" style={{ backgroundColor: brandLightPink }}>
            <Header />

            <main className="flex-1 w-full px-75 py-12 space-y-16">
                {/* Hero */}
                <section>
                    <h1 style={{ color: brandBrown }} className="text-4xl font-bold mb-4">
                        About Closet Circle
                    </h1>
                    <p className="text-xl text-gray-700">
                        Closet Circle is a peer-to-peer wardrobe network that gives pre-loved clothing a second life. By connecting neighbors to borrow, rent, or purchase garments, we reduce the demand for new production and keep textiles circulating within communities.
                    </p>
                </section>

                {/* Meet the Team */}
                <section
                    className="p-8 rounded-lg"
                    style={{
                        backgroundColor: brandPink,
                        border: `2px solid ${brandLightBrown}`,
                    }}
                >
                    <h2 style={{ color: brandBrown }} className="text-3xl font-semibold mb-8 text-center">
                        Meet the Team
                    </h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-12">
                        {team.map(({ name, role, photo }) => (
                            <div key={name} className="text-center">
                                <img
                                    src={photo}
                                    alt={name}
                                    className="w-32 h-32 mx-auto rounded-full mb-4 object-cover"
                                />
                                <h3 style={{ color: brandBrown }} className="text-xl font-medium">
                                    {name}
                                </h3>
                                <p className="italic text-lg text-gray-600">{role}</p>
                            </div>
                        ))}
                    </div>
                </section>

                {/* Mission & Vision */}
                <section>
                    <h2 style={{ color: brandBrown }} className="text-3xl font-semibold mb-4">
                        Our Mission & Vision
                    </h2>
                    <p className="text-xl text-gray-700 mb-4 ml-8">
                        Our mission is to minimize clothing waste by fostering a local-sharing community where garments are reused and treasured. We believe every piece has value beyond a single owner, and through shared wardrobes, we extend the life of textiles and reduce environmental impact.
                    </p>
                    <p className="text-xl text-gray-700 ml-8">
                        Our vision is a future where wardrobes act as communal hubs, not silent closets. We see neighborhoods connected through style and sustainability—where collaborative consumption replaces disposable trends and each garment tells a lasting story.
                    </p>
                </section>

                {/* Statistics Cards */}
                <section>
                    <h2 style={{ color: brandBrown }} className="text-3xl font-semibold mb-6">
                        Fast Fashion Statistics
                    </h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
                        {stats.map(({ value, label }) => (
                            <div
                                key={value}
                                className="flex flex-col items-center p-6 rounded-lg shadow-sm"
                                style={{ backgroundColor: '#ffffff' }}
                            >
                                <span style={{ color: brandBrown }} className="text-4xl font-bold">
                                    {value}
                                </span>
                                <p className="mt-2 text-lg text-center text-gray-700">{label}</p>
                            </div>
                        ))}
                    </div>
                </section>

                {/* Impact Statement */}
                <section>
                    <p className="text-xl text-gray-700">
                        By extending the lifecycle of each garment, Closet Circle conserves water, cuts carbon emissions, and curbs microplastic pollution. Each exchange strengthens local ties and supports a circular fashion economy—one outfit at a time.
                    </p>
                </section>
            </main>

            <Footer />
        </div>
    );
}
