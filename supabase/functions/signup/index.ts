// supabase/functions/signup/index.ts
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
    subject: `ברוך הבא ל-${APP_NAME}! 🎉`,
    title: "ברוך הבא! 🎉",
    hello: "שלום",
    message: `תודה שנרשמת ל-${APP_NAME}.`,
    clickToVerify: "לחץ על הכפתור כדי לאמת את החשבון שלך:",
    buttonText: "✓ אמת את החשבון",
    linkValid: "⏰ הקישור תקף ל-24 שעות",
    yourEmail: "📧 המייל שלך:",
    ignoreMessage: "אם לא נרשמת, התעלם מהודעה זו.",
    regards: `בברכה, צוות ${APP_NAME}`,
    dir: "rtl",
    // Errors
    emailRequired: "נדרש אימייל",
    passwordRequired: "נדרשת סיסמה",
    passwordTooShort: "הסיסמה חייבת להכיל לפחות 6 תווים",
    emailExists: "אימייל זה כבר רשום במערכת",
    signupFailed: "שגיאה בהרשמה",
    linkFailed: "שגיאה ביצירת לינק אימות",
    emailFailed: "שגיאה בשליחת מייל",
    success: "נרשמת בהצלחה! בדוק את המייל לאימות החשבון",
  },
  en: {
    subject: `Welcome to ${APP_NAME}! 🎉`,
    title: "Welcome! 🎉",
    hello: "Hello",
    message: `Thank you for signing up to ${APP_NAME}.`,
    clickToVerify: "Click the button to verify your account:",
    buttonText: "✓ Verify Account",
    linkValid: "⏰ This link is valid for 24 hours",
    yourEmail: "📧 Your email:",
    ignoreMessage: "If you didn't sign up, please ignore this email.",
    regards: `Best regards, ${APP_NAME} Team`,
    dir: "ltr",
    // Errors
    emailRequired: "Email is required",
    passwordRequired: "Password is required",
    passwordTooShort: "Password must be at least 6 characters",
    emailExists: "This email is already registered",
    signupFailed: "Sign up failed",
    linkFailed: "Failed to generate verification link",
    emailFailed: "Failed to send email",
    success: "Successfully registered! Check your email to verify your account",
  },
  ar: {
    subject: `مرحباً بك في ${APP_NAME}! 🎉`,
    title: "!مرحباً 🎉",
    hello: "مرحباً",
    message: `.${APP_NAME} شكراً لتسجيلك في`,
    clickToVerify: ":انقر على الزر لتأكيد حسابك",
    buttonText: "✓ تأكيد الحساب",
    linkValid: "⏰ هذا الرابط صالح لمدة 24 ساعة",
    yourEmail: ":📧 بريدك الإلكتروني",
    ignoreMessage: "إذا لم تسجل، يرجى تجاهل هذا البريد.",
    regards: `${APP_NAME} مع تحيات فريق`,
    dir: "rtl",
    // Errors
    emailRequired: "البريد الإلكتروني مطلوب",
    passwordRequired: "كلمة المرور مطلوبة",
    passwordTooShort: "يجب أن تحتوي كلمة المرور على 6 أحرف على الأقل",
    emailExists: "هذا البريد الإلكتروني مسجل بالفعل",
    signupFailed: "فشل التسجيل",
    linkFailed: "فشل في إنشاء رابط التحقق",
    emailFailed: "فشل في إرسال البريد الإلكتروني",
    success: "تم التسجيل بنجاح! تحقق من بريدك الإلكتروني لتأكيد حسابك",
  },
  ru: {
    subject: `Добро пожаловать в ${APP_NAME}! 🎉`,
    title: "Добро пожаловать! 🎉",
    hello: "Здравствуйте",
    message: `Спасибо за регистрацию в ${APP_NAME}.`,
    clickToVerify: "Нажмите кнопку для подтверждения аккаунта:",
    buttonText: "✓ Подтвердить аккаунт",
    linkValid: "⏰ Ссылка действительна 24 часа",
    yourEmail: "📧 Ваш email:",
    ignoreMessage: "Если вы не регистрировались, проигнорируйте это письмо.",
    regards: `С уважением, команда ${APP_NAME}`,
    dir: "ltr",
    // Errors
    emailRequired: "Требуется email",
    passwordRequired: "Требуется пароль",
    passwordTooShort: "Пароль должен содержать минимум 6 символов",
    emailExists: "Этот email уже зарегистрирован",
    signupFailed: "Ошибка регистрации",
    linkFailed: "Ошибка создания ссылки подтверждения",
    emailFailed: "Ошибка отправки письма",
    success: "Регистрация успешна! Проверьте почту для подтверждения аккаунта",
  },
};

type Lang = keyof typeof translations;

const getTranslation = (lang: string): typeof translations.he => {
  return translations[lang as Lang] || translations.he;
};

// ─── Email Template ─────────────────────────────────────────────────────────
const signupEmail = (email: string, verifyLink: string, lang: string = "he") => {
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
      <p style="color: #555; font-size: 16px;">${t.clickToVerify}</p>
      <div style="text-align: center; margin: 35px 0;">
        <a href="${verifyLink}" style="background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%); color: white; padding: 16px 40px; border-radius: 10px; text-decoration: none; font-weight: bold; font-size: 16px; display: inline-block; box-shadow: 0 4px 15px rgba(34, 197, 94, 0.3);">
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
    const { email, password, metadata = {}, lang = "he" } = await req.json();
    const t = getTranslation(lang);

    // Validation
    if (!email || !email.includes("@")) {
      return new Response(
        JSON.stringify({ error: t.emailRequired }),
        { status: 400, headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" } }
      );
    }

    if (!password) {
      return new Response(
        JSON.stringify({ error: t.passwordRequired }),
        { status: 400, headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" } }
      );
    }

    if (password.length < 6) {
      return new Response(
        JSON.stringify({ error: t.passwordTooShort }),
        { status: 400, headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" } }
      );
    }

    // Check if user already exists
    const { data: existingUsers } = await supabase.auth.admin.listUsers();
    const userExists = existingUsers?.users?.some(
      (u) => u.email?.toLowerCase() === email.toLowerCase()
    );

    if (userExists) {
      return new Response(
        JSON.stringify({ error: t.emailExists }),
        { status: 400, headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" } }
      );
    }

    // Create user with Supabase Admin
    const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: false,
      user_metadata: { ...metadata, lang },
    });

    if (createError) {
      console.error("Create user error:", createError);
      return new Response(
        JSON.stringify({ error: createError.message || t.signupFailed }),
        { status: 400, headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" } }
      );
    }

    // Generate confirmation link
    const { data: linkData, error: linkError } = await supabase.auth.admin.generateLink({
      type: "signup",
      email,
      password,
      options: {
        redirectTo: SITE_URL,
      },
    });

    if (linkError) {
      console.error("Link generation error:", linkError);
      return new Response(
        JSON.stringify({ error: t.linkFailed }),
        { status: 500, headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" } }
      );
    }

    const verifyLink = linkData.properties?.action_link;

    if (!verifyLink) {
      return new Response(
        JSON.stringify({ error: t.linkFailed }),
        { status: 500, headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" } }
      );
    }

    // Send email with Resend
    const emailContent = signupEmail(email, verifyLink, lang);

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

    console.log(`Signup email sent to ${email} (lang: ${lang})`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: t.success,
        user: { id: newUser.user?.id, email: newUser.user?.email }
      }),
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