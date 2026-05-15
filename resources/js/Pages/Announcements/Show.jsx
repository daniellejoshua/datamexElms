import React from 'react';
import { Head, Link, router } from '@inertiajs/react';
import { route } from 'ziggy-js';
import { format } from 'date-fns';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Button } from '@/Components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Calendar, User, ArrowLeft, Edit, Trash2, Download, Paperclip, Clock, Eye, Share2, Bookmark, Newspaper, AlertTriangle, TrendingUp, Info, Users, GraduationCap, ArrowRight, MoreVertical, Shield, UserCheck, Briefcase } from 'lucide-react';
import { useEffect, useState } from 'react';
import AnnouncementForm from './AnnouncementFormNew';

export default function Show({ announcement, recentAnnouncements, auth, readStats }) {
    const [deleting, setDeleting] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
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

    const canEdit = auth.user.role === 'head_teacher';
    const canDelete = auth.user.role === 'head_teacher';

    const getInitials = (name) => {
        return name.split(' ').map(n => n[0]).join('').toUpperCase();
    };

    // Mark as read when component mounts (silent operation)
    useEffect(() => {
        if (!announcement.is_read) {
            fetch(route('announcements.mark-read', announcement.id), {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').getAttribute('content'),
                    'X-Requested-With': 'XMLHttpRequest',
                },
                body: JSON.stringify({}),
            }).catch(() => {
                // Silent error handling
            });
        }
    }, [announcement.id, announcement.is_read]);

    const handleCardClick = (item) => {
        // Navigate to the show page for this announcement
        window.location.href = route('announcements.show', item.id);
    };

    const handleDelete = () => {
        if (confirm('Are you sure you want to delete this article?')) {
            setDeleting(true);
            fetch(route('announcements.destroy', announcement.id), {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').getAttribute('content'),
                    'X-Requested-With': 'XMLHttpRequest',
                },
            })
            .then(() => {
                // Redirect to index after successful delete
                window.location.href = route('announcements.index');
            })
            .catch(() => {
                setDeleting(false);
                alert('Failed to delete the announcement. Please try again.');
            });
        }
    };;;

    return (
        <AuthenticatedLayout
            header={
                <div className="flex items-center justify-between px-2 py-1">
                    <div className="flex items-center gap-2">
                        <Link href={route('announcements.index')}>
                            <Button variant="ghost" size="sm" className="text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200">
                                <ArrowLeft className="h-4 w-4 mr-2" />
                                Back to Announcements
                            </Button>
                        </Link>
                        <div className="bg-blue-100 p-1.5 rounded-md">
                            <Newspaper className="w-4 h-4 text-blue-600" />
                        </div>
                        <h2 className="font-semibold text-gray-900 dark:text-white">Campus Announcements</h2>
                    </div>
                </div>
            }
        >
            <Head title={announcement.title} />

            <div className="min-h-screen bg-gray-50 dark:bg-gray-900">

                <div className="max-w-3xl mx-auto px-4 py-6">
                    <article className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
                        {/* Article Header */}
                        <header className="p-4 pb-3">
                            {/* Article Meta */}
                            <div className="flex items-center justify-between mb-6">
                                <div className="flex items-center space-x-3">
                                    <Avatar className="w-10 h-10">
                                        <AvatarImage src={announcement.creator.profile_picture} />
                                        <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white font-semibold">
                                            {getInitials(announcement.creator.name)}
                                        </AvatarFallback>
                                    </Avatar>
                                    <div>
                                        <h3 className="font-semibold text-gray-900 dark:text-gray-100">
                                            {announcement.creator.name}
                                        </h3>
                                        <div className="flex items-center space-x-2 text-sm text-gray-500 dark:text-gray-400">
                                            <Calendar className="h-4 w-4" />
                                            <time dateTime={announcement.published_at || announcement.scheduled_at}>
                                                {new Date(announcement.published_at || announcement.scheduled_at).toLocaleDateString('en-US', { 
                                                    year: 'numeric', 
                                                    month: 'long', 
                                                    day: 'numeric',
                                                    timeZone: 'Asia/Manila'
                                                })}
                                            </time>
                                            <span>•</span>
                                            <Clock className="h-4 w-4" />
                                            <span>{new Date(announcement.published_at || announcement.scheduled_at).toLocaleTimeString('en-US', { 
                                                hour: 'numeric', 
                                                minute: '2-digit',
                                                hour12: true,
                                                timeZone: 'Asia/Manila'
                                            })}
                                            {announcement.updated_at && new Date(announcement.updated_at) > new Date(announcement.created_at) && (
                                                <span className="ml-1 text-gray-400 dark:text-gray-500">(edited)</span>
                                            )}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-center space-x-3">
                                    <Badge
                                        variant="outline"
                                        className="text-xs border-gray-300 dark:border-gray-600 flex items-center space-x-1"
                                    >
                                        {getVisibilityIcon(announcement.visibility)}
                                        <span>{announcement.visibility.replace('_', ' ')}</span>
                                    </Badge>
                                    <div className={`flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium ${announcement.priority === 'urgent' ? 'text-white' : announcement.priority === 'medium' ? 'text-gray-900' : 'text-black'} ${getPriorityColor(announcement.priority)}`}>
                                        {getPriorityIcon(announcement.priority)}
                                        <span className="capitalize">{announcement.priority}</span>
                                    </div>
                                    {announcement.is_expired && (
                                        <Badge className="bg-gray-600 text-white border-0 font-medium">
                                            Expired
                                        </Badge>
                                    )}
                                    {!announcement.is_scheduled && !announcement.is_expired && announcement.is_published && (
                                        <Badge className="bg-green-600 text-white border-0 font-medium">
                                            Published
                                        </Badge>
                                    )}
                                    {(canEdit || canDelete) && (
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                                    <MoreVertical className="h-4 w-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                {canEdit && (
                                                    <DropdownMenuItem onClick={() => setShowEditModal(true)} className="flex items-center">
                                                        <Edit className="h-4 w-4 mr-2" />
                                                        Edit Article
                                                    </DropdownMenuItem>
                                                )}
                                                {canDelete && (
                                                    <DropdownMenuItem onClick={handleDelete} className="text-red-600" disabled={deleting}>
                                                        <Trash2 className="h-4 w-4 mr-2" />
                                                        {deleting ? 'Deleting...' : 'Delete'}
                                                    </DropdownMenuItem>
                                                )}
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    )}
                                </div>
                            </div>

                            {/* Article Title */}
                            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-gray-100 mb-4 font-serif leading-tight">
                                {announcement.title}
                            </h1>
                        </header>

                        {/* Article Content */}
                        <div className="px-4 pb-6">
                            <div className="prose prose-lg dark:prose-invert max-w-none">
                                <div className="text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-wrap text-base font-light">
                                    {announcement.content}
                                </div>
                            </div>
                        </div>

                        {/* Featured Image */}
                        {announcement.attachments && announcement.attachments.length > 0 && (
                            <div className="px-4 pb-4">
                                <div className="relative rounded-lg overflow-hidden shadow-lg">
                                    <img
                                        src={announcement.attachments[0].cloudinary_url}
                                        alt={announcement.title}
                                        className="w-full h-64 md:h-80 object-cover"
                                        loading="lazy"
                                    />
                                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent p-6">
                                        <div className="flex items-center space-x-2 mb-2">
                                            <Badge className="bg-white/20 text-white border-white/30 backdrop-blur-sm">
                                                Featured Image
                                            </Badge>
                                            {announcement.attachments.length > 1 && (
                                                <Badge variant="secondary" className="bg-black/60 text-white border-0">
                                                    +{announcement.attachments.length - 1} more images
                                                </Badge>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Additional Images Gallery */}
                        {announcement.attachments && announcement.attachments.length > 1 && (
                            <div className="px-4 pb-6">
                                <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-4 font-serif">
                                    Article Gallery
                                </h3>
                                <div className={`grid gap-4 rounded-lg overflow-hidden ${
                                    announcement.attachments.length === 2 ? 'grid-cols-2' :
                                    announcement.attachments.length === 3 ? 'grid-cols-3' :
                                    'grid-cols-2 md:grid-cols-3'
                                }`}>
                                    {announcement.attachments.slice(1).map((attachment, index) => (
                                        <div key={attachment.id} className="relative group">
                                            <img
                                                src={attachment.cloudinary_url}
                                                alt={attachment.original_name}
                                                className="w-full h-48 object-cover rounded-lg cursor-pointer hover:brightness-95 transition-all shadow-md"
                                                loading="lazy"
                                                onClick={() => window.open(attachment.cloudinary_url, '_blank')}
                                            />
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Article Footer */}
                        <footer className="px-4 py-4 bg-gray-50 dark:bg-gray-700/50 border-t border-gray-100 dark:border-gray-600">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-6 text-sm text-gray-600 dark:text-gray-400">
                                    {announcement.attachments && announcement.attachments.length > 0 && (
                                        <span className="flex items-center space-x-1">
                                            <Paperclip className="h-4 w-4" />
                                            <span>{announcement.attachments.length} image{announcement.attachments.length > 1 ? 's' : ''}</span>
                                        </span>
                                    )}
                                    {announcement.is_read && (
                                        <span className="flex items-center space-x-1 text-green-600 dark:text-green-400">
                                            <Eye className="h-4 w-4" />
                                            <span>Read</span>
                                        </span>
                                    )}
                                </div>

                                <div className="flex items-center space-x-2">
                                    {announcement.is_scheduled ? (
                                        <div className="flex items-center space-x-1 text-blue-600 dark:text-blue-400">
                                            <Clock className="h-4 w-4" />
                                            <span className="text-sm">
                                                Scheduled for {new Date(announcement.scheduled_at).toLocaleDateString('en-US', { 
                                                    timeZone: 'Asia/Manila',
                                                    month: 'short', 
                                                    day: 'numeric',
                                                    year: 'numeric'
                                                })} at {new Date(announcement.scheduled_at).toLocaleTimeString('en-US', { 
                                                    timeZone: 'Asia/Manila',
                                                    hour: 'numeric',
                                                    minute: '2-digit',
                                                    hour12: true
                                                })}
                                            </span>
                                        </div>
                                    ) : announcement.expires_at && !announcement.is_expired ? (
                                        <div className="flex items-center space-x-1 text-gray-600 dark:text-gray-400">
                                            <Clock className="h-4 w-4" />
                                            <span className="text-sm">
                                                Expires {new Date(announcement.expires_at).toLocaleDateString('en-US', { 
                                                    timeZone: 'Asia/Manila',
                                                    month: 'short', 
                                                    day: 'numeric',
                                                    year: 'numeric'
                                                })} at {new Date(announcement.expires_at).toLocaleTimeString('en-US', { 
                                                    timeZone: 'Asia/Manila',
                                                    hour: 'numeric',
                                                    minute: '2-digit',
                                                    hour12: true
                                                })}
                                            </span>
                                        </div>
                                    ) : (
                                        <Button variant="ghost" size="sm" className="text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200">
                                            <Bookmark className="h-4 w-4 mr-2" />
                                            Save Article
                                        </Button>
                                    )}
                                    <Button variant="ghost" size="sm" className="text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200">
                                        <Share2 className="h-4 w-4 mr-2" />
                                        Share
                                    </Button>
                                </div>
                            </div>
                        </footer>
                    </article>

                    {/* Related Articles Section */}
                    <div className="mt-6">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-xl font-bold text-gray-900 dark:text-white font-serif">
                                More Campus Announcements
                            </h2>
                            <Link
                                href={route('announcements.index')}
                                className="inline-flex items-center space-x-2 text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 font-medium"
                            >
                                <span>View All</span>
                                <ArrowRight className="h-4 w-4" />
                            </Link>
                        </div>

                        {recentAnnouncements && recentAnnouncements.length > 0 ? (
                            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                                {recentAnnouncements.map((item) => (
                                    <div key={item.id} onClick={() => handleCardClick(item)} className="cursor-pointer">
                                        <Card className="hover:shadow-md transition-shadow border border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-600 overflow-hidden relative">
                                            {/* Unread Badge */}
                                            {!item.is_read && (
                                                <div className="absolute top-3 right-3 z-10">
                                                    <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                                                </div>
                                            )}
                                            {/* Featured Image or Placeholder */}
                                            {item.attachments && item.attachments.length > 0 ? (
                                                <div className="aspect-video overflow-hidden">
                                                    <img
                                                        src={item.attachments[0].cloudinary_url}
                                                        alt={item.title}
                                                        className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                                                        loading="lazy"
                                                        onError={(e) => {
                                                            e.target.style.display = 'none';
                                                        }}
                                                    />
                                                </div>
                                            ) : (
                                                <div className="aspect-video bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-700 flex items-center justify-center">
                                                    <div className="text-center">
                                                        <Newspaper className="w-8 h-8 text-gray-400 dark:text-gray-500 mx-auto mb-2" />
                                                        <p className="text-xs text-gray-500 dark:text-gray-400">No image</p>
                                                    </div>
                                                </div>
                                            )}
                                            <CardContent className="p-4">
                                                <div className="flex items-start space-x-3">
                                                    <div className="flex-shrink-0">
                                                        <div className={`w-2 h-2 rounded-full mt-2 ${getPriorityColor(item.priority)}`}></div>
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-1 line-clamp-2 leading-tight">
                                                            {item.title}
                                                        </h3>
                                                        <div className="flex items-center space-x-2 text-xs text-gray-500 dark:text-gray-400">
                                                            <Calendar className="h-3 w-3" />
                                                            <time dateTime={item.published_at}>
                                                                {new Date(item.published_at).toLocaleDateString('en-US', { month: 'short', day: '2-digit' })}
                                                            </time>
                                                            {item.priority && (
                                                                <>
                                                                    <span>•</span>
                                                                    <span className="capitalize">{item.priority}</span>
                                                                </>
                                                            )}
                                                        </div>
                                                       
                                                    </div>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-8">
                                <Newspaper className="w-12 h-12 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
                                <p className="text-gray-500 dark:text-gray-400">No other announcements available</p>
                            </div>
                        )}
                    </div>

                    {/* Attachments Section */}
                    {announcement.attachments && announcement.attachments.length > 0 && (
                        <Card className="mt-4 bg-white dark:bg-gray-800 shadow-sm border border-gray-200 dark:border-gray-700">
                            <CardHeader>
                                <CardTitle className="text-xl font-serif flex items-center space-x-2">
                                    <Paperclip className="h-5 w-5" />
                                    <span>Article Resources</span>
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-3">
                                    {announcement.attachments.map((attachment) => (
                                        <div key={attachment.id} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                                            <div className="flex items-center space-x-3">
                                                <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/50 rounded-lg flex items-center justify-center">
                                                    <Paperclip className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                                                </div>
                                                <div>
                                                    <p className="font-medium text-gray-900 dark:text-gray-100">
                                                        {attachment.original_name}
                                                    </p>
                                                    <p className="text-sm text-gray-500 dark:text-gray-400">
                                                        {(attachment.file_size / 1024).toFixed(1)} KB • {attachment.download_count || 0} downloads
                                                    </p>
                                                </div>
                                            </div>
                                            <Link
                                                href={route('announcements.download-attachment', [announcement.id, attachment.id])}
                                                className="inline-flex items-center space-x-2 text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 font-medium"
                                            >
                                                <Download className="h-4 w-4" />
                                                <span>Download</span>
                                            </Link>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    )}
                </div>
            </div>

            {/* Edit Modal */}
            <Dialog open={showEditModal} onOpenChange={setShowEditModal}>
                <DialogContent className="max-w-3xl max-h-[90vh] overflow-hidden border border-gray-200 dark:border-gray-700 shadow-xl bg-white dark:bg-gray-900">
                    <DialogHeader className="border-b border-gray-200 dark:border-gray-700 pb-4">
                        <DialogTitle className="text-xl font-semibold flex items-center space-x-2 text-gray-900 dark:text-white">
                            <Edit className="h-5 w-5" />
                            <span>Edit Announcement</span>
                        </DialogTitle>
                    </DialogHeader>
                    <div className="overflow-y-auto max-h-[calc(90vh-120px)]">
                        <AnnouncementForm mode="edit" announcement={announcement} onClose={() => setShowEditModal(false)} auth={auth} />
                    </div>
                </DialogContent>
            </Dialog>
        </AuthenticatedLayout>
    );
}