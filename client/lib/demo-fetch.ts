type DemoUser = {
  email: string;
  first_name: string;
  last_name: string;
  join_date: string;
  bio: string;
};

type DemoPost = {
  post_id: number;
  closet_id: number;
  owner_id: string;
  title: string;
  likes: number;
  description: string;
  date_posted: string;
  item_condition: string;
  size: string;
  price: number;
  bflag: number;
  sflag: number;
  rental_end_date: string | null;
  categories: number[];
  images: string[];
};

const users: Record<string, DemoUser> = {
  'user1@email.com': {
    email: 'user1@email.com',
    first_name: 'John',
    last_name: 'Smith',
    join_date: '2025-04-01',
    bio: 'Sustainable-fashion enthusiast clearing out my closet and finding great secondhand pieces.',
  },
  'user2@email.com': {
    email: 'user2@email.com',
    first_name: 'Jane',
    last_name: 'Doe',
    join_date: '2025-04-02',
    bio: 'Sneaker fan, casual style, and always looking for a good closet swap.',
  },
  'user3@email.com': {
    email: 'user3@email.com',
    first_name: 'Mary',
    last_name: 'Nguyen',
    join_date: '2025-04-03',
    bio: 'Sharing pieces I love so they can get a second life.',
  },
  'user4@email.com': {
    email: 'user4@email.com',
    first_name: 'Sally',
    last_name: 'Lopez',
    join_date: '2025-04-04',
    bio: 'Mostly everyday staples, dresses, and a few special-occasion finds.',
  },
  'user5@email.com': {
    email: 'user5@email.com',
    first_name: 'Joe',
    last_name: 'Gonzalez',
    join_date: '2025-04-05',
    bio: 'Buying less, rewearing more, and keeping good clothes in circulation.',
  },
};

