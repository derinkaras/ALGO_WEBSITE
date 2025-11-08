# 🧠 AlgoWebsite — Sports Prediction Dashboard  

🚀 **Live Demo:** [https://algowebsite-5c39.onrender.com](https://algowebsite-5c39.onrender.com)

---

## 🏀 Overview  

**AlgoWebsite** is a modern web dashboard that interfaces with my **Python-based Data Pipeline & Prediction Engine**.  
It provides authenticated users with real-time access to **NBA and MLB prediction results**, detailed analytics, and bankroll simulations — all visualized through a clean, responsive React frontend.  

The site acts as the **visual layer** for my sports analytics ecosystem, connecting directly to my backend algorithm runner (`NBA_ALGO` and `MLB_ALGO`), which handles game data ingestion, model predictions, and statistical reporting.

---

## ⚙️ Features  

### 🎯 Core Functionality  
- **Live Predictions:** Displays ongoing and upcoming game predictions in real time.  
- **Historical Databases:** Toggle between past seasons (e.g., 2023, 2024) and live datasets.  
- **Bankroll Simulation:** Run algorithmic simulations that mirror the Python backend’s betting model logic.  
- **Results Dashboard:** Shows bankroll growth, ROI%, win rate, and total bet stats.  

### 🔒 Authentication  
- **Access Control:** Only verified and authorized users can view predictions or access simulation data.  
- **Private Dashboard:** Secure authentication layer protects all analytics endpoints.  

### 💻 Tech Highlights  
- **Frontend:** React + TypeScript + TailwindCSS  
- **Backend Integration:** FastAPI endpoints connected to Python algorithm core  
- **Caching & Optimization:** LocalStorage archiving and efficient API call handling  
- **Deployment:** Hosted on [Render](https://render.com) with both frontend and backend live services  

---

## 🧩 Architecture  

```
Frontend (React + TS)
│
├── /components          → Reusable UI blocks (tables, cards, filters)
├── /services            → API handlers (ExecuteSimulation, FetchData, etc.)
├── /pages               → Dataset views (Live, 2024, 2023)
│
Backend (Python / FastAPI)
│
├── app/index.py         → CLI + API runner
├── app/ExecutionHandler.py
├── app/NBAGameService.py
├── app/NBAPredictionService.py
│
Data Layer
│
├── SQLite databases     → `2024DataBase.db`, `DayOf.db`, etc.
└── PDF + JSON exports   → Rendered reports & downloadable outputs
```

---

## 🧠 How It Works  

1. **Data Collection:** The backend fetches and stores NBA/MLB game data daily.  
2. **Prediction Generation:** Algorithms compute win probabilities and optimal picks.  
3. **API Sync:** FastAPI exposes endpoints for frontend consumption.  
4. **Visualization:** React interface displays predictions, bankrolls, and metrics interactively.  
5. **Authentication:** Access restricted to allowed users via secure auth layer.  

---

## 🧰 Tech Stack  

| Layer | Technologies |
|-------|---------------|
| **Frontend** | React, TypeScript, TailwindCSS |
| **Backend** | Python, FastAPI |
| **Database** | SQLite |
| **Hosting** | Render |
| **Version Control** | Git + GitHub |
| **Auth / Security** | JWT / Protected routes |

---

## 🌐 Deployment  

Deployed using **Render** with:
- React app (static site) on frontend service  
- Python FastAPI app (backend service) connected to SQLite DB  

🔗 **Live App:** [https://algowebsite-5c39.onrender.com](https://algowebsite-5c39.onrender.com)

---

## 🧾 Roadmap  

- [ ] Add user registration dashboard (admin-approved invites)  
- [ ] Include live odds comparison widget  
- [ ] Add graph visualization for bankroll progression  
- [ ] Integrate email or Telegram alerts for prediction updates  

---

## 👨‍💻 Author  

**Derin Karas**  
Full-stack developer & sports data analyst  
🔗 [GitHub Profile](https://github.com/derinkaras)

---

## 🏁 License  

This project is proprietary and for **authorized use only**.  
All algorithms, data, and code are © 2025 Derin Karas.  
