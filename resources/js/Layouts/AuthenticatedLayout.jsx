import ApplicationLogo from '@/Components/ApplicationLogo';
import { Link, usePage, router } from '@inertiajs/react';
import { useState, useEffect } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { ChevronDown, ChevronRight, User, LogOut, Menu, X, Users } from 'lucide-react';
import { Toaster } from '@/components/ui/sonner';
import { toast } from 'sonner';

export default function AuthenticatedLayout({ header, children }) {
    const { flash, unreadAnnouncementsCount } = usePage().props;
    const user = usePage().props.auth.user;
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [expandedMenus, setExpandedMenus] = useState({
        'Sections': route().current('admin.sections.*') || route().current('admin.college.*') || route().current('admin.shs.*')
    });

    // Handle flash messages
    useEffect(() => {
        if (flash?.success) {
            toast.success(flash.success, {
                duration: 5000,
            })
        }
        if (flash?.error) {
            // Show rate limit messages as special styled toasts
            if (flash.error.toLowerCase().includes('rate limit') ||
                flash.error.toLowerCase().includes('too many')) {
                toast.warning(flash.error, {
                    duration: 5000,
                });
            } else {
                // Show other error messages normally
                toast.error(flash.error, {
                    duration: 5000,
                });
            }
        }
    }, [flash]);

    const toggleMenu = (itemName) => {
        setExpandedMenus(prev => ({
            ...prev,
            [itemName]: !prev[itemName]
        }));
    };

    const getNavigationItems = () => {
        switch (user.role) {
            case 'teacher':
                return [
                    { 
                        name: 'Dashboard', 
                        href: route('teacher.dashboard'), 
                        current: route().current('teacher.dashboard'),
                        icon: (
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5a2 2 0 012-2h4a2 2 0 012 2v0a2 2 0 01-2 2H10a2 2 0 01-2-2v0z" />
                            </svg>
                        )
                    },
                    { 
                        name: 'Announcements', 
                        href: route('announcements.index'), 
                        current: route().current('announcements.*'),
                        badge: unreadAnnouncementsCount > 0,
                        icon: (
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
                            </svg>
                        )
                    },
                    { 
                        name: 'College', 
                        href: route('teacher.sections.college'), 
                        current: route().current('teacher.sections.college') || route().current('teacher.grades.*') || route().current('teacher.materials.*'),
                        icon: (
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l9-5-9-5-9 5 9 5z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l9-5-9-5-9 5 9 5zm0 0l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
                            </svg>
                        )
                    },
                    { 
                        name: 'SHS', 
                        href: route('teacher.sections.shs'), 
                        current: route().current('teacher.sections.shs'),
                        icon: (
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                            </svg>
                        )
                    },
                    { 
                        name: 'Archived Sections', 
                        href: route('teacher.archived-sections'), 
                        current: route().current('teacher.archived-sections*'),
                        icon: (
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
                            </svg>
                        )
                    },
                ];
            case 'head_teacher':
            case 'super_admin':
                return [
                    { 
                        name: 'Dashboard', 
                        href: route('admin.dashboard'), 
                        current: route().current('admin.dashboard'),
                        icon: (
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5a2 2 0 012-2h4a2 2 0 012 2v0a2 2 0 01-2 2H10a2 2 0 01-2-2v0z" />
                            </svg>
                        )
                    },
                    { 
                        name: 'Announcements', 
                        href: route('announcements.index'), 
                        current: route().current('announcements.*'),
                        badge: unreadAnnouncementsCount > 0,
                        icon: (
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
                            </svg>
                        )
                    },
                    { 
                        name: 'Sections', 
                        href: route('admin.sections.index'), 
                        current: route().current('admin.sections.*') || route().current('admin.college.*') || route().current('admin.shs.*'),
                        children: [
                            {
                                name: 'Overview',
                                href: route('admin.sections.index'),
                                current: route().current('admin.sections.index')
                            },
                            {
                                name: 'College Sections',
                                href: route('admin.college.sections.index'),
                                current: route().current('admin.college.*')
                            },
                            {
                                name: 'SHS Sections',
                                href: route('admin.shs.sections.index'),
                                current: route().current('admin.shs.*')
                            }
                        ],
                        icon: (
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                            </svg>
                        )
                    },
                    { 
                        name: 'Academic Years', 
                        href: route('admin.academic-years.index'), 
                        current: route().current('admin.academic-years.*'),
                        icon: (
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3a2 2 0 012-2h4a2 2 0 012 2v4m-6 9l2 2 4-4" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 14a2 2 0 01-2 2H6a2 2 0 01-2-2V9a2 2 0 012-2h12a2 2 0 012 2v5z" />
                            </svg>
                        )
                    },
                    { 
                        name: 'Subjects', 
                        href: route('admin.subjects.index'), 
                        current: route().current('admin.subjects.*'),
                        icon: (
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                            </svg>
                        )
                    },
                    { 
                        name: 'Teachers', 
                        href: route('admin.teachers.index'), 
                        current: route().current('admin.teachers.*'),
                        icon: <Users className="w-5 h-5" />
                    },
                    { 
                        name: 'Registrars', 
                        href: route('admin.registrars.index'), 
                        current: route().current('admin.registrars.*'),
                        icon: <Users className="w-5 h-5" />
                    },
                    { 
                        name: 'Curriculum', 
                        href: route('admin.curriculum.index'), 
                        current: route().current('admin.curriculum.*'),
                        icon: (
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                        )
                    },
                    { 
                        name: 'Year Level Guides', 
                        href: route('admin.year-level-curriculum-guides.index'), 
                        current: route().current('admin.year-level-curriculum-guides.*'),
                        icon: (
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                            </svg>
                        )
                    },
                ];
                return [
                    { 
                        name: 'Dashboard', 
                        href: route('student.dashboard'), 
                        current: route().current('student.dashboard'),
                        icon: (
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z" />
                            </svg>
                        )
                    },
                    { 
                        name: 'Announcements', 
                        href: route('announcements.index'), 
                        current: route().current('announcements.*'),
                        badge: unreadAnnouncementsCount > 0,
                        icon: (
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
                            </svg>
                        )
                    },
                    { 
                        name: 'My Grades', 
                        href: '#', 
                        current: false,
                        icon: (
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                            </svg>
                        )
                    },
                    { 
                        name: 'My Schedule', 
                        href: '#', 
                        current: false,
                        icon: (
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3a2 2 0 012-2h4a2 2 0 012 2v4m-6 9l2 2 4-4" />
                            </svg>
                        )
                    },
                ];
            case 'registrar':
                return [
                    { 
                        name: 'Dashboard', 
                        href: route('registrar.dashboard'), 
                        current: route().current('registrar.dashboard'),
                        icon: (
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5a2 2 0 012-2h4a2 2 0 012 2v0a2 2 0 01-2 2H10a2 2 0 01-2-2v0z" />
                            </svg>
                        )
                    },
                    { 
                        name: 'Announcements', 
                        href: route('announcements.index'), 
                        current: route().current('announcements.*'),
                        badge: unreadAnnouncementsCount > 0,
                        icon: (
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
                            </svg>
                        )
                    },
                    { 
                        name: 'Student Management', 
                        href: route('registrar.enrollments.index'), 
                        current: route().current('registrar.enrollments.*') || route().current('registrar.students.*'),
                        icon: (
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                            </svg>
                        )
                    },
                    { 
                        name: 'Payments', 
                        href: route('registrar.payments.college.index'), 
                        current: route().current('registrar.payments.*'),
                        children: [
                            {
                                name: 'College Payments',
                                href: route('registrar.payments.college.index'),
                                current: route().current('registrar.payments.college.*')
                            },
                            {
                                name: 'SHS Payments',
                                href: route('registrar.payments.shs.index'),
                                current: route().current('registrar.payments.shs.*')
                            }
                        ],
                        icon: (
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                            </svg>
                        )
                    },
                    { 
                        name: 'Programs', 
                        href: route('registrar.programs.index'), 
                        current: route().current('registrar.programs.*'),
                        icon: (
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                            </svg>
                        )
                    },
                ];
            default:
                return [
                    { 
                        name: 'Dashboard', 
                        href: route('dashboard'), 
                        current: route().current('dashboard'),
                        icon: (
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z" />
                            </svg>
                        )
                    },
                ];
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 flex">
            {/* Mobile Menu Overlay */}
            {mobileMenuOpen && (
                <div
                    className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
                    onClick={() => setMobileMenuOpen(false)}
                />
            )}

            {/* Left Sidebar */}
            <div className={`bg-white border-r border-gray-200 transition-all duration-300 ease-in-out ${
                sidebarCollapsed ? 'w-16' : 'w-48'
            } flex-shrink-0 fixed lg:static inset-y-0 left-0 z-50 lg:z-auto transform ${
                mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
            } lg:translate-x-0`}>
                <div className="h-full flex flex-col">
                    {/* Logo Section */}
                    <div className="flex items-center justify-between p-4 border-b border-gray-200 group">
                        <div className="flex items-center">
                            <div className="flex-shrink-0">
                                <ApplicationLogo className="block h-8 w-auto fill-current text-red-600" />
                            </div>
                            {!sidebarCollapsed && (
                                <div className="ml-3">
                                    <h1 className="text-lg font-bold text-red-600">DATAMEX</h1>
                                    <p className="text-xs text-blue-600 font-medium">Education System</p>
                                </div>
                            )}
                        </div>
                        <div className="flex items-center space-x-2">
                            {/* Mobile Close Button */}
                            <button
                                onClick={() => setMobileMenuOpen(false)}
                                className="lg:hidden p-1 rounded-lg text-gray-500 hover:text-red-600 hover:bg-red-50 transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>
                            {/* Desktop Collapse Button */}
                            <button
                                onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                                className={`hidden lg:block p-1 rounded-lg text-gray-500 hover:text-red-600 hover:bg-red-50 transition-colors ${
                                    sidebarCollapsed ? 'opacity-0 group-hover:opacity-100' : 'opacity-100'
                                } transition-opacity duration-200`}
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    {sidebarCollapsed ? (
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
                                    ) : (
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
                                    )}
                                </svg>
                            </button>
                        </div>
                    </div>

                    {/* Navigation */}
                    <nav className="flex-1 px-4 py-4 space-y-1 overflow-y-auto">
                        {getNavigationItems().map((item) => (
                            <div key={item.name}>
                                {item.children ? (
                                    // Menu item with children (expandable)
                                    <>
                                        <button
                                            onClick={() => toggleMenu(item.name)}
                                            className={`w-full flex items-center px-3 py-3 text-sm font-medium rounded-lg transition-all duration-200 ${
                                                item.current
                                                    ? 'bg-red-600 text-white shadow-md'
                                                    : 'text-gray-600 hover:bg-red-50 hover:text-red-600'
                                            } ${sidebarCollapsed ? 'justify-center' : ''}`}
                                            title={sidebarCollapsed ? item.name : ''}
                                        >
                                            <span className={`${item.current ? 'text-white' : 'text-gray-500'} ${item.current && 'group-hover:text-white'}`}>
                                                {item.icon}
                                            </span>
                                            {!sidebarCollapsed && (
                                                <>
                                                    <span className="ml-3 truncate flex-1 text-left">{item.name}</span>
                                                    <span className={`${item.current ? 'text-white' : 'text-gray-500'}`}>
                                                        {expandedMenus[item.name] ? (
                                                            <ChevronDown className="w-4 h-4" />
                                                        ) : (
                                                            <ChevronRight className="w-4 h-4" />
                                                        )}
                                                    </span>
                                                </>
                                            )}
                                        </button>
                                        
                                        {/* Submenu items */}
                                        {!sidebarCollapsed && expandedMenus[item.name] && (
                                            <div className="ml-6 mt-1 space-y-1">
                                                {item.children.map((child) => (
                                                    <Link
                                                        key={child.name}
                                                        href={child.href}
                                                        className={`flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${
                                                            child.current
                                                                ? 'bg-red-100 text-red-700 border-l-4 border-red-600'
                                                                : 'text-gray-600 hover:bg-red-50 hover:text-red-600'
                                                        }`}
                                                    >
                                                        {child.name}
                                                    </Link>
                                                ))}
                                            </div>
                                        )}
                                    </>
                                ) : (
                                    // Regular menu item without children
                                    <Link
                                        href={item.href}
                                        className={`flex items-center px-3 py-3 text-sm font-medium rounded-lg transition-all duration-200 ${
                                            item.current
                                                ? 'bg-red-600 text-white shadow-md'
                                                : 'text-gray-600 hover:bg-red-50 hover:text-red-600'
                                        } ${sidebarCollapsed ? 'justify-center' : ''}`}
                                        title={sidebarCollapsed ? item.name : ''}
                                    >
                                        <div className="relative">
                                            <span className={`${item.current ? 'text-white' : 'text-gray-500'} ${item.current && 'group-hover:text-white'}`}>
                                                {item.icon}
                                            </span>
                                            {item.badge && (
                                                <div className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full"></div>
                                            )}
                                        </div>
                                        {!sidebarCollapsed && (
                                            <span className="ml-3 truncate">{item.name}</span>
                                        )}
                                    </Link>
                                )}
                            </div>
                        ))}
                    </nav>

                    {/* Profile Section - Mobile Only */}
                    <div className="mt-auto p-4 border-t border-gray-200 lg:hidden">
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" className="w-full flex items-center space-x-3 px-3 py-2 h-auto justify-start">
                                    <Avatar className="w-8 h-8 flex-shrink-0">
                                        <AvatarFallback className="bg-red-600 text-white text-sm">
                                            {user.name.charAt(0).toUpperCase()}
                                        </AvatarFallback>
                                    </Avatar>
                                    <div className="flex-1 text-left min-w-0">
                                        <p className="text-sm font-medium text-gray-900 truncate">{user.name}</p>
                                        <p className="text-xs text-blue-600 capitalize">{user.role.replace('_', ' ')}</p>
                                    </div>
                                    <ChevronDown className="w-4 h-4 text-gray-500 flex-shrink-0" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="start" className="w-56" sideOffset={4}>
                                <DropdownMenuLabel>
                                    <div className="flex flex-col space-y-1">
                                        <p className="text-sm font-medium">{user.name}</p>
                                        <p className="text-xs text-blue-600 capitalize">{user.role.replace('_', ' ')}</p>
                                    </div>
                                </DropdownMenuLabel>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem asChild>
                                    <Link href={route('profile.edit')} className="cursor-pointer">
                                        <User className="w-4 h-4 mr-2" />
                                        Profile Settings
                                    </Link>
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem asChild>
                                    <button
                                        onClick={(e) => {
                                            e.preventDefault();
                                            // Clear cached state
                                            sessionStorage.clear();
                                            localStorage.clear();
                                            // Force full page reload to login
                                            router.post(route('logout'), {}, {
                                                preserveState: false,
                                                preserveScroll: false,
                                                onSuccess: () => {
                                                    window.location.href = route('login');
                                                },
                                            });
                                        }}
                                        className="cursor-pointer text-red-600 focus:text-red-600 w-full flex items-center"
                                    >
                                        <LogOut className="w-4 h-4 mr-2" />
                                        Sign Out
                                    </button>
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 flex flex-col overflow-hidden">
                {/* Top Header */}
                <header className="bg-white border-b border-gray-200 px-6 py-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center">
                            {/* Mobile Menu Button */}
                            <button
                                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                                className="lg:hidden p-2 rounded-lg text-gray-500 hover:text-red-600 hover:bg-red-50 transition-colors mr-4"
                            >
                                {mobileMenuOpen ? (
                                    <X className="w-6 h-6" />
                                ) : (
                                    <Menu className="w-6 h-6" />
                                )}
                            </button>
                            <div className="flex-1">
                                {header}
                            </div>
                        </div>
                        
                        {/* Profile Dropdown - Desktop Only */}
                        <div className="hidden lg:block">
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" className="flex items-center space-x-2 px-2 sm:px-3 py-2 h-auto min-w-0">
                                        <Avatar className="w-6 h-6 sm:w-8 sm:h-8 flex-shrink-0">
                                            <AvatarImage src={user.profile_picture} alt={user.name} />
                                            <AvatarFallback className="bg-red-600 text-white text-xs">
                                                {user.name.charAt(0).toUpperCase()}
                                            </AvatarFallback>
                                        </Avatar>
                                        <div className="hidden sm:block text-left min-w-0 flex-1">
                                            <p className="text-xs sm:text-sm font-medium text-gray-900 truncate">{user.name}</p>
                                            <p className="text-xs text-blue-600 capitalize hidden md:block">{user.role.replace('_', ' ')}</p>
                                        </div>
                                        <ChevronDown className="w-3 h-3 sm:w-4 sm:h-4 text-gray-500 flex-shrink-0" />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="w-48 sm:w-56 z-50" sideOffset={4}>
                                    <DropdownMenuLabel>
                                        <div className="flex flex-col space-y-1">
                                            <p className="text-sm font-medium">{user.name}</p>
                                            <p className="text-xs text-blue-600 capitalize">{user.role.replace('_', ' ')}</p>
                                        </div>
                                    </DropdownMenuLabel>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem asChild>
                                        <Link href={route('profile.edit')} className="cursor-pointer">
                                            <User className="w-4 h-4 mr-2" />
                                            Profile Settings
                                        </Link>
                                    </DropdownMenuItem>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem asChild>
                                        <button
                                            onClick={(e) => {
                                                e.preventDefault();
                                                // Clear cached state
                                                sessionStorage.clear();
                                                localStorage.clear();
                                                // Force full page reload to login
                                                router.post(route('logout'), {}, {
                                                    preserveState: false,
                                                    preserveScroll: false,
                                                    onSuccess: () => {
                                                        window.location.href = route('login');
                                                    },
                                                });
                                            }}
                                            className="cursor-pointer text-red-600 focus:text-red-600 w-full flex items-center"
                                        >
                                            <LogOut className="w-4 h-4 mr-2" />
                                            Sign Out
                                        </button>
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </div>
                    </div>
                </header>

                {/* Page Content */}
                <main className="flex-1 overflow-y-auto bg-gray-50">
                    {children}
                </main>
            </div>
            <Toaster />
        </div>
    );
}