let posts: DemoPost[] = [
  {
    post_id: 1,
    closet_id: 1,
    owner_id: 'user1@email.com',
    title: 'Gildan DryBlend T-Shirt',
    likes: 7,
    description: 'Soft black cotton-blend T-shirt with a lightweight everyday fit.',
    date_posted: '2025-04-01',
    item_condition: 'good',
    size: 'Medium',
    price: 10.99,
    bflag: 0,
    sflag: 1,
    rental_end_date: null,
    categories: [2, 4, 10],
    images: ['https://img.sonofatailor.com/images/customizer/product/extra-heavy-cotton/ss/Black.jpg'],
  },
  {
    post_id: 2,
    closet_id: 1,
    owner_id: 'user2@email.com',
    title: 'Nike Dunk High Shoes',
    likes: 13,
    description: 'Classic white and royal-blue high-top sneakers with a leather upper.',
    date_posted: '2025-04-02',
    item_condition: 'excellent',
    size: 'X-Large',
    price: 79.99,
    bflag: 0,
    sflag: 1,
    rental_end_date: null,
    categories: [2, 8, 11, 13],
    images: ['https://static.nike.com/a/images/t_PDP_1280_v1/f_auto,q_auto:eco/cbddd67b-444b-4a7c-b458-20643ab89b1b/custom-nike-dunk-high-by-you-shoes.png'],
  },
  {
    post_id: 3,
    closet_id: 2,
    owner_id: 'user3@email.com',
    title: 'Valiant Oxford Brogue Shoes',
    likes: 2,
    description: 'Hand-finished brogue shoes with a rich patina and classic silhouette.',
    date_posted: '2025-04-03',
    item_condition: 'worn',
    size: 'Small',
    price: 6.99,
    bflag: 1,
    sflag: 0,
    rental_end_date: '2025-05-26',
    categories: [2, 8, 10],
    images: ['https://img4.dhresource.com/webp/m/260x260/f3/albu/km/g/14/db741206-a7d4-4f31-8b51-b7db6f75a53e.jpg'],
  },
  {
    post_id: 4,
    closet_id: 2,
    owner_id: 'user4@email.com',
    title: 'L.L. Bean Women’s Cargo Pants',
    likes: 18,
    description: 'Durable stretch-cotton cargo pants with a comfortable straight-leg fit.',
    date_posted: '2025-04-04',
    item_condition: 'good',
    size: 'Large',
    price: 24.99,
    bflag: 1,
    sflag: 0,
    rental_end_date: '2025-05-26',
    categories: [1, 5, 14],
    images: ['https://cdni.llbean.net/is/image/wim/505026_33335_41?hei=1095&wid=950&resMode=sharp2&defaultImage=llbprod/505026_0_44'],
  },
  {
    post_id: 5,
    closet_id: 2,
    owner_id: 'user5@email.com',
    title: 'Millia Hydrangea-Patterned Dress',
    likes: 20,
    description: 'Flowy blue hydrangea-patterned midi dress for events and special occasions.',
    date_posted: '2025-04-05',
    item_condition: 'excellent',
    size: 'X-Small',
    price: 74.99,
    bflag: 1,
    sflag: 0,
    rental_end_date: null,
    categories: [1, 7, 13],
    images: ['https://itsmilla.com/cdn/shop/files/MILLA_117_1024x.jpg?v=1696266364'],
  },
  {
    post_id: 6,
    closet_id: 2,
    owner_id: 'user3@email.com',
    title: 'Fruit of the Loom Crew Neck T-Shirt',
    likes: 11,
    description: 'Simple white crew-neck tee with reinforced stitching and a soft everyday feel.',
    date_posted: '2025-04-05',
    item_condition: 'good',
    size: 'Medium',
    price: 8.99,
    bflag: 0,
    sflag: 1,
    rental_end_date: null,
    categories: [2, 4, 11],
    images: ['https://img.sonofatailor.com/images/customizer/product/White_O_Crew_Regular_NoPocket.jpg'],
  },
  {
    post_id: 7,
    closet_id: 3,
    owner_id: 'user4@email.com',
    title: 'Gildan Ultra Cotton T-Shirt',
    likes: 5,
    description: 'Classic red cotton tee with a relaxed fit for casual everyday wear.',
    date_posted: '2025-04-05',
    item_condition: 'worn',
    size: '4X-Large',
    price: 8.99,
    bflag: 0,
    sflag: 1,
    rental_end_date: null,
    categories: [2, 4, 12],
    images: ['https://i5.walmartimages.com/seo/Red-Shirt-for-Men-Gildan-2000-Men-T-Shirt-Cotton-Men-Shirt-Men-s-Trendy-Shirts-Best-Mens-Classic-Short-Sleeve-T-shirt_b41bd905-f204-4666-8b42-140387381a0b.32043a79df9d2166b1ed7b576bda9e21.jpeg'],
  },
  {
    post_id: 8,
    closet_id: 3,
    owner_id: 'user1@email.com',
    title: 'Paul Fredrick Slim Fit Button Up Shirt',
    likes: 20,
    description: 'Soft breathable blue button-up with a timeless casual-to-polished look.',
    date_posted: '2025-04-01',
    item_condition: 'good',
    size: '3X-Large',
    price: 18.99,
    bflag: 1,
    sflag: 0,
    rental_end_date: null,
    categories: [2, 4, 13],
    images: ['https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQVwrUty2m4obSlIzk1U-o5YFvpNdqjGqf0gw&s'],
  },
  {
    post_id: 9,
    closet_id: 3,
    owner_id: 'user1@email.com',
    title: 'Origo Men’s Retro Sneakers',
    likes: 3,
    description: 'Vintage-inspired leather sneakers with an amber sole and minimalist profile.',
    date_posted: '2025-04-02',
    item_condition: 'excellent',
    size: 'Small',
    price: 39.99,
    bflag: 0,
    sflag: 1,
    rental_end_date: null,
    categories: [2, 8, 11],
    images: ['https://origoshoes.com/cdn/shop/files/ORIGO-Menretrosand-1.jpg?v=1708968977&width=900'],
  },
];

let wishlistIds = new Set<number>([4, 5, 9]);
let cartIds = [2, 5];
let friendIds = new Set<string>(['user2@email.com', 'user3@email.com']);
let nextPostId = 100;

