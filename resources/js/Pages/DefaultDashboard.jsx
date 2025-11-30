import { Head } from '@inertiajs/react'
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout'

export default function DefaultDashboard({ auth }) {
    return (
        <AuthenticatedLayout auth={auth}>
            <Head title="Dashboard" />
            
            <div className="py-12">
                <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
                    <div className="bg-white dark:bg-gray-800 overflow-hidden shadow-sm sm:rounded-lg">
                        <div className="p-6 text-gray-900 dark:text-gray-100">
                            <div className="text-center">
                                <h1 className="text-2xl font-bold mb-4">Welcome to Datamex ELMS</h1>
                                <p className="text-gray-600 dark:text-gray-400 mb-6">
                                    You are logged in as: <span className="font-medium">{auth?.user?.name}</span>
                                </p>
                                <div className="space-y-4">
                                    <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                                        <p className="text-blue-800 dark:text-blue-200">
                                            Redirecting to your role-specific dashboard...
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}