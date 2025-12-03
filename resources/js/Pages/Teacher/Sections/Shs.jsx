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
                <div className="flex items-center gap-3">
                    <div className="bg-purple-100 p-2 rounded-lg">
                        <School className="w-6 h-6 text-purple-600" />
                    </div>
                    <div>
                        <h2 className="text-2xl font-bold text-gray-900">SHS Sections</h2>
                        <p className="text-sm text-gray-600 mt-1">Manage your senior high school section assignments</p>
                    </div>
                </div>
            }
        >
            <Head title="My SHS Sections" />
            
            <div className="p-6">
                {/* Search Section */}
                <Card className="mb-6 border-0 shadow-sm bg-gradient-to-r from-purple-50 to-pink-50">
                    <CardContent className="pt-6">
                        <form onSubmit={handleSearch} className="flex items-center gap-3">
                            <div className="relative flex-1">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                                <Input
                                    type="text"
                                    placeholder="Search sections, tracks, or subjects..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="pl-10"
                                />
                            </div>
                            <Button type="submit" className="bg-purple-600 hover:bg-purple-700">
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
                {sections.data.length > 0 ? (
                    <>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                            {sections.data.map((section) => (
                                <Card key={section.id} className="group hover:shadow-2xl transition-all duration-300 border-0 bg-gradient-to-br from-white to-blue-50 hover:from-blue-50 hover:to-indigo-100 relative overflow-hidden transform hover:-translate-y-1">
                                    {/* Animated background decoration */}
                                    <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-blue-200/30 to-indigo-300/30 rounded-bl-full transform translate-x-6 -translate-y-6 group-hover:scale-110 transition-transform duration-300"></div>
                                    
                                    {/* Header */}
                                    <CardHeader className="pb-3 relative z-10">
                                        <div className="flex items-start justify-between">
                                            <div className="flex items-center gap-3">
                                                <div className="bg-gradient-to-br from-blue-500 to-blue-600 p-2.5 rounded-xl shadow-md group-hover:shadow-lg transition-shadow">
                                                    <School className="w-5 h-5 text-white" />
                                                </div>
                                                <div>
                                                    <CardTitle className="text-lg font-bold text-gray-900 group-hover:text-blue-700 transition-colors">
                                                        {section.section_name}
                                                    </CardTitle>
                                                    <CardDescription className="text-blue-600 font-medium text-sm">
                                                        {section.program.program_name}
                                                    </CardDescription>
                                                </div>
                                            </div>
                                            <Badge variant="secondary" className="bg-blue-100 text-blue-800 border-blue-200 text-xs font-semibold">
                                                Grade {section.year_level}
                                            </Badge>
                                        </div>
                                    </CardHeader>

                                    {/* Content */}
                                    <CardContent className="space-y-4 relative z-10">
                                        {/* Subject Info */}
                                        <div className="bg-gradient-to-r from-gray-50 to-blue-50 p-3 rounded-xl border border-blue-100">
                                            <div className="flex items-center gap-2 mb-2">
                                                <div className="bg-blue-500 p-1 rounded-md">
                                                    <BookOpen className="w-3 h-3 text-white" />
                                                </div>
                                                <span className="font-semibold text-blue-700 text-sm">
                                                    {section.teacher_subject?.subject?.subject_code}
                                                </span>
                                            </div>
                                            <p className="text-sm text-gray-800 font-medium leading-tight">
                                                {section.teacher_subject?.subject?.subject_name}
                                            </p>
                                        </div>

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

                                        {/* Action Buttons */}
                                        <div className="grid grid-cols-2 gap-3 pt-2">
                                            <Button
                                                asChild
                                                size="sm"
                                                variant="outline"
                                                className="text-blue-600 border-blue-300 hover:bg-blue-50 hover:border-blue-400 transition-all duration-200 font-semibold"
                                            >
                                                <Link href={route('teacher.materials.index', section.id)}>
                                                    <Upload className="w-3 h-3 mr-1" />
                                                    Materials
                                                </Link>
                                            </Button>
                                            <Button
                                                asChild
                                                size="sm"
                                                className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white shadow-md hover:shadow-lg transition-all duration-200 font-semibold"
                                            >
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