const avatar = (user: DemoUser) =>
  `https://ui-avatars.com/api/?name=${encodeURIComponent(`${user.first_name} ${user.last_name}`)}&size=128&background=284472&color=ffffff`;

const withLister = (post: DemoPost) => {
  const owner = users[post.owner_id] || users['user1@email.com'];
  return {
    ...post,
    lister: {
      display: `${owner.first_name} ${owner.last_name.charAt(0)}.`,
      username: post.owner_id,
      avatarUrl: avatar(owner),
    },
  };
};

const withOwner = (post: DemoPost) => {
  const owner = users[post.owner_id] || users['user1@email.com'];
  return {
    ...post,
    first_name: owner.first_name,
    last_name: owner.last_name,
    username: post.owner_id,
    avatarUrl: avatar(owner),
  };
};

const historyItem = (post: DemoPost, date: string) => ({
  ...post,
  purchased_date: `${date} 12:00:00`,
});

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

function parseBody(init?: RequestInit) {
  if (!init?.body || typeof init.body !== 'string') return {} as Record<string, any>;
  try {
    return JSON.parse(init.body) as Record<string, any>;
  } catch {
    return {} as Record<string, any>;
  }
}

function sellerHistory(email: string) {
  const owned = posts.filter((post) => post.owner_id === email);
  if (!owned.length) return [];
  return owned.slice(0, 2).map((post, index) =>
    historyItem(post, index === 0 ? '2025-05-12' : '2025-05-18'),
  );
}

