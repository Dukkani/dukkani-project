# Dukkani - دكاني

A comprehensive e-commerce platform for creating online stores in Libya, built with React, TypeScript, and Firebase. Ready for production deployment.

## Features

- **Arabic-First Design**: Built with Arabic as the primary language with RTL support
- **Subscription-Based Access**: Mandatory monthly subscription model (25 LYD/month)
- **Shop Management**: Create and manage online stores with custom URLs
- **Product Management**: Add, edit, and delete products with image uploads
- **WhatsApp Integration**: Direct ordering through WhatsApp
- **Firebase Backend**: Authentication, Firestore database, and storage
- **SADAD Payment Integration**: Local payment processing for Libya
- **Responsive Design**: Mobile-first approach with Tailwind CSS
- **Multi-language Support**: Arabic and English with react-i18next
- **Professional Shop Branding**: Logos, banners, and social media integration
- **Customer Reviews**: Rating and review system for products
- **SEO Optimized**: Meta tags, structured data, and performance optimization
- **PWA Ready**: Progressive Web App capabilities

## Tech Stack

- **Frontend**: React 18, TypeScript, Vite
- **Styling**: Tailwind CSS with custom RTL support
- **Backend**: Firebase (Auth, Firestore, Storage)
- **Routing**: React Router DOM
- **Internationalization**: react-i18next
- **Payment**: SADAD API integration
- **Icons**: Lucide React
- **Image Upload**: Upload.io integration
- **Performance**: Optimized builds and lazy loading

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- Firebase account and project
- SADAD payment gateway credentials

### Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```

3. Configure environment variables:
   ```bash
   cp .env.example .env
   ```
   Update the `.env` file with your configuration values.

4. Configure Firebase:
   - Create a Firebase project
   - Enable Authentication (Email/Password and Google)
   - Create Firestore database
   - Enable Storage
   - Update `src/config/firebase.ts` with your config

5. Start the development server:
   ```bash
   npm run dev
   ```

## Production Deployment

### Build for Production
```bash
npm run build:prod
```

### Preview Production Build
```bash
npm run preview
```

### Type Checking
```bash
npm run type-check
```

### Deployment Checklist
- [ ] Environment variables configured
- [ ] Firebase project set up and configured
- [ ] Upload.io account configured
- [ ] Domain name configured
- [ ] SSL certificate installed
- [ ] Analytics tracking set up (optional)
- [ ] Error monitoring configured (optional)

## Database Schema

### Users Collection
```typescript
{
  email: string;
  createdAt: timestamp;
  subscription: {
    status: 'active' | 'inactive' | 'payment_pending' | 'cancelled';
    planId: string;
    subscriptionEndDate: timestamp;
    sadadTransactionId: string;
  };
}
```

### Shops Collection
```typescript
{
  ownerId: string;
  shopName: string;
  description: string;
  whatsappNumber: string;
  shopUrlSlug: string;
  logoUrl?: string;
  bannerUrl?: string;
  socialMedia?: {
    facebook?: string;
    instagram?: string;
    twitter?: string;
    tiktok?: string;
    youtube?: string;
  };
  businessInfo?: {
    address?: string;
    phone?: string;
    email?: string;
    workingHours?: string;
  };
  createdAt: timestamp;
}
```

### Products Collection
```typescript
{
  shopId: string;
  productName: string;
  description?: string;
  price: number;
  imageUrl: string;
  category: string;
  createdAt: timestamp;
}
```

### Ratings Collection
```typescript
{
  productId: string;
  userId: string;
  rating: number;
  createdAt: timestamp;
}
```

## Routes

- `/` - Landing page
- `/signup` - User registration
- `/login` - User authentication
- `/forgot-password` - Password reset
- `/subscribe` - Payment and subscription
- `/dashboard` - Shop management (protected)
- `/shop/:shopUrlSlug` - Public shop page
- `/support` - Support and FAQ page

## Features Implementation

### Authentication
- Email/password and Google authentication
- Protected routes based on subscription status
- Automatic redirection based on user state

### Payment Processing
- SADAD API integration for local payments
- Subscription status management
- Payment validation and error handling

### Shop Management
- Create shop with custom URL slug
- Edit shop information
- Upload shop logo and banner
- Add social media links and business information
- Copy shop link functionality
- View public shop page

### Product Management
- Add products with image uploads
- Categorize products
- Edit and delete products
- Image storage with Upload.io
- Product grid display

### Customer Reviews
- Star rating system (1-5 stars)
- User authentication required for ratings
- Average rating calculation
- Review count display

### WhatsApp Integration
- Generate WhatsApp links with pre-filled messages
- Support for Arabic and English templates
- Direct ordering functionality

### Marketplace
- Browse all products from all shops
- Search and filter functionality
- Category-based filtering
- Product detail modals
- Featured shops section

## Styling

The application uses Tailwind CSS with custom RTL support:
- Arabic typography with Cairo font
- RTL-aware spacing utilities
- Custom animations and transitions
- Responsive design patterns
- Consistent color scheme
- Professional branding elements
- Hover effects and micro-interactions

## Deployment

1. Build the application:
   ```bash
   npm run build:prod
   ```

2. Deploy to your preferred hosting platform
   - Netlify (recommended)
   - Vercel
   - Firebase Hosting
   - Traditional web hosting

3. Configure environment variables
4. Set up Firebase security rules
5. Configure Upload.io for image uploads
6. Set up custom domain and SSL
7. Configure analytics (optional)

## Performance Optimization

- Code splitting and lazy loading
- Image optimization and lazy loading
- Bundle optimization with Vite
- Preconnect to external domains
- Service worker for PWA capabilities
- Optimized Firebase queries

## SEO Features

- Meta tags and Open Graph
- Structured data (JSON-LD)
- Sitemap and robots.txt
- Canonical URLs
- Performance optimization
- Mobile-first responsive design

## Security Features

- Firebase Authentication
- Firestore security rules
- Input validation and sanitization
- Protected routes
- HTTPS enforcement
- XSS protection

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## License

This project is licensed under the MIT License.