import {
  CATEGORY_LABELS,
  CATEGORY_ICONS,
  STATUS_LABELS,
  STATUS_COLORS,
  SEVERITY_LABELS,
  SEVERITY_COLORS,
  ALL_CATEGORIES,
  ALL_STATUSES,
  ALL_SEVERITIES,
} from "@/lib/types";

describe("Type constants completeness", () => {
  it("has labels for all categories", () => {
    ALL_CATEGORIES.forEach((cat) => {
      expect(CATEGORY_LABELS[cat]).toBeDefined();
      expect(CATEGORY_LABELS[cat].length).toBeGreaterThan(0);
    });
  });

  it("has icons for all categories", () => {
    ALL_CATEGORIES.forEach((cat) => {
      expect(CATEGORY_ICONS[cat]).toBeDefined();
    });
  });

  it("has labels and colors for all statuses", () => {
    ALL_STATUSES.forEach((status) => {
      expect(STATUS_LABELS[status]).toBeDefined();
      expect(STATUS_COLORS[status]).toBeDefined();
    });
  });

  it("has labels and colors for all severities", () => {
    ALL_SEVERITIES.forEach((sev) => {
      expect(SEVERITY_LABELS[sev]).toBeDefined();
      expect(SEVERITY_COLORS[sev]).toBeDefined();
    });
  });

  it("severity order is LOW to CRITICAL", () => {
    expect(ALL_SEVERITIES).toEqual(["LOW", "MEDIUM", "HIGH", "CRITICAL"]);
  });
});
