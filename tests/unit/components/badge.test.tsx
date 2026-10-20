import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Badge } from "@/components/ui/badge";

describe("Badge", () => {
  it("renders its children", () => {
    render(<Badge>Phase 0</Badge>);
    expect(screen.getByText("Phase 0")).toBeInTheDocument();
  });
});
