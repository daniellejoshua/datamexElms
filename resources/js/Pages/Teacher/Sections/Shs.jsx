import React, { useState } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { 
    School, 
    Users, 
    BookOpen, 
    Calendar, 
    GraduationCap,
    Search,
    FileText,
    BarChart3,
    ChevronRight,
    Upload
} from 'lucide-react';

export default function ShsSections({ sections, filters }) {
    const [searchTerm, setSearchTerm] = useState(filters?.search || '');

    // Format schedule for display
    const formatSchedule = (scheduleDays, startTime, endTime) => {
        if (!scheduleDays || scheduleDays.length === 0) return 'No schedule set';
        
        try {
            const days = Array.isArray(scheduleDays) ? scheduleDays : JSON.parse(scheduleDays || '[]');
            
            // Convert days to lowercase for comparison
            const daySet = new Set(days.map(day => day.toLowerCase()));
            
            // Common schedule patterns
            let dayDisplay = '';
            if (daySet.has('monday') && daySet.has('wednesday') && daySet.has('friday') && daySet.size === 3) {
                dayDisplay = 'MWF';
            } else if (daySet.has('tuesday') && daySet.has('thursday') && daySet.size === 2) {
                dayDisplay = 'TTHS';
            } else if (daySet.has('monday') && daySet.has('tuesday') && daySet.has('wednesday') && daySet.has('thursday') && daySet.has('friday') && daySet.size === 5) {
                dayDisplay = 'MTWTF';
            } else if (daySet.has('monday') && daySet.has('wednesday') && daySet.size === 2) {
                dayDisplay = 'MW';
            } else if (daySet.has('tuesday') && daySet.has('friday') && daySet.size === 2) {
                dayDisplay = 'TF';
            } else {
                // Fallback to individual abbreviations
                const dayAbbrevs = {
                    monday: 'M',
                    tuesday: 'T', 
                    wednesday: 'W',
                    thursday: 'TH',
                    friday: 'F',
                    saturday: 'S',
                    sunday: 'SU'
                };
                dayDisplay = days.map(day => dayAbbrevs[day.toLowerCase()] || day).join('');
            }
            
            let timeRange = '';
            if (startTime && endTime) {
                try {
                    // Simple time formatting for HH:mm format
                    const formatTime = (time) => {
                        if (!time) return null;
                        
                        // Time should now come as HH:mm from backend
                        const timePart = time.match(/(\d{1,2}):(\d{2})/);
                        if (!timePart) return null;
                        
                        const hours = parseInt(timePart[1]);
                        const minutes = parseInt(timePart[2]);
                        
                        // Validate time
                        if (hours < 0 || hours > 23 || minutes < 0 || minutes > 59) {
                            return null;
                        }
                        
                        // Format to 12-hour format
                        const period = hours >= 12 ? 'PM' : 'AM';
                        const displayHours = hours === 0 ? 12 : hours > 12 ? hours - 12 : hours;
                        const displayMinutes = minutes.toString().padStart(2, '0');
                        
                        return `${displayHours}:${displayMinutes} ${period}`;
                    };
                    
                    const formattedStartTime = formatTime(startTime);
                    const formattedEndTime = formatTime(endTime);
                    
                    if (formattedStartTime && formattedEndTime) {
                        timeRange = ` • ${formattedStartTime} - ${formattedEndTime}`;
                    }
                } catch (timeError) {
                    console.warn('Invalid time format:', { startTime, endTime, error: timeError });
                    timeRange = '';
                }
            }

            return `${dayDisplay}${timeRange}`;
        } catch (error) {
            console.warn('Error formatting schedule:', error);
            return 'Invalid schedule';
        }
    };

    const handleSearch = (e) => {
        e.preventDefault();
        router.get(route('teacher.sections.shs'), { search: searchTerm }, {
            preserveState: true,
            replace: true,
        });
    };

    const clearSearch = () => {
        setSearchTerm('');
        router.get(route('teacher.sections.shs'), {}, {
            preserveState: true,
            replace: true,
        });
    };

    return (
        <AuthenticatedLayout
            header={
                <div className="flex items-center gap-2 sm:gap-3">
                    <div className="bg-purple-100 p-1.5 sm:p-2 rounded-lg">
                        <School className="w-5 h-5 sm:w-6 sm:h-6 text-purple-600" />
                    </div>
                    <div>
                        <h2 className="text-xl sm:text-2xl font-bold text-gray-900">SHS Sections</h2>
                        <p className="text-xs sm:text-sm text-gray-600 mt-1">Manage your senior high school section assignments</p>
                    </div>
                </div>
            }
        >
            <Head title="My SHS Sections" />
            
            <div className="p-4 sm:p-6">
                {/* Search Section */}
                <Card className="mb-6 border-0 shadow-sm bg-gradient-to-r from-purple-50 to-pink-50">
                    <CardContent className="pt-6">
                        <form onSubmit={handleSearch} className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                            <div className="relative flex-1 min-w-0">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                                <Input
                                    type="text"
                                    placeholder="Search sections, tracks, or subjects..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="pl-10 w-full"
                                />
                            </div>
                            <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                                <Button type="submit" className="bg-purple-600 hover:bg-purple-700 w-full sm:w-auto">
                                    Search
                                </Button>
                                {filters?.search && (
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={clearSearch}
                                        className="text-gray-600 w-full sm:w-auto"
                                    >
                                        Clear
                                    </Button>
                                )}
                            </div>
                        </form>
                    </CardContent>
                </Card>

                {/* Sections Grid */}
                {sections.data.length > 0 ? (
                    <>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4 sm:gap-6">
                            {sections.data.map((section) => (
                                <Card key={section.id} className="group hover:shadow-2xl transition-all duration-300 border-0 bg-gradient-to-br from-white to-blue-50 hover:from-blue-50 hover:to-indigo-100 relative overflow-hidden transform hover:-translate-y-1">
                                    {/* Animated background decoration */}
                                    <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-blue-200/30 to-indigo-300/30 rounded-bl-full transform translate-x-6 -translate-y-6 group-hover:scale-110 transition-transform duration-300"></div>
                                    
                                    <CardHeader className="pb-3 relative z-10">
                                        <div className="flex flex-col gap-3">
                                            <div className="flex items-start justify-between gap-3">
                                                <div className="flex items-center gap-3 min-w-0 flex-1">
                                                    <div className="flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 p-2 sm:p-3 rounded-lg border border-blue-200 bg-blue-50 hover:bg-blue-100 transition-colors shadow-sm flex-shrink-0">
                                                        <School className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600" />
                                                    </div>
                                                    <div className="min-w-0 flex-1">
                                                        <CardTitle className="text-base sm:text-lg font-bold text-gray-900 group-hover:text-blue-700 transition-colors truncate">
                                                            {section.section_name}
                                                        </CardTitle>
                                                        <CardDescription className="text-blue-600 font-medium text-xs sm:text-sm truncate">
                                                            {section.program.program_name}
                                                        </CardDescription>
                                                    </div>
                                                </div>
                                                <Badge variant="secondary" className="bg-blue-100 text-blue-800 border-blue-200 text-xs font-semibold flex-shrink-0">
                                                    Grade {section.year_level}
                                                </Badge>
                                            </div>
                                        </div>
                                    </CardHeader>

                                    {/* Content */}
                                    <CardContent className="space-y-4 relative z-10">
                                        {/* Subject Info */}
                                        {section.teacher_subjects && section.teacher_subjects.length > 0 && (
                                            <div className="space-y-2">
                                                {section.teacher_subjects.map((teacherSubject, index) => (
                                                    <div key={teacherSubject.id} className="bg-gradient-to-r from-gray-50 to-blue-50 p-2 sm:p-3 rounded-xl border border-blue-100">
                                                        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2 sm:gap-3">
                                                            <div className="flex-1 min-w-0">
                                                                <div className="flex items-center gap-2 mb-2">
                                                                    <div className="flex items-center justify-center w-6 h-6 sm:w-7 sm:h-7 p-0.5 rounded-md border border-blue-200 bg-blue-50 shadow-sm flex-shrink-0">
                                                                        <BookOpen className="w-3 h-3 text-blue-600" />
                                                                    </div>
                                                                    <span className="font-semibold text-blue-700 text-xs sm:text-sm truncate">
                                                                        {teacherSubject.subject.subject_code}
                                                                    </span>
                                                                </div>
                                                                <p className="text-xs sm:text-sm text-gray-800 font-medium leading-tight mb-2 line-clamp-2">
                                                                    {teacherSubject.subject.subject_name}
                                                                </p>
                                                                {/* Schedule */}
                                                                {(teacherSubject.schedule_days || teacherSubject.start_time) && (
                                                                    <div className="px-2 py-1 bg-gray-100 rounded-md">
                                                                        <p className="text-xs text-gray-600 font-medium truncate">
                                                                            {formatSchedule(
                                                                                teacherSubject.schedule_days,
                                                                                teacherSubject.start_time,
                                                                                teacherSubject.end_time
                                                                            )}
                                                                        </p>
                                                                        {teacherSubject.room && (
                                                                            <p className="text-xs text-gray-500 mt-0.5 truncate">
                                                                                Room: {teacherSubject.room}
                                                                            </p>
                                                                        )}
                                                                    </div>
                                                                )}
                                                            </div>
                                                            <div className="flex flex-row sm:flex-col gap-1 flex-shrink-0">
                                                                <Link
                                                                    href={route('teacher.grades.show', teacherSubject.id)}
                                                                    className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors font-medium text-center min-w-[50px]"
                                                                >
                                                                    Grades
                                                                </Link>
                                                                <Link
                                                                    href={route('teacher.materials.index', teacherSubject.id)}
                                                                    className="text-xs px-2 py-1 bg-green-100 text-green-700 rounded hover:bg-green-200 transition-colors font-medium text-center min-w-[50px]"
                                                                >
                                                                    Materials
                                                                </Link>
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}

                                        {/* Stats */}
                                        <div className="grid grid-cols-2 gap-3">
                                            <div className="text-center p-3 bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl border border-blue-200">
                                                <div className="flex items-center justify-center gap-1 mb-1">
                                                    <Users className="w-3 h-3 text-blue-600" />
                                                    <span className="text-xs text-blue-600 font-semibold">Students</span>
                                                </div>
                                                <p className="text-xl font-bold text-blue-700">{section.enrolled_count}</p>
                                            </div>
                                            <div className="text-center p-3 bg-gradient-to-br from-green-50 to-emerald-100 rounded-xl border border-green-200">
                                                <div className="flex items-center justify-center gap-1 mb-1">
                                                    <Calendar className="w-3 h-3 text-green-600" />
                                                    <span className="text-xs text-green-600 font-semibold">Semester</span>
                                                </div>
                                                <p className="text-sm font-bold text-green-700">{section.semester}</p>
                                            </div>
                                        </div>

                                        {/* Academic Year */}
                                        <div className="text-center py-3 bg-gradient-to-r from-gray-100 to-gray-200 rounded-xl">
                                            <p className="text-sm text-gray-700 font-semibold">{section.academic_year}</p>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>

                        {/* Pagination */}
                        {sections.links && sections.links.length > 3 && (
                            <Card className="p-4 mt-6">
                                <div className="flex justify-center">
                                    <nav className="flex items-center space-x-2">
                                        {sections.links.map((link, index) => {
                                            if (link.url) {
                                                return (
                                                    <Button
                                                        key={index}
                                                        asChild
                                                        variant={link.active ? "default" : "outline"}
                                                        size="sm"
                                                        className={link.active 
                                                            ? "bg-purple-600 hover:bg-purple-700 text-white" 
                                                            : "border-gray-300 hover:border-purple-300 text-gray-700"
                                                        }
                                                    >
                                                        <Link href={link.url}>
                                                            <span dangerouslySetInnerHTML={{ __html: link.label }} />
                                                        </Link>
                                                    </Button>
                                                );
                                            } else {
                                                return (
                                                    <Button
                                                        key={index}
                                                        variant="outline"
                                                        size="sm"
                                                        disabled
                                                        className="border-gray-200 text-gray-400"
                                                    >
                                                        <span dangerouslySetInnerHTML={{ __html: link.label }} />
                                                    </Button>
                                                );
                                            }
                                        })}
                                    </nav>
                                </div>
                            </Card>
                        )}
                    </>
                ) : (
                    <Card className="p-8 text-center">
                        <div className="flex flex-col items-center gap-4">
                            <div className="bg-gray-100 p-4 rounded-full">
                                <School className="w-8 h-8 text-gray-400" />
                            </div>
                            <div>
                                <h3 className="text-lg font-medium text-gray-900 mb-2">
                                    {filters?.search ? 'No sections found' : 'No SHS sections assigned'}
                                </h3>
                                <p className="text-gray-500">
                                    {filters?.search 
                                        ? `No sections match "${filters.search}". Try a different search term.`
                                        : 'You are not currently assigned to any SHS sections.'
                                    }
                                </p>
                                {filters?.search && (
                                    <Button 
                                        className="mt-4" 
                                        variant="outline" 
                                        onClick={clearSearch}
                                    >
                                        Clear Search
                                    </Button>
                                )}
                            </div>
                        </div>
                    </Card>
                )}
            </div>
        </AuthenticatedLayout>
    );
}