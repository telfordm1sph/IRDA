import { Badge } from "@/Components/ui/badge";
import { cn } from "@/lib/utils";

const STATUS_STYLES = {
    "Pending":                "bg-blue-100 text-blue-700 border-blue-200",
    "Disapproved":            "bg-red-100 text-red-700 border-red-200",
    "Letter of Explanation":  "bg-orange-100 text-orange-700 border-orange-200",
    "For Assessment":         "bg-yellow-100 text-yellow-700 border-yellow-200",
    "For Validation":         "bg-yellow-100 text-yellow-700 border-yellow-200",
    "IR: For Dept Approval":  "bg-yellow-100 text-yellow-700 border-yellow-200",
    "For DA":                 "bg-purple-100 text-purple-700 border-purple-200",
    "For HR Manager":         "bg-purple-100 text-purple-700 border-purple-200",
    "DA: For Supervisor":     "bg-purple-100 text-purple-700 border-purple-200",
    "DA: For Dept Manager":   "bg-purple-100 text-purple-700 border-purple-200",
    "For Acknowledgement":    "bg-indigo-100 text-indigo-700 border-indigo-200",
    "Acknowledged":           "bg-green-100 text-green-700 border-green-200",
    "Invalid":                "bg-red-100 text-red-700 border-red-200",
    "Cancelled":              "bg-gray-100 text-gray-500 border-gray-200",
    "Inactive":               "bg-gray-100 text-gray-400 border-gray-200",
};

export function IrStatusBadge({ status }) {
    const cls = STATUS_STYLES[status] ?? "bg-gray-100 text-gray-500 border-gray-200";
    return (
        <Badge className={cn("whitespace-nowrap text-xs font-medium", cls)}>
            {status ?? "—"}
        </Badge>
    );
}
