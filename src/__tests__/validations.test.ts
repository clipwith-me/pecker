import { createIncidentSchema, registerSchema, loginSchema, updateIncidentStatusSchema } from "@/lib/validations";
import { VALID_STATUS_TRANSITIONS } from "@/lib/types";

describe("createIncidentSchema", () => {
  it("validates a valid incident", () => {
    const result = createIncidentSchema.safeParse({
      title: "Broken streetlight on Main Ave",
      category: "BROKEN_STREETLIGHT",
      severity: "HIGH",
      locationText: "Main Ave & 5th",
    });
    expect(result.success).toBe(true);
  });

  it("rejects title shorter than 5 chars", () => {
    const result = createIncidentSchema.safeParse({
      title: "Ugh",
      category: "FLOODING",
    });
    expect(result.success).toBe(false);
    expect(result.error?.errors[0].message).toMatch(/5/);
  });

  it("rejects invalid category", () => {
    const result = createIncidentSchema.safeParse({
      title: "Valid title here",
      category: "INVALID_CATEGORY",
    });
    expect(result.success).toBe(false);
  });

  it("defaults severity to MEDIUM", () => {
    const result = createIncidentSchema.safeParse({
      title: "Valid title here",
      category: "ROAD_DAMAGE",
    });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.severity).toBe("MEDIUM");
  });

  it("validates all categories", () => {
    const categories = ["BROKEN_STREETLIGHT", "FLOODING", "GARBAGE_OVERFLOW", "DRAINAGE_ISSUE", "ROAD_DAMAGE", "SAFETY_SECURITY", "VANDALISM", "OTHER"];
    categories.forEach((cat) => {
      const result = createIncidentSchema.safeParse({ title: "Test incident title", category: cat });
      expect(result.success).toBe(true);
    });
  });
});

describe("registerSchema", () => {
  it("validates a complete registration", () => {
    const result = registerSchema.safeParse({
      name: "Jane Doe",
      email: "jane@example.com",
      password: "Password1",
    });
    expect(result.success).toBe(true);
  });

  it("rejects invalid email", () => {
    const result = registerSchema.safeParse({
      name: "Jane Doe",
      email: "not-an-email",
      password: "Password1",
    });
    expect(result.success).toBe(false);
  });

  it("rejects weak password (no uppercase)", () => {
    const result = registerSchema.safeParse({
      name: "Jane Doe",
      email: "jane@example.com",
      password: "password1",
    });
    expect(result.success).toBe(false);
  });

  it("rejects weak password (no number)", () => {
    const result = registerSchema.safeParse({
      name: "Jane Doe",
      email: "jane@example.com",
      password: "Password",
    });
    expect(result.success).toBe(false);
  });

  it("rejects short name", () => {
    const result = registerSchema.safeParse({
      name: "J",
      email: "jane@example.com",
      password: "Password1",
    });
    expect(result.success).toBe(false);
  });
});

describe("loginSchema", () => {
  it("validates valid login", () => {
    const result = loginSchema.safeParse({ email: "test@test.com", password: "any" });
    expect(result.success).toBe(true);
  });

  it("rejects empty password", () => {
    const result = loginSchema.safeParse({ email: "test@test.com", password: "" });
    expect(result.success).toBe(false);
  });
});

describe("Status transitions", () => {
  it("NEW can transition to ACKNOWLEDGED or REJECTED", () => {
    const transitions = VALID_STATUS_TRANSITIONS["NEW"];
    expect(transitions).toContain("ACKNOWLEDGED");
    expect(transitions).toContain("REJECTED");
    expect(transitions).not.toContain("RESOLVED");
    expect(transitions).not.toContain("CLOSED");
  });

  it("RESOLVED can transition to CLOSED or back to IN_PROGRESS", () => {
    const transitions = VALID_STATUS_TRANSITIONS["RESOLVED"];
    expect(transitions).toContain("CLOSED");
    expect(transitions).toContain("IN_PROGRESS");
  });

  it("CLOSED has no valid transitions", () => {
    expect(VALID_STATUS_TRANSITIONS["CLOSED"]).toHaveLength(0);
  });

  it("REJECTED has no valid transitions", () => {
    expect(VALID_STATUS_TRANSITIONS["REJECTED"]).toHaveLength(0);
  });

  it("IN_PROGRESS can transition to RESOLVED", () => {
    expect(VALID_STATUS_TRANSITIONS["IN_PROGRESS"]).toContain("RESOLVED");
  });
});

describe("updateIncidentStatusSchema", () => {
  it("validates valid status update", () => {
    const result = updateIncidentStatusSchema.safeParse({ status: "ACKNOWLEDGED", note: "Reviewed" });
    expect(result.success).toBe(true);
  });

  it("rejects invalid status", () => {
    const result = updateIncidentStatusSchema.safeParse({ status: "PENDING" });
    expect(result.success).toBe(false);
  });
});
