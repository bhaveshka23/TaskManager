# Smart Task Management System

A Python/Flask web application built as part of an internship assignment. Features user authentication, full task CRUD, real-time WebSocket notifications, and an analytics module powered by Pandas & NumPy.

## Tech Stack

- **Backend** — Python, Flask, Flask-Login, Flask-SocketIO, SQLAlchemy
- **Database** — PostgreSQL
- **Analytics** — Pandas, NumPy
- **Auth** — JWT (python-jose)
- **Frontend** — HTML, CSS, Vanilla JS

## Project Structure

```
task-manager-backend/
├── app/
│   ├── auth/         # Register, login, logout routes
│   ├── tasks/        # Task CRUD routes
│   ├── analytics/    # Analytics endpoint (Pandas + NumPy)
│   ├── models.py     # User & Task models
│   ├── extensions.py # db, login_manager, socketio
│   ├── sockets.py    # WebSocket event handlers
│   ├── config.py     # App config
│   └── __init__.py   # App factory, CORS, JWT middleware
├── run.py
├── requirements.txt
└── .env

task-manager-frontend/
├── index.html        # Landing page
├── auth.html         # Login / Register
├── dashboard.html    # Main dashboard
├── common.js         # Shared API fetch + helpers
├── auth.js           # Auth page logic
├── dashboard.js      # Dashboard logic
└── styles.css
```

## Setup

### 1. Clone the repo

```bash
git clone <repo-url>
cd task-manager-backend
```

### 2. Create and activate a virtual environment

```bash
python -m venv .venv
# Windows
.venv\Scripts\activate
# macOS/Linux
source .venv/bin/activate
```

### 3. Install dependencies

```bash
pip install -r requirements.txt
```

### 4. Configure environment variables

Create a `.env` file in `task-manager-backend/`:

```env
DATABASE_URL=postgresql://<user>:<password>@localhost/<db_name>
SECRET_KEY=your-secret-key
```

### 5. Set up the database

Create the database in PostgreSQL, then either:

**Option A** — let SQLAlchemy create the tables automatically on first run (handled in `run.py`).

**Option B** — run the schema manually:

```bash
psql -U <user> -d <db_name> -f database_schema.sql
```

### 6. Run the server

```bash
python run.py
```

The API will be available at `http://127.0.0.1:5000`.

### 7. Open the frontend

Open `task-manager-frontend/index.html` in a browser, or serve it with any static file server:

```bash
# e.g. using Python
cd task-manager-frontend
python -m http.server 3000
```

Then visit `http://127.0.0.1:3000`.

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Register a new user |
| POST | `/api/auth/login` | Login, returns JWT token |
| POST | `/api/auth/logout` | Logout |
| GET | `/api/tasks` | Get all tasks for current user |
| POST | `/api/tasks` | Create a new task |
| PUT | `/api/tasks/<id>` | Update a task |
| DELETE | `/api/tasks/<id>` | Delete a task |
| GET | `/api/analytics` | Get task analytics summary |
| GET | `/api/health` | Health check |

## Features

- User registration and login with hashed passwords
- JWT-based authentication (token stored in localStorage)
- Full task management — create, read, update, delete
- Each task has title, description, priority, status, and created date
- Analytics dashboard showing total, completed, pending tasks and completion percentage
- Real-time notifications via WebSockets (Flask-SocketIO)
- Clean responsive frontend with sidebar layout and slide-in task drawer
