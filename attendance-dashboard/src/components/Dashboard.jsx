import React, { useMemo, useState, useEffect } from 'react';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, Legend } from 'recharts';
import { Users, Clock, AlertTriangle, Calendar, Loader2, Search, Download, ChevronUp, ChevronDown, X as XIcon, TrendingUp, PieChart as PieIcon, Lightbulb, CheckCircle2, ArrowRight } from 'lucide-react';
import StudentModal from './StudentModal';

const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
        return (
            <div className="bg-[#171717] border border-white/10 p-4 rounded-xl shadow-2xl">
                <p className="text-gray-400 text-sm mb-1">{label}</p>
                <p className="text-xl font-bold text-white flex items-center gap-2">
                    {payload[0].value}%
                    {payload[0].name === 'latePercentage' && (
                        <span className="text-xs font-normal text-yellow-500 bg-yellow-500/10 px-2 py-0.5 rounded">Late</span>
                    )}
                </p>
            </div>
        );
    }
    return null;
};

const Dashboard = () => {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedStudent, setSelectedStudent] = useState(null);
    const [sortConfig, setSortConfig] = useState({ key: 'average_weekly', direction: 'desc' });

    useEffect(() => {
        const fetchData = async () => {
            try {
                const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/api/dashboard-data`);
                if (!response.ok) throw new Error('Failed to fetch data');
                const jsonData = await response.json();
                setData(jsonData);
            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    const latecomerTrendData = useMemo(() => {
        if (!data) return [];
        const { latecomer_stats } = data;
        return Object.entries(latecomer_stats).map(([date, classes]) => {
            const totalLate = Object.values(classes).reduce((a, b) => a + b, 0);
            const avgLate = totalLate / 4;
            return { date, latePercentage: parseFloat(avgLate.toFixed(1)) };
        });
    }, [data]);

    const statusDistribution = useMemo(() => {
        if (!data) return [];
        let good = 0, average = 0, poor = 0;
        data.student_weekly_attendance.forEach(s => {
            if (s.average_weekly >= 75) good++;
            else if (s.average_weekly >= 30) average++;
            else poor++;
        });
        return [
            { name: 'Good (>75%)', value: good, color: '#22c55e' },
            { name: 'Average (30-75%)', value: average, color: '#eab308' },
            { name: 'Poor (<30%)', value: poor, color: '#ef4444' }
        ];
    }, [data]);

    // Insights Logic
    const insights = useMemo(() => {
        if (!data || !latecomerTrendData.length) return null;

        const { class_overall_attendance, low_attendance_students } = data;

        // 1. Lowest Performing Class
        const lowestClass = [...class_overall_attendance].sort((a, b) => a.percentage - b.percentage)[0];

        // 2. Latecomer Trend
        const firstDay = latecomerTrendData[0].latePercentage;
        const lastDay = latecomerTrendData[latecomerTrendData.length - 1].latePercentage;
        const lateTrend = lastDay > firstDay ? 'increasing' : 'decreasing';
        const lateDiff = Math.abs(lastDay - firstDay).toFixed(1);

        // 3. Critical Students Count
        const criticalCount = low_attendance_students.length;

        return {
            lowestClass,
            lateTrend,
            lateDiff,
            criticalCount
        };
    }, [data, latecomerTrendData]);

    const handleSort = (key) => {
        setSortConfig(current => ({
            key,
            direction: current.key === key && current.direction === 'asc' ? 'desc' : 'asc'
        }));
    };

    const sortedStudents = useMemo(() => {
        if (!data) return [];
        let students = [...data.student_weekly_attendance];

        if (searchTerm) {
            students = students.filter(s =>
                s.student_id.toLowerCase().includes(searchTerm.toLowerCase())
            );
        }

        return students.sort((a, b) => {
            if (a[sortConfig.key] < b[sortConfig.key]) return sortConfig.direction === 'asc' ? -1 : 1;
            if (a[sortConfig.key] > b[sortConfig.key]) return sortConfig.direction === 'asc' ? 1 : -1;
            return 0;
        });
    }, [data, searchTerm, sortConfig]);

    if (loading) {
        return (
            <div className="h-screen flex flex-col items-center justify-center text-white gap-4">
                <Loader2 className="animate-spin text-blue-500" size={48} />
                <p className="text-gray-400 animate-pulse">Loading dashboard data...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="h-screen flex items-center justify-center text-red-500 bg-red-500/10">
                <AlertTriangle className="mr-2" /> Error: {error}
            </div>
        );
    }

    const { class_overall_attendance, low_attendance_students, metadata } = data;

    return (
        <div className="container animate-fade-in pb-20">
            <header className="mb-12">
                <h1 className="mb-8 text-gradient text-4xl font-bold">Attendance Dashboard</h1>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Duration Card */}
                    <div className="glass-panel p-6 flex items-center gap-6">
                        <div className="p-4 bg-blue-500/10 rounded-2xl">
                            <Calendar size={32} className="text-blue-400" />
                        </div>
                        <div>
                            <p className="text-gray-400 text-sm font-medium uppercase tracking-wider mb-1">Duration</p>
                            <p className="text-2xl font-bold text-white">
                                {metadata.date_range[0]} <span className="text-gray-500 mx-2">to</span> {metadata.date_range[metadata.date_range.length - 1]}
                            </p>
                        </div>
                    </div>

                    {/* Total Students Card */}
                    <div className="glass-panel p-6 flex items-center gap-6">
                        <div className="p-4 bg-purple-500/10 rounded-2xl">
                            <Users size={32} className="text-purple-400" />
                        </div>
                        <div>
                            <p className="text-gray-400 text-sm font-medium uppercase tracking-wider mb-1">Total Students</p>
                            <p className="text-2xl font-bold text-white">{metadata.total_students}</p>
                        </div>
                    </div>
                </div>
            </header>

            {/* Row 1: Class Averages */}
            <section className="mb-8">
                <h2 className="text-white/90 mb-6 flex items-center gap-2">
                    <Users className="text-blue-500" /> Class Performance
                </h2>
                <div className="grid grid-cols-4 gap-6">
                    {class_overall_attendance.map((cls, idx) => (
                        <div key={cls.class_name} className="glass-panel relative overflow-hidden group bg-gradient-card" style={{ animationDelay: (idx * 100) + 'ms' }}>
                            <div className="absolute -right-6 -top-6 p-8 bg-blue-500/10 rounded-full blur-2xl group-hover:bg-blue-500/20 transition-colors" />
                            <h3 className="text-gray-400 text-sm font-medium uppercase tracking-wider mb-2">{cls.class_name}</h3>
                            <div className="flex items-baseline gap-2 mb-4">
                                <span className="stat-value">{cls.percentage.toFixed(1)}%</span>
                                <span className="text-sm text-gray-500">capacity</span>
                            </div>
                            <div className="w-full bg-white/5 h-2 rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-gradient-to-r from-blue-500 to-purple-500 rounded-full transition-all duration-1000 ease-out"
                                    style={{ width: cls.percentage + '%' }}
                                />
                            </div>
                        </div>
                    ))}
                </div>
            </section>

            {/* Row 2: Latecomer Trend (Line Chart) */}
            <section className="glass-panel mb-8">
                <div className="flex items-center justify-between mb-8">
                    <h2 className="flex items-center gap-3 text-xl text-white m-0">
                        <div className="p-2 bg-yellow-500/10 rounded-lg">
                            <TrendingUp className="text-yellow-500" size={24} />
                        </div>
                        Daily Latecomer Trend
                    </h2>
                </div>
                <div style={{ width: '100%', height: 300 }}>
                    <ResponsiveContainer>
                        <LineChart data={latecomerTrendData}>
                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                            <XAxis dataKey="date" stroke="#a3a3a3" tick={{ fill: '#a3a3a3' }} axisLine={false} tickLine={false} dy={10} />
                            <YAxis stroke="#a3a3a3" tick={{ fill: '#a3a3a3' }} axisLine={false} tickLine={false} unit="%" />
                            <Tooltip content={<CustomTooltip />} cursor={{ stroke: 'rgba(255,255,255,0.1)', strokeWidth: 2 }} />
                            <Line
                                type="monotone"
                                dataKey="latePercentage"
                                stroke="#f59e0b"
                                strokeWidth={3}
                                dot={{ fill: '#171717', stroke: '#f59e0b', strokeWidth: 2, r: 4 }}
                                activeDot={{ r: 8, fill: '#f59e0b' }}
                            />
                        </LineChart>
                    </ResponsiveContainer>
                </div>
            </section>

            {/* Row 3: Pie Chart & At Risk List */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
                {/* Attendance Status Pie Chart */}
                <div className="glass-panel flex flex-col">
                    <h2 className="flex items-center gap-3 text-xl mb-6 text-white">
                        <div className="p-2 bg-purple-500/10 rounded-lg">
                            <PieIcon className="text-purple-500" size={24} />
                        </div>
                        Attendance Distribution
                    </h2>
                    <div className="flex-1" style={{ width: '100%', height: 300 }}>
                        <ResponsiveContainer>
                            <PieChart>
                                <Pie
                                    data={statusDistribution}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={60}
                                    outerRadius={100}
                                    paddingAngle={5}
                                    dataKey="value"
                                >
                                    {statusDistribution.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.color} stroke="rgba(0,0,0,0)" />
                                    ))}
                                </Pie>
                                <Tooltip
                                    contentStyle={{ backgroundColor: '#171717', borderColor: 'rgba(255,255,255,0.1)', color: '#fff', borderRadius: '12px' }}
                                    itemStyle={{ color: '#fff' }}
                                />
                                <Legend verticalAlign="bottom" height={36} iconType="circle" />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Low Attendance Alert */}
                <div className="glass-panel flex flex-col">
                    <h2 className="flex items-center gap-3 text-xl mb-6 text-white">
                        <div className="p-2 bg-red-500/10 rounded-lg">
                            <AlertTriangle className="text-red-500" size={24} />
                        </div>
                        At Risk Students (&lt; 30%)
                    </h2>
                    <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar" style={{ maxHeight: '300px' }}>
                        {low_attendance_students.length > 0 ? (
                            <div className="grid grid-cols-2 gap-3">
                                {low_attendance_students.map(id => {
                                    const student = data.student_weekly_attendance.find(s => s.student_id === id);
                                    const percentage = student ? student.average_weekly.toFixed(0) : '?';
                                    return (
                                        <div key={id}
                                            onClick={() => setSelectedStudent(id)}
                                            className="group bg-red-500/5 border border-red-500/10 hover:bg-red-500/10 hover:border-red-500/30 p-3 rounded-xl flex items-center gap-3 cursor-pointer transition-all"
                                        >
                                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-red-500 to-orange-600 flex items-center justify-center text-white font-bold text-xs shadow-lg shadow-red-500/20">
                                                {percentage}%
                                            </div>
                                            <div>
                                                <p className="font-mono text-red-200 group-hover:text-white transition-colors text-sm">{id}</p>
                                                <span className="text-[10px] uppercase font-bold tracking-wider text-red-400">Critical</span>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        ) : (
                            <div className="h-full flex flex-col items-center justify-center text-gray-500 gap-4">
                                <div className="p-4 bg-green-500/10 rounded-full">
                                    <Users size={32} className="text-green-500" />
                                </div>
                                <p>All students are attending regularly.</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Row 4: Student List with Redesigned Search */}
            <section className="glass-panel mb-8">
                <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
                    <h2 className="text-xl text-white m-0">Student Weekly Performance</h2>

                    {/* Premium Glass Search Box */}
                    <div className="relative w-full md:w-96 group">
                        <div className="absolute inset-0 bg-blue-500/20 rounded-xl blur-xl opacity-0 group-focus-within:opacity-100 transition-opacity duration-500" />
                        <div className="relative flex items-center bg-[#0a0a0a]/60 border border-white/20 rounded-xl px-5 py-4 shadow-xl backdrop-blur-md transition-all duration-300 group-focus-within:bg-[#0a0a0a]/80 group-focus-within:border-blue-500/50 group-focus-within:shadow-blue-500/20">
                            <Search className="text-blue-400 mr-3" size={20} />
                            <input
                                type="text"
                                placeholder="Search by Student ID..."
                                className="bg-transparent border-none text-white placeholder-gray-400 focus:outline-none w-full text-base font-medium tracking-wide"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                            {searchTerm && (
                                <button
                                    onClick={() => setSearchTerm('')}
                                    className="p-1 hover:bg-white/10 rounded-full text-gray-400 hover:text-white transition-colors"
                                >
                                    <XIcon size={16} />
                                </button>
                            )}
                        </div>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr>
                                <th onClick={() => handleSort('student_id')} className="cursor-pointer hover:text-white transition-colors group w-1/3">
                                    <div className="flex items-center gap-2">
                                        Student ID
                                        {sortConfig.key === 'student_id' && (sortConfig.direction === 'asc' ? <ChevronUp size={14} /> : <ChevronDown size={14} />)}
                                    </div>
                                </th>
                                <th onClick={() => handleSort('average_weekly')} className="cursor-pointer hover:text-white transition-colors group w-1/3">
                                    <div className="flex items-center gap-2">
                                        Avg. Weekly Attendance
                                        {sortConfig.key === 'average_weekly' && (sortConfig.direction === 'asc' ? <ChevronUp size={14} /> : <ChevronDown size={14} />)}
                                    </div>
                                </th>
                                <th className="w-1/3">Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {sortedStudents.slice(0, 50).map((student) => (
                                <tr
                                    key={student.student_id}
                                    onClick={() => setSelectedStudent(student.student_id)}
                                    className="cursor-pointer group"
                                >
                                    <td className="py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="avatar">
                                                {student.student_id.slice(0, 2)}
                                            </div>
                                            <span className="font-mono text-gray-300 group-hover:text-white transition-colors">
                                                {student.student_id}
                                            </span>
                                        </div>
                                    </td>
                                    <td className="py-4">
                                        <div className="flex items-center gap-4">
                                            <div className="w-32 bg-white/10 h-2 rounded-full overflow-hidden">
                                                <div
                                                    className={`h-full rounded-full transition-all duration-500 ${student.average_weekly >= 75 ? 'bg-green-500' :
                                                        student.average_weekly >= 30 ? 'bg-yellow-500' : 'bg-red-500'
                                                        }`}
                                                    style={{ width: Math.min(student.average_weekly, 100) + '%' }}
                                                />
                                            </div>
                                            <span className="text-sm font-medium text-gray-400 w-12">{student.average_weekly.toFixed(1)}%</span>
                                        </div>
                                    </td>
                                    <td className="py-4">
                                        <span className={`text-xs font-bold px-3 py-1.5 rounded-full border ${student.average_weekly >= 75 ? 'bg-green-500/10 border-green-500/20 text-green-400' :
                                            student.average_weekly >= 30 ? 'bg-yellow-500/10 border-yellow-500/20 text-yellow-400' :
                                                'bg-red-500/10 border-red-500/20 text-red-400'
                                            }`}>
                                            {student.average_weekly >= 75 ? 'GOOD' : student.average_weekly >= 30 ? 'AVERAGE' : 'POOR'}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    {sortedStudents.length === 0 && (
                        <div className="p-12 text-center flex flex-col items-center gap-4 text-gray-500">
                            <Search size={48} className="opacity-20" />
                            <p>No students found matching "{searchTerm}"</p>
                        </div>
                    )}
                </div>
            </section>

            {/* Row 5: Insights & Recommendations */}
            {insights && (
                <section className="glass-panel mb-8 bg-gradient-to-br from-blue-900/20 to-purple-900/20 border-blue-500/20">
                    <h2 className="flex items-center gap-3 text-xl mb-6 text-white">
                        <div className="p-2 bg-blue-500/20 rounded-lg">
                            <Lightbulb className="text-blue-400" size={24} />
                        </div>
                        Insights & Recommendations
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {/* Insight 1: Lowest Class */}
                        <div className="bg-white/5 p-5 rounded-xl border border-white/10">
                            <div className="flex items-start gap-3 mb-3">
                                <TrendingUp className="text-red-400 mt-1" size={20} />
                                <div>
                                    <h3 className="text-white font-bold text-lg">Focus on {insights.lowestClass.class_name}</h3>
                                    <p className="text-gray-400 text-sm mt-1">
                                        This class has the lowest attendance rate at <span className="text-red-400 font-bold">{insights.lowestClass.percentage.toFixed(1)}%</span>.
                                    </p>
                                </div>
                            </div>
                            <div className="mt-4 pt-4 border-t border-white/10">
                                <p className="text-xs text-blue-300 font-medium flex items-center gap-2">
                                    <CheckCircle2 size={14} /> Recommendation:
                                </p>
                                <p className="text-gray-400 text-sm mt-1">Schedule a meeting with the class representative to identify blockers.</p>
                            </div>
                        </div>

                        {/* Insight 2: Latecomer Trend */}
                        <div className="bg-white/5 p-5 rounded-xl border border-white/10">
                            <div className="flex items-start gap-3 mb-3">
                                <Clock className="text-yellow-400 mt-1" size={20} />
                                <div>
                                    <h3 className="text-white font-bold text-lg">
                                        Lateness is {insights.lateTrend === 'increasing' ? 'Rising' : 'Improving'}
                                    </h3>
                                    <p className="text-gray-400 text-sm mt-1">
                                        Late arrivals have {insights.lateTrend === 'increasing' ? 'increased' : 'decreased'} by <span className="text-yellow-400 font-bold">{insights.lateDiff}%</span> over the period.
                                    </p>
                                </div>
                            </div>
                            <div className="mt-4 pt-4 border-t border-white/10">
                                <p className="text-xs text-blue-300 font-medium flex items-center gap-2">
                                    <CheckCircle2 size={14} /> Recommendation:
                                </p>
                                <p className="text-gray-400 text-sm mt-1">
                                    {insights.lateTrend === 'increasing'
                                        ? 'Review morning transport schedules or first-period timing.'
                                        : 'Current punctuality incentives seem to be working.'}
                                </p>
                            </div>
                        </div>

                        {/* Insight 3: Critical Students */}
                        <div className="bg-white/5 p-5 rounded-xl border border-white/10">
                            <div className="flex items-start gap-3 mb-3">
                                <AlertTriangle className="text-orange-400 mt-1" size={20} />
                                <div>
                                    <h3 className="text-white font-bold text-lg">{insights.criticalCount} Critical Cases</h3>
                                    <p className="text-gray-400 text-sm mt-1">
                                        Students with &lt;30% attendance require immediate intervention.
                                    </p>
                                </div>
                            </div>
                            <div className="mt-4 pt-4 border-t border-white/10">
                                <p className="text-xs text-blue-300 font-medium flex items-center gap-2">
                                    <CheckCircle2 size={14} /> Recommendation:
                                </p>
                                <p className="text-gray-400 text-sm mt-1">Initiate parent contact for the students listed in the "At Risk" section.</p>
                            </div>
                        </div>
                    </div>
                </section>
            )}

            {/* Modal */}
            {selectedStudent && (
                <StudentModal
                    studentId={selectedStudent}
                    onClose={() => setSelectedStudent(null)}
                />
            )}
        </div>
    );
};

export default Dashboard;
