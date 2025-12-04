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
    Upload,
    Clock,
    MapPin
} from 'lucide-react';

export default function CollegeSections({ sections, filters }) {
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
        router.get(route('teacher.sections.college'), { search: searchTerm }, {
            preserveState: true,
            replace: true,
        });
    };

    const clearSearch = () => {
        setSearchTerm('');
        router.get(route('teacher.sections.college'), {}, {
            preserveState: true,
            replace: true,
        });
    };

    return (
        <AuthenticatedLayout
            header={
                <div className="flex items-center gap-3">
                    <div className="bg-blue-100 p-2 rounded-lg">
                        <GraduationCap className="w-6 h-6 text-blue-600" />
                    </div>
                    <div>
                        <h2 className="text-2xl font-bold text-gray-900">College Sections</h2>
                        <p className="text-sm text-gray-600 mt-1">Manage your college section assignments</p>
                    </div>
                </div>
            }
        >
            <Head title="My College Sections" />
            
            <div className="p-6">
                {/* Search Section */}
                <Card className="mb-6 border-0 shadow-sm bg-gradient-to-r from-blue-50 to-indigo-50">
                    <CardContent className="pt-6">
                        <form onSubmit={handleSearch} className="flex items-center gap-3">
                            <div className="relative flex-1">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                                <Input
                                    type="text"
                                    placeholder="Search sections, programs, or subjects..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="pl-10"
                                />
                            </div>
                            <Button type="submit" className="bg-blue-600 hover:bg-blue-700">
                                Search
                            </Button>
                            {filters?.search && (
                                <Button 
                                    type="button" 
                                    variant="outline" 
                                    onClick={clearSearch}
                                    className="text-gray-600"
                                >
                                    Clear
                                </Button>
                            )}
                        </form>
                    </CardContent>
                </Card>

                {/* Sections Grid */}
                {sections.data && sections.data.length > 0 ? (
                    <>
                        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                            {sections.data.map((section) => (
                                <Card key={section.id} className="group hover:shadow-xl transition-all duration-300 border-2 hover:border-blue-300 relative overflow-hidden">
                                    {/* Status Badge */}
                                    <div className="absolute top-4 right-4">
                                        <Badge className="bg-white text-green-600 border-green-600 shadow-md font-semibold">
                                            active
                                        </Badge>
                                    </div>

                                    <CardHeader className="pb-4">
                                        <div className="flex items-start space-x-3">
                                            <div className="p-3 bg-blue-600 rounded-xl flex-shrink-0 shadow-md group-hover:scale-110 transition-transform duration-300">
                                                <School className="w-6 h-6 text-white" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <CardTitle className="text-lg font-bold text-gray-900 truncate group-hover:text-blue-700 transition-colors">
                                                    {section.program?.program_code}-{section.year_level}{section.section_name}
                                                </CardTitle>
                                                <CardDescription className="text-blue-600 font-semibold truncate">
                                                    {section.program?.program_name || 'N/A'}
                                                </CardDescription>
                                            </div>
                                        </div>
                                    </CardHeader>
                                    
                                    <CardContent className="space-y-6">
                                        {/* Subject Info */}
                                        {section.teacher_subject?.subject && (
                                            <Card className="p-3 bg-gradient-to-r from-orange-50 to-yellow-50 border border-orange-200">
                                                <div className="flex items-center text-sm">
                                                    <BookOpen className="w-4 h-4 text-orange-600 mr-3 flex-shrink-0" />
                                                    <div className="flex-1">
                                                        <span className="font-medium text-orange-600 block">
                                                            {section.teacher_subject.subject.subject_code}
                                                        </span>
                                                        <span className="text-xs text-gray-600 truncate">
                                                            {section.teacher_subject.subject.subject_name}
                                                        </span>
                                                    </div>
                                                </div>
                                            </Card>
                                        )}

                                        {/* Section Details */}
                                        <div className="space-y-4">
                                            <Card className="p-3 bg-gradient-to-r from-green-50 to-blue-50 border border-green-200">
                                                <div className="flex items-center text-sm">
                                                    <GraduationCap className="w-4 h-4 text-green-600 mr-3 flex-shrink-0" />
                                                    <span className="text-gray-700 font-medium truncate">
                                                        Year {section.year_level} - Section {section.section_name}
                                                    </span>
                                                </div>
                                            </Card>
                                            
                                            <div className="grid grid-cols-2 gap-2">
                                                <Card className="p-2 text-center bg-blue-50 border-blue-200">
                                                    <div className="flex flex-col items-center">
                                                        <Users className="w-4 h-4 text-blue-600 mb-1" />
                                                        <span className="text-xs font-semibold text-gray-700">
                                                            {section.enrolled_count || 0}
                                                        </span>
                                                        <span className="text-xs text-gray-600">Students</span>
                                                    </div>
                                                </Card>
                                                
                                                <Card className="p-2 text-center bg-green-50 border-green-200">
                                                    <div className="flex flex-col items-center">
                                                        <Calendar className="w-4 h-4 text-green-600 mb-1" />
                                                        <span className="text-xs font-semibold text-gray-700">
                                                            {section.semester}
                                                        </span>
                                                        <span className="text-xs text-gray-600">Semester</span>
                                                    </div>
                                                </Card>
                                            </div>
                                            
                                            <Card className="p-3 bg-blue-50 border-blue-200">
                                                <div className="flex items-center text-sm">
                                                    <Calendar className="w-4 h-4 text-blue-600 mr-3 flex-shrink-0" />
                                                    <span className="text-gray-700 font-medium truncate">
                                                        {section.academic_year}
                                                    </span>
                                                </div>
                                            </Card>
                                            
                                            {/* Schedule Information */}
                                            {section.teacher_subject && (
                                                <Card className="p-3 bg-emerald-50 border-emerald-200">
                                                    <div className="flex items-center text-sm">
                                                        <Clock className="w-61 h-4 text-emerald-600 mr-3 flex-shrink-0" />
                                                        <span className="text-gray-700 font-medium truncate">
                                                            {formatSchedule(
                                                                section.teacher_subject.schedule_days, 
                                                                section.teacher_subject.start_time, 
                                                                section.teacher_subject.end_time
                                                            )}
                                                        </span>
                                                    </div>
                                                </Card>
                                            )}
                                            
                                            {/* Room Information */}
                                            {section.teacher_subject?.room && (
                                                <Card className="p-3 bg-purple-50 border-purple-200">
                                                    <div className="flex items-center text-sm">
                                                        <MapPin className="w-4 h-4 text-purple-600 mr-3 flex-shrink-0" />
                                                        <span className="text-gray-700 font-medium truncate">
                                                            Room {section.teacher_subject.room}
                                                        </span>
                                                    </div>
                                                </Card>
                                            )}
                                        </div>
                                        
                                        {/* Action Buttons */}
                                        <div className="grid grid-cols-2 gap-2">
                                            <Button asChild variant="outline" className="border-2 border-blue-300 text-blue-700 hover:bg-blue-50 font-medium">
                                                <Link href={route('teacher.materials.index', section.id)}>
                                                    <Upload className="w-3 h-3 mr-1" />
                                                    Materials
                                                </Link>
                                            </Button>
                                            
                                            <Button asChild className="bg-blue-600 hover:bg-blue-700 text-white shadow-md">
                                                <Link href={route('teacher.grades.show', section.id)}>
                                                    <BarChart3 className="w-3 h-3 mr-1" />
                                                    Grades
                                                </Link>
                                            </Button>
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