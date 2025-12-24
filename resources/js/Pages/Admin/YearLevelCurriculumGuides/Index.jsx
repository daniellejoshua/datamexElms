import { Head, Link, router, usePage } from '@inertiajs/react'
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { GraduationCap, BookOpen, Plus, Edit, Trash2, Filter, Search } from 'lucide-react'
import { useState, useEffect } from 'react'
import { toast } from 'sonner'

export default function Index({ guides, programs, currentAcademicYear, filters }) {
    const { flash } = usePage().props;
    const [localFilters, setLocalFilters] = useState(filters || {})

    const handleFilterChange = (key, value) => {
        const newFilters = { ...localFilters, [key]: value }
        setLocalFilters(newFilters)
        router.get(route('admin.year-level-curriculum-guides.index'), newFilters, {
            preserveState: true,
            replace: true,
        })
    }

    const getYearLevelLabel = (program, yearLevel) => {
        if (program.education_level === 'college') {
            const labels = ['1st Year', '2nd Year', '3rd Year', '4th Year']
            return labels[yearLevel - 1] || `Year ${yearLevel}`
        } else {
            return `Grade ${yearLevel + 10}` // SHS starts from Grade 11
        }
    }

    const groupedGuides = programs.map(program => {
        const programGuides = guides[program.id] || {}
        const yearLevels = Object.keys(programGuides).sort((a, b) => parseInt(a) - parseInt(b))

        return {
            program,
            guides: yearLevels.map(yearLevel => ({
                yearLevel: parseInt(yearLevel),
                guide: programGuides[yearLevel][0] // Take first guide (should only be one per year level)
            }))
        }
    }).filter(group => group.guides.length > 0)

    return (
        <AuthenticatedLayout
            header={
                <div className="flex justify-between items-center">
                    <div>
                        <h2 className="text-3xl font-bold text-gray-900">Year Level Curriculum Guides</h2>
                        <p className="text-gray-600 mt-1">Manage which curriculum each year level uses for {currentAcademicYear}</p>
                    </div>
                    <Button asChild>
                        <Link href={route('admin.year-level-curriculum-guides.create')}>
                            <Plus className="w-4 h-4 mr-2" />
                            Add Guide
                        </Link>
                    </Button>
                </div>
            }
        >
            <Head title="Year Level Curriculum Guides" />

            {/* Filters */}
            <Card className="mb-6">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Filter className="w-5 h-5" />
                        Filters
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                            <Label htmlFor="program_filter">Program</Label>
                            <Select
                                value={localFilters.program_id || 'all'}
                                onValueChange={(value) => handleFilterChange('program_id', value)}
                            >
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Programs</SelectItem>
                                    {programs.map(program => (
                                        <SelectItem key={program.id} value={program.id.toString()}>
                                            {program.program_name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div>
                            <Label htmlFor="education_level_filter">Education Level</Label>
                            <Select
                                value={localFilters.education_level || 'all'}
                                onValueChange={(value) => handleFilterChange('education_level', value)}
                            >
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Levels</SelectItem>
                                    <SelectItem value="college">College</SelectItem>
                                    <SelectItem value="shs">Senior High School</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Guides List */}
            <div className="space-y-6">
                {groupedGuides.length === 0 ? (
                    <Card>
                        <CardContent className="py-12">
                            <div className="text-center">
                                <BookOpen className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                                <h3 className="text-lg font-medium text-gray-900 mb-2">No Year Level Guides Found</h3>
                                <p className="text-gray-600 mb-4">
                                    No curriculum guides have been set up for the current academic year.
                                </p>
                                <Button asChild>
                                    <Link href={route('admin.year-level-curriculum-guides.create')}>
                                        <Plus className="w-4 h-4 mr-2" />
                                        Create First Guide
                                    </Link>
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                ) : (
                    groupedGuides.map(({ program, guides: programGuides }) => (
                        <Card key={program.id}>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <GraduationCap className="w-5 h-5" />
                                    {program.program_name}
                                    <Badge variant="secondary">{program.program_code}</Badge>
                                    <Badge variant={program.education_level === 'college' ? 'default' : 'secondary'}>
                                        {program.education_level === 'college' ? 'College' : 'Senior High School'}
                                    </Badge>
                                </CardTitle>
                                <CardDescription>
                                    Curriculum assignments for each year level in {currentAcademicYear}
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {programGuides.map(({ yearLevel, guide }) => (
                                        <div key={yearLevel} className="border rounded-lg p-4 bg-gray-50">
                                            <div className="flex justify-between items-start mb-2">
                                                <div>
                                                    <h4 className="font-medium text-gray-900">
                                                        {getYearLevelLabel(program, yearLevel)}
                                                    </h4>
                                                    <p className="text-sm text-gray-600">
                                                        Year Level {yearLevel}
                                                    </p>
                                                </div>
                                                <div className="flex gap-1">
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        asChild
                                                    >
                                                        <Link href={route('admin.year-level-curriculum-guides.edit', [program.id, yearLevel])}>
                                                            <Edit className="w-3 h-3" />
                                                        </Link>
                                                    </Button>
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() => {
                                                            if (confirm('Are you sure you want to delete this guide?')) {
                                                                router.delete(route('admin.year-level-curriculum-guides.destroy', [program.id, yearLevel]))
                                                            }
                                                        }}
                                                    >
                                                        <Trash2 className="w-3 h-3" />
                                                    </Button>
                                                </div>
                                            </div>
                                            <div className="mt-3 p-3 bg-white rounded border">
                                                <p className="font-medium text-sm text-gray-900">
                                                    {guide.curriculum.curriculum_name}
                                                </p>
                                                <p className="text-xs text-gray-600">
                                                    {guide.curriculum.curriculum_code}
                                                </p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    ))
                )}
            </div>
        </AuthenticatedLayout>
    )
}