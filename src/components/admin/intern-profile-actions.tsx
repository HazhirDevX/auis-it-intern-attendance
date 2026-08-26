"use client";

import { UserCheck, UserX } from "lucide-react";

import {
  setInternActiveAction,
  setSemesterMembershipAction,
} from "@/actions/interns";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";

export function InternAccessButton({
  userId,
  active,
}: {
  userId: string;
  active: boolean;
}) {
  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant={active ? "destructive" : "outline"}>
          {active ? (
            <UserX className="size-4" />
          ) : (
            <UserCheck className="size-4" />
          )}
          {active ? "Deactivate access" : "Restore access"}
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            {active
              ? "Deactivate this intern?"
              : "Restore this intern’s access?"}
          </AlertDialogTitle>
          <AlertDialogDescription>
            {active
              ? "They will no longer be able to sign in. Existing activities and audit history remain stored."
              : "They will be able to authenticate again using their authorized AUIS account."}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <form
            action={async (formData) => {
              await setInternActiveAction(formData);
            }}
          >
            <input type="hidden" name="userId" value={userId} />
            <input type="hidden" name="active" value={String(!active)} />
            <AlertDialogAction type="submit">Confirm</AlertDialogAction>
          </form>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

export function MembershipButton({
  userId,
  semesterId,
  active,
}: {
  userId: string;
  semesterId: string;
  active: boolean;
}) {
  return (
    <form
      action={async (formData) => {
        await setSemesterMembershipAction(formData);
      }}
    >
      <input type="hidden" name="userId" value={userId} />
      <input type="hidden" name="semesterId" value={semesterId} />
      <input type="hidden" name="active" value={String(!active)} />
      <Button type="submit" size="sm" variant={active ? "outline" : "default"}>
        {active ? "Unassign" : "Assign"}
      </Button>
    </form>
  );
}
