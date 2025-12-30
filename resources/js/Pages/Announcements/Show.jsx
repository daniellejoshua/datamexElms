import React from 'react';
import { Head, Link, router } from '@inertiajs/react';
import { format } from 'date-fns';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Button } from '@/Components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar, User, ArrowLeft, Edit, Trash2, Download, Paperclip } from 'lucide-react';
import { useEffect } from 'react';

export default function Show({ announcement, auth }) {
    const getPriorityColor = (priority) => {
        switch (priority) {
            case 'urgent': return 'destructive';
            case 'high': return 'destructive';
            case 'medium': return 'default';
            case 'low': return 'secondary';
            default: return 'default';
        }
    };

    const getVisibilityLabel = (visibility) => {
        switch (visibility) {
            case 'all_users': return 'All Users';
            case 'teachers_only': return 'Teachers Only';
            case 'students_only': return 'Students Only';
            default: return 'All Users';
        }
    };

    const canEdit = auth.user.role === 'head_teacher';
    const canDelete = auth.user.role === 'head_teacher';

    // Mark as read when component mounts
    useEffect(() => {
        if (!announcement.is_read) {
            router.post(route('announcements.mark-read', announcement.id), {}, {
                preserveScroll: true,
            });
        }
    }, [announcement.id, announcement.is_read]);

    const handleDelete = () => {
        if (confirm('Are you sure you want to delete this announcement?')) {
            router.delete(route('announcements.destroy', announcement.id));
        }
    };

    return (
        <AuthenticatedLayout
            header={
                <div className="flex justify-between items-center">
                    <div className="flex items-center gap-4">
                        <Link href={route('announcements.index')}>
                            <Button variant="outline" size="sm">
                                <ArrowLeft className="h-4 w-4 mr-2" />
                                Back to Announcements
                            </Button>
                        </Link>
                        <h2 className="font-semibold text-xl text-gray-800 dark:text-gray-200 leading-tight">
                            Announcement Details
                        </h2>
                    </div>
                    <div className="flex gap-2">
                        {canEdit && (
                            <Link href={route('announcements.edit', announcement.id)}>
                                <Button variant="outline" size="sm">
                                    <Edit className="h-4 w-4 mr-2" />
                                    Edit
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
            }
        >
            <Head title={announcement.title} />

            <div className="py-12">
                <div className="max-w-4xl mx-auto sm:px-6 lg:px-8">
                    <Card>
                        <CardHeader>
                            <div className="flex items-start justify-between mb-4">
                                <CardTitle className="text-2xl mb-2">
                                    {announcement.title}
                                </CardTitle>
                                <div className="flex flex-col gap-2">
                                    <Badge variant={getPriorityColor(announcement.priority)}>
                                        {announcement.priority}
                                    </Badge>
                                    <Badge variant="outline">
                                        {getVisibilityLabel(announcement.visibility)}
                                    </Badge>
                                </div>
                            </div>
                            <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                                <div className="flex items-center gap-1">
                                    <User className="h-4 w-4" />
                                    <span>{announcement.creator.name}</span>
                                </div>
                                <div className="flex items-center gap-1">
                                    <Calendar className="h-4 w-4" />
                                    <span>{format(new Date(announcement.published_at), 'MMMM dd, yyyy \'at\' h:mm a')}</span>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="prose prose-lg dark:prose-invert max-w-none mb-6">
                                <div className="whitespace-pre-wrap text-gray-700 dark:text-gray-300">
                                    {announcement.content}
                                </div>
                            </div>

                            {announcement.attachments && announcement.attachments.length > 0 && (
                                <div className="border-t pt-6">
                                    <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                                        <Paperclip className="h-5 w-5" />
                                        Attachments
                                    </h3>
                                    <div className="space-y-2">
                                        {announcement.attachments.map((attachment) => (
                                            <div key={attachment.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                                                <div className="flex items-center gap-3">
                                                    <Paperclip className="h-4 w-4 text-gray-500" />
                                                    <div>
                                                        <p className="font-medium text-sm">{attachment.original_name}</p>
                                                        <p className="text-xs text-gray-500">
                                                            {(attachment.file_size / 1024).toFixed(1)} KB • {attachment.download_count} downloads
                                                        </p>
                                                    </div>
                                                </div>
                                                <Link
                                                    href={route('announcements.download-attachment', [announcement.id, attachment.id])}
                                                    className="text-blue-600 dark:text-blue-400 hover:underline"
                                                >
                                                    <Download className="h-4 w-4" />
                                                </Link>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}