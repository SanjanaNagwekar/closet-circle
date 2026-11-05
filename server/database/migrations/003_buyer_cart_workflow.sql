ALTER TABLE Transaction_Listing ADD COLUMN intent TEXT NOT NULL DEFAULT 'purchase'
    CHECK (intent IN ('purchase', 'rental'));

ALTER TABLE Transaction_Listing ADD COLUMN unit_price REAL;

UPDATE Transaction_Listing
SET intent = 'rental'
WHERE post_id IN (
    SELECT post_id
    FROM Post
    WHERE bflag = 1 AND sflag = 0
);

UPDATE Transaction_Listing
SET unit_price = (
    SELECT price
    FROM Post
    WHERE Post.post_id = Transaction_Listing.post_id
)
WHERE unit_price IS NULL;

INSERT OR IGNORE INTO Transaction_Listing (transaction_id, post_id, intent, unit_price)
SELECT (
           SELECT MIN(KeepTransaction.transaction_id)
           FROM Transactions KeepTransaction
           WHERE KeepTransaction.email = PendingTransaction.email
             AND KeepTransaction.status = 'pending'
       ),
       PendingListing.post_id,
       PendingListing.intent,
       PendingListing.unit_price
FROM Transaction_Listing PendingListing
JOIN Transactions PendingTransaction USING (transaction_id)
WHERE PendingTransaction.status = 'pending';

DELETE FROM Transactions
WHERE status = 'pending'
  AND transaction_id <> (
      SELECT MIN(KeepTransaction.transaction_id)
      FROM Transactions KeepTransaction
      WHERE KeepTransaction.email = Transactions.email
        AND KeepTransaction.status = 'pending'
  );

CREATE INDEX idx_transaction_listing_post_intent
    ON Transaction_Listing(post_id, intent);

CREATE TRIGGER transaction_listing_defaults
AFTER INSERT ON Transaction_Listing
WHEN NEW.unit_price IS NULL
BEGIN
    UPDATE Transaction_Listing
    SET unit_price = (
            SELECT price FROM Post WHERE Post.post_id = NEW.post_id
        ),
        intent = CASE
            WHEN (
                SELECT bflag = 1 AND sflag = 0
                FROM Post
                WHERE Post.post_id = NEW.post_id
            ) THEN 'rental'
            ELSE NEW.intent
        END
    WHERE transaction_id = NEW.transaction_id AND post_id = NEW.post_id;
END;
