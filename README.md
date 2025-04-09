# FoodExpiry

A smart food inventory management platform designed to help users minimize food waste through intelligent tracking, sustainability insights, and interactive community engagement.

Original Application link: https://fresh-stock-tracker-devanshparikh15.replit.app/

## Features

- **Expiration Tracking**: Never let food go to waste again. Our smart tracking system reminds you when items are about to expire.
- **Meal Planning**: Plan your meals for the week using items in your inventory to minimize waste and save money.
- **Smart Notifications**: Get timely alerts about expiring food items through email.
- **Waste Insights**: Visualize and track your food waste patterns to make better purchasing decisions.
- **Community Sharing**: Share recipes and food waste reduction tips with a community of like-minded individuals.
- **Mobile Friendly**: Access your food inventory anytime, anywhere with our responsive mobile design.

## Tech Stack

- React.js frontend with TypeScript
- PostgreSQL database integration
- Mobile-responsive design (optimized for both mobile and desktop)
- Tailwind CSS for styling
- Community recipe sharing capabilities
- WebSocket for real-time interactions
- Drizzle ORM for database management
- Zod schema validation
- Error handling and resilience mechanisms

## Getting Started

### Prerequisites

- Node.js (v18 or higher)
- PostgreSQL database
- SendGrid account (for email notifications)

### Installation

1. Clone the repository:
   ```
   git clone https://github.com/yourusername/foodexpiry.git
   cd foodexpiry
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Set up environment variables:
   Create a `.env` file in the root directory with the following:
   ```
   DATABASE_URL=postgres://username:password@localhost:5432/foodexpiry
   SENDGRID_API_KEY=your_sendgrid_api_key
   SENDGRID_FROM_EMAIL=your_verified_sender_email
   ```

4. Run database migrations:
   ```
   npm run db:push
   ```

5. Start the development server:
   ```
   npm run dev
   ```

6. Open your browser and visit [http://localhost:3000](http://localhost:3000)

## Screenshots

Coming soon...

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the LICENSE file for details.
