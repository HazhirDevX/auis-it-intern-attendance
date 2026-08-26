"use client";

import { useActionState, useEffect, useRef } from "react";
import { CalendarDays, Clock3, Send } from "lucide-react";
import { toast } from "sonner";

import { createActivityAction } from "@/actions/activities";
import { initialActionState } from "@/actions/types";
import { SubmitButton } from "@/components/portal/submit-button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export function ActivityForm({ today }: { today: string }) {
  const [state, action] = useActionState(
    createActivityAction,
    initialActionState,
  );
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.status === "success") {
      toast.success(state.message);
      formRef.current?.reset();
    } else if (state.status === "error" && state.message) {
      toast.error(state.message);
    }
  }, [state]);

  return (
    <Card className="shadow-sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg text-primary">
          <Send className="size-5 text-[#a57c10]" />
          Today’s activity
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form ref={formRef} action={action} className="space-y-5">
          <div className="grid gap-5 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="workDate" className="flex items-center gap-2">
                <CalendarDays className="size-4 text-muted-foreground" />
                Work date
              </Label>
              <Input
                id="workDate"
                name="workDate"
                type="date"
                defaultValue={today}
                required
              />
              {state.errors?.workDate?.map((error) => (
                <p key={error} className="text-xs text-destructive">
                  {error}
                </p>
              ))}
            </div>
            <div className="space-y-2">
              <Label htmlFor="hours" className="flex items-center gap-2">
                <Clock3 className="size-4 text-muted-foreground" />
                Hours worked
              </Label>
              <Input
                id="hours"
                name="hours"
                type="number"
                min="0.25"
                max="12"
                step="0.25"
                placeholder="e.g. 4.5"
                required
              />
              {state.errors?.hours?.map((error) => (
                <p key={error} className="text-xs text-destructive">
                  {error}
                </p>
              ))}
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Activity / task description</Label>
            <Textarea
              id="description"
              name="description"
              rows={6}
              maxLength={1000}
              placeholder="What did you work on? Include enough detail for your future self and the IT team."
              required
            />
            <div className="flex items-start justify-between gap-4">
              <div>
                {state.errors?.description?.map((error) => (
                  <p key={error} className="text-xs text-destructive">
                    {error}
                  </p>
                ))}
              </div>
              <p className="text-xs text-muted-foreground">
                Maximum 1,000 characters
              </p>
            </div>
          </div>
          {state.status === "error" && state.message && (
            <Alert variant="destructive">
              <AlertDescription>{state.message}</AlertDescription>
            </Alert>
          )}
          <SubmitButton
            pendingLabel="Sending to the mothership…"
            className="w-full sm:w-auto"
          >
            <Send className="size-4" />
            Log activity
          </SubmitButton>
        </form>
      </CardContent>
    </Card>
  );
}
