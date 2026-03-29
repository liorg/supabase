// supabase/functions/forgot-password/index.ts
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Resend } from "npm:resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));
const FROM_EMAIL = Deno.env.get("FROM_EMAIL") || "noreply@mg.michal-solutions.com";
const APP_NAME = Deno.env.get("APP_NAME") || "VID";
const SITE_URL = Deno.env.get("SITE_URL") || "https://ui.michal-solutions.com";

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseServiceKey = Deno.env.get("SERVICE_ROLE_KEY")!;

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

// ─── Translations ───────────────────────────────────────────────────────────
const translations = {
  he: {
    subject: `איפוס סיסמה - ${APP_NAME} 🔐`,
    title: "איפוס סיסמה 🔐",
    hello: "שלום",
    message: "קיבלנו בקשה לאיפוס הסיסמה שלך.",
    clickToReset: "לחץ על הכפתור כדי לבחור סיסמה חדשה:",
    buttonText: "🔐 איפוס סיסמה",
    linkValid: "⏰ הקישור תקף ל-60 דקות",
    yourEmail: "📧 המייל שלך:",
    ignoreMessage: "אם לא ביקשת לאפס את הסיסמה, התעלם מהודעה זו. הסיסמה שלך לא תשתנה.",
    regards: `בברכה, צוות ${APP_NAME}`,
    dir: "rtl",
    // Errors
    emailRequired: "נדרש אימייל",
    linkFailed: "שגיאה ביצירת לינק איפוס",
    emailFailed: "שגיאה בשליחת מייל",
    success: "אם האימייל קיים במערכת, נשלח מייל עם הוראות לאיפוס הסיסמה",
  },
  en: {
    subject: `Password Reset - ${APP_NAME} 🔐`,
    title: "Password Reset 🔐",
    hello: "Hello",
    message: "We received a request to reset your password.",
    clickToReset: "Click the button to choose a new password:",
    buttonText: "🔐 Reset Password",
    linkValid: "⏰ This link is valid for 60 minutes",
    yourEmail: "📧 Your email:",
    ignoreMessage: "If you didn't request a password reset, please ignore this email. Your password will not change.",
    regards: `Best regards, ${APP_NAME} Team`,
    dir: "ltr",
    // Errors
    emailRequired: "Email is required",
    linkFailed: "Failed to generate reset link",
    emailFailed: "Failed to send email",
    success: "If the email exists in our system, reset instructions have been sent",
  },
  ar: {
    subject: `إعادة تعيين كلمة المرور - ${APP_NAME} 🔐`,
    title: "إعادة تعيين كلمة المرور 🔐",
    hello: "مرحباً",
    message: "تلقينا طلباً لإعادة تعيين كلمة المرور الخاصة بك.",
    clickToReset: ":انقر على الزر لاختيار كلمة مرور جديدة",
    buttonText: "🔐 إعادة تعيين كلمة المرور",
    linkValid: "⏰ هذا الرابط صالح لمدة 60 دقيقة",
    yourEmail: ":📧 بريدك الإلكتروني",
    ignoreMessage: "إذا لم تطلب إعادة تعيين كلمة المرور، يرجى تجاهل هذا البريد. لن تتغير كلمة المرور الخاصة بك.",
    regards: `${APP_NAME} مع تحيات فريق`,
    dir: "rtl",
    // Errors
    emailRequired: "البريد الإلكتروني مطلوب",
    linkFailed: "فشل في إنشاء رابط إعادة التعيين",
    emailFailed: "فشل في إرسال البريد الإلكتروني",
    success: "إذا كان البريد الإلكتروني موجوداً في نظامنا، فقد تم إرسال تعليمات إعادة التعيين",
  },
  ru: {
    subject: `Сброс пароля - ${APP_NAME} 🔐`,
    title: "Сброс пароля 🔐",
    hello: "Здравствуйте",
    message: "Мы получили запрос на сброс вашего пароля.",
    clickToReset: "Нажмите кнопку для выбора нового пароля:",
    buttonText: "🔐 Сбросить пароль",
    linkValid: "⏰ Ссылка действительна 60 минут",
    yourEmail: "📧 Ваш email:",
    ignoreMessage: "Если вы не запрашивали сброс пароля, проигнорируйте это письмо. Ваш пароль не изменится.",
    regards: `С уважением, команда ${APP_NAME}`,
    dir: "ltr",
    // Errors
    emailRequired: "Требуется email",
    linkFailed: "Ошибка создания ссылки сброса",
    emailFailed: "Ошибка отправки письма",
    success: "Если email существует в системе, инструкции по сбросу отправлены",
  },
};

