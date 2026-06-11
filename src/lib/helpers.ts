import { APIResponse, ErrorResponse, PaginationResponse } from "@/lib/config";

export const formatDateTime = (dateInput: string | null) => {
    if (!dateInput || dateInput === "-") return "-";
    return new Date(dateInput).toLocaleString("en-US", {
        month: "short", day: "numeric", year: "numeric",
        hour: "numeric", minute: "2-digit", hour12: true,
    });
};

export const getDuration = (start: string | null, end: string | null) => {
    if (!start || !end || start === "-" || end === "-") return "-";
    const diff = new Date(end).getTime() - new Date(start).getTime();
    if (diff < 0) return "-";
    const minutes = Math.floor(diff / 60000);
    const seconds = Math.floor((diff % 60000) / 1000);
    return `${minutes}m ${seconds}s`;
};

// Utility function to create paginated API responses
export const createPaginatedResponse = (
    url: string,
    count: number,
    currentPage: number,
    pageSize: number,
    results: object[]
): PaginationResponse => {
    const totalPages = Math.ceil(count / pageSize);
    const next = currentPage < totalPages ? `${url}?page=${currentPage + 1}` : null;
    const previous = currentPage > 1 ? `${url}?page=${currentPage - 1}` : null;

    return {
        count,
        next,
        previous,
        results,
    };
};

// Utility function to create standardized API responses
export const createAPIResponse = (
    success: boolean,
    message: string = "",
    data: object | object[] | PaginationResponse | ErrorResponse | null = null
): APIResponse => {
    return { success, message, data };
};