async function demoResponse(urlString: string, init?: RequestInit) {
  const url = new URL(urlString, window.location.origin);
  const path = url.pathname;
  const method = (init?.method || 'GET').toUpperCase();
  const body = parseBody(init);

  if (path === '/') return json('hello this is the demo backend');

  if (path === '/api/users' && method === 'GET') {
    return json({ users: Object.values(users) });
  }

  if (path === '/api/users/new' && method === 'POST') {
    return json({ id: 999 });
  }

  if (path === '/api/profile' && method === 'GET') {
    const email = url.searchParams.get('email') || 'user1@email.com';
    const user = users[email] || users['user1@email.com'];
    return json({ users: [user] });
  }

  if (path === '/api/posts/trending' && method === 'GET') {
    const trending = [...posts]
      .sort((a, b) => b.likes - a.likes)
      .slice(0, 8)
      .map(withLister);
    return json({ trending });
  }

  if (path === '/api/posts-all' && method === 'GET') {
    return json({ posts: posts.map(withLister) });
  }

  if (path === '/api/all-unavailable' && method === 'GET') {
    return json({
      orders: [historyItem(posts[0], '2025-05-12'), historyItem(posts[3], '2025-05-15')],
    });
  }

  if (path === '/api/profile/posts' && method === 'GET') {
    const ownerID = url.searchParams.get('ownerID') || 'user1@email.com';
    return json({ posts: posts.filter((post) => post.owner_id === ownerID) });
  }

  if (path === '/api/profile/friends' && method === 'GET') {
    const friends = [...friendIds]
      .map((email) => users[email])
      .filter(Boolean)
      .map((user) => ({ ...user, profile_url: avatar(user) }));
    return json({ friends });
  }

  if (path === '/api/profile/followers' && method === 'GET') {
    return json({
      followers: [users['user4@email.com'], users['user5@email.com']].map((user) => ({
        ...user,
        profile_url: avatar(user),
      })),
    });
  }

  if (path === '/api/profile/add-friend' && method === 'POST') {
    if (body.friend_id) friendIds.add(String(body.friend_id));
    return json({ success: true });
  }

  if (path === '/api/profile/remove-friend' && method === 'DELETE') {
    if (body.friend_id) friendIds.delete(String(body.friend_id));
    return json({ success: true, message: 'Friend unfollowed' });
  }

  if (path === '/api/profile/wishlist' && method === 'GET') {
    return json({
      wishlist: posts.filter((post) => wishlistIds.has(post.post_id)).map(withOwner),
    });
  }

  if (path === '/api/profile/wishlist' && method === 'POST') {
    if (body.post_id != null) wishlistIds.add(Number(body.post_id));
    return json({ success: true, message: 'Item added successfully' });
  }

  if (path === '/api/profile/wishlist' && method === 'DELETE') {
    if (body.post_id != null) wishlistIds.delete(Number(body.post_id));
    return json({ success: true, message: 'Item removed from wishlist' });
  }

  if (path === '/api/profile/cart' && method === 'GET') {
    return json({
      transId: 101,
      cart: posts.filter((post) => cartIds.includes(post.post_id)),
    });
  }

  if (path === '/api/profile/cart/id' && method === 'GET') {
    return json({ transactionId: 101 });
  }

  if (path === '/api/profile/cart/addItem' && method === 'PUT') {
    const postId = Number(body.postId);
    if (Number.isFinite(postId) && !cartIds.includes(postId)) cartIds.push(postId);
    return json({ success: true, message: 'Item added to cart' });
  }

  if (path === '/api/profile/cart/item' && method === 'DELETE') {
    const postId = Number(body.postId);
    cartIds = cartIds.filter((id) => id !== postId);
    return json({ success: true, message: 'Item removed from cart' });
  }

  if (path === '/api/profile/checkout' && method === 'PUT') {
    cartIds = [];
    return json({ success: true, message: 'Checkout completed' });
  }

  if (path === '/api/profile/order-history/purchased' && method === 'GET') {
    return json({
      orders: [
        historyItem(posts[1], '2025-05-10'),
        historyItem(posts[2], '2025-05-11'),
        historyItem(posts[5], '2025-05-20'),
      ],
    });
  }

  if (path === '/api/profile/seller-history' && method === 'GET') {
    const email = url.searchParams.get('email') || 'user1@email.com';
    return json({ orders: sellerHistory(email) });
  }

  if (path === '/api/profile/upload-item' && method === 'POST') {
    const newPost: DemoPost = {
      post_id: nextPostId++,
      closet_id: Number(body.closet_id) || 1,
      owner_id: String(body.owner_id || 'user1@email.com'),
      title: String(body.title || 'New Closet Item'),
      likes: Number(body.likes) || 0,
      description: String(body.description || ''),
      date_posted: String(body.date_posted || new Date().toISOString().slice(0, 10)),
      item_condition: String(body.item_condition || 'good'),
      size: String(body.size || 'Medium'),
      price: Number(body.price) || 20,
      bflag: body.for_rent ? 1 : 0,
      sflag: body.for_sale ? 1 : 0,
      rental_end_date: body.rental_date || null,
      categories: Array.isArray(body.categories) ? body.categories.map(Number) : [],
      images: Array.isArray(body.item_pictures) ? body.item_pictures : [],
    };
    posts = [newPost, ...posts];
    return json('item saved to db');
  }

  if (path === '/api/profile/delete-item' && method === 'POST') {
    const postId = Number(body.post_id);
    posts = posts.filter((post) => post.post_id !== postId);
    wishlistIds.delete(postId);
    cartIds = cartIds.filter((id) => id !== postId);
    return json({ success: true, message: 'Item deleted successfully' });
  }

  return json({ success: true });
}

export function installDemoFetch() {
  if (typeof window === 'undefined') return;
  if ((window as any).__closetCircleDemoFetchInstalled) return;

  const originalFetch = window.fetch.bind(window);

  window.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
    const url =
      typeof input === 'string'
        ? input
        : input instanceof URL
          ? input.toString()
          : input.url;

    let parsed: URL;
    try {
      parsed = new URL(url, window.location.origin);
    } catch {
      return originalFetch(input, init);
    }

    const isLocalBackend =
      (parsed.hostname === 'localhost' || parsed.hostname === '127.0.0.1') &&
      parsed.port === '8800';

    if (!isLocalBackend) return originalFetch(input, init);
    return demoResponse(parsed.toString(), init);
  };

  (window as any).__closetCircleDemoFetchInstalled = true;
}
