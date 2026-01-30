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
    ChevronDown,
    ChevronUp,
    Clock,
    MapPin,
    Layers
} from 'lucide-react';

export default function CollegeSections({ sections, filters }) {
    const [searchTerm, setSearchTerm] = useState(filters?.search || '');
    const [expandedSection, setExpandedSection] = useState(null);

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
        router.get(route('teacher.sections.college'), { search: searchTerm }, {
            preserveState: false,
            replace: false,
            only: ['sections']
        });
    };

    const clearSearch = () => {
        setSearchTerm('');
        router.get(route('teacher.sections.college'), {}, {
            preserveState: false,
            replace: false,
            only: ['sections']
        });
    };

    return (
        <AuthenticatedLayout
            header={
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div className="bg-blue-100 p-1.5 rounded-md">
                            <GraduationCap className="w-4 h-4 text-blue-600" />
                        </div>
                        <div>
                            <h2 className="text-lg font-semibold text-gray-900">College Sections</h2>
                            <p className="text-xs text-gray-500 mt-0.5">View and manage your assigned sections</p>
                        </div>
                    </div>
                </div>
            }
        >
            <Head title="My College Sections" />
            
            <div className="p-4 sm:p-6">
                {/* Search Section */}
                <Card className="mb-6 border-0 shadow-sm bg-gradient-to-r from-blue-50 to-indigo-50">
                    <CardContent className="pt-6">
                        <form onSubmit={handleSearch} className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                            <div className="relative flex-1 min-w-0">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                                <Input
                                    type="text"
                                    placeholder="Search sections or programs..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="pl-10 w-full"
                                />
                            </div>
                            <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                                <Button type="submit" className="bg-blue-600 hover:bg-blue-700 w-full sm:w-auto">
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

                {/* Sections List */}
                {sections.data && sections.data.length > 0 ? (
                    <>
                        <div className="space-y-4">
                            {sections.data.map((section) => (
                                <Card key={section.id} className="group hover:shadow-lg transition-all duration-200 border border-gray-200 overflow-hidden">
                                    <div 
                                        className="cursor-pointer" 
                                        onClick={() => setExpandedSection(expandedSection === section.id ? null : section.id)}
                                    >
                                        <CardHeader className="pb-4 bg-gradient-to-r from-blue-50 to-indigo-50">
                                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                                <div className="flex items-center space-x-3 sm:space-x-4 flex-1 min-w-0">
                                                    <div className="flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 p-2 sm:p-3 rounded-lg border border-blue-200 bg-blue-50 hover:bg-blue-100 transition-colors shadow-sm flex-shrink-0">
                                                        <School className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600" />
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <CardTitle className="text-lg sm:text-xl font-bold text-gray-900 truncate">
                                                            {section.program?.program_code}-{section.year_level}{section.section_name}
                                                        </CardTitle>
                                                        <CardDescription className="text-blue-700 font-medium text-sm mt-1">
                                                            {section.program?.program_name || 'N/A'}
                                                        </CardDescription>
                                                        <div className="flex flex-wrap items-center gap-2 sm:gap-4 mt-3">
                                                            <Badge variant="secondary" className="bg-blue-100 text-blue-700 border-blue-300 text-xs">
                                                                <Users className="w-3 h-3 mr-1" />
                                                                {section.enrolled_count || 0} Students
                                                            </Badge>
                                                            <Badge variant="secondary" className="bg-green-100 text-green-700 border-green-300 text-xs">
                                                                <Layers className="w-3 h-3 mr-1" />
                                                                {section.teacher_subjects?.length || 0} Subjects
                                                            </Badge>
                                                            <Badge variant="outline" className="text-gray-600 border-gray-300 text-xs">
                                                                <Calendar className="w-3 h-3 mr-1" />
                                                                {section.semester} Sem • {section.academic_year}
                                                            </Badge>
                                                        </div>
                                                    </div>
                                                </div>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className="self-start sm:self-center flex-shrink-0"
                                                >
                                                    {expandedSection === section.id ? (
                                                        <ChevronUp className="w-5 h-5 text-gray-600" />
                                                    ) : (
                                                        <ChevronDown className="w-5 h-5 text-gray-600" />
                                                    )}
                                                </Button>
                                            </div>
                                        </CardHeader>
                                    </div>
                                    
                                    {expandedSection === section.id && (
                                        <CardContent className="pt-6 pb-4 bg-white">
                                            <div className="mb-4">
                                                <h3 className="text-sm font-semibold text-gray-700 mb-4 flex items-center">
                                                    <BookOpen className="w-4 h-4 mr-2 text-blue-600" />
                                                    Assigned Subjects ({section.teacher_subjects?.length || 0})
                                                </h3>
                                                <div className="space-y-3">
                                                    {section.teacher_subjects && section.teacher_subjects.length > 0 ? (
                                                        section.teacher_subjects.map((teacherSubject) => (
                                                            <div key={teacherSubject.id} className="bg-gradient-to-r from-gray-50 to-blue-50 border border-blue-200 rounded-lg p-3 sm:p-4 hover:shadow-md transition-shadow">
                                                                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 sm:gap-4">
                                                                    <div className="flex-1 min-w-0">
                                                                        <div className="flex items-center gap-2 mb-2">
                                                                            <div className="bg-blue-600 p-1.5 rounded flex-shrink-0">
                                                                                <BookOpen className="w-3.5 h-3.5 text-white" />
                                                                            </div>
                                                                            <span className="font-bold text-blue-700 text-sm truncate">
                                                                                {teacherSubject.subject.subject_code}
                                                                            </span>
                                                                        </div>
                                                                        <p className="text-sm font-medium text-gray-800 mb-3 line-clamp-2">
                                                                            {teacherSubject.subject.subject_name}
                                                                        </p>
                                                                        <div className="space-y-1.5">
                                                                            {teacherSubject.schedule_days && (
                                                                                <div className="flex items-center text-xs text-gray-600">
                                                                                    <Clock className="w-3.5 h-3.5 mr-1.5 text-blue-600 flex-shrink-0" />
                                                                                    <span className="truncate">
                                                                                        {formatSchedule(
                                                                                            teacherSubject.schedule_days, 
                                                                                            teacherSubject.start_time, 
                                                                                            teacherSubject.end_time
                                                                                        )}
                                                                                    </span>
                                                                                </div>
                                                                            )}
                                                                            {teacherSubject.room && (
                                                                                <div className="flex items-center text-xs text-gray-600">
                                                                                    <MapPin className="w-3.5 h-3.5 mr-1.5 text-blue-600 flex-shrink-0" />
                                                                                    <span className="truncate">Room {teacherSubject.room}</span>
                                                                                </div>
                                                                            )}
                                                                        </div>
                                                                    </div>
                                                                    <div className="flex flex-col sm:flex-row gap-2 flex-shrink-0 w-full sm:w-auto">
                                                                        <Link href={route('teacher.grades.show', teacherSubject.id)} className="w-full sm:w-auto">
                                                                            <Button size="sm" className="bg-blue-600 hover:bg-blue-700 text-white w-full">
                                                                                <BarChart3 className="w-3.5 h-3.5 mr-1.5" />
                                                                                Manage Grades
                                                                            </Button>
                                                                        </Link>
                                                                        <Link href={route('teacher.materials.index', teacherSubject.id)} className="w-full sm:w-auto">
                                                                            <Button size="sm" variant="outline" className="border-green-300 text-green-700 hover:bg-green-50 w-full">
                                                                                <FileText className="w-3.5 h-3.5 mr-1.5" />
                                                                                Materials
                                                                            </Button>
                                                                        </Link>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        ))
                                                    ) : (
                                                        <p className="text-sm text-gray-500 text-center py-8 bg-gray-50 rounded-lg">
                                                            No subjects assigned to this section
                                                        </p>
                                                    )}
                                                </div>
                                            </div>
                                        </CardContent>
                                    )}
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
                                                            ? "bg-blue-600 hover:bg-blue-700 text-white" 
                                                            : "border-gray-300 hover:border-blue-300 text-gray-700"
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
                                    {filters?.search ? 'No sections found' : 'No college sections assigned'}
                                </h3>
                                <p className="text-gray-500">
                                    {filters?.search 
                                        ? `No sections match "${filters.search}". Try a different search term.`
                                        : 'You are not currently assigned to any college sections.'
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
