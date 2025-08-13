
# Vinnoswad - Restaurant Management System

Vinnoswad is a comprehensive, modern restaurant management system designed to streamline operations from order taking to billing. Built with a focus on efficiency and user experience, it provides distinct interfaces for different staff roles, ensuring a smooth workflow for the entire restaurant.

This application is built with Next.js, React, Tailwind CSS, and ShadCN UI components, all running on a MongoDB database.

## Key Features

- **Role-Based Access Control:** Secure, distinct dashboards for different restaurant staff roles.
  - **Admin:** Full oversight of the system, including staff management (create/approve/delete users), live restaurant status monitoring, complete order history, and detailed downloadable reports.
  - **Manager:** Manages daily operations, including real-time order approval, complete menu management (add/edit/delete items), and viewing live kitchen and service stats.
  - **Waiter:** A mobile-friendly interface to take customer orders, manage table statuses, generate bills, and process payments instantly via UPI QR codes.
  - **Kitchen:** A clear, real-time queue of approved orders to be prepared, with the ability to mark orders as ready for serving.
- **Real-time Order Management:** A seamless flow from order creation by the waiter, to approval by the manager, preparation in the kitchen, and finally serving and billing.
- **Live Table Management:** A dynamic grid view of all restaurant tables, showing their current status (available/occupied) and which waiter is assigned to them.
- **Instant UPI Payments:** Generate bills with a scannable QR code that customers can use to pay the exact amount via any UPI app.
- **Cloudinary Image Management:** Menu item images are uploaded and managed via Cloudinary, providing fast, optimized image delivery.
- **Reporting & Analytics:** Admins can generate and download detailed CSV reports for orders, bills, and user data for any date range.

## Tech Stack

- **Framework:** [Next.js](https://nextjs.org/) (with App Router)
- **UI Library:** [React](https://react.dev/)
- **UI Components:** [ShadCN UI](https://ui.shadcn.com/)
- **Styling:** [Tailwind CSS](https://tailwindcss.com/)
- **Database:** [MongoDB](https://www.mongodb.com/)
- **Image Hosting:** [Cloudinary](https://cloudinary.com/)
- **Payments:** [Razorpay](https://razorpay.com/)
- **Authentication:** JWT-based session management

## Getting Started

### Prerequisites

- Node.js (v18 or later)
- npm or yarn
- A MongoDB database instance (local or cloud-based like MongoDB Atlas)
- A Cloudinary account (a free account is sufficient)
- A Razorpay account for payment processing.

### Installation & Setup

1.  **Clone the repository:**
    ```bash
    git clone <repository-url>
    cd vinnoswad_restaurant_management
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    ```

3.  **Set up environment variables:**
    Create a file named `.env.local` in the root of the project and add your secrets.

    ```.env.local
    # MongoDB
    MONGODB_URI="your_mongodb_connection_string"

    # JWT
    JWT_SECRET="your_super_secret_jwt_key_that_is_at_least_32_characters_long"

    # Cloudinary
    CLOUDINARY_CLOUD_NAME="your_cloudinary_cloud_name"
    CLOUDINARY_API_KEY="your_cloudinary_api_key"
    CLOUDINARY_API_SECRET="your_cloudinary_api_secret"

    # Razorpay (Go to Settings -> API Keys in your Razorpay dashboard)
    # The KEY_ID is public and can be prefixed with NEXT_PUBLIC_
    NEXT_PUBLIC_RAZORPAY_KEY_ID="your_razorpay_key_id"
    RAZORPAY_KEY_SECRET="your_razorpay_key_secret"
    
    # Fallback UPI ID for QR code payments if Razorpay is not configured
    NEXT_PUBLIC_FALLBACK_UPI_ID="dasjojo7-1@okicici"
    ```

4.  **Run the development server:**
    ```bash
    npm run dev
    ```
    The application will be available at `http://localhost:9002`.

## Demo Accounts

To quickly test the application, you can use the pre-seeded demo accounts. On the first login, the database will be seeded with these users and other initial data.

-   **Admin:** `admin@vinnoswad.com`
-   **Manager:** `manager@vinnoswad.com`
-   **Waiter:** `arjun@vinnoswad.com`
-   **Kitchen:** `kitchen@vinnoswad.com`

The password for all demo accounts is: `123456`
