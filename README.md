# HabitHero

A family habit tracking application built with React and Supabase.

## Deployment Instructions

### Deploying to Vercel

1. Create a Vercel account at https://vercel.com
2. Install Vercel CLI:
   ```bash
   npm install -g vercel
   ```
3. Login to Vercel:
   ```bash
   vercel login
   ```
4. Deploy the project:
   ```bash
   vercel
   ```

### Environment Variables

Set up the following environment variables in your Vercel project settings:

- `REACT_APP_SUPABASE_URL`: Your Supabase project URL
- `REACT_APP_SUPABASE_ANON_KEY`: Your Supabase anonymous key
- `REACT_APP_SUPABASE_SERVICE_ROLE_KEY`: Your Supabase service role key

### Development

1. Install dependencies:
   ```bash
   npm install
   ```

2. Start development server:
   ```bash
   npm start
   ```

3. Build for production:
   ```bash
   npm run build
   ```

## Features

- Family habit tracking
- Real-time updates
- 3D medal rewards
- Family activity feed
- Calendar integration
- Offline support

## Tech Stack

- React
- TypeScript
- Supabase
- Three.js
- Framer Motion
- React Router
