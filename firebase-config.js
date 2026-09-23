// ============================================================
// إعدادات Firebase لمشروع qyam
// هذه القيم ليست سرية؛ الحماية الفعلية تكون عبر Security Rules
// ============================================================
export const firebaseConfig = {
  apiKey: "AIzaSyBtF5xJput8hVp4kOmHwzTRBJWO_JShM8E",
  authDomain: "qyam-3f7a3.firebaseapp.com",
  projectId: "qyam-3f7a3",
  storageBucket: "qyam-3f7a3.firebasestorage.app",
  messagingSenderId: "893734041175",
  appId: "1:893734041175:web:84d66011ddb89a10c0d512",
  measurementId: "G-5Q327S4YYL"
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
