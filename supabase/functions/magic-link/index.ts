// supabase/functions/magic-link/index.ts
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Resend } from "npm:resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));
const FROM_EMAIL = Deno.env.get("FROM_EMAIL") || "noreply@mg.michal-solutions.com";
const APP_NAME = Deno.env.get("APP_NAME") || "ScenarioBot";
const SITE_URL = Deno.env.get("SITE_URL") || "https://ui.michal-solutions.com";

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseServiceKey = Deno.env.get("SERVICE_ROLE_KEY")!;

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

// Email Template
const magicLinkEmail = (email: string, magicLink: string, isNewUser: boolean) => ({
  subject: isNewUser ? `ברוך הבא ל-${APP_NAME}! 🎉` : `התחבר ל-${APP_NAME}`,
  html: `
    <div dir="rtl" style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="text-align: center; margin-bottom: 30px;">
        <h1 style="color: #3B5BDB; margin: 0;">${APP_NAME}</h1>
      </div>
      <h2 style="color: #333;">${isNewUser ? 'ברוך הבא! 🎉' : 'התחבר לחשבון שלך 🔐'}</h2>
      <p style="color: #555; font-size: 16px;">שלום,</p>
      <p style="color: #555; font-size: 16px;">${isNewUser ? `תודה שנרשמת ל-${APP_NAME}.` : `קיבלנו בקשה להתחברות לחשבון שלך.`}</p>
      <p style="color: #555; font-size: 16px;">לחץ על הכפתור כדי להתחבר:</p>
      <div style="text-align: center; margin: 35px 0;">
        <a href="${magicLink}" style="background: linear-gradient(135deg, #3B5BDB 0%, #228BE6 100%); color: white; padding: 16px 40px; border-radius: 10px; text-decoration: none; font-weight: bold; font-size: 16px; display: inline-block; box-shadow: 0 4px 15px rgba(59, 91, 219, 0.3);">
          ${isNewUser ? '🚀 התחבר והתחל' : '🔐 התחבר עכשיו'}
        </a>
      </div>
      <div style="background: #f8f9fa; padding: 15px; border-radius: 8px; margin: 25px 0;">
        <p style="color: #666; font-size: 13px; margin: 0;">⏰ הקישור תקף ל-60 דקות</p>
        <p style="color: #666; font-size: 13px; margin: 8px 0 0;">📧 המייל שלך: ${email}</p>
      </div>
      <p style="color: #999; font-size: 12px;">אם לא ביקשת להתחבר, התעלם מהודעה זו.</p>
      <hr style="border: none; border-top: 1px solid #eee; margin: 25px 0;">
      <p style="color: #999; font-size: 12px; text-align: center;">בברכה, צוות ${APP_NAME}</p>
    </div>
  `,
});

Deno.serve(async (req) => {
  // Handle CORS
  if (req.method === "OPTIONS") {
    return new Response(null, {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization",
      },
    });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    const { email } = await req.json();

    if (!email || !email.includes("@")) {
      return new Response(
        JSON.stringify({ error: "Invalid email address" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // Check if user exists
    const { data: existingUsers } = await supabase
      .from("users")
      .select("id")
      .eq("email", email)
      .limit(1);

    const isNewUser = !existingUsers || existingUsers.length === 0;

    // Generate Magic Link using Supabase Admin API
    const { data, error: generateError } = await supabase.auth.admin.generateLink({
      type: "magiclink",
      email: email,
      options: {
        redirectTo: SITE_URL,
      },
    });

    if (generateError) {
      console.error("Generate link error:", generateError);
      return new Response(
        JSON.stringify({ error: "Failed to generate magic link" }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    const magicLink = data.properties?.action_link;

    if (!magicLink) {
      return new Response(
        JSON.stringify({ error: "Failed to generate magic link" }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    // Send email with Resend
    const emailContent = magicLinkEmail(email, magicLink, isNewUser);
    
    const { error: emailError } = await resend.emails.send({
      from: FROM_EMAIL,
      to: email,
      subject: emailContent.subject,
      html: emailContent.html,
    });

    if (emailError) {
      console.error("Resend error:", emailError);
      return new Response(
        JSON.stringify({ error: "Failed to send email" }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    console.log(`Magic link sent to ${email} (${isNewUser ? "new user" : "existing user"})`);

    return new Response(
      JSON.stringify({ success: true, message: "Magic link sent" }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
      }
    );
  } catch (error) {
    console.error("Error:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Internal server error" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
});
