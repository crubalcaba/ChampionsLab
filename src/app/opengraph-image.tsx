import { ImageResponse } from "next/og";
import { readFile } from "node:fs/promises";
import { join } from "node:path";

// Required by `output: "export"` — pre-rendered once at build time.
export const dynamic = "force-static";

export const alt = "Not exactly Champions Lab - Pokémon Champions 2026";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image() {
  const logoBytes = await readFile(join(process.cwd(), "public/logo.png"));
  const logoBase64 = `data:image/png;base64,${logoBytes.toString("base64")}`;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          background: "linear-gradient(135deg, #1e1b4b 0%, #312e81 40%, #0c4a6e 100%)",
          fontFamily: "system-ui, sans-serif",
        }}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "16px",
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={logoBase64}
            alt=""
            width={200}
            height={200}
          />
          <div
            style={{
              fontSize: "24px",
              color: "rgba(255,255,255,0.7)",
              fontWeight: 500,
            }}
          >
            Pokémon Champions 2026
          </div>
          <div
            style={{
              display: "flex",
              gap: "24px",
              marginTop: "24px",
            }}
          >
            {["Team Builder", "META Analysis", "Battle Bot", "PokéSchool"].map(
              (label) => (
                <div
                  key={label}
                  style={{
                    padding: "8px 20px",
                    borderRadius: "12px",
                    background: "rgba(255,255,255,0.1)",
                    border: "1px solid rgba(255,255,255,0.15)",
                    color: "rgba(255,255,255,0.8)",
                    fontSize: "16px",
                    fontWeight: 600,
                  }}
                >
                  {label}
                </div>
              )
            )}
          </div>
          <div
            style={{
              marginTop: "32px",
              fontSize: "18px",
              color: "rgba(255,255,255,0.4)",
            }}
          >
            championslab.xyz
          </div>
        </div>
      </div>
    ),
    { ...size }
  );
}
