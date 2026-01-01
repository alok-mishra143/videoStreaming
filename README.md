# Video Streaming & Organization Management Platform

A full-stack application for managing organizations and streaming videos, built with modern web technologies. This project features user authentication, organization management, video uploading with processing, and real-time updates.

## 🚀 Features

- **User Authentication**: Secure registration and login using JWT.
- **Organization Management**: Create and manage organizations.
- **Video Management**:
  - Upload videos with progress tracking.
  - Automatic video processing using FFmpeg.
  - Content moderation using Sightengine.
  - Video playback interface.
- **Real-time Updates**: Socket.io integration for real-time notifications and updates.
- **Modern UI/UX**: Responsive design built with React, Tailwind CSS, and Shadcn UI components.
- **Dashboard**: Comprehensive dashboard for managing content.

## 🛠️ Tech Stack

### Frontend

- **Framework**: [React](https://react.dev/) with [Vite](https://vitejs.dev/)
- **Language**: TypeScript
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **UI Components**: [Shadcn UI](https://ui.shadcn.com/) (Radix UI primitives)
- **State Management**: [TanStack Query](https://tanstack.com/query/latest) (React Query)
- **Routing**: [React Router](https://reactrouter.com/)
- **Real-time**: Socket.io Client
- **HTTP Client**: Axios

### Backend

- **Runtime**: [Bun](https://bun.sh/) (can also run on Node.js)
- **Framework**: [Express.js](https://expressjs.com/)
- **Database**: [MongoDB](https://www.mongodb.com/) with Mongoose
- **Authentication**: JWT (JSON Web Tokens) & Bcryptjs
- **Video Processing**: Fluent-ffmpeg
- **Content Moderation**: Sightengine
- **Real-time**: Socket.io
- **File Handling**: Multer

## 📂 Project Structure

```
├── backend/                # Backend API and Server
│   ├── src/
│   │   ├── config/         # Database and app configuration
│   │   ├── controllers/    # Request handlers
│   │   ├── middleware/     # Auth and upload middleware
│   │   ├── models/         # Mongoose models (User, Org, Video)
│   │   ├── routes/         # API routes
│   │   └── utils/          # Helper functions
│   ├── uploads/            # Directory for uploaded files
│   └── index.ts            # Entry point
│
└── frontend/               # Frontend React Application
    ├── src/
    │   ├── components/     # Reusable UI components
    │   ├── context/        # React Context (Auth)
    │   ├── hooks/          # Custom hooks
    │   ├── pages/          # Application pages
    │   └── services/       # API service calls
    └── ...
```

## ⚙️ Prerequisites

Before running the project, ensure you have the following installed:

- [Node.js](https://nodejs.org/) (v18+ recommended) or [Bun](https://bun.sh/)
- [MongoDB](https://www.mongodb.com/try/download/community) (running locally or a cloud instance)
- [FFmpeg](https://ffmpeg.org/) (Required for video processing)

## 🔧 Installation & Setup

### 1. Clone the Repository

```bash
git clone <repository-url>
cd <project-directory>
```

### 2. Backend Setup

Navigate to the backend directory and install dependencies:

```bash
cd backend
bun install  # or npm install
```

Create a `.env` file in the `backend` directory with the following variables:

```env
PORT=5000
MONGO_URI=mongodb://localhost:27017/video-streaming-app
JWT_SECRET=your_super_secret_key
CLIENT_URL=http://localhost:5173
SIGHTENGINE_USER=your_sightengine_user
SIGHTENGINE_SECRET=your_sightengine_secret
```

Start the backend server:

```bash
bun dev      # Development mode
# or
npm run dev
```

### 3. Frontend Setup

Navigate to the frontend directory and install dependencies:

```bash
cd ../frontend
npm install
```

Start the frontend development server:

```bash
npm run dev
```

The application should now be running at `http://localhost:5173`.

## 📡 API Endpoints

### Auth

- `POST /api/auth/register` - Register a new user
- `POST /api/auth/login` - Login user

### Organizations

- `GET /api/orgs` - List organizations
- `POST /api/orgs` - Create an organization
- `GET /api/orgs/:id` - Get organization details

### Videos

- `GET /api/videos` - List videos
- `POST /api/videos/upload` - Upload a video
- `GET /api/videos/:id` - Get video details

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

This project is licensed under the MIT License.
