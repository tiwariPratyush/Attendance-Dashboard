# 📊 Student Attendance Dashboard

A premium, data-driven dashboard for monitoring student attendance, analyzing trends, and identifying at-risk students. Built with a modern React frontend and a robust Python FastAPI backend.

# Dashboard Preview
<img width="1436" height="811" alt="Screenshot 2025-12-07 at 8 59 39 PM" src="https://github.com/user-attachments/assets/9a230433-5313-49c1-8e97-d73c32ace147" />


## 🚀 Features

-   **Premium UI**: Glassmorphism design with dark mode, smooth gradients, and interactive elements.
-   **Real-time Insights**: Automatically identifies the lowest-performing class and latecomer trends.
-   **Interactive Charts**:
    -   **Latecomer Trend**: Line chart showing daily lateness percentages.
    -   **Attendance Distribution**: Pie chart breaking down Good, Average, and Poor attendance.
-   **At-Risk Monitoring**: Instantly lists all students with <30% attendance for immediate intervention.
-   **Smart Search**: "HD Glass" search box to filter students by ID.
-   **Student Details**: Click on any student to view their full daily attendance history.

## 🛠️ Tech Stack

### Frontend
-   **React** (Vite)
-   **TailwindCSS** (Styling)
-   **Recharts** (Data Visualization)
-   **Lucide React** (Icons)

### Backend
-   **Python** (FastAPI)
-   **SQLite** (Database)
-   **Pandas** (Data Processing)

## 🏃‍♂️ Local Setup

### Prerequisites
-   Node.js & npm
-   Python 3.8+

### 1. Backend Setup
Navigate to the backend folder and install dependencies:
```bash
cd backend
pip install -r requirements.txt
```

Start the API server:
```bash
uvicorn main:app --reload --port 8000
```
The API will be running at `http://localhost:8000`.

### 2. Frontend Setup
Open a new terminal, navigate to the dashboard folder, and install dependencies:
```bash
cd attendance-dashboard
npm install
```

## 📂 Project Structure

```
├── attendance-dashboard/   # React Frontend
│   ├── src/
│   │   ├── components/     # Dashboard, StudentModal, etc.
│   │   └── index.css       # Global styles & Tailwind directives
│   └── package.json
│
├── backend/                # FastAPI Backend
│   ├── main.py             # API Endpoints & Logic
│   ├── database.py         # Database connection
│   ├── ingest.py           # Data ingestion script
│   └── requirements.txt    # Python dependencies
│
└── README.md               # Project Documentation
```

## 📝 License

This project is open source and available under the [MIT License](LICENSE).
