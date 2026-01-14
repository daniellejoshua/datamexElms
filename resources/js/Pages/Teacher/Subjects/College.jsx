import React, { useState } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { 
    BookOpen, 
    Users, 
    Calendar, 
    Clock,
    MapPin,
    Search,
    FileText,
    BarChart3,
    ChevronRight,
    GraduationCap,
    Building
} from 'lucide-react';

export default function CollegeSubjects({ subjects, filters }) {
    const [searchTerm, setSearchTerm] = useState(filters?.search || '');

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

    const formatSchedule = (scheduleDays, startTime, endTime) => {
        if (!scheduleDays || scheduleDays.length === 0) return 'No schedule set';
        
        const days = Array.isArray(scheduleDays) ? scheduleDays : JSON.parse(scheduleDays || '[]');
        const dayAbbrevs = {
            monday: 'Mon',
            tuesday: 'Tue', 
            wednesday: 'Wed',
            thursday: 'Thu',
            friday: 'Fri',
            saturday: 'Sat',
            sunday: 'Sun'
        };

        const formattedDays = days.map(day => dayAbbrevs[day.toLowerCase()] || day).join(', ');
        const timeRange = startTime && endTime ? 
            `${new Date('1970-01-01T' + startTime).toLocaleTimeString('en-US', { 
                hour: 'numeric', 
                minute: '2-digit',
                hour12: true 
            })} - ${new Date('1970-01-01T' + endTime).toLocaleTimeString('en-US', { 
                hour: 'numeric', 
                minute: '2-digit',
                hour12: true 
            })}` : '';

        return `${formattedDays}${timeRange ? ` • ${timeRange}` : ''}`;
    };

    return (
        <AuthenticatedLayout
            header={
                <div className="flex items-center gap-3">
                    <div className="bg-blue-100 p-2 rounded-lg">
                        <BookOpen className="w-6 h-6 text-blue-600" />
                    </div>
                    <div>
                        <h2 className="text-2xl font-bold text-gray-900">My College Subjects</h2>
                        <p className="text-sm text-gray-600 mt-1">Manage grades and students for your college subjects</p>
                    </div>
                </div>
            }
        >
            <Head title="My College Subjects" />

            <div className="space-y-6">
                {/* Search and Filters */}
                <div className="bg-white rounded-lg border border-gray-200 p-6">
                    <form onSubmit={handleSearch} className="flex gap-4">
                        <div className="flex-1 relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                            <Input
                                type="text"
                                placeholder="Search subjects, sections, or programs..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-10"
                            />
                        </div>
                        <Button type="submit" variant="outline">
                            Search
                        </Button>
                        {filters?.search && (
                            <Button type="button" variant="ghost" onClick={clearSearch}>
                                Clear
                            </Button>
                        )}
                    </form>
                </div>

                {/* Subjects Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {subjects.data && subjects.data.length > 0 ? (
                        subjects.data.map((subject) => (
                            <Card key={subject.id} className="hover:shadow-lg transition-shadow duration-200 border border-gray-200">
                                <CardHeader className="pb-4">
                                    <div className="flex items-start justify-between">
                                        <div className="flex-1 min-w-0">
                                            <CardTitle className="text-lg font-semibold text-gray-900 mb-2 truncate">
                                                {subject.subject?.subject_name || 'Unknown Subject'}
                                            </CardTitle>
                                            <CardDescription className="text-sm text-gray-600 mb-3">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <BookOpen className="w-4 h-4 text-blue-500" />
                                                    <span className="font-medium">{subject.subject?.subject_code || 'N/A'}</span>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <Building className="w-4 h-4 text-gray-500" />
                                                    <span>{subject.section_name}</span>
                                                </div>
                                            </CardDescription>
                                            
                                            {/* Academic Period */}
                                            <div className="flex items-center gap-2 mb-3">
                                                <Badge variant="outline" className="text-xs">
                                                    {subject.academic_year}
                                                </Badge>
                                                <Badge variant="outline" className="text-xs">
                                                    {subject.semester} Semester
                                                </Badge>
                                            </div>
                                        </div>
                                        
                                        {/* Student Count */}
                                        <div className="ml-4 text-right">
                                            <div className="flex items-center gap-1 text-sm text-gray-600">
                                                <Users className="w-4 h-4" />
                                                <span className="font-medium">{subject.enrolled_count}</span>
                                            </div>
                                            <span className="text-xs text-gray-500">students</span>
                                        </div>
                                    </div>
                                </CardHeader>

                                <CardContent className="pt-0">
                                    {/* Schedule and Room */}
                                    <div className="space-y-2 mb-4">
                                        <div className="flex items-center gap-2 text-sm text-gray-600">
                                            <Calendar className="w-4 h-4 text-green-500" />
                                            <span>{formatSchedule(subject.schedule_days, subject.start_time, subject.end_time)}</span>
                                        </div>
                                        {subject.room && (
                                            <div className="flex items-center gap-2 text-sm text-gray-600">
                                                <MapPin className="w-4 h-4 text-red-500" />
                                                <span>Room {subject.room}</span>
                                            </div>
                                        )}
                                    </div>

                                    {/* Action Buttons */}
                                    <div className="flex gap-2">
                                        <Link
                                            href={route('teacher.grades.show', subject.id)}
                                            className="flex-1"
                                        >
                                            <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white">
                                                <BarChart3 className="w-4 h-4 mr-2" />
                                                Manage Grades
                                            </Button>
                                        </Link>
                                        <Link
                                            href={route('teacher.materials.index', subject.section.id)}
                                        >
                                            <Button variant="outline" size="sm">
                                                <FileText className="w-4 h-4" />
                                            </Button>
                                        </Link>
                                    </div>
                                </CardContent>
                            </Card>
                        ))
                    ) : (
                        <div className="col-span-full">
                            <Card>
                                <CardContent className="text-center py-12">
                                    <BookOpen className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                                        {filters?.search ? 'No subjects found' : 'No subjects assigned'}
                                    </h3>
                                    <p className="text-gray-600 mb-4">
                                        {filters?.search 
                                            ? 'Try adjusting your search criteria.'
                                            : 'You are not currently assigned to any college subjects.'
                                        }
                                    </p>
                                    {filters?.search && (
                                        <Button variant="outline" onClick={clearSearch}>
                                            Clear Search
                                        </Button>
                                    )}
                                </CardContent>
                            </Card>
                        </div>
                    )}
                </div>

                {/* Pagination */}
                {subjects.data && subjects.data.length > 0 && (
                    <div className="bg-white rounded-lg border border-gray-200 p-4">
                        <div className="flex items-center justify-between">
                            <div className="text-sm text-gray-600">
                                Showing {subjects.from || 0} to {subjects.to || 0} of {subjects.total || 0} subjects
                            </div>
                            
                            {(subjects.prev_page_url || subjects.next_page_url) && (
                                <div className="flex gap-2">
                                    {subjects.prev_page_url && (
                                        <Link href={subjects.prev_page_url} preserveState>
                                            <Button variant="outline" size="sm">
                                                Previous
                                            </Button>
                                        </Link>
                                    )}
                                    {subjects.next_page_url && (
                                        <Link href={subjects.next_page_url} preserveState>
                                            <Button variant="outline" size="sm">
                                                Next
                                            </Button>
                                        </Link>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </AuthenticatedLayout>
    );
}