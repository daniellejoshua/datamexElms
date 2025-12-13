<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;

class CurriculumSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $this->seedSHSCurriculum();
        $this->seedACTCurriculum();
        $this->seedBSITCurriculum();
        $this->seedBSHMCurriculum();
    }

    private function seedSHSCurriculum()
    {
        $program = \App\Models\Program::where('program_code', 'SHS')->first();

        if (! $program) {
            $this->command->info('SHS program not found, skipping SHS curriculum seeder.');

            return;
        }

        $curriculum = \App\Models\Curriculum::firstOrCreate([
            'program_id' => $program->id,
            'curriculum_code' => 'SHS-2022',
        ], [
            'curriculum_name' => 'Senior High School Curriculum 2022',
            'academic_year' => '2022-2023',
            'description' => 'SHS curriculum for Grade 11 and 12',
            'status' => 'active',
        ]);

        $subjects = [
            // Grade 11 - First Semester
            ['subject_code' => 'ENG11', 'subject_name' => 'English for Academic and Professional Purposes', 'units' => 3, 'year_level' => 1, 'semester' => '1st', 'subject_type' => 'core'],
            ['subject_code' => 'FIL11', 'subject_name' => 'Filipino sa Piling Larangan', 'units' => 3, 'year_level' => 1, 'semester' => '1st', 'subject_type' => 'core'],
            ['subject_code' => 'MATH11', 'subject_name' => 'Pre-Calculus', 'units' => 3, 'year_level' => 1, 'semester' => '1st', 'subject_type' => 'core'],
            ['subject_code' => 'SCI11', 'subject_name' => 'Earth and Life Science', 'units' => 3, 'year_level' => 1, 'semester' => '1st', 'subject_type' => 'core'],
            ['subject_code' => 'SOCSCI11', 'subject_name' => 'Introduction to the Philosophy of the Human Person', 'units' => 3, 'year_level' => 1, 'semester' => '1st', 'subject_type' => 'core'],
            ['subject_code' => 'PE11', 'subject_name' => 'Physical Education and Health 1', 'units' => 2, 'year_level' => 1, 'semester' => '1st', 'subject_type' => 'core'],
            ['subject_code' => 'ICT11', 'subject_name' => 'Introduction to Computing', 'units' => 3, 'year_level' => 1, 'semester' => '1st', 'subject_type' => 'specialized'],

            // Grade 11 - Second Semester
            ['subject_code' => 'ENG12', 'subject_name' => 'Reading and Writing Skills', 'units' => 3, 'year_level' => 1, 'semester' => '2nd', 'subject_type' => 'core'],
            ['subject_code' => 'FIL12', 'subject_name' => 'Pagbasa at Pagsusuri ng Iba\'t Ibang Teksto Tungo sa Pananaliksik', 'units' => 3, 'year_level' => 1, 'semester' => '2nd', 'subject_type' => 'core'],
            ['subject_code' => 'MATH12', 'subject_name' => 'Basic Calculus', 'units' => 3, 'year_level' => 1, 'semester' => '2nd', 'subject_type' => 'core'],
            ['subject_code' => 'SCI12', 'subject_name' => 'Physical Science', 'units' => 3, 'year_level' => 1, 'semester' => '2nd', 'subject_type' => 'core'],
            ['subject_code' => 'SOCSCI12', 'subject_name' => 'Contemporary Philippine Arts from the Regions', 'units' => 3, 'year_level' => 1, 'semester' => '2nd', 'subject_type' => 'core'],
            ['subject_code' => 'PE12', 'subject_name' => 'Physical Education and Health 2', 'units' => 2, 'year_level' => 1, 'semester' => '2nd', 'subject_type' => 'core'],
            ['subject_code' => 'ICT12', 'subject_name' => 'Fundamentals of Programming', 'units' => 3, 'year_level' => 1, 'semester' => '2nd', 'subject_type' => 'specialized'],

            // Grade 12 - First Semester
            ['subject_code' => 'ENG21', 'subject_name' => 'English for Academic and Professional Purposes', 'units' => 3, 'year_level' => 2, 'semester' => '1st', 'subject_type' => 'core'],
            ['subject_code' => 'FIL21', 'subject_name' => 'Filipino sa Piling Larangan', 'units' => 3, 'year_level' => 2, 'semester' => '1st', 'subject_type' => 'core'],
            ['subject_code' => 'MATH21', 'subject_name' => 'General Mathematics', 'units' => 3, 'year_level' => 2, 'semester' => '1st', 'subject_type' => 'core'],
            ['subject_code' => 'SCI21', 'subject_name' => 'Disaster Readiness and Risk Reduction', 'units' => 3, 'year_level' => 2, 'semester' => '1st', 'subject_type' => 'core'],
            ['subject_code' => 'SOCSCI21', 'subject_name' => 'Understanding Culture, Society and Politics', 'units' => 3, 'year_level' => 2, 'semester' => '1st', 'subject_type' => 'core'],
            ['subject_code' => 'PE21', 'subject_name' => 'Physical Education and Health 3', 'units' => 2, 'year_level' => 2, 'semester' => '1st', 'subject_type' => 'core'],
            ['subject_code' => 'ICT21', 'subject_name' => 'Web Development', 'units' => 3, 'year_level' => 2, 'semester' => '1st', 'subject_type' => 'specialized'],

            // Grade 12 - Second Semester
            ['subject_code' => 'ENG22', 'subject_name' => 'Research in Daily Life 1', 'units' => 3, 'year_level' => 2, 'semester' => '2nd', 'subject_type' => 'core'],
            ['subject_code' => 'FIL22', 'subject_name' => 'Pagsulat sa Filipino sa Larangan ng Akademik', 'units' => 3, 'year_level' => 2, 'semester' => '2nd', 'subject_type' => 'core'],
            ['subject_code' => 'MATH22', 'subject_name' => 'Statistics and Probability', 'units' => 3, 'year_level' => 2, 'semester' => '2nd', 'subject_type' => 'core'],
            ['subject_code' => 'SCI22', 'subject_name' => 'Earth Science', 'units' => 3, 'year_level' => 2, 'semester' => '2nd', 'subject_type' => 'core'],
            ['subject_code' => 'SOCSCI22', 'subject_name' => 'Media and Information Literacy', 'units' => 3, 'year_level' => 2, 'semester' => '2nd', 'subject_type' => 'core'],
            ['subject_code' => 'PE22', 'subject_name' => 'Physical Education and Health 4', 'units' => 2, 'year_level' => 2, 'semester' => '2nd', 'subject_type' => 'core'],
            ['subject_code' => 'ICT22', 'subject_name' => 'Practical Research 1', 'units' => 3, 'year_level' => 2, 'semester' => '2nd', 'subject_type' => 'specialized'],
        ];

        $this->createCurriculumSubjects($curriculum, $subjects);
        $this->command->info('SHS-2022 curriculum and subjects seeded.');
    }

    private function seedACTCurriculum()
    {
        $program = \App\Models\Program::where('program_code', 'ACT')->first();

        if (! $program) {
            $this->command->info('ACT program not found, skipping ACT curriculum seeder.');

            return;
        }

        $curriculum = \App\Models\Curriculum::firstOrCreate([
            'program_id' => $program->id,
            'curriculum_code' => 'ACT-2022',
        ], [
            'curriculum_name' => 'Associate in Computer Technology Curriculum 2022',
            'academic_year' => '2022-2023',
            'description' => 'ACT curriculum for 2-year associate program',
            'status' => 'active',
        ]);

        $subjects = [
            // First Year - First Semester
            ['subject_code' => 'ENG101', 'subject_name' => 'Communication Skills 1', 'units' => 3, 'year_level' => 1, 'semester' => '1st', 'subject_type' => 'general'],
            ['subject_code' => 'MATH101', 'subject_name' => 'Mathematics for Computing', 'units' => 3, 'year_level' => 1, 'semester' => '1st', 'subject_type' => 'general'],
            ['subject_code' => 'COMP101', 'subject_name' => 'Introduction to Computing', 'units' => 3, 'year_level' => 1, 'semester' => '1st', 'subject_type' => 'major'],
            ['subject_code' => 'PROG101', 'subject_name' => 'Computer Programming 1', 'units' => 3, 'year_level' => 1, 'semester' => '1st', 'subject_type' => 'major'],
            ['subject_code' => 'PE101', 'subject_name' => 'Physical Education 1', 'units' => 2, 'year_level' => 1, 'semester' => '1st', 'subject_type' => 'general'],
            ['subject_code' => 'NSTP101', 'subject_name' => 'NSTP 1', 'units' => 3, 'year_level' => 1, 'semester' => '1st', 'subject_type' => 'general'],

            // First Year - Second Semester
            ['subject_code' => 'ENG102', 'subject_name' => 'Communication Skills 2', 'units' => 3, 'year_level' => 1, 'semester' => '2nd', 'subject_type' => 'general'],
            ['subject_code' => 'MATH102', 'subject_name' => 'Discrete Mathematics', 'units' => 3, 'year_level' => 1, 'semester' => '2nd', 'subject_type' => 'general'],
            ['subject_code' => 'PROG102', 'subject_name' => 'Computer Programming 2', 'units' => 3, 'year_level' => 1, 'semester' => '2nd', 'subject_type' => 'major', 'prerequisites' => 'PROG101'],
            ['subject_code' => 'WEB101', 'subject_name' => 'Web Development Fundamentals', 'units' => 3, 'year_level' => 1, 'semester' => '2nd', 'subject_type' => 'major'],
            ['subject_code' => 'DB101', 'subject_name' => 'Database Management Systems', 'units' => 3, 'year_level' => 1, 'semester' => '2nd', 'subject_type' => 'major'],
            ['subject_code' => 'PE102', 'subject_name' => 'Physical Education 2', 'units' => 2, 'year_level' => 1, 'semester' => '2nd', 'subject_type' => 'general'],
            ['subject_code' => 'NSTP102', 'subject_name' => 'NSTP 2', 'units' => 3, 'year_level' => 1, 'semester' => '2nd', 'subject_type' => 'general'],

            // Second Year - First Semester
            ['subject_code' => 'NET201', 'subject_name' => 'Computer Networks', 'units' => 3, 'year_level' => 2, 'semester' => '1st', 'subject_type' => 'major'],
            ['subject_code' => 'SYS201', 'subject_name' => 'Operating Systems', 'units' => 3, 'year_level' => 2, 'semester' => '1st', 'subject_type' => 'major'],
            ['subject_code' => 'PROJ201', 'subject_name' => 'IT Project Management', 'units' => 3, 'year_level' => 2, 'semester' => '1st', 'subject_type' => 'major'],
            ['subject_code' => 'SEC201', 'subject_name' => 'Information Security Fundamentals', 'units' => 3, 'year_level' => 2, 'semester' => '1st', 'subject_type' => 'major'],
            ['subject_code' => 'ELECT201', 'subject_name' => 'IT Elective 1', 'units' => 3, 'year_level' => 2, 'semester' => '1st', 'subject_type' => 'elective'],

            // Second Year - Second Semester
            ['subject_code' => 'CAP202', 'subject_name' => 'Capstone Project', 'units' => 3, 'year_level' => 2, 'semester' => '2nd', 'subject_type' => 'major'],
            ['subject_code' => 'INT202', 'subject_name' => 'IT Internship', 'units' => 6, 'year_level' => 2, 'semester' => '2nd', 'subject_type' => 'major'],
        ];

        $this->createCurriculumSubjects($curriculum, $subjects);
        $this->command->info('ACT-2022 curriculum and subjects seeded.');
    }

    private function seedBSITCurriculum()
    {
        $program = \App\Models\Program::where('program_code', 'BSIT')->first();

        if (! $program) {
            $this->command->info('BSIT program not found, skipping BSIT curriculum seeder.');

            return;
        }

        $curriculum = \App\Models\Curriculum::firstOrCreate([
            'program_id' => $program->id,
            'curriculum_code' => 'BSIT-2022',
        ], [
            'curriculum_name' => $program->program_name.' Curriculum 2022',
            'academic_year' => '2022-2023',
            'description' => 'BSIT official curriculum for 2022 (imported)',
            'status' => 'active',
        ]);

        // BSIT subjects (keeping the existing comprehensive list)
        $subjects = [
            // First Year - First Semester
            ['subject_code' => 'ART101', 'subject_name' => 'Art Appreciation', 'units' => 3, 'year_level' => 1, 'semester' => '1st', 'subject_type' => 'general'],
            ['subject_code' => 'RIZAL101', 'subject_name' => "Rizal's Life Works & Writings", 'units' => 3, 'year_level' => 1, 'semester' => '1st', 'subject_type' => 'general'],
            ['subject_code' => 'ITE101', 'subject_name' => 'Introduction to Computing', 'units' => 3, 'year_level' => 1, 'semester' => '1st', 'subject_type' => 'major'],
            ['subject_code' => 'CS101', 'subject_name' => 'Fundamentals of Programming 1', 'units' => 3, 'year_level' => 1, 'semester' => '1st', 'subject_type' => 'major'],
            ['subject_code' => 'ENG101', 'subject_name' => 'Purposive Communication', 'units' => 3, 'year_level' => 1, 'semester' => '1st', 'subject_type' => 'general'],
            ['subject_code' => 'MATH101', 'subject_name' => 'Mathematics in the Modern World', 'units' => 3, 'year_level' => 1, 'semester' => '1st', 'subject_type' => 'general'],
            ['subject_code' => 'PE1', 'subject_name' => 'Physical Education 1', 'units' => 1, 'year_level' => 1, 'semester' => '1st', 'subject_type' => 'general'],
            ['subject_code' => 'NSTP1', 'subject_name' => 'NSTP 1', 'units' => 3, 'year_level' => 1, 'semester' => '1st', 'subject_type' => 'general'],

            // First Year - Second Semester
            ['subject_code' => 'PSY101', 'subject_name' => 'Understanding the Self', 'units' => 3, 'year_level' => 1, 'semester' => '2nd', 'subject_type' => 'general'],
            ['subject_code' => 'STS101', 'subject_name' => 'Science, Technology and Society', 'units' => 3, 'year_level' => 1, 'semester' => '2nd', 'subject_type' => 'general'],
            ['subject_code' => 'CS102', 'subject_name' => 'Fundamentals of Programming 2', 'units' => 3, 'year_level' => 1, 'semester' => '2nd', 'subject_type' => 'major', 'prerequisites' => 'CS101'],
            ['subject_code' => 'HUM101', 'subject_name' => 'Introduction to Human Interaction', 'units' => 3, 'year_level' => 1, 'semester' => '2nd', 'subject_type' => 'general'],
            ['subject_code' => 'CS103', 'subject_name' => 'Data Structures & Algorithms', 'units' => 3, 'year_level' => 1, 'semester' => '2nd', 'subject_type' => 'major', 'prerequisites' => 'CS102'],
            ['subject_code' => 'MATH102', 'subject_name' => 'Discrete Mathematics', 'units' => 3, 'year_level' => 1, 'semester' => '2nd', 'subject_type' => 'general'],
            ['subject_code' => 'PE2', 'subject_name' => 'Physical Education 2', 'units' => 1, 'year_level' => 1, 'semester' => '2nd', 'subject_type' => 'general'],
            ['subject_code' => 'NSTP2', 'subject_name' => 'NSTP 2', 'units' => 3, 'year_level' => 1, 'semester' => '2nd', 'subject_type' => 'general'],

            // Second Year - First Semester
            ['subject_code' => 'CS201', 'subject_name' => 'Object Oriented Programming', 'units' => 3, 'year_level' => 2, 'semester' => '1st', 'subject_type' => 'major', 'prerequisites' => 'CS103'],
            ['subject_code' => 'FIL201', 'subject_name' => 'Filipino', 'units' => 3, 'year_level' => 2, 'semester' => '1st', 'subject_type' => 'general'],
            ['subject_code' => 'IT201', 'subject_name' => 'Platform Technologies', 'units' => 3, 'year_level' => 2, 'semester' => '1st', 'subject_type' => 'major'],
            ['subject_code' => 'GEN201', 'subject_name' => 'The Contemporary World', 'units' => 3, 'year_level' => 2, 'semester' => '1st', 'subject_type' => 'general'],
            ['subject_code' => 'MULT201', 'subject_name' => 'Multimedia Systems', 'units' => 3, 'year_level' => 2, 'semester' => '1st', 'subject_type' => 'major'],
            ['subject_code' => 'WEB201', 'subject_name' => 'Web System Technologies', 'units' => 3, 'year_level' => 2, 'semester' => '1st', 'subject_type' => 'major'],
            ['subject_code' => 'DB201', 'subject_name' => 'Fundamentals of Database Systems', 'units' => 3, 'year_level' => 2, 'semester' => '1st', 'subject_type' => 'major'],

            // Second Year - Second Semester
            ['subject_code' => 'ETH201', 'subject_name' => 'Ethics', 'units' => 3, 'year_level' => 2, 'semester' => '2nd', 'subject_type' => 'general'],
            ['subject_code' => 'HIST201', 'subject_name' => 'Reading in Philippine History', 'units' => 3, 'year_level' => 2, 'semester' => '2nd', 'subject_type' => 'general'],
            ['subject_code' => 'IM201', 'subject_name' => 'Information Management', 'units' => 3, 'year_level' => 2, 'semester' => '2nd', 'subject_type' => 'major'],
            ['subject_code' => 'CN201', 'subject_name' => 'Data Communication & Networking 1', 'units' => 3, 'year_level' => 2, 'semester' => '2nd', 'subject_type' => 'major'],
            ['subject_code' => 'QM201', 'subject_name' => 'Quantitative Methods', 'units' => 3, 'year_level' => 2, 'semester' => '2nd', 'subject_type' => 'general'],
            ['subject_code' => 'PE3', 'subject_name' => 'Physical Education 3', 'units' => 1, 'year_level' => 2, 'semester' => '2nd', 'subject_type' => 'general'],

            // Third Year - First Semester
            ['subject_code' => 'HCI301', 'subject_name' => 'Human Computer Interaction', 'units' => 3, 'year_level' => 3, 'semester' => '1st', 'subject_type' => 'major'],
            ['subject_code' => 'CN301', 'subject_name' => 'Data Communication & Networking 2', 'units' => 3, 'year_level' => 3, 'semester' => '1st', 'subject_type' => 'major'],
            ['subject_code' => 'SIA301', 'subject_name' => 'Systems Integration & Architecture 1', 'units' => 3, 'year_level' => 3, 'semester' => '1st', 'subject_type' => 'major'],
            ['subject_code' => 'IPT301', 'subject_name' => 'Integrative Programming Technologies 1', 'units' => 3, 'year_level' => 3, 'semester' => '1st', 'subject_type' => 'major'],
            ['subject_code' => 'MOB301', 'subject_name' => 'Mobile Technology', 'units' => 3, 'year_level' => 3, 'semester' => '1st', 'subject_type' => 'major'],

            // Third Year - Second Semester
            ['subject_code' => 'SEC301', 'subject_name' => 'Information Assurance & Security 1', 'units' => 3, 'year_level' => 3, 'semester' => '2nd', 'subject_type' => 'major'],
            ['subject_code' => 'PROJ301', 'subject_name' => 'Capstone Project & Research 1', 'units' => 3, 'year_level' => 3, 'semester' => '2nd', 'subject_type' => 'major'],
            ['subject_code' => 'APP301', 'subject_name' => 'Application Development & Emerging Technologies', 'units' => 3, 'year_level' => 3, 'semester' => '2nd', 'subject_type' => 'major'],

            // Fourth Year - Internship / Capstone
            ['subject_code' => 'INT401', 'subject_name' => 'Internship/Practicum (500 hrs)', 'units' => 6, 'year_level' => 4, 'semester' => '1st', 'subject_type' => 'elective'],
            ['subject_code' => 'SA402', 'subject_name' => 'System Administration & Maintenance', 'units' => 3, 'year_level' => 4, 'semester' => '2nd', 'subject_type' => 'major'],
            ['subject_code' => 'SEC402', 'subject_name' => 'Information Assurance & Security 2', 'units' => 3, 'year_level' => 4, 'semester' => '2nd', 'subject_type' => 'major'],
            ['subject_code' => 'PROJ402', 'subject_name' => 'Capstone Project & Research 2', 'units' => 3, 'year_level' => 4, 'semester' => '2nd', 'subject_type' => 'major'],
        ];

        $this->createCurriculumSubjects($curriculum, $subjects);
        $this->command->info('BSIT-2022 curriculum and subjects seeded.');
    }

    private function seedBSHMCurriculum()
    {
        $program = \App\Models\Program::where('program_code', 'BSHM')->first();

        if (! $program) {
            $this->command->info('BSHM program not found, skipping BSHM curriculum seeder.');

            return;
        }

        $curriculum = \App\Models\Curriculum::firstOrCreate([
            'program_id' => $program->id,
            'curriculum_code' => 'BSHM-2022',
        ], [
            'curriculum_name' => $program->program_name.' Curriculum 2022',
            'academic_year' => '2022-2023',
            'description' => 'BSHM official curriculum for 2022',
            'status' => 'active',
        ]);

        $subjects = [
            // First Year - First Semester
            ['subject_code' => 'ENG101', 'subject_name' => 'Purposive Communication', 'units' => 3, 'year_level' => 1, 'semester' => '1st', 'subject_type' => 'general'],
            ['subject_code' => 'FIL101', 'subject_name' => 'Filipino 1', 'units' => 3, 'year_level' => 1, 'semester' => '1st', 'subject_type' => 'general'],
            ['subject_code' => 'MATH101', 'subject_name' => 'Mathematics in the Modern World', 'units' => 3, 'year_level' => 1, 'semester' => '1st', 'subject_type' => 'general'],
            ['subject_code' => 'SCI101', 'subject_name' => 'Biological Science', 'units' => 3, 'year_level' => 1, 'semester' => '1st', 'subject_type' => 'general'],
            ['subject_code' => 'HM101', 'subject_name' => 'Introduction to Hospitality Management', 'units' => 3, 'year_level' => 1, 'semester' => '1st', 'subject_type' => 'major'],
            ['subject_code' => 'CUL101', 'subject_name' => 'Philippine Culture and Tourism Geography', 'units' => 3, 'year_level' => 1, 'semester' => '1st', 'subject_type' => 'major'],
            ['subject_code' => 'PE1', 'subject_name' => 'Physical Education 1', 'units' => 2, 'year_level' => 1, 'semester' => '1st', 'subject_type' => 'general'],
            ['subject_code' => 'NSTP1', 'subject_name' => 'NSTP 1', 'units' => 3, 'year_level' => 1, 'semester' => '1st', 'subject_type' => 'general'],

            // First Year - Second Semester
            ['subject_code' => 'ENG102', 'subject_name' => 'Ethics', 'units' => 3, 'year_level' => 1, 'semester' => '2nd', 'subject_type' => 'general'],
            ['subject_code' => 'FIL102', 'subject_name' => 'Filipino 2', 'units' => 3, 'year_level' => 1, 'semester' => '2nd', 'subject_type' => 'general'],
            ['subject_code' => 'STS101', 'subject_name' => 'Science, Technology and Society', 'units' => 3, 'year_level' => 1, 'semester' => '2nd', 'subject_type' => 'general'],
            ['subject_code' => 'HIST101', 'subject_name' => 'Readings in Philippine History', 'units' => 3, 'year_level' => 1, 'semester' => '2nd', 'subject_type' => 'general'],
            ['subject_code' => 'FB101', 'subject_name' => 'Food and Beverage Services', 'units' => 3, 'year_level' => 1, 'semester' => '2nd', 'subject_type' => 'major'],
            ['subject_code' => 'ACC101', 'subject_name' => 'Fundamentals of Accounting', 'units' => 3, 'year_level' => 1, 'semester' => '2nd', 'subject_type' => 'major'],
            ['subject_code' => 'PE2', 'subject_name' => 'Physical Education 2', 'units' => 2, 'year_level' => 1, 'semester' => '2nd', 'subject_type' => 'general'],
            ['subject_code' => 'NSTP2', 'subject_name' => 'NSTP 2', 'units' => 3, 'year_level' => 1, 'semester' => '2nd', 'subject_type' => 'general'],

            // Second Year - First Semester
            ['subject_code' => 'MGMT201', 'subject_name' => 'Organization and Management', 'units' => 3, 'year_level' => 2, 'semester' => '1st', 'subject_type' => 'major'],
            ['subject_code' => 'ECON201', 'subject_name' => 'Microeconomics', 'units' => 3, 'year_level' => 2, 'semester' => '1st', 'subject_type' => 'general'],
            ['subject_code' => 'RM201', 'subject_name' => 'Room Division Management', 'units' => 3, 'year_level' => 2, 'semester' => '1st', 'subject_type' => 'major'],
            ['subject_code' => 'CUL201', 'subject_name' => 'Culinary Arts and Sciences', 'units' => 3, 'year_level' => 2, 'semester' => '1st', 'subject_type' => 'major'],
            ['subject_code' => 'MKT201', 'subject_name' => 'Hospitality Marketing', 'units' => 3, 'year_level' => 2, 'semester' => '1st', 'subject_type' => 'major'],
            ['subject_code' => 'BAR201', 'subject_name' => 'Bar Management', 'units' => 3, 'year_level' => 2, 'semester' => '1st', 'subject_type' => 'major'],

            // Second Year - Second Semester
            ['subject_code' => 'LAW201', 'subject_name' => 'Hospitality Law', 'units' => 3, 'year_level' => 2, 'semester' => '2nd', 'subject_type' => 'major'],
            ['subject_code' => 'FIN201', 'subject_name' => 'Hospitality Financial Management', 'units' => 3, 'year_level' => 2, 'semester' => '2nd', 'subject_type' => 'major'],
            ['subject_code' => 'HRM201', 'subject_name' => 'Human Resource Management in Hospitality', 'units' => 3, 'year_level' => 2, 'semester' => '2nd', 'subject_type' => 'major'],
            ['subject_code' => 'EVENT201', 'subject_name' => 'Meetings, Incentives, Conventions and Exhibitions', 'units' => 3, 'year_level' => 2, 'semester' => '2nd', 'subject_type' => 'major'],
            ['subject_code' => 'TOUR201', 'subject_name' => 'Tourism Planning and Development', 'units' => 3, 'year_level' => 2, 'semester' => '2nd', 'subject_type' => 'major'],

            // Third Year - First Semester
            ['subject_code' => 'STRAT301', 'subject_name' => 'Strategic Management in Hospitality', 'units' => 3, 'year_level' => 3, 'semester' => '1st', 'subject_type' => 'major'],
            ['subject_code' => 'QUAL301', 'subject_name' => 'Quality Management in Hospitality', 'units' => 3, 'year_level' => 3, 'semester' => '1st', 'subject_type' => 'major'],
            ['subject_code' => 'ECO301', 'subject_name' => 'Hospitality Economics', 'units' => 3, 'year_level' => 3, 'semester' => '1st', 'subject_type' => 'major'],
            ['subject_code' => 'RES301', 'subject_name' => 'Research Methods in Hospitality', 'units' => 3, 'year_level' => 3, 'semester' => '1st', 'subject_type' => 'major'],
            ['subject_code' => 'ELECT301', 'subject_name' => 'Hospitality Elective 1', 'units' => 3, 'year_level' => 3, 'semester' => '1st', 'subject_type' => 'elective'],

            // Third Year - Second Semester
            ['subject_code' => 'PROJ301', 'subject_name' => 'Hospitality Practicum 1', 'units' => 3, 'year_level' => 3, 'semester' => '2nd', 'subject_type' => 'major'],
            ['subject_code' => 'ENTREP301', 'subject_name' => 'Entrepreneurship in Hospitality', 'units' => 3, 'year_level' => 3, 'semester' => '2nd', 'subject_type' => 'major'],
            ['subject_code' => 'SUST301', 'subject_name' => 'Sustainable Hospitality Management', 'units' => 3, 'year_level' => 3, 'semester' => '2nd', 'subject_type' => 'major'],
            ['subject_code' => 'ELECT302', 'subject_name' => 'Hospitality Elective 2', 'units' => 3, 'year_level' => 3, 'semester' => '2nd', 'subject_type' => 'elective'],

            // Fourth Year - First Semester
            ['subject_code' => 'THESIS401', 'subject_name' => 'Thesis Writing 1', 'units' => 3, 'year_level' => 4, 'semester' => '1st', 'subject_type' => 'major'],
            ['subject_code' => 'INT401', 'subject_name' => 'Internship (400 hours)', 'units' => 6, 'year_level' => 4, 'semester' => '1st', 'subject_type' => 'major'],

            // Fourth Year - Second Semester
            ['subject_code' => 'THESIS402', 'subject_name' => 'Thesis Writing 2', 'units' => 3, 'year_level' => 4, 'semester' => '2nd', 'subject_type' => 'major'],
            ['subject_code' => 'CAP402', 'subject_name' => 'Capstone Project', 'units' => 3, 'year_level' => 4, 'semester' => '2nd', 'subject_type' => 'major'],
        ];

        $this->createCurriculumSubjects($curriculum, $subjects);
        $this->command->info('BSHM-2022 curriculum and subjects seeded.');
    }

    private function createCurriculumSubjects($curriculum, $subjects)
    {
        foreach ($subjects as $s) {
            // Find or create the subject in subjects table
            $subject = \App\Models\Subject::firstOrCreate([
                'subject_code' => $s['subject_code'],
            ], [
                'subject_name' => $s['subject_name'],
                'description' => $s['subject_name'],
                'units' => $s['units'],
                'year_level' => 1, // default
                'semester' => 'first', // default
                'subject_type' => $s['subject_type'] ?? 'core',
                'program_id' => $curriculum->program_id, // Link subject to program
                'status' => 'active',
            ]);

            \App\Models\CurriculumSubject::firstOrCreate([
                'curriculum_id' => $curriculum->id,
                'subject_id' => $subject->id,
            ], [
                'curriculum_id' => $curriculum->id,
                'subject_id' => $subject->id,
                'subject_code' => $s['subject_code'], // keep for compatibility
                'subject_name' => $s['subject_name'],
                'description' => $s['subject_name'],
                'units' => $s['units'],
                'hours' => isset($s['hours']) ? $s['hours'] : ($s['units'] * 15),
                'year_level' => $s['year_level'],
                'semester' => $s['semester'],
                'subject_type' => $s['subject_type'] ?? 'core',
                'prerequisites' => $s['prerequisites'] ?? null,
                'is_lab' => false,
                'status' => 'active',
            ]);
        }
    }
}
