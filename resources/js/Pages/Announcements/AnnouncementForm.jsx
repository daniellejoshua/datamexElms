import React, { useState, useEffect, useRef } from 'react';
import { useForm, router } from '@inertiajs/react';
import { Button } from '@/Components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Upload, X, Image as ImageIcon, Trash2, CloudUpload, FileImage } from 'lucide-react';
import imageCompression from 'browser-image-compression';

const calculateFileHash = async (file) => {
    const buffer = await file.arrayBuffer();
    const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
};

const compressImage = async (file, onProgress) => {
    const options = {
        maxSizeMB: 0.8,
        maxWidthOrHeight: 1600,
        useWebWorker: true,
        quality: 0.75,
        initialQuality: 0.8,
        onProgress: onProgress,
    };

    try {
        return await imageCompression(file, options);
    } catch (error) {
        try {
            const fallbackOptions = { maxSizeMB: 1.5, maxWidthOrHeight: 1200, useWebWorker: true, quality: 0.6 };
            return await imageCompression(file, fallbackOptions);
        } catch (fallbackError) {
            return file;
        }
    }
};

export default function AnnouncementForm({ mode = 'create', announcement = null, onClose = () => {} }) {
    const isEdit = mode === 'edit' && announcement;

    const { data, setData, post, put, processing, errors, reset } = useForm({
        title: isEdit ? announcement.title : '',
        content: isEdit ? announcement.content : '',
        visibility: isEdit ? announcement.visibility : 'all_users',
        priority: isEdit ? announcement.priority : 'medium',
        is_published: isEdit ? announcement.is_published : true,
        published_at: isEdit && announcement.published_at ? new Date(announcement.published_at).toISOString().slice(0, 16) : '',
        expires_at: isEdit && announcement.expires_at ? new Date(announcement.expires_at).toISOString().slice(0, 16) : '',
        images: [],
    });

    const [imageFiles, setImageFiles] = useState([]);
    const [imagePreviews, setImagePreviews] = useState([]);
    const [compressedImages, setCompressedImages] = useState([]);
    const [dragActive, setDragActive] = useState(false);
    const fileInputRef = useRef(null);

    useEffect(() => {
        // Reset when mode/announcement changes
        reset();
        setImageFiles([]);
        setImagePreviews([]);
        setCompressedImages([]);
    }, [mode, announcement]);

    const handleImageChange = async (files) => {
        try {
            const processedImages = [];
            const newPreviews = [];

            for (const file of files) {
                if (!file.type.startsWith('image/')) continue;

                const hash = await calculateFileHash(file);

                processedImages.push({ file, hash, originalName: file.name });
                newPreviews.push({ url: URL.createObjectURL(file), name: file.name, size: file.size });
            }

            setImageFiles(prev => [...prev, ...processedImages]);
            setImagePreviews(prev => [...prev, ...newPreviews]);
            setCompressedImages(prev => [...prev, ...processedImages]);
        } catch (error) {
            console.error('Error processing images:', error);
        }
    };

    const handleFileSelect = (e) => {
        const files = Array.from(e.target.files);
        handleImageChange(files);
    };

    const handleDrop = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);
        
        const files = Array.from(e.dataTransfer.files);
        handleImageChange(files);
    };

    const handleDragOver = (e) => {
        e.preventDefault();
        e.stopPropagation();
    };

    const handleDragEnter = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(true);
    };

    const handleDragLeave = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);
    };

    const removeImage = (index) => {
        const newImages = imageFiles.filter((_, i) => i !== index);
        const newPreviews = imagePreviews.filter((_, i) => i !== index);
        const newCompressed = compressedImages.filter((_, i) => i !== index);
        URL.revokeObjectURL(imagePreviews[index].url);
        setImageFiles(newImages);
        setImagePreviews(newPreviews);
        setCompressedImages(newCompressed);
    };

    const handleSubmit = (e) => {
        e.preventDefault();

        // Create FormData for file uploads
        const formData = new FormData();

        // Add CSRF token first
        const csrfToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');
        if (csrfToken) {
            formData.append('_token', csrfToken);
        }

        // Add regular form data
        formData.append('title', data.title);
        formData.append('content', data.content);
        formData.append('visibility', data.visibility);
        formData.append('priority', data.priority);
        formData.append('is_published', data.is_published ? '1' : '0');
        if (data.published_at) formData.append('published_at', data.published_at);
        if (data.expires_at) formData.append('expires_at', data.expires_at);

        // Add images with array syntax for Laravel
        compressedImages.forEach((imageData, index) => {
            formData.append(`images[]`, imageData.file);
            formData.append(`image_hashes[]`, imageData.hash);
            formData.append(`image_names[]`, imageData.originalName);
        });

        console.log('Submitting announcement with images:', compressedImages.length);
        console.log('Compressed images data:', compressedImages);
        console.log('CSRF token found:', !!csrfToken);
        for (let [key, value] of formData.entries()) {
            console.log(key, value);
        }

        // Use fetch instead of Inertia for better file handling
        const url = isEdit ? route('announcements.update', announcement.id) : route('announcements.store');
        const method = isEdit ? 'POST' : 'POST'; // Laravel uses POST for both create and update with method spoofing

        if (isEdit) {
            formData.append('_method', 'PUT'); // Method spoofing for PUT requests
        }

        fetch(url, {
            method: method,
            body: formData,
            headers: {
                'Accept': 'application/json',
                'X-Requested-With': 'XMLHttpRequest',
            },
        })
        .then(response => response.json())
        .then(data => {
            console.log('Success:', data);
            onClose();
            router.reload();
        })
        .catch(error => {
            console.error('Error:', error);
        });
    };

    return (
        <form onSubmit={handleSubmit} className="p-4">
            <Card>
                <CardHeader>
                    <CardTitle>{isEdit ? 'Edit Announcement' : 'Create Announcement'}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div>
                        <Label htmlFor="title">Title *</Label>
                        <Input id="title" value={data.title} onChange={(e) => setData('title', e.target.value)} placeholder="Enter announcement title" className={errors.title ? 'border-red-500' : ''} />
                        {errors.title && <p className="text-red-500 text-sm mt-1">{errors.title}</p>}
                    </div>

                    <div>
                        <Label htmlFor="content">Content *</Label>
                        <Textarea id="content" value={data.content} onChange={(e) => setData('content', e.target.value)} placeholder="Enter announcement content" rows={6} className={errors.content ? 'border-red-500' : ''} />
                        {errors.content && <p className="text-red-500 text-sm mt-1">{errors.content}</p>}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <Label htmlFor="visibility">Visibility *</Label>
                            <Select value={data.visibility} onValueChange={(value) => setData('visibility', value)}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select visibility" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all_users">All Users</SelectItem>
                                    <SelectItem value="teachers_only">Teachers Only</SelectItem>
                                    <SelectItem value="students_only">Students Only</SelectItem>
                                </SelectContent>
                            </Select>
                            {errors.visibility && <p className="text-red-500 text-sm mt-1">{errors.visibility}</p>}
                        </div>

                        <div>
                            <Label htmlFor="priority">Priority *</Label>
                            <Select value={data.priority} onValueChange={(value) => setData('priority', value)}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select priority" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="low">Low</SelectItem>
                                    <SelectItem value="medium">Medium</SelectItem>
                                    <SelectItem value="high">High</SelectItem>
                                    <SelectItem value="urgent">Urgent</SelectItem>
                                </SelectContent>
                            </Select>
                            {errors.priority && <p className="text-red-500 text-sm mt-1">{errors.priority}</p>}
                        </div>
                    </div>

                    <div className="flex items-center space-x-2">
                        <Checkbox id="is_published" checked={data.is_published} onCheckedChange={(checked) => setData('is_published', checked)} />
                        <Label htmlFor="is_published">Publish immediately</Label>
                    </div>

                    {!data.is_published && (
                        <div>
                            <Label htmlFor="published_at">Publish Date & Time</Label>
                            <Input id="published_at" type="datetime-local" value={data.published_at} onChange={(e) => setData('published_at', e.target.value)} className={errors.published_at ? 'border-red-500' : ''} />
                            {errors.published_at && <p className="text-red-500 text-sm mt-1">{errors.published_at}</p>}
                        </div>
                    )}

                    <div>
                        <Label htmlFor="expires_at">Expiration Date & Time (Optional)</Label>
                        <Input id="expires_at" type="datetime-local" value={data.expires_at} onChange={(e) => setData('expires_at', e.target.value)} className={errors.expires_at ? 'border-red-500' : ''} />
                        {errors.expires_at && <p className="text-red-500 text-sm mt-1">{errors.expires_at}</p>}
                    </div>

                    <div>
                        <Label>Images (Optional)</Label>
                        <div className="mt-2">
                            <div 
                                className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                                    dragActive 
                                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-950' 
                                        : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500'
                                }`}
                                onDrop={handleDrop}
                                onDragOver={handleDragOver}
                                onDragEnter={handleDragEnter}
                                onDragLeave={handleDragLeave}
                                onClick={() => fileInputRef.current?.click()}
                            >
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    multiple
                                    accept="image/*"
                                    onChange={handleFileSelect}
                                    className="hidden"
                                />
                                <div className="flex flex-col items-center space-y-4">
                                    <CloudUpload className={`h-12 w-12 ${dragActive ? 'text-blue-500' : 'text-gray-400'}`} />
                                    <div>
                                        <p className="text-lg font-medium text-gray-900 dark:text-gray-100">
                                            Drop images here or click to browse
                                        </p>
                                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                                            Supports JPG, PNG, GIF, WebP (Max 10MB each)
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {imagePreviews.length > 0 && (
                            <div className="mt-6 space-y-4">
                                <Label>Selected Images ({imagePreviews.length})</Label>
                                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                                    {imagePreviews.map((preview, index) => (
                                        <div key={index} className="relative group bg-gray-50 dark:bg-gray-800 rounded-lg overflow-hidden">
                                            <div className="aspect-square">
                                                <img 
                                                    src={preview.url} 
                                                    alt={preview.name} 
                                                    className="w-full h-full object-cover" 
                                                />
                                            </div>
                                            <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-all duration-200 flex items-center justify-center">
                                                <Button 
                                                    type="button" 
                                                    variant="destructive" 
                                                    size="sm" 
                                                    className="opacity-0 group-hover:opacity-100 transition-opacity"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        removeImage(index);
                                                    }}
                                                >
                                                    <X className="h-4 w-4" />
                                                </Button>
                                            </div>
                                            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-2">
                                                <p className="text-white text-xs font-medium truncate">{preview.name}</p>
                                                <div className="flex justify-between text-white/80 text-xs">
                                                    <span>{(preview.size / 1024 / 1024).toFixed(1)}MB</span>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                        {errors.images && <p className="text-red-500 text-sm mt-1">{errors.images}</p>}
                    </div>

                    <div className="flex justify-end gap-4">
                        <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
                        <Button type="submit" disabled={processing}>{processing ? (isEdit ? 'Updating...' : 'Creating...') : (isEdit ? 'Update Announcement' : 'Create Announcement')}</Button>
                    </div>
                </CardContent>
            </Card>
        </form>
    );
}
