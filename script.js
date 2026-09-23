// ============================================================
// ختمة القيام — منطق الموقع
// ============================================================
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import {
  getAuth,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  setPersistence,
  browserLocalPersistence
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import {
  getFirestore,
  doc,
  setDoc,
  onSnapshot,
  deleteField
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { firebaseConfig, EMAIL_DOMAIN, GIRLS } from "./firebase-config.js";

// ------------------------------------------------------------
// تقسيم الأوراد والأجزاء
// ------------------------------------------------------------

// بدايات الأجزاء حسب مصحف المدينة
const JUZ_STARTS = [1, 22, 42, 62, 82, 102, 122, 142, 162, 182,
  202, 222, 242, 262, 282, 302, 322, 342, 362, 382,
  402, 422, 442, 462, 482, 502, 522, 542, 562, 582];

const TOTAL_PAGES = 604;

// يرجع رقم الجزء لصفحة معينة
function juzOfPage(page) {
  let juz = 1;
  for (let i = 0; i < JUZ_STARTS.length; i++) {
    if (page >= JUZ_STARTS[i]) juz = i + 1;
  }
  return juz;
}

// بناء قائمة الأوراد: الأول 1–6، ثم كل خمس صفحات، والأخير 597–604
function buildWirds() {
  const wirds = [{ num: 1, from: 1, to: 6 }];
  let start = 7;
  while (start <= TOTAL_PAGES) {
    let end = start + 4;
    // إذا بقي بعد هذا الورد أقل من خمس صفحات، نضمها لهذا الورد
    if (TOTAL_PAGES - end < 5) end = TOTAL_PAGES;
    wirds.push({ num: wirds.length + 1, from: start, to: end });
    start = end + 1;
  }
  return wirds;
}

// تقسيم صفحات الورد على الأجزاء
function juzParts(from, to) {
  const parts = [];
  for (let p = from; p <= to; p++) {
    const j = juzOfPage(p);
    const last = parts[parts.length - 1];
    if (last && last.juz === j) last.to = p;
    else parts.push({ juz: j, from: p, to: p });
  }
  return parts;
}

// نص خلية الجزء
function juzLabels(from, to) {
  const parts = juzParts(from, to);
  if (parts.length === 1) return [`الجزء ${parts[0].juz}`];
  return parts.map(part =>
    part.from === part.to
      ? `الجزء ${part.juz}: الصفحة ${part.from}`
      : `الجزء ${part.juz}: الصفحات ${part.from}–${part.to}`
  );
}

const WIRDS = buildWirds();

// ------------------------------------------------------------
// أدوات مساعدة
// ------------------------------------------------------------

// تاريخ اليوم حسب جهاز المستخدمة بصيغة YYYY-MM-DD
function todayISO() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

// عرض التاريخ: كامل DD/MM/YYYY للكمبيوتر، ومختصر D/M للجوال
function setDateCell(td, iso) {
  td.textContent = "";
  if (!iso) return;
  const [y, m, d] = iso.split("-");
  const full = document.createElement("span");
  full.className = "d-full";
  full.textContent = `${d}/${m}/${y}`;
  const short = document.createElement("span");
  short.className = "d-short";
  short.textContent = `${Number(d)}/${Number(m)}`;
  td.append(full, short);
}

function girlById(id) {
  return GIRLS.find(g => g.id === id);
}

function girlIdFromEmail(email) {
  if (!email) return null;
  const [local, domain] = email.toLowerCase().split("@");
  if (domain !== EMAIL_DOMAIN) return null;
  return girlById(local) ? local : null;
}

// ------------------------------------------------------------
// Firebase
// ------------------------------------------------------------
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
setPersistence(auth, browserLocalPersistence).catch(() => {});

// ------------------------------------------------------------
// عناصر الصفحة والحالة
// ------------------------------------------------------------
const el = {
  boot: document.getElementById("bootMsg"),
  loginView: document.getElementById("loginView"),
  loginForm: document.getElementById("loginForm"),
  loginName: document.getElementById("loginName"),
  loginPassword: document.getElementById("loginPassword"),
  loginBtn: document.getElementById("loginBtn"),
  loginError: document.getElementById("loginError"),
  sheetView: document.getElementById("sheetView"),
  sheetOwner: document.getElementById("sheetOwner"),
  saveStatus: document.getElementById("saveStatus"),
  logoutBtn: document.getElementById("logoutBtn"),
  gridWrap: document.getElementById("gridWrap"),
  gridBody: document.getElementById("gridBody"),
  tabs: document.getElementById("tabs")
};

const state = {
  myGirl: null,        // الفتاة المسجلة دخولها
  currentGirl: null,   // الشيت المفتوح حاليًا
  unsubscribe: null,   // إلغاء الاستماع للشيت
  data: { done: {} },
  rows: new Map()      // رقم الورد → عناصر الصف
};

// ------------------------------------------------------------
// شاشة الدخول
// ------------------------------------------------------------
GIRLS.forEach(g => {
  const opt = document.createElement("option");
  opt.value = g.id;
  opt.textContent = g.name;
  el.loginName.appendChild(opt);
});

el.loginForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  el.loginError.textContent = "";
  el.loginBtn.disabled = true;
  const email = `${el.loginName.value}@${EMAIL_DOMAIN}`;
  try {
    await signInWithEmailAndPassword(auth, email, el.loginPassword.value);
    el.loginPassword.value = "";
  } catch (err) {
    const code = err && err.code ? err.code : "";
    if (code.includes("too-many-requests")) {
      el.loginError.textContent = "محاولات كثيرة، حاولي بعد قليل";
    } else if (code.includes("network")) {
      el.loginError.textContent = "لا يوجد اتصال بالإنترنت";
    } else {
      el.loginError.textContent = "كلمة المرور غير صحيحة";
    }
  } finally {
    el.loginBtn.disabled = false;
  }
});

