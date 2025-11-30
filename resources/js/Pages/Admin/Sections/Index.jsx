import React from 'react';
import { Head, Link } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';

const Index = ({ sections }) => {
    // Helper function to parse section name like "BSIT-3A"
    const parseSectionName = (sectionName) => {
        if (!sectionName) return { course: '', yearLevel: '', section: '' };
        
        const parts = sectionName.split('-');
        if (parts.length !== 2) return { course: sectionName, yearLevel: '', section: '' };
        
        const course = parts[0]; // BSIT
        const yearSection = parts[1]; // 3A
        
        // Extract year level (number) and section letter
        const yearMatch = yearSection.match(/(\d+)/);
        const sectionMatch = yearSection.match(/([A-Z]+)/);
        
        return {
            course: course,
            yearLevel: yearMatch ? yearMatch[1] : '',
            section: sectionMatch ? sectionMatch[1] : ''
        };
    };

    return (
        <AuthenticatedLayout
            header={
                <div className="flex justify-between items-center">
                    <h2 className="text-xl font-semibold leading-tight text-gray-800 dark:text-gray-200">
                        Sections Management
                    </h2>
                    <Link 
                        href="/admin/sections/create" 
                        className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200"
                    >
                        Add Section
                    </Link>
                </div>
            }
        >
            <Head title="Sections Management" />
            <div className="py-12">
                <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {sections?.data?.length > 0 ? (
                            sections.data.map((section) => {
                                const parsed = parseSectionName(section.section_name);
                                return (
                                    <div key={section.id} className="bg-white dark:bg-gray-800 overflow-hidden shadow-sm rounded-lg hover:shadow-lg transition-shadow duration-200">
                                        <div className="p-6">
                                            <div className="flex items-center justify-between mb-4">
                                                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                                                    {section.section_name}
                                                </h3>
                                                <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                                                    section.status === 'active' 
                                                        ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400' 
                                                        : 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
                                                }`}>
                                                    {section.status}
                                                </span>
                                            </div>
                                            
                                            <div className="space-y-3 mb-4">
                                                {parsed.course && (
                                                    <div className="flex items-center">
                                                        <svg className="w-4 h-4 text-blue-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                                                        </svg>
                                                        <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                                                            {parsed.course}
                                                        </span>
                                                    </div>
                                                )}
                                                
                                                {parsed.yearLevel && (
                                                    <div className="flex items-center">
                                                        <svg className="w-4 h-4 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l9-5-9-5-9 5 9 5z" />
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
                                                        </svg>
                                                        <span className="text-sm text-gray-600 dark:text-gray-300">
                                                            Year {parsed.yearLevel}
                                                        </span>
                                                    </div>
                                                )}
                                                
                                                {parsed.section && (
                                                    <div className="flex items-center">
                                                        <svg className="w-4 h-4 text-purple-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                                                        </svg>
                                                        <span className="text-sm text-gray-600 dark:text-gray-300">
                                                            Section {parsed.section}
                                                        </span>
                                                    </div>
                                                )}
                                                
                                                <div className="flex items-center">
                                                    <svg className="w-4 h-4 text-orange-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                                                    </svg>
                                                    <span className="text-sm text-gray-600 dark:text-gray-300">
                                                        Room {section.room}
                                                    </span>
                                                </div>
                                                
                                                <div className="flex items-center">
                                                    <svg className="w-4 h-4 text-indigo-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                                    </svg>
                                                    <span className="text-sm text-gray-600 dark:text-gray-300">
                                                        {section.academic_year} - {section.semester}
                                                    </span>
                                                </div>
                                                
                                                <div className="flex items-center">
                                                    <svg className="w-4 h-4 text-gray-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                                                    </svg>
                                                    <span className="text-sm text-gray-600 dark:text-gray-300">
                                                        {section.enrollments?.length || 0} students
                                                    </span>
                                                </div>
                                            </div>
                                            
                                            <div className="flex gap-2 pt-4 border-t border-gray-200 dark:border-gray-700">
                                                <Link 
                                                    href={`/admin/sections/${section.id}/students`}
                                                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white text-xs px-3 py-2 rounded text-center transition-colors duration-200"
                                                >
                                                    Manage Students
                                                </Link>
                                                <Link 
                                                    href={`/admin/sections/${section.id}/edit`}
                                                    className="flex-1 bg-gray-600 hover:bg-gray-700 text-white text-xs px-3 py-2 rounded text-center transition-colors duration-200"
                                                >
                                                    Edit Section
                                                </Link>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })
                        ) : (
                            <div className="col-span-full">
                                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-8 text-center">
                                    <svg className="w-12 h-12 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                                    </svg>
                                    <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">No sections found</h3>
                                    <p className="text-gray-500 dark:text-gray-400">Create your first section to get started.</p>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Pagination */}
                    {sections?.links && (
                        <div className="mt-6 flex justify-center">
                            <nav className="flex space-x-2">
                                {sections.links.map((link, index) => (
                                    <span
                                        key={index}
                                        className={`px-3 py-2 text-sm ${
                                            link.active
                                                ? 'bg-indigo-600 text-white'
                                                : 'bg-white text-gray-700 hover:bg-gray-50'
                                        } border border-gray-300 rounded-md`}
                                    >
                                        {link.label}
                                    </span>
                                ))}
                            </nav>
                        </div>
                    )}
                </div>
            </div>
        </AuthenticatedLayout>
    );
};

export default Index;