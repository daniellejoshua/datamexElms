<?php

namespace Database\Seeders;

use App\Models\Subject;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class SubjectSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Get the BSIT program ID dynamically
        $bsitProgram = \App\Models\Program::where('program_code', 'BSIT')->first();
        if (! $bsitProgram) {
            $this->command->error('BSIT program not found. Please run ProgramSeeder first.');

            return;
        }
        $bsitProgramId = $bsitProgram->id;

        // Clear existing subjects and related records first
        $this->command->warn('Clearing existing subjects and related records...');

        // Temporarily disable foreign key checks
        DB::statement('SET FOREIGN_KEY_CHECKS=0;');

        // Delete related records first due to foreign key constraints
        DB::table('student_subject_enrollments')->delete(); // This references section_subjects
        DB::table('section_subjects')->delete(); // This references subjects
        DB::table('curriculum_subjects')->delete(); // This references subjects

        // Now we can safely truncate the subjects table
        Subject::truncate();

        // Re-enable foreign key checks
        DB::statement('SET FOREIGN_KEY_CHECKS=1;');

        $this->command->info('All subjects and related records cleared.');

        $subjects = [
            [
                'subject_code' => 'CORE1',
                'subject_name' => 'Art Appreciation',
                'units' => 3,
                'subject_type' => 'minor',
                'program_id' => null,
            ],
            [
                'subject_code' => 'RIZAL',
                'subject_name' => "Rizal's Life, Works & Writings",
                'units' => 3,
                'subject_type' => 'minor',
                'program_id' => null,
            ],
            [
                'subject_code' => 'ITE1',
                'subject_name' => 'Introduction to Computing',
                'units' => 3,
                'subject_type' => 'major',
                'program_id' => $bsitProgramId,
            ],
            [
                'subject_code' => 'ITE2',
                'subject_name' => 'Fundamentals of Programming 1',
                'units' => 3,
                'subject_type' => 'major',
                'program_id' => $bsitProgramId,
            ],
            [
                'subject_code' => 'CORE2',
                'subject_name' => 'Purposive Communication',
                'units' => 3,
                'subject_type' => 'minor',
                'program_id' => null,
            ],
            [
                'subject_code' => 'CORE3',
                'subject_name' => 'Mathematics in the Modern World',
                'units' => 3,
                'subject_type' => 'minor',
                'program_id' => null,
            ],
            [
                'subject_code' => 'PE1',
                'subject_name' => 'Physical Education 1',
                'units' => 2,
                'subject_type' => 'minor',
                'program_id' => null,
            ],
            [
                'subject_code' => 'NSTP1',
                'subject_name' => 'National Service Training Program 1',
                'units' => 3,
                'subject_type' => 'minor',
                'program_id' => null,
            ],
            [
                'subject_code' => 'CVED101',
                'subject_name' => 'Values Education',
                'units' => 3,
                'subject_type' => 'minor',
                'program_id' => null,
            ],
            [
                'subject_code' => 'CORE4',
                'subject_name' => 'Understanding the Self',
                'units' => 3,
                'subject_type' => 'minor',
                'program_id' => null,
            ],
            [
                'subject_code' => 'CORE5',
                'subject_name' => 'Science, Technology & Society',
                'units' => 3,
                'subject_type' => 'minor',
                'program_id' => null,
            ],
            [
                'subject_code' => 'ITE3',
                'subject_name' => 'Fundamentals of Programming 2',
                'units' => 3,
                'subject_type' => 'major',
                'program_id' => $bsitProgramId,
            ],
            [
                'subject_code' => 'ITEMAJOR1',
                'subject_name' => 'Introduction to Human Interaction',
                'units' => 3,
                'subject_type' => 'major',
                'program_id' => $bsitProgramId,
            ],
            [
                'subject_code' => 'ITE4',
                'subject_name' => 'Data Structures & Algorithms',
                'units' => 3,
                'subject_type' => 'major',
                'program_id' => $bsitProgramId,
            ],
            [
                'subject_code' => 'ITEMAJOR2',
                'subject_name' => 'Discrete Mathematics',
                'units' => 3,
                'subject_type' => 'major',
                'program_id' => $bsitProgramId,
            ],
            [
                'subject_code' => 'PE2',
                'subject_name' => 'Physical Education 2',
                'units' => 2,
                'subject_type' => 'minor',
                'program_id' => null,
            ],
            [
                'subject_code' => 'NSTP2',
                'subject_name' => 'National Service Training Program 2',
                'units' => 3,
                'subject_type' => 'minor',
                'program_id' => null,
            ],
            [
                'subject_code' => 'CVED102',
                'subject_name' => 'Values Education 2',
                'units' => 3,
                'subject_type' => 'minor',
                'program_id' => null,
            ],
            [
                'subject_code' => 'ELECTIVE1',
                'subject_name' => 'Object Oriented Programming',
                'units' => 3,
                'subject_type' => 'major',
                'program_id' => $bsitProgramId,
            ],
            [
                'subject_code' => 'FIL1',
                'subject_name' => 'Filipino 1 (Kontekstwalisadong Komunikasyon sa Filipino)',
                'units' => 3,
                'subject_type' => 'minor',
                'program_id' => null,
            ],
            [
                'subject_code' => 'APC1',
                'subject_name' => 'Platform Technologies',
                'units' => 3,
                'subject_type' => 'major',
                'program_id' => $bsitProgramId,
            ],
            [
                'subject_code' => 'CORE6',
                'subject_name' => 'The Contemporary World',
                'units' => 3,
                'subject_type' => 'minor',
                'program_id' => null,
            ],
            [
                'subject_code' => 'APC2',
                'subject_name' => 'Multimedia Systems',
                'units' => 3,
                'subject_type' => 'major',
                'program_id' => $bsitProgramId,
            ],
            [
                'subject_code' => 'APC3',
                'subject_name' => 'Web System Technologies',
                'units' => 3,
                'subject_type' => 'major',
                'program_id' => $bsitProgramId,
            ],
            [
                'subject_code' => 'ITEMAJOR3',
                'subject_name' => 'Fundamentals of Database Systems',
                'units' => 3,
                'subject_type' => 'major',
                'program_id' => $bsitProgramId,
            ],
            [
                'subject_code' => 'CVED103',
                'subject_name' => 'Morality & Social Responsibility',
                'units' => 3,
                'subject_type' => 'minor',
                'program_id' => null,
            ],
            [
                'subject_code' => 'PE3',
                'subject_name' => 'Physical Education 3',
                'units' => 2,
                'subject_type' => 'minor',
                'program_id' => null,
            ],
            [
                'subject_code' => 'CORE7',
                'subject_name' => 'Ethics',
                'units' => 3,
                'subject_type' => 'minor',
                'program_id' => null,
            ],
            [
                'subject_code' => 'FIL2',
                'subject_name' => "Filipino 2 (Filipino sa Iba't Ibang Disiplina)",
                'units' => 3,
                'subject_type' => 'minor',
                'program_id' => null,
            ],
            [
                'subject_code' => 'CORE8',
                'subject_name' => 'Reading in Philippine History',
                'units' => 3,
                'subject_type' => 'minor',
                'program_id' => null,
            ],
            [
                'subject_code' => 'ITE5',
                'subject_name' => 'Information Management',
                'units' => 3,
                'subject_type' => 'major',
                'program_id' => $bsitProgramId,
            ],
            [
                'subject_code' => 'ITEMAJOR4',
                'subject_name' => 'Data Communication & Networking 1',
                'units' => 3,
                'subject_type' => 'major',
                'program_id' => $bsitProgramId,
            ],
            [
                'subject_code' => 'ITEMAJOR5',
                'subject_name' => 'Quantitative Methods',
                'units' => 3,
                'subject_type' => 'major',
                'program_id' => $bsitProgramId,
            ],
            [
                'subject_code' => 'CVED104',
                'subject_name' => 'Peace Education, Marriage & Family Planning',
                'units' => 3,
                'subject_type' => 'minor',
                'program_id' => null,
            ],
            [
                'subject_code' => 'PE4',
                'subject_name' => 'Physical Education 4',
                'units' => 2,
                'subject_type' => 'minor',
                'program_id' => null,
            ],
            [
                'subject_code' => 'ELECTIVE2',
                'subject_name' => 'Human Computer Interaction 2',
                'units' => 3,
                'subject_type' => 'major',
                'program_id' => $bsitProgramId,
            ],
            [
                'subject_code' => 'ITEMAJOR6',
                'subject_name' => 'Data Communication & Networking 2',
                'units' => 3,
                'subject_type' => 'major',
                'program_id' => $bsitProgramId,
            ],
            [
                'subject_code' => 'ITEMAJOR7',
                'subject_name' => 'Systems Integration & Architecture 1',
                'units' => 3,
                'subject_type' => 'major',
                'program_id' => $bsitProgramId,
            ],
            [
                'subject_code' => 'ITEMAJOR8',
                'subject_name' => 'Integrative Programming & Technologies 1',
                'units' => 3,
                'subject_type' => 'major',
                'program_id' => $bsitProgramId,
            ],
            [
                'subject_code' => 'APC4',
                'subject_name' => 'Mobile Technology',
                'units' => 3,
                'subject_type' => 'major',
                'program_id' => $bsitProgramId,
            ],
            [
                'subject_code' => 'APC5',
                'subject_name' => 'Software Engineering',
                'units' => 3,
                'subject_type' => 'major',
                'program_id' => $bsitProgramId,
            ],
            [
                'subject_code' => 'ITEMAJOR9',
                'subject_name' => 'Information Assurance & Security 1',
                'units' => 3,
                'subject_type' => 'major',
                'program_id' => $bsitProgramId,
            ],
            [
                'subject_code' => 'ITEMAJOR10',
                'subject_name' => 'Social & Professional Issues',
                'units' => 3,
                'subject_type' => 'major',
                'program_id' => $bsitProgramId,
            ],
            [
                'subject_code' => 'ITEMAJOR11',
                'subject_name' => 'Capstone Project & Research 1',
                'units' => 3,
                'subject_type' => 'major',
                'program_id' => $bsitProgramId,
            ],
            [
                'subject_code' => 'ITE6',
                'subject_name' => 'Application Development & Emerging Technologies',
                'units' => 3,
                'subject_type' => 'major',
                'program_id' => $bsitProgramId,
            ],
            [
                'subject_code' => 'ELECTIVE3',
                'subject_name' => 'Systems Integration & Architecture 2',
                'units' => 3,
                'subject_type' => 'major',
                'program_id' => $bsitProgramId,
            ],
            [
                'subject_code' => 'APC6',
                'subject_name' => 'Cloud Computing',
                'units' => 3,
                'subject_type' => 'major',
                'program_id' => $bsitProgramId,
            ],
            [
                'subject_code' => 'ITEMAJOR12',
                'subject_name' => 'Internship / OJT (500 hrs)',
                'units' => 6,
                'subject_type' => 'major',
                'program_id' => $bsitProgramId,
            ],
            [
                'subject_code' => 'ITEMAJOR13',
                'subject_name' => 'System Administration & Maintenance',
                'units' => 3,
                'subject_type' => 'major',
                'program_id' => $bsitProgramId,
            ],
            [
                'subject_code' => 'ITEMAJOR14',
                'subject_name' => 'Information Assurance & Security 2',
                'units' => 3,
                'subject_type' => 'major',
                'program_id' => $bsitProgramId,
            ],
            [
                'subject_code' => 'ITEMAJOR15',
                'subject_name' => 'Capstone Project & Research 2',
                'units' => 3,
                'subject_type' => 'major',
                'program_id' => $bsitProgramId,
            ],
            [
                'subject_code' => 'ELECTIVE4',
                'subject_name' => 'Integrative Programming & Technologies 2',
                'units' => 3,
                'subject_type' => 'major',
                'program_id' => $bsitProgramId,
            ],
            [
                'subject_code' => 'LIT',
                'subject_name' => 'Panitikan',
                'units' => 3,
                'subject_type' => 'minor',
                'program_id' => null,
            ],
        ];

        $this->command->info('Seeding subjects...');

        foreach ($subjects as $subjectData) {
            try {
                Subject::create($subjectData);
                $this->command->info("Created subject: {$subjectData['subject_code']} - {$subjectData['subject_name']}");
            } catch (\Exception $e) {
                $this->command->error("Failed to create subject {$subjectData['subject_code']}: {$e->getMessage()}");
            }
        }

        $this->command->info('Subject seeding completed! Created: '.count($subjects).' subjects');
    }
}
