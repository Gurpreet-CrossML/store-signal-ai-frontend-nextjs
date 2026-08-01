// FB-style absolute timestamp: "28 July at 17:02" (year added for past years).
export function formatPostedAt(iso: string) {
    const date = new Date(iso);
    if (Number.isNaN(date.getTime())) return "";
    const sameYear = date.getFullYear() === new Date().getFullYear();
    const day = date.toLocaleDateString(undefined, {
        day: "numeric",
        month: "long",
        ...(sameYear ? {} : { year: "numeric" }),
    });
    const time = date.toLocaleTimeString(undefined, {
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
    });
    return `${day} at ${time}`;
}

// Compact relative timestamp for comments: "6h", "2d", "3w".
export function formatRelativeTime(iso: string) {
    const date = new Date(iso);
    if (Number.isNaN(date.getTime())) return "";
    const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
    if (seconds < 60) return "Just now";
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h`;
    const days = Math.floor(hours / 24);
    if (days < 7) return `${days}d`;
    const weeks = Math.floor(days / 7);
    if (weeks < 52) return `${weeks}w`;
    return `${Math.floor(days / 365)}y`;
}
