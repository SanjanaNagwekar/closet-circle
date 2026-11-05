ALTER TABLE Post ADD COLUMN listing_status TEXT NOT NULL DEFAULT 'published'
    CHECK (listing_status IN ('draft', 'published', 'archived'));

ALTER TABLE Post ADD COLUMN updated_at TIMESTAMP;

UPDATE Post
SET updated_at = date_posted
WHERE updated_at IS NULL;

CREATE INDEX idx_post_owner_status ON Post(owner_id, listing_status);
CREATE INDEX idx_post_listing_status ON Post(listing_status);
