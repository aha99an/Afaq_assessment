# Full Stack Application

This is a full-stack application with Express.js backend and React Native frontend.

## Backend Setup

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env` file in the backend directory with the following variables:
   ```
   PORT=3000
   MONGODB_URI=mongodb://localhost:27017/your_database_name
   NODE_ENV=development
   ```

4. Start the development server:
   ```bash
   npm run dev
   ```

## Frontend Setup

1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the Expo development server:
   ```bash
   npm start
   ```

## Project Structure

### Backend
- `routes/` - API route definitions
- `controllers/` - Route controllers
- `models/` - Database models
- `config/` - Configuration files
- `index.js` - Main application file

### Frontend
- `app/` - Main application screens
- `components/` - Reusable components
- `assets/` - Static assets
- `constants/` - Application constants
- `hooks/` - Custom React hooks

## Development

- Backend runs on: http://localhost:3000
- Frontend runs on: Expo development server 