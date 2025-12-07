from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .database import get_db_connection
from datetime import datetime, timedelta
from collections import defaultdict

app = FastAPI()

# Enable CORS for frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

CLASSES = {
    'Class 1': {'start': '09:00', 'end': '11:00'},
    'Class 2': {'start': '11:30', 'end': '13:30'},
    'Class 3': {'start': '14:30', 'end': '16:30'},
    'Class 4': {'start': '17:00', 'end': '19:00'}
}

def parse_time(time_str):
    if not time_str or time_str.strip() == '':
        return None
    try:
        return datetime.strptime(time_str.strip(), '%H:%M:%S').time()
    except ValueError:
        return None

def is_late(time_str, cls_name):
    if not time_str or not cls_name:
        return False
    
    time_obj = parse_time(time_str)
    if not time_obj:
        return False
        
    start_str = CLASSES[cls_name]['start']
    start_dt = datetime.strptime(start_str, '%H:%M')
    entry_dt = start_dt.replace(hour=time_obj.hour, minute=time_obj.minute, second=time_obj.second)
    threshold = start_dt + timedelta(minutes=5)
    
    return entry_dt > threshold

@app.get("/api/dashboard-data")
def get_dashboard_data():
    conn = get_db_connection()
    logs = conn.execute('SELECT * FROM attendance_logs').fetchall()
    conn.close()
    
    # --- Logic copied and adapted from process_data.py ---
    
    student_weekly_stats = defaultdict(lambda: defaultdict(lambda: {'present': 0, 'total': 0}))
    class_stats = defaultdict(lambda: {'present': 0})
    daily_class_stats = defaultdict(lambda: defaultdict(lambda: {'late': 0, 'present': 0}))
    unique_dates = set()
    all_students = set()
    
    for log in logs:
        date = log['date']
        if not date: continue
        
        unique_dates.add(date)
        sid = log['student_id']
        all_students.add(sid)
        status = log['status']
        in_time = log['in_time']
        cls = log['class_id']
        
        dt = datetime.strptime(date, '%d-%b-%Y')
        week_num = dt.isocalendar()[1]
        
        # Metric 1: Weekly
        if "WeeklyOff" not in status:
            weight = 0
            if "Present" in status:
                if "½Present" in status:
                    weight = 0.5
                else:
                    weight = 1
            
            student_weekly_stats[sid][week_num]['present'] += weight
            student_weekly_stats[sid][week_num]['total'] += 1
            
        # Metric 2 & 4
        if cls:
            daily_class_stats[date][cls]['present'] += 1
            if is_late(in_time, cls):
                daily_class_stats[date][cls]['late'] += 1
            
            class_stats[cls]['present'] += 1

    # Aggregations
    student_weekly_output = []
    students_low_attendance = []
    
    for sid, weeks in student_weekly_stats.items():
        weekly_percentages = []
        is_consistently_low = True
        
        for week, data in weeks.items():
            if data['total'] > 0:
                pct = (data['present'] / data['total']) * 100
                weekly_percentages.append({'week': week, 'pct': pct})
                if pct >= 30:
                    is_consistently_low = False
        
        avg_att = sum(w['pct'] for w in weekly_percentages) / len(weekly_percentages) if weekly_percentages else 0
        student_weekly_output.append({
            'student_id': sid,
            'average_weekly': round(avg_att, 1),
            'weekly_breakdown': weekly_percentages
        })
        
        if avg_att < 30:
            students_low_attendance.append(sid)
            
    total_days = len(unique_dates)
    total_students = len(all_students)
    
    class_output = []
    for cls, data in class_stats.items():
        avg_count = data['present'] / total_days if total_days > 0 else 0
        pct = (data['present'] / (total_days * total_students)) * 100 if total_days > 0 else 0
        class_output.append({
            'class_name': cls,
            'average_count': round(avg_count, 1),
            'percentage': round(pct, 1)
        })
        
    latecomer_output = {}
    for date, classes in daily_class_stats.items():
        latecomer_output[date] = {}
        for cls, data in classes.items():
            pct_late = (data['late'] / data['present']) * 100 if data['present'] > 0 else 0
            latecomer_output[date][cls] = round(pct_late, 1)

    return {
        'student_weekly_attendance': student_weekly_output,
        'class_overall_attendance': class_output,
        'low_attendance_students': students_low_attendance,
        'latecomer_stats': latecomer_output,
        'metadata': {
            'total_students': total_students,
            'total_days': total_days,
            'date_range': sorted(list(unique_dates))
        }
    }

@app.get("/api/student/{student_id}")
def get_student_details(student_id: str):
    conn = get_db_connection()
    logs = conn.execute('SELECT * FROM attendance_logs WHERE student_id = ? ORDER BY date DESC', (student_id,)).fetchall()
    conn.close()
    
    if not logs:
        return {"error": "Student not found"}
        
    history = []
    for log in logs:
        history.append({
            'date': log['date'],
            'in_time': log['in_time'],
            'out_time': log['out_time'],
            'status': log['status'],
            'class_id': log['class_id']
        })
        
    return {
        'student_id': student_id,
        'history': history
    }
