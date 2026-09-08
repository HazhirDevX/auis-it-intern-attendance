"use client";
import { useActionState, useEffect, useState } from "react";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";
import { deleteStudentAccountAction } from "@/actions/interns";
import { initialActionState } from "@/actions/types";
import {
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SubmitButton } from "@/components/portal/submit-button";
export function DeleteStudentButton({
  id,
  name,
  email,
}: {
  id: string;
  name: string;
  email: string;
}) {
  const [open, setOpen] = useState(false);
  const [state, action] = useActionState(
    deleteStudentAccountAction,
    initialActionState,
  );
  useEffect(() => {
    if (state.status === "success") {
      toast.success(state.message);
      const t = setTimeout(() => setOpen(false), 0);
      return () => clearTimeout(t);
    }
  }, [state]);
  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>
        <Button variant="destructive">
          <Trash2 className="size-4" />
          Delete student account
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>⚠️ Delete Student Account?</AlertDialogTitle>
          <AlertDialogDescription>
            <span className="mb-3 block font-semibold text-primary">
              {name}
              <br />
              {email}
            </span>
            Login access is permanently removed and cannot be restored here. The
            name, email, activities and semester history remain in the reporting
            archive. This does not erase attendance or delete the Google
            account. Use Deactivate for a temporary suspension.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <form action={action} className="min-w-0 space-y-4">
          <input type="hidden" name="userId" value={id} />
          <div className="space-y-2">
            <Label htmlFor={`confirm-${id}`}>
              Type the student email to confirm
            </Label>
            <Input
              id={`confirm-${id}`}
              name="confirmation"
              type="email"
              autoComplete="off"
              required
            />
          </div>
          {state.status === "error" && (
            <p role="alert" className="text-sm text-destructive">
              {state.message}
            </p>
          )}
          <AlertDialogFooter>
            <AlertDialogCancel type="button">Cancel</AlertDialogCancel>
            <SubmitButton
              className="bg-destructive text-white hover:bg-destructive/90"
              pendingLabel="Removing access…"
            >
              Delete Student
            </SubmitButton>
          </AlertDialogFooter>
        </form>
      </AlertDialogContent>
    </AlertDialog>
  );
}
