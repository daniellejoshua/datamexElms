import React from 'react';
import { Head, Link, router } from '@inertiajs/react';
import { format } from 'date-fns';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Button } from '@/Components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Calendar, User, ArrowLeft, Edit, Trash2, Download, Paperclip, Clock, Eye, Share2, Bookmark, Newspaper, AlertTriangle, TrendingUp, Info, Users, GraduationCap, ArrowRight } from 'lucide-react';
import { useEffect } from 'react';

export default function Show({ announcement, auth }) {
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

    const canEdit = auth.user.role === 'head_teacher';
    const canDelete = auth.user.role === 'head_teacher';

    const getInitials = (name) => {
        return name.split(' ').map(n => n[0]).join('').toUpperCase();
    };

    // Mark as read when component mounts
    useEffect(() => {
        if (!announcement.is_read) {
            router.post(route('announcements.mark-read', announcement.id), {}, {
                preserveScroll: true,
            });
        }
    }, [announcement.id, announcement.is_read]);

    const handleDelete = () => {
        if (confirm('Are you sure you want to delete this article?')) {
            router.delete(route('announcements.destroy', announcement.id));
        }
    };

    return (
        <AuthenticatedLayout>
            <Head title={announcement.title} />

            <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
                {/* News Header */}
                <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-10">
                    <div className="max-w-7xl mx-auto px-4 py-4">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-4">
                                <Link href={route('announcements.index')}>
                                    <Button variant="ghost" size="sm" className="text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200">
                                        <ArrowLeft className="h-4 w-4 mr-2" />
                                        Back to News
                                    </Button>
                                </Link>
                                <div className="h-6 w-px bg-gray-300 dark:bg-gray-600"></div>
                                <div className="flex items-center space-x-2 text-sm text-gray-500 dark:text-gray-400">
                                    <Newspaper className="h-4 w-4" />
                                    <span>Campus News</span>
                                </div>
                            </div>

                            <div className="flex items-center space-x-2">
                                {canEdit && (
                                    <Link href={route('announcements.edit', announcement.id)}>
                                        <Button variant="outline" size="sm">
                                            <Edit className="h-4 w-4 mr-2" />
                                            Edit Article
                                        </Button>
                                    </Link>
                                )}
                                {canDelete && (
                                    <Button
                                        variant="destructive"
                                        size="sm"
                                        onClick={handleDelete}
                                    >
                                        <Trash2 className="h-4 w-4 mr-2" />
                                        Delete
                                    </Button>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                <div className="max-w-4xl mx-auto px-4 py-8">
                    <article className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
                        {/* Article Header */}
                        <header className="p-8 pb-6">
                            {/* Article Meta */}
                            <div className="flex items-center justify-between mb-6">
                                <div className="flex items-center space-x-3">
                                    <Avatar className="w-12 h-12">
                                        <AvatarImage src="" />
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
                                            <time dateTime={announcement.published_at}>
                                                {format(new Date(announcement.published_at), 'MMMM dd, yyyy')}
                                            </time>
                                            <span>•</span>
                                            <Clock className="h-4 w-4" />
                                            <span>{format(new Date(announcement.published_at), 'h:mm a')}</span>
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
                                    <div className="flex items-center space-x-1">
                                        {getPriorityIcon(announcement.priority)}
                                        <span className="text-sm font-medium capitalize">{announcement.priority}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Article Title */}
                            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-gray-100 mb-6 font-serif leading-tight">
                                {announcement.title}
                            </h1>

                            {/* Article Lead */}
                            <div className="text-xl text-gray-600 dark:text-gray-400 leading-relaxed mb-8 font-light border-l-4 border-blue-500 pl-6">
                                {announcement.content.split('\n')[0].substring(0, 250)}
                                {announcement.content.length > 250 && '...'}
                            </div>
                        </header>

                        {/* Featured Image */}
                        {announcement.attachments && announcement.attachments.length > 0 && (
                            <div className="px-8 pb-6">
                                <div className="relative rounded-lg overflow-hidden shadow-lg">
                                    <img
                                        src={announcement.attachments[0].cloudinary_url}
                                        alt={announcement.title}
                                        className="w-full h-96 md:h-[500px] object-cover"
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

                        {/* Article Content */}
                        <div className="px-8 pb-8">
                            <div className="prose prose-xl dark:prose-invert max-w-none">
                                <div className="text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-wrap text-lg font-light">
                                    {announcement.content}
                                </div>
                            </div>
                        </div>

                        {/* Additional Images Gallery */}
                        {announcement.attachments && announcement.attachments.length > 1 && (
                            <div className="px-8 pb-8">
                                <h3 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-6 font-serif">
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
                        <footer className="px-8 py-6 bg-gray-50 dark:bg-gray-700/50 border-t border-gray-100 dark:border-gray-600">
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
                                    <Button variant="ghost" size="sm" className="text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200">
                                        <Bookmark className="h-4 w-4 mr-2" />
                                        Save Article
                                    </Button>
                                    <Button variant="ghost" size="sm" className="text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200">
                                        <Share2 className="h-4 w-4 mr-2" />
                                        Share
                                    </Button>
                                </div>
                            </div>
                        </footer>
                    </article>

                    {/* Related Articles Section */}
                    <div className="mt-8">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-2xl font-bold text-gray-900 dark:text-white font-serif">
                                More Campus News
                            </h2>
                            <Link
                                href={route('announcements.index')}
                                className="inline-flex items-center space-x-2 text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 font-medium"
                            >
                                <span>View All</span>
                                <ArrowRight className="h-4 w-4" />
                            </Link>
                        </div>
                        <Card className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 border-blue-200 dark:border-blue-800">
                            <CardContent className="p-8 text-center">
                                <Newspaper className="h-12 w-12 mx-auto mb-4 text-blue-600 dark:text-blue-400" />
                                <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2 font-serif">
                                    Stay Updated
                                </h3>
                                <p className="text-gray-600 dark:text-gray-400 mb-4">
                                    Check out the latest news and announcements from your institution.
                                </p>
                                <Link href={route('announcements.index')}>
                                    <Button className="bg-blue-600 hover:bg-blue-700 text-white">
                                        Browse All Articles
                                    </Button>
                                </Link>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Attachments Section */}
                    {announcement.attachments && announcement.attachments.length > 0 && (
                        <Card className="mt-6 bg-white dark:bg-gray-800 shadow-sm border border-gray-200 dark:border-gray-700">
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
        </AuthenticatedLayout>
    );
}