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

- Node.js 20 or later
- npm

### 1. Clone the Repository

```bash
git clone https://github.com/SanjanaNagwekar/closet-circle.git
cd closet-circle
```

### 2. Configure Auth0

Create a local environment file for the Next.js client:

```bash
cp client/.env.example client/.env.local
```

Fill in the Auth0 values in `client/.env.local`:

```text
AUTH0_DOMAIN=your-tenant.us.auth0.com
AUTH0_CLIENT_ID=
AUTH0_CLIENT_SECRET=
AUTH0_SECRET=
APP_BASE_URL=http://localhost:3000
```

Generate a fresh session secret with:

```bash
openssl rand -hex 32
```

Use that value for `AUTH0_SECRET`. Do not commit `.env.local` or any real credentials.

For the local Auth0 application, configure:

```text
Allowed Callback URL: http://localhost:3000/api/auth/callback
Allowed Logout URL:   http://localhost:3000
```

The project uses Auth0's Next.js v4 middleware while preserving the existing `/api/auth/*` login, logout, and callback URLs.

### 3. Install and Start the Backend

In one terminal:

```bash
cd server
npm ci
npm start
```

The backend API runs at:

```text
http://localhost:8800
```

For local development with automatic restarts, use:

```bash
npm run dev
```

The backend also supports optional environment overrides:

```bash
PORT=8800 CLIENT_ORIGIN=http://localhost:3000 npm start
```

### 4. Install and Start the Frontend

In a separate terminal:

```bash
cd client
npm ci
npm run dev
```

The frontend runs at:

```text
http://localhost:3000
```

## Verification

### Backend tests

From the `server` directory:

```bash
npm test
```

The smoke tests verify that the server starts, the health endpoint responds, trending posts include lister metadata, and the item-upload route binds the rental end date correctly.

### Frontend production build

From the `client` directory:

```bash
npm run build
```

Running the production build is the quickest way to catch TypeScript, Next.js, authentication-integration, or bundling issues before deployment.

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
