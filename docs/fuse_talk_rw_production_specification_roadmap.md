# FuseTalk RW — Production Specification & Roadmap

**Purpose:** A single, shareable production-ready document describing the FuseTalk RW platform (web + mobile), full feature descriptions, technology choices, UI/UX guidelines, deployment checklist, and a Gantt-style timeline for the first 20 weeks. Use this document as a reference for development, QA, product, and for agents that will take this as input.

---

## 1. Executive summary

FuseTalk RW is a Rwanda-focused, random video & text chat platform inspired by Omegle but redesigned for safety, cultural relevance, and tourism-driven discovery. The platform connects users randomly or by topic ("vibe tags"), offers language options, and includes moderation and verification features to create a trusted environment. This document covers features, technical design, product requirements, UI/UX guidelines, dev & deployment checklist, a Gantt-style timeline, and handover assets.

---

## 2. Goals & success metrics

**Primary goals**
- Launch a stable, low-latency web MVP with text + peer-to-peer video chat (WebRTC).
- Acquire early users in universities and Kigali, then onboard tourists.
- Maintain a safe environment with <1% daily active reports per 1k users.

**Key metrics**
- DAU (daily active users)
- Retention Day-1 / Day-7
- Average session duration
- Match success rate (connected sessions / attempts)
- Report rate and moderation response time

---

## 3. Product scope (MVP) — features and behavior

### 3.1 Onboarding & entry
- **Landing page**: concise value proposition, CTA "Join Chat" or "Join as Visitor".
- **Modes**: Guest (nickname) or Authenticated (Google / Phone). Auth optional but recommended for verified badge.
- **Visitor toggle**: "I'm visiting Rwanda" — toggles mode for matching with locals.

### 3.2 Matching
- **Random pairing**: default behavior: pair two users randomly.
- **Topic-based matching**: selected "Vibe Tags" narrow pool before random pairing (Music, Tech, Jokes, Relationships, Travel).
- **Language filter**: Kinyarwanda / English / French / Mixed.
- **Pre-connect preview**: small self-preview window + "Connect" button; peer preview optional to reduce surprise.

### 3.3 Chat modes
- **Text-only**: instant chat with typing indicators and timestamps.
- **Video + Audio (WebRTC)**: peer-to-peer connection. Toggle camera & mic, toggle video blur until accepted.
- **Next**: skip to another random person immediately; closes current peer connection gracefully.
- **End Chat**: end conversation & optional feedback prompt.

### 3.4 Fuse Moments (mutual connection)
- **Like**: each user can "Like" the chat. If both like, create a Fuse Moment.
- **Fuse Moment**: store short summary (user-entered text up to 140 chars), timestamp, and optional contact exchange.
- **Secure exchange**: contact info revealed only if both opt-in (one-time pop-up).

### 3.5 Safety & moderation
- **Report**: immediate report button with categories (nudity, harassment, spam, underage suspicion).
- **Block**: block user from future connections.
- **AI filter**: text content filtered via Perspective API (or an open-source classifier) before sending and flagged.
- **Video moderation heuristics**: heuristics + client-side blur toggle; if user reports or system flags nudity, session ends and evidence is stored (thumbnail + logs) for review.
- **Rate limits & cooldowns**: prevent abuse (max X nexts per minute for guests).

### 3.6 Admin Dashboard
- View active sessions, flagged messages, user reports, and moderation queue.
- Tools for banning user IDs / IPs, viewing session logs, and exporting data for trusted investigations.

### 3.7 User profile (minimal for MVP)
- Nickname, avatar (optional), country (optional), language preferences, number of Fuse Moments.
- Privacy-first default: public profile limited to nickname and simple stats.

### 3.8 Weekend Vibes / Events (admin-controlled)
- Admin config for themed sessions visible in UI.
- Banner on landing and filter to join event rooms.

---

## 4. High-level architecture

**Frontend (Web)**
- React (or Next.js) + Tailwind CSS
- WebRTC handling via native APIs or small wrapper (Simple-Peer / PeerJS)
- WebSocket client (Socket.io or native WebSocket) for signaling & presence

