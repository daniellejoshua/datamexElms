import { Head, Link } from '@inertiajs/react'
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { ChartContainer, ChartTooltip, ChartTooltipContent, ChartLegend, ChartLegendContent } from '@/components/ui/chart'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Area, AreaChart, ResponsiveContainer, XAxis, YAxis, PieChart, Pie, Cell } from 'recharts'
import { Users, GraduationCap, BookOpen, UserCheck, School, FileText, Calendar, TrendingUp, Activity, BarChart3, PieChart as PieChartIcon, Target } from 'lucide-react'
import { useState } from 'react'

export default function RegistrarDashboard({ stats, auth }) {
    const registrar = auth.user.registrar
    const [filter, setFilter] = useState('all')
    const [distributionType, setDistributionType] = useState('college')
    const [programFilter, setProgramFilter] = useState('college')

    const enrollmentData = [
        { month: 'Jan', college: 245, shs: 189 },
        { month: 'Feb', college: 267, shs: 203 },
        { month: 'Mar', college: 289, shs: 218 },
        { month: 'Apr', college: 25, shs: 24 },
        { month: 'May', college: 334, shs: 251 },
        { month: 'Jun', college: 356, shs: 267 },
        { month: 'Jul', college: 38, shs: 21 },
        { month: 'Aug', college: 401, shs: 301 },
        { month: 'Sep', college: 423, shs: 318 },
        { month: 'Oct', college: 445, shs: 335 },
        { month: 'Nov', college: 467, shs: 352 },
        { month: 'Dec', college: 489, shs: 369 },
    ]

    const getFilteredData = () => {
        switch (filter) {
            case 'last7days':
                return enrollmentData.slice(-1) // Last month as approximation
            case 'lastmonth':
                return enrollmentData.slice(-1)
            case 'last3months':
                return enrollmentData.slice(-3)
            case 'lastyear':
                return enrollmentData
            case 'all':
            default:
                return enrollmentData
        }
    }

    const filteredData = getFilteredData()

    return (
        <AuthenticatedLayout
            header={
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-center gap-3">
                        <div className="bg-blue-100 p-2 rounded-lg">
                            <School className="w-6 h-6 text-blue-600" />
                        </div>
                        <div>
                            <h2 className="text-2xl font-bold text-gray-900">Registrar Dashboard</h2>
                            <p className="text-sm text-blue-600 font-medium mt-1">
                                Welcome back, {registrar?.full_name || auth.user.name} - Employee #{registrar?.employee_number || 'N/A'}
                            </p>
                        </div>
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
                            <CardTitle className="text-sm font-medium">Total Students</CardTitle>
                            <Users className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stats.total_students}</div>
                            <p className="text-xs text-muted-foreground">
                                {stats.active_students} active
                            </p>
                        </CardContent>
                    </Card>

                    <Card className="shadow-sm hover:shadow-md transition-shadow">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Total Teachers</CardTitle>
                            <GraduationCap className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stats.total_teachers}</div>
                            <p className="text-xs text-muted-foreground">
                                {stats.active_teachers} active
                            </p>
                        </CardContent>
                    </Card>

                    <Card className="shadow-sm hover:shadow-md transition-shadow">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Total Sections</CardTitle>
                            <School className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stats.total_sections}</div>
                            <p className="text-xs text-muted-foreground">
                                Current academic year
                            </p>
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
                            <p className="text-xs text-muted-foreground">
                                Need attention
                            </p>
                        </CardContent>
                    </Card>
                </div>

                {/* Analytics Dashboard */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Student Enrollment Trends */}
                    <Card className="shadow-sm hover:shadow-md transition-shadow lg:col-span-2">
                        <CardHeader className="flex items-center gap-2 space-y-0 border-b py-5 sm:flex-row">
                            <div className="grid flex-1 gap-1">
                                <CardTitle className="flex items-center gap-2">
                                    <TrendingUp className="w-5 h-5 text-blue-600" />
                                    Student Enrollment Trends
                                </CardTitle>
                                <CardDescription>
                                    College and SHS student enrollment over the past 12 months
                                </CardDescription>
                            </div>
                            <Select value={filter} onValueChange={setFilter}>
                                <SelectTrigger className="w-[180px]">
                                    <SelectValue placeholder="Filter by period" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All</SelectItem>
                                    <SelectItem value="lastyear">Last Year</SelectItem>
                                    <SelectItem value="last3months">Last 3 Months</SelectItem>
                                    <SelectItem value="lastmonth">Last Month</SelectItem>
                                    <SelectItem value="last7days">Last 7 Days</SelectItem>
                                </SelectContent>
                            </Select>
                        </CardHeader>
                        <CardContent className="px-2 pt-4 sm:px-6 sm:pt-6">
                            <ChartContainer
                                config={{
                                    college: {
                                        label: "College Students",
                                        color: "oklch(0.6 0.2 240)",
                                    },
                                    shs: {
                                        label: "SHS Students",
                                        color: "oklch(0.6 0.25 25)",
                                    },
                                }}
                                className="aspect-auto h-[400px] w-full"
                            >
                                <AreaChart
                                    data={filteredData}
                                    margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                                >
                                    <defs>
                                        <linearGradient id="fillCollege" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="oklch(0.6 0.2 240)" stopOpacity={0.8}/>
                                            <stop offset="95%" stopColor="oklch(0.6 0.2 240)" stopOpacity={0.1}/>
                                        </linearGradient>
                                        <linearGradient id="fillSHS" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="oklch(0.6 0.25 25)" stopOpacity={0.8}/>
                                            <stop offset="95%" stopColor="oklch(0.6 0.25 25)" stopOpacity={0.1}/>
                                        </linearGradient>
                                    </defs>
                                    <XAxis 
                                        dataKey="month" 
                                        axisLine={false}
                                        tickLine={false}
                                        tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
                                    />
                                    <ChartTooltip content={<ChartTooltipContent />} />
                                    <Area
                                        type="natural"
                                        dataKey="college"
                                        stackId="1"
                                        stroke="oklch(0.6 0.2 240)"
                                        fill="url(#fillCollege)"
                                    />
                                    <Area
                                        type="natural"
                                        dataKey="shs"
                                        stackId="1"
                                        stroke="oklch(0.6 0.25 25)"
                                        fill="url(#fillSHS)"
                                    />
                                    <ChartLegend content={<ChartLegendContent />} className="flex justify-center mt-4" />
                                </AreaChart>
                            </ChartContainer>
                        </CardContent>
                    </Card>

                    {/* Student Type Distribution - Pie Chart */}
                    <Card className="shadow-sm hover:shadow-md transition-shadow lg:col-span-1">
                        <CardHeader className="flex items-center gap-2 space-y-0 border-b py-5 sm:flex-row">
                            <div className="grid flex-1 gap-1">
                                <CardTitle className="flex items-center gap-2">
                                    <PieChartIcon className="w-5 h-5 text-purple-600" />
                                    Student Type Distribution
                                </CardTitle>
                                <CardDescription>
                                    Regular vs Irregular students
                                </CardDescription>
                            </div>
                        </CardHeader>
                        <CardContent className="px-2 pt-4 sm:px-6 sm:pt-6">
                            <ChartContainer
                                config={{
                                    Regular: {
                                        label: "Regular",
                                        color: "oklch(0.55 0.15 240)",
                                    },
                                    Irregular: {
                                        label: "Irregular",
                                        color: "oklch(0.55 0.18 25)",
                                    },
                                }}
                                className="mx-auto aspect-square max-h-[300px]"
                            >
                                <PieChart>
                                    <ChartLegend 
                                        content={<ChartLegendContent />} 
                                        verticalAlign="top" 
                                        align="center"
                                        wrapperStyle={{ paddingBottom: '20px' }}
                                    />
                                    <ChartTooltip
                                        cursor={false}
                                        content={<ChartTooltipContent hideLabel />}
                                    />
                                    <Pie
                                        data={[
                                            {
                                                type: "Regular",
                                                students: 756,
                                                fill: "oklch(0.55 0.15 240)"
                                            },
                                            {
                                                type: "Irregular",
                                                students: 234,
                                                fill: "oklch(0.55 0.18 25)"
                                            }
                                        ]}
                                        dataKey="students"
                                        nameKey="type"
                                        strokeWidth={2}
                                        stroke="hsl(var(--background))"
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
                                        Course/Track Distribution
                                    </CardTitle>
                                    <CardDescription>
                                        Students enrolled in {programFilter === 'college' ? 'college programs' : 'SHS tracks'}
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
                            {console.log('Stats programs:', stats.programs)}
                            {console.log('Program filter:', programFilter)}
                            {console.log('Current programs:', stats.programs?.[programFilter])}
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
                                    <br />
                                    <small>Debug: {JSON.stringify(stats.programs)}</small>
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

                {/* Recent Activity Section */}
                <Card className="shadow-sm hover:shadow-md transition-shadow">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <FileText className="w-5 h-5 text-indigo-600" />
                            Recent Activity
                        </CardTitle>
                        <CardDescription>
                            Latest updates and actions in the system
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            <div className="flex items-center space-x-4 p-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors">
                                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                                <div className="flex-1">
                                    <p className="text-sm font-medium">System initialized</p>
                                    <p className="text-xs text-gray-500">Registrar dashboard is ready for use</p>
                                </div>
                                <span className="text-xs text-gray-500">Just now</span>
                            </div>

                            <div className="flex items-center space-x-4 p-3 rounded-lg bg-blue-50 hover:bg-blue-100 transition-colors">
                                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                                <div className="flex-1">
                                    <p className="text-sm font-medium">Student enrollment updated</p>
                                    <p className="text-xs text-gray-500">New students registered for current semester</p>
                                </div>
                                <span className="text-xs text-gray-500">2 hours ago</span>
                            </div>

                            <div className="flex items-center space-x-4 p-3 rounded-lg bg-purple-50 hover:bg-purple-100 transition-colors">
                                <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                                <div className="flex-1">
                                    <p className="text-sm font-medium">Payment processed</p>
                                    <p className="text-xs text-gray-500">Tuition fees collected successfully</p>
                                </div>
                                <span className="text-xs text-gray-500">5 hours ago</span>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </AuthenticatedLayout>
    )
}