# RealBuy Deployment Guide: Vercel (Frontend) & Render (Backend)

This guide provides instructions for deploying the **RealBuy** platform with:
- **Backend (FastAPI Engine)** deployed on **Render**
- **Frontend (Next.js Application)** deployed on **Vercel**

---

## 1. Architecture & How They Connect

```
                        ┌──────────────────────────────────────────────┐
                        │              Client Browser                  │
                        └──────────────────────┬───────────────────────┘
                                               │
                                      https://your-app.vercel.app
                                               │
                                               ▼
                        ┌──────────────────────────────────────────────┐
                        │             Vercel (Next.js)                 │
                        │  - Pages, React UI, Tailwind, Lucide Icons   │
                        │  - Proxies /api/* & /uploads/* to Render     │
                        └──────────────────────┬───────────────────────┘
                                               │ (Rewrites Proxy)
                                      https://realbuy-api.onrender.com
                                               │
                                               ▼
                        ┌──────────────────────────────────────────────┐
                        │             Render (FastAPI)                 │
                        │  - Python 3.12 + FastAPI + SQLite            │
                        │  - Dynamic CORS (supports *.vercel.app)      │
                        │  - AI Pros & Cons Engine                     │
                        │  - Static media serving (/uploads/*)         │
                        └──────────────────────────────────────────────┘
```

> **Why this configuration is optimal**:
> By configuring Next.js rewrites in `next.config.js`, all browser traffic hits your Vercel domain (`/api/...`). Vercel proxies requests directly to your Render backend URL. This eliminates browser cross-origin cookie restrictions, third-party cookie blocking in Safari/iOS, and complex CORS headaches.

---

## 2. Step 1: Deploy Backend on Render

### A. Push Code to GitHub
Ensure your repository is pushed to GitHub. The included `.gitignore` keeps out `node_modules` and Python `venv`, while keeping the SQLite database template `data/realbuy.db`.

### B. Create Web Service on Render
1. Log into your [Render Dashboard](https://dashboard.render.com).
2. Click **New +** -> **Web Service**.
3. Connect your GitHub repository containing RealBuy.
4. Fill in the following deployment settings:

| Setting | Value |
| :--- | :--- |
| **Name** | `realbuy-backend` (or your choice) |
| **Region** | Oregon (US West) or closest to you |
| **Language / Environment** | `Python 3` |
| **Branch** | `main` |
| **Root Directory** | *(leave blank / repository root)* |
| **Build Command** | `pip install -r requirements.txt` |
| **Start Command** | `uvicorn backend.main:app --host 0.0.0.0 --port $PORT` |
| **Instance Type** | Free |

### C. Environment Variables on Render
Under **Environment Variables**, add:

| Key | Recommended Value | Notes |
| :--- | :--- | :--- |
| `PYTHON_VERSION` | `3.12.0` | Ensures modern Python 3 runtime |
| `JWT_SECRET` | *(Click "Generate" or any 32+ char string)* | Secure token signing key |
| `ENVIRONMENT` | `production` | Enables production security flags |
| `ALLOWED_ORIGINS` | `https://*.vercel.app` | Comma-separated allowed frontend URLs |

5. Click **Create Web Service**.
6. Wait for the build to finish. Once live, Render will give you your backend URL:
   `https://realbuy-backend-xxxx.onrender.com`

> **Note on Render Free Tier**:
> Render's free tier spins down after 15 minutes of inactivity. When a request arrives, it may take 20-40 seconds to wake up. This is normal on the free tier.

---

## 3. Step 2: Deploy Frontend on Vercel

### A. Import Project in Vercel
1. Log into your [Vercel Dashboard](https://vercel.com).
2. Click **Add New...** -> **Project**.
3. Import the same GitHub repository.

### B. Project Configuration
Vercel automatically detects Next.js:
- **Framework Preset**: `Next.js`
- **Root Directory**: `./` (default)
- **Build Command**: `next build` (default)
- **Output Directory**: `.next` (default)

### C. Environment Variables on Vercel
In the **Environment Variables** section before deploying, add:

| Key | Value | Purpose |
| :--- | :--- | :--- |
| `BACKEND_URL` | `https://realbuy-backend-xxxx.onrender.com` | Points Next.js proxy to your live Render backend (no trailing slash) |
| `NEXT_PUBLIC_BACKEND_URL` | `https://realbuy-backend-xxxx.onrender.com` | Fallback backend destination |

4. Click **Deploy**.
5. Vercel will build the frontend in ~45 seconds and provide your live URL:
   `https://realbuy-platform-xxxx.vercel.app`

---

## 4. Key Deployment Features Included in the Codebase

1. **`next.config.js` Rewrites**:
   - Proxies `/api/:path*` -> `${BACKEND_URL}/api/:path*`
   - Proxies `/uploads/:path*` -> `${BACKEND_URL}/uploads/:path*`
   - Defaults to `http://127.0.0.1:8000` locally, so `npm run dev` works out of the box with zero configuration.

2. **Automated Database Initialization (`backend/init_db.py`)**:
   - On backend startup (`@app.on_event("startup")`), FastAPI checks SQLite tables.
   - If starting fresh on a new Render disk, it automatically creates all 14 tables and seeds baseline demo personas (`@alex_chen`, `@sarah_m`, etc.) and products.

3. **Dynamic CORS & Static Uploads (`backend/main.py`)**:
   - `allow_origin_regex=r"https://.*\.vercel\.app"` allows any preview or production Vercel branch deployment.
   - Mounts `/uploads` via `StaticFiles` so images and avatars uploaded on Render are immediately accessible.

4. **Dual Authentication Support (`backend/routers/auth.py` & `lib/context.tsx`)**:
   - Supports HTTP-only Cookies AND `Authorization: Bearer <token>` saved in `localStorage`.
   - Adapts `Secure` and `SameSite` flags based on environment.

5. **`render.yaml` Blueprint**:
   - Included in repository root for one-click blueprint deployments on Render.
