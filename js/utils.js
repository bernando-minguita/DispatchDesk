function escapeHtml(s) {
    return String(s ?? '').replace(/[&<>"']/g, c => ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#39;'
    }[c]));
}

function getLocalDateString(date) {
    const d = date || new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

function getLocalDateTimeString(date) {
    const d = date || new Date();
    const dateStr = getLocalDateString(d);
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');
    return `${dateStr} ${hours}:${minutes}`;
}

function formatTime(timeStr) {
    if (!timeStr) return '-';
    if (window.timeFormat === '12') {
        const [hours, minutes] = timeStr.split(':').map(Number);
        const ampm = hours >= 12 ? 'PM' : 'AM';
        const h = hours % 12 || 12;
        return `${h}:${String(minutes).padStart(2, '0')} ${ampm}`;
    }
    return timeStr;
}

function formatDateTime(datetimeStr) {
    if (!datetimeStr) return '-';
    const parts = datetimeStr.split(' ');
    const datePart = parts[0] || '';
    const timePart = parts[1] ? formatTime(parts[1]) : '';
    if (datePart && timePart) return `${datePart} ${timePart}`;
    return datetimeStr;
}

window.escapeHtml = escapeHtml;
window.getLocalDateString = getLocalDateString;
window.getLocalDateTimeString = getLocalDateTimeString;
window.formatTime = formatTime;
window.formatDateTime = formatDateTime;
