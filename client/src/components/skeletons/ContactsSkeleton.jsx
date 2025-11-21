const ContactsSkeleton = () => {
    return (
        <div className="p-6 animate-pulse">
            {/* Header */}
            <div className="mb-8">
                <div className="h-8 bg-gray-200 rounded w-64 mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-96"></div>
            </div>

            {/* Messages Table */}
            <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-gray-50 border-b border-gray-200">
                            <tr>
                                <th className="px-6 py-3">
                                    <div className="h-4 bg-gray-200 rounded w-16"></div>
                                </th>
                                <th className="px-6 py-3">
                                    <div className="h-4 bg-gray-200 rounded w-20"></div>
                                </th>
                                <th className="px-6 py-3">
                                    <div className="h-4 bg-gray-200 rounded w-16"></div>
                                </th>
                                <th className="px-6 py-3">
                                    <div className="h-4 bg-gray-200 rounded w-12"></div>
                                </th>
                                <th className="px-6 py-3">
                                    <div className="h-4 bg-gray-200 rounded w-20"></div>
                                </th>
                                <th className="px-6 py-3">
                                    <div className="h-4 bg-gray-200 rounded w-20"></div>
                                </th>
                                <th className="px-6 py-3">
                                    <div className="h-4 bg-gray-200 rounded w-20"></div>
                                </th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {[...Array(5)].map((_, i) => (
                                <tr key={i}>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center">
                                            <div className="w-8 h-8 bg-gray-200 rounded mr-3"></div>
                                            <div>
                                                <div className="h-4 bg-gray-200 rounded w-24 mb-1"></div>
                                                <div className="h-3 bg-gray-200 rounded w-32"></div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="h-4 bg-gray-200 rounded w-48"></div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="h-6 bg-gray-200 rounded-full w-20"></div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="h-4 bg-gray-200 rounded w-20"></div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="h-4 bg-gray-200 rounded w-20"></div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="h-4 bg-gray-200 rounded w-20"></div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="h-4 bg-gray-200 rounded w-20"></div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default ContactsSkeleton;