export const error_res = (msg = "", data = {}) => {
    let res = {
        status: 400,
        flag: 0,
        msg: msg.length == 0 ? "Error" : msg,
        data,
    };

    return res;
};

export const success_res = (msg = "", data = {}) => {
    let res = {
        status: 200,
        flag: 1,
        msg: msg.length == 0 ? "Success" : msg,
        data,
    };

    return res;
};

export const log1 = (msg) => {
    const d = new Date();
    console.log("[" + d.toLocaleString() + " " + d.getMilliseconds() + "] :", msg);
};

export function formatDateTime(dateInput, format) {
    if (!dateInput) return "";
    const dateObj = typeof dateInput === "string" ? new Date(dateInput) : dateInput;

    const pad = (n) => String(n).padStart(2, "0");

    const DD = pad(dateObj.getDate());
    const MM = pad(dateObj.getMonth() + 1);
    const YYYY = dateObj.getFullYear();
    const HH = pad(dateObj.getHours());
    const mm = pad(dateObj.getMinutes());
    const ss = pad(dateObj.getSeconds());

    switch (format) {
        case "DD/MM/YYYY": return `${DD}/${MM}/${YYYY}`;
        case "YYYY/MM/DD": return `${YYYY}/${MM}/${DD}`;
        case "DD-MM-YYYY": return `${DD}-${MM}-${YYYY}`;
        case "YYYY-MM-DD": return `${YYYY}-${MM}-${DD}`;
        case "DD:MM:YYYY": return `${DD}:${MM}:${YYYY}`;
        case "DD/MM/YYYY HH:mm:ss": return `${DD}/${MM}/${YYYY} ${HH}:${mm}:${ss}`;
        case "DD-MM-YYYY HH:mm:ss": return `${DD}-${MM}-${YYYY} ${HH}:${mm}:${ss}`;
        case "YYYY-MM-DD HH:mm:ss": return `${YYYY}-${MM}-${DD} ${HH}:${mm}:${ss}`;
        case "DD:MM:YYYY HH:mm:ss": return `${DD}:${MM}:${YYYY} ${HH}:${mm}:${ss}`;
        default: return dateObj.toString(); // fallback
    };
}

export const dateFormatByTimezone = (date) => {
    if (!date) {
        return "";
    };

    const formatter = new Intl.DateTimeFormat("en-US", {
        timeZone: "Asia/Kolkata",
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
    });

    const formattedDate = formatter.format(date) + " IST";

    return formattedDate
};

export const timeFormat = (date) => {
    if (!date) {
        return "";
    };

    const timeFormatter = new Date(date).toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
    });

    return timeFormatter
};

export const formatAMPM = (date) => {
    if (!date) {
        return "";
    };

    let hours = date.getHours();
    let minutes = date.getMinutes();
    const ampm = hours >= 12 ? "PM" : "AM";
    hours = hours % 12 || 12;
    minutes = minutes < 10 ? '0' + minutes : minutes;

    return `${hours}:${minutes} ${ampm}`;
};

export const formatDate = (date) => {
    if (!date) {
        return "";
    };

    return new Date(date).toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "long",
        year: "numeric",
        // timeZone: "UTC",
    });
};

export function formatJoinDate(dateInput) {
    if (!dateInput) {
        return "";
    };

    const joinDate = new Date(dateInput);
    const now = new Date();

    const joinMonth = joinDate.toLocaleString('default', { month: 'long' });
    const joinYear = joinDate.getFullYear();

    // Calculate year and month difference
    let years = now.getFullYear() - joinDate.getFullYear();
    let months = now.getMonth() - joinDate.getMonth();

    if (months < 0) {
        years--;
        months += 12;
    };

    const yearText = years > 0 ? `${years} year${years > 1 ? 's' : ''}` : '';
    const monthText = months > 0 ? `${months} month${months > 1 ? 's' : ''}` : '';

    const duration = [yearText, monthText].filter(Boolean).join(' ');

    return `${joinMonth || ""} ${joinYear || ""} (${duration || '0 months'})`;
};

export const getIp = (req) => {
    let ip = req.headers.get('cf-connecting-ip') ? req.headers.get('cf-connecting-ip') : req.headers.get('x-forwarded-for');

    const parts = ip.split('::ffff:');
    return parts.length > 1 ? parts[1] : parts[0];
};

export const passwordValidation = (password) => {
    const minLength = /.{6,}/; // at least 6 chars
    const startsWithCapital = /^[A-Z]/; // starts with uppercase
    const hasLetter = /[A-Za-z]/; // contains at least one letter
    const hasNumber = /[0-9]/; // contains at least one digit

    if (!minLength.test(password)) {
        return error_res("Password must be at least 6 characters long");
    };

    if (!startsWithCapital.test(password)) {
        return error_res("Password must start with a capital letter");
    };

    if (!hasLetter.test(password)) {
        return error_res("Password must contain at least one alphabet character");
    };

    if (!hasNumber.test(password)) {
        return error_res("Password must contain at least one number");
    };

    return success_res();
};

export const getFirstLetter = (text, type) => {
    let name = "";

    if (!text) return name;

    if (!type) return text.charAt(0).toUpperCase();

    switch (type) {
        case "toUpperCase":
            name = text.charAt(0).toUpperCase();
            break;
        case "toLowerCase":
            name = text.charAt(0).toLowerCase();
            break;
        default:
            name = text.charAt(0).toUpperCase();
            break;
    };

    return name;
};