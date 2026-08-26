import { describe, expect, it } from "vitest";

import { INITIAL_AUTHORIZED_USERS } from "@/lib/constants";

describe("initial authorized accounts", () => {
  it("contains the exact requested users and roles without duplicates", () => {
    expect(INITIAL_AUTHORIZED_USERS).toEqual([
      {
        name: "Zhir Barzan",
        email: "zhir.barzan@auis.edu.krd",
        role: "ADMIN",
      },
      {
        name: "Karo Omed",
        email: "karo.omed@auis.edu.krd",
        role: "ADMIN",
      },
      {
        name: "LK 24117",
        email: "lk24117@auis.edu.krd",
        role: "STUDENT",
      },
      {
        name: "DD 23103",
        email: "dd23103@auis.edu.krd",
        role: "STUDENT",
      },
      {
        name: "Hazhir Aso",
        email: "hazhir.a.2004@auis.edu.krd",
        role: "STUDENT",
      },
    ]);
    expect(new Set(INITIAL_AUTHORIZED_USERS.map(({ email }) => email)).size).toBe(
      INITIAL_AUTHORIZED_USERS.length,
    );
  });

  it("uses only normalized AUIS email addresses", () => {
    for (const { email } of INITIAL_AUTHORIZED_USERS) {
      expect(email).toBe(email.toLowerCase());
      expect(email.endsWith("@auis.edu.krd")).toBe(true);
    }
  });
});
