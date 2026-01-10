import { Head, Link, router } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Eye, Edit, FileText, Search, Filter, CheckCircle, ChevronRight, Star, Menu, X } from 'lucide-react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { useState } from 'react';

export default function Index({ curricula, programs, filters = {} }) {
    const [selectedProgram, setSelectedProgram] = useState(filters.program_id || 'all');
    const [selectedStatus, setSelectedStatus] = useState(filters.status || 'all');
    const [searchQuery, setSearchQuery] = useState(filters.search || '');
    const [showMobileFilters, setShowMobileFilters] = useState(false);

    const handleFilterChange = (key, value) => {
        const filters = {
            program_id: selectedProgram,
            status: selectedStatus,
            search: searchQuery,
            [key]: value
        };

        // Update local state
        if (key === 'program_id') setSelectedProgram(value);
        if (key === 'status') setSelectedStatus(value);
        if (key === 'search') setSearchQuery(value);

        // Navigate with filters
        router.get(route('admin.curriculum.index'), filters, {
            preserveState: true,
            replace: true,
        });
    };

    const filteredCurricula = curricula.data.filter((curriculum) => {
        const matchesProgram = !selectedProgram || selectedProgram === 'all' || curriculum.program_id.toString() === selectedProgram;
        const matchesStatus = !selectedStatus || selectedStatus === 'all' || curriculum.status === selectedStatus;
        const matchesSearch = !searchQuery ||
            curriculum.curriculum_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            curriculum.curriculum_code.toLowerCase().includes(searchQuery.toLowerCase()) ||
            curriculum.program.program_name.toLowerCase().includes(searchQuery.toLowerCase());

        return matchesProgram && matchesStatus && matchesSearch;
    });

    return (
        <AuthenticatedLayout
            header={
                <div className="flex items-center justify-between px-2 py-1">
                    <div className="flex items-center gap-2">
                        <div className="bg-blue-100 p-1.5 rounded-md">
                            <FileText className="w-4 h-4 text-blue-600" />
                        </div>
                        <div>
                            <h2 className="text-lg font-semibold text-gray-900">Curriculum Management</h2>
                            <p className="text-xs text-gray-500 mt-0.5">Manage academic curricula</p>
                        </div>
                    </div>
                </div>
            }
        >
            <Head title="Curriculum Management" />

            <div className="p-2 sm:p-3 lg:p-4">
                {/* Filters */}
                <Card className="mb-4">
                    <CardContent className="pt-3 pb-3">
                        <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-3">
                                <Filter className="w-4 h-4" />
                                <span className="text-sm font-medium">Filter Sections</span>
                            </div>
                            {/* Mobile Filter Toggle */}
                            <div className="lg:hidden">
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => setShowMobileFilters(!showMobileFilters)}
                                    className="h-8 w-8 p-0"
                                >
                                    {showMobileFilters ? (
                                        <X className="w-4 h-4" />
                                    ) : (
                                        <Menu className="w-4 h-4" />
                                    )}
                                </Button>
                            </div>
                        </div>
                        <div className="hidden lg:grid lg:grid-cols-4 xl:grid-cols-4 gap-3">
                            {/* Filters Container */}
                            <div className="contents">
                                {/* Search Filter */}
                                <div className="space-y-1">
                                    <label className="text-xs font-medium text-gray-600">Search</label>
                                    <div className="relative">
                                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-3 h-3" />
                                        <Input
                                            placeholder="Search curricula..."
                                            value={searchQuery}
                                            onChange={(e) => handleFilterChange('search', e.target.value)}
                                            className="pl-9 text-sm h-8 w-full"
                                        />
                                    </div>
                                </div>

                                {/* Program Filter */}
                                <div className="space-y-1">
                                    <label className="text-xs font-medium text-gray-600">Program</label>
                                    <Select
                                        value={selectedProgram}
                                        onValueChange={(value) => handleFilterChange('program_id', value)}
                                    >
                                        <SelectTrigger className="h-8 w-full text-sm">
                                            <SelectValue placeholder="All Programs" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">All Programs</SelectItem>
                                            {programs.map((program) => (
                                                <SelectItem key={program.id} value={program.id.toString()}>
                                                    <Badge variant="secondary" className="font-mono text-xs">
                                                        {program.program_code}
                                                    </Badge>
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                {/* Status Filter */}
                                <div className="space-y-1">
                                    <label className="text-xs font-medium text-gray-600">Status</label>
                                    <Select
                                        value={selectedStatus}
                                        onValueChange={(value) => handleFilterChange('status', value)}
                                    >
                                        <SelectTrigger className="h-8 w-full text-sm">
                                            <SelectValue placeholder="All Status" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">All Status</SelectItem>
                                            <SelectItem value="active">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                                                    <span>Active</span>
                                                </div>
                                            </SelectItem>
                                            <SelectItem value="inactive">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-2 h-2 bg-gray-500 rounded-full"></div>
                                                    <span>Inactive</span>
                                                </div>
                                            </SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            {/* Create Curriculum Button - Right Side */}
                            <div className="space-y-1">
                                <label className="text-xs font-medium text-gray-600 opacity-0">Action</label>
                                <div className="h-8 flex items-center justify-end">
                                    <Button asChild size="sm" className="bg-blue-600 hover:bg-blue-700 text-white">
                                        <Link href={route('admin.curriculum.create')}>
                                            <Plus className="w-3 h-3 mr-1" />
                                            Create Curriculum
                                        </Link>
                                    </Button>
                                </div>
                            </div>
                        </div>

                        {/* Mobile Filters - Collapsible */}
                        {showMobileFilters && (
                            <div className="lg:hidden pt-3 border-t border-gray-200 space-y-4">
                                {/* Search Filter */}
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-gray-700">Search</label>
                                    <div className="relative">
                                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                                        <Input
                                            placeholder="Search curricula..."
                                            value={searchQuery}
                                            onChange={(e) => handleFilterChange('search', e.target.value)}
                                            className="pl-10 text-sm h-10 w-full"
                                        />
                                    </div>
                                </div>

                                {/* Program Filter */}
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-gray-700">Program</label>
                                    <Select
                                        value={selectedProgram}
                                        onValueChange={(value) => handleFilterChange('program_id', value)}
                                    >
                                        <SelectTrigger className="h-10 w-full text-sm">
                                            <SelectValue placeholder="All Programs" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">All Programs</SelectItem>
                                            {programs.map((program) => (
                                                <SelectItem key={program.id} value={program.id.toString()}>
                                                    <Badge variant="secondary" className="font-mono text-xs">
                                                        {program.program_code}
                                                    </Badge>
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                {/* Status Filter */}
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-gray-700">Status</label>
                                    <Select
                                        value={selectedStatus}
                                        onValueChange={(value) => handleFilterChange('status', value)}
                                    >
                                        <SelectTrigger className="h-10 w-full text-sm">
                                            <SelectValue placeholder="All Status" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">All Status</SelectItem>
                                            <SelectItem value="active">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                                                    <span>Active</span>
                                                </div>
                                            </SelectItem>
                                            <SelectItem value="inactive">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-2 h-2 bg-gray-500 rounded-full"></div>
                                                    <span>Inactive</span>
                                                </div>
                                            </SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                {/* Create Curriculum Button */}
                                <div className="flex justify-end pt-2">
                                    <Button asChild className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2">
                                        <Link href={route('admin.curriculum.create')}>
                                            <Plus className="w-4 h-4 mr-2" />
                                            Create Curriculum
                                        </Link>
                                    </Button>
                                </div>
                            </div>
                        )}

                    </CardContent>
                </Card>

                {/* Curricula Grid */}
                {filteredCurricula.length > 0 ? (
                    <div className="px-2">
                        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 mb-6">
                            {filteredCurricula.map((curriculum) => (
                                <Card key={curriculum.id} className="group hover:shadow-xl transition-all duration-300 border-2 hover:border-blue-300 relative overflow-hidden">
                                {/* Status Badge */}
                                <div className="absolute top-4 right-4 z-10">
                                    {(curriculum.is_current === 1 || curriculum.is_current === true || curriculum.is_current === '1') ? (
                                        <Badge className="flex items-center gap-1.5 bg-gradient-to-r from-amber-400 to-orange-500 hover:from-amber-500 hover:to-orange-600 text-white px-2 py-1 rounded-full text-xs font-bold shadow-lg border-0">
                                            <Star className="w-3 h-3 fill-white" />
                                            Current
                                        </Badge>
                                    ) : (
                                        curriculum.status === 'active' || curriculum.status === 1 || curriculum.status === true ? (
                                            <Badge className="bg-emerald-100 text-emerald-800 border-emerald-300 font-semibold px-2 py-1 text-xs flex items-center gap-1">
                                                <CheckCircle className="w-3 h-3" />
                                                Active
                                            </Badge>
                                        ) : (
                                            <Badge className="bg-gray-100 text-gray-600 border-gray-300 font-semibold px-2 py-1 text-xs flex items-center gap-1">
                                                <Eye className="w-3 h-3" />
                                                Inactive
                                            </Badge>
                                        )
                                    )}
                                </div>

                                <CardHeader className="pb-4">
                                    <div className="flex items-start space-x-3">
                                        <div className="p-3 bg-blue-600 rounded-xl flex-shrink-0 shadow-md group-hover:scale-110 transition-transform duration-300 mt-3">
                                            <FileText className="w-6 h-6 text-white" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <CardTitle className="text-lg font-bold text-gray-900 truncate group-hover:text-blue-700 transition-colors mt-3">
                                                {curriculum.curriculum_code}
                                            </CardTitle>
                                            <CardDescription className="text-blue-600 font-semibold truncate">
                                                {curriculum.curriculum_name}
                                            </CardDescription>
                                        </div>
                                    </div>
                                </CardHeader>

                                <CardContent className="space-y-6">
                                    {/* Curriculum Details */}
                                    <div className="space-y-4">
                                        <Card className="p-3 bg-gradient-to-r from-green-50 to-blue-50 border border-green-200">
                                            <div className="flex items-center text-sm">
                                                <FileText className="w-4 h-4 text-green-600 mr-3 flex-shrink-0" />
                                                <span className="text-gray-700 font-medium truncate">
                                                    {curriculum.program.program_name}
                                                </span>
                                            </div>
                                        </Card>

                                        <div className="grid grid-cols-2 gap-2">
                                            <Card className="p-2 text-center bg-orange-50 border-orange-200">
                                                <div className="flex flex-col items-center">
                                                    <FileText className="w-4 h-4 text-orange-600 mb-1" />
                                                    <span className="text-xs font-semibold text-gray-700">
                                                        {curriculum.program.program_code}
                                                    </span>
                                                    <span className="text-xs text-gray-600">Code</span>
                                                </div>
                                            </Card>

                                            <Card className="p-2 text-center bg-purple-50 border-purple-200">
                                                <div className="flex flex-col items-center">
                                                    <FileText className="w-4 h-4 text-purple-600 mb-1" />
                                                    <span className="text-xs font-semibold text-gray-700">
                                                        {curriculum.program.education_level}
                                                    </span>
                                                    <span className="text-xs text-gray-600">Level</span>
                                                </div>
                                            </Card>
                                        </div>

                                        <Card className="p-3 bg-gray-50 border-gray-200">
                                            <div className="flex items-center text-sm">
                                                <FileText className="w-4 h-4 text-gray-600 mr-3 flex-shrink-0" />
                                                <span className="text-gray-700 font-medium">
                                                    Created {new Date(curriculum.created_at).toLocaleDateString()}
                                                </span>
                                            </div>
                                        </Card>
                                    </div>

                                    {/* Action Buttons */}
                                    <div className="space-y-3">
                                        <div className="grid grid-cols-2 gap-2">
                                            <Button asChild variant="outline" className="border-2 border-blue-300 text-blue-700 hover:bg-blue-50 font-medium">
                                                <Link href={route('admin.curriculum.edit', curriculum.id)}>
                                                    <Edit className="w-3 h-3 mr-1" />
                                                    Edit
                                                </Link>
                                            </Button>
                                            <Button asChild variant="outline" className="border-2 border-gray-300 text-gray-700 hover:bg-gray-50 font-medium">
                                                <Link href={route('admin.curriculum.show', curriculum.id)}>
                                                    <Eye className="w-3 h-3 mr-1" />
                                                    View
                                                </Link>
                                            </Button>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                        </div>
                    </div>
                ) : (
                    <Card>
                        <CardContent className="py-12">
                            <div className="text-center">
                                <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                                <h3 className="text-lg font-medium text-gray-900 mb-2">
                                    {curricula.data.length === 0 ? 'No curricula found' : 'No curricula match your filters'}
                                </h3>
                                <p className="text-gray-500 mb-4">
                                    {curricula.data.length === 0
                                        ? 'Get started by creating your first curriculum.'
                                        : 'Try adjusting your filters to see more results.'
                                    }
                                </p>
                                {curricula.data.length === 0 && (
                                    <Link href={route('admin.curriculum.create')}>
                                        <Button className="bg-blue-600 hover:bg-blue-700">
                                            <Plus className="w-4 h-4 mr-2" />
                                            Create Curriculum
                                        </Button>
                                    </Link>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* Pagination */}
                {curricula.last_page > 1 && (
                    <div className="flex justify-center">
                        <div className="flex space-x-1">
                            {curricula.links.map((link, index) => (
                                <Button
                                    key={index}
                                    variant={link.active ? 'default' : 'outline'}
                                    size="sm"
                                    disabled={!link.url}
                                    asChild={!!link.url}
                                    onClick={() => link.url && router.get(link.url)}
                                >
                                    {link.url ? (
                                        <Link href={link.url} dangerouslySetInnerHTML={{ __html: link.label }} />
                                    ) : (
                                        <span dangerouslySetInnerHTML={{ __html: link.label }} />
                                    )}
                                </Button>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </AuthenticatedLayout>
    );
}