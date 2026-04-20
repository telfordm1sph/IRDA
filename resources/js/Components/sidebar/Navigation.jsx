import { usePage } from "@inertiajs/react";
import SidebarLink from "@/Components/sidebar/SidebarLink";
import Dropdown from "@/Components/sidebar/DropDown";
import { FileWarning, LayoutDashboard } from "lucide-react";

const ADMIN_LABELS = {
    hr:      "HR Action Items",
    hr_mngr: "HR Manager Items",
};

export default function NavLinks({ isSidebarOpen }) {
    const { emp_data, ir_admin_role } = usePage().props;

    const irLinks = [
        { href: route("ir.index"),  label: "My IR" },
        { href: route("ir.staff"),  label: "Staff IR" },
        { href: route("ir.create"), label: "Create IR" },
    ];

    if (ir_admin_role) {
        irLinks.splice(2, 0, {
            href:  route("ir.admin"),
            label: ADMIN_LABELS[ir_admin_role] ?? "Admin Items",
        });
    }

    return (
        <nav
            className="flex flex-col flex-grow space-y-1 overflow-y-auto"
            style={{ scrollbarWidth: "none" }}
        >
            <SidebarLink
                href={route("dashboard")}
                label="Dashboard"
                icon={<LayoutDashboard className="w-5 h-5" />}
                isSidebarOpen={isSidebarOpen}
            />
            <Dropdown
                label="Incident Report"
                icon={<FileWarning className="w-5 h-5" />}
                isSidebarOpen={isSidebarOpen}
                links={irLinks}
            />
        </nav>
    );
}