el.logoutBtn.addEventListener("click", () => {
  signOut(auth);
});

// ------------------------------------------------------------
// حالة تسجيل الدخول
// ------------------------------------------------------------
onAuthStateChanged(auth, (user) => {
  el.boot.hidden = true;

  if (!user) {
    stopListening();
    state.myGirl = null;
    el.sheetView.hidden = true;
    el.loginView.hidden = false;
    return;
  }

  const girlId = girlIdFromEmail(user.email);
  if (!girlId) {
    // حساب غير معروف
    signOut(auth);
    el.loginError.textContent = "هذا الحساب غير مسموح";
    return;
  }

  state.myGirl = girlId;
  el.loginView.hidden = true;
  el.sheetView.hidden = false;
  buildTabs();
  openSheet(girlId);
});

// ------------------------------------------------------------
// التبويبات
// ------------------------------------------------------------
function buildTabs() {
  el.tabs.innerHTML = "";
  GIRLS.forEach(g => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "tab";
    btn.dataset.girl = g.id;
    btn.textContent = g.name;
    if (g.id === state.myGirl) btn.classList.add("mine");
    btn.addEventListener("click", () => {
      if (state.currentGirl !== g.id) openSheet(g.id);
    });
    el.tabs.appendChild(btn);
  });
}

function markActiveTab() {
  el.tabs.querySelectorAll(".tab").forEach(t => {
    const active = t.dataset.girl === state.currentGirl;
    t.classList.toggle("active", active);
    t.setAttribute("aria-current", active ? "page" : "false");
    if (active) t.scrollIntoView({ block: "nearest", inline: "nearest" });
  });
}

// ------------------------------------------------------------
// فتح شيت فتاة
// ------------------------------------------------------------
function openSheet(girlId) {
  stopListening();

  state.currentGirl = girlId;
  state.data = { done: {} };
  el.sheetOwner.textContent = `شيت ${girlById(girlId).name}`;
  el.saveStatus.textContent = "";
  markActiveTab();
  renderTable();
  el.gridWrap.scrollTop = 0;

  const ref = doc(db, "sheets", girlId);
  state.unsubscribe = onSnapshot(ref, (snap) => {
    const d = snap.exists() ? snap.data() : {};
    state.data = { done: d.done || {} };
    fillData();
  }, () => {
    el.saveStatus.textContent = "تعذر تحميل البيانات";
  });
}

function stopListening() {
  if (state.unsubscribe) {
    state.unsubscribe();
    state.unsubscribe = null;
  }
}

function canEdit() {
  return state.currentGirl === state.myGirl;
}

// ------------------------------------------------------------
// رسم الجدول
// ------------------------------------------------------------
function renderTable() {
  const editable = canEdit();
  el.gridBody.innerHTML = "";
  state.rows.clear();

  const frag = document.createDocumentFragment();

  WIRDS.forEach(w => {
    const tr = document.createElement("tr");

    // رقم الورد
    const tdNum = document.createElement("td");
    tdNum.className = "c-num";
    tdNum.textContent = w.num;

    // صفحات الورد
    const tdPages = document.createElement("td");
    tdPages.className = "c-pages";
    tdPages.textContent = `${w.from}–${w.to}`;

    // الجزء
    const tdJuz = document.createElement("td");
    tdJuz.className = "c-juz";
    juzLabels(w.from, w.to).forEach(line => {
      const span = document.createElement("span");
      span.className = "juz-line";
      // نعزل نطاق الصفحات حتى يظهر بالترتيب الصحيح 117–120
      const m = line.match(/^(.*?)(\d+–\d+)$/);
      if (m) {
        span.append(m[1]);
        const range = document.createElement("span");
        range.className = "range";
        range.textContent = m[2];
        span.appendChild(range);
      } else {
        span.textContent = line;
      }
      tdJuz.appendChild(span);
    });

    // التاريخ
    const tdDate = document.createElement("td");
    tdDate.className = "c-date";

    // تم
    const tdDone = document.createElement("td");
    tdDone.className = "c-done";
    const box = document.createElement("input");
    box.type = "checkbox";
    box.className = "done-box";
    box.setAttribute("aria-label", `تم الورد ${w.num}`);
    box.disabled = !editable;
    if (editable) {
      box.addEventListener("change", () => onToggleDone(w.num, box.checked));
    }
    tdDone.appendChild(box);

    tr.append(tdNum, tdPages, tdJuz, tdDate, tdDone);
    frag.appendChild(tr);
    state.rows.set(w.num, { tr, tdDate, box });
  });

  el.gridBody.appendChild(frag);
}

// تعبئة البيانات القادمة من قاعدة البيانات
function fillData() {
  state.rows.forEach((row, num) => {
    const date = state.data.done[String(num)] || "";
    row.box.checked = Boolean(date);
    setDateCell(row.tdDate, date);
    row.tr.classList.toggle("is-done", Boolean(date));
  });
}

// ------------------------------------------------------------
// «تم» والتاريخ
// ------------------------------------------------------------
async function onToggleDone(num, checked) {
  if (!canEdit()) return;
  const key = String(num);
  const row = state.rows.get(num);
  const prev = state.data.done[key] || "";
  const date = checked ? todayISO() : "";

  // تحديث فوري للواجهة
  if (checked) state.data.done[key] = date;
  else delete state.data.done[key];
  setDateCell(row.tdDate, date);
  row.tr.classList.toggle("is-done", checked);

  const ref = doc(db, "sheets", state.myGirl);
  setStatus("جاري الحفظ...");
  try {
    await setDoc(ref, { done: { [key]: checked ? date : deleteField() } }, { merge: true });
    setStatus("تم الحفظ");
  } catch (err) {
    // إرجاع الحالة السابقة عند الفشل
    if (prev) state.data.done[key] = prev;
    else delete state.data.done[key];
    row.box.checked = Boolean(prev);
    setDateCell(row.tdDate, prev);
    row.tr.classList.toggle("is-done", Boolean(prev));
    setStatus("تعذر الحفظ");
  }
}

// ------------------------------------------------------------
// حالة الحفظ
// ------------------------------------------------------------
let statusTimer = null;
function setStatus(text) {
  el.saveStatus.textContent = text;
  clearTimeout(statusTimer);
  if (text === "تم الحفظ") {
    statusTimer = setTimeout(() => { el.saveStatus.textContent = ""; }, 2000);
  }
}
