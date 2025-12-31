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
import { Upload, X, Image as ImageIcon, Camera, MapPin, Smile, Globe, Users, GraduationCap, AlertTriangle, TrendingUp, Info, Newspaper } from 'lucide-react';
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
    const fileInputRef = useRef(null);
    const textareaRef = useRef(null);

    useEffect(() => {
        // Reset when mode/announcement changes
        reset();
        setImageFiles([]);
        setImagePreviews([]);
        setCompressedImages([]);
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
            // Limit to only 1 image
            const file = files[0];
            if (!file || !file.type.startsWith('image/')) return;

            const hash = await calculateFileHash(file);

            const processedImage = { file, hash, originalName: file.name };
            const preview = { url: URL.createObjectURL(file), name: file.name, size: file.size };

            setImageFiles([processedImage]);
            setImagePreviews([preview]);
            setCompressedImages([processedImage]);
        } catch (error) {
            console.error('Error processing image:', error);
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

    const removeImage = () => {
        if (imagePreviews.length > 0) {
            URL.revokeObjectURL(imagePreviews[0].url);
        }
        setImageFiles([]);
        setImagePreviews([]);
        setCompressedImages([]);
    };

    const getVisibilityIcon = (visibility) => {
        switch (visibility) {
            case 'all_users': return <Newspaper className="h-4 w-4" />;
            case 'teachers_only': return <Users className="h-4 w-4" />;
            case 'students_only': return <GraduationCap className="h-4 w-4" />;
            default: return <Newspaper className="h-4 w-4" />;
        }
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
        <div className="max-w-4xl mx-auto">
            {/* Compact Header */}
            <div className="flex items-center p-4 border-b border-blue-200 dark:border-blue-800 bg-blue-50/50 dark:bg-blue-900/10">
                <div className="flex items-center space-x-3">
                    <Avatar className="w-10 h-10 ring-2 ring-blue-200 dark:ring-blue-800">
                        <AvatarImage src="" />
                        <AvatarFallback className="bg-blue-500 text-white text-sm">
                            {auth?.user ? getInitials(auth.user.name) : 'U'}
                        </AvatarFallback>
                    </Avatar>
                    <div>
                        <h3 className="font-semibold text-gray-900 dark:text-gray-100">
                            {auth?.user?.name || 'Author'}
                        </h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                            {isEdit ? 'Editing announcement' : 'New announcement'}
                        </p>
                    </div>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-6">
                {/* Title */}
                <div className="space-y-2">
                    <Label htmlFor="title" className="text-sm font-medium text-blue-700 dark:text-blue-300">
                        Title
                    </Label>
                    <Input
                        id="title"
                        type="text"
                        placeholder="Enter announcement title..."
                        value={data.title}
                        onChange={(e) => setData('title', e.target.value)}
                        className="text-lg border-gray-300 dark:border-gray-600 focus:border-blue-500 dark:focus:border-blue-400"
                        required
                    />
                </div>

                {/* Content */}
                <div className="space-y-2">
                    <Label htmlFor="content" className="text-sm font-medium text-blue-700 dark:text-blue-300">
                        Content
                    </Label>
                    <Textarea
                        id="content"
                        ref={textareaRef}
                        placeholder="Write your announcement..."
                        value={data.content}
                        onChange={(e) => setData('content', e.target.value)}
                        className="min-h-[120px] border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-800/50 focus:border-gray-500 dark:focus:border-gray-400 resize-none"
                        required
                    />
                </div>

                {/* Image Upload */}
                <div className="space-y-2">
                    <Label className="text-sm font-medium text-blue-700 dark:text-blue-300">
                        Image (optional)
                    </Label>

                    {imagePreviews.length > 0 ? (
                        <div className="relative">
                            <div className="relative rounded-lg overflow-hidden border-2 border-blue-200 dark:border-blue-800 bg-blue-50/30 dark:bg-blue-900/10">
                                <img
                                    src={imagePreviews[0].url}
                                    alt={imagePreviews[0].name}
                                    className="w-full h-80 object-cover"
                                />
                                <Button
                                    type="button"
                                    variant="destructive"
                                    size="sm"
                                    className="absolute top-2 right-2 h-6 w-6 p-0"
                                    onClick={() => {
                                        setImageFiles([]);
                                        setImagePreviews([]);
                                        setCompressedImages([]);
                                    }}
                                >
                                    <X className="h-3 w-3" />
                                </Button>
                            </div>
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                className="mt-2 w-full border-blue-200 dark:border-blue-800 hover:bg-blue-50 dark:hover:bg-blue-900/20"
                                onClick={() => fileInputRef.current?.click()}
                            >
                                <Camera className="h-4 w-4 mr-2" />
                                Change Image
                            </Button>
                        </div>
                    ) : (
                        <div
                            className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-all duration-200 ${
                                dragActive
                                    ? 'border-blue-400 bg-blue-50 dark:bg-blue-900/20 scale-[1.02]'
                                    : 'border-blue-200 dark:border-blue-800 hover:border-blue-300 dark:hover:border-blue-700 bg-blue-50/20 dark:bg-blue-900/5 hover:bg-blue-50/40 dark:hover:bg-blue-900/10'
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
                                accept="image/*"
                                onChange={handleFileSelect}
                                className="hidden"
                            />
                            <div className="flex flex-col items-center space-y-3">
                                <div className="p-3 rounded-full bg-blue-100 dark:bg-blue-900/30">
                                    <Camera className="w-8 h-8 text-blue-600 dark:text-blue-400" />
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-blue-700 dark:text-blue-300">
                                        Click to upload or drag and drop
                                    </p>
                                    <p className="text-xs text-blue-600/70 dark:text-blue-400/70 mt-1">
                                        PNG, JPG, GIF up to 10MB
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Settings - Inline */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                    <div className="space-y-2">
                        <Label htmlFor="visibility" className="text-sm font-medium text-blue-700 dark:text-blue-300">
                            Visibility
                        </Label>
                        <Select value={data.visibility} onValueChange={(value) => setData('visibility', value)}>
                            <SelectTrigger className="border-gray-300 dark:border-gray-600">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all_users">
                                    <div className="flex items-center space-x-2">
                                        <Newspaper className="h-4 w-4" />
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
                        <Label htmlFor="priority" className="text-sm font-medium text-blue-700 dark:text-blue-300">
                            Priority
                        </Label>
                        <Select value={data.priority} onValueChange={(value) => setData('priority', value)}>
                            <SelectTrigger className="border-gray-300 dark:border-gray-600">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="low">
                                    <div className="flex items-center space-x-2">
                                        <div className="w-3 h-3 rounded-full bg-gray-500"></div>
                                        <Info className="h-4 w-4" />
                                        <span>Low</span>
                                    </div>
                                </SelectItem>
                                <SelectItem value="medium">
                                    <div className="flex items-center space-x-2">
                                        <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                                        <Info className="h-4 w-4" />
                                        <span>Medium</span>
                                    </div>
                                </SelectItem>
                                <SelectItem value="high">
                                    <div className="flex items-center space-x-2">
                                        <div className="w-3 h-3 rounded-full bg-orange-500"></div>
                                        <TrendingUp className="h-4 w-4" />
                                        <span>High</span>
                                    </div>
                                </SelectItem>
                                <SelectItem value="urgent">
                                    <div className="flex items-center space-x-2">
                                        <div className="w-3 h-3 rounded-full bg-red-500"></div>
                                        <AlertTriangle className="h-4 w-4" />
                                        <span>Urgent</span>
                                    </div>
                                </SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-2 md:col-span-2">
                        <div className="flex items-center space-x-2">
                            <Checkbox
                                id="is_published"
                                checked={data.is_published}
                                onCheckedChange={(checked) => setData('is_published', checked)}
                            />
                            <Label htmlFor="is_published" className="text-sm text-gray-700 dark:text-gray-300">
                                Publish immediately
                            </Label>
                        </div>

                        {!data.is_published && (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="published_at" className="text-sm font-medium text-blue-700 dark:text-blue-300">
                                        Schedule publication
                                    </Label>
                                    <Input
                                        id="published_at"
                                        type="datetime-local"
                                        value={data.published_at}
                                        onChange={(e) => setData('published_at', e.target.value)}
                                        className="border-gray-300 dark:border-gray-600"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="expires_at" className="text-sm font-medium text-blue-700 dark:text-blue-300">
                                        Expiration date (optional)
                                    </Label>
                                    <Input
                                        id="expires_at"
                                        type="datetime-local"
                                        value={data.expires_at}
                                        onChange={(e) => setData('expires_at', e.target.value)}
                                        className="border-gray-300 dark:border-gray-600"
                                    />
                                </div>
                            </div>
                        )}

                        {data.is_published && (
                            <div className="space-y-2">
                                <Label htmlFor="expires_at" className="text-sm font-medium text-blue-700 dark:text-blue-300">
                                    Expiration date (optional)
                                </Label>
                                <Input
                                    id="expires_at"
                                    type="datetime-local"
                                    value={data.expires_at}
                                    onChange={(e) => setData('expires_at', e.target.value)}
                                    className="border-gray-300 dark:border-gray-600"
                                />
                            </div>
                        )}
                    </div>
                </div>

                {/* Actions */}
                <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                    <Button
                        type="button"
                        variant="outline"
                        onClick={onClose}
                    >
                        Cancel
                    </Button>
                    <Button
                        type="submit"
                        disabled={processing || !data.title.trim() || !data.content.trim()}
                        className="bg-blue-600 hover:bg-blue-700 text-white dark:bg-blue-500 dark:hover:bg-blue-600"
                    >
                        {processing ? 'Publishing...' : (isEdit ? 'Update' : 'Publish')}
                    </Button>
                </div>
            </form>
        </div>
    );
}