import PropTypes from "prop-types";
import { FaChevronLeft, FaChevronRight } from "react-icons/fa";

const Pagination = ({
    currentPage = 1,
    totalPages = 1,
    onPageChange,
    totalItems = 0,
    itemsPerPage = 10,
    onItemsPerPageChange,
}) => {
    if (totalItems === 0) return null;

    const startItem = (currentPage - 1) * itemsPerPage + 1;
    const endItem = Math.min(currentPage * itemsPerPage, totalItems);

    const getPageNumbers = () => {
        const pages = [];
        const maxVisible = 5;

        if (totalPages <= maxVisible) {
            for (let i = 1; i <= totalPages; i++) {
                pages.push(i);
            }
        } else {
            let start = Math.max(1, currentPage - 2);
            let end = Math.min(totalPages, start + maxVisible - 1);

            if (end - start + 1 < maxVisible) {
                start = Math.max(1, end - maxVisible + 1);
            }

            for (let i = start; i <= end; i++) {
                pages.push(i);
            }
        }
        return pages;
    };

    const pageNumbers = getPageNumbers();

    return (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-6 bg-white px-4 py-3 border border-gray-200 rounded-lg shadow-sm">
            {/* Left: Summary & items per page select */}
            <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
                <span>
                    Showing <span className="font-semibold text-gray-900">{startItem}</span> to{" "}
                    <span className="font-semibold text-gray-900">{endItem}</span> of{" "}
                    <span className="font-semibold text-gray-900">{totalItems}</span> results
                </span>

                {onItemsPerPageChange && (
                    <div className="flex items-center gap-2">
                        <label htmlFor="itemsPerPageSelect" className="text-xs text-gray-500">
                            Per page:
                        </label>
                        <select
                            id="itemsPerPageSelect"
                            value={itemsPerPage}
                            onChange={(e) => onItemsPerPageChange(Number(e.target.value))}
                            className="px-2 py-1 text-xs border border-gray-300 rounded focus:ring-2 focus:ring-black focus:border-transparent bg-white"
                        >
                            <option value={5}>5</option>
                            <option value={10}>10</option>
                            <option value={20}>20</option>
                            <option value={50}>50</option>
                            <option value={100}>100</option>
                        </select>
                    </div>
                )}
            </div>

            {/* Right: Pagination Controls */}
            {totalPages > 1 && (
                <div className="flex items-center space-x-1">
                    {/* Previous Button */}
                    <button
                        onClick={() => onPageChange(currentPage - 1)}
                        disabled={currentPage === 1}
                        className="flex items-center justify-center p-2 rounded-lg border border-gray-300 text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                        title="Previous Page"
                    >
                        <FaChevronLeft className="w-3.5 h-3.5" />
                    </button>

                    {/* First Page button if not visible */}
                    {pageNumbers[0] > 1 && (
                        <>
                            <button
                                onClick={() => onPageChange(1)}
                                className="px-3 py-1.5 rounded-lg border text-sm font-medium text-gray-700 bg-white border-gray-300 hover:bg-gray-50 transition-colors"
                            >
                                1
                            </button>
                            {pageNumbers[0] > 2 && (
                                <span className="px-2 text-gray-400">...</span>
                            )}
                        </>
                    )}

                    {/* Page Numbers */}
                    {pageNumbers.map((page) => (
                        <button
                            key={page}
                            onClick={() => onPageChange(page)}
                            className={`px-3.5 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                                currentPage === page
                                    ? "bg-black text-white border border-black shadow-sm"
                                    : "bg-white text-gray-700 border border-gray-300 hover:bg-gray-50"
                            }`}
                        >
                            {page}
                        </button>
                    ))}

                    {/* Last Page button if not visible */}
                    {pageNumbers[pageNumbers.length - 1] < totalPages && (
                        <>
                            {pageNumbers[pageNumbers.length - 1] < totalPages - 1 && (
                                <span className="px-2 text-gray-400">...</span>
                            )}
                            <button
                                onClick={() => onPageChange(totalPages)}
                                className="px-3 py-1.5 rounded-lg border text-sm font-medium text-gray-700 bg-white border-gray-300 hover:bg-gray-50 transition-colors"
                            >
                                {totalPages}
                            </button>
                        </>
                    )}

                    {/* Next Button */}
                    <button
                        onClick={() => onPageChange(currentPage + 1)}
                        disabled={currentPage === totalPages}
                        className="flex items-center justify-center p-2 rounded-lg border border-gray-300 text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                        title="Next Page"
                    >
                        <FaChevronRight className="w-3.5 h-3.5" />
                    </button>
                </div>
            )}
        </div>
    );
};

Pagination.propTypes = {
    currentPage: PropTypes.number,
    totalPages: PropTypes.number,
    onPageChange: PropTypes.func.isRequired,
    totalItems: PropTypes.number,
    itemsPerPage: PropTypes.number,
    onItemsPerPageChange: PropTypes.func,
};

export default Pagination;
