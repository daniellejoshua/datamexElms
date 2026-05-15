import { Head, router } from '@inertiajs/react'
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { ChartContainer, ChartTooltip, ChartTooltipContent, ChartLegend, ChartLegendContent } from '@/components/ui/chart'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { PieChart, Pie, BarChart, Bar, XAxis as BarXAxis, YAxis as BarYAxis, CartesianGrid } from 'recharts'
import { Users, GraduationCap, BookOpen, UserCheck, School, FileText, Calendar, BarChart3, PieChart as PieChartIcon, RefreshCw, Search, X } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'

export default function RegistrarDashboard({ stats, auth }) {
    const registrar = auth.user.registrar
    const kpiData = stats.kpi_trends || []
    const [distributionType, setDistributionType] = useState('college')
    const [programFilter, setProgramFilter] = useState('college')
    const [selectedYearLevel, setSelectedYearLevel] = useState(kpiData.length > 0 ? kpiData[0].year_level : null)
    const [isRefreshing, setIsRefreshing] = useState(false)

    // Modal state
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [modalData, setModalData] = useState({ students: [], total: 0, period: '', status: '', yearLevel: '', currentPage: 1, lastPage: 1, from: 0, to: 0 })
    const [searchTerm, setSearchTerm] = useState('')
    const [isLoadingModal, setIsLoadingModal] = useState(false)
    const [currentPage, setCurrentPage] = useState(1)

    // Get selected year level data
    const selectedYearData = kpiData.find(item => item.year_level === selectedYearLevel) || kpiData[0]

    // Prepare chart data for the selected year level
    const chartData = selectedYearData ? selectedYearData.periods.map(period => ({
        period: period.period, // Keep the period key for API calls
        label: period.label,   // Keep the human-readable label for display
        paid: period.paid_count,
        unpaid: period.unpaid_count,
        total: period.total_count
    })) : []

    // Determine if current selection is SHS
    const isShs = selectedYearData?.is_shs || false
    
    // Dynamic chart configuration based on student type
    const chartConfig = isShs ? {
        paid: {
            label: "With Voucher",
            color: "#10b981",
        },
        unpaid: {
            label: "Without Voucher", 
            color: "#f59e0b",
        },
    } : {
        paid: {
            label: "Paid",
            color: "#10b981",
        },
        unpaid: {
            label: "Unpaid",
            color: "#f59e0b",
        },
    }

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

    const handleBarClick = (data, status) => {
        if (!data || !selectedYearLevel) return;

        setIsLoadingModal(true);
        setIsModalOpen(true);
        setSearchTerm('');
        setCurrentPage(1);

        loadModalData(data, status, 1, '');
    };

    const loadModalData = (data, status, page = 1, search = '') => {
        const params = new URLSearchParams({
            year_level: selectedYearLevel.toString(),
            period: data.period || data,
            status: status,
            page: page.toString(),
            per_page: '50'
        });

        if (search) {
            params.append('search', search);
        }

        // Use fetch for AJAX request to avoid page navigation
        fetch(`/registrar/dashboard/payment-details?${params.toString()}`, {
            method: 'GET',
            headers: {
                'Accept': 'application/json',
                'X-Requested-With': 'XMLHttpRequest',
                'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content')
            }
        })
        .then(response => response.json())
        .then(responseData => {
            setModalData({
                students: responseData.students || [],
                total: responseData.total || 0,
                period: data.label || data,
                status: status,
                yearLevel: selectedYearLevel,
                currentPage: responseData.current_page || 1,
                lastPage: responseData.last_page || 1,
                from: responseData.from || 0,
                to: responseData.to || 0
            });
            setCurrentPage(responseData.current_page || 1);
        })
        .catch(error => {
            console.error('Error fetching payment details:', error);
            toast.error('Failed to load student details');
            setIsModalOpen(false);
        })
        .finally(() => {
            setIsLoadingModal(false);
        });
    };

    const handleSearch = (searchValue) => {
        setSearchTerm(searchValue);
        setCurrentPage(1);
        if (modalData.period && modalData.status) {
            setIsLoadingModal(true);
            loadModalData({ period: modalData.period.includes('Voucher') ? 'voucher_status' : modalData.period, label: modalData.period }, modalData.status, 1, searchValue);
        }
    };

    const handlePageChange = (page) => {
        if (page < 1 || page > modalData.lastPage) return;
        setIsLoadingModal(true);
        loadModalData({ period: modalData.period.includes('Voucher') ? 'voucher_status' : modalData.period, label: modalData.period }, modalData.status, page, searchTerm);
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
        <>
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
                                        {isShs ? 'Voucher Status Distribution' : 'Payment Collection Status'}
                                    </CardTitle>
                                    <CardDescription>
                                        {isShs ? 'Students with and without vouchers' : 'Paid vs unpaid students by academic period'}
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
                            {chartData.length > 0 ? (
                                <ChartContainer
                                    config={chartConfig}
                                    className="aspect-auto h-[400px] w-full"
                                >
                                    <BarChart
                                        data={chartData}
                                        margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
                                        barCategoryGap="15%"
                                    >
                                        <CartesianGrid strokeDasharray="3 3" />
                                        <BarXAxis
                                            dataKey="label"
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
                                            onClick={(data) => handleBarClick(data, 'paid')}
                                            style={{ cursor: 'pointer' }}
                                        />
                                        <Bar
                                            dataKey="unpaid"
                                            fill="#f59e0b"
                                            name="Unpaid"
                                            radius={[4, 4, 0, 0]}
                                            onClick={(data) => handleBarClick(data, 'unpaid')}
                                            style={{ cursor: 'pointer' }}
                                        />
                                        <ChartLegend content={<ChartLegendContent />} className="flex justify-center" />
                                    </BarChart>
                                </ChartContainer>
                            ) : (
                                <div className="flex items-center justify-center h-[400px] text-gray-500">
                                    <div className="text-center">
                                        <BarChart3 className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                                        <p className="text-lg font-medium">No data available for this semester</p>
                                        <p className="text-sm text-gray-400">No enrollment data found for the selected year level</p>
                                    </div>
                                </div>
                            )}
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
                            {(stats.regular_students || 0) + (stats.irregular_students || 0) > 0 ? (
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
                                                    students: stats.regular_students || 0,
                                                    fill: "#3b82f6"
                                                },
                                                {
                                                    type: "Irregular",
                                                    students: stats.irregular_students || 0,
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
                            ) : (
                                <div className="flex items-center justify-center h-[400px] text-gray-500">
                                    <div className="text-center">
                                        <PieChartIcon className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                                        <p className="text-lg font-medium">No data available</p>
                                        <p className="text-sm text-gray-400">No student enrollment data found</p>
                                    </div>
                                </div>
                            )}
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
                                        {programFilter === 'college' ? 'College programs by department' : 'Senior High tracks and strands'}
                                    </CardDescription>
                                </div>
                                <Select value={programFilter} onValueChange={setProgramFilter}>
                                    <SelectTrigger className="w-[120px]">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="college">College</SelectItem>
                                        <SelectItem value="senior_high">Senior High</SelectItem>
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
                                    {stats.year_level_distribution?.college && stats.year_level_distribution.college.length > 0 ? (
                                        stats.year_level_distribution.college.map((level, index) => {
                                            const totalStudents = stats.year_level_distribution.college.reduce((sum, l) => sum + l.count, 0);
                                            const percentage = totalStudents > 0 ? Math.round((level.count / totalStudents) * 100) : 0;
                                            const colors = ['bg-blue-500', 'bg-red-500', 'bg-green-500', 'bg-purple-500'];
                                            const colorClass = colors[index % colors.length];

                                            return (
                                                <div key={level.year_level} className="space-y-3">
                                                    <div className="flex items-center justify-between">
                                                        <div className="flex items-center gap-2">
                                                            <div className={`w-3 h-3 ${colorClass} rounded-full`}></div>
                                                            <span className="text-sm font-medium">{level.label} Students</span>
                                                        </div>
                                                        <div className="text-right">
                                                            <div className="text-sm font-bold">{level.count}</div>
                                                            <div className="text-xs text-gray-500">{percentage}%</div>
                                                        </div>
                                                    </div>
                                                    <Progress value={percentage} className="h-2" />
                                                </div>
                                            );
                                        })
                                    ) : (
                                        <div className="text-center py-8 text-gray-500">
                                            No college students found
                                        </div>
                                    )}
                                    <div className="pt-4 border-t">
                                        <div className="flex items-center justify-between">
                                            <span className="text-sm font-medium">Total College Students</span>
                                            <Badge variant="default" className="bg-blue-100 text-blue-800">
                                                {stats.year_level_distribution?.college ? stats.year_level_distribution.college.reduce((sum, l) => sum + l.count, 0) : 0}
                                            </Badge>
                                        </div>
                                    </div>
                                </>
                            ) : (
                                <>
                                    {stats.year_level_distribution?.shs && stats.year_level_distribution.shs.length > 0 ? (
                                        stats.year_level_distribution.shs.map((level, index) => {
                                            const totalStudents = stats.year_level_distribution.shs.reduce((sum, l) => sum + l.count, 0);
                                            const percentage = totalStudents > 0 ? Math.round((level.count / totalStudents) * 100) : 0;
                                            const colors = ['bg-blue-500', 'bg-red-500'];
                                            const colorClass = colors[index % colors.length];

                                            return (
                                                <div key={level.year_level} className="space-y-3">
                                                    <div className="flex items-center justify-between">
                                                        <div className="flex items-center gap-2">
                                                            <div className={`w-3 h-3 ${colorClass} rounded-full`}></div>
                                                            <span className="text-sm font-medium">{level.label} Students</span>
                                                        </div>
                                                        <div className="text-right">
                                                            <div className="text-sm font-bold">{level.count}</div>
                                                            <div className="text-xs text-gray-500">{percentage}%</div>
                                                        </div>
                                                    </div>
                                                    <Progress value={percentage} className="h-2" />
                                                </div>
                                            );
                                        })
                                    ) : (
                                        <div className="text-center py-8 text-gray-500">
                                            No SHS students found
                                        </div>
                                    )}
                                    <div className="pt-4 border-t">
                                        <div className="flex items-center justify-between">
                                            <span className="text-sm font-medium">Total SHS Students</span>
                                            <Badge variant="default" className="bg-red-100 text-red-800">
                                                {stats.year_level_distribution?.shs ? stats.year_level_distribution.shs.reduce((sum, l) => sum + l.count, 0) : 0}
                                            </Badge>
                                        </div>
                                    </div>
                                </>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </AuthenticatedLayout>
        
        {/* Payment Details Modal - Positioned outside layout */}
        {isModalOpen && (
            <div 
                className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[9999] p-4"
                style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0 }}
                onClick={() => setIsModalOpen(false)}
            >
                <div 
                    className="bg-white rounded-xl shadow-2xl max-w-5xl w-full max-h-[90vh] overflow-hidden border border-gray-100 relative"
                    onClick={(e) => e.stopPropagation()}
                >
                    {/* Modal Header */}
                    <div className="px-6 py-5 border-b border-gray-200">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className={`p-2 rounded-lg ${modalData.status === 'paid' ? 'bg-green-500/20' : 'bg-amber-500/20'}`}>
                                    {modalData.status === 'paid' ? (
                                        <UserCheck className="w-6 h-6 text-green-600" />
                                    ) : (
                                        <Users className="w-6 h-6 text-amber-600" />
                                    )}
                                </div>
                                <div>
                                    <h3 className="text-xl font-bold text-gray-900">
                                        {isShs ? 
                                            (modalData.status === 'paid' ? 'Students With Voucher' : 'Students Without Voucher') :
                                            (modalData.status === 'paid' ? 'Paid Students' : 'Unpaid Students')
                                        }
                                    </h3>
                                    <p className="text-gray-600 text-sm font-medium">
                                        {modalData.period} • Year Level {modalData.yearLevel} • {modalData.total} {modalData.total === 1 ? 'student' : 'students'}
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={() => setIsModalOpen(false)}
                                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-all duration-200"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                    </div>

                    <div className="p-6 bg-gray-50/30">
                        {/* Search Bar */}
                        <div className="mb-6">
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <Search className="h-5 w-5 text-gray-400" />
                                </div>
                                <input
                                    type="text"
                                    placeholder="Search by name, student number, or program..."
                                    value={searchTerm}
                                    onChange={(e) => handleSearch(e.target.value)}
                                    className="block w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl shadow-sm bg-white/80 backdrop-blur-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 text-gray-900 placeholder-gray-500"
                                />
                            </div>
                        </div>

                        {/* Student List - 3 Column Grid */}
                        <div className="max-h-[50vh] overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100 pr-2">
                            {isLoadingModal ? (
                                <div className="flex flex-col items-center justify-center py-12">
                                    <div className="relative">
                                        <div className="animate-spin rounded-full h-12 w-12 border-4 border-gray-200"></div>
                                        <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-600 border-t-transparent absolute top-0"></div>
                                    </div>
                                    <p className="text-gray-600 mt-4 font-medium">Loading students...</p>
                                </div>
                            ) : (
                                <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 gap-3">
                                    {modalData.students.map((student) => (
                                        <div key={student.id} className="group bg-white rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-all duration-200 p-3">
                                            <div className="flex items-center gap-3">
                                                <div className="flex-shrink-0">
                                                    <div className={`w-9 h-9 rounded-full flex items-center justify-center ${modalData.status === 'paid' ? 'bg-gradient-to-br from-green-100 to-green-200' : 'bg-gradient-to-br from-amber-100 to-amber-200'}`}>
                                                        <Users className={`w-4 h-4 ${modalData.status === 'paid' ? 'text-green-600' : 'text-amber-600'}`} />
                                                    </div>
                                                </div>

                                                <div className="min-w-0 flex-1">
                                                    <div className="flex items-start justify-between gap-3">
                                                        <div className="truncate">
                                                            <h4 className="font-semibold text-gray-900 text-sm truncate">{student.full_name}</h4>
                                                            <p className="text-xs text-gray-500 mt-0.5 truncate">{student.student_number}</p>
                                                        </div>

                                                        <div className="flex flex-col items-end ml-2">
                                                            {/* show section as the badge if available, otherwise fallback to program */}
                                                            <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${modalData.status === 'paid' ? 'bg-green-100 text-green-800 border border-green-200' : 'bg-amber-100 text-amber-800 border border-amber-200'}`}>
                                                                {student.section ? student.section : student.program_code}
                                                            </span>

                                                            {/* only show "Irregular" label for irregular students; no "No section" text */}
                                                            {student.student_type === 'irregular' && (
                                                                <div className="text-xs text-gray-500 mt-1">Irregular</div>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                    {modalData.students.length === 0 && !isLoadingModal && (
                                        <div className="col-span-full">
                                            <div className="flex flex-col items-center justify-center py-12">
                                                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                                                    <Search className="w-8 h-8 text-gray-400" />
                                                </div>
                                                <h3 className="text-lg font-semibold text-gray-900 mb-2">No students found</h3>
                                                <p className="text-gray-500 text-center max-w-sm">
                                                    Try adjusting your search criteria to find the students you're looking for.
                                                </p>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Modal Footer */}
                    <div className="bg-gray-50 px-6 py-4 border-t border-gray-200">
                        <div className="flex items-center justify-between text-sm">
                            <div className="flex items-center gap-2 text-gray-600">
                                <div className={`w-3 h-3 rounded-full ${
                                    modalData.status === 'paid' ? 'bg-green-500' : 'bg-amber-500'
                                }`}></div>
                                <span>
                                    Showing {modalData.from} to {modalData.to} of {modalData.total} students
                                </span>
                            </div>
                            
                            {/* Pagination Controls */}
                            {modalData.lastPage > 1 && (
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => handlePageChange(currentPage - 1)}
                                        disabled={currentPage === 1}
                                        className="px-3 py-1 text-sm border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        Previous
                                    </button>
                                    
                                    <div className="flex items-center gap-1">
                                        {/* Show page numbers */}
                                        {Array.from({ length: Math.min(5, modalData.lastPage) }, (_, i) => {
                                            let pageNumber;
                                            if (modalData.lastPage <= 5) {
                                                pageNumber = i + 1;
                                            } else if (currentPage <= 3) {
                                                pageNumber = i + 1;
                                            } else if (currentPage >= modalData.lastPage - 2) {
                                                pageNumber = modalData.lastPage - 4 + i;
                                            } else {
                                                pageNumber = currentPage - 2 + i;
                                            }
                                            
                                            return (
                                                <button
                                                    key={pageNumber}
                                                    onClick={() => handlePageChange(pageNumber)}
                                                    className={`px-3 py-1 text-sm border rounded-md ${
                                                        pageNumber === currentPage
                                                            ? 'bg-blue-500 text-white border-blue-500'
                                                            : 'border-gray-300 hover:bg-gray-50'
                                                    }`}
                                                >
                                                    {pageNumber}
                                                </button>
                                            );
                                        })}
                                    </div>
                                    
                                    <button
                                        onClick={() => handlePageChange(currentPage + 1)}
                                        disabled={currentPage === modalData.lastPage}
                                        className="px-3 py-1 text-sm border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        Next
                                    </button>
                                </div>
                            )}
                            
                            <button
                                onClick={() => setIsModalOpen(false)}
                                className="px-4 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors duration-200 font-medium"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        )}
        </>
    )
}