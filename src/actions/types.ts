export type ActionState = {
  status: "idle" | "success" | "error";
  message: string;
  errors?: Record<string, string[]>;
  achievement?: boolean;
  existingUserId?: string;
  canReactivate?: boolean;
};

export const initialActionState: ActionState = {
  status: "idle",
  message: "",
};

export function errorState(message: string): ActionState {
  return { status: "error", message };
}
