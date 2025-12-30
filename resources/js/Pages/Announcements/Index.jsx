import React, { useState } from 'react';
import { Head, Link } from '@inertiajs/react';
import { format } from 'date-fns';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Button } from '@/Components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Calendar, User, Eye, Paperclip, Clock, ArrowRight, Newspaper, TrendingUp, AlertTriangle, Info, Users, GraduationCap, BookOpen } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import AnnouncementForm from './AnnouncementFormNew';

export default function Index({ announcements = [], auth }) {
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [selectedAnnouncement, setSelectedAnnouncement] = useState(null);
    const [expandedAnnouncements, setExpandedAnnouncements] = useState({});

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
            case 'medium': return 'bg-blue-500';
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
            default: return '🌐 Public';
        }
    };

    const getVisibilityIcon = (visibility) => {
        switch (visibility) {
            case 'all_users': return <Newspaper className="h-4 w-4" />;
            case 'teachers_only': return <Users className="h-4 w-4" />;
            case 'students_only': return <GraduationCap className="h-4 w-4" />;
            default: return <Newspaper className="h-4 w-4" />;
        }
    };

    const canCreate = auth?.user && auth.user.role === 'head_teacher';

    const getInitials = (name) => {
        return name.split(' ').map(n => n[0]).join('').toUpperCase();
    };

    // Separate featured/urgent announcements from regular ones
    const featuredAnnouncements = announcements.filter(announcement =>
        announcement.priority === 'urgent' || (announcement.attachments && announcement.attachments.length > 0)
    ).slice(0, 3);

    const regularAnnouncements = announcements.filter(announcement =>
        !featuredAnnouncements.includes(announcement)
    );

    if (!announcements) {
        return (
            <AuthenticatedLayout>
                <Head title="News & Announcements" />
                <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
                    <div className="max-w-7xl mx-auto px-4 py-8">
                        <div className="flex justify-center items-center py-12">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
                        </div>
                    </div>
                </div>
            </AuthenticatedLayout>
        );
    }

    return (
        <AuthenticatedLayout
            header={
                <div className="flex items-center px-2 py-1">
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

                        {/* Breaking News Banner */}
                        {featuredAnnouncements.length > 0 && featuredAnnouncements[0].priority === 'urgent' && (
                            <Card className="mb-6 lg:mb-8 bg-red-600 text-white border-0 shadow-lg">
                                <CardContent className="p-4 sm:p-6">
                                    <div className="flex items-center space-x-3 mb-4">
                                        <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                                            <AlertTriangle className="h-5 w-5 text-white" />
                                        </div>
                                        <span className="text-sm font-semibold uppercase tracking-wide">Breaking News</span>
                                    </div>
                                    <h2 className="text-xl sm:text-2xl font-bold mb-2">
                                        {featuredAnnouncements[0].title}
                                    </h2>
                                    <p className="text-red-100 mb-4 line-clamp-2 text-sm sm:text-base">
                                        {featuredAnnouncements[0].content.substring(0, 200)}...
                                    </p>
                                    <Link
                                        href={route('announcements.show', featuredAnnouncements[0].id)}
                                        className="inline-flex items-center space-x-2 text-white hover:text-red-200 transition-colors font-medium text-sm sm:text-base"
                                    >
                                        <span>Read Full Story</span>
                                        <ArrowRight className="h-4 w-4" />
                                    </Link>
                                </CardContent>
                            </Card>
                        )}

                    {/* Featured News Grid */}
                    {featuredAnnouncements.length > 0 && (
                        <div className="mb-8 lg:mb-12">
                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 lg:mb-6 gap-4">
                                <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white font-serif">
                                    Priority Announcements
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
                                {featuredAnnouncements.slice(0, 3).map((announcement, index) => (
                                    <Card key={announcement.id} className="group overflow-hidden hover:shadow-xl transition-all duration-300 border-0 shadow-lg">
                                        {/* Featured Image */}
                                        {announcement.attachments && announcement.attachments.length > 0 ? (
                                            <div className="relative h-48 overflow-hidden">
                                                <img
                                                    src={announcement.attachments[0].cloudinary_url}
                                                    alt={announcement.title}
                                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                                />
                                                <div className="absolute top-4 left-4">
                                                    <Badge className="bg-white/90 text-gray-900 border-0 font-medium">
                                                        {getPriorityIcon(announcement.priority)}
                                                        <span className="ml-1 capitalize">{announcement.priority}</span>
                                                    </Badge>
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
                                            <div className="h-48 bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center">
                                                <div className="text-center">
                                                    {getPriorityIcon(announcement.priority)}
                                                    <p className="text-sm font-medium mt-2 text-gray-600 dark:text-gray-400">
                                                        {announcement.priority.toUpperCase()}
                                                    </p>
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
                                                    <time>{format(new Date(announcement.published_at), 'MMM dd')}</time>
                                                </div>
                                            </div>

                                            <Link href={route('announcements.show', announcement.id)}>
                                                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors leading-tight line-clamp-2">
                                                    {announcement.title}
                                                </h3>
                                            </Link>

                                            <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed line-clamp-3 mb-4">
                                                {announcement.content.substring(0, 150)}...
                                            </p>

                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center space-x-2">
                                                    <Avatar className="w-6 h-6">
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