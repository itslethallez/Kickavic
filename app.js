const ORIGINALS = {
  firstName: "James",
  fullName: "James",
  initials: "JSP",
  medicareNumber: "3430 12549 6",
  medicareMasked: "**** **549 6",
  member1: "James",
  member2: "",
  people: "1 person",
  validTo: "Jun 2031",
  lastUpdated: "Last updated 8 Sept 2026 at 8:14 am",
  pin: "",
  inbox: "15",
};

const KEY = "mygov-prop-profile";

const MESSAGES = [
  ["Centrelink", "Your payment has been processed", "8 Sept 2026", "A payment has been deposited into your nominated account."],
  ["Medicare", "Claim processed", "8 Sept 2026", "Your most recent Medicare claim has been processed."],
  ["myGov", "New message in your inbox", "7 Sept 2026", "You have a new letter from a linked service."],
  ["Centrelink", "Reporting reminder", "6 Sept 2026", "Remember to report your income by the due date."],
  ["Medicare", "Benefits statement", "5 Sept 2026", "Your Medicare benefits statement is ready to view."],
  ["Workforce Australia", "Appointment confirmation", "4 Sept 2026", "Your appointment has been confirmed."],
  ["Centrelink", "Concession card update", "3 Sept 2026", "Your concession details were updated."],
  ["myGov", "Sign-in notification", "2 Sept 2026", "A new device signed in to your myGov account."],
  ["Medicare", "Immunisation record", "1 Sept 2026", "Your immunisation history has been updated."],
  ["Centrelink", "Letter available", "30 Aug 2026", "A new Centrelink letter is available."],
  ["My Health Record", "Record updated", "28 Aug 2026", "New information was added to your health record."],
  ["Medicare", "Card details", "20 Aug 2026", "Your digital Medicare card is available in the wallet."],
  ["Centrelink", "Income reported", "18 Aug 2026", "Thanks, we have received your income report."],
  ["myGov", "Linked service", "10 Apr 2026", "Medicare was linked to your myGov account."],
  ["Centrelink", "Service linked", "6 Apr 2026", "Centrelink was linked to your myGov account."],
];

let profile = loadProfile();
let pinValue = "";
let stack = ["welcome"];
let toastTimer;

function loadProfile() {
  try {
    return { ...ORIGINALS, ...JSON.parse(localStorage.getItem(KEY) || "{}") };
  } catch {
    return { ...ORIGINALS };
  }
}

function saveProfile() {
  localStorage.setItem(KEY, JSON.stringify(profile));
}

function maskMedicare(num) {
  const d = String(num).replace(/\D/g, "");
  if (d.length < 4) return num || ORIGINALS.medicareMasked;
  const last = d.slice(-4);
  return `**** **${last.slice(0, 3)} ${last.slice(3)}`;
}

function peopleLabel() {
  const names = [profile.member1, profile.member2].filter((s) => String(s).trim());
  if (names.length <= 1) return "1 person";
  return `${names.length} people`;
}

function showScreen(id, push = true) {
  document.querySelectorAll(".screen").forEach((s) => s.classList.toggle("active", s.id === id));
  closeOverlays();
  if (push) {
    const cur = stack[stack.length - 1];
    if (cur !== id) stack.push(id);
  }
  if (id === "pin") {
    pinValue = "";
    renderPin();
  }
}

function back() {
  if (stack.length > 1) stack.pop();
  showScreen(stack[stack.length - 1] || "welcome", false);
}

function toast(msg) {
  const el = document.getElementById("toast");
  el.textContent = msg;
  el.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove("show"), 1800);
}

function closeOverlays() {
  document.querySelectorAll(".overlay").forEach((o) => o.classList.remove("show"));
}

function openOverlay(id) {
  const el = document.getElementById(id);
  if (el) el.classList.add("show");
}

function applyProfile(skipEditorSync = false) {
  const p = profile;
  p.medicareMasked = maskMedicare(p.medicareNumber);
  p.people = peopleLabel();

  const set = (id, text) => {
    const el = document.getElementById(id);
    if (el) el.textContent = text;
  };

  set("welcomeName", p.firstName);
  set("hccInitials", p.initials);
  set("walletMedNum", p.medicareMasked);
  set("walletPeople", p.people);
  set("medNum", p.medicareNumber);
  set("medValid", p.validTo);
  set("medUpdated", p.lastUpdated.startsWith("Last updated") ? p.lastUpdated : `Last updated ${p.lastUpdated}`);
  set("homeName", p.firstName);
  set("hccFullName", p.fullName);
  set("hccFullInitials", p.initials);
  set("profileName", p.fullName);

  const names = [p.member1, p.member2].filter((s) => String(s).trim());
  document.getElementById("medNames").innerHTML = names
    .map((n, i) => `<li>${n}</li>`)
    .join("");

  document.querySelectorAll(".inbox-n").forEach((el) => {
    el.textContent = p.inbox;
  });

  toggleCover("welcomeNameCover", p.firstName !== ORIGINALS.firstName);

  if (!skipEditorSync) fillEditor();
}

