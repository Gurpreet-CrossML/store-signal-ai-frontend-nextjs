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