
const rawStudentsList = [
    { code: 'BWU/BCA/XX/001', name: 'Demo Student One' },
    { code: 'BWU/BCA/XX/002', name: 'Demo Student Two' },
    { code: 'BWU/BCA/XX/003', name: 'Demo Student Three' },
    { code: 'BWU/BCA/XX/004', name: 'Demo Student Four' },
    { code: 'BWU/BCA/XX/005', name: 'Demo Student Five' }
];

function toTitleCase(str) {
    return str
        .toLowerCase()
        .split(' ')
        .filter(Boolean)
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
}

function splitName(fullName) {
    const clean = fullName.trim().replace(/\s+/g, ' ');
    const parts = clean.split(' ');

    if (parts.length === 1) {
        return {
            firstName: toTitleCase(parts[0]),
            lastName: 'Student'
        };
    }

    const lastName = toTitleCase(parts.pop());
    const firstName = toTitleCase(parts.join(' '));

    return { firstName, lastName };
}

module.exports = {
    rawStudentsList,
    toTitleCase,
    splitName
};
