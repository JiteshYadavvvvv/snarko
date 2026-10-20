import { describe, expect, it } from "vitest";
import { absoluteUrl } from "@/lib/url";
import { siteConfig } from "@/config/site";

describe("absoluteUrl", () => {
  it("prefixes a leading-slash path with the site origin", () => {
    expect(absoluteUrl("/sitemap.xml")).toBe(`${siteConfig.url}/sitemap.xml`);
  });

  it("adds a leading slash when the path is missing one", () => {
    expect(absoluteUrl("about")).toBe(`${siteConfig.url}/about`);
  });

  it("returns the bare origin for the root path", () => {
    expect(absoluteUrl("/")).toBe(`${siteConfig.url}/`);
  });
});
