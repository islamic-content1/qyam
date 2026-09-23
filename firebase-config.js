// ============================================================
// إعدادات Firebase — انسخي القيم من Firebase Console
// Project settings → General → Your apps → Web app → SDK setup and configuration → Config
// هذه القيم ليست سرية؛ الحماية الفعلية تكون عبر Security Rules
// ============================================================
export const firebaseConfig = {
  apiKey: "PASTE_API_KEY_HERE",
  authDomain: "PASTE_PROJECT_ID.firebaseapp.com",
  projectId: "PASTE_PROJECT_ID",
  storageBucket: "PASTE_PROJECT_ID.appspot.com",
  messagingSenderId: "PASTE_SENDER_ID",
  appId: "PASTE_APP_ID"
};

// النطاق المستخدم لإيميلات الفتيات داخل Firebase Authentication
// لا حاجة أن يكون إيميلًا حقيقيًا، لكن يجب أن يطابق firestore.rules
export const EMAIL_DOMAIN = "qiyam-khatma.app";

// الفتيات بالترتيب الظاهر في التبويبات (من اليمين لليسار)
// id يُستخدم في الإيميل: manar@qiyam-khatma.app
export const GIRLS = [
  { id: "manar", name: "منار" },
  { id: "lour",  name: "لور" },
  { id: "lama",  name: "لمى" },
  { id: "haya",  name: "هيا" },
  { id: "zeina", name: "زينة" }
];
