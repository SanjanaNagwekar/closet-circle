'use client';

import React, { useState, useEffect } from 'react';
import { useUser } from '@auth0/nextjs-auth0/client';
import {
    Header,
    ProductCard,
    Footer,
    Product,
    getUIType,
    getUIAudience,
    getUIColors,
    getUICondition,
    avatar,
    audienceMap,
    typesMap,
    colorsMap,
    dbConditionVals
} from '../explore/ExplorePage';


/* ============================================
   BRAND COLORS
============================================ */
const brandNavy = '#284472';
const brandLightPink = "#fdf5f3";
const brandPink = "#FDEEEA";
const brandLightBrown = "#efe4e1";
const brandBrown = "#675a5e";

/**
 * Displays current user's wishlist of favorite products based on user's email
 * and has each item as a ProductCard with the option to remove it
 */
const FavoritesPage: React.FC = () => {
    // Get  user info and have state to store wishlist items
    const { user } = useUser();
    const [favoriteItems, setFavoriteItems] = useState<Product[]>([]);

// Fetch wishlist items
useEffect(() => {
    if (!user) return;

    const fetchWishlistItems = async () => {
        try {
            const response = await fetch(`http://localhost:8800/api/profile/wishlist?email=${user.email}`);
            const data = await response.json();

            if (response.ok) {
                if (!Array.isArray(data.wishlist)) {
                    console.error('Invalid data format:', data);
                    setFavoriteItems([]);
                    return;
                }
                console.log(data.wishlist);
                // Make backend data Product objects
                setFavoriteItems(
                  data.wishlist.map((item: any) => ({
                    id: item.post_id,
                    title: item.title,
                    price: item.price ?? 20,
                    forSale: item.sflag === 1,
                    forRent: item.bflag === 1,
                    type: item.categories ? getUIType(item.categories) : [],
                    audience: item.categories ? getUIAudience(item.categories) : [],
                    colors: item.categories ? getUIColors(item.categories) : [],
                    sizes: item.size ? [item.size] : [],
                    condition: getUICondition(item.item_condition),
                    description: item.description ?? '',
                    images: item.images ?? [], 
                    lister: {
                      display: item.first_name && item.last_name
                        ? `${item.first_name} ${item.last_name[0]}.`
                        : 'Unknown',
                      username: item.username ?? 'unknown-user',
                      avatarUrl: item.avatarUrl ?? avatar(item.first_name ?? 'Unknown'),
                    },
                  }))
                );
            } else {
                console.error('Failed to fetch wishlist:', data.error);
                setFavoriteItems([]);
            }
        } catch (error) {
            console.error('Error fetching wishlist:', error);
            setFavoriteItems([]);
        }
    };
    fetchWishlistItems();
}, [user]);



// Remove item from wishlist on front and backend
const handleRemove = async (id: number) => {
    if (!user) return;
    try {
        const response = await fetch('http://localhost:8800/api/profile/wishlist', {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: user.email, post_id: id }),
        });
        const data = await response.json();
        // Update local state to show deletion
        if (response.ok) {
            setFavoriteItems((prev) => prev.filter((p) => p.id !== id));
        } else {
            console.error('Failed to remove from wishlist:', data.error);
        }
    } catch (error) {
        console.error('Error removing from wishlist:', error);
    }
}
    // Display to UI
    return (
        <div className="min-h-screen flex flex-col bg-white">
            <Header />

            <div className="container mx-auto py-6 px-4 flex-1">
                <h1 style={{ color: brandBrown }} className="text-4xl font-medium mb-8">
                    Wishlist
                </h1>

                {favoriteItems.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                        {favoriteItems.map((p) => (
                            <div key={p.id} className="space-y-2">
                                <ProductCard product={p} initialFav setExplorePageItems={() => {}} userEmail={user?.email} />

                                <button
                                    onClick={() => handleRemove(p.id)}
                                    className="hover:underline text-sm" style={{ color: brandBrown }}
                                >
                                    Remove from favorites
                                </button>
                            </div>
                        ))}
                    </div>
                ) : (
                    <p className="text-center text-gray-500">
                        You haven’t added any favorites yet.
                    </p>
                )}
            </div>

            <Footer />
        </div>
    );
};

export default FavoritesPage;