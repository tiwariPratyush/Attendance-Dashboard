import csv
import json
import re
from datetime import datetime, timedelta
from collections import defaultdict

INPUT_FILE = '/Users/pratyushtiwari/Desktop/mesa-assign/Data Ops_assignment.xlsx - Raw dump.csv'
OUTPUT_FILE = '/Users/pratyushtiwari/Desktop/mesa-assign/attendance-dashboard/src/data.json'

# Class Schedules (Start Time, End Time)
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

def get_class_from_time(time_obj):
    """
    Map an entry time to a class.
    Logic: If entry is within [Start - 45min, Start + 45min], assign to that class.
    """
    if not time_obj:
        return None
    
    # Convert time_obj to minutes for easier comparison
    t_mins = time_obj.hour * 60 + time_obj.minute
    
    for cls_name, times in CLASSES.items():
        start_dt = datetime.strptime(times['start'], '%H:%M')
        start_mins = start_dt.hour * 60 + start_dt.minute
        
        # Window: 45 mins before to 60 mins after start (generous window)
        if start_mins - 45 <= t_mins <= start_mins + 60:
            return cls_name
            
    return None

def is_late(time_obj, cls_name):
    """
    Check if student is late (> 5 mins after start).
    """
    if not time_obj or not cls_name:
        return False
        
    start_str = CLASSES[cls_name]['start']
    start_dt = datetime.strptime(start_str, '%H:%M')
    
    # Create a dummy date for comparison
    entry_dt = start_dt.replace(hour=time_obj.hour, minute=time_obj.minute, second=time_obj.second)
    
    # Threshold: 5 minutes
    threshold = start_dt + timedelta(minutes=5)
    
    return entry_dt > threshold

def process_data():
    raw_data = []
    current_date = None
    
    print("Reading CSV...")
    with open(INPUT_FILE, 'r', encoding='utf-8') as f:
        reader = csv.reader(f)
        for row in reader:
            if not row:
                continue
                
            # Check for Date line
            # Format: "Attendance Date", "", "01-Oct-2025", ...
            if len(row) > 2 and "Attendance Date" in row[0]:
                # Try to find the date string in the row
                for cell in row:
                    if re.match(r'\d{2}-[A-Za-z]{3}-\d{4}', cell.strip()):
                        current_date = cell.strip()
                        break
                continue
            
            # Skip header lines
            if "SNo" in row[1]:
                continue
                
            # Parse Data Line
            # Index 2: E. Code (Student ID)
            # Index 3: InTime
            # Index 9: Status
            if len(row) > 10 and row[2].startswith("MS"):
                student_id = row[2].strip()
                in_time_str = row[3].strip()
                status = row[9].strip()
                
                entry = {
                    'date': current_date,
                    'student_id': student_id,
                    'in_time': in_time_str,
                    'status': status
                }
                raw_data.append(entry)

    print(f"Processed {len(raw_data)} raw entries.")
    
    # --- Calculate Metrics ---
    
    # 1. Average attendance of each student per week
    # We need to group dates into weeks.
    # Simple approach: ISO Week number.
    student_weekly_stats = defaultdict(lambda: defaultdict(lambda: {'present': 0, 'total': 0}))
    
    # 2. Average attendance per class overall
    class_stats = defaultdict(lambda: {'present': 0, 'total_days': 0}) # Total days will be counted per unique date
    unique_dates = set()
    
    # 3. Student IDs with < 30% attendance every week
    # Derived from (1)
    
    # 4. Percentage of latecomers to each class every day
    # Structure: { Date: { Class1: {late: 0, present: 0}, ... } }
    daily_class_stats = defaultdict(lambda: defaultdict(lambda: {'late': 0, 'present': 0}))

    # Helper to track total students for "Average attendance per class overall"
    # We assume the total number of students is the set of all unique IDs found.
    all_students = set(d['student_id'] for d in raw_data)
    total_student_count = len(all_students)
    
    for entry in raw_data:
        if not entry['date']:
            continue
            
        unique_dates.add(entry['date'])
        dt = datetime.strptime(entry['date'], '%d-%b-%Y')
        week_num = dt.isocalendar()[1]
        
        sid = entry['student_id']
        status = entry['status']
        in_time = parse_time(entry['in_time'])
        
        # --- Metric 1: Student Weekly Attendance ---
        # Weight: Present=1, ½Present=0.5, Absent=0
        # Only count working days (exclude WeeklyOff if indicated, though CSV shows 'WeeklyOff' status)
        if "WeeklyOff" in status:
            continue
            
        weight = 0
        if "Present" in status:
            if "½Present" in status:
                weight = 0.5
            else:
                weight = 1
        
        student_weekly_stats[sid][week_num]['present'] += weight
        student_weekly_stats[sid][week_num]['total'] += 1
        
        # --- Metric 2 & 4: Class Stats & Latecomers ---
        # We only care if they punched in for a class
        if in_time:
            cls = get_class_from_time(in_time)
            if cls:
                # Metric 4: Daily Late Stats
                daily_class_stats[entry['date']][cls]['present'] += 1
                if is_late(in_time, cls):
                    daily_class_stats[entry['date']][cls]['late'] += 1
                
                # Metric 2: Overall Class Stats (Accumulate raw counts here)
                class_stats[cls]['present'] += 1

    # --- Final Aggregations ---
    
    # 1. Student Weekly Average
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
            else:
                # If no working days, ignore for low attendance check? 
                # Or assume 0? Let's assume ignore.
                pass
        
        avg_att = sum(w['pct'] for w in weekly_percentages) / len(weekly_percentages) if weekly_percentages else 0
        student_weekly_output.append({
            'student_id': sid,
            'average_weekly': round(avg_att, 1),
            'weekly_breakdown': weekly_percentages
        })
        
        if is_consistently_low and weekly_percentages:
            students_low_attendance.append(sid)

    # 2. Average attendance per class overall
    # Formula: (Total Present in Class X) / (Total Days * Total Students) * 100 ??
    # Or just average count? "Average attendance" usually means % or count.
    # Given "Average attendance of each student" is likely %, let's do % of total capacity.
    # Capacity per class = Total Students.
    total_days = len(unique_dates)
    class_output = []
    for cls, data in class_stats.items():
        # Average students present per day
        avg_count = data['present'] / total_days if total_days > 0 else 0
        # Percentage capacity
        pct = (data['present'] / (total_days * total_student_count)) * 100 if total_days > 0 else 0
        class_output.append({
            'class_name': cls,
            'average_count': round(avg_count, 1),
            'percentage': round(pct, 1)
        })

    # 4. Percentage of latecomers
    latecomer_output = {}
    for date, classes in daily_class_stats.items():
        latecomer_output[date] = {}
        for cls, data in classes.items():
            pct_late = (data['late'] / data['present']) * 100 if data['present'] > 0 else 0
            latecomer_output[date][cls] = round(pct_late, 1)

    # Construct Final JSON
    final_data = {
        'student_weekly_attendance': student_weekly_output,
        'class_overall_attendance': class_output,
        'low_attendance_students': students_low_attendance,
        'latecomer_stats': latecomer_output,
        'metadata': {
            'total_students': total_student_count,
            'total_days': total_days,
            'date_range': sorted(list(unique_dates))
        }
    }
    
    # Ensure directory exists
    import os
    os.makedirs(os.path.dirname(OUTPUT_FILE), exist_ok=True)
    
    with open(OUTPUT_FILE, 'w') as f:
        json.dump(final_data, f, indent=2)
    
    print(f"Successfully wrote data to {OUTPUT_FILE}")

if __name__ == "__main__":
    process_data()
