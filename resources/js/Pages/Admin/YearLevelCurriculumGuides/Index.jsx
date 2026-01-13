import { Head, Link, router, usePage } from '@inertiajs/react'
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { GraduationCap, BookOpen, Plus, Edit, Trash2, Filter, Eye, Star, CheckCircle2 } from 'lucide-react'
import { useState } from 'react'

export default function Index({ guides, programs, currentAcademicYear, filters }) {
    const [localFilters, setLocalFilters] = useState(filters || {})
    const [selectedProgram, setSelectedProgram] = useState(null)
    const [isModalOpen, setIsModalOpen] = useState(false)

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
            const labels = ['1st Year', '2nd Year', '3rd Year', '4th Year', '5th Year']
            return labels[yearLevel - 1] || `Year ${yearLevel}`
        } else {
            // Senior high is always Grade 11 and Grade 12
            return `Grade ${yearLevel + 10}` // Grade 11, 12
        }
    }

    const openProgramModal = (program) => {
        setSelectedProgram(program)
        setIsModalOpen(true)
    }

    const groupedGuides = programs.map(program => {
        const programGuides = guides[program.id] || {}
        const yearLevels = Object.keys(programGuides).sort((a, b) => parseInt(a) - parseInt(b))

        return {
            program,
            guides: yearLevels.map(yearLevel => ({
                yearLevel: parseInt(yearLevel),
                guide: programGuides[yearLevel][0]
            }))
        }
    }).filter(group => group.guides.length > 0)

    return (
        <AuthenticatedLayout
            header={
                <div className="flex items-center px-2 py-1">
                    <div className="flex items-center gap-2">
                        <div className="bg-purple-100 p-1.5 rounded-md">
                            <BookOpen className="w-4 h-4 text-purple-600" />
                        </div>
                        <div>
                            <h2 className="text-lg font-semibold text-gray-900">Curriculum Guides</h2>
                            <p className="text-xs text-gray-500 mt-0.5">Which curriculum each year level uses</p>
                        </div>
                    </div>
                </div>
            }
        >
            <Head title="Year Level Curriculum Guides" />

            <div className="m-2 space-y-6">
                {/* Filters */}
                <Card>
                    <CardContent className="pt-3 pb-3">
                        <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-3 ml-1">
                                <Filter className="w-4 h-4" />
                                <span className="text-sm font-medium">Filter Curriculum Guides</span>
                            </div>
                        </div>
                        <div className="flex items-end gap-3">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 flex-1">
                                <div className="space-y-1">
                                    <Label className="text-xs font-medium text-gray-600">Program</Label>
                                    <Select
                                        value={localFilters.program_id || 'all'}
                                        onValueChange={(value) => handleFilterChange('program_id', value)}
                                    >
                                        <SelectTrigger className="h-8 text-sm">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">All Programs</SelectItem>
                                            {programs.map(program => (
                                                <SelectItem key={program.id} value={program.id.toString()}>
                                                    {program.program_code} - {program.program_name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="space-y-1">
                                    <Label className="text-xs font-medium text-gray-600">Education Level</Label>
                                    <Select
                                        value={localFilters.education_level || 'all'}
                                        onValueChange={(value) => handleFilterChange('education_level', value)}
                                    >
                                        <SelectTrigger className="h-8 text-sm">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">All Levels</SelectItem>
                                            <SelectItem value="college">College</SelectItem>
                                            <SelectItem value="senior_high">Senior High School</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Program Curriculum Table */}
                <Card>
                    <CardHeader className="bg-gradient-to-r from-purple-50 to-blue-50">
                        <CardTitle className="flex items-center gap-2">
                            <BookOpen className="w-5 h-5 text-purple-600" />
                            Curriculum Guides
                        </CardTitle>
                        <CardDescription>
                            Click on a program to view detailed curriculum information
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="pt-6">
                        {groupedGuides.length === 0 ? (
                            <div className="text-center py-12">
                                <div className="bg-gradient-to-br from-purple-100 to-blue-100 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-4">
                                    <BookOpen className="w-10 h-10 text-purple-600" />
                                </div>
                                <h3 className="text-xl font-semibold text-gray-900 mb-2">No Year Level Guides Found</h3>
                                <p className="text-gray-600 mb-6 max-w-md mx-auto">
                                    No curriculum guides have been set up for {currentAcademicYear}. Create guides to help assign curriculums to transferees and new enrollees.
                                </p>
                                <Button asChild className="bg-purple-600 hover:bg-purple-700">
                                    <Link href={route('admin.year-level-curriculum-guides.create')}>
                                        <Plus className="w-4 h-4 mr-2" />
                                        Create First Guide
                                    </Link>
                                </Button>
                            </div>
                        ) : (
                            <>
                                {/* Desktop Table View */}
                                <div className="hidden md:block overflow-x-auto">
                                    <table className="w-full">
                                        <thead>
                                            <tr className="border-b-2 border-gray-200">
                                                <th className="text-left py-3 px-4 font-semibold text-gray-700">Program</th>
                                                <th className="text-left py-3 px-4 font-semibold text-gray-700">Education Level</th>
                                                <th className="text-center py-3 px-4 font-semibold text-gray-700">Year Levels</th>
                                                <th className="text-left py-3 px-4 font-semibold text-gray-700">Current Curriculum</th>
                                                <th className="text-center py-3 px-4 font-semibold text-gray-700">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {groupedGuides.map(({ program, guides: programGuides }) => {
                                                const currentCurriculum = programGuides[0]?.guide?.curriculum
                                                const allUsingSameCurriculum = programGuides.every(
                                                    g => g.guide?.curriculum?.id === currentCurriculum?.id
                                                )
                                                
                                                return (
                                                    <tr key={program.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                                                        <td className="py-4 px-4">
                                                            <div className="flex items-center gap-3">
                                                                <div className="bg-purple-100 p-2 rounded-lg">
                                                                    <GraduationCap className="w-4 h-4 text-purple-600" />
                                                                </div>
                                                                <div>
                                                                    <div className="font-semibold text-gray-900">{program.program_name}</div>
                                                                    <div className="text-xs text-gray-500 font-mono">{program.program_code}</div>
                                                                </div>
                                                            </div>
                                                        </td>
                                                        <td className="py-4 px-4">
                                                            <Badge variant={program.education_level === 'college' ? 'default' : 'secondary'}>
                                                                {program.education_level === 'college' ? 'College' : 'Senior High'}
                                                            </Badge>
                                                        </td>
                                                        <td className="py-4 px-4">
                                                            <div className="flex flex-wrap gap-1.5 justify-center">
                                                                {programGuides.map(({ yearLevel }) => (
                                                                    <Badge 
                                                                        key={yearLevel}
                                                                        variant="outline" 
                                                                        className="font-mono text-xs"
                                                                    >
                                                                        {getYearLevelLabel(program, yearLevel)}
                                                                    </Badge>
                                                                ))}
                                                            </div>
                                                        </td>
                                                        <td className="py-4 px-4">
                                                            {(() => {
                                                                // Find the current curriculum for this program
                                                                const programGuides = guides[program.id] || {};
                                                                const yearLevels = Object.keys(programGuides);
                                                                
                                                                // Find any guide that has a current curriculum
                                                                let currentCurriculum = null;
                                                                for (const yearLevel of yearLevels) {
                                                                    const guide = programGuides[yearLevel]?.[0];
                                                                    if (guide?.curriculum?.is_current) {
                                                                        currentCurriculum = guide.curriculum;
                                                                        break;
                                                                    }
                                                                }
                                                                
                                                                return currentCurriculum ? (
                                                                    <div className="flex items-center gap-2">
                                                                        <CheckCircle2 className="w-4 h-4 text-green-600" />
                                                                        <div>
                                                                            <div className="text-sm font-medium text-gray-900">
                                                                                {currentCurriculum.curriculum_name}
                                                                            </div>
                                                                            <div className="text-xs text-gray-500 font-mono">
                                                                                {currentCurriculum.curriculum_code}
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                ) : (
                                                                    <span className="text-sm text-gray-400 italic">No current curriculum</span>
                                                                );
                                                            })()}
                                                        </td>
                                                        <td className="py-4 px-4">
                                                            <div className="flex items-center justify-center gap-2">
                                                                <Button
                                                                    variant="outline"
                                                                    size="sm"
                                                                    onClick={() => openProgramModal(program)}
                                                                    className="h-8"
                                                                >
                                                                    <Eye className="w-3 h-3 mr-1" />
                                                                    View Details
                                                                </Button>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                )
                                            })}
                                        </tbody>
                                    </table>
                                </div>

                                {/* Mobile Card View */}
                                <div className="md:hidden space-y-4">
                                    {groupedGuides.map(({ program, guides: programGuides }) => {
                                        const currentCurriculum = programGuides[0]?.guide?.curriculum
                                        const allUsingSameCurriculum = programGuides.every(
                                            g => g.guide?.curriculum?.id === currentCurriculum?.id
                                        )
                                        
                                        return (
                                            <Card key={program.id} className="p-4">
                                                <div className="space-y-3">
                                                    {/* Program Header */}
                                                    <div className="flex items-start justify-between">
                                                        <div className="flex items-center gap-3 flex-1">
                                                            <div className="bg-purple-100 p-2 rounded-lg">
                                                                <GraduationCap className="w-4 h-4 text-purple-600" />
                                                            </div>
                                                            <div className="min-w-0 flex-1">
                                                                <div className="font-semibold text-gray-900 truncate">{program.program_code}</div>
                                                            </div>
                                                        </div>
                                                        <Badge variant={program.education_level === 'college' ? 'default' : 'secondary'} className="ml-2">
                                                            {program.education_level === 'college' ? 'College' : 'SHS'}
                                                        </Badge>
                                                    </div>

                                                    {/* Year Levels */}
                                                    <div>
                                                        <div className="text-xs text-gray-600 font-medium mb-2">Year Levels:</div>
                                                        <div className="flex flex-wrap gap-1">
                                                            {programGuides.map(({ yearLevel }) => (
                                                                <Badge 
                                                                    key={yearLevel}
                                                                    variant="outline" 
                                                                    className="font-mono text-xs"
                                                                >
                                                                    {getYearLevelLabel(program, yearLevel)}
                                                                </Badge>
                                                            ))}
                                                        </div>
                                                    </div>

                                                    {/* Current Curriculum */}
                                                    <div>
                                                        <div className="text-xs text-gray-600 font-medium mb-1">Current Curriculum:</div>
                                                        {allUsingSameCurriculum ? (
                                                            <div className="flex items-center gap-2">
                                                                <CheckCircle2 className="w-4 h-4 text-green-600 flex-shrink-0" />
                                                                <div className="min-w-0">
                                                                    <div className="text-sm font-medium text-gray-900 truncate">
                                                                        {currentCurriculum?.curriculum_name}
                                                                    </div>
                                                                    <div className="text-xs text-gray-500 font-mono truncate">
                                                                        {currentCurriculum?.curriculum_code}
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        ) : (
                                                            <div className="text-sm text-amber-600 font-medium flex items-center gap-1">
                                                                <span>⚠️</span>
                                                                <span>Multiple Curriculums</span>
                                                            </div>
                                                        )}
                                                    </div>

                                                    {/* Action Button */}
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() => openProgramModal(program)}
                                                        className="w-full"
                                                    >
                                                        <Eye className="w-3 h-3 mr-2" />
                                                        View Details
                                                    </Button>
                                                </div>
                                            </Card>
                                        )
                                    })}
                                </div>
                            </>
                        )}
                    </CardContent>
                </Card>

                {/* Program Details Modal */}
                <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                    <DialogContent className="max-w-[95vw] sm:max-w-4xl max-h-[95vh] sm:max-h-[90vh] overflow-y-auto mx-2 sm:mx-4">
                        {selectedProgram && (() => {
                            const programGuides = guides[selectedProgram.id] || {}
                            const yearLevels = Object.keys(programGuides).sort((a, b) => parseInt(a) - parseInt(b))
                            
                            return (
                                <>
                                    <DialogHeader className="pb-3 sm:pb-4">
                                        <DialogTitle className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 text-base sm:text-lg">
                                            <div className="bg-purple-100 p-1.5 sm:p-2 rounded-lg self-start sm:self-auto">
                                                <GraduationCap className="w-4 h-4 sm:w-5 sm:h-5 text-purple-600" />
                                            </div>
                                            <div className="min-w-0 flex-1">
                                                <div className="font-semibold text-gray-900 text-sm sm:text-base truncate">
                                                    {selectedProgram.program_name}
                                                </div>
                                                <div className="text-xs sm:text-sm font-mono text-gray-500 font-normal mt-0.5 sm:mt-1">
                                                    {selectedProgram.program_code}
                                                </div>
                                            </div>
                                        </DialogTitle>
                                        <DialogDescription className="text-xs sm:text-sm mt-2">
                                            Curriculum guides for each year level
                                        </DialogDescription>
                                    </DialogHeader>

                                    <div className="space-y-3 sm:space-y-4 mt-3 sm:mt-4">
                                        {/* Program Info */}
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-4 p-2.5 sm:p-4 bg-gray-50 rounded-lg">
                                            <div>
                                                <span className="text-xs text-gray-600 font-medium">Education Level</span>
                                                <div className="mt-1">
                                                    <Badge variant={selectedProgram.education_level === 'college' ? 'default' : 'secondary'} className="text-xs">
                                                        {selectedProgram.education_level === 'college' ? 'College' : 'Senior High School'}
                                                    </Badge>
                                                </div>
                                            </div>
                                            <div>
                                                <span className="text-xs text-gray-600 font-medium">Total Years</span>
                                                <div className="mt-1 text-xs sm:text-sm font-semibold">{selectedProgram.total_years} Years</div>
                                            </div>
                                        </div>

                                        {/* Year Level Curriculum Mapping */}
                                        <div className="space-y-2 sm:space-y-3">
                                            <h3 className="font-semibold text-gray-900 flex items-center gap-2 text-sm sm:text-base">
                                                <BookOpen className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                                                Curriculum by Year Level
                                            </h3>
                                            
                                            {yearLevels.length === 0 ? (
                                                <div className="text-center py-6 sm:py-8 text-gray-500">
                                                    <BookOpen className="w-10 h-10 sm:w-12 sm:h-12 mx-auto mb-2 opacity-30" />
                                                    <p className="text-xs sm:text-sm">No curriculum guides configured for this program</p>
                                                </div>
                                            ) : (
                                                <div className="grid gap-2 sm:gap-3">
                                                    {yearLevels.map(yearLevel => {
                                                        const guide = programGuides[yearLevel][0]
                                                        const curriculum = guide?.curriculum
                                                        
                                                        return (
                                                            <div key={yearLevel} className="flex flex-col gap-2 sm:gap-3 p-2.5 sm:p-4 bg-white border-2 border-gray-200 rounded-lg hover:border-purple-300 transition-colors">
                                                                <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
                                                                    <div className="bg-purple-600 text-white w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center font-bold flex-shrink-0 text-xs sm:text-sm">
                                                                        {yearLevel}
                                                                    </div>
                                                                    <div className="min-w-0 flex-1">
                                                                        <div className="font-semibold text-gray-900 truncate text-sm sm:text-base">
                                                                            {getYearLevelLabel(selectedProgram, parseInt(yearLevel))}
                                                                        </div>
                                                                        <div className="text-xs text-gray-500">Year Level {yearLevel}</div>
                                                                    </div>
                                                                </div>
                                                                
                                                                <div className="border-t border-gray-100 pt-2 sm:pt-3">
                                                                    {curriculum ? (
                                                                        <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
                                                                            {curriculum.is_current ? (
                                                                                <Badge className="bg-green-600 text-white self-start sm:self-auto text-xs w-fit">
                                                                                    <Star className="w-2.5 h-2.5 sm:w-3 sm:h-3 mr-1" />
                                                                                    Current
                                                                                </Badge>
                                                                            ) : (
                                                                                <Badge variant="secondary" className="self-start sm:self-auto text-xs w-fit">
                                                                                    Old
                                                                                </Badge>
                                                                            )}
                                                                            <div className="min-w-0 flex-1">
                                                                                <div className="font-medium text-gray-900 truncate text-sm sm:text-base">
                                                                                    {curriculum.curriculum_name}
                                                                                </div>
                                                                                <div className="text-xs text-gray-500 font-mono truncate">
                                                                                    {curriculum.curriculum_code}
                                                                                </div>
                                                                            </div>
                                                                        </div>
                                                                    ) : (
                                                                        <span className="text-xs sm:text-sm text-gray-400 italic">No curriculum assigned</span>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        )
                                                    })}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </>
                            )
                        })()}
                    </DialogContent>
                </Dialog>
            </div>
        </AuthenticatedLayout>
    )
}
