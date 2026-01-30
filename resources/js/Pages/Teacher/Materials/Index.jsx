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
    const [searchTerm, setSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [materialToDelete, setMaterialToDelete] = useState(null);
    const fileInputRef = React.useRef(null);

    const itemsPerPage = 8;

    const { data, setData, post, processing, errors, reset } = useForm({
        title: '',
        description: '',
        file: null,
        category: 'lecture',
        visibility: 'all_students', // Always set to all_students
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        post(route('teacher.materials.store', sectionSubject.id), {
            onSuccess: () => {
                reset();
                setShowUploadDialog(false);
            },
            onError: (errors) => {
                toast.error('Failed to upload learning material. Please try again.');
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
        const material = materials.find(m => m.id === materialId);
        setMaterialToDelete(material);
        setShowDeleteModal(true);
    };

    const confirmDelete = () => {
        if (materialToDelete) {
            router.delete(route('teacher.materials.destroy', [sectionSubject.id, materialToDelete.id]), {
                onSuccess: () => {
                    setShowDeleteModal(false);
                    setMaterialToDelete(null);
                    // Flash message will be handled by AuthenticatedLayout
                },
                onError: (errors) => {
                    toast.error('Failed to delete learning material. Please try again.');
                    setShowDeleteModal(false);
                    setMaterialToDelete(null);
                },
            });
        }
    };

    const cancelDelete = () => {
        setShowDeleteModal(false);
        setMaterialToDelete(null);
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
            pdf: 'PDF',
            doc: 'DOC', docx: 'DOC',
            ppt: 'PPT', pptx: 'PPT',
            xls: 'XLS', xlsx: 'XLS',
            txt: 'TXT',
            jpg: 'IMG', jpeg: 'IMG', png: 'IMG'
        };
        return types[fileType] || 'FILE';
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

    // Filter materials based on search term
    const filteredMaterials = materials.filter(material =>
        material.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        material.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        material.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
        material.original_name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Pagination logic
    const totalPages = Math.ceil(filteredMaterials.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const currentMaterials = filteredMaterials.slice(startIndex, endIndex);

    // Reset to first page when search changes
    React.useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm]);

    return (
        <AuthenticatedLayout
            header={
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div className="bg-blue-100 p-1.5 rounded-md">
                            <BookOpen className="w-4 h-4 text-blue-600" />
                        </div>
                        <div>
                            <h2 className="text-lg font-semibold text-gray-900">{sectionSubject.subject.subject_name}</h2>
                            <p className="text-xs text-gray-500 mt-0.5">{getSimplifiedSectionName()} • {sectionSubject.subject.subject_code} • Learning Materials</p>
                        </div>
                    </div>
                    <Button
                        asChild
                        variant="ghost"
                        size="sm"
                        className="text-gray-600 hover:text-gray-900"
                    >
                        <Link href={route('teacher.sections.college')} className="flex items-center">
                            <ArrowLeft className="w-4 h-4 mr-1 flex-shrink-0" />
                            <span>Back to Sections</span>
                        </Link>
                    </Button>
                </div>
            }
        >
            <Head title={`Materials - ${getSimplifiedSectionName()}`} />
            
            <div className="p-4 sm:p-6">
                {/* Section Header with Search and Add Button */}
                <div className="flex flex-col lg:flex-row gap-4 lg:items-center justify-between mb-6">
                    {/* Search Input */}
                    <div className="relative flex-1 max-w-md w-full lg:w-auto">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                        </div>
                        <Input
                            type="text"
                            placeholder="Search materials..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-10 pr-4 py-2 w-full border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                    </div>

                    {/* Add Material Button */}
                    <Button
                        onClick={() => setShowUploadDialog(true)}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg shadow-sm hover:shadow-md transition-all duration-200 w-full sm:w-auto"
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

                {/* Delete Confirmation Modal */}
                {showDeleteModal && materialToDelete && (
                    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
                        <div className="bg-white rounded-xl shadow-2xl max-w-md w-full">
                            <div className="flex items-center justify-between p-6 border-b">
                                <div>
                                    <h2 className="text-xl font-bold text-gray-900">Delete Learning Material</h2>
                                    <p className="text-gray-500 text-sm mt-1">This action cannot be undone</p>
                                </div>
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    onClick={cancelDelete}
                                    className="text-gray-400 hover:text-gray-600 h-8 w-8 p-0"
                                >
                                    ✕
                                </Button>
                            </div>
                            <div className="p-6">
                                <div className="flex items-start gap-4">
                                    <div className="bg-red-50 border border-red-200 p-3 rounded-lg">
                                        <AlertCircle className="w-6 h-6 text-red-600" />
                                    </div>
                                    <div className="flex-1">
                                        <h3 className="text-lg font-semibold text-gray-900 mb-2">
                                            Are you sure you want to delete this material?
                                        </h3>
                                        <div className="bg-gray-50 p-4 rounded-lg border">
                                            <p className="font-medium text-gray-900 mb-1">{materialToDelete.title}</p>
                                            <p className="text-sm text-gray-600">{materialToDelete.original_name}</p>
                                            <p className="text-xs text-gray-500 mt-2">
                                                Category: {materialToDelete.category} • Size: {materialToDelete.formatted_file_size}
                                            </p>
                                        </div>
                                        <p className="text-sm text-gray-600 mt-4">
                                            This will permanently delete the file and remove it from all student access.
                                        </p>
                                    </div>
                                </div>
                            </div>
                            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t bg-gray-50">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={cancelDelete}
                                    className="px-4 py-2 text-gray-700 border-gray-300 hover:bg-gray-50"
                                >
                                    Cancel
                                </Button>
                                <Button
                                    onClick={confirmDelete}
                                    className="px-6 py-2 bg-red-600 hover:bg-red-700 text-white font-medium rounded-md transition-colors"
                                >
                                    <Trash2 className="w-4 h-4 mr-2" />
                                    Delete Material
                                </Button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Materials Grid */}
                {filteredMaterials.length > 0 ? (
                    <>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
                            {currentMaterials.map((material) => (
                                <Card key={material.id} className="group border border-gray-200 hover:border-blue-300 hover:shadow-md transition-all duration-200 bg-white">
                                    <CardHeader className="pb-3">
                                        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                                            <div className="flex items-center gap-3 flex-1 min-w-0">
                                                <div className="bg-blue-50 border border-blue-200 p-2 rounded-lg flex-shrink-0">
                                                    <div className="text-blue-700 text-xs font-bold">{getFileIcon(material.file_type)}</div>
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <CardTitle className="text-sm font-semibold text-gray-900 truncate leading-tight">
                                                        {material.title}
                                                    </CardTitle>
                                                    <CardDescription className="text-gray-600 text-xs truncate mt-1">
                                                        {material.original_name}
                                                    </CardDescription>
                                                </div>
                                            </div>
                                            <Badge
                                                className={`${getCategoryColor(material.category)} text-xs font-medium px-2 py-1 border-0 flex-shrink-0`}
                                            >
                                                {material.category}
                                            </Badge>
                                        </div>
                                    </CardHeader>

                                    <CardContent className="space-y-4">
                                        {/* Description */}
                                        {material.description && (
                                            <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                                                <p className="text-sm text-gray-700 leading-relaxed line-clamp-3">
                                                    {material.description}
                                                </p>
                                            </div>
                                        )}

                                        {/* Material Info */}
                                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-4 text-sm text-gray-600">
                                            <div className="flex items-center gap-1">
                                                <Calendar className="w-4 h-4 text-gray-400 flex-shrink-0" />
                                                <span className="truncate">{new Date(material.upload_date).toLocaleDateString('en-US', { 
                                                    month: 'short', 
                                                    day: 'numeric',
                                                    year: 'numeric' 
                                                })}</span>
                                            </div>
                                            <div className="flex items-center gap-1">
                                                <File className="w-4 h-4 text-gray-400 flex-shrink-0" />
                                                <span className="text-gray-700 truncate">{material.formatted_file_size}</span>
                                            </div>
                                        </div>

                                        {/* Action Buttons */}
                                        <div className="flex flex-col sm:flex-row gap-2 pt-2">
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                onClick={() => window.open(route('teacher.materials.download', [sectionSubject.id, material.id]), '_blank')}
                                                className="flex-1 text-sm border-gray-300 hover:border-blue-300 hover:bg-blue-50"
                                            >
                                                <Download className="w-4 h-4 mr-2" />
                                                Download
                                            </Button>
                                            <Button
                                                size="sm"
                                                variant="destructive"
                                                onClick={() => handleDelete(material.id)}
                                                className="flex-1 sm:flex-none px-3"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </Button>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>

                        {/* Pagination Controls */}
                        {totalPages > 1 && (
                            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-8 pt-6 border-t border-gray-200">
                                <div className="text-sm text-gray-600">
                                    Showing {startIndex + 1} to {Math.min(endIndex, filteredMaterials.length)} of {filteredMaterials.length} materials
                                </div>
                                <div className="flex items-center gap-2">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                                        disabled={currentPage === 1}
                                        className="px-3 py-1 h-8"
                                    >
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                                        </svg>
                                        Previous
                                    </Button>

                                    <div className="flex items-center gap-1">
                                        {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                                            <Button
                                                key={page}
                                                variant={currentPage === page ? "default" : "outline"}
                                                size="sm"
                                                onClick={() => setCurrentPage(page)}
                                                className={`px-3 py-1 h-8 min-w-[32px] ${
                                                    currentPage === page 
                                                        ? 'bg-blue-600 hover:bg-blue-700 text-white' 
                                                        : 'hover:bg-gray-50'
                                                }`}
                                            >
                                                {page}
                                            </Button>
                                        ))}
                                    </div>

                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                                        disabled={currentPage === totalPages}
                                        className="px-3 py-1 h-8"
                                    >
                                        Next
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                        </svg>
                                    </Button>
                                </div>
                            </div>
                        )}
                    </>
                ) : (
                    <Card className="p-8 text-center border-2 border-dashed border-gray-300">
                        <div className="flex flex-col items-center gap-4">
                            <div className="bg-gray-100 p-4 rounded-full">
                                <FileText className="w-8 h-8 text-gray-500" />
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-gray-900 mb-2">
                                    {searchTerm ? 'No materials found' : 'No materials uploaded yet'}
                                </h3>
                                <p className="text-gray-600 mb-4 max-w-sm mx-auto text-sm">
                                    {searchTerm 
                                        ? 'Try adjusting your search terms or clear the search to see all materials.' 
                                        : 'Start sharing learning materials with your students.'
                                    }
                                </p>
                                {searchTerm ? (
                                    <Button 
                                        onClick={() => setSearchTerm('')}
                                        variant="outline"
                                        className="mr-2"
                                    >
                                        Clear Search
                                    </Button>
                                ) : (
                                    <Button 
                                        onClick={() => setShowUploadDialog(true)}
                                        className="bg-blue-600 hover:bg-blue-700 text-white"
                                    >
                                        <Plus className="w-4 h-4 mr-2" />
                                        Upload Material
                                    </Button>
                                )}
                            </div>
                        </div>
                    </Card>
                )}
            </div>
        </AuthenticatedLayout>
    );
}