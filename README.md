# RealBuy 🛍️⚡

> **AI-Powered Product Intelligence, Community Review & Rating Platform**

RealBuy is a dedicated product intelligence and rating platform engineered to cut through marketing noise and fake online reviews. Users upload authentic product hardware details with multiple e-commerce store links, and real buyers submit in-depth ratings across durability, build quality, and value-for-money. An automated AI analytics engine synthesizes all community feedback into actionable pros & cons, sentiment scoring, and durability insights.

---

## 🌐 Live Production Links

- **Frontend (Web App)**: [https://real-buy-eight.vercel.app](https://real-buy-eight.vercel.app) (Hosted on Vercel)
- **Backend (API Service)**: [https://realbuy-zzcu.onrender.com](https://realbuy-zzcu.onrender.com) (Hosted on Render)
- **Interactive API Documentation**: [https://realbuy-zzcu.onrender.com/docs](https://realbuy-zzcu.onrender.com/docs)
- **API Health Check**: [https://realbuy-zzcu.onrender.com/api/health](https://realbuy-zzcu.onrender.com/api/health)

---

## 🚀 Key Features

- **🤖 AI-Generated Pros & Cons Analysis**: Automatically parses and synthesizes community ratings and comments into structured bullet points covering build quality, durability, and value.
- **⭐ Multi-Dimensional Parameter Ratings**: Rates products across 4 core axes: Overall Rating, Durability, Build Quality, and Value for Money.
- **📸 Multi-Image Gallery**: Upload between 1 and 5 product photos with custom cover selection and full preview gallery.
- **🛒 Multi-Store E-Commerce Integration**: Supports adding multiple store links (Amazon, Best Buy, Apple Store, Walmart, Target, Official Brand stores) with automatic domain name detection.
- **🧾 Verified Purchase Invoices**: Buyers can submit purchase receipts or order details for verified review badges.
- **⚖️ Side-by-Side Product Comparison**: Compare up to 4 products simultaneously with automated AI verdict on overall winner vs. best value.
- **⚡ Cyber-Retro Modern UI**: Dark-mode-first aesthetic with responsive design built on Next.js 14 and Tailwind CSS.

---

## 🛠️ Tech Stack

- **Frontend**: Next.js 14 (App Router), TypeScript, Tailwind CSS, Lucide React
- **Backend**: Python 3.12, FastAPI, Uvicorn, Pydantic, PyJWT, Bcrypt
- **Database**: SQLite with PRAGMA foreign keys and automated startup seeding
- **AI Engine**: Algorithmic sentiment analysis, feedback extraction, and pros/cons summarizer
- **Deployment**: Vercel (Frontend) & Render (Backend)

---

## 📦 Local Development

### 1. Clone the repository
```bash
git clone https://github.com/Divyanshuddev/RealBuy.git
cd RealBuy
```

### 2. Install dependencies
```bash
# Install frontend dependencies
npm install

# Setup backend environment
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
cd ..
```

### 3. Run development servers
```bash
./start.sh
```
- Frontend: `http://localhost:3000`
- Backend API Docs: `http://localhost:8000/docs`

---

## 📄 License
MIT License. Free to use and customize.