**Backend**
- Django + Django Channels (WebSockets) OR FastAPI + Socket.io (depending on team preference)
- Postgres for relational data
- Redis for ephemeral state (match queues, signaling tokens)
- Optional media: Cloudinary/S3 only for avatars or saved thumbnails. Video is P2P via WebRTC.

**Infrastructure**
- Dockerized services
- Reverse proxy (NGINX) + Gunicorn / Uvicorn
- Hosting: DigitalOcean / Render / Fly.io (start small, scale later)
- CDN for static assets (Cloudflare)

**Third-party services**
- Authentication: Firebase Auth (phone/Google) or Django AllAuth + Twilio for SMS verification
- Moderation API: Google Perspective API or open-source moderation model
- Analytics: Plausible / Google Analytics
- Crash reporting: Sentry

---

## 5. Data model (summary)

**User**
- id (uuid)
- nickname
- email (optional)
- phone (optional, verified boolean)
- verified (boolean)
- avatar_url
- country
- language_prefs
- created_at

**Session (ChatRoom)**
- id (uuid)
- type (video/text)
- topic_tag
- language
- user_a_id, user_b_id (nullable until connected)
- started_at
- ended_at
- status (active, ended, flagged)

**FuseMoment**
- id
- user_a_id, user_b_id
- summary_text
- created_at

**Report**
- id
- reporter_id
- reported_session_id
- category
- evidence (text, optional thumbnail reference)
- reviewed (boolean)
- action_taken (ban, warning, none)

---

## 6. API & signaling endpoints (examples)

**Auth**
- POST /api/auth/guest — create guest session (nickname)
- POST /api/auth/google — OAuth flow
- POST /api/auth/phone — send SMS code

**Match & signaling**
- POST /api/match/join — join match queue (topic, language)
- POST /api/match/leave — leave queue
- WebSocket /ws/signaling/ — for signaling messages (offer/answer/ice/heartbeat)

**Session control**
- POST /api/session/{id}/end
- POST /api/session/{id}/report
- POST /api/session/{id}/like — like to create FuseMoment

**Admin**
- GET /api/admin/flags
- POST /api/admin/user/{id}/ban

---

## 7. Security & privacy considerations
- **Privacy-by-default**: no PII is shared unless user opts-in. Keep minimal personal info.
- **TLS everywhere**: HTTPS enforced.
- **Data retention**: keep logs and flagged evidence for a set time (e.g., 90 days) for review.
- **GDPR-style practices**: allow user data deletion requests.
- **Access control**: RBAC for admin panel.

---

## 8. UI / UX guidelines

**Brand & tone**
- Warm, welcoming, youthful. Emphasize friendliness and respect.
- Language: mix of Kinyarwanda & English. Keep copy concise and friendly.

**Colors**
- Kigali Blue: `#0E6EB8` (primary)
- Sunset Orange: `#FF7A3D` (accent)
- Night Charcoal (text): `#111827`
- Soft Grey (bg): `#F3F4F6`
- Success Green: `#10B981`

**Typography**
- Headings: Inter / Montserrat (bold for titles)
- Body: Inter / Roboto (regular)

**Components**
- Top nav: logo (left), user/presence (right)
- Chat area: big video / message column + side controls (Next / Report / End)
- Buttons: rounded (2xl), subtle shadow, emoji-friendly
- Modals: centered, with clear CTA (Report reasons, confirm end chat)

**Mobile-first specifics**
- Camera permissions flow with clear microcopy: "Allow camera & mic to join video chats".
- Single-column layout: video (80% height) + controls below.
- Large tappable controls (min 44px touch targets).

**Accessibility**
- Contrast ratio >= 4.5:1 for primary text
- Keyboard navigable controls and focus outlines
- ARIA labels for key interactive elements (Report, Next, End)

---

## 9. Dev & deployment checklist

**Dev environment**
- Docker Compose with services: web, worker (channels), redis, postgres
- Environment variables sample `.env.example` (see Appendix)

**CI/CD**
- GitHub Actions with test suite and linting
- Docker build + deploy to staging

