import React, { useState, useEffect } from 'react';
import { router } from '@inertiajs/react';
import { route } from 'ziggy-js';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
    FileText, 
    Download,
    Calendar,
    User,
    BookOpen,
    File,
    Image,
    Video,
    Archive,
    ExternalLink,
    Eye
} from 'lucide-react';

export default function MaterialsModal({ isOpen, onClose, subject }) {
    if (!subject) return null;

    // Materials data - this would come from props or API in real implementation
    const materials = subject?.materials || [];

    // Mark materials as viewed when modal opens
    useEffect(() => {
        if (isOpen && materials.length > 0) {
            materials.forEach(material => {
                if (material.isNew) {
                    // Mark material as viewed
                    router.post(route('student.materials.mark-viewed', material.id), {}, {
                        preserveState: true,
                        preserveScroll: true,
                        onSuccess: () => {
                            // Material has been marked as viewed
                            console.log('Material marked as viewed:', material.title);
                        }
                    });
                }
            });
        }
    }, [isOpen, materials]);

    const getFileIcon = (type) => {
        switch (type?.toLowerCase()) {
            case 'pdf':
                return <FileText className="w-5 h-5 text-red-500" />;
            case 'doc':
            case 'docx':
                return <File className="w-5 h-5 text-blue-500" />;
            case 'ppt':
            case 'pptx':
                return <File className="w-5 h-5 text-orange-500" />;
            case 'jpg':
            case 'jpeg':
            case 'png':
            case 'gif':
                return <Image className="w-5 h-5 text-green-500" />;
            case 'mp4':
            case 'avi':
            case 'mov':
            case 'video':
                return <Video className="w-5 h-5 text-purple-500" />;
            case 'zip':
            case 'rar':
                return <Archive className="w-5 h-5 text-gray-500" />;
            default:
                return <File className="w-5 h-5 text-gray-500" />;
        }
    };

    const getFileTypeColor = (type) => {
        switch (type?.toLowerCase()) {
            case 'pdf':
                return 'bg-red-100 text-red-800';
            case 'doc':
            case 'docx':
                return 'bg-blue-100 text-blue-800';
            case 'ppt':
            case 'pptx':
                return 'bg-orange-100 text-orange-800';
            case 'jpg':
            case 'jpeg':
            case 'png':
            case 'gif':
                return 'bg-green-100 text-green-800';
            case 'mp4':
            case 'avi':
            case 'mov':
            case 'video':
                return 'bg-purple-100 text-purple-800';
            case 'zip':
            case 'rar':
                return 'bg-gray-100 text-gray-800';
            default:
                return 'bg-gray-100 text-gray-800';
        }
    };

    const formatFileSize = (size) => {
        return size || 'Unknown size';
    };

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    const handleDownload = (material) => {
        // Open download link in new tab
        window.open(material.downloadUrl, '_blank');
    };

    const handlePreview = (material) => {
        // For now, preview just opens the download URL
        // In the future, this could show a preview modal for PDFs, images, etc.
        window.open(material.downloadUrl, '_blank');
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-3">
                        <div className="bg-gradient-to-br from-blue-500 to-blue-600 p-2 rounded-lg">
                            <FileText className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <span className="text-xl font-bold">Course Materials</span>
                            <p className="text-sm text-gray-600 font-normal mt-1">
                                {subject.subject_code} - {subject.subject_name}
                            </p>
                        </div>
                    </DialogTitle>
                    <DialogDescription>
                        Access all course materials, documents, and resources
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-6">
                    {/* Subject Info */}
                    <Card>
                        <CardHeader className="pb-3">
                            <CardTitle className="text-lg flex items-center gap-2">
                                <BookOpen className="w-5 h-5 text-blue-600" />
                                Subject Information
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                                <div>
                                    <span className="text-gray-600">Subject:</span>
                                    <p className="font-medium">{subject.subject_name}</p>
                                </div>
                                <div>
                                    <span className="text-gray-600">Code:</span>
                                    <p className="font-medium">{subject.subject_code}</p>
                                </div>
                                <div>
                                    <span className="text-gray-600">Instructor:</span>
                                    <p className="font-medium flex items-center gap-1">
                                        <User className="w-3 h-3" />
                                        {subject.teacher_name}
                                    </p>
                                </div>
                                <div>
                                    <span className="text-gray-600">Section:</span>
                                    <p className="font-medium">{subject.program_code}-{subject.year_level}{subject.section_name}</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Materials */}
                    {materials && materials.length > 0 ? (
                        <Card>
                            <CardHeader className="pb-3">
                                <CardTitle className="text-lg flex items-center gap-2">
                                    <FileText className="w-5 h-5 text-green-600" />
                                    Available Materials
                                    <Badge variant="secondary" className="ml-auto">
                                        {materials.length} file{materials.length !== 1 ? 's' : ''}
                                    </Badge>
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-3">
                                    {materials.map((material) => (
                                        <div key={material.id} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                                            <div className="flex items-start justify-between gap-4">
                                                <div className="flex items-start gap-3 flex-1">
                                                    <div className="mt-1">
                                                        {getFileIcon(material.type)}
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex items-center gap-2 mb-1">
                                                            <h4 className="font-medium text-gray-900 truncate">
                                                                {material.title}
                                                            </h4>
                                                            {material.isNew && (
                                                                <Badge variant="secondary" className="bg-red-100 text-red-800 text-xs">
                                                                    NEW
                                                                </Badge>
                                                            )}
                                                        </div>
                                                        {material.description && (
                                                            <p className="text-sm text-gray-600 mb-2 line-clamp-2">
                                                                {material.description}
                                                            </p>
                                                        )}
                                                        <div className="flex items-center gap-4 text-xs text-gray-500">
                                                            <Badge 
                                                                variant="secondary" 
                                                                className={`${getFileTypeColor(material.type)} text-xs`}
                                                            >
                                                                {material.type?.toUpperCase() || 'FILE'}
                                                            </Badge>
                                                            <span className="flex items-center gap-1">
                                                                <Calendar className="w-3 h-3" />
                                                                {formatDate(material.uploadDate)}
                                                            </span>
                                                            <span>{formatFileSize(material.size)}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() => handlePreview(material)}
                                                        className="text-blue-600 border-blue-300 hover:bg-blue-50"
                                                    >
                                                        <Eye className="w-3 h-3 mr-1" />
                                                        Preview
                                                    </Button>
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() => handleDownload(material)}
                                                        className="text-green-600 border-green-300 hover:bg-green-50"
                                                    >
                                                        <Download className="w-3 h-3 mr-1" />
                                                        Download
                                                    </Button>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    ) : (
                        <Card>
                            <CardContent className="p-8 text-center">
                                <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                                <h3 className="text-lg font-semibold text-gray-900 mb-2">No Materials Available</h3>
                                <p className="text-gray-600">
                                    Course materials have not been uploaded yet. Please check back later.
                                </p>
                            </CardContent>
                        </Card>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}