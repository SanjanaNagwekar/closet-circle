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

const OrderHistoryPage: React.FC = () => {
    const { user } = useUser();

    const [tab, setTab] = useState<'Purchased' | 'Requested'>('Purchased');
    const [purchasedPage, setPurchasedPage] = useState(1);
    const [requestedPage, setRequestedPage] = useState(1);
    const listRef = useRef<HTMLDivElement | null>(null);

    const [purchasedOrders, setPurchasedOrders] = useState<Product[]>([]); // items for sale
    const [requestedOrders, setRequestedOrders] = useState<Product[]>([]); // items for rent

    /* Fetch all ordered items */
    useEffect(() => {
        if (!user) return;
        fetch(`http://localhost:8800/api/profile/order-history/purchased?email=${user.email}`)
            // fetch(`http://localhost:8800/api/profile/order-history/purchased?email=user2@email.com`) // for testing purposes
            .then((response) => response.json())
            .then((data) => {
                console.log('Fetched posts: ', data);
                if (!Array.isArray(data.orders)) {
                    console.error("Invalid data format:", data);
                    setPurchasedOrders([]);
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
                setPurchasedOrders(purchasedItems);
                setRequestedOrders(borrowedItems);
                //setPurchasedOrders(transformed);
            })
            .catch((error) => console.log('Error fetching cart items: ', error));
    }, [user]);

    const paginate = <T,>(items: T[], page: number) => {
        const start = (page - 1) * ITEMS_PER_PAGE;
        return items.slice(start, start + ITEMS_PER_PAGE);
    };

    const scrollToTop = () => {
        listRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(scrollToTop, [purchasedPage, requestedPage]);

    const renderItem = (item: Product & { status?: string }) => (
        <div key={item.id} className="flex items-center gap-6 border p-6 rounded relative">
            <div className="flex gap-4">
                {item.images.length > 0 ? (
                    item.images.map((img, i) => (
                        <img
                            key={i}
                            src={img}
                            alt={`${item.title} - Image ${i + 1}`}
                            className="w-32 h-32 object-cover rounded"
                        />
                    ))
                ) : (
                    <div className="w-32 h-32 bg-gray-200 flex items-center justify-center rounded">
                        <span className="text-gray-500 text-xs">No Image</span>
                    </div>
                )}
            </div>
            <div className="flex-1">
                <h2 className="text-base font-semibold" style={{ color: brandBrown }}>
                    {item.title}
                </h2>
                <p className="text-sm font-medium text-gray-600">${item.price.toFixed(2)}</p>
                <p className="text-xs text-gray-500">Ordered on: {item.date}</p>
            </div>
            {item.status && (
                <span
                    className="absolute top-2 right-2 text-xs font-medium bg-white border px-2 py-1 rounded shadow"
                    style={{
                        color: item.status === 'Approved' ? 'green' : 'orange',
                        borderColor: item.status === 'Approved' ? 'green' : 'orange',
                    }}
                >
                    {item.status}
                </span>
            )}
        </div>
    );

    const tabItems = tab === 'Purchased' ? purchasedOrders : requestedOrders;
    const currentPage = tab === 'Purchased' ? purchasedPage : requestedPage;
    const pageCount = Math.ceil(tabItems.length / ITEMS_PER_PAGE);
    const pagedItems = paginate(tabItems, currentPage);

    const handlePageChange = (newPage: number) => {
        if (tab === 'Purchased') setPurchasedPage(newPage);
        else setRequestedPage(newPage);
    };

    return (
        <div className="min-h-screen flex flex-col bg-white">
            <Header />
            <div className="container mx-auto py-6 px-4 pb-64 flex-1">
                <h1 style={{ color: brandBrown }} className="text-4xl font-medium mb-8">My Account</h1>
                <div className="flex flex-col md:flex-row gap-8">
                    <div className="w-full md:w-1/4 border rounded-lg overflow-hidden">
                        {['Profile', 'Order History', 'Seller History','Policies'].map((label) => (
                            <div
                                key={label}
                                onClick={() => {
                                    if (label === 'Profile') location.href = '/profile';
                                    if (label === 'Order History') location.href = '/profile/order-history';
                                    if (label === 'Seller History') location.href = '/profile/seller-history';
                                }}
                                className={`flex items-center p-4 cursor-pointer ${
                                    label === 'Order History' ? 'font-semibold' : 'font-normal'
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
                        ))}
                    </div>

                    <div className="w-full md:w-3/4">
                        <h2 style={{ color: brandBrown }} className="text-2xl font-semibold mb-4">Order History</h2>

                        <div className="flex gap-4 mb-6">
                            {['Purchased', 'Requested'].map((label) => (
                                <button
                                    key={label}
                                    onClick={() => setTab(label as 'Purchased' | 'Requested')}
                                    className={`py-2 px-4 rounded ${
                                        tab === label ? 'text-white' : 'text-gray-800 bg-gray-100'
                                    }`}
                                    style={{ backgroundColor: tab === label ? brandNavy : undefined }}
                                >
                                    {label}
                                </button>
                            ))}
                        </div>

                        <div className="space-y-8" ref={listRef}>
                            {pagedItems.map(renderItem)}
                        </div>

                        {pageCount > 1 && (
                            <div className="mt-6 flex justify-center gap-4" style={{ color: brandNavy }}>
                                <button
                                    onClick={() => handlePageChange(currentPage - 1)}
                                    disabled={currentPage === 1}
                                    className="px-4 py-2 border rounded disabled:opacity-50"
                                >
                                    Previous
                                </button>
                                <span className="text-sm mt-2">Page {currentPage} of {pageCount}</span>
                                <button
                                    onClick={() => handlePageChange(currentPage + 1)}
                                    disabled={currentPage === pageCount}
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

export default OrderHistoryPage;