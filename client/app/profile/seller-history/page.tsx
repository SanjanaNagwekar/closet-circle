'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Header, Footer } from '../../explore/ExplorePage';
import { useUser } from '@auth0/nextjs-auth0/client';

const brandNavy = '#284472';
const brandBrown = '#675a5e';
const ITEMS_PER_PAGE = 6;

interface Product {
    id        : number;
    title     : string;
    price     : number;
    images    : string[];
    date      : string;
    purchased : boolean;
    borrowed  : boolean;
}

const SellerHistoryPage: React.FC = () => {
    const { user } = useUser();

    const [tab, setTab] = useState<'Sold' | 'Borrowed'>('Sold');
    const [pageMap, setPageMap] = useState({ Sold: 1, Borrowed: 1});
    const listRef = useRef<HTMLDivElement | null>(null);

    const [soldItems, setSoldOrders] = useState<Product[]>([]); // items for sale
    const [borrowedItems, setBorrowedOrders] = useState<Product[]>([]); // items for rent

    /* Fetch all ordered items */
    useEffect(() => {
        if (!user) return;

        fetch(`http://localhost:8800/api/profile/seller-history?email=${user.email}`)
            .then((response) => response.json())
            .then((data) => {
                console.log('Fetched posts: ', data);

                if (!Array.isArray(data.orders)) {
                    console.error("Invalid data format:", data);
                    setSoldOrders([]);
                    return;
                }

                const transformed: Product[] = data.orders.map((post: any) => ({
                    id: post.post_id,
                    title: post.title,
                    price: post.price ?? 20, // Default price if not provided
                    images: post.images, // Use the images array directly
                    date: post.purchased_date.substring(0, post.purchased_date.indexOf(' ')), // date format yyy-mm-dd (doesnt display timestamp)
                    purchased: post.sflag === 1,
                    borrowed:  post.bflag === 1
                }));

                const purchasedItems = transformed.filter(item => item.purchased == true);
                const borrowedItems = transformed.filter(item => item.borrowed == true && item.purchased == false);
                setSoldOrders(purchasedItems);
                setBorrowedOrders(borrowedItems);
                //setPurchasedOrders(transformed);
            })
            .catch((error) => console.log('Error fetching cart items: ', error));
    }, [user]);

    const items = tab === 'Sold' ? soldItems : borrowedItems;
    const currentPage = pageMap[tab];
    const totalPages = Math.ceil(items.length / ITEMS_PER_PAGE);
    const pagedItems = items.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

    const scrollToTop = () => listRef.current?.scrollIntoView({ behavior: 'smooth' });
    useEffect(scrollToTop, [currentPage, tab]);

    const totalProfit = soldItems.reduce((sum, item) => sum + item.price, 0).toFixed(2);

    const renderItem = (item: any) => (
        <div key={item.id} className="flex items-center gap-6 border p-6 rounded relative">
            <div className="flex gap-4">
                {item.images?.length ? (
                    item.images.map((img: string, i: number) => (
                        <img key={i} src={img} className="w-32 h-32 object-cover rounded" alt="Product" />
                    ))
                ) : (
                    <div className="w-32 h-32 bg-gray-200 flex items-center justify-center rounded text-gray-500 text-xs">
                        No Image
                    </div>
                )}
            </div>
            <div className="flex-1">
                <h2 className="text-base font-medium" style={{ color: brandBrown }}>{item.title}</h2>
                <p className="text-sm font-medium text-gray-600">${item.price.toFixed(2)}</p>
                {tab === 'Sold' && <p className="text-xs text-gray-500">Sold on: {item.date}</p>}
                {tab === 'Borrowed' && <p className="text-xs text-gray-500">Borrowed on: {item.date}</p>}
            </div>
        </div>
    );

    return (
        <div className="min-h-screen flex flex-col bg-white">
            <Header />

            <div className="container mx-auto py-6 px-4 pb-64 flex-1">
                <h1 style={{ color: brandBrown }} className="text-4xl font-medium mb-8">My Account</h1>

                <div className="flex flex-col md:flex-row gap-8">
                    {/* Sidebar */}
                    <div className="w-full md:w-1/4 border rounded-lg overflow-hidden">
                        {['Profile', 'Order History', 'Seller History'].map((label) => (
                            <div
                                key={label}
                                onClick={() => location.href = `/profile/${label.toLowerCase().replace(/ /g, '-')}`}
                                className={`flex items-center p-4 cursor-pointer ${label === 'Seller History' ? 'font-semibold' : 'font-normal'} text-black text-lg`}
                            >
                                <span>{label}</span>
                                <span className="ml-auto">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <polyline points="9 18 15 12 9 6" />
                                    </svg>
                                </span>
                            </div>
                        ))}
                    </div>

                    {/* Main content */}
                    <div className="w-full md:w-3/4">
                        <h2 style={{ color: brandBrown }} className="text-2xl font-semibold mb-4">Seller History</h2>

                        {/* Summary */}
                        <div className="mb-6 text-lg text-gray-700 space-y-1">
                            <p>Total Profit: <span className="font-semibold">${totalProfit}</span></p>
                            <p>Products Sold: <span className="font-semibold">{soldItems.length}</span></p>
                            <p>Products Borrowed: <span className="font-semibold">{borrowedItems.length}</span></p>
                        </div>

                        {/* Tabs */}
                        <div className="flex gap-4 mb-6">
                            {(['Sold', 'Borrowed'] as const).map((label) => (
                                <button
                                    key={label}
                                    onClick={() => setTab(label)}
                                    className={`py-2 px-4 rounded ${tab === label ? 'text-white' : 'text-gray-800 bg-gray-100'}`}
                                    style={{ backgroundColor: tab === label ? brandNavy : undefined }}
                                >
                                    {label}
                                </button>
                            ))}
                        </div>

                        {/* Item list */}
                        <div className="space-y-8" ref={listRef}>
                            {pagedItems.map(renderItem)}
                        </div>

                        {/* Pagination */}
                        {totalPages > 1 && (
                            <div className="mt-6 flex justify-center gap-4" style={{ color: brandNavy }}>
                                <button
                                    onClick={() =>
                                        setPageMap((prev) => ({
                                            ...prev,
                                            [tab]: Math.max(prev[tab] - 1, 1),
                                        }))
                                    }
                                    disabled={currentPage === 1}
                                    className="px-4 py-2 border rounded disabled:opacity-50"
                                >
                                    Previous
                                </button>
                                <span className="text-sm mt-2">Page {currentPage} of {totalPages}</span>
                                <button
                                    onClick={() =>
                                        setPageMap((prev) => ({
                                            ...prev,
                                            [tab]: Math.min(prev[tab] + 1, totalPages),
                                        }))
                                    }
                                    disabled={currentPage === totalPages}
                                    className="px-4 py-2 border rounded disabled:opacity-50"
                                >
                                    Next
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <Footer />
        </div>
    );
};

export default SellerHistoryPage;