export const getTimeAgo = (date) => {
    if (!date) return 'Recently'; // Safety check for missing dates
    const days = Math.floor((new Date() - new Date(date)) / (1000 * 60 * 60 * 24));
    if (isNaN(days)) return 'Recently'; // Safety check for invalid dates
    if (days === 0) return 'Today';
    if (days === 1) return '1d ago';
    return `${days}d ago`;
};
