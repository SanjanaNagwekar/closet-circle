# Closet Circle

Closet Circle is a full-stack peer-to-peer clothing marketplace designed to make borrowing, exchanging, and discovering clothing more sustainable.

Users can create profiles, browse and list clothing, save favorites, manage a shopping cart, complete marketplace transactions, and view buyer and seller history.

## Tech Stack

### Frontend
- Next.js
- React
- TypeScript
- Tailwind CSS
- Auth0

### Backend
- Node.js
- Express.js
- SQLite
- REST APIs

## Key Features

- Authenticated user accounts and profiles
- Clothing listings and product discovery
- Trending and categorized marketplace listings
- Favorites and wishlist management
- Shopping cart and transaction workflows
- Buyer order history
- Seller transaction history
- Listing and profile management

## Architecture

Closet Circle follows a client-server architecture:

- The **Next.js frontend** provides the marketplace UI and authentication flow.
- The **Node.js/Express backend** exposes REST API endpoints for users, listings, profiles, carts, transactions, and marketplace data.
- **SQLite** stores users, listings, categories, transactions, favorites, and related application data.
- **Auth0** provides user authentication.

## My Contributions

Closet Circle was developed collaboratively as a senior-year software engineering project at San José State University.

My contributions included:

- Developing features across buyer and seller marketplace workflows, including order history and seller transaction history.
- Contributing to user profile, marketplace, and transaction-related functionality across the full-stack application.
- Integrating frontend features with backend REST APIs and SQLite-backed application data.
- Debugging and refining application behavior, user flows, and overall product experience.

## Database Design

The application uses a relational SQLite database to model users, listings, transactions, categories, favorites, and other marketplace data.

![Closet Circle Database ERD](server/databases/closet_circle_erd.png)

## Running Locally

### Prerequisites

Make sure the following are installed:

- Node.js
- npm

### 1. Clone the Repository

```bash
git clone https://github.com/SanjanaNagwekar/closet-circle.git
cd closet-circle
```

### 2. Install and Start the Frontend

```bash
cd client
npm install
npm run dev
```

The frontend runs at:

```text
http://localhost:3000
```

### 3. Install and Start the Backend

In a separate terminal:

```bash
cd server
npm install
npm start
```

The backend API runs at:

```text
http://localhost:8800
```

## Project Documentation

Additional design and architecture documentation is available in the [`documentation`](documentation/) directory, including:

- Final project presentation
- Block architecture
- Layer architecture
- Class diagram
- Sequence diagrams
- Feature documentation

Database schema files and the ER diagram are available in [`server/databases`](server/databases/).

## Team Project

Closet Circle was developed collaboratively as part of San José State University's CS 160 Software Engineering course.
