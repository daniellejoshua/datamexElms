import React, { useState } from 'react';
import { Head, useForm } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';

export default function Index({ auth }) {
    const [uploadResults, setUploadResults] = useState(null);
    const [isUploading, setIsUploading] = useState(false);

    const { data, setData, post, processing, errors, reset } = useForm({
        csv_file: null,
        academic_year: '2024-2025',
        semester: '1st',
        total_fee: 50000.00,
    });

    const handleFileChange = (e) => {
        setData('csv_file', e.target.files[0]);
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        setIsUploading(true);
        setUploadResults(null);

        const formData = new FormData();
        formData.append('csv_file', data.csv_file);
        formData.append('academic_year', data.academic_year);
        formData.append('semester', data.semester);
        formData.append('total_fee', data.total_fee);

        fetch(route('registrar.bulk-students.upload'), {
            method: 'POST',
            body: formData,
            headers: {
                'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').getAttribute('content'),
            },
        })
        .then(response => response.json())
        .then(result => {
            setUploadResults(result);
            if (result.success) {
                reset('csv_file');
            }
        })
        .catch(error => {
            console.error('Upload error:', error);
            setUploadResults({
                success: false,
                message: 'Upload failed. Please try again.',
            });
        })
        .finally(() => {
            setIsUploading(false);
        });
    };

    const downloadTemplate = () => {
        window.open(route('registrar.bulk-students.template'), '_blank');
    };

    return (
        <AuthenticatedLayout
            user={auth.user}
            header={<h2 className="font-semibold text-xl text-gray-800 dark:text-gray-200 leading-tight">Bulk Student Enrollment</h2>}
        >
            <Head title="Bulk Student Enrollment" />

            <div className="py-12">
                <div className="max-w-4xl mx-auto sm:px-6 lg:px-8">
                    <div className="bg-white dark:bg-gray-800 overflow-hidden shadow-sm sm:rounded-lg">
                        <div className="p-6 text-gray-900 dark:text-gray-100">
                            {/* Upload Form */}
                            <div className="mb-8">
                                <h3 className="text-lg font-medium mb-4">Upload Student CSV</h3>
                                
                                <div className="mb-4">
                                    <button
                                        type="button"
                                        onClick={downloadTemplate}
                                        className="inline-flex items-center px-4 py-2 bg-blue-600 border border-transparent rounded-md font-semibold text-xs text-white uppercase tracking-widest hover:bg-blue-700 focus:bg-blue-700 active:bg-blue-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition ease-in-out duration-150"
                                    >
                                        Download CSV Template
                                    </button>
                                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                                        Download the template CSV file with the required format and sample data.
                                    </p>
                                </div>

                                <form onSubmit={handleSubmit} className="space-y-6">
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                                Academic Year
                                            </label>
                                            <input
                                                type="text"
                                                value={data.academic_year}
                                                onChange={(e) => setData('academic_year', e.target.value)}
                                                className="mt-1 block w-full border-gray-300 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300 focus:border-indigo-500 dark:focus:border-indigo-600 focus:ring-indigo-500 dark:focus:ring-indigo-600 rounded-md shadow-sm"
                                                required
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                                Semester
                                            </label>
                                            <select
                                                value={data.semester}
                                                onChange={(e) => setData('semester', e.target.value)}
                                                className="mt-1 block w-full border-gray-300 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300 focus:border-indigo-500 dark:focus:border-indigo-600 focus:ring-indigo-500 dark:focus:ring-indigo-600 rounded-md shadow-sm"
                                                required
                                            >
                                                <option value="1st">1st Semester</option>
                                                <option value="2nd">2nd Semester</option>
                                                <option value="summer">Summer</option>
                                            </select>
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                                Total Semester Fee
                                            </label>
                                            <input
                                                type="number"
                                                step="0.01"
                                                value={data.total_fee}
                                                onChange={(e) => setData('total_fee', parseFloat(e.target.value))}
                                                className="mt-1 block w-full border-gray-300 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300 focus:border-indigo-500 dark:focus:border-indigo-600 focus:ring-indigo-500 dark:focus:ring-indigo-600 rounded-md shadow-sm"
                                                required
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                            CSV File
                                        </label>
                                        <input
                                            type="file"
                                            accept=".csv,.txt"
                                            onChange={handleFileChange}
                                            className="mt-1 block w-full text-sm text-gray-500 dark:text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                                            required
                                        />
                                        {errors.csv_file && (
                                            <p className="mt-2 text-sm text-red-600 dark:text-red-400">{errors.csv_file}</p>
                                        )}
                                    </div>

                                    <button
                                        type="submit"
                                        disabled={isUploading}
                                        className="inline-flex items-center px-4 py-2 bg-gray-800 dark:bg-gray-200 border border-transparent rounded-md font-semibold text-xs text-white dark:text-gray-800 uppercase tracking-widest hover:bg-gray-700 dark:hover:bg-white focus:bg-gray-700 dark:focus:bg-white active:bg-gray-900 dark:active:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800 transition ease-in-out duration-150 disabled:opacity-50"
                                    >
                                        {isUploading ? 'Uploading...' : 'Upload Students'}
                                    </button>
                                </form>
                            </div>

                            {/* Results */}
                            {uploadResults && (
                                <div className="mt-8">
                                    <h3 className="text-lg font-medium mb-4">Upload Results</h3>
                                    
                                    <div className={`p-4 rounded-md ${
                                        uploadResults.success 
                                            ? 'bg-green-50 dark:bg-green-900/20' 
                                            : 'bg-red-50 dark:bg-red-900/20'
                                    }`}>
                                        <div className={`text-sm ${
                                            uploadResults.success 
                                                ? 'text-green-800 dark:text-green-200' 
                                                : 'text-red-800 dark:text-red-200'
                                        }`}>
                                            <p className="font-medium">{uploadResults.message}</p>
                                            
                                            {uploadResults.results && (
                                                <div className="mt-2">
                                                    <p>Total Processed: {uploadResults.results.total_processed}</p>
                                                    <p>Successfully Created: {uploadResults.results.created}</p>
                                                    <p>Failed: {uploadResults.results.failed}</p>
                                                </div>
                                            )}
                                            
                                            {uploadResults.errors && (
                                                <div className="mt-4">
                                                    <p className="font-medium">Validation Errors:</p>
                                                    <ul className="mt-2 list-disc pl-5 space-y-1">
                                                        {uploadResults.errors.map((error, index) => (
                                                            <li key={index}>
                                                                Row {error.row}: {error.errors.join(', ')}
                                                            </li>
                                                        ))}
                                                    </ul>
                                                </div>
                                            )}

                                            {uploadResults.results?.failed_records && uploadResults.results.failed_records.length > 0 && (
                                                <div className="mt-4">
                                                    <p className="font-medium">Failed Records:</p>
                                                    <ul className="mt-2 list-disc pl-5 space-y-1">
                                                        {uploadResults.results.failed_records.map((record, index) => (
                                                            <li key={index}>
                                                                {record.data.first_name} {record.data.last_name}: {record.error}
                                                            </li>
                                                        ))}
                                                    </ul>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Instructions */}
                            <div className="mt-8 bg-blue-50 dark:bg-blue-900/20 p-4 rounded-md">
                                <h4 className="text-sm font-medium text-blue-800 dark:text-blue-200 mb-2">
                                    CSV Format Requirements:
                                </h4>
                                <ul className="text-sm text-blue-700 dark:text-blue-300 list-disc pl-5 space-y-1">
                                    <li>Headers: first_name, last_name, email, student_id, program_code, year_level, student_type, education_level</li>
                                    <li>Email addresses must be unique across all users</li>
                                    <li>Student IDs must be unique across all students</li>
                                    <li>Program codes must match existing programs in the system</li>
                                    <li>Year level must be between 1-4</li>
                                    <li>Student type: regular or irregular</li>
                                    <li>Education level: college or shs</li>
                                    <li>Default password for all created accounts: password123</li>
                                </ul>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}