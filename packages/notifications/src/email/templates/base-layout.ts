// ============================================================
// SERVICE OFFICIAL — Base Email Layout
// Shared wrapper for all transactional emails
// ============================================================

interface LayoutOptions {
  /** Email body HTML */
  content: string
  /** Preview text shown in email client list view */
  previewText?: string
  /** Company name shown in header (defaults to Service Official) */
  companyName?: string
  /** Optional footer override */
  footerHtml?: string
}

/**
 * Wraps email content in the branded Service Official layout.
 * Inline CSS for maximum email client compatibility.
 */
export function baseLayout(options: LayoutOptions): string {
  const { content, previewText, companyName, footerHtml } = options

  const preview = previewText
    ? `<div style="display:none;font-size:1px;color:#0d1117;line-height:1px;max-height:0;max-width:0;opacity:0;overflow:hidden;">${previewText}</div>`
    : ''

  const footer = footerHtml ?? `
    <p style="margin:0;color:#8b949e;font-size:13px;line-height:20px;">
      Sent by <strong>${companyName ?? 'Service Official'}</strong><br/>
      Powered by <a href="https://serviceofficial.app" style="color:#7eb8d4;text-decoration:none;">Service Official</a>
    </p>
  `

  return `<!DOCTYPE html>
<html lang="en" xmlns="http://www.w3.org/1999/xhtml">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1.0"/>
  <meta http-equiv="X-UA-Compatible" content="IE=edge"/>
  <title>${companyName ?? 'Service Official'}</title>
  <!--[if mso]>
  <style>table,td{font-family:Arial,Helvetica,sans-serif!important;}</style>
  <![endif]-->
</head>
<body style="margin:0;padding:0;background-color:#0d1117;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;">
  ${preview}

  <!-- Outer wrapper -->
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#0d1117;">
    <tr>
      <td align="center" style="padding:32px 16px;">

        <!-- Email card -->
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;background-color:#161d27;border-radius:12px;overflow:hidden;">

          <!-- Header -->
          <tr>
            <td style="padding:28px 32px 20px;border-bottom:1px solid #1c2433;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td>
                    <h1 style="margin:0;font-size:22px;font-weight:700;color:#e6edf3;letter-spacing:-0.3px;">
                      ${companyName ?? 'Service Official'}
                    </h1>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:32px;">
              ${content}
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding:24px 32px;border-top:1px solid #1c2433;">
              ${footer}
            </td>
          </tr>

        </table>
        <!-- /Email card -->

      </td>
    </tr>
  </table>
</body>
</html>`
}

// ── Shared Components ──────────────────────────────────────

/** Primary CTA button */
export function emailButton(text: string, href: string): string {
  return `
  <table role="presentation" cellpadding="0" cellspacing="0" style="margin:24px 0;">
    <tr>
      <td style="background-color:#7eb8d4;border-radius:8px;">
        <a href="${href}" target="_blank"
           style="display:inline-block;padding:14px 32px;color:#0d1117;font-size:15px;font-weight:600;text-decoration:none;border-radius:8px;">
          ${text}
        </a>
      </td>
    </tr>
  </table>`
}

/** Secondary / outline button */
export function emailButtonSecondary(text: string, href: string): string {
  return `
  <table role="presentation" cellpadding="0" cellspacing="0" style="margin:12px 0;">
    <tr>
      <td style="border:1px solid #30363d;border-radius:8px;">
        <a href="${href}" target="_blank"
           style="display:inline-block;padding:12px 28px;color:#e6edf3;font-size:14px;font-weight:500;text-decoration:none;border-radius:8px;">
          ${text}
        </a>
      </td>
    </tr>
  </table>`
}

/** Heading text */
export function emailHeading(text: string): string {
  return `<h2 style="margin:0 0 16px;font-size:20px;font-weight:600;color:#e6edf3;line-height:28px;">${text}</h2>`
}

/** Body paragraph */
export function emailText(text: string): string {
  return `<p style="margin:0 0 16px;font-size:15px;color:#c9d1d9;line-height:24px;">${text}</p>`
}

/** Muted small text */
export function emailMuted(text: string): string {
  return `<p style="margin:0 0 12px;font-size:13px;color:#8b949e;line-height:20px;">${text}</p>`
}

/** Key-value detail row */
export function emailDetailRow(label: string, value: string): string {
  return `
  <tr>
    <td style="padding:8px 0;color:#8b949e;font-size:14px;width:140px;vertical-align:top;">${label}</td>
    <td style="padding:8px 0;color:#e6edf3;font-size:14px;font-weight:500;">${value}</td>
  </tr>`
}

/** Wrapper for detail rows */
export function emailDetailsTable(rows: string): string {
  return `
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:16px 0 24px;">
    ${rows}
  </table>`
}

/** Gold accent amount display */
export function emailAmount(label: string, amount: string): string {
  return `
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:20px 0;background-color:#1c2433;border-radius:8px;">
    <tr>
      <td style="padding:20px 24px;">
        <span style="font-size:13px;color:#8b949e;text-transform:uppercase;letter-spacing:0.5px;">${label}</span>
        <br/>
        <span style="font-size:28px;font-weight:700;color:#c9a84c;letter-spacing:-0.5px;">${amount}</span>
      </td>
    </tr>
  </table>`
}

/** Horizontal divider */
export function emailDivider(): string {
  return `<hr style="border:none;border-top:1px solid #1c2433;margin:24px 0;"/>`
}
