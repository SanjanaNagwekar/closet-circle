CREATE TABLE "User"(
    email VARCHAR(60) PRIMARY KEY,
    first_name VARCHAR(40),
    last_name VARCHAR(40),
    join_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    bio VARCHAR(350)
);

CREATE TABLE Friend(
    email VARCHAR(60),
    friend_id VARCHAR(60),
    PRIMARY KEY (email, friend_id),
    FOREIGN KEY (email) REFERENCES User(email) ON DELETE CASCADE,
    FOREIGN KEY (friend_id) REFERENCES User(email) ON DELETE CASCADE
);

CREATE TABLE Closet(
    closet_id INTEGER PRIMARY KEY AUTOINCREMENT,
    name VARCHAR(60) UNIQUE NOT NULL,
    public INTEGER NOT NULL DEFAULT 1,
    member_count INTEGER DEFAULT 0,
    description VARCHAR(500)
);

CREATE TABLE Closet_Membership(
    closet_id INTEGER NOT NULL,
    email VARCHAR(60) NOT NULL,
    PRIMARY KEY (closet_id, email),
    FOREIGN KEY (closet_id) REFERENCES Closet(closet_id) ON DELETE CASCADE,
    FOREIGN KEY (email) REFERENCES User(email) ON DELETE CASCADE
);

CREATE TABLE Closet_Creation(
    closet_id INTEGER NOT NULL,
    admin VARCHAR(60) NOT NULL,
    PRIMARY KEY (closet_id, admin),
    FOREIGN KEY (closet_id) REFERENCES Closet(closet_id) ON DELETE CASCADE,
    FOREIGN KEY (admin) REFERENCES User(email) ON DELETE CASCADE
);

CREATE TABLE Category(
    category_id INTEGER PRIMARY KEY AUTOINCREMENT,
    name VARCHAR(40) NOT NULL UNIQUE
);

CREATE TABLE Post(
    post_id INTEGER PRIMARY KEY AUTOINCREMENT,
    closet_id INTEGER NOT NULL,
    owner_id VARCHAR(60) NOT NULL,
    title VARCHAR(50),
    likes INTEGER DEFAULT 0,
    description VARCHAR(500),
    date_posted TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    item_condition VARCHAR(70) NOT NULL,
    size VARCHAR(25) NOT NULL,
    price REAL,
    bflag INTEGER DEFAULT 0,
    sflag INTEGER DEFAULT 0,
    rental_end_date DATE,
    FOREIGN KEY (closet_id) REFERENCES Closet(closet_id) ON DELETE CASCADE,
    FOREIGN KEY (owner_id) REFERENCES User(email) ON DELETE CASCADE
);

CREATE TABLE Post_Image(
    image_id INTEGER PRIMARY KEY AUTOINCREMENT,
    post_id INTEGER NOT NULL,
    image_url VARCHAR(500) NOT NULL,
    FOREIGN KEY (post_id) REFERENCES Post(post_id) ON DELETE CASCADE
);

CREATE TABLE Wishlist(
    email VARCHAR(60),
    post_id INTEGER,
    PRIMARY KEY (email, post_id),
    FOREIGN KEY (email) REFERENCES User(email) ON DELETE CASCADE,
    FOREIGN KEY (post_id) REFERENCES Post(post_id) ON DELETE CASCADE
);

CREATE TABLE Comment(
    comment_id INTEGER PRIMARY KEY AUTOINCREMENT,
    email VARCHAR(60) NOT NULL,
    post_id INTEGER NOT NULL,
    text VARCHAR(600) NOT NULL,
    publish_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (email) REFERENCES User(email) ON DELETE CASCADE,
    FOREIGN KEY (post_id) REFERENCES Post(post_id) ON DELETE CASCADE
);

CREATE TABLE Review(
    review_id INTEGER PRIMARY KEY AUTOINCREMENT,
    email VARCHAR(60) NOT NULL,
    reviewer VARCHAR(60) NOT NULL,
    publish_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    rating INTEGER NOT NULL,
    text VARCHAR(600) NOT NULL,
    FOREIGN KEY (email) REFERENCES User(email) ON DELETE CASCADE,
    FOREIGN KEY (reviewer) REFERENCES User(email) ON DELETE CASCADE
);

CREATE TABLE Transactions(
    transaction_id INTEGER PRIMARY KEY AUTOINCREMENT,
    email VARCHAR(60) NOT NULL,
    status TEXT DEFAULT 'pending',
    purchased_date TIMESTAMP,
    FOREIGN KEY (email) REFERENCES User(email) ON DELETE CASCADE
);

CREATE TABLE Transaction_Listing(
    transaction_id INTEGER NOT NULL,
    post_id INTEGER NOT NULL,
    PRIMARY KEY (transaction_id, post_id),
    FOREIGN KEY (transaction_id) REFERENCES Transactions(transaction_id) ON DELETE CASCADE,
    FOREIGN KEY (post_id) REFERENCES Post(post_id) ON DELETE CASCADE
);

CREATE TABLE User_Like(
    post_id INTEGER NOT NULL,
    email VARCHAR(60) NOT NULL,
    PRIMARY KEY (post_id, email),
    FOREIGN KEY (email) REFERENCES User(email) ON DELETE CASCADE,
    FOREIGN KEY (post_id) REFERENCES Post(post_id) ON DELETE CASCADE
);

CREATE TABLE Invitation(
    invitation_id INTEGER PRIMARY KEY AUTOINCREMENT,
    inviter VARCHAR(60) NOT NULL,
    invitee VARCHAR(60) NOT NULL,
    closet_id INTEGER NOT NULL,
    time_sent TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    status VARCHAR(15) DEFAULT 'pending',
    FOREIGN KEY (inviter) REFERENCES User(email) ON DELETE CASCADE,
    FOREIGN KEY (invitee) REFERENCES User(email) ON DELETE CASCADE,
    FOREIGN KEY (closet_id) REFERENCES Closet(closet_id) ON DELETE CASCADE
);

CREATE TABLE Post_Category(
    post_id INTEGER NOT NULL,
    category_id INTEGER NOT NULL,
    PRIMARY KEY (post_id, category_id),
    FOREIGN KEY (post_id) REFERENCES Post(post_id) ON DELETE CASCADE,
    FOREIGN KEY (category_id) REFERENCES Category(category_id) ON DELETE CASCADE
);

CREATE TRIGGER Empty_Cart_New_User
AFTER INSERT ON User
FOR EACH ROW
BEGIN
    INSERT INTO Transactions (email, status)
    VALUES (NEW.email, 'pending');
END;

CREATE TRIGGER New_Cart_After_Purchase
AFTER UPDATE ON Transactions
WHEN NEW.status = 'purchased' AND OLD.status = 'pending'
BEGIN
    UPDATE Transactions
    SET purchased_date = CURRENT_TIMESTAMP
    WHERE transaction_id = NEW.transaction_id;

    INSERT INTO Transactions (email, status)
    VALUES (NEW.email, 'pending');
END;