type Lang = keyof typeof translations;

const getTranslation = (lang: string): typeof translations.he => {
  return translations[lang as Lang] || translations.he;
};

// ─── Email Template ─────────────────────────────────────────────────────────
const resetEmail = (email: string, resetLink: string, lang: string = "he") => {
  const t = getTranslation(lang);

  return {
    subject: t.subject,
    html: `
    <div dir="${t.dir}" style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="text-align: center; margin-bottom: 30px;">
        <h1 style="color: #3B5BDB; margin: 0;">${APP_NAME}</h1>
      </div>
      <h2 style="color: #333;">${t.title}</h2>
      <p style="color: #555; font-size: 16px;">${t.hello},</p>
      <p style="color: #555; font-size: 16px;">${t.message}</p>
      <p style="color: #555; font-size: 16px;">${t.clickToReset}</p>
      <div style="text-align: center; margin: 35px 0;">
        <a href="${resetLink}" style="background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); color: white; padding: 16px 40px; border-radius: 10px; text-decoration: none; font-weight: bold; font-size: 16px; display: inline-block; box-shadow: 0 4px 15px rgba(245, 158, 11, 0.3);">
          ${t.buttonText}
        </a>
      </div>
      <div style="background: #f8f9fa; padding: 15px; border-radius: 8px; margin: 25px 0;">
        <p style="color: #666; font-size: 13px; margin: 0;">${t.linkValid}</p>
        <p style="color: #666; font-size: 13px; margin: 8px 0 0;">${t.yourEmail} ${email}</p>
      </div>
      <p style="color: #999; font-size: 12px;">${t.ignoreMessage}</p>
      <hr style="border: none; border-top: 1px solid #eee; margin: 25px 0;">
      <p style="color: #999; font-size: 12px; text-align: center;">${t.regards}</p>
    </div>
  `,
  };
};

// ─── Main Handler ───────────────────────────────────────────────────────────
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
    const { email, redirectTo, lang = "he" } = await req.json();
    const t = getTranslation(lang);

    // Validation
    if (!email || !email.includes("@")) {
      return new Response(
        JSON.stringify({ error: t.emailRequired }),
        { status: 400, headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" } }
      );
    }

    // Check if user exists (but don't reveal to client for security)
    const { data: existingUsers } = await supabase.auth.admin.listUsers();
    const user = existingUsers?.users?.find(
      (u) => u.email?.toLowerCase() === email.toLowerCase()
    );

    // Always return success to prevent email enumeration
    if (!user) {
      console.log(`Password reset requested for non-existent email: ${email}`);
      return new Response(
        JSON.stringify({ success: true, message: t.success }),
        {
          status: 200,
          headers: {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
          },
        }
      );
    }

    // Get user's preferred language from metadata
    const userLang = user.user_metadata?.lang || lang;

    // Generate password reset link
    const { data: linkData, error: linkError } = await supabase.auth.admin.generateLink({
      type: "recovery",
      email,
      options: {
        redirectTo: redirectTo || `${SITE_URL}/reset-password`,
      },
    });

    if (linkError) {
      console.error("Link generation error:", linkError);
      return new Response(
        JSON.stringify({ error: t.linkFailed }),
        { status: 500, headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" } }
      );
    }

    const resetLink = linkData.properties?.action_link;

    if (!resetLink) {
      return new Response(
        JSON.stringify({ error: t.linkFailed }),
        { status: 500, headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" } }
      );
    }

    // Send email with Resend
    const emailContent = resetEmail(email, resetLink, userLang);

    const { error: emailError } = await resend.emails.send({
      from: FROM_EMAIL,
      to: email,
      subject: emailContent.subject,
      html: emailContent.html,
    });

    if (emailError) {
      console.error("Resend error:", emailError);
      return new Response(
        JSON.stringify({ error: t.emailFailed }),
        { status: 500, headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" } }
      );
    }

    console.log(`Password reset email sent to ${email} (lang: ${userLang})`);

    return new Response(
      JSON.stringify({ success: true, message: t.success }),
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
      { status: 500, headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" } }
    );
  }
});