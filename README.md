# FuseTalk RW

A Rwanda-focused random video & text chat platform for cultural connection and tourism discovery.

## 🏗️ Architecture

- **Backend**: Django + Channels (WebSocket + REST API)
- **Frontend**: React + Tailwind CSS (Web Application)
- **Mobile**: Flutter (Coming Soon)
- **Database**: PostgreSQL + Redis
- **Infrastructure**: Docker + Docker Compose

## 🚀 Quick Start

```bash
# Clone and setup
git clone <your-repo>
cd "FuseTalk RW"

# Start development environment
docker-compose up -d

# Backend setup
cd Backend
python manage.py migrate
python manage.py runserver

# Frontend setup
cd Frontend
npm install
npm run dev
