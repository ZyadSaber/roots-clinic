'use client'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Trash2 } from "lucide-react";
import { useVisibility } from "@/hooks"
import { Button } from "@/components/ui/button";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";

interface DeleteDialogProps {
    deleteLoading: boolean;
    deleteAction: () => void;
    deleteClassName?: string;

}

const DeleteDialog = ({ deleteLoading, deleteAction, deleteClassName }: DeleteDialogProps) => {
    const { visible, handleClose, handleStateChange } = useVisibility()
    const t = useTranslations("Common")

    const submitDelete = () => {
        handleClose()
        deleteAction()
    }

    return (
        <Dialog open={visible} onOpenChange={handleStateChange}>
            <DialogTrigger asChild>
                <Button variant="ghost" size="icon" className={cn("h-8 w-8 text-destructive hover:text-destructive", deleteClassName)}>
                    <Trash2 className="h-4 w-4" />
                </Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>{t("delete")}</DialogTitle>
                    <DialogDescription>
                        {t("deleteDesc")}
                    </DialogDescription>
                </DialogHeader>
                <DialogFooter>
                    <Button
                        variant="outline"
                        onClick={handleClose}
                        disabled={deleteLoading}
                    >
                        {t("cancel")}
                    </Button>
                    <Button
                        variant="destructive"
                        onClick={submitDelete}
                        disabled={deleteLoading}
                    >
                        {t("delete")}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}

export default DeleteDialog