import React from 'react';
import { Head, Link } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { GraduationCap, School, BookOpen, Users, ChevronRight, Building2 } from 'lucide-react';

const Index = () => {
    return (
        <AuthenticatedLayout
            header={
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="bg-indigo-100 p-2 rounded-lg">
                            <Building2 className="w-6 h-6 text-indigo-600" />
                        </div>
                        <div>
                            <h2 className="text-2xl font-bold text-gray-900">Section Management</h2>
                            <p className="text-sm text-gray-600 mt-1">Choose the type of sections you want to manage</p>
                        </div>
                    </div>
                </div>
            }
        >
            <Head title="Section Management" />

            <div className="max-w-6xl mx-auto p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* College Sections Card */}
                    <Card className="group hover:shadow-xl transition-all duration-300 border-2 hover:border-blue-200 bg-gradient-to-br from-white to-blue-50/30">
                        <CardHeader className="pb-4">
                            <div className="flex items-center justify-between">
                                <div className="bg-blue-100 p-3 rounded-xl group-hover:bg-blue-200 transition-colors">
                                    <GraduationCap className="w-8 h-8 text-blue-600" />
                                </div>
                                <div className="text-right">
                                    <div className="text-sm text-blue-600 font-medium">Higher Education</div>
                                    <div className="text-xs text-gray-500">Years 1-4</div>
                                </div>
                            </div>
                            <CardTitle className="text-2xl font-bold text-gray-900 mt-4">
                                College Sections
                            </CardTitle>
                            <CardDescription className="text-gray-600 leading-relaxed">
                                Manage undergraduate and graduate program sections, including specialized courses and major-specific classes.
                            </CardDescription>
                        </CardHeader>
                        
                        <CardContent className="space-y-6">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="bg-white/60 p-3 rounded-lg border border-blue-100">
                                    <div className="flex items-center gap-2">
                                        <BookOpen className="w-4 h-4 text-blue-600" />
                                        <span className="text-sm font-medium text-gray-700">Programs</span>
                                    </div>
                                    <div className="text-xs text-gray-500 mt-1">Bachelor's & Master's</div>
                                </div>
                                <div className="bg-white/60 p-3 rounded-lg border border-blue-100">
                                    <div className="flex items-center gap-2">
                                        <Users className="w-4 h-4 text-blue-600" />
                                        <span className="text-sm font-medium text-gray-700">Students</span>
                                    </div>
                                    <div className="text-xs text-gray-500 mt-1">University Level</div>
                                </div>
                            </div>

                            <div className="pt-2 border-t border-blue-100">
                                <div className="flex flex-col sm:flex-row gap-3">
                                    <Link href="/admin/college/sections" className="flex-1">
                                        <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white border-0 shadow-md hover:shadow-lg transition-all duration-200">
                                            <GraduationCap className="w-4 h-4 mr-2" />
                                            Manage College Sections
                                            <ChevronRight className="w-4 h-4 ml-2" />
                                        </Button>
                                    </Link>
                                </div>
                                <div className="flex justify-center gap-4 mt-3 pt-3 border-t border-blue-100">
                                    <Link href="/admin/college/sections/create" className="text-sm text-blue-600 hover:text-blue-800 font-medium hover:underline">
                                        Quick Add Section
                                    </Link>
                                    <Link href="/admin/college/sections" className="text-sm text-blue-600 hover:text-blue-800 font-medium hover:underline">
                                        View All Sections
                                    </Link>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* SHS Sections Card */}
                    <Card className="group hover:shadow-xl transition-all duration-300 border-2 hover:border-purple-200 bg-gradient-to-br from-white to-purple-50/30">
                        <CardHeader className="pb-4">
                            <div className="flex items-center justify-between">
                                <div className="bg-purple-100 p-3 rounded-xl group-hover:bg-purple-200 transition-colors">
                                    <School className="w-8 h-8 text-purple-600" />
                                </div>
                                <div className="text-right">
                                    <div className="text-sm text-purple-600 font-medium">Senior High School</div>
                                    <div className="text-xs text-gray-500">Grades 11-12</div>
                                </div>
                            </div>
                            <CardTitle className="text-2xl font-bold text-gray-900 mt-4">
                                SHS Sections
                            </CardTitle>
                            <CardDescription className="text-gray-600 leading-relaxed">
                                Manage senior high school sections across different tracks and strands, preparing students for their chosen career paths.
                            </CardDescription>
                        </CardHeader>
                        
                        <CardContent className="space-y-6">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="bg-white/60 p-3 rounded-lg border border-purple-100">
                                    <div className="flex items-center gap-2">
                                        <BookOpen className="w-4 h-4 text-purple-600" />
                                        <span className="text-sm font-medium text-gray-700">Tracks</span>
                                    </div>
                                    <div className="text-xs text-gray-500 mt-1">Academic & Technical</div>
                                </div>
                                <div className="bg-white/60 p-3 rounded-lg border border-purple-100">
                                    <div className="flex items-center gap-2">
                                        <Users className="w-4 h-4 text-purple-600" />
                                        <span className="text-sm font-medium text-gray-700">Students</span>
                                    </div>
                                    <div className="text-xs text-gray-500 mt-1">Senior High Level</div>
                                </div>
                            </div>

                            <div className="pt-2 border-t border-purple-100">
                                <div className="flex flex-col sm:flex-row gap-3">
                                    <Link href="/admin/shs/sections" className="flex-1">
                                        <Button className="w-full bg-purple-600 hover:bg-purple-700 text-white border-0 shadow-md hover:shadow-lg transition-all duration-200">
                                            <School className="w-4 h-4 mr-2" />
                                            Manage SHS Sections
                                            <ChevronRight className="w-4 h-4 ml-2" />
                                        </Button>
                                    </Link>
                                </div>
                                <div className="flex justify-center gap-4 mt-3 pt-3 border-t border-purple-100">
                                    <Link href="/admin/shs/sections/create" className="text-sm text-purple-600 hover:text-purple-800 font-medium hover:underline">
                                        Quick Add Section
                                    </Link>
                                    <Link href="/admin/shs/sections" className="text-sm text-purple-600 hover:text-purple-800 font-medium hover:underline">
                                        View All Sections
                                    </Link>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Additional Information Card */}
                
            </div>
        </AuthenticatedLayout>
    );
};

export default Index;