function toggleCover(id, on) {
  document.getElementById(id)?.classList.toggle("show", on);
}

function fillEditor() {
  const map = {
    "f-first": profile.firstName,
    "f-full": profile.fullName,
    "f-initials": profile.initials,
    "f-mednum": profile.medicareNumber,
    "f-m1": profile.member1,
    "f-m2": profile.member2,
    "f-valid": profile.validTo,
    "f-updated": profile.lastUpdated.replace(/^Last updated\s/i, ""),
    "f-pin": profile.pin,
    "f-inbox": profile.inbox,
  };
  Object.entries(map).forEach(([id, val]) => {
    document.querySelectorAll(`#${id}, #m-${id}`).forEach((el) => {
      if (el) el.value = val;
    });
  });
  const film = document.getElementById("f-film");
  const mfilm = document.getElementById("m-f-film");
  if (film) film.checked = document.body.classList.contains("film");
  if (mfilm) mfilm.checked = document.body.classList.contains("film");
}

function readEditor(prefix, quiet = false) {
  const g = (id) => document.getElementById(prefix + id)?.value ?? "";
  profile.firstName = g("f-first").trim() || ORIGINALS.firstName;
  profile.fullName = g("f-full").trim() || profile.firstName;
  profile.initials = g("f-initials").trim() || ORIGINALS.initials;
  profile.medicareNumber = g("f-mednum").trim() || ORIGINALS.medicareNumber;
  profile.member1 = g("f-m1").trim();
  profile.member2 = g("f-m2").trim();
  profile.validTo = g("f-valid").trim() || ORIGINALS.validTo;
  const upd = g("f-updated").trim();
  profile.lastUpdated = upd ? (upd.toLowerCase().startsWith("last updated") ? upd : `Last updated ${upd}`) : ORIGINALS.lastUpdated;
  profile.pin = g("f-pin").trim();
  profile.inbox = g("f-inbox").trim() || "15";
  const filmBox = document.getElementById(prefix + "f-film");
  document.body.classList.toggle("film", !!(filmBox && filmBox.checked));
  localStorage.setItem("mygov-prop-film", document.body.classList.contains("film") ? "1" : "0");
  saveProfile();
  applyProfile(true);
  renderInbox();
  if (!quiet) toast("Details updated");
}

function renderPin() {
  [...document.querySelectorAll("#pinDots i")].forEach((dot, i) => {
    dot.classList.toggle("on", i < pinValue.length);
  });
}

function pressKey(k) {
  if (k === "back") pinValue = pinValue.slice(0, -1);
  else if (pinValue.length < 6) pinValue += k;
  renderPin();
  if (pinValue.length === 6) {
    const need = String(profile.pin || "").replace(/\D/g, "");
    if (need && pinValue !== need) {
      document.getElementById("pinDots").classList.add("err");
      setTimeout(() => {
        document.getElementById("pinDots").classList.remove("err");
        pinValue = "";
        renderPin();
      }, 380);
      return;
    }
    setTimeout(() => showScreen("wallet"), 220);
  }
}

function drawQr() {
  const c = document.getElementById("qr");
  const ctx = c.getContext("2d");
  const n = 21;
  const s = c.width / n;
  ctx.fillStyle = "#fff";
  ctx.fillRect(0, 0, c.width, c.height);
  ctx.fillStyle = "#111";
  const seed = (profile.medicareNumber + profile.fullName).split("").reduce((a, ch) => a + ch.charCodeAt(0), 7);
  const rnd = (i) => ((seed * (i + 3) * 1103515245 + 12345) >>> 0) % 2;
  const finder = (x, y) => {
    for (let i = 0; i < 7; i++) for (let j = 0; j < 7; j++) {
      const edge = i === 0 || j === 0 || i === 6 || j === 6;
      const inner = i >= 2 && i <= 4 && j >= 2 && j <= 4;
      if (edge || inner) ctx.fillRect((x + i) * s, (y + j) * s, s, s);
    }
  };
  finder(0, 0); finder(14, 0); finder(0, 14);
  for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) {
    if (i < 8 && j < 8) continue;
    if (i > 12 && j < 8) continue;
    if (i < 8 && j > 12) continue;
    if (rnd(i * n + j)) ctx.fillRect(i * s, j * s, s, s);
  }
}

function renderInbox() {
  const count = Math.max(1, parseInt(profile.inbox, 10) || 15);
  const items = [];
  for (let i = 0; i < count; i++) items.push(MESSAGES[i % MESSAGES.length]);
  document.getElementById("inboxList").innerHTML = items
    .map(
      ([from, title, date], i) =>
        `<button class="inbox-item" data-msg-i="${i}"><span class="dot"></span><span><div class="ifrom">${from}</div><div class="ititle">${title}</div></span></button>`
    )
    .join("");
}

