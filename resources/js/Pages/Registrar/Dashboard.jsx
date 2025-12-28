import { Head, router } from '@inertiajs/react'
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { ChartContainer, ChartTooltip, ChartTooltipContent, ChartLegend, ChartLegendContent } from '@/components/ui/chart'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { PieChart, Pie, BarChart, Bar, XAxis as BarXAxis, YAxis as BarYAxis, CartesianGrid } from 'recharts'
import { Users, GraduationCap, BookOpen, UserCheck, School, FileText, Calendar, BarChart3, PieChart as PieChartIcon, Target, Activity, RefreshCw } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'

export default function RegistrarDashboard({ stats, auth }) {
    const registrar = auth.user.registrar
    const kpiData = stats.kpi_trends || []
    const [distributionType, setDistributionType] = useState('college')
    const [programFilter, setProgramFilter] = useState('college')
    const [selectedYearLevel, setSelectedYearLevel] = useState(kpiData.length > 0 ? kpiData[0].year_level : null)
    const [isRefreshing, setIsRefreshing] = useState(false)

    // Get selected year level data
    const selectedYearData = kpiData.find(item => item.year_level === selectedYearLevel) || kpiData[0]

    // Prepare chart data for the selected year level
    const chartData = selectedYearData ? selectedYearData.periods.map(period => ({
        period: period.label,
        paid: period.paid_count,
        unpaid: period.unpaid_count,
        total: period.total_count
    })) : []

    const formatCurrency = (value) => {
        return new Intl.NumberFormat('en-PH', {
            style: 'currency',
            currency: 'PHP',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        }).format(value);
    };

    const handleRefresh = () => {
        if (isRefreshing) return; // Prevent multiple simultaneous requests

        console.log('Starting refresh...');
        setIsRefreshing(true);
        router.post('/registrar/dashboard/refresh', {}, {
            onSuccess: (page) => {
                console.log('Refresh successful:', page);
                toast.success('Dashboard data refreshed successfully!', {
                    style: {
                        border: '1px solid #10b981',
                        backgroundColor: '#f0fdf4',
                        color: '#166534'
                    },
                    duration: 10000,
                });
            },
            onError: (errors) => {
                console.error('Refresh error:', errors);
                toast.error('Failed to refresh dashboard data');
            },
            onFinish: () => {
                console.log('Refresh finished');
                setIsRefreshing(false);
            }
        });
    };

    const CustomTooltip = ({ active, payload, label }) => {
        if (active && payload && payload.length) {
            return (
                <div className="bg-background border border-border rounded-lg shadow-lg p-3">
                    <p className="font-medium text-foreground mb-2">{label}</p>
                    {payload.map((entry, index) => (
                        <p key={index} className="text-sm flex items-center gap-2" style={{ color: entry.color }}>
                            <div
                                className="w-3 h-3 rounded"
                                style={{ backgroundColor: entry.color }}
                            />
                            {entry.name}: {entry.value} students
                        </p>
                    ))}
                </div>
            );
        }
        return null;
    };

    return (
        <AuthenticatedLayout
            header={
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div className="flex items-center gap-4">
                        <div className="bg-purple-100 p-2 rounded-lg">
                            <BarChart3 className="w-6 h-6 text-purple-600" />
                        </div>
                        <div className="flex flex-col">
                            <h1 className="text-2xl font-bold text-gray-900 leading-tight">
                                Registrar Dashboard
                            </h1>
                            <p className="text-sm text-gray-600 font-medium mt-0.5">
                                Welcome back, <span className="text-blue-600 font-semibold">{registrar?.full_name || auth.user.name}</span>
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2 text-sm text-gray-500">
                            <Calendar className="w-4 h-4" />
                            <span>{new Date().toLocaleDateString('en-US', { 
                                weekday: 'long', 
                                year: 'numeric', 
                                month: 'long', 
                                day: 'numeric' 
                            })}</span>
                        </div>
                        <Button
                            onClick={handleRefresh}
                            disabled={isRefreshing}
                            size="sm"
                            variant="outline"
                            className="h-8 px-3 text-xs"
                        >
                            <RefreshCw className={`w-3 h-3 mr-1 ${isRefreshing ? 'animate-spin' : ''}`} />
                            {isRefreshing ? 'Refreshing...' : 'Refresh'}
                        </Button>
                    </div>
                </div>
            }
        >
            <Head title="Registrar Dashboard" />

            <div className="space-y-8 p-6">
                {/* Quick Stats */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <Card className="shadow-sm hover:shadow-md transition-shadow">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Total Student Enrollment</CardTitle>
                            <Users className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stats.total_students}</div>
                            <Progress value={stats.total_students > 0 ? (stats.active_students / stats.total_students) * 100 : 0} className="h-1 mt-2" />
                            <div className="text-xs text-muted-foreground mt-1">
                                {stats.total_students > 0 ? Math.round((stats.active_students / stats.total_students) * 100) : 0}% active
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="shadow-sm hover:shadow-md transition-shadow">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Faculty Staff Members</CardTitle>
                            <GraduationCap className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stats.total_teachers}</div>
                            <Progress value={100} className="h-1 mt-2" />
                            <div className="text-xs text-muted-foreground mt-1">
                                All active
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="shadow-sm hover:shadow-md transition-shadow">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Total Academic Sections</CardTitle>
                            <School className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stats.total_sections}</div>
                            <Progress value={100} className="h-1 mt-2" />
                            <div className="text-xs text-muted-foreground mt-1">
                                All active
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="shadow-sm hover:shadow-md transition-shadow">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Inactive Students</CardTitle>
                            <UserCheck className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">
                                {stats.total_students - stats.active_students}
                            </div>
                            <Progress value={stats.total_students > 0 ? ((stats.total_students - stats.active_students) / stats.total_students) * 100 : 0} className="h-1 mt-2" />
                            <div className="text-xs text-muted-foreground mt-1">
                                {stats.total_students > 0 ? Math.round(((stats.total_students - stats.active_students) / stats.total_students) * 100) : 0}% of total
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Analytics Dashboard */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Payment Collection Rates by Period */}
                    <Card className="shadow-sm hover:shadow-md transition-shadow lg:col-span-2">
                        <CardHeader>
                            <div className="flex items-center justify-between">
                                <div>
                                    <CardTitle className="flex items-center gap-2">
                                        <BarChart3 className="w-5 h-5 text-green-600" />
                                        Payment Collection Status
                                    </CardTitle>
                                    <CardDescription>
                                        Paid vs unpaid students by academic period
                                    </CardDescription>
                                </div>
                                <div className="flex items-center gap-3">
                                    <span className="text-sm font-medium text-muted-foreground whitespace-nowrap">Year Level:</span>
                                    <Select value={selectedYearLevel?.toString()} onValueChange={(value) => setSelectedYearLevel(parseInt(value))}>
                                        <SelectTrigger className="w-48 h-9">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent className="w-48">
                                            {kpiData.map((item) => (
                                                <SelectItem key={item.year_level} value={item.year_level.toString()}>
                                                    {item.label} ({item.total_enrolled} students)
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="px-2 pt-4 sm:px-6 sm:pt-6">
                            <ChartContainer
                                config={{
                                    paid: {
                                        label: "Paid",
                                        color: "#10b981",
                                    },
                                    unpaid: {
                                        label: "Unpaid",
                                        color: "#f59e0b",
                                    },
                                }}
                                className="aspect-auto h-[400px] w-full"
                            >
                                <BarChart
                                    data={chartData}
                                    margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
                                    barCategoryGap="15%"
                                >
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <BarXAxis
                                        dataKey="period"
                                        axisLine={false}
                                        tickLine={false}
                                        tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))', angle: -45, textAnchor: 'end' }}
                                        height={80}
                                    />
                                    <BarYAxis
                                        axisLine={false}
                                        tickLine={false}
                                        tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
                                        domain={[0, 'dataMax']}
                                        label={{ value: 'Number of Students', angle: -90, position: 'insideLeft' }}
                                    />
                                    <ChartTooltip
                                        cursor={false}
                                        content={({ active, payload, label }) => {
                                            if (active && payload && payload.length) {
                                                return (
                                                    <div className="bg-background border border-border rounded-lg shadow-lg p-3">
                                                        <p className="font-medium text-foreground mb-2">{label}</p>
                                                        {payload.map((entry, index) => (
                                                            <p key={index} className="text-sm flex items-center gap-2" style={{ color: entry.color }}>
                                                                <div
                                                                    className="w-3 h-3 rounded"
                                                                    style={{ backgroundColor: entry.color }}
                                                                />
                                                                {entry.name}: {entry.value} students
                                                            </p>
                                                        ))}
                                                        <p className="text-sm text-muted-foreground mt-1">
                                                            Total: {payload[0]?.payload?.total || 0} students
                                                        </p>
                                                    </div>
                                                );
                                            }
                                            return null;
                                        }}
                                    />
                                    <Bar
                                        dataKey="paid"
                                        fill="#10b981"
                                        name="Paid"
                                        radius={[4, 4, 0, 0]}
                                    />
                                    <Bar
                                        dataKey="unpaid"
                                        fill="#f59e0b"
                                        name="Unpaid"
                                        radius={[4, 4, 0, 0]}
                                    />
                                    <ChartLegend content={<ChartLegendContent />} className="flex justify-center" />
                                </BarChart>
                            </ChartContainer>
                        </CardContent>
                    </Card>

                    {/* Student Type Distribution - Pie Chart */}
                    <Card className="shadow-sm hover:shadow-md transition-shadow lg:col-span-1">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <PieChartIcon className="w-5 h-5 text-blue-600" />
                                Student Types
                            </CardTitle>
                            <CardDescription>
                                Regular vs irregular enrollment
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="px-2 pt-4 sm:px-6 sm:pt-6">
                            <ChartContainer
                                config={{
                                    Regular: {
                                        label: "Regular",
                                        color: "#3b82f6",
                                    },
                                    Irregular: {
                                        label: "Irregular",
                                        color: "#ef4444",
                                    },
                                }}
                                className="mx-auto aspect-square max-h-[400px]"
                            >
                                <PieChart>
                                    <ChartLegend content={<ChartLegendContent />} verticalAlign="bottom" className="flex justify-center" />
                                    <ChartTooltip
                                        cursor={false}
                                        content={<ChartTooltipContent hideLabel />}
                                    />
                                    <Pie
                                        data={[
                                            {
                                                type: "Regular",
                                                students: 756,
                                                fill: "#3b82f6"
                                            },
                                            {
                                                type: "Irregular",
                                                students: 234,
                                                fill: "#ef4444"
                                            }
                                        ]}
                                        dataKey="students"
                                        nameKey="type"
                                        strokeWidth={2}
                                        stroke="hsl(var(--background))"
                                        label={({ percent }) => `${(percent * 100).toFixed(0)}%`}
                                    />
                                </PieChart>
                            </ChartContainer>
                        </CardContent>
                    </Card>
                </div>

                {/* Additional Analytics */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Course/Track Distribution */}
                    <Card className="shadow-sm hover:shadow-md transition-shadow">
                        <CardHeader>
                            <div className="flex items-center justify-between">
                                <div>
                                    <CardTitle className="flex items-center gap-2">
                                        <BookOpen className="w-5 h-5 text-purple-600" />
                                        Program Distribution
                                    </CardTitle>
                                    <CardDescription>
                                        {programFilter === 'college' ? 'College programs by department' : 'SHS tracks and strands'}
                                    </CardDescription>
                                </div>
                                <Select value={programFilter} onValueChange={setProgramFilter}>
                                    <SelectTrigger className="w-[120px]">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="college">College</SelectItem>
                                        <SelectItem value="senior_high">SHS</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {stats.programs && stats.programs[programFilter] ? (
                                <>
                                    {stats.programs[programFilter].map((program, index) => {
                                        const colors = ['bg-blue-500', 'bg-green-500', 'bg-purple-500', 'bg-orange-500', 'bg-red-500', 'bg-indigo-500', 'bg-pink-500'];
                                        const colorClass = colors[index % colors.length];
                                        const totalStudents = stats.programs[programFilter].reduce((sum, p) => sum + p.student_count, 0);
                                        const percentage = totalStudents > 0 ? Math.round((program.student_count / totalStudents) * 100) : 0;

                                        return (
                                            <div key={program.id} className="space-y-3">
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center gap-2">
                                                        <div className={`w-3 h-3 ${colorClass} rounded-full`}></div>
                                                        <span className="text-sm font-medium">{program.program_name}</span>
                                                    </div>
                                                    <div className="text-right">
                                                        <div className="text-sm font-bold">{program.student_count}</div>
                                                        <div className="text-xs text-gray-500">{percentage}%</div>
                                                    </div>
                                                </div>
                                                <Progress value={percentage} className="h-2" />
                                            </div>
                                        );
                                    })}
                                    <div className="pt-4 border-t">
                                        <div className="flex items-center justify-between">
                                            <span className="text-sm font-medium">Total {programFilter === 'college' ? 'College' : 'SHS'} Students</span>
                                            <Badge variant="default" className="bg-blue-100 text-blue-800">
                                                {stats.programs[programFilter].reduce((sum, p) => sum + p.student_count, 0)}
                                            </Badge>
                                        </div>
                                    </div>
                                </>
                            ) : (
                                <div className="text-center py-8 text-gray-500">
                                    No programs found for {programFilter === 'college' ? 'college' : 'SHS'}
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Student Year Distribution */}
                    <Card className="shadow-sm hover:shadow-md transition-shadow">
                        <CardHeader>
                            <div className="flex items-center justify-between">
                                <div>
                                    <CardTitle className="flex items-center gap-2">
                                        <GraduationCap className="w-5 h-5 text-blue-600" />
                                        Student Year Distribution
                                    </CardTitle>
                                    <CardDescription>
                                        {distributionType === 'college' ? 'College students by year level' : 'SHS students by grade level'}
                                    </CardDescription>
                                </div>
                                <Select value={distributionType} onValueChange={setDistributionType}>
                                    <SelectTrigger className="w-[120px]">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="college">College</SelectItem>
                                        <SelectItem value="shs">SHS</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {distributionType === 'college' ? (
                                <>
                                    <div className="space-y-3">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                                                <span className="text-sm font-medium">1st Year Students</span>
                                            </div>
                                            <div className="text-right">
                                                <div className="text-sm font-bold">245</div>
                                                <div className="text-xs text-gray-500">32%</div>
                                            </div>
                                        </div>
                                        <Progress value={32} className="h-2" />
                                    </div>

                                    <div className="space-y-3">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                                                <span className="text-sm font-medium">2nd Year Students</span>
                                            </div>
                                            <div className="text-right">
                                                <div className="text-sm font-bold">198</div>
                                                <div className="text-xs text-gray-500">26%</div>
                                            </div>
                                        </div>
                                        <Progress value={26} className="h-2" />
                                    </div>

                                    <div className="space-y-3">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                                                <span className="text-sm font-medium">3rd Year Students</span>
                                            </div>
                                            <div className="text-right">
                                                <div className="text-sm font-bold">167</div>
                                                <div className="text-xs text-gray-500">22%</div>
                                            </div>
                                        </div>
                                        <Progress value={22} className="h-2" />
                                    </div>

                                    <div className="space-y-3">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                                                <span className="text-sm font-medium">4th Year Students</span>
                                            </div>
                                            <div className="text-right">
                                                <div className="text-sm font-bold">146</div>
                                                <div className="text-xs text-gray-500">20%</div>
                                            </div>
                                        </div>
                                        <Progress value={20} className="h-2" />
                                    </div>

                                    <div className="pt-4 border-t">
                                        <div className="flex items-center justify-between">
                                            <span className="text-sm font-medium">Total College Students</span>
                                            <Badge variant="default" className="bg-blue-100 text-blue-800">
                                                756
                                            </Badge>
                                        </div>
                                    </div>
                                </>
                            ) : (
                                <>
                                    <div className="space-y-3">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                                                <span className="text-sm font-medium">Grade 11 Students</span>
                                            </div>
                                            <div className="text-right">
                                                <div className="text-sm font-bold">189</div>
                                                <div className="text-xs text-gray-500">52%</div>
                                            </div>
                                        </div>
                                        <Progress value={52} className="h-2" />
                                    </div>

                                    <div className="space-y-3">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                                                <span className="text-sm font-medium">Grade 12 Students</span>
                                            </div>
                                            <div className="text-right">
                                                <div className="text-sm font-bold">174</div>
                                                <div className="text-xs text-gray-500">48%</div>
                                            </div>
                                        </div>
                                        <Progress value={48} className="h-2" />
                                    </div>

                                    <div className="pt-4 border-t">
                                        <div className="flex items-center justify-between">
                                            <span className="text-sm font-medium">Total SHS Students</span>
                                            <Badge variant="default" className="bg-red-100 text-red-800">
                                                363
                                            </Badge>
                                        </div>
                                    </div>
                                </>
                            )}
                        </CardContent>
                    </Card>
                </div>

                {/* Key Insights & Actions */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Payment Overview */}
                    <Card className="shadow-sm hover:shadow-md transition-shadow">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Target className="w-5 h-5 text-green-600" />
                                Payment Overview
                            </CardTitle>
                            <CardDescription>
                                Current semester payment status
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                                        <span className="text-sm font-medium">Recent Payments (7 days)</span>
                                    </div>
                                    <div className="text-right">
                                        <div className="text-sm font-bold">{stats.payment_stats?.recent_payments || 0}</div>
                                        <div className="text-xs text-gray-500">Active</div>
                                    </div>
                                </div>
                                <Progress value={100} className="h-2" />
                            </div>
                            <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
                                        <span className="text-sm font-medium">Pending Payments</span>
                                    </div>
                                    <div className="text-right">
                                        <div className="text-sm font-bold">{stats.payment_stats?.pending_payments || 0}</div>
                                        <div className="text-xs text-gray-500">Outstanding</div>
                                    </div>
                                </div>
                                <Progress value={stats.payment_stats?.pending_payments > 0 ? 50 : 0} className="h-2" />
                            </div>
                            <div className="pt-4 border-t">
                                <div className="flex items-center justify-between">
                                    <span className="text-sm font-medium">Total Collected</span>
                                    <Badge variant="default" className="bg-green-100 text-green-800">
                                        ₱{formatCurrency(stats.payment_stats?.total_paid || 0)}
                                    </Badge>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Enrollment Alerts */}
                    <Card className="shadow-sm hover:shadow-md transition-shadow">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Activity className="w-5 h-5 text-blue-600" />
                                Enrollment Status
                            </CardTitle>
                            <CardDescription>
                                Current enrollment activity
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                                        <span className="text-sm font-medium">New Enrollments (7 days)</span>
                                    </div>
                                    <div className="text-right">
                                        <div className="text-sm font-bold">{stats.enrollment_alerts?.recent_enrollments || 0}</div>
                                        <div className="text-xs text-gray-500">Recent</div>
                                    </div>
                                </div>
                                <Progress value={100} className="h-2" />
                            </div>
                            <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                                        <span className="text-sm font-medium">Pending Enrollments</span>
                                    </div>
                                    <div className="text-right">
                                        <div className="text-sm font-bold">{stats.enrollment_alerts?.incomplete_enrollments || 0}</div>
                                        <div className="text-xs text-gray-500">Incomplete</div>
                                    </div>
                                </div>
                                <Progress value={stats.enrollment_alerts?.incomplete_enrollments > 0 ? 50 : 0} className="h-2" />
                            </div>
                            <div className="pt-4 border-t">
                                <div className="flex items-center justify-between">
                                    <span className="text-sm font-medium">Enrollment Rate</span>
                                    <Badge variant="default" className="bg-blue-100 text-blue-800">
                                        {stats.total_students > 0 ? Math.round((stats.active_students / stats.total_students) * 100) : 0}%
                                    </Badge>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </AuthenticatedLayout>
    )
}