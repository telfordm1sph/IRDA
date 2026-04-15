import { Button } from "@/Components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogTitle,
    DialogClose,
} from "@/Components/ui/dialog";
import { OffenseBadge } from "./IrShared";

export function CodeNumberModal({
    open,
    onOpenChange,
    selectedItemIndex,
    codeNumbers,
    codeLoading,
    codePage,
    codeTotalPages,
    onSelect,
    onLoadMore,
}) {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-6xl max-h-[80vh] overflow-y-auto">
                <DialogTitle>
                    Browse Code Numbers
                    {selectedItemIndex !== null
                        ? ` for Violation ${selectedItemIndex + 1}`
                        : ""}
                </DialogTitle>

                <div className="space-y-4">
                    <div className="border rounded-lg overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="bg-muted/50 border-b">
                                        {["Code No.", "Violation", "1st Offense", "2nd Offense", "3rd Offense", "4th Offense", "5th Offense", "Action"].map(
                                            (h) => (
                                                <th
                                                    key={h}
                                                    className="text-left px-4 py-2.5 text-xs font-semibold text-muted-foreground uppercase"
                                                >
                                                    {h}
                                                </th>
                                            ),
                                        )}
                                    </tr>
                                </thead>
                                <tbody>
                                    {codeNumbers.map((code) => (
                                        <tr
                                            key={code.id}
                                            className="border-b last:border-0 hover:bg-muted/30"
                                        >
                                            <td className="px-4 py-2 font-medium">{code.code_number}</td>
                                            <td className="px-4 py-2">{code.violation || "—"}</td>
                                            <td className="px-4 py-2"><OffenseBadge value={code.first_offense} /></td>
                                            <td className="px-4 py-2"><OffenseBadge value={code.second_offense} /></td>
                                            <td className="px-4 py-2"><OffenseBadge value={code.third_offense} /></td>
                                            <td className="px-4 py-2"><OffenseBadge value={code.fourth_offense} /></td>
                                            <td className="px-4 py-2"><OffenseBadge value={code.fifth_offense} /></td>
                                            <td className="px-4 py-2 text-center">
                                                <Button
                                                    type="button"
                                                    variant="default"
                                                    size="sm"
                                                    onClick={() => onSelect(code.code_number)}
                                                    className="px-3 py-1 text-xs font-semibold shadow-sm"
                                                >
                                                    Select
                                                </Button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {codeLoading && (
                        <div className="text-center text-sm text-muted-foreground py-4">
                            Loading…
                        </div>
                    )}

                    {codePage < codeTotalPages && !codeLoading && (
                        <Button
                            type="button"
                            variant="outline"
                            onClick={onLoadMore}
                            className="w-full"
                        >
                            Load More
                        </Button>
                    )}

                    <DialogClose asChild>
                        <Button type="button" variant="outline" className="w-full">
                            Close
                        </Button>
                    </DialogClose>
                </div>
            </DialogContent>
        </Dialog>
    );
}
