// supabase/functions/magic-link/index.ts
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
    welcomeSubject: `ברוך הבא ל-${APP_NAME}! 🎉`,
    loginSubject: `התחבר ל-${APP_NAME}`,
    welcomeTitle: "ברוך הבא! 🎉",
    loginTitle: "התחבר לחשבון שלך 🔐",
    hello: "שלום",
    welcomeMessage: `תודה שנרשמת ל-${APP_NAME}.`,
    loginMessage: "קיבלנו בקשה להתחברות לחשבון שלך.",
    clickToLogin: "לחץ על הכפתור כדי להתחבר:",
    buttonTextNew: "🚀 התחבר והתחל",
    buttonTextExisting: "🔐 התחבר עכשיו",
    linkValid: "⏰ הקישור תקף ל-60 דקות",
    yourEmail: "📧 המייל שלך:",
    ignoreMessage: "אם לא ביקשת להתחבר, התעלם מהודעה זו.",
    regards: `בברכה, צוות ${APP_NAME}`,
    dir: "rtl",
  },
  en: {
    welcomeSubject: `Welcome to ${APP_NAME}! 🎉`,
    loginSubject: `Sign in to ${APP_NAME}`,
    welcomeTitle: "Welcome! 🎉",
    loginTitle: "Sign in to your account 🔐",
    hello: "Hello",
    welcomeMessage: `Thank you for signing up to ${APP_NAME}.`,
    loginMessage: "We received a request to sign in to your account.",
    clickToLogin: "Click the button to sign in:",
    buttonTextNew: "🚀 Sign in & Start",
    buttonTextExisting: "🔐 Sign in now",
    linkValid: "⏰ This link is valid for 60 minutes",
    yourEmail: "📧 Your email:",
    ignoreMessage: "If you didn't request this, please ignore this email.",
    regards: `Best regards, ${APP_NAME} Team`,
    dir: "ltr",
  },
  ar: {
    welcomeSubject: `مرحباً بك في ${APP_NAME}! 🎉`,
    loginSubject: `تسجيل الدخول إلى ${APP_NAME}`,
    welcomeTitle: "!مرحباً 🎉",
    loginTitle: "تسجيل الدخول إلى حسابك 🔐",
    hello: "مرحباً",
    welcomeMessage: `.${APP_NAME} شكراً لتسجيلك في`,
    loginMessage: "تلقينا طلباً لتسجيل الدخول إلى حسابك.",
    clickToLogin: ":انقر على الزر لتسجيل الدخول",
    buttonTextNew: "🚀 ابدأ الآن",
    buttonTextExisting: "🔐 تسجيل الدخول",
    linkValid: "⏰ هذا الرابط صالح لمدة 60 دقيقة",
    yourEmail: ":📧 بريدك الإلكتروني",
    ignoreMessage: "إذا لم تطلب هذا، يرجى تجاهل هذا البريد.",
    regards: `${APP_NAME} مع تحيات فريق`,
    dir: "rtl",
  },
  ru: {
    welcomeSubject: `Добро пожаловать в ${APP_NAME}! 🎉`,
    loginSubject: `Вход в ${APP_NAME}`,
    welcomeTitle: "Добро пожаловать! 🎉",
    loginTitle: "Войдите в свой аккаунт 🔐",
    hello: "Здравствуйте",
    welcomeMessage: `Спасибо за регистрацию в ${APP_NAME}.`,
    loginMessage: "Мы получили запрос на вход в ваш аккаунт.",
    clickToLogin: "Нажмите кнопку для входа:",
    buttonTextNew: "🚀 Войти и начать",
    buttonTextExisting: "🔐 Войти сейчас",
    linkValid: "⏰ Ссылка действительна 60 минут",
    yourEmail: "📧 Ваш email:",
    ignoreMessage: "Если вы не запрашивали это, проигнорируйте это письмо.",
    regards: `С уважением, команда ${APP_NAME}`,
    dir: "ltr",
  },
};

type Lang = keyof typeof translations;

const getTranslation = (lang: string): typeof translations.he => {
  return translations[lang as Lang] || translations.he;
};

// ─── Email Template ─────────────────────────────────────────────────────────
const magicLinkEmail = (
  email: string,
  magicLink: string,
  isNewUser: boolean,
  lang: string = "he"
) => {
  const t = getTranslation(lang);

  return {
    subject: isNewUser ? t.welcomeSubject : t.loginSubject,
    html: `
    <div dir="${t.dir}" style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="text-align: center; margin-bottom: 30px;">
        <h1 style="color: #3B5BDB; margin: 0;">${APP_NAME}</h1>
      </div>
      <h2 style="color: #333;">${isNewUser ? t.welcomeTitle : t.loginTitle}</h2>
      <p style="color: #555; font-size: 16px;">${t.hello},</p>
      <p style="color: #555; font-size: 16px;">${isNewUser ? t.welcomeMessage : t.loginMessage}</p>
      <p style="color: #555; font-size: 16px;">${t.clickToLogin}</p>
      <div style="text-align: center; margin: 35px 0;">
        <a href="${magicLink}" style="background: linear-gradient(135deg, #3B5BDB 0%, #228BE6 100%); color: white; padding: 16px 40px; border-radius: 10px; text-decoration: none; font-weight: bold; font-size: 16px; display: inline-block; box-shadow: 0 4px 15px rgba(59, 91, 219, 0.3);">
          ${isNewUser ? t.buttonTextNew : t.buttonTextExisting}
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
    const { email, lang = "he" } = await req.json();

    if (!email || !email.includes("@")) {
      return new Response(
        JSON.stringify({ error: "Invalid email address" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // Check if user exists and get their preferred language
    const { data: existingUsers } = await supabase
      .from("users")
      .select("id, lang")
      .eq("email", email)
      .limit(1);

    const isNewUser = !existingUsers || existingUsers.length === 0;
    
    // Use user's saved language preference, or the one sent from client
    const userLang = existingUsers?.[0]?.lang || lang;

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
    const emailContent = magicLinkEmail(email, magicLink, isNewUser, userLang);

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

    console.log(`Magic link sent to ${email} (${isNewUser ? "new" : "existing"}, lang: ${userLang})`);

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