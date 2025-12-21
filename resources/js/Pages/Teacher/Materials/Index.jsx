import React, { useState } from 'react';
import { Head, Link, useForm, router } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { toast } from 'sonner';
import { 
    BookOpen, 
    Upload, 
    Download, 
    FileText, 
    Calendar, 
    Users, 
    Trash2,
    Plus,
    AlertCircle,
    School,
    Clock,
    Eye,
    File,
    ArrowLeft
} from 'lucide-react';

export default function MaterialsIndex({ section, materials, sectionSubject }) {
    const [showUploadDialog, setShowUploadDialog] = useState(false);
    const [isDragOver, setIsDragOver] = useState(false);
    const fileInputRef = React.useRef(null);

    const { data, setData, post, processing, errors, reset } = useForm({
        title: '',
        description: '',
        file: null,
        category: 'lecture',
        visibility: 'all_students', // Always set to all_students
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        post(route('teacher.materials.store', section.id), {
            onSuccess: () => {
                reset();
                setShowUploadDialog(false);
                toast.success('Learning material uploaded successfully!');
            },
        });
    };

    // Drag and drop handlers
    const handleDragOver = (e) => {
        e.preventDefault();
        setIsDragOver(true);
    };

    const handleDragLeave = (e) => {
        e.preventDefault();
        setIsDragOver(false);
    };

    const handleDrop = (e) => {
        e.preventDefault();
        setIsDragOver(false);
        
        const files = e.dataTransfer.files;
        if (files.length > 0) {
            const file = files[0];
            setData('file', file);
            
            // Update the file input to show the selected file
            if (fileInputRef.current) {
                // Create a new DataTransfer object to set the files
                const dt = new DataTransfer();
                dt.items.add(file);
                fileInputRef.current.files = dt.files;
            }
        }
    };

    const handleFileChange = (e) => {
        setData('file', e.target.files[0]);
    };

    const handleDelete = (materialId) => {
        if (confirm('Are you sure you want to delete this material?')) {
            router.delete(route('teacher.materials.destroy', [section.id, materialId]));
        }
    };

    const getCategoryColor = (category) => {
        const colors = {
            lecture: 'bg-blue-100 text-blue-800',
            assignment: 'bg-orange-100 text-orange-800',
            reading: 'bg-green-100 text-green-800',
            other: 'bg-gray-100 text-gray-800'
        };
        return colors[category] || colors.other;
    };

    const getFileIcon = (fileType) => {
        const types = {
            pdf: '📄',
            doc: '📝', docx: '📝',
            ppt: '📊', pptx: '📊',
            xls: '📊', xlsx: '📊',
            txt: '📄',
            jpg: '🖼️', jpeg: '🖼️', png: '🖼️'
        };
        return types[fileType] || '📁';
    };

    // Create simplified section name format
    const getSimplifiedSectionName = () => {
        // Format: ProgramCode-YearLevel+SectionIdentifier (e.g., "BSIT-3D", "ABM-12A")
        const programCode = section.program?.program_code || 'N/A';
        const yearLevel = section.year_level || '';
        
        // Get identifier (usually the letter part like A, B, C, D)
        const identifierMatch = section.section_name.match(/([A-Za-z]+)$/);
        const identifier = identifierMatch ? identifierMatch[1].toUpperCase() : '';
        
        if (yearLevel && identifier) {
            return `${programCode}-${yearLevel}${identifier}`;
        } else if (identifier) {
            return `${programCode}-${identifier}`;
        }
        
        // Fallback to original section name if parsing fails
        return section.section_name;
    };

    return (
        <AuthenticatedLayout
            header={
                <div className="flex items-center gap-3">
                    <Button
                        asChild
                        variant="ghost"
                        size="sm"
                        className="text-gray-600 hover:text-gray-900"
                    >
                        <Link href={route('teacher.sections.college')}>
                            <ArrowLeft className="w-4 h-4 mr-1" />
                            Back to Sections
                        </Link>
                    </Button>
                    <div className="h-6 w-px bg-gray-300"></div>
                  
                    <div>
                        <h2 className="text-2xl font-bold text-gray-900">{sectionSubject.subject.subject_name}</h2>
                        <p className="text-sm text-blue-600">{getSimplifiedSectionName()} • {sectionSubject.subject.subject_code} • Learning Materials</p>
                    </div>
                </div>
            }
        >
            <Head title={`Materials - ${getSimplifiedSectionName()}`} />
            
            <div className="p-6">
                {/* Section Header with Add Button */}
                <div className="flex items-right justify-end mb-6">
                  
                    <Button 
                        onClick={() => setShowUploadDialog(true)}
                        className="bg-blue-600 hover:bg-blue-700 text-white"
                    >
                        <Plus className="w-4 h-4 mr-2" />
                        Add Material
                    </Button>
                </div>

                {/* Upload Modal */}
                {showUploadDialog && (
                    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
                        <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
                            <div className="flex items-center justify-between p-6 border-b">
                                <div>
                                    <h2 className="text-xl font-bold text-gray-900">Upload Learning Material</h2>
                                    <p className="text-gray-500 text-sm mt-1">Share resources with {getSimplifiedSectionName()}</p>
                                </div>
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => setShowUploadDialog(false)}
                                    className="text-gray-400 hover:text-gray-600 h-8 w-8 p-0"
                                >
                                    ✕
                                </Button>
                            </div>
                            <form onSubmit={handleSubmit} className="p-6">
                                <div className="space-y-5">
                                    {/* Title Field */}
                                    <div>
                                        <Label htmlFor="title" className="text-sm font-medium text-gray-700 mb-2 block">Material Title *</Label>
                                        <Input
                                            id="title"
                                            value={data.title}
                                            onChange={(e) => setData('title', e.target.value)}
                                            placeholder="e.g., Chapter 1: Introduction to Programming"
                                            required
                                            className="w-full focus:ring-2 focus:ring-blue-500 focus:border-blue-500 border-gray-300 rounded-md"
                                        />
                                        {errors.title && <p className="text-red-500 text-sm mt-1">{errors.title}</p>}
                                    </div>

                                    {/* Description Field */}
                                    <div>
                                        <Label htmlFor="description" className="text-sm font-medium text-gray-700 mb-2 block">Description (Optional)</Label>
                                        <textarea
                                            id="description"
                                            value={data.description}
                                            onChange={(e) => setData('description', e.target.value)}
                                            placeholder="Brief description of what students will learn..."
                                            rows={3}
                                            className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 placeholder:text-gray-400"
                                        />
                                        {errors.description && <p className="text-red-500 text-sm mt-1">{errors.description}</p>}
                                    </div>

                                    {/* Category */}
                                    <div>
                                        <Label htmlFor="category" className="text-sm font-medium text-gray-700 mb-2 block">Category</Label>
                                        <Select value={data.category} onValueChange={(value) => setData('category', value)}>
                                            <SelectTrigger className="focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="lecture">📚 Lecture</SelectItem>
                                                <SelectItem value="assignment">📝 Assignment</SelectItem>
                                                <SelectItem value="reading">📖 Reading</SelectItem>
                                                <SelectItem value="other">📁 Other</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    {/* File Upload */}
                                    <div>
                                        <Label htmlFor="file" className="text-sm font-medium text-gray-700 mb-2 block">Upload File *</Label>
                                        <div 
                                            className={`border-2 border-dashed rounded-lg p-6 transition-all duration-200 ${
                                                isDragOver 
                                                    ? 'border-blue-500 bg-blue-50' 
                                                    : 'border-gray-300 hover:border-blue-400'
                                            }`}
                                            onDragOver={handleDragOver}
                                            onDragLeave={handleDragLeave}
                                            onDrop={handleDrop}
                                        >
                                            <div className="text-center">
                                                <div className={`mx-auto w-12 h-12 mb-4 rounded-full flex items-center justify-center ${
                                                    isDragOver ? 'bg-blue-100' : 'bg-gray-100'
                                                }`}>
                                                    <Upload className={`w-6 h-6 ${
                                                        isDragOver ? 'text-blue-600' : 'text-gray-400'
                                                    }`} />
                                                </div>
                                                <div className="space-y-2">
                                                    <p className={`text-sm font-medium ${
                                                        isDragOver ? 'text-blue-700' : 'text-gray-700'
                                                    }`}>
                                                        {isDragOver ? 'Drop your file here' : 'Drag & drop your file here, or click to browse'}
                                                    </p>
                                                    <Input
                                                        ref={fileInputRef}
                                                        id="file"
                                                        type="file"
                                                        onChange={handleFileChange}
                                                        accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.txt,.jpg,.jpeg,.png"
                                                        required={!data.file}
                                                        className="w-full border-0 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 cursor-pointer"
                                                    />
                                                </div>
                                                {errors.file && <p className="text-red-500 text-sm mt-2">{errors.file}</p>}
                                                {data.file && (
                                                    <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-md">
                                                        <div className="flex items-center text-sm text-green-700">
                                                            <File className="w-4 h-4 mr-2" />
                                                            <span className="font-medium">Selected:</span>
                                                            <span className="ml-2 truncate">{data.file.name}</span>
                                                        </div>
                                                    </div>
                                                )}
                                                <div className="mt-3 p-3 bg-gray-50 rounded-md">
                                                    <div className="flex items-center text-xs text-gray-600">
                                                        <span className="font-medium">📁 Supported formats:</span>
                                                        <span className="ml-2">PDF, DOC, PPT, XLS, TXT, Images</span>
                                                    </div>
                                                    <div className="flex items-center text-xs text-gray-600 mt-1">
                                                        <span className="font-medium">📏 Max size:</span>
                                                        <span className="ml-2">10MB</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Footer */}
                                <div className="flex items-center justify-end gap-3 pt-6 mt-6 border-t border-gray-200">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={() => setShowUploadDialog(false)}
                                        className="px-4 py-2 text-gray-700 border-gray-300 hover:bg-gray-50"
                                        disabled={processing}
                                    >
                                        Cancel
                                    </Button>
                                    <Button 
                                        type="submit" 
                                        disabled={processing}
                                        className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        {processing ? (
                                            <>
                                                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                                                Uploading...
                                            </>
                                        ) : (
                                            <>
                                                <Upload className="w-4 h-4 mr-2" />
                                                Upload Material
                                            </>
                                        )}
                                    </Button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {/* Materials Grid */}
                {materials.length > 0 ? (
                    <>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                            {materials.map((material) => (
                                <Card key={material.id} className="group hover:shadow-lg transition-all duration-300 border-gray-200 hover:border-blue-300">
                                    {/* Header */}
                                    <CardHeader className="pb-3">
                                        <div className="flex items-start justify-between">
                                            <div className="flex items-center gap-3 flex-1 min-w-0">
                                                <div className="bg-blue-50 group-hover:bg-blue-100 p-2 rounded-lg transition-colors border border-blue-200">
                                                    <div className="text-blue-600 text-sm font-bold">{getFileIcon(material.file_type)}</div>
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <CardTitle className="text-sm font-semibold text-gray-900 group-hover:text-blue-700 truncate transition-colors">
                                                        {material.title}
                                                    </CardTitle>
                                                    <CardDescription className="text-gray-600 text-xs truncate mt-0.5">
                                                        {material.original_name}
                                                    </CardDescription>
                                                </div>
                                            </div>
                                            <Badge className={`${getCategoryColor(material.category)} text-xs font-medium shrink-0`}>
                                                {material.category}
                                            </Badge>
                                        </div>
                                    </CardHeader>

                                    {/* Content */}
                                    <CardContent className="space-y-4">
                                        {/* Description */}
                                        {material.description && (
                                            <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg border-l-4 border-blue-500">
                                                <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed line-clamp-3">
                                                    {material.description}
                                                </p>
                                            </div>
                                        )}

                                        {/* Material Info */}
                                        <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                                            <div className="flex items-center gap-1">
                                                <Calendar className="w-4 h-4" />
                                                <span>{new Date(material.upload_date).toLocaleDateString('en-US', { 
                                                    month: 'short', 
                                                    day: 'numeric',
                                                    year: 'numeric' 
                                                })}</span>
                                            </div>
                                            <div className="flex items-center gap-1">
                                                <File className="w-4 h-4" />
                                                <span className="font-medium">{material.formatted_file_size}</span>
                                            </div>
                                        </div>

                                        {/* Action Buttons */}
                                        <div className="flex gap-2 pt-2">
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                asChild
                                                className="flex-1 text-sm font-medium"
                                            >
                                                <Link href={route('teacher.materials.download', [section.id, material.id])}>
                                                    <Download className="w-4 h-4 mr-2" />
                                                    Download
                                                </Link>
                                            </Button>
                                            <Button
                                                size="sm"
                                                variant="destructive"
                                                onClick={() => handleDelete(material.id)}
                                                className="px-3"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </Button>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>

                        {/* Pagination placeholder */}
                        {materials.length > 12 && (
                            <div className="text-center">
                                <p className="text-sm text-gray-500">Showing {materials.length} materials</p>
                            </div>
                        )}
                    </>
                ) : (
                    <Card className="p-8 text-center">
                        <div className="flex flex-col items-center gap-4">
                            <div className="bg-gray-100 p-4 rounded-full">
                                <FileText className="w-8 h-8 text-gray-500" />
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-gray-900 mb-2">
                                    No materials uploaded yet
                                </h3>
                                <p className="text-gray-600 mb-4 max-w-sm mx-auto text-sm">
                                    Start sharing learning materials with your students.
                                </p>
                                <Button 
                                    onClick={() => setShowUploadDialog(true)}
                                    className="bg-blue-600 hover:bg-blue-700 text-white"
                                >
                                    <Plus className="w-4 h-4 mr-2" />
                                    Upload Material
                                </Button>
                            </div>
                        </div>
                    </Card>
                )}
            </div>
        </AuthenticatedLayout>
    );
}