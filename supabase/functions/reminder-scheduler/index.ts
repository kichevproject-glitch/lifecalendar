// supabase/functions/reminder-scheduler/index.ts
//
// Runs on a cron schedule every 5 minutes.
// Finds events whose reminder is due, sends email via Resend, marks as sent.

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const RESEND_API_KEY  = Deno.env.get('RESEND_API_KEY')!
const SUPABASE_URL    = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const FROM_EMAIL      = Deno.env.get('FROM_EMAIL') ?? 'reminders@yourdomain.com'

Deno.serve(async () => {
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)

  const now = new Date()
  // Look ahead 5 minutes (matching cron interval)
  const windowEnd = new Date(now.getTime() + 5 * 60 * 1000)

  // Find events where the reminder moment falls within the next 5 minutes
  // Reminder moment = start_at - reminder_minutes
  // We use a Postgres expression via rpc to keep this clean
  const { data: events, error } = await supabase
    .rpc('get_due_reminders', {
      window_start: now.toISOString(),
      window_end:   windowEnd.toISOString(),
    })

  if (error) {
    console.error('Error fetching due reminders:', error)
    return new Response(JSON.stringify({ error: error.message }), { status: 500 })
  }

  if (!events || events.length === 0) {
    return new Response(JSON.stringify({ sent: 0 }), { status: 200 })
  }

  let sentCount = 0

  for (const event of events) {
    try {
      // Build a clean date/time string
      const startDate = new Date(event.start_at)
      const dateStr = startDate.toLocaleDateString('en-GB', {
        weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
      })
      const timeStr = startDate.toLocaleTimeString('en-GB', {
        hour: '2-digit', minute: '2-digit',
      })

      const reminderLabel =
        event.reminder_minutes === 60   ? '1 hour before' :
        event.reminder_minutes === 180  ? '3 hours before' :
        event.reminder_minutes === 1440 ? '1 day before'  : ''

      // Send via Resend
      const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${RESEND_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: FROM_EMAIL,
          to:   event.user_email,
          subject: `Reminder: ${event.title}`,
          html: buildEmailHtml({
            title:       event.title,
            dateStr,
            timeStr,
            location:    event.location,
            description: event.description,
            reminderLabel,
          }),
        }),
      })

      if (!res.ok) {
        const body = await res.text()
        console.error(`Resend error for event ${event.id}:`, body)
        continue
      }

      // Mark as sent so we never send again
      await supabase
        .from('events')
        .update({ reminder_sent: true })
        .eq('id', event.id)

      sentCount++
    } catch (err) {
      console.error(`Failed to process event ${event.id}:`, err)
    }
  }

  return new Response(JSON.stringify({ sent: sentCount }), { status: 200 })
})

// ── Email HTML template ─────────────────────────────────────────────
function buildEmailHtml({ title, dateStr, timeStr, location, description, reminderLabel }: {
  title: string
  dateStr: string
  timeStr: string
  location?: string
  description?: string
  reminderLabel: string
}) {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
</head>
<body style="margin:0;padding:0;background:#0d0d14;font-family:'Helvetica Neue',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0d0d14;padding:40px 20px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;">

          <!-- Logo -->
          <tr>
            <td style="padding-bottom:24px;">
              <span style="font-size:20px;font-weight:800;color:#f0f0f8;letter-spacing:-0.01em;">Dayflow</span>
            </td>
          </tr>

          <!-- Card -->
          <tr>
            <td style="background:#1a1a2a;border:1px solid #2a2a40;border-radius:16px;padding:32px;">

              <!-- Bell + label -->
              <p style="margin:0 0 8px;font-size:12px;font-weight:600;color:#7c6fff;text-transform:uppercase;letter-spacing:0.08em;">
                🔔 Reminder — ${reminderLabel}
              </p>

              <!-- Event title -->
              <h1 style="margin:0 0 24px;font-size:22px;font-weight:700;color:#f0f0f8;line-height:1.3;">
                ${title}
              </h1>

              <!-- Date / time -->
              <table cellpadding="0" cellspacing="0" style="margin-bottom:14px;">
                <tr>
                  <td style="font-size:15px;padding-right:10px;">🗓</td>
                  <td style="font-size:14px;color:#9090b0;">${dateStr} · ${timeStr}</td>
                </tr>
              </table>

              ${location ? `
              <!-- Location -->
              <table cellpadding="0" cellspacing="0" style="margin-bottom:14px;">
                <tr>
                  <td style="font-size:15px;padding-right:10px;">📍</td>
                  <td style="font-size:14px;color:#9090b0;">${location}</td>
                </tr>
              </table>
              ` : ''}

              ${description ? `
              <!-- Description -->
              <table cellpadding="0" cellspacing="0" style="margin-bottom:0;">
                <tr>
                  <td style="font-size:15px;padding-right:10px;">📝</td>
                  <td style="font-size:14px;color:#9090b0;line-height:1.6;">${description}</td>
                </tr>
              </table>
              ` : ''}

            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding-top:20px;">
              <p style="margin:0;font-size:12px;color:#555570;text-align:center;">
                You're receiving this because you set a reminder in Dayflow.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim()
}
