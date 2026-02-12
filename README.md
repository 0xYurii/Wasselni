# Wasselni 🚗🇩🇿


## Features
- User authentication
- Ride creation & search
- Seat reservation
- Messaging between driver and passenger

## Tech Stack
- Backend: Node.js / Express
- Database: PostgreSQL
- Frontend: (to be defined)

## Backend Architecture
```text
Wasselni
├── prisma/              # Database "Partition"
│   ├── schema.prisma
│   └── migrations/
├── src/
│   ├── config/          # Environment variables & external service configs
│   ├── core/            # The "Kernel": shared logic that runs everything
│   │   ├── middleware/  # Auth checks, logging, error handling
│   │   ├── errors/      # Custom error classes (AppError, NotFound)
│   │   └── utils/       # Helper functions (date formatting, calculation)
│   ├── modules/         # Feature slices
│   │   ├── auth/        # Login, Signup, OTP
│   │   ├── user/        # Profiles, Ratings, Preferences
│   │   ├── ride/        # Ride CRUD, Waypoints
│   │   ├── matching/
│   │   ├── geo/
│   │   └── payment/
│   ├── app.ts           # Express app setup
│   └── server.ts        # Entry point
└── package.json
```

## Team
@Younes, @Ayoub, @Tedj, @Amjed, @Siraj
