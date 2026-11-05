ALTER TABLE Transaction_Listing ADD COLUMN rental_start_date DATE;
ALTER TABLE Transaction_Listing ADD COLUMN rental_end_date DATE;

CREATE TABLE Rental_Request(
    rental_id INTEGER PRIMARY KEY AUTOINCREMENT,
    transaction_id INTEGER NOT NULL,
    post_id INTEGER NOT NULL,
    renter_email VARCHAR(60) NOT NULL,
    seller_email VARCHAR(60) NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    daily_rate REAL NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending'
        CHECK (status IN ('pending', 'approved', 'declined', 'cancelled', 'completed')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    decision_at TIMESTAMP,
    completed_at TIMESTAMP,
    UNIQUE (transaction_id, post_id),
    CHECK (end_date >= start_date),
    CHECK (daily_rate > 0),
    FOREIGN KEY (transaction_id, post_id)
        REFERENCES Transaction_Listing(transaction_id, post_id) ON DELETE CASCADE,
    FOREIGN KEY (renter_email) REFERENCES User(email) ON DELETE CASCADE,
    FOREIGN KEY (seller_email) REFERENCES User(email) ON DELETE CASCADE
);

CREATE INDEX idx_rental_request_renter
    ON Rental_Request(renter_email, status, start_date);

CREATE INDEX idx_rental_request_seller
    ON Rental_Request(seller_email, status, start_date);

CREATE INDEX idx_rental_request_availability
    ON Rental_Request(post_id, status, start_date, end_date);
