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
<img width="1692" alt="Screenshot 2025-04-09 at 12 24 57 PM" src="https://github.com/user-attachments/assets/9d876042-fc8b-45e1-b986-c9308928a271" />
<img width="1696" alt="Screenshot 2025-04-09 at 12 25 13 PM" src="https://github.com/user-attachments/assets/16c52c47-b827-4e3d-9708-8e900bfb46ed" />
<img width="1704" alt="Screenshot 2025-04-09 at 12 25 31 PM" src="https://github.com/user-attachments/assets/11e7de73-47e3-45c6-b72e-9e882f5d439f" />
<img width="1703" alt="Screenshot 2025-04-09 at 12 25 51 PM" src="https://github.com/user-attachments/assets/30c1497c-9acf-472d-a751-5df9e98483d2" />
<img width="1690" alt="Screenshot 2025-04-09 at 12 26 14 PM" src="https://github.com/user-attachments/assets/066a5196-88d0-42d9-9281-b20a4cc7211e" />
<img width="1710" alt="Screenshot 2025-04-09 at 12 26 34 PM" src="https://github.com/user-attachments/assets/9883929c-72e1-4c69-be3f-26bae1096c22" />
<img width="1705" alt="Screenshot 2025-04-09 at 12 26 48 PM" src="https://github.com/user-attachments/assets/d9d22ba9-3c85-4df8-b814-9d5acecc4b27" />
<img width="1695" alt="Screenshot 2025-04-09 at 12 27 01 PM" src="https://github.com/user-attachments/assets/d2177fdc-6a99-4101-9a3f-89e575dd5516" />



## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the LICENSE file for details.
