import { cn, getInitials, truncate, formatFileSize } from "@/lib/utils";

describe("cn utility", () => {
  it("merges class names", () => {
    expect(cn("foo", "bar")).toBe("foo bar");
  });

  it("resolves tailwind conflicts", () => {
    expect(cn("p-4", "p-2")).toBe("p-2");
  });

  it("handles conditional classes", () => {
    expect(cn("base", false && "skip", "include")).toBe("base include");
  });
});

describe("getInitials", () => {
  it("gets initials from two-word name", () => {
    expect(getInitials("Jane Doe")).toBe("JD");
  });

  it("gets initials from one-word name", () => {
    expect(getInitials("Jane")).toBe("J");
  });

  it("caps at 2 characters", () => {
    expect(getInitials("John Michael Doe")).toBe("JM");
  });

  it("handles uppercase", () => {
    expect(getInitials("john doe")).toBe("JD");
  });
});

describe("truncate", () => {
  it("does not truncate short strings", () => {
    expect(truncate("hello", 10)).toBe("hello");
  });

  it("truncates long strings", () => {
    expect(truncate("hello world", 5)).toBe("hello...");
  });

  it("handles exact length", () => {
    expect(truncate("hello", 5)).toBe("hello");
  });
});

describe("formatFileSize", () => {
  it("formats bytes", () => {
    expect(formatFileSize(500)).toBe("500 B");
  });

  it("formats kilobytes", () => {
    expect(formatFileSize(1500)).toBe("1.5 KB");
  });

  it("formats megabytes", () => {
    expect(formatFileSize(2.5 * 1024 * 1024)).toBe("2.5 MB");
  });
});
