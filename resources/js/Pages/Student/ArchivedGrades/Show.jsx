import React from 'react';
import { Head, Link, usePage } from '@inertiajs/react';
import { route } from 'ziggy-js';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Archive, ArrowLeft } from 'lucide-react';

const Show = ({ subjects, academic_year, semester }) => {
    const { auth } = usePage().props;

    const allEnrollments = React.useMemo(() => {
        return Array.isArray(subjects) ? subjects : [];
    }, [subjects]);

    function formatSectionName(section) {
        if (!section) return 'N/A';
        // section may come as { section_name } or { name } from archived payloads
        const sectionName = section.section_name || section.name || '';
        if (section.program?.program_code && section.year_level) {
            return `${section.program.program_code}-${section.year_level}${sectionName}`;
        }
        // also accept program_code/year_level at top-level of section object
        if (section.program_code && section.year_level) {
            return `${section.program_code}-${section.year_level}${sectionName}`;
        }
        return sectionName || 'N/A';
    }

    const groupedEnrollments = React.useMemo(() => {
        const groups = {};
        const labels = {};
        // consider only enrollments the student actually took (has subject_code and at least one grade or final_semester_grade)
        // include only enrollments that belong to the current authenticated student
        const takenEnrollments = allEnrollments.filter(enr => {
            if (!enr) return false;

            // If enrollment has student_data (archive student payload), match student number/id
            if (enr.student_data) {
                const studentNumber = enr.student_data.student_number || enr.student_data.student_id || '';
                const authStudentNumber = (typeof auth?.user?.student_number !== 'undefined') ? String(auth.user.student_number) : null;
                const authStudentId = (typeof auth?.user?.id !== 'undefined') ? String(auth.user.id) : null;

                if (authStudentNumber && studentNumber && String(studentNumber) === authStudentNumber) return true;
                if (authStudentId && String(enr.student_id || enr.student_data.student_id || '') === authStudentId) return true;
                return false;
            }

            // If enrollment has direct student_id, compare to auth.user.id
            if (enr.student_id) {
                return String(enr.student_id) === String(auth?.user?.id);
            }

            // If none of the above, fall back to including enrollments that at least have a subject identifier
            return !!(enr.subject_code || enr.subject_id);
        });

        takenEnrollments.forEach((enr) => {
            let key;
            let label;

            // Prefer archived_section payload if available (admin/archived sections)
            if (enr.archived_section && (enr.archived_section.id || enr.archived_section.section_name || enr.archived_section.name)) {
                const sec = enr.archived_section;
                key = `archived-${sec.id ?? sec.section_name ?? sec.name}`;
                const formatted = formatSectionName(sec);
                if (formatted && formatted !== 'N/A') {
                    label = formatted;
                } else {
                    const programCode = sec.program?.program_code || sec.program_code || enr.program_code || '';
                    const yearLevel = sec.year_level || enr.year_level || '';
                    const identifier = sec.section_name || sec.name || '';
                    const built = programCode && yearLevel ? `${programCode}-${yearLevel}${identifier}` : (identifier || `Section ${sec.id}`);
                    label = built;
                }
            } else if (enr.section && (enr.section.id || enr.section.section_name || enr.section.name)) {
                const sec = enr.section;
                key = `section-${sec.id ?? sec.section_name ?? sec.name}`;
                const formatted = formatSectionName(sec);
                // prefer formatted string, otherwise attempt to build from available fields
                if (formatted && formatted !== 'N/A') {
                    label = formatted;
                } else {
                    const programCode = sec.program?.program_code || sec.program_code || enr.program_code || '';
                    const yearLevel = sec.year_level || enr.year_level || '';
                    const identifier = sec.section_name || sec.name || '';
                    const built = programCode && yearLevel ? `${programCode}-${yearLevel}${identifier}` : (identifier || `Section ${sec.id}`);
                    label = built;
                }
            } else if (enr.section_name) {
                key = `section-name-${enr.section_name}`;
                // try to build formatted label from available top-level fields
                if (enr.program_code && enr.year_level) {
                    label = `${enr.program_code}-${enr.year_level}${enr.section_name}`;
                } else {
                    label = enr.section_name;
                }
            } else {
                key = 'unassigned';
                label = 'Unassigned';
            }

            if (!groups[key]) {
                groups[key] = [];
                labels[key] = label;
            }

            const exists = groups[key].some((s) => (s.subject_code || s.subject_id) === (enr.subject_code || enr.subject_id));
            if (!exists) {
                groups[key].push(enr);
            }
        });

        return { groups, labels };
    }, [allEnrollments, auth]);

    const getSemesterDisplay = (s) => {
        const semesters = {
            'first': '1st Semester',
            'second': '2nd Semester',
            'summer': 'Summer',
        };
        return semesters[s] || s;
    };

    

    const displayGrade = (grade) => {
        const num = Number(grade);
        return (!isNaN(num) && num > 0) ? num.toFixed(1) : '—';
    };

    return (
        <AuthenticatedLayout
            header={
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Button asChild variant="ghost" size="sm" className="mr-2">
                            <Link href={route('student.archived-grades')}>
                                <ArrowLeft className="w-4 h-4" />
                            </Link>
                        </Button>
                        <div className="bg-blue-100 p-1.5 rounded-md">
                            <Archive className="w-4 h-4 text-blue-600" />
                        </div>
                        <div>
                            <h2 className="text-lg font-semibold text-gray-900">
                                {academic_year} - {getSemesterDisplay(semester)}
                            </h2>
                            <p className="text-xs text-gray-500 mt-0.5">View grades for this academic period</p>
                        </div>
                    </div>
                </div>
            }
        >
            <Head title={`${academic_year} - ${getSemesterDisplay(semester)} Grades`} />

            <div className="py-6">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    {allEnrollments.length === 0 ? (
                        <Card>
                            <CardContent className="flex flex-col items-center justify-center py-12">
                                <Archive className="h-16 w-16 text-gray-400 mb-4" />
                                <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">No Grades Found</h3>
                                <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">No archived grades found for this academic period.</p>
                            </CardContent>
                        </Card>
                    ) : (
                        (() => {
                            const keys = Object.keys(groupedEnrollments.groups || {});
                            keys.sort((a, b) => (groupedEnrollments.labels[a] || a).localeCompare(groupedEnrollments.labels[b] || b));
                            return keys.map((key) => (
                                <Card key={key} className="mb-6">
                                    <div className="px-6 py-3 bg-gray-50 border-b">
                                        <h3 className="text-sm font-medium text-gray-700">{groupedEnrollments.labels[key]}</h3>
                                    </div>
                                    <div className="overflow-x-auto">
                                        <table className="min-w-full divide-y divide-gray-200">
                                            <thead className="bg-gray-50">
                                                <tr>
                                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500">Subject Code</th>
                                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500">Teacher</th>
                                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500">Prelim</th>
                                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500">Midterm</th>
                                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500">Prefinal</th>
                                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500">Final</th>
                                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500">Semester</th>
                                                </tr>
                                            </thead>
                                            <tbody className="bg-white divide-y divide-gray-200">
                                                {groupedEnrollments.groups[key].map((enr, idx) => (
                                                    <tr key={enr.id || `${key}-${idx}`} className="hover:bg-gray-50">
                                                        <td className="px-6 py-4 text-sm text-gray-900">
                                                            <span title={enr.subject_name || ''} className="cursor-help">
                                                                {enr.subject_code}
                                                            </span>
                                                        </td>
                                                        <td className="px-6 py-4 text-sm text-gray-900">
                                                            {enr.teacher_name || '—'}
                                                        </td>
                                                    
                                                        <td className="px-6 py-4 text-sm text-gray-900">{displayGrade(enr.final_grades?.prelim)}</td>
                                                        <td className="px-6 py-4 text-sm text-gray-900">{displayGrade(enr.final_grades?.midterm)}</td>
                                                        <td className="px-6 py-4 text-sm text-gray-900">{displayGrade(enr.final_grades?.prefinals)}</td>
                                                        <td className="px-6 py-4 text-sm text-gray-900">{displayGrade(enr.final_grades?.finals)}</td>
                                                        <td className="px-6 py-4 text-sm text-gray-900">{displayGrade(enr.final_semester_grade)}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </Card>
                            ));
                        })()
                    )}
                </div>
            </div>
        </AuthenticatedLayout>
    );
};

export default Show;
