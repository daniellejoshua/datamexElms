import React, { useState } from 'react';
import { Head } from '@inertiajs/react';
import { format } from 'date-fns';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Button } from '@/Components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Calendar, User, Eye, Paperclip, ChevronDown, ChevronUp, Heart, MessageCircle, Share, MoreHorizontal, Edit, Trash2 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import AnnouncementForm from './AnnouncementFormNew';

export default function Index({ announcements = [], auth }) {
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [selectedAnnouncement, setSelectedAnnouncement] = useState(null);
    const [expandedAnnouncements, setExpandedAnnouncements] = useState({});
    const [likedPosts, setLikedPosts] = useState({});

    const toggleExpanded = (id) => {
        setExpandedAnnouncements(prev => ({
            ...prev,
            [id]: !prev[id]
        }));
    };

    const toggleLike = (id) => {
        setLikedPosts(prev => ({
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

    const getVisibilityLabel = (visibility) => {
        switch (visibility) {
            case 'all_users': return '🌐 Public';
            case 'teachers_only': return '👨‍🏫 Teachers';
            case 'students_only': return '🎓 Students';
            default: return '🌐 Public';
        }
    };

    const canCreate = auth?.user && auth.user.role === 'head_teacher';

    const getInitials = (name) => {
        return name.split(' ').map(n => n[0]).join('').toUpperCase();
    };

    if (!announcements) {
        return (
            <AuthenticatedLayout>
                <Head title="Announcements" />
                <div className="min-h-screen bg-gray-100 dark:bg-gray-900">
                    <div className="max-w-2xl mx-auto px-4 py-8">
                        <div className="flex justify-center items-center py-12">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
                        </div>
                    </div>
                </div>
            </AuthenticatedLayout>
        );
    }

    return (
        <AuthenticatedLayout>
            <Head title="Announcements" />

            <div className="min-h-screen bg-gray-100 dark:bg-gray-900">
                <div className="max-w-2xl mx-auto px-4 py-8">
                    {/* Create Post Card - Facebook Style */}
                    {canCreate && (
                        <Card className="mb-6 bg-white dark:bg-gray-800 shadow-sm border-0">
                            <CardContent className="p-4">
                                <div className="flex items-start space-x-3">
                                    <Avatar className="w-10 h-10">
                                        <AvatarImage src="" />
                                        <AvatarFallback className="bg-blue-500 text-white">
                                            {getInitials(auth.user.name)}
                                        </AvatarFallback>
                                    </Avatar>
                                    <div className="flex-1">
                                        <Button
                                            variant="outline"
                                            className="w-full justify-start text-left text-gray-500 dark:text-gray-400 h-12 px-4 rounded-full border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700"
                                            onClick={() => setShowCreateModal(true)}
                                        >
                                            What's on your mind, {auth.user.name.split(' ')[0]}?
                                        </Button>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {/* Announcements Feed */}
                    <div className="space-y-4">
                        {!announcements || announcements.length === 0 ? (
                            <Card className="bg-white dark:bg-gray-800 shadow-sm border-0">
                                <CardContent className="flex flex-col items-center justify-center py-16">
                                    <div className="text-gray-500 dark:text-gray-400 text-center">
                                        <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center">
                                            <Paperclip className="w-8 h-8 text-gray-400" />
                                        </div>
                                        <h3 className="text-lg font-medium mb-2">No announcements yet</h3>
                                        <p className="text-sm">Check back later for updates from your teachers.</p>
                                    </div>
                                </CardContent>
                            </Card>
                        ) : (
                            announcements.map((announcement) => {
                                const isExpanded = expandedAnnouncements[announcement.id];
                                const isLiked = likedPosts[announcement.id];
                                const shouldTruncate = announcement.content.length > 300;
                                const displayContent = isExpanded || !shouldTruncate
                                    ? announcement.content
                                    : `${announcement.content.substring(0, 300)}...`;

                                return (
                                    <Card key={announcement.id} className="bg-white dark:bg-gray-800 shadow-sm border-0 hover:shadow-md transition-shadow">
                                        <CardContent className="p-0">
                                            {/* Post Header */}
                                            <div className="p-4 pb-3">
                                                <div className="flex items-start justify-between">
                                                    <div className="flex items-start space-x-3">
                                                        <Avatar className="w-10 h-10">
                                                            <AvatarImage src="" />
                                                            <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white">
                                                                {getInitials(announcement.creator.name)}
                                                            </AvatarFallback>
                                                        </Avatar>
                                                        <div className="flex-1 min-w-0">
                                                            <div className="flex items-center space-x-2">
                                                                <h3 className="font-semibold text-gray-900 dark:text-gray-100 truncate">
                                                                    {announcement.creator.name}
                                                                </h3>
                                                                <div className={`w-2 h-2 rounded-full ${getPriorityColor(announcement.priority)}`}></div>
                                                            </div>
                                                            <div className="flex items-center space-x-2 text-sm text-gray-500 dark:text-gray-400">
                                                                <span>{format(new Date(announcement.published_at), 'MMM dd, yyyy')}</span>
                                                                <span>•</span>
                                                                <span className="text-xs">{getVisibilityLabel(announcement.visibility)}</span>
                                                                {announcement.is_read && (
                                                                    <>
                                                                        <span>•</span>
                                                                        <span className="text-xs text-green-600 dark:text-green-400">Read</span>
                                                                    </>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>
                                                    {canCreate && (
                                                        <div className="relative">
                                                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                                                <MoreHorizontal className="h-4 w-4" />
                                                            </Button>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Post Content */}
                                            <div className="px-4 pb-3">
                                                <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-2">
                                                    {announcement.title}
                                                </h4>
                                                <div className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap text-sm leading-relaxed">
                                                    {displayContent}
                                                </div>
                                                {shouldTruncate && (
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => toggleExpanded(announcement.id)}
                                                        className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 p-0 h-auto font-medium text-sm mt-1"
                                                    >
                                                        {isExpanded ? 'Show less' : 'See more'}
                                                    </Button>
                                                )}
                                            </div>

                                            {/* Post Images */}
                                            {announcement.attachments && announcement.attachments.length > 0 && (
                                                <div className="px-4 pb-3">
                                                    <div className={`grid gap-2 rounded-lg overflow-hidden ${
                                                        announcement.attachments.length === 1 ? 'grid-cols-1' :
                                                        announcement.attachments.length === 2 ? 'grid-cols-2' :
                                                        'grid-cols-2'
                                                    }`}>
                                                        {announcement.attachments.slice(0, 4).map((attachment, index) => (
                                                            <div key={attachment.id} className={`relative group ${
                                                                announcement.attachments.length === 3 && index === 0 ? 'row-span-2' : ''
                                                            }`}>
                                                                <img
                                                                    src={attachment.cloudinary_url}
                                                                    alt={attachment.original_name}
                                                                    className="w-full h-full object-cover min-h-[200px] cursor-pointer hover:brightness-95 transition-all"
                                                                    loading="lazy"
                                                                    onClick={() => window.open(attachment.cloudinary_url, '_blank')}
                                                                />
                                                                {announcement.attachments.length > 4 && index === 3 && (
                                                                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                                                                        <span className="text-white font-semibold text-lg">
                                                                            +{announcement.attachments.length - 4}
                                                                        </span>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}

                                            {/* Post Actions */}
                                            <div className="px-4 py-2 border-t border-gray-100 dark:border-gray-700">
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center space-x-6">
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={() => toggleLike(announcement.id)}
                                                            className={`flex items-center space-x-2 hover:bg-red-50 dark:hover:bg-red-900/20 ${
                                                                isLiked ? 'text-red-600 dark:text-red-400' : 'text-gray-600 dark:text-gray-400'
                                                            }`}
                                                        >
                                                            <Heart className={`h-4 w-4 ${isLiked ? 'fill-current' : ''}`} />
                                                            <span className="text-sm">Like</span>
                                                        </Button>
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            className="flex items-center space-x-2 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700"
                                                        >
                                                            <MessageCircle className="h-4 w-4" />
                                                            <span className="text-sm">Comment</span>
                                                        </Button>
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            className="flex items-center space-x-2 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700"
                                                        >
                                                            <Share className="h-4 w-4" />
                                                            <span className="text-sm">Share</span>
                                                        </Button>
                                                    </div>
                                                    {announcement.attachments.length > 0 && (
                                                        <div className="text-xs text-gray-500 dark:text-gray-400">
                                                            {announcement.attachments.length} photo{announcement.attachments.length > 1 ? 's' : ''}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                );
                            })
                        )}
                    </div>

                    {/* Create Modal */}
                    <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
                        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto border-0 shadow-2xl">
                            <DialogHeader className="border-b border-gray-100 dark:border-gray-700 pb-4">
                                <DialogTitle className="text-center text-lg font-semibold">Create Announcement</DialogTitle>
                            </DialogHeader>
                            <AnnouncementForm mode="create" onClose={() => setShowCreateModal(false)} auth={auth} />
                        </DialogContent>
                    </Dialog>

                    {/* Edit Modal */}
                    <Dialog open={showEditModal} onOpenChange={setShowEditModal}>
                        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto border-0 shadow-2xl">
                            <DialogHeader className="border-b border-gray-100 dark:border-gray-700 pb-4">
                                <DialogTitle className="text-center text-lg font-semibold">Edit Announcement</DialogTitle>
                            </DialogHeader>
                            {selectedAnnouncement && (
                                <AnnouncementForm mode="edit" announcement={selectedAnnouncement} onClose={() => setShowEditModal(false)} auth={auth} />
                            )}
                        </DialogContent>
                    </Dialog>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}