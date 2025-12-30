import React, { useState, useEffect, useRef } from 'react';
import { useForm, router } from '@inertiajs/react';
import { Button } from '@/Components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Upload, X, Image as ImageIcon, Camera, MapPin, Smile, MoreHorizontal, Globe, Users, GraduationCap } from 'lucide-react';
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

export default function AnnouncementForm({ mode = 'create', announcement = null, onClose = () => {}, auth }) {
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
    const [showAdvanced, setShowAdvanced] = useState(false);
    const fileInputRef = useRef(null);
    const textareaRef = useRef(null);

    useEffect(() => {
        // Reset when mode/announcement changes
        reset();
        setImageFiles([]);
        setImagePreviews([]);
        setCompressedImages([]);
        setShowAdvanced(false);
    }, [mode, announcement]);

    useEffect(() => {
        // Auto-resize textarea
        if (textareaRef.current) {
            textareaRef.current.style.height = 'auto';
            textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px';
        }
    }, [data.content]);

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

    const getVisibilityIcon = (visibility) => {
        switch (visibility) {
            case 'all_users': return <Globe className="h-4 w-4" />;
            case 'teachers_only': return <Users className="h-4 w-4" />;
            case 'students_only': return <GraduationCap className="h-4 w-4" />;
            default: return <Globe className="h-4 w-4" />;
        }
    };

    const getVisibilityText = (visibility) => {
        switch (visibility) {
            case 'all_users': return 'Everyone';
            case 'teachers_only': return 'Teachers only';
            case 'students_only': return 'Students only';
            default: return 'Everyone';
        }
    };

    const getInitials = (name) => {
        return name.split(' ').map(n => n[0]).join('').toUpperCase();
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
        <div className="max-w-none">
            {/* Post Composer Header */}
            <div className="flex items-center space-x-3 p-4 border-b border-gray-100 dark:border-gray-700">
                <Avatar className="w-10 h-10">
                    <AvatarImage src="" />
                    <AvatarFallback className="bg-blue-500 text-white">
                        {auth?.user ? getInitials(auth.user.name) : 'U'}
                    </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                    <div className="flex items-center space-x-2">
                        <span className="font-semibold text-gray-900 dark:text-gray-100">
                            {auth?.user?.name || 'User'}
                        </span>
                        <span className="text-gray-500 dark:text-gray-400">is creating an announcement</span>
                    </div>
                    <div className="flex items-center space-x-1 text-sm text-gray-500 dark:text-gray-400">
                        {getVisibilityIcon(data.visibility)}
                        <span>{getVisibilityText(data.visibility)}</span>
                    </div>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="p-4 space-y-4">
                {/* Title Input */}
                <Input
                    type="text"
                    placeholder="Announcement title..."
                    value={data.title}
                    onChange={(e) => setData('title', e.target.value)}
                    className="text-lg font-medium border-0 px-0 focus-visible:ring-0 placeholder:text-gray-400"
                    required
                />

                {/* Content Textarea */}
                <Textarea
                    ref={textareaRef}
                    placeholder="What's happening?"
                    value={data.content}
                    onChange={(e) => setData('content', e.target.value)}
                    className="min-h-[120px] text-lg border-0 px-0 focus-visible:ring-0 resize-none placeholder:text-gray-400"
                    required
                />

                {/* Image Previews */}
                {imagePreviews.length > 0 && (
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2 rounded-lg overflow-hidden">
                        {imagePreviews.map((preview, index) => (
                            <div key={index} className="relative group">
                                <img
                                    src={preview.url}
                                    alt={preview.name}
                                    className="w-full h-32 object-cover rounded-lg"
                                />
                                <Button
                                    type="button"
                                    variant="destructive"
                                    size="sm"
                                    className="absolute top-2 right-2 h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                                    onClick={() => removeImage(index)}
                                >
                                    <X className="h-3 w-3" />
                                </Button>
                            </div>
                        ))}
                    </div>
                )}

                {/* Drag and Drop Area */}
                <div
                    className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
                        dragActive
                            ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                            : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500'
                    }`}
                    onDrop={handleDrop}
                    onDragOver={handleDragOver}
                    onDragEnter={handleDragEnter}
                    onDragLeave={handleDragLeave}
                >
                    <input
                        ref={fileInputRef}
                        type="file"
                        multiple
                        accept="image/*"
                        onChange={handleFileSelect}
                        className="hidden"
                    />
                    <div className="space-y-2">
                        <div className="mx-auto w-12 h-12 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center">
                            <Camera className="w-6 h-6 text-gray-400" />
                        </div>
                        <div>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                                Drag photos here or{' '}
                                <Button
                                    type="button"
                                    variant="link"
                                    className="p-0 h-auto text-blue-600 dark:text-blue-400 hover:text-blue-800"
                                    onClick={() => fileInputRef.current?.click()}
                                >
                                    browse
                                </Button>
                            </p>
                        </div>
                    </div>
                </div>

                {/* Post Actions */}
                <div className="flex items-center justify-between pt-4 border-t border-gray-100 dark:border-gray-700">
                    <div className="flex items-center space-x-2">
                        <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="flex items-center space-x-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700"
                            onClick={() => fileInputRef.current?.click()}
                        >
                            <Camera className="h-4 w-4" />
                            <span>Photo</span>
                        </Button>
                        <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="flex items-center space-x-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700"
                            onClick={() => setShowAdvanced(!showAdvanced)}
                        >
                            <MoreHorizontal className="h-4 w-4" />
                            <span>More</span>
                        </Button>
                    </div>
                    <Button
                        type="submit"
                        disabled={processing || !data.title.trim() || !data.content.trim()}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-6"
                    >
                        {processing ? 'Posting...' : isEdit ? 'Update' : 'Post'}
                    </Button>
                </div>

                {/* Advanced Options */}
                {showAdvanced && (
                    <div className="space-y-4 pt-4 border-t border-gray-100 dark:border-gray-700">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="visibility">Visibility</Label>
                                <Select value={data.visibility} onValueChange={(value) => setData('visibility', value)}>
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all_users">
                                            <div className="flex items-center space-x-2">
                                                <Globe className="h-4 w-4" />
                                                <span>Everyone</span>
                                            </div>
                                        </SelectItem>
                                        <SelectItem value="teachers_only">
                                            <div className="flex items-center space-x-2">
                                                <Users className="h-4 w-4" />
                                                <span>Teachers only</span>
                                            </div>
                                        </SelectItem>
                                        <SelectItem value="students_only">
                                            <div className="flex items-center space-x-2">
                                                <GraduationCap className="h-4 w-4" />
                                                <span>Students only</span>
                                            </div>
                                        </SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="priority">Priority</Label>
                                <Select value={data.priority} onValueChange={(value) => setData('priority', value)}>
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="low">Low</SelectItem>
                                        <SelectItem value="medium">Medium</SelectItem>
                                        <SelectItem value="high">High</SelectItem>
                                        <SelectItem value="urgent">Urgent</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <div className="flex items-center space-x-2">
                            <Checkbox
                                id="is_published"
                                checked={data.is_published}
                                onCheckedChange={(checked) => setData('is_published', checked)}
                            />
                            <Label htmlFor="is_published" className="text-sm">Publish immediately</Label>
                        </div>

                        {!data.is_published && (
                            <div className="space-y-2">
                                <Label htmlFor="published_at">Publish Date & Time</Label>
                                <Input
                                    id="published_at"
                                    type="datetime-local"
                                    value={data.published_at}
                                    onChange={(e) => setData('published_at', e.target.value)}
                                />
                            </div>
                        )}

                        <div className="space-y-2">
                            <Label htmlFor="expires_at">Expiration Date & Time (Optional)</Label>
                            <Input
                                id="expires_at"
                                type="datetime-local"
                                value={data.expires_at}
                                onChange={(e) => setData('expires_at', e.target.value)}
                            />
                        </div>
                    </div>
                )}
            </form>
        </div>
    );
}