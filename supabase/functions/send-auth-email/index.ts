import { Resend } from "npm:resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));
const FROM_EMAIL = Deno.env.get("FROM_EMAIL") || "noreply@mg.michal-solutions.com";
const APP_NAME = Deno.env.get("APP_NAME") || "VID";
const SITE_URL = Deno.env.get("SITE_URL") || "https://ui.michal-solutions.com";
// הוסף בראש הקובץ
const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || "https://umxgluptdopldndqjbvx.supabase.co";

// Email Templates
const templates = {
  // ✅ אימות מייל בהרשמה
  confirm_email: (email: string, confirmLink: string, name?: string) => ({
    subject: `אשר את המייל שלך - ${APP_NAME}`,
    html: `
      <div dir="rtl" style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h1 style="color: #3B5BDB;">אשר את המייל שלך ✉️</h1>
        <p>שלום${name ? ` ${name}` : ''},</p>
        <p>תודה שנרשמת ל-${APP_NAME}. לחץ על הכפתור כדי לאשר את כתובת המייל שלך:</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${confirmLink}" style="background: #3B5BDB; color: white; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: bold; display: inline-block;">
            אשר את המייל
          </a>
        </div>
        <p style="color: #666; font-size: 14px;">הקישור תקף ל-24 שעות.</p>
        <p style="color: #888; font-size: 12px;">אם לא נרשמת לשירות שלנו, התעלם מהודעה זו.</p>
        <p>בברכה,<br/>צוות ${APP_NAME}</p>
      </div>
    `,
  }),

  // ברוך הבא (נשלח אחרי אימות)
  welcome: (email: string, name?: string) => ({
    subject: `ברוך הבא ל-${APP_NAME}! 🎉`,
    html: `
      <div dir="rtl" style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h1 style="color: #3B5BDB;">ברוך הבא${name ? ` ${name}` : ''}! 🎉</h1>
        <p>תודה שאישרת את המייל שלך.</p>
        <p>אנחנו שמחים שהצטרפת אלינו!</p>
        <div style="background: #f5f5f5; padding: 15px; border-radius: 8px; margin: 20px 0;">
          <p style="margin: 0;"><strong>המייל שלך:</strong> ${email}</p>
        </div>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${SITE_URL}" style="background: #3B5BDB; color: white; padding: 12px 30px; border-radius: 8px; text-decoration: none; font-weight: bold;">
            התחבר עכשיו
          </a>
        </div>
        <p>אם יש לך שאלות, אנחנו כאן בשבילך.</p>
        <p>בברכה,<br/>צוות ${APP_NAME}</p>
      </div>
    `,
  }),

  // התחברות חדשה
  login: (email: string, metadata?: { ip?: string; userAgent?: string }) => ({
    subject: `התחברות חדשה לחשבון שלך`,
    html: `
      <div dir="rtl" style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h1 style="color: #3B5BDB;">התחברות חדשה 🔐</h1>
        <p>זוהתה התחברות חדשה לחשבון שלך.</p>
        <div style="background: #f5f5f5; padding: 15px; border-radius: 8px; margin: 20px 0;">
          <p style="margin: 5px 0;"><strong>מייל:</strong> ${email}</p>
          <p style="margin: 5px 0;"><strong>זמן:</strong> ${new Date().toLocaleString("he-IL")}</p>
          ${metadata?.ip ? `<p style="margin: 5px 0;"><strong>IP:</strong> ${metadata.ip}</p>` : ""}
        </div>
        <p style="color: #e74c3c;">אם זה לא היית את/ה, מומלץ לשנות סיסמה מיד.</p>
        <p>בברכה,<br/>צוות ${APP_NAME}</p>
      </div>
    `,
  }),

  // איפוס סיסמה
  password_reset: (email: string, resetLink: string) => ({
    subject: `איפוס סיסמה - ${APP_NAME}`,
    html: `
      <div dir="rtl" style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h1 style="color: #3B5BDB;">איפוס סיסמה 🔑</h1>
        <p>קיבלנו בקשה לאיפוס הסיסמה שלך.</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${resetLink}" style="background: #3B5BDB; color: white; padding: 12px 30px; border-radius: 8px; text-decoration: none; font-weight: bold;">
            לאיפוס הסיסמה
          </a>
        </div>
        <p style="color: #666; font-size: 14px;">הקישור תקף ל-60 דקות.</p>
        <p style="color: #e74c3c;">אם לא ביקשת איפוס סיסמה, התעלם מהודעה זו.</p>
        <p>בברכה,<br/>צוות ${APP_NAME}</p>
      </div>
    `,
  }),
};

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

  try {
    const payload = await req.json();
    const { type, record, old_record } = payload;

    // Supabase Auth Webhook payload structure
    const user = record;
    const email = user?.email;

    if (!email) {
      return new Response(JSON.stringify({ error: "No email provided" }), {
        status: 400,
      });
    }

    let emailData;

    // Determine event type
    if (type === "INSERT") {
      // ✅ משתמש חדש - שלח מייל אימות
      if (user.confirmation_token) {
        // יש token לאימות
        const confirmLink = `${SUPABASE_URL}/auth/v1/verify?token=${user.confirmation_token}&type=signup&redirect_to=${SITE_URL}`;
         emailData = templates.confirm_email(email, confirmLink, user?.user_metadata?.name);

      } else {
        // אין token (אולי Google signup) - שלח ברוך הבא
        emailData = templates.welcome(email, user?.user_metadata?.name);
      }
    } else if (type === "UPDATE" && old_record) {
      // ✅ בדוק אם המייל אומת עכשיו
      if (user.email_confirmed_at && !old_record.email_confirmed_at) {
        emailData = templates.welcome(email, user?.user_metadata?.name);
      }
      // בדוק אם זו התחברות (last_sign_in_at השתנה)
      else if (user.last_sign_in_at !== old_record.last_sign_in_at) {
        // אופציונלי: שלח מייל על התחברות
        // emailData = templates.login(email, {
        //   ip: req.headers.get("x-forwarded-for") || undefined,
        // });
      }
      // בדוק אם זו בקשת איפוס סיסמה
      else if (user.recovery_token && !old_record.recovery_token) {
        //const resetLink = `${SUPABASE_URL}/auth/v1/recover?token=${user.recovery_token}&type=recovery&redirect_to=${SITE_URL}`;
        // החלף ל:
        //const resetLink = `${SITE_URL}?type=recovery&token=${user.recovery_token}`;
        const resetLink = `${SUPABASE_URL}/auth/v1/verify?token=${user.recovery_token}&type=recovery&redirect_to=${SITE_URL}`;
        emailData = templates.password_reset(email, resetLink);
      }
    }

    if (emailData) {
      const { error } = await resend.emails.send({
        from: FROM_EMAIL,
        to: email,
        subject: emailData.subject,
        html: emailData.html,
      });

      if (error) {
        console.error("Resend error:", error);
        return new Response(JSON.stringify({ error: error.message }), {
          status: 500,
        });
      }

      console.log(`Email sent to ${email} (${type})`);
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
    });
  }
});