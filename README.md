# EasyLearning CRM

**Powerful CRM for Educational Organizations** 🚀

## About

EasyLearning CRM is a comprehensive Customer Relationship Management system designed specifically for educational organizations. Built with modern technologies, it helps you manage leads, track deals, automate workflows, and grow your educational business efficiently.

### Key Features

- 📊 **Lead Management**: Capture, track, and nurture leads from multiple sources
- 💰 **Deal Pipeline**: Visual Kanban board with payment tracking
- 📞 **Call Tracking**: Log and record all customer interactions
- 📧 **Campaign Management**: Create and track marketing campaigns
- 👥 **Team Collaboration**: Role-based access control (Admin, Manager, Agent, Viewer)
- 📈 **Analytics & Reports**: Comprehensive dashboards and performance metrics
- 📁 **Bulk Operations**: Import/export leads, bulk edit, and bulk assignment
- 💳 **Payment Tracking**: Track payments with multiple modes and statuses
- 🎓 **Course Management**: Manage courses, batches, and student enrollments

## Tech Stack

This project is built with the [T3 Stack](https://create.t3.gg/):

- [Next.js 15](https://nextjs.org) - React framework with App Router
- [NextAuth.js](https://next-auth.js.org) - Authentication
- [Prisma](https://prisma.io) - ORM for database management
- [tRPC](https://trpc.io) - End-to-end typesafe APIs
- [Tailwind CSS](https://tailwindcss.com) - Styling
- [Tabler Icons](https://tabler.io/icons) - Icon library
- [Razorpay](https://razorpay.com) - Payment processing

## Getting Started

### Prerequisites

- Node.js 18+ or Bun
- PostgreSQL database
- Razorpay account for payments
- Google OAuth credentials (optional)

### Installation

1. Clone the repository:

```bash
git clone https://github.com/yourusername/mhtcet-prep.git
cd mhtcet-prep
```

2. Install dependencies:

```bash
pnpm install
# or
bun install
```

3. Set up environment variables:
   Create a `.env` file in the root directory with the following variables:

```env
DATABASE_URL="postgresql://..."
AUTH_SECRET="your-auth-secret"
AUTH_GOOGLE_ID="your-google-client-id"
AUTH_GOOGLE_SECRET="your-google-client-secret"
RAZORPAY_KEY_ID="your-razorpay-key-id"
RAZORPAY_KEY_SECRET="your-razorpay-key-secret"
NEXT_PUBLIC_RAZORPAY_KEY_ID="your-razorpay-key-id"
```

4. Set up the database:

```bash
pnpm db:push
pnpm db:seed
```

5. Run the development server:

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Available Scripts

- `pnpm dev` - Start development server with Turbopack
- `pnpm build` - Build for production
- `pnpm start` - Start production server
- `pnpm lint` - Run ESLint
- `pnpm format:write` - Format code with Prettier
- `pnpm db:studio` - Open Prisma Studio
- `pnpm db:push` - Push schema changes to database
- `pnpm db:seed` - Seed the database

## Project Structure

```
src/
├── app/              # Next.js App Router pages
├── components/       # React components
├── server/          # Server-side code (API, auth)
├── lib/             # Utility functions
├── hooks/           # Custom React hooks
├── styles/          # Global styles
└── trpc/            # tRPC configuration
```

## Deployment

This application can be deployed on:

- [Vercel](https://vercel.com) (recommended)
- [Netlify](https://netlify.com)
- [Docker](https://docker.com)

For detailed deployment instructions, see the [T3 Stack deployment guides](https://create.t3.gg/en/deployment/vercel).

## License

© 2025 MHT CET Prep. All rights reserved.

## Support

For support, email support@mhtcet.app or visit our website at [mhtcet.app](https://mhtcet.app).
