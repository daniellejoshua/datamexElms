import React, { useState } from 'react';
import { Head, Link } from '@inertiajs/react';
import { route } from 'ziggy-js';
import { format } from 'date-fns';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Button } from '@/Components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Calendar, User, Eye, Paperclip, Clock, ArrowRight, Newspaper, TrendingUp, AlertTriangle, Info, Users, GraduationCap, BookOpen, Shield, UserCheck, Briefcase } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import AnnouncementForm from './AnnouncementFormNew';

export default function Index({ announcements, auth }) {
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [selectedAnnouncement, setSelectedAnnouncement] = useState(null);
    const [expandedAnnouncements, setExpandedAnnouncements] = useState({});

    // Extract data from paginated response
    const announcementsData = announcements?.data || (Array.isArray(announcements) ? announcements : []);

    const toggleExpanded = (id) => {
        setExpandedAnnouncements(prev => ({
            ...prev,
            [id]: !prev[id]
        }));
    };

    const getPriorityColor = (priority) => {
        switch (priority) {
            case 'urgent': return 'bg-red-500';
            case 'high': return 'bg-orange-500';
            case 'medium': return 'bg-white';
            case 'low': return 'bg-gray-500';
            default: return 'bg-gray-500';
        }
    };

    const getPriorityIcon = (priority) => {
        switch (priority) {
            case 'urgent': return <AlertTriangle className="h-4 w-4" />;
            case 'high': return <TrendingUp className="h-4 w-4" />;
            case 'medium': return <Info className="h-4 w-4" />;
            case 'low': return <Info className="h-4 w-4" />;
            default: return <Info className="h-4 w-4" />;
        }
    };

    const getVisibilityLabel = (visibility) => {
        switch (visibility) {
            case 'all_users': return '🌐 Public';
            case 'teachers_only': return '👨‍🏫 Faculty';
            case 'students_only': return '🎓 Students';
            case 'admins_only': return '🛡️ Admins';
            case 'registrars_only': return '📋 Registrars';
            case 'employees_only': return '💼 Employees';
            default: return '🌐 Public';
        }
    };

    const getVisibilityIcon = (visibility) => {
        switch (visibility) {
            case 'all_users': return <Newspaper className="h-4 w-4" />;
            case 'teachers_only': return <Users className="h-4 w-4" />;
            case 'students_only': return <GraduationCap className="h-4 w-4" />;
            case 'admins_only': return <Shield className="h-4 w-4" />;
            case 'registrars_only': return <UserCheck className="h-4 w-4" />;
            case 'employees_only': return <Briefcase className="h-4 w-4" />;
            default: return <Newspaper className="h-4 w-4" />;
        }
    };

    const canCreate = auth?.user && auth.user.role === 'head_teacher';

    const getInitials = (name) => {
        return name.split(' ').map(n => n[0]).join('').toUpperCase();
    };

    // Announcements are already sorted on the backend
    const sortedAnnouncements = announcementsData;

    return (
        <AuthenticatedLayout
            user={auth.user}
            header={
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div className="bg-blue-100 p-1.5 rounded-md">
                            <Newspaper className="w-4 h-4 text-blue-600" />
                        </div>
                        <div>
                            <h2 className="text-lg font-semibold text-gray-900">Announcements</h2>
                            <p className="text-xs text-gray-500 mt-0.5">News, updates, and important notices</p>
                        </div>
                    </div>
                </div>
            }
        >
            <Head title="Announcements" />

            <div className="py-6 px-4 sm:px-6 lg:px-8 bg-gray-50 dark:bg-gray-900 min-h-screen">
                <div className="max-w-7xl mx-auto space-y-6 lg:space-y-8">

                    {/* Recent Announcements */}
                    {sortedAnnouncements.length > 0 && (
                        <div className="mb-8 lg:mb-12">
                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 lg:mb-6 gap-4">
                                <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white font-serif">
                                    Recent Announcements
                                </h2>
                                {canCreate && (
                                    <Button
                                        onClick={() => setShowCreateModal(true)}
                                        className="bg-blue-600 hover:bg-blue-700 text-white w-full sm:w-auto"
                                        size="sm"
                                    >
                                        <BookOpen className="h-4 w-4 mr-2" />
                                        <span className="hidden xs:inline">Create Announcement</span>
                                        <span className="xs:hidden">Create</span>
                                    </Button>
                                )}
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                                {sortedAnnouncements.map((announcement, index) => (
                                    <Card key={announcement.id} className={`group relative overflow-hidden hover:shadow-xl transition-all duration-300 border-0 shadow-lg ${announcement.is_expired ? 'opacity-75' : ''} ${announcement.is_scheduled ? 'border-2 border-blue-300 border-dashed' : ''}`}>
                                        {/* Unread Badge */}
                                        {!announcement.is_read && (
                                            <div className="absolute top-3 right-3 z-10">
                                                <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                                            </div>
                                        )}
                                        {/* Featured Image or Placeholder */}
                                        {announcement.attachments && announcement.attachments.length > 0 ? (
                                            <div className="relative h-48 overflow-hidden">
                                                <img
                                                    src={announcement.attachments[0].cloudinary_url}
                                                    alt={announcement.title}
                                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                                />
                                                <div className="absolute top-4 left-4">
                                                    <Badge className={`${getPriorityColor(announcement.priority)} ${announcement.priority === 'medium' ? 'text-gray-900' : 'text-white'} border-0 font-medium`}>
                                                        {getPriorityIcon(announcement.priority)}
                                                        <span className="ml-1 capitalize">{announcement.priority}</span>
                                                    </Badge>
                                                    {announcement.is_scheduled && (
                                                        <Badge className="bg-blue-600 text-white border-0 font-medium ml-2">
                                                            Scheduled for {new Date(announcement.scheduled_at).toLocaleDateString('en-US', { timeZone: 'Asia/Manila', month: 'short', day: 'numeric', year: 'numeric' })} at {new Date(announcement.scheduled_at).toLocaleTimeString('en-US', { timeZone: 'Asia/Manila', hour: 'numeric', minute: '2-digit', hour12: true })}
                                                        </Badge>
                                                    )}
                                                    {announcement.is_expired && (
                                                        <Badge className="bg-gray-600 text-white border-0 font-medium ml-2">
                                                            Expired
                                                        </Badge>
                                                    )}
                                                </div>
                                                {announcement.attachments.length > 1 && (
                                                    <div className="absolute top-4 right-4">
                                                        <Badge variant="secondary" className="bg-black/60 text-white border-0">
                                                            +{announcement.attachments.length - 1} more
                                                        </Badge>
                                                    </div>
                                                )}
                                            </div>
                                        ) : (
                                            <div className="relative h-48 bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-700 flex items-center justify-center">
                                                <div className="text-center">
                                                    <Newspaper className="w-12 h-12 text-gray-400 dark:text-gray-500 mx-auto mb-2" />
                                                    <p className="text-sm text-gray-500 dark:text-gray-400">No image</p>
                                                </div>
                                                <div className="absolute top-4 left-4">
                                                    <Badge className={`${getPriorityColor(announcement.priority)} ${announcement.priority === 'medium' ? 'text-gray-900' : 'text-white'} border-0 font-medium`}>
                                                        {getPriorityIcon(announcement.priority)}
                                                        <span className="ml-1 capitalize">{announcement.priority}</span>
                                                    </Badge>
                                                    {announcement.is_scheduled && (
                                                        <Badge className="bg-blue-600 text-white border-0 font-medium ml-2">
                                                            Scheduled for {new Date(announcement.scheduled_at).toLocaleDateString('en-US', { timeZone: 'Asia/Manila', month: 'short', day: 'numeric', year: 'numeric' })} at {new Date(announcement.scheduled_at).toLocaleTimeString('en-US', { timeZone: 'Asia/Manila', hour: 'numeric', minute: '2-digit', hour12: true })}
                                                        </Badge>
                                                    )}
                                                    {announcement.is_expired && (
                                                        <Badge className="bg-gray-600 text-white border-0 font-medium ml-2">
                                                            Expired
                                                        </Badge>
                                                    )}
                                                </div>
                                            </div>
                                        )}

                                        <CardContent className="p-6">
                                            <div className="flex items-center space-x-2 mb-3">
                                                {getVisibilityIcon(announcement.visibility)}
                                                <span className="text-sm text-gray-500 dark:text-gray-400">
                                                    {getVisibilityLabel(announcement.visibility)}
                                                </span>
                                                <span className="text-gray-300 dark:text-gray-600">•</span>
                                                <div className="flex items-center space-x-1 text-sm text-gray-500 dark:text-gray-400">
                                                    <Clock className="h-3 w-3" />
                                                    <time>{new Date(announcement.scheduled_at || announcement.published_at).toLocaleDateString('en-US', { timeZone: 'Asia/Manila' })}</time>
                                                </div>
                                            </div>

                                            <Link href={route('announcements.show', announcement.id)}>
                                                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors leading-tight line-clamp-2">
                                                    {announcement.title}
                                                </h3>
                                            </Link>

                                            <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed line-clamp-3 mb-4 h-12 overflow-hidden">
                                                {announcement.content.length > 120 
                                                    ? announcement.content.substring(0, 120) + '...'
                                                    : announcement.content
                                                }
                                            </p>

                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center space-x-2">
                                                    <Avatar className="w-6 h-6">
                                                        <AvatarImage src={announcement.creator.profile_picture} />
                                                        <AvatarFallback className="text-xs bg-gray-200 dark:bg-gray-700">
                                                            {getInitials(announcement.creator.name)}
                                                        </AvatarFallback>
                                                    </Avatar>
                                                    <span className="text-sm text-gray-500 dark:text-gray-400">
                                                        {announcement.creator.name}
                                                    </span>
                                                </div>
                                                <Link
                                                    href={route('announcements.show', announcement.id)}
                                                    className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 text-sm font-medium"
                                                >
                                                    Read More →
                                                </Link>
                                            </div>
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* No Announcements State */}
                    {sortedAnnouncements.length === 0 && (
                        <div className="mb-8 lg:mb-12">
                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 lg:mb-6 gap-4">
                                <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white font-serif">
                                    Recent Announcements
                                </h2>
                                {canCreate && (
                                    <Button
                                        onClick={() => setShowCreateModal(true)}
                                        className="bg-blue-600 hover:bg-blue-700 text-white w-full sm:w-auto"
                                        size="sm"
                                    >
                                        <BookOpen className="h-4 w-4 mr-2" />
                                        <span className="hidden xs:inline">Create Announcement</span>
                                        <span className="xs:hidden">Create</span>
                                    </Button>
                                )}
                            </div>
                            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 p-8 sm:p-12 text-center">
                                <div className="flex justify-center mb-4">
                                    <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center">
                                        <Newspaper className="w-8 h-8 text-gray-400 dark:text-gray-500" />
                                    </div>
                                </div>
                                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                                    No Announcements Yet
                                </h3>
                                <p className="text-gray-500 dark:text-gray-400 mb-6 max-w-md mx-auto">
                                    There are currently no announcements to display. Check back later for updates or create a new announcement.
                                </p>
                                {canCreate && (
                                    <Button
                                        onClick={() => setShowCreateModal(true)}
                                        className="bg-blue-600 hover:bg-blue-700 text-white"
                                    >
                                        <BookOpen className="h-4 w-4 mr-2" />
                                        Create First Announcement
                                    </Button>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Pagination */}
                    {announcements.last_page > 1 && (
                        <div className="px-6 py-4 border-t bg-gray-50 flex justify-between items-center rounded-b-lg">
                            <p className="text-sm text-gray-700">
                                Showing {announcements.from} to {announcements.to} of {announcements.total} announcements
                            </p>
                            <div className="flex gap-1">
                                {announcements.links && announcements.links.map((link, index) => (
                                    link.url ? (
                                        <Link
                                            key={index}
                                            href={link.url}
                                            className={`px-3 py-1 text-sm border rounded ${
                                                link.active 
                                                    ? 'bg-blue-500 text-white border-blue-500' 
                                                    : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                                            }`}
                                            dangerouslySetInnerHTML={{ __html: link.label }}
                                        />
                                    ) : (
                                        <span
                                            key={index}
                                            className="px-3 py-1 text-sm text-gray-400 border border-gray-300 rounded"
                                            dangerouslySetInnerHTML={{ __html: link.label }}
                                        />
                                    )
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Create Modal */}
                    <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
                        <DialogContent className="max-w-3xl max-h-[90vh] overflow-hidden border border-gray-200 dark:border-gray-700 shadow-xl bg-white dark:bg-gray-900">
                            <DialogHeader className="border-b border-gray-200 dark:border-gray-700 pb-4">
                                <DialogTitle className="text-xl font-semibold flex items-center space-x-2 text-gray-900 dark:text-white">
                                    <Newspaper className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                                    <span>Create Announcement</span>
                                </DialogTitle>
                            </DialogHeader>
                            <div className="overflow-y-auto max-h-[calc(90vh-120px)]">
                                <AnnouncementForm mode="create" onClose={() => setShowCreateModal(false)} auth={auth} />
                            </div>
                        </DialogContent>
                    </Dialog>

                    {/* Edit Modal */}
                    <Dialog open={showEditModal} onOpenChange={setShowEditModal}>
                        <DialogContent className="max-w-3xl max-h-[90vh] overflow-hidden border border-gray-200 dark:border-gray-700 shadow-xl bg-white dark:bg-gray-900">
                            <DialogHeader className="border-b border-gray-200 dark:border-gray-700 pb-4">
                                <DialogTitle className="text-xl font-semibold flex items-center space-x-2 text-gray-900 dark:text-white">
                                    <Newspaper className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                                    <span>Edit Announcement</span>
                                </DialogTitle>
                            </DialogHeader>
                            <div className="overflow-y-auto max-h-[calc(90vh-120px)]">
                                {selectedAnnouncement && (
                                    <AnnouncementForm mode="edit" announcement={selectedAnnouncement} onClose={() => setShowEditModal(false)} auth={auth} />
                                )}
                            </div>
                        </DialogContent>
                    </Dialog>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}