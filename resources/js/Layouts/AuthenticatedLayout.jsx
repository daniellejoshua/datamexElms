import ApplicationLogo from '@/Components/ApplicationLogo';
import { Link, usePage } from '@inertiajs/react';
import { useState } from 'react';
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
import { ChevronDown, ChevronRight, User, LogOut } from 'lucide-react';

export default function AuthenticatedLayout({ header, children }) {
    const user = usePage().props.auth.user;
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
    const [expandedMenus, setExpandedMenus] = useState({
        'Sections': route().current('admin.sections.*') || route().current('admin.college.*') || route().current('admin.shs.*')
    });

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
                        name: 'Grades', 
                        href: '#', 
                        current: route().current('teacher.grades.*'),
                        icon: (
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                            </svg>
                        )
                    },
                    { 
                        name: 'Attendance', 
                        href: '#', 
                        current: false,
                        icon: (
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                            </svg>
                        )
                    },
                    { 
                        name: 'Materials', 
                        href: '#', 
                        current: false,
                        icon: (
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
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
                  
                ];
            case 'student':
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
            {/* Left Sidebar */}
            <div className={`bg-white border-r border-gray-200 transition-all duration-300 ease-in-out ${sidebarCollapsed ? 'w-16' : 'w-56'} flex-shrink-0`}>
                <div className="h-full flex flex-col">
                    {/* Logo Section */}
                    <div className="flex items-center justify-between p-4 border-b border-gray-200">
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
                        <button
                            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                            className="p-1 rounded-lg text-gray-500 hover:text-red-600 hover:bg-red-50 transition-colors"
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
                                        <span className={`${item.current ? 'text-white' : 'text-gray-500'} ${item.current && 'group-hover:text-white'}`}>
                                            {item.icon}
                                        </span>
                                        {!sidebarCollapsed && (
                                            <span className="ml-3 truncate">{item.name}</span>
                                        )}
                                    </Link>
                                )}
                            </div>
                        ))}
                    </nav>
                </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 flex flex-col overflow-hidden">
                {/* Top Header */}
                <header className="bg-white border-b border-gray-200 px-6 py-4">
                    <div className="flex items-center justify-between">
                        <div className="flex-1">
                            {header}
                        </div>
                        
                        {/* Profile Dropdown */}
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" className="flex items-center space-x-2 px-3 py-2 h-auto">
                                    <Avatar className="w-8 h-8">
                                        <AvatarFallback className="bg-red-600 text-white text-xs">
                                            {user.name.charAt(0).toUpperCase()}
                                        </AvatarFallback>
                                    </Avatar>
                                    <div className="hidden md:block text-left">
                                        <p className="text-sm font-medium text-gray-900">{user.name}</p>
                                        <p className="text-xs text-blue-600 capitalize">{user.role.replace('_', ' ')}</p>
                                    </div>
                                    <ChevronDown className="w-4 h-4 text-gray-500" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-56">
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
                                    <Link 
                                        href={route('logout')}
                                        method="post"
                                        as="button"
                                        className="cursor-pointer text-red-600 focus:text-red-600 w-full"
                                    >
                                        <LogOut className="w-4 h-4 mr-2" />
                                        Sign Out
                                    </Link>
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                </header>

                {/* Page Content */}
                <main className="flex-1 overflow-y-auto bg-gray-50">
                    {children}
                </main>
            </div>
        </div>
    );
}
