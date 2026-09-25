"use client";

import Image from "next/image";
import type {
  EmailTemplate,
  EmailTemplateDetailRow,
} from "@/redux/api-slice/campaign-slice";
import { renderPreviewText } from "@/lib/whatsapp-template-helper";

const MONITOR_WIDTH = 440;
const MONITOR_ASPECT_RATIO = 6416 / 4865;

// The Pro Display XDR SVG (public/Pro Display XDR.svg) has viewBox 6416 × 4865
// where the stand's group starts at y = 3544 — the actual screen glass ends at
// roughly 72.5% down. A bottom inset smaller than that lets scrollable content
// bleed over the top of the monitor stand, which is what happened at 19.5%.
// 27.5% clips the scroll region just above where the stand meets the display.
const SCREEN_INSET = {
  left: "5.2%",
  right: "5.2%",
  top: "4.6%",
  bottom: "27.5%",
};

/**
 * Every text field on an email template is passed through this before it
 * hits the preview — so `{{customer_name}}` shows as "Jhon Wick",
 * `{{store_name}}` as "Safarnest", etc., using the same
 * WHATSAPP_VARIABLE_CATEGORIES vocabulary the WhatsApp phone mockup does.
 * Only the preview reads these samples; the stored template keeps the raw
 * `{{token}}` text, resolved for real recipients server-side at send time.
 */
function preview(value: string | undefined | null): string {
  return value ? renderPreviewText(value) : "";
}

function DetailRow({ row }: { row: EmailTemplateDetailRow }) {
  return (
    <tr>
      <td
        style={{
          padding: "8px 12px",
          fontSize: "13px",
          color: "#6b7280",
          whiteSpace: "nowrap",
        }}
      >
        {row.icon && <span style={{ marginRight: 6 }}>{row.icon}</span>}
        {preview(row.label)}
      </td>
      <td
        style={{
          padding: "8px 12px",
          fontSize: "13px",
          fontWeight: 600,
          color: "#111827",
          textAlign: "right",
        }}
      >
        {preview(row.value)}
      </td>
    </tr>
  );
}

export function EmailTemplateMonitorPreview({
  template,
  maxWidth = MONITOR_WIDTH,
}: {
  template: Partial<EmailTemplate>;
  maxWidth?: number;
}) {
  const accent = template.accent_color || "#2563EB";
  const rows = template.detail_rows || [];

  return (
    <div
      className="relative mx-auto w-full overflow-hidden"
      style={{ maxWidth, aspectRatio: MONITOR_ASPECT_RATIO }}
    >
      <div
        className="absolute overflow-y-auto [&::-webkit-scrollbar]:hidden"
        style={{
          ...SCREEN_INSET,
          background: "#f3f4f6",
          // Scrolling stays functional; the scrollbar itself is hidden — Firefox
          // via `scrollbarWidth`, legacy Edge/IE via `msOverflowStyle`, and
          // WebKit/Blink via the Tailwind arbitrary variant above.
          scrollbarWidth: "none",
          msOverflowStyle: "none",
        }}
      >
        <div
          style={{
            maxWidth: 480,
            margin: "16px auto",
            fontFamily:
              '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
          }}
        >
          {template.preheader && (
            <div
              style={{
                fontSize: 0,
                lineHeight: 0,
                color: "transparent",
                height: 0,
                overflow: "hidden",
              }}
            >
              {preview(template.preheader)}
            </div>
          )}

          <div
            style={{
              background: "#ffffff",
              borderRadius: 12,
              overflow: "hidden",
              boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
            }}
          >
            {/* Hero badge */}
            <div
              style={{
                textAlign: "center",
                padding: "28px 24px 16px",
              }}
            >
              {template.icon && (
                <div
                  style={{
                    width: 52,
                    height: 52,
                    borderRadius: 26,
                    background: accent,
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 24,
                    marginBottom: 12,
                  }}
                >
                  {template.icon}
                </div>
              )}
              {template.heading && (
                <h1
                  style={{
                    fontSize: 20,
                    fontWeight: 700,
                    color: "#111827",
                    margin: "0 0 8px",
                    lineHeight: 1.3,
                  }}
                >
                  {preview(template.heading)}
                </h1>
              )}
            </div>

            {/* Intro */}
            {template.body_text && (
              <div style={{ padding: "0 24px 16px" }}>
                <p
                  style={{
                    fontSize: 14,
                    lineHeight: 1.6,
                    color: "#374151",
                    margin: 0,
                    whiteSpace: "pre-wrap",
                  }}
                >
                  {preview(template.body_text)}
                </p>
              </div>
            )}

            {/* Detail rows */}
            {rows.length > 0 && (
              <div style={{ padding: "0 24px 16px" }}>
                <table
                  style={{
                    width: "100%",
                    borderCollapse: "collapse",
                    background: "#f9fafb",
                    borderRadius: 8,
                    overflow: "hidden",
                  }}
                >
                  <tbody>
                    {rows.map((row, index) => (
                      <DetailRow key={index} row={row} />
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* CTA button */}
            {template.button_label && template.button_url && (
              <div style={{ padding: "0 24px 24px", textAlign: "center" }}>
                <span
                  style={{
                    display: "inline-block",
                    padding: "12px 32px",
                    background: accent,
                    color: "#ffffff",
                    fontSize: 14,
                    fontWeight: 600,
                    borderRadius: 8,
                    textDecoration: "none",
                  }}
                >
                  {preview(template.button_label)}
                </span>
              </div>
            )}

            {/* Footer */}
            {template.footer_text && (
              <div
                style={{
                  padding: "12px 24px",
                  borderTop: "1px solid #e5e7eb",
                  textAlign: "center",
                }}
              >
                <p
                  style={{
                    fontSize: 12,
                    color: "#9ca3af",
                    margin: 0,
                  }}
                >
                  {preview(template.footer_text)}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
      <Image
        src="/Pro Display XDR.svg"
        alt="Pro Display XDR Frame"
        fill
        className="pointer-events-none absolute inset-0 select-none"
      />
    </div>
  );
}
