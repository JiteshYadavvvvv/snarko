import { ImageResponse } from "next/og";
import { siteConfig } from "@/config/site";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpengraphImage() {
  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        alignItems: "flex-start",
        justifyContent: "center",
        padding: "80px",
        backgroundColor: "#0b0b0d",
      }}
    >
      <div
        style={{
          width: "64px",
          height: "8px",
          backgroundColor: "#e63b42",
          marginBottom: "32px",
        }}
      />
      <div
        style={{
          fontSize: 104,
          fontWeight: 700,
          color: "#f4f1ea",
          letterSpacing: "-0.02em",
        }}
      >
        {siteConfig.name}
      </div>
      <div style={{ fontSize: 32, color: "#a6a6ac", marginTop: "16px" }}>
        {siteConfig.tagline}
      </div>
    </div>,
    size,
  );
}
