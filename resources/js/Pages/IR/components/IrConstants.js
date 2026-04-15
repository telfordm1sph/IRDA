export const DA_TYPES = [
    { value: "1", label: "Verbal Warning",   badgeClass: "bg-green-100 text-green-700 border-green-200" },
    { value: "2", label: "Written Warning",  badgeClass: "bg-blue-100 text-blue-700 border-blue-200" },
    { value: "3", label: "3-Day Suspension", badgeClass: "bg-gray-100 text-gray-700 border-gray-200" },
    { value: "4", label: "7-Day Suspension", badgeClass: "bg-yellow-100 text-yellow-700 border-yellow-200" },
    { value: "5", label: "Dismissal",        badgeClass: "bg-red-100 text-red-700 border-red-200" },
];

export const EMPTY_ITEM = {
    code_no: "",
    violation: "",
    da_type: "",
    date_committed: "",
    offense_no: "",
};
