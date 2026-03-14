import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
const FROM_EMAIL = Deno.env.get("FROM_EMAIL");
const APP_URL = Deno.env.get("APP_URL") || "https://lifecalendar.vercel.app";

Deno.serve(async (req) => {
  const { to, inviterEmail, token } = await req.json();

  if (!to || !token) {
    return new Response(JSON.stringify({ error: "Missing fields" }), { status: 400 });
  }

  const acceptUrl = APP_URL + "?accept=" + token;

  const html = "<html><body style='font-family:Arial;background:#0d0d14;padding:40px 20px;'>"
    + "<table width='100%' cellpadding='0' cellspacing='0'><tr><td align='center'>"
    + "<table width='100%' cellpadding='0' cellspacing='0' style='max-width:520px;'>"
    + "<tr><td style='padding-bottom:20px;'><span style='font-size:20px;font-weight:800;color:#f0f0f8;'>Dayflow</span></td></tr>"
    + "<tr><td style='background:#1a1a2a;border:1px solid #2a2a40;border-radius:16px;padding:32px;'>"
    + "<p style='margin:0 0 8px;font-size:12px;font-weight:600;color:#7c6fff;text-transform:uppercase;letter-spacing:0.08em;'>Calendar Invitation</p>"
    + "<h1 style='margin:0 0 16px;font-size:20px;font-weight:700;color:#f0f0f8;'>" + inviterEmail + " shared their calendar with you</h1>"
    + "<p style='margin:0 0 24px;color:#9090b0;font-size:14px;line-height:1.6;'>You have been invited to view their events and tasks in Dayflow. Click the button below to accept.</p>"
    + "<a href='" + acceptUrl + "' style='display:inline-block;background:#7c6fff;color:#fff;padding:12px 28px;border-radius:8px;font-weight:600;font-size:14px;text-decoration:none;'>Accept invitation</a>"
    + "<p style='margin:20px 0 0;font-size:11px;color:#555570;'>Or copy this link: " + acceptUrl + "</p>"
    + "</td></tr>"
    + "<tr><td style='padding-top:16px;'><p style='margin:0;font-size:12px;color:#555570;text-align:center;'>You received this because someone shared their Dayflow calendar with you.</p></td></tr>"
    + "</table></td></tr></table>"
    + "</body></html>";

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Authorization": "Bearer " + RESEND_API_KEY,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: FROM_EMAIL,
      to: to,
      subject: inviterEmail + " invited you to their Dayflow calendar",
      html,
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    return new Response(JSON.stringify({ error: err }), { status: 500 });
  }

  return new Response(JSON.stringify({ ok: true }), { status: 200 });
});
