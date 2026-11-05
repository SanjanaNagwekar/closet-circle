UPDATE Post_Image
SET image_url = 'https://images.unsplash.com/photo-1636363285075-5494f25c78fd?auto=format&fit=crop&w=1200&q=80'
WHERE post_id = (
    SELECT post_id
    FROM Post
    WHERE title = 'Kid’s Rainier Rain Jacket'
);

UPDATE Post_Image
SET image_url = 'https://hrd-live.cdn.scayle.cloud/images/1a860dc27b24ee705acfb6907d953d25.jpg?bg=ffffff&brightness=1&height=1230&quality=75&width=922'
WHERE post_id = (
    SELECT post_id
    FROM Post
    WHERE title = 'Barbour x ERDEM Dhalia Waxed Jacket'
);

DELETE FROM Post
WHERE title IN (
    'Diamond Star of David Necklace',
    'Kid’s Grandma Halloween Costume'
);
