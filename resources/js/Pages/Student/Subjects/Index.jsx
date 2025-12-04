import React, { useState } from 'react';
import { Head, Link } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import GradesModal from '@/Components/Student/GradesModal';
import MaterialsModal from '@/Components/Student/MaterialsModal';
import { 
    BookOpen, 
    Users, 
    Calendar, 
    Clock,
    MapPin,
    Search,
    FileText,
    GraduationCap,
    User,
    BarChart3,
    ArrowLeft
} from 'lucide-react';

export default function StudentSubjectsIndex({ subjects, student }) {
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedSubject, setSelectedSubject] = useState(null);
    const [isGradesModalOpen, setIsGradesModalOpen] = useState(false);
    const [isMaterialsModalOpen, setIsMaterialsModalOpen] = useState(false);

    const handleViewGrades = (subject) => {
        setSelectedSubject(subject);
        setIsGradesModalOpen(true);
    };

    const handleCloseGradesModal = () => {
        setIsGradesModalOpen(false);
        setSelectedSubject(null);
    };

    const handleViewMaterials = (subject) => {
        setSelectedSubject(subject);
        setIsMaterialsModalOpen(true);
    };

    const handleCloseMaterialsModal = () => {
        setIsMaterialsModalOpen(false);
        setSelectedSubject(null);
    };

    // Check if subject has new materials (this would come from backend in real implementation)
    const hasNewMaterials = (subject) => {
        // Return true if subject has materials marked as new
        return subject?.materials?.some(material => material.isNew) || false;
    };

    // Format schedule for display
    const formatSchedule = (scheduleDays, startTime, endTime) => {
        if (!scheduleDays || scheduleDays.length === 0) return 'No schedule set';
        
        try {
            const days = Array.isArray(scheduleDays) ? scheduleDays : JSON.parse(scheduleDays || '[]');
            
            // Convert days to lowercase for comparison
            const daySet = new Set(days.map(day => day.toLowerCase()));
            
            // Common schedule patterns
            let dayDisplay = '';
            if (daySet.has('monday') && daySet.has('wednesday') && daySet.has('friday') && daySet.size === 3) {
                dayDisplay = 'MWF';
            } else if (daySet.has('tuesday') && daySet.has('thursday') && daySet.size === 2) {
                dayDisplay = 'TTHS';
            } else if (daySet.has('monday') && daySet.has('tuesday') && daySet.has('wednesday') && daySet.has('thursday') && daySet.has('friday') && daySet.size === 5) {
                dayDisplay = 'MTWTF';
            } else if (daySet.has('monday') && daySet.has('wednesday') && daySet.size === 2) {
                dayDisplay = 'MW';
            } else if (daySet.has('tuesday') && daySet.has('friday') && daySet.size === 2) {
                dayDisplay = 'TF';
            } else {
                // Fallback to individual abbreviations
                const dayAbbrevs = {
                    monday: 'M',
                    tuesday: 'T', 
                    wednesday: 'W',
                    thursday: 'TH',
                    friday: 'F',
                    saturday: 'S',
                    sunday: 'SU'
                };
                dayDisplay = days.map(day => dayAbbrevs[day.toLowerCase()] || day).join('');
            }
            
            // Convert 24-hour time to 12-hour format with AM/PM
            const formatTimeToAmPm = (time) => {
                if (!time) return '';
                const [hours, minutes] = time.split(':').map(num => parseInt(num));
                const period = hours >= 12 ? 'PM' : 'AM';
                const displayHours = hours > 12 ? hours - 12 : hours === 0 ? 12 : hours;
                return `${displayHours}:${minutes.toString().padStart(2, '0')} ${period}`;
            };
            
            const startTimeFormatted = formatTimeToAmPm(startTime);
            const endTimeFormatted = formatTimeToAmPm(endTime);
            const timeRange = startTimeFormatted && endTimeFormatted ? `${startTimeFormatted} - ${endTimeFormatted}` : '';
            
            return `${dayDisplay} ${timeRange}`.trim();
        } catch (error) {
            console.error('Error parsing schedule:', error);
            return 'Schedule error';
        }
    };

    // Filter subjects based on search term
    const filteredSubjects = subjects.filter(subject =>
        subject.subject_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        subject.subject_code.toLowerCase().includes(searchTerm.toLowerCase()) ||
        subject.teacher_name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <AuthenticatedLayout
            header={
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <Button asChild variant="ghost" size="sm">
                            <Link href={route('student.dashboard')} className="flex items-center gap-2">
                                <ArrowLeft className="w-4 h-4" />
                                Back to Dashboard
                            </Link>
                        </Button>
                        <div className="h-6 w-px bg-gray-300"></div>
                        <div>
                            <h2 className="text-2xl font-bold text-gray-900">My Subjects</h2>
                            <p className="text-sm text-blue-600 font-medium mt-1">View all your enrolled subjects and academic details</p>
                        </div>
                    </div>
                </div>
            }
        >
            <Head title="My Subjects" />

            <div className="max-w-7xl mx-auto space-y-6">
                {/* Search Bar */}
                <Card>
                    <CardHeader className="pb-4">
                        <div className="flex items-center gap-4">
                            <div className="relative flex-1 max-w-md">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                                <Input
                                    placeholder="Search subjects, codes, or instructors..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="pl-10"
                                />
                            </div>
                            <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                                {filteredSubjects.length} subject{filteredSubjects.length !== 1 ? 's' : ''}
                            </Badge>
                        </div>
                    </CardHeader>
                </Card>

                {/* Subjects Grid */}
                {filteredSubjects.length > 0 ? (
                    <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                        {filteredSubjects.map((subject) => (
                            <Card key={subject.section_subject_id} className="group hover:shadow-xl transition-all duration-300 border-2 hover:border-blue-300 relative overflow-hidden">
                                {/* Header */}
                                <CardHeader className="pb-3">
                                    <div className="flex items-start justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className="bg-gradient-to-br from-blue-500 to-blue-600 p-2.5 rounded-xl shadow-md group-hover:shadow-lg transition-shadow">
                                                <BookOpen className="w-5 h-5 text-white" />
                                            </div>
                                            <div>
                                                <CardTitle className="text-lg font-bold text-gray-900 group-hover:text-blue-700 transition-colors">
                                                    {subject.subject_code}
                                                </CardTitle>
                                                <Badge variant="secondary" className="bg-blue-100 text-blue-800 border-blue-200 text-xs font-semibold mt-1">
                                                    {subject.units} {subject.units === 1 ? 'Unit' : 'Units'}
                                                </Badge>
                                            </div>
                                        </div>
                                    </div>
                                </CardHeader>

                                {/* Content */}
                                <CardContent className="space-y-4">
                                    {/* Subject Name */}
                                    <div>
                                        <h3 className="font-semibold text-gray-900 text-base leading-tight">
                                            {subject.subject_name}
                                        </h3>
                                    </div>

                                    {/* Instructor */}
                                    <div className="flex items-center gap-2">
                                        <User className="w-4 h-4 text-gray-500" />
                                        <span className="text-sm text-gray-700 font-medium">{subject.teacher_name}</span>
                                    </div>

                                    {/* Schedule */}
                                    <div className="space-y-2">
                                        <div className="flex items-center gap-2">
                                            <Clock className="w-4 h-4 text-gray-500" />
                                            <span className="text-sm text-gray-700 font-medium">{formatSchedule(subject.schedule_days, subject.start_time, subject.end_time)}</span>
                                        </div>
                                        {subject.room && (
                                            <div className="flex items-center gap-2 ml-6">
                                                <span className="text-sm text-gray-600">Room: {subject.room}</span>
                                            </div>
                                        )}
                                    </div>

                                    {/* Section Info */}
                                    <div className="pt-2 border-t border-gray-200">
                                        <div className="flex items-center gap-4 text-xs text-gray-500">
                                            <span>{subject.program_code}-{subject.year_level}{subject.section_name}</span>
                                            <span>•</span>
                                            <span>{subject.academic_year}</span>
                                            <span>•</span>
                                            <span>{subject.semester} Semester</span>
                                        </div>
                                    </div>

                                    {/* Action Buttons */}
                                    <div className="grid grid-cols-2 gap-2 pt-2">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            className="text-blue-600 border-blue-300 hover:bg-blue-50 hover:border-blue-400 transition-all duration-200 font-semibold relative"
                                            onClick={() => handleViewMaterials(subject)}
                                        >
                                            <FileText className="w-3 h-3 mr-1" />
                                            Materials
                                            {hasNewMaterials(subject) && (
                                                <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full"></span>
                                            )}
                                        </Button>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            className="text-green-600 border-green-300 hover:bg-green-50 hover:border-green-400 transition-all duration-200 font-semibold"
                                            onClick={() => handleViewGrades(subject)}
                                        >
                                            <BarChart3 className="w-3 h-3 mr-1" />
                                            Grades
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                ) : (
                    <Card>
                        <CardContent className="p-8 text-center">
                            <BookOpen className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                            <h3 className="text-lg font-semibold text-gray-900 mb-2">No subjects found</h3>
                            <p className="text-gray-600">
                                {searchTerm ? 
                                    `No subjects match your search for "${searchTerm}"` : 
                                    'You are not enrolled in any subjects for this semester.'
                                }
                            </p>
                        </CardContent>
                    </Card>
                )}
            </div>
            
            {/* Grades Modal */}
            <GradesModal 
                isOpen={isGradesModalOpen}
                onClose={handleCloseGradesModal}
                subject={selectedSubject}
            />
            
            {/* Materials Modal */}
            <MaterialsModal 
                isOpen={isMaterialsModalOpen}
                onClose={handleCloseMaterialsModal}
                subject={selectedSubject}
            />
        </AuthenticatedLayout>
    );
}