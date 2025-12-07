import csv
import re
import os
from datetime import datetime, timedelta
from database import get_db_connection, init_db

INPUT_FILE = '/Users/pratyushtiwari/Desktop/mesa-assign/Data Ops_assignment.xlsx - Raw dump.csv'

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
    if not time_obj:
        return None
    
    t_mins = time_obj.hour * 60 + time_obj.minute
    
    for cls_name, times in CLASSES.items():
        start_dt = datetime.strptime(times['start'], '%H:%M')
        start_mins = start_dt.hour * 60 + start_dt.minute
        
        if start_mins - 45 <= t_mins <= start_mins + 60:
            return cls_name
            
    return None

def ingest_data():
    # Initialize DB first
    init_db()
    
    conn = get_db_connection()
    cursor = conn.cursor()
    
    # Clear existing data to avoid duplicates on re-run
    cursor.execute('DELETE FROM attendance_logs')
    
    raw_data = []
    current_date = None
    
    print("Reading CSV...")
    with open(INPUT_FILE, 'r', encoding='utf-8') as f:
        reader = csv.reader(f)
        for row in reader:
            if not row:
                continue
                
            # Check for Date line
            # The file seems to have "Attendance Date" in the first column
            if len(row) > 0 and "Attendance Date" in row[0]:
                found_date = False
                for cell in row:
                    match = re.search(r'\d{2}-[A-Za-z]{3}-\d{4}', cell)
                    if match:
                        current_date = match.group(0)
                        print(f"Found Date: {current_date}")
                        found_date = True
                        break
                if found_date:
                    continue
            
            if "SNo" in row[1]:
                continue
                
            if len(row) > 10 and row[2].startswith("MS"):
                if not current_date:
                    print(f"Skipping row due to missing date: {row[:5]}")
                    continue
                    
                student_id = row[2].strip()
                in_time_str = row[3].strip()
                out_time_str = row[4].strip()
                status = row[9].strip()
                
                in_time_obj = parse_time(in_time_str)
                class_id = get_class_from_time(in_time_obj)
                
                cursor.execute('''
                    INSERT INTO attendance_logs (student_id, date, in_time, out_time, status, class_id)
                    VALUES (?, ?, ?, ?, ?, ?)
                ''', (student_id, current_date, in_time_str, out_time_str, status, class_id))

    conn.commit()
    conn.close()
    print("Data ingestion complete.")

if __name__ == "__main__":
    ingest_data()
