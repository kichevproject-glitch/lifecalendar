import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')!
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SERVICE_ROLE_KEY = Deno.env.get('SERVICE_ROLE_KEY')!
const FROM_EMAIL = Deno.env.get('FROM_EMAIL') ?? 'reminders@yourdomain.com'

Deno.serve(async () => {
  const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY)

  const now = new Date()
  const windowEnd = new Date(now.getTime() + 5 * 60 * 1000)

  const { data: events, error } = await supabase.rpc('get_due_reminders', {
    window_start: now.toISOString(),
    window_end: windowEnd.toISOString(),
  })

  if (error) {
    console.error('Error fetching reminders:', error)
    return new Response(JSON.stringify({ error: error.message }), { status: 500 })
  }

  if (!events || events.length === 0) {
    return new Response(JSON.stringify({ sent: 0 }), { status: 200 })
  }

  let sentCount = 0

  for (const event of events) {
    try {
      const startDate = new Date(event.start_at)
      const dateStr = startDate.toLocaleDateString('en-GB', {
        weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
      })
      const timeStr = startDate.toLocaleTimeString('en-GB', {
        hour: '2-digit', minute: '2-digit',
      })

      const reminderLabel =
        event.reminder_minutes === 60 ? '1 hour before' :
        event.reminder_minutes === 180 ? '3 hours before' :
        event.reminder_minutes === 1440 ? '1 day before' : ''

      const locationLine = event.location ? `<p style="margin:0 0 8px;color:#9090b0;">📍 ${event.location}</p>` : ''
      const descLine = event.description ? `<p style="margin:16px 0 0;color:#9090b0;line-height:1.6;">${event.description}</p>` : ''

      const html = `<!DOCTYPE html><html><body style="margin:0;padding:40px 20px;background:#0d0d14;font-family:Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0"><tr><td align="center">
<table width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;">
<tr><td style="padding-bottom:20px;"><span style="font-size:20px;font-weight:800;color:#f0f0f8;">Dayflow</span></td></tr>
<tr><td style="background:#1a1a2a;border:1px solid #2a2a40;border-radius:16px;padding:32px;">
<p style="margin:0 0 6px;font-size:12px;font-weight:600;color:#7c6fff;text-transform:uppercase;letter-spacing:0.08em;">Reminder — ${reminderLabel}</p>
<h1 style="margin:0 0 20px;font-size:22px;font-weight:700;color:#f0f0f8;">${event.title}</h1>
<p style="margin:0 0 8px;color:#9090b0;">🗓 ${dateStr} · ${timeStr}</p>
${locationLine}
${descLine}
</td></tr>
<tr><td style="padding-top:16px;"><p style="margin:0;font-size:12px;color:#555570;text-align:center;">You are receiving this because you set a reminder in Dayflow.</p></td></tr>
</table></td></tr></table>
</body></html>`

      const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${RESEND_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: FROM_EMAIL,
          to: event.user_email,
          subject: `Reminder: ${event.title}`,
          html,
        }),
      })

      if (!res.ok) {
        const body = await res.text()
        console.error(`Resend error for event ${event.id}:`, body)
        continue
      }

      await supabase
        .from('events')
        .update({ reminder_sent: true })
        .eq('id', event.id)

      sentCount++
    } catch (err) {
      console.error(`Failed for event ${event.id}:`, err)
    }
  }

  return new Response(JSON.stringify({ sent: sentCount }), { status: 200 })
})
