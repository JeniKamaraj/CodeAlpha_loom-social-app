# Loom — a mini social media app

Vanilla HTML/CSS/JS frontend, Express.js + MongoDB backend, JWT auth.

## Features
- Register / log in (JWT-based sessions)
- User profiles with display name, bio, avatar color
- Create, view, and delete posts (500 char limit)
- Comment on posts
- Like / unlike posts
- Follow / unfollow users
- "Following" feed + "Explore" (global) feed

## Project structure
```
loom/
  backend/
    config/db.js         MongoDB connection
    models/               User, Post, Comment (Mongoose schemas)
    middleware/auth.js     JWT verification
    routes/                auth.js, users.js, posts.js
    server.js              Express app entry point
  frontend/
    index.html             Login / register
    feed.html               Composer + following/explore feed
    profile.html            Profile view + edit + follow
    css/style.css
    js/api.js               fetch wrapper, session helpers
    js/auth.js, feed.js, profile.js, posts.js
```

## Setup

### 1. Install MongoDB
Run MongoDB locally (`mongod`), or use a free MongoDB Atlas cluster and grab its connection string.

### 2. Configure the backend
```bash
cd backend
cp .env.example .env
# edit .env: set MONGO_URI and a real JWT_SECRET
npm install
```

### 3. Run the server
```bash
npm start
# or, for auto-reload during development:
npm run dev
```

The Express server also serves the frontend as static files, so once it's running, open:

```
http://localhost:5000
```

That's it — no separate frontend server needed. Register a user, post something, open an incognito window and register a second user to test follow/like/comment interactions between accounts.

## API overview

| Method | Route                          | Auth | Description                    |
|--------|--------------------------------|------|--------------------------------|
| POST   | /api/auth/register             | no   | Create account                 |
| POST   | /api/auth/login                | no   | Log in, get JWT                |
| GET    | /api/auth/me                   | yes  | Current user                   |
| GET    | /api/users/:username           | opt  | Public profile + their posts   |
| PATCH  | /api/users/me/edit              | yes  | Update display name / bio      |
| POST   | /api/users/:username/follow    | yes  | Toggle follow                  |
| GET    | /api/posts/feed                | opt  | Posts from people you follow   |
| GET    | /api/posts/explore              | opt  | All posts, newest first        |
| POST   | /api/posts                      | yes  | Create a post                  |
| DELETE | /api/posts/:id                  | yes  | Delete your own post           |
| POST   | /api/posts/:id/like             | yes  | Toggle like                    |
| GET    | /api/posts/:id/comments         | no   | List comments                  |
| POST   | /api/posts/:id/comments         | yes  | Add a comment                  |

## Notes / next steps
- Passwords are hashed with bcrypt; tokens are signed JWTs stored in `localStorage`.
- There's no image upload yet — avatars are generated color swatches with the user's initial. Adding real image uploads would mean wiring in something like `multer` + object storage.
- No pagination yet (feed/explore cap at 50 posts) — worth adding for a larger dataset.
- CORS is wide open (`cors()` with no options) since frontend and backend share an origin in this setup; lock it down if you split them across origins.
