# Cottoson Portal - A CRM for managing client orders and R2 document storage.

A comprehensive admin portal for managing companies, clients, and orders with a complete order tracking system.

## Tech Stack

- **Frontend**: React, Tailwind CSS, Vite, Storybook
- **Backend**: Node.js, Express
- **Database**: MongoDB
- **Storage**: Cloudflare R2

## Prerequisites

Before running the application, make sure you have the following installed/available:

- [Node.js](https://nodejs.org/) (v18+)
- [MongoDB](https://www.mongodb.com/) (Connection URL required)
- Cloudflare R2 Token (Endpoint, Access Key ID, Secret Access Key)

## Quick Start

Follow these steps to get the app running locally within minutes.

### 1. Clone the repository

```bash
git clone <repository-url>
cd portal
```

### 2. Install Dependencies

Install both frontend and backend dependencies with a single command:

```bash
npm run install:all
```

### 3. Environment Setup

You need to set up environment variables for both backend and frontend.

**Backend:**
Copy the example file and update it with your credentials:

```bash
cd backend
cp .env.example .env
```
Edit `.env` and fill in:
- `MONGODB_URI`: Your MongoDB connection string
- `CLOUDFLARE_ENDPOINT`: Your R2 Endpoint
- `CLOUDFLARE_ACCESS_KEY_ID`: Your R2 Access Key ID
- `CLOUDFLARE_SECRET_ACCESS_KEY`: Your R2 Secret Access Key

**Frontend:**
Copy the example file:

```bash
cd ../frontend
cp .env.example .env
```

### 4. Run the Application

Start both the backend and frontend servers concurrently:

```bash
cd ..  # Return to root directory if checking envs
npm run dev
```

- **Frontend**: http://localhost:3000
- **Backend**: http://localhost:5001

---

## Documentation & Development Guides

### Component Library (Storybook)
We use Storybook for developing and testing UI components in isolation.

To run Storybook:
```bash
npm run storybook
```
Access locally at: http://localhost:6006

- **Atoms**: Basic building blocks (Buttons, Badges)
- **Molecules**: Complex components (Kanban Cards)

### API Documentation (Swagger)
The backend is fully documented using Swagger/OpenAPI.

Access the interactive API docs at:
http://localhost:5001/api/docs

- View all endpoints
- Test API calls directly from the browser
- View Request/Response schemas

---

## Role-Based Access Control (RBAC)

The application uses a robust RBAC system with three distinct roles, each having specific permissions:

### 1. Superadmin
- **Access Level**: Full System Access
- **Capabilities**:
    - Can perform all Admin actions.
    - Specialized administrative overrides (if configured).
    - Can manage internal staff/admin accounts.

### 2. Admin
- **Access Level**: Operational Management
- **Capabilities**:
    - Manage Companies (CRUD).
    - Manage Clients (CRUD).
    - Manage Orders (Create, Update, Delete, Status Changes).
    - Manage Products.
    - View Dashboard Statistics.
    - Upload internal documents.

### 3. Client
- **Access Level**: Restricted / Personal View
- **Capabilities**:
    - View their own profile and assigned company details.
    - View list of orders associated *only* with their company/account.
    - Track order status via the Timeline.
    - Receive system notifications for order updates and document uploads.
    - **Note**: Clients cannot see other clients' data or access administrative settings.

---

## Notifications System

Real-time and persistent notifications keep users informed of critical updates.

**Types**:
- **`document`**: Triggered when a new document (Invoice, Quotation, etc.) is uploaded to an order.
- **`status_update`**: Triggered when an order moves to a new stage in the timeline (e.g., "Fabric Purchase" -> "Cutting").
- **`general`**: General system announcements or messages.

---

## Features

### Home Section (Admin/Superadmin)
- Dashboard with aggregate statistics (Total Companies, Clients, Orders, Revenue)
- Kanban board showing order timeline stages
- Real-time order status visualization

### Companies Section
- Complete CRUD operations
- Table with columns: Company Name, Trade Name, GST Number, Billing Address, Company ID
- Search functionality and Pagination

### Clients Section
- Point of contact management
- Client details: Name, Email, Phone Number, Company
- Edit and delete functionality

### Orders Section
- Order management with detailed columns: Order Number, Date, Quantity, Price, GST status, Payment Status
- Filter by date range and company

### Order Details Page
- **Detailed View**: Client info, Delivery dates, Payment breakdown.
- **Actions**:
    - Update Timeline Status.
    - automatic GST calculation and Discount application.
- **Document Management**:
    - Upload/Delete Quotations, Proforma Invoices, Manufacturing Sheets.
    - Secure storage via **Cloudflare R2**.
- **Timeline Tracking**:
    - Visual progress bar with 7 standard stages (Order Confirmed -> Shipped).

---

## PI Endpoints Overview

### Companies
- `GET /api/companies` - Get all companies
- `POST /api/companies` - Create new company
- `PUT /api/companies/:id` - Update company
- `DELETE /api/companies/:id` - Delete company

### Clients
- `GET /api/clients` - Get all clients
- `POST /api/clients` - Create new client
- `PUT /api/clients/:id` - Update client
- `DELETE /api/clients/:id` - Delete client

### Orders
- `GET /api/orders` - Get all orders (Admin) / Own orders (Client)
- `POST /api/orders` - Create new order
- `PUT /api/orders/:id` - Update order
- `DELETE /api/orders/:id` - Delete order
- `POST /api/orders/:id/documents` - Upload document to R2

---


---

## Common Issues

- **Issue**: Uploads fail with Network Error.
    - **Fix**: Check Cloudflare R2 CORS settings.

- **Issue**: Server crashes on start.
    - **Fix**: Ensure `.env` exists in the backend root.

- **Issue**: MongoDB Connection Error.
    - **Fix**: Check your IP whitelist in MongoDB Atlas and ensure the `MONGODB_URI` is correct.

- **Issue**: API Calls Fail (CORS/Network).
    - **Fix**: Ensure the frontend is targeting the correct backend port (default 5001) and CORS is enabled in `server/index.js`.

- **Issue**: JWT Invalid/Expired.
    - **Fix**: Check if the `JWT_SECRET` matches between environments or if the token has expired (default 7 days).

- **Issue**: Module not found.
    - **Fix**: Run `npm run install:all` to ensure dependencies are installed for both frontend and backend.

---

## Project Structure

```
portal/
├── frontend/                     # React application (Vite)
│   ├── src/
│   │   ├── components/           # Reusable UI components
│   │   │   ├── Layout.jsx        # Main layout wrapper
│   │   │   ├── ClientLayout.jsx  # Layout for client dashboard
│   │   │   └── ...
│   │   ├── pages/                # Application pages
│   │   ├── contexts/             # React Contexts (Auth, etc.)
│   │   ├── services/             # API service calls
│   │   ├── utils/                # Helper functions
│   │   ├── App.jsx               # Main App component with Routes
│   │   └── main.jsx              # Entry point
│   ├── vite.config.js            # Vite configuration
│   └── tailwind.config.js        # Tailwind CSS configuration
│
├── backend/                      # Node.js Express server
│   ├── server/
│   │   ├── models/               # Mongoose Models
│   │   │   ├── User.js           # Auth & Role definition
│   │   │   ├── Client.js         # Client profiles
│   │   │   ├── Order.js          # Order data & Timeline
│   │   │   └── notification.js   # Notification schema
│   │   ├── routes/               # API Routes (Restful)
│   │   ├── controllers/          # Route logic
│   │   ├── middleware/           # Custom Middleware
│   │   │   └── auth.js           # JWT verification & RBAC logic
│   │   ├── services/             # Business Logic Services
│   │   │   └── StorageService.js # Cloudflare R2 Wrapper
│   │   └── config/               # DB & Env configuration
│   ├── index.js                  # Server entry point
│   └── .env.example              # Environment variables template
│
└── README.md                     # This file
```

## License

MIT