**Production**
- Setup monitoring (Sentry), analytics
- Auto-scaling policy (when CPU > 70% for sustained 5 min)
- Backups: nightly DB dump to S3

---

## 10. Testing plan
- Unit tests for backend logic
- Integration tests for match & session flows
- Load test WebSocket signaling (k6 or Locust) — simulate match queue
- Security tests: pen test on auth & admin endpoints
- Beta test with 200–500 students, collect UX & abuse metrics

---

## 11. Roadmap — Gantt-style timeline (Weeks 1–20)

| Week | Focus / Deliverables |
|------|---------------------|
| 1 | Vision & PRD finalization, design system, repo + CI setup |
| 2 | Backend skeleton (auth, DB models), frontend skeleton (landing, auth UI) |
| 3 | Match queue & WebSocket signaling prototype; Redis setup |
| 4 | Text chat UI + Next/End/Report flows; basic moderation integration |
| 5 | WebRTC signaling integration (offer/answer flow), simple peer connect |
| 6 | Full video chat features (camera/mic toggle, blur preconnect) |
| 7 | Fuse Moments flow & minimal profile screens |
| 8 | Admin dashboard MVP (flags, report queue) |
| 9 | QA pass 1 — functional & integration tests |
| 10 | Closed beta (universities) setup + invite flows |
| 11 | Collect feedback, fix critical issues, localization (Kinyarwanda) |
| 12 
| Performance tuning & load testing |
| 13 | Prepare production infra & hardening (TLS, backups) |
| 14 | Public launch prep (marketing assets, press kit) |
| 15 | Production deploy — soft public launch |
| 16 | Monitor KPIs, triage, quick patching |
| 17 | Weekend Vibes & event system (admin controls) |
| 18 | Analytics dashboard & improvement backlog |
| 19 | Mobile app planning & API hardening |
| 20 | Start mobile dev (React Native) & continue iteration |

---

## 12. Team roles & responsibilities
- **Product Lead (you)**: product decisions, partnerships, roadmap
- **Backend Engineer**: Django/FastAPI, WebSockets, DB design
- **Frontend Engineer**: React, WebRTC integration, Tailwind
- **Mobile Engineer**: React Native / Flutter (post MVP)
- **UI/UX Designer**: design system, assets, microcopy
- **QA**: test plans & automation
- **Community Manager**: beta outreach, creator partnerships

---

## 13. Handover & agent integration notes
- Provide environment variables (`.env`) sample and deployment scripts
- Include `openapi.json` for API contract (or a routes README)
- Provide a `data-dictionary.md` mapping database tables and intended use
- Ensure moderation rules & admin access instructions exist in `README`

---

## 14. Appendix

### .env.example (sensitive values omitted)
```
SECRET_KEY=...
DATABASE_URL=postgres://user:pass@postgres:5432/fusetalk
REDIS_URL=redis://redis:6379/0
PERSPECTIVE_API_KEY=...
FIREBASE_API_KEY=...
SENTRY_DSN=...
```

### Suggested folder structure
```
/fusetalk
  /backend
    /app
      /api
      /auth
      /chat
      /moderation
  /frontend
    /src
      /components
      /pages
      /hooks
  /mobile
  /infra
    docker-compose.yml
    k8s/  (optional)
```

### Example basic DB schema (Postgres)
- users(id PK, nickname, email, phone, verified, avatar_url, languages, created_at)
- sessions(id PK, type, topic, language, user_a_id FK, user_b_id FK, started_at, ended_at, status)
- fuse_moments(id PK, user_a_id FK, user_b_id FK, summary, created_at)
- reports(id PK, reporter_id FK, session_id FK, category, evidence, created_at, action)

---

## 15. Next steps (immediate)
1. Review this doc and mark must-have vs nice-to-have features for the MVP.
2. Create GitHub repo & invite initial team.
3. Start Week 1 tasks: finalize PRD & design system tokens.

---

*Document prepared for Fuse (FuseGroove) — use this as the master product reference to feed into your development agent, pitch deck, and investor conversations.*

