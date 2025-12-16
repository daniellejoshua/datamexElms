import { Head, Link, router, usePage } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Eye, Edit, FileText, Search, Filter, CheckCircle, ChevronRight } from 'lucide-react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

export default function Index({ curricula, programs, filters = {} }) {
    const page = usePage();
    const [selectedProgram, setSelectedProgram] = useState(filters.program_id || 'all');
    const [selectedStatus, setSelectedStatus] = useState(filters.status || 'all');
    const [searchQuery, setSearchQuery] = useState(filters.search || '');

    useEffect(() => {
        if (page.props.flash?.success) {
            toast.success(page.props.flash.success, {
                style: {
                    color: '#10b981', // green-500
                    border: '1px solid #10b981',
                },
            });
        }
        if (page.props.flash?.error) {
            toast.error(page.props.flash.error, {
                style: {
                    color: '#ef4444', // red-500
                    border: '1px solid #ef4444',
                },
            });
        }
    }, [page.props.flash]);

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
                <div className="flex items-center px-2 py-1">
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

            <div className="space-y-6">
                {/* Filters */}
                <Card className="ml-2">
                    <CardHeader className="pb-3">
                        <CardTitle className="flex items-center text-sm">
                            <Filter className="w-3 h-3 mr-2" />
                            Filters
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-0">
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                            <div>
                                <Label htmlFor="search" className="text-sm">Search</Label>
                                <div className="relative mt-1">
                                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-3 h-3" />
                                    <Input
                                        id="search"
                                        placeholder="Search curricula..."
                                        value={searchQuery}
                                        onChange={(e) => handleFilterChange('search', e.target.value)}
                                        className="pl-9 text-sm h-8"
                                    />
                                </div>
                            </div>
                            <div>
                                <Label htmlFor="program" className="text-sm">Program</Label>
                                <Select
                                    value={selectedProgram}
                                    onValueChange={(value) => handleFilterChange('program_id', value)}
                                >
                                    <SelectTrigger className="mt-1 h-8 text-sm">
                                        <SelectValue placeholder="All Programs" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All Programs</SelectItem>
                                        {programs.map((program) => (
                                            <SelectItem key={program.id} value={program.id.toString()}>
                                                {program.program_name} ({program.program_code})
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="md:col-span-1">
                                <Label htmlFor="status" className="text-sm">Status</Label>
                                <Select
                                    value={selectedStatus}
                                    onValueChange={(value) => handleFilterChange('status', value)}
                                >
                                    <SelectTrigger className="mt-1 h-8 text-sm">
                                        <SelectValue placeholder="All Status" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All Status</SelectItem>
                                        <SelectItem value="active">Active</SelectItem>
                                        <SelectItem value="inactive">Inactive</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="flex items-end justify-end">
                                <Button asChild size="sm" className="bg-blue-600 hover:bg-blue-700 text-white">
                                    <Link href={route('admin.curriculum.create')}>
                                        <Plus className="w-3 h-3 mr-1" />
                                        Create Curriculum
                                    </Link>
                                </Button>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Curricula Grid */}
                {filteredCurricula.length > 0 ? (
                    <div className="px-2">
                        <div className="grid gap-4 md:gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                            {filteredCurricula.map((curriculum) => (
                                <Card key={curriculum.id} className="group hover:shadow-xl transition-all duration-300 border-2 hover:border-blue-300 relative overflow-hidden">
                                {/* Status Badge */}
                                <div className="absolute top-3 right-3 z-10">
                                    {(curriculum.is_current === 1 || curriculum.is_current === true || curriculum.is_current === '1') ? (
                                        <div className="flex items-center gap-1 bg-gradient-to-r from-yellow-400 to-orange-500 text-white px-2 py-1 rounded-full text-xs font-bold shadow-lg border-2 border-yellow-300">
                                            <span className="w-2 h-2 bg-white rounded-full animate-pulse"></span>
                                            Current
                                        </div>
                                    ) : (
                                        <Badge
                                            variant="outline"
                                            className={`font-semibold border-2 ${
                                                curriculum.status === 'active' || curriculum.status === 1 || curriculum.status === true
                                                    ? 'text-green-600 border-green-600 bg-transparent'
                                                    : 'text-red-600 border-red-600 bg-transparent'
                                            }`}
                                        >
                                            {curriculum.status === 'active' || curriculum.status === 1 || curriculum.status === true ? 'Active' : 'Inactive'}
                                        </Badge>
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