function handleGo(go, el) {
  const map = {
    pin: "pin",
    welcome: "welcome",
    signin: "signin",
    wallet: "wallet",
    services: "services",
    home: "home",
    inbox: "inbox",
    medicare: "medicare",
    hcc: "hcc",
    forms: "forms",
    scanner: null,
    info: null,
    forgot: null,
    verify: null,
    cardmenu: null,
    addcard: null,
    linksvc: null,
    profile: null,
  };
  if (go === "scanner") return openOverlay("ov-scanner");
  if (go === "info") return openOverlay("ov-info");
  if (go === "forgot") return openOverlay("ov-forgot");
  if (go === "verify") {
    drawQr();
    return openOverlay("ov-verify");
  }
  if (go === "cardmenu") return openOverlay("ov-cardmenu");
  if (go === "addcard") return openOverlay("ov-addcard");
  if (go === "linksvc") return openOverlay("ov-linksvc");
  if (go === "profile") return openOverlay("ov-profile");
  if (map[go]) showScreen(map[go]);
}

function onTap(e) {
  const btn = e.target.closest("[data-go], [data-back], [data-msg], [data-svc], [data-close], [data-k], [data-msg-i]");
  if (!btn) return;
  if (btn.hasAttribute("data-close")) return closeOverlays();
  if (btn.hasAttribute("data-back")) return back();
  if (btn.dataset.k) return pressKey(btn.dataset.k);
  if (btn.dataset.msg) return toast(btn.dataset.msg);
  if (btn.dataset.svc) {
    document.getElementById("svcTitle").textContent = btn.dataset.svc;
    return showScreen("svcpage");
  }
  if (btn.dataset.msgI) {
    const item = MESSAGES[Number(btn.dataset.msgI) % MESSAGES.length];
    document.getElementById("msgFrom").textContent = item[0];
    document.getElementById("msgTitle").textContent = item[1];
    document.getElementById("msgDate").textContent = item[2];
    document.getElementById("msgBody").textContent = item[3];
    return showScreen("message");
  }
  if (btn.dataset.go) handleGo(btn.dataset.go, btn);
}

function buildMobileEditor() {
  const src = document.getElementById("editor");
  const dest = document.getElementById("mobileEditor");
  dest.innerHTML = src.innerHTML.replace(/id="f-/g, 'id="m-f-').replace(/id="saveDetails"/, 'id="m-saveDetails"').replace(/id="resetDetails"/, 'id="m-resetDetails"');
  dest.querySelector("h2").textContent = "Prop details";
  dest.insertAdjacentHTML("beforeend", `<button class="black-btn light" data-close>Close</button>`);
}

document.addEventListener("click", onTap);
document.querySelectorAll(".overlay").forEach((ov) => {
  ov.addEventListener("click", (e) => {
    if (e.target === ov) closeOverlays();
  });
});

document.getElementById("saveDetails")?.addEventListener("click", () => readEditor(""));
document.getElementById("editor")?.addEventListener("input", () => readEditor("", true));
document.getElementById("resetDetails")?.addEventListener("click", () => {
  profile = { ...ORIGINALS };
  localStorage.removeItem(KEY);
  applyProfile();
  renderInbox();
  toast("Reset to screenshots");
});
document.getElementById("f-film")?.addEventListener("change", (e) => {
  document.body.classList.toggle("film", e.target.checked);
  localStorage.setItem("mygov-prop-film", e.target.checked ? "1" : "0");
});

document.getElementById("editFab").addEventListener("click", () => {
  fillEditor();
  openOverlay("ov-editor");
});

document.getElementById("signBtn").addEventListener("click", () => {
  const name = document.getElementById("userIn").value.trim();
  if (name && !name.includes("@")) {
    profile.firstName = name.split(/[.\s_]/)[0];
    profile.fullName = name;
    profile.member1 = profile.firstName;
    saveProfile();
    applyProfile();
  }
  showScreen("welcome");
  toast("Signed in");
});

document.getElementById("sendCode").addEventListener("click", () => {
  closeOverlays();
  toast("Code sent");
});
document.getElementById("signout").addEventListener("click", () => {
  closeOverlays();
  stack = ["welcome"];
  showScreen("welcome", false);
});

document.addEventListener("click", (e) => {
  if (e.target.id === "m-saveDetails") {
    readEditor("m-");
    closeOverlays();
  }
  if (e.target.id === "m-resetDetails") {
    profile = { ...ORIGINALS };
    localStorage.removeItem(KEY);
    applyProfile();
    renderInbox();
    toast("Reset to screenshots");
  }
});

let taps = [];
document.getElementById("app").addEventListener("click", (e) => {
  const r = e.currentTarget.getBoundingClientRect();
  if (e.clientY - r.top > r.height * 0.1) return;
  const now = Date.now();
  taps = taps.filter((t) => now - t < 600);
  taps.push(now);
  if (taps.length >= 3) {
    taps = [];
    document.body.classList.remove("film");
    if (window.matchMedia("(max-width: 820px)").matches) openOverlay("ov-editor");
  }
});

if (new URLSearchParams(location.search).has("debug")) document.body.classList.add("debug");
if (localStorage.getItem("mygov-prop-film") === "1") document.body.classList.add("film");

buildMobileEditor();
applyProfile();
renderInbox();

if ("serviceWorker" in navigator) {
  navigator.serviceWorker.register("sw.js").catch(() => {});
}
