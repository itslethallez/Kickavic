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
  cardholder: "",
  cardNumber: "5523 5000 0000 0000",
  validFrom: "00/00",
  cardValidTo: "00/00",
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

function formatPan(num) {
  const d = String(num).replace(/\D/g, "").slice(0, 16);
  const groups = d.match(/.{1,4}/g);
  return groups ? groups.join(" ") : ORIGINALS.cardNumber;
}

function formatDateMMYY(val, fallback) {
  const raw = String(val || "").trim();
  if (/^\d{1,2}\s*\/\s*\d{2}$/.test(raw)) {
    const [mm, yy] = raw.split("/").map((s) => s.trim());
    return `${mm.padStart(2, "0")}/${yy}`;
  }
  const d = raw.replace(/\D/g, "").slice(0, 4);
  if (d.length === 4) return `${d.slice(0, 2)}/${d.slice(2)}`;
  if (d.length === 0) return fallback;
  return raw || fallback;
}

function cardholderName() {
  const custom = String(profile.cardholder || "").trim();
  return (custom || profile.fullName || ORIGINALS.fullName).toUpperCase();
}

function diamondCardMarkup() {
  return `
    <div class="da-face">
      <div class="da-inner">
        <div class="da-top">
          <svg class="da-logo" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 1.1L22.9 12 12 22.9 1.1 12Z" fill="#FFCC00"/></svg>
          <span class="da-product">Diamond Awards</span>
        </div>
        <div class="da-mid">
          <div class="da-chip" aria-hidden="true"></div>
          <div class="da-mid-center">
            <span class="da-world">world</span>
            <svg class="da-pay" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="#fff" stroke-width="1.7" stroke-linecap="round">
              <path d="M7.2 8.2c2 2.1 2 5.5 0 7.6"/>
              <path d="M10.4 6c3.2 3.2 3.2 8.8 0 12"/>
              <path d="M13.6 3.8c4.4 4.2 4.4 12.2 0 16.4"/>
              <path d="M16.8 1.8c5.5 5.2 5.5 15.2 0 20.4"/>
            </svg>
          </div>
        </div>
        <div class="da-number"></div>
        <div class="da-dates">
          <div class="da-dates-kicker">VALID DATES</div>
          <div class="da-dates-sub">MONTH / YEAR - MONTH / YEAR</div>
          <div class="da-dates-val"><span class="da-from"></span> <span class="da-to"></span></div>
        </div>
        <div class="da-bot">
          <div class="da-name"></div>
          <div class="da-mc">
            <svg class="da-mc-mark" viewBox="0 0 41 25" aria-hidden="true">
              <circle cx="15.2" cy="12.5" r="12.5" fill="#EB001B"/>
              <circle cx="25.8" cy="12.5" r="12.5" fill="#F79E1B"/>
            </svg>
            <div class="da-mc-word">mastercard</div>
          </div>
        </div>
      </div>
    </div>
  `;
}

function mountDiamondCards() {
  document.querySelectorAll("[data-da-card]").forEach((el) => {
    el.innerHTML = diamondCardMarkup();
  });
}

function paintDiamondCards() {
  const number = formatPan(profile.cardNumber);
  const name = cardholderName();
  const from = formatDateMMYY(profile.validFrom, ORIGINALS.validFrom);
  const to = formatDateMMYY(profile.cardValidTo, ORIGINALS.cardValidTo);
  document.querySelectorAll(".da-number").forEach((el) => { el.textContent = number; });
  document.querySelectorAll(".da-name").forEach((el) => { el.textContent = name; });
  document.querySelectorAll(".da-from").forEach((el) => { el.textContent = from; });
  document.querySelectorAll(".da-to").forEach((el) => { el.textContent = to; });
}

const DA_RATIO = 85.6 / 53.98;
const DA_EXPORT_W = 3000;

function slugFile(s) {
  return String(s || "card")
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, "-")
    .replace(/^-|-$/g, "") || "card";
}

function downloadCanvas(canvas, filename) {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (!blob) {
        toast("Could not export PNG");
        reject(new Error("toBlob failed"));
        return;
      }
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 4000);
      toast("Saved " + filename);
      resolve(blob);
    }, "image/png");
  });
}

function fillSpaced(ctx, text, x, y, tracking, wordExtra, align) {
  const chars = [...String(text)];
  const widths = chars.map((ch) => ctx.measureText(ch).width + tracking + (ch === " " ? wordExtra : 0));
  const total = widths.reduce((a, b) => a + b, 0);
  let cx = x;
  if (align === "center") cx = x - total / 2;
  if (align === "right") cx = x - total;
  chars.forEach((ch, i) => {
    ctx.fillText(ch, cx, y);
    cx += widths[i];
  });
}

function drawDiamondCard(ctx, w, h) {
  const r = w * (3.18 / 85.6);
  const u = w / 100;
  ctx.save();
  ctx.beginPath();
  ctx.roundRect(0, 0, w, h, r);
  ctx.clip();

  const bg = ctx.createLinearGradient(0, 0, w * 0.92, h);
  bg.addColorStop(0, "#2b2b2b");
  bg.addColorStop(0.46, "#171717");
  bg.addColorStop(1, "#0b0b0b");
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, w, h);

  const sheen = ctx.createRadialGradient(w * 0.48, h * 0.36, 0, w * 0.48, h * 0.36, w * 0.72);
  sheen.addColorStop(0, "rgba(255,255,255,0.09)");
  sheen.addColorStop(0.56, "rgba(255,255,255,0)");
  ctx.fillStyle = sheen;
  ctx.fillRect(0, 0, w, h);

  ctx.save();
  ctx.translate(w / 2, h / 2);
  ctx.rotate((-40 * Math.PI) / 180);
  const span = Math.hypot(w, h) * 1.4;
  const step = h * 0.025;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  for (let i = -52; i < 72; i++) {
    const baseY = i * step;
    const amp = h * 0.011;
    const freq = w * 0.042;
    ctx.beginPath();
    for (let x = -span; x <= span; x += 5) {
      const yy = baseY + Math.sin(x / freq) * amp;
      if (x === -span) ctx.moveTo(x, yy);
      else ctx.lineTo(x, yy);
    }
    ctx.strokeStyle = "rgba(255,255,255,0.11)";
    ctx.lineWidth = h * 0.011;
    ctx.stroke();
    ctx.beginPath();
    for (let x = -span; x <= span; x += 5) {
      const yy = baseY + h * 0.009 + Math.sin(x / freq) * amp;
      if (x === -span) ctx.moveTo(x, yy);
      else ctx.lineTo(x, yy);
    }
    ctx.strokeStyle = "rgba(0,0,0,0.36)";
    ctx.lineWidth = h * 0.011;
    ctx.stroke();
  }
  ctx.restore();

  const vig = ctx.createRadialGradient(w * 0.5, h * 0.4, w * 0.12, w * 0.5, h * 0.42, w * 0.78);
  vig.addColorStop(0, "rgba(0,0,0,0)");
  vig.addColorStop(1, "rgba(0,0,0,0.38)");
  ctx.fillStyle = vig;
  ctx.fillRect(0, 0, w, h);

  ctx.strokeStyle = "rgba(255,255,255,0.14)";
  ctx.lineWidth = Math.max(2, w * 0.0012);
  ctx.beginPath();
  ctx.roundRect(1.5, 1.5, w - 3, h - 3, Math.max(0, r - 1));
  ctx.stroke();

  const padX = 4.8 * u;
  const padTop = 4.6 * u;
  ctx.fillStyle = "#FFCC00";
  ctx.shadowColor = "rgba(0,0,0,0.35)";
  ctx.shadowBlur = 2 * u;
  ctx.beginPath();
  ctx.moveTo(padX + 3.55 * u, padTop);
  ctx.lineTo(padX + 7.1 * u, padTop + 3.55 * u);
  ctx.lineTo(padX + 3.55 * u, padTop + 7.1 * u);
  ctx.lineTo(padX, padTop + 3.55 * u);
  ctx.closePath();
  ctx.fill();
  ctx.shadowBlur = 0;

  ctx.fillStyle = "#fff";
  ctx.textBaseline = "top";
  ctx.font = `500 ${4.05 * u}px Roboto, "Noto Sans", Arial, sans-serif`;
  ctx.textAlign = "right";
  ctx.fillText("Diamond Awards", w - padX, padTop + 0.35 * u);

  const chipW = 13.1 * u;
  const chipH = 10.1 * u;
  const chipX = padX;
  const chipY = padTop + 7.1 * u + 5.6 * u;
  const chipGrad = ctx.createLinearGradient(chipX, chipY, chipX + chipW, chipY + chipH);
  chipGrad.addColorStop(0, "#f4e6c0");
  chipGrad.addColorStop(0.42, "#c9a45c");
  chipGrad.addColorStop(0.7, "#ead39c");
  chipGrad.addColorStop(1, "#a7843c");
  ctx.fillStyle = chipGrad;
  ctx.beginPath();
  ctx.roundRect(chipX, chipY, chipW, chipH, 1.2 * u);
  ctx.fill();
  ctx.strokeStyle = "rgba(80,55,18,0.4)";
  ctx.lineWidth = 0.2 * u;
  ctx.beginPath();
  ctx.roundRect(chipX + chipW * 0.09, chipY + chipH * 0.18, chipW * 0.82, chipH * 0.64, 0.35 * u);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(chipX + chipW * 0.09, chipY + chipH * 0.5);
  ctx.lineTo(chipX + chipW * 0.91, chipY + chipH * 0.5);
  ctx.moveTo(chipX + chipW * 0.36, chipY + chipH * 0.18);
  ctx.lineTo(chipX + chipW * 0.36, chipY + chipH * 0.82);
  ctx.moveTo(chipX + chipW * 0.64, chipY + chipH * 0.18);
  ctx.lineTo(chipX + chipW * 0.64, chipY + chipH * 0.82);
  ctx.stroke();

  ctx.fillStyle = "#fff";
  ctx.textAlign = "left";
  ctx.textBaseline = "middle";
  ctx.font = `400 ${5.2 * u}px Roboto, "Noto Sans", Arial, sans-serif`;
  const worldX = w * 0.47;
  const worldY = chipY + chipH * 0.48;
  ctx.fillText("world", worldX, worldY);

  const payS = 6.3 * u;
  const payX = worldX + ctx.measureText("world").width + 2.6 * u + payS * 0.45;
  const payY = worldY;
  ctx.strokeStyle = "#fff";
  ctx.lineWidth = payS * 0.07;
  ctx.lineCap = "round";
  for (let i = 0; i < 4; i++) {
    const rad = payS * (0.16 + i * 0.17);
    ctx.beginPath();
    ctx.arc(payX, payY, rad, -Math.PI * 0.38, Math.PI * 0.38);
    ctx.stroke();
  }

  const number = formatPan(profile.cardNumber);
  const from = formatDateMMYY(profile.validFrom, ORIGINALS.validFrom);
  const to = formatDateMMYY(profile.cardValidTo, ORIGINALS.cardValidTo);
  const name = cardholderName();

  ctx.fillStyle = "#fff";
  ctx.textAlign = "left";
  ctx.textBaseline = "alphabetic";
  ctx.font = `500 ${5.05 * u}px "Courier New", Courier, monospace`;
  ctx.shadowColor = "rgba(0,0,0,0.45)";
  ctx.shadowBlur = 0;
  fillSpaced(ctx, number, w / 2, h * 0.62, 0.04 * 5.05 * u, 0.42 * 5.05 * u, "center");

  ctx.shadowBlur = 0;
  ctx.font = `700 ${1.85 * u}px Roboto, "Noto Sans", Arial, sans-serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "top";
  ctx.fillText("VALID DATES", w / 2, h * 0.655);
  ctx.globalAlpha = 0.82;
  ctx.font = `500 ${1.42 * u}px Roboto, "Noto Sans", Arial, sans-serif`;
  ctx.fillText("MONTH / YEAR - MONTH / YEAR", w / 2, h * 0.655 + 2.35 * u);
  ctx.globalAlpha = 1;
  ctx.font = `500 ${3.2 * u}px "Courier New", Courier, monospace`;
  ctx.textAlign = "left";
  ctx.textBaseline = "alphabetic";
  fillSpaced(ctx, `${from} ${to}`, w / 2, h * 0.655 + 6.4 * u, 0.08 * 3.2 * u, 0.55 * 3.2 * u, "center");

  ctx.font = `500 ${3.15 * u}px "Courier New", Courier, monospace`;
  ctx.textAlign = "left";
  ctx.textBaseline = "alphabetic";
  ctx.fillText(name, padX, h - 3.6 * u - 1.2 * u);

  const mcW = 10.6 * u;
  const mcH = 6.5 * u;
  const mcX = w - padX - mcW;
  const mcY = h - 3.6 * u - mcH - 2.4 * u;
  ctx.fillStyle = "#EB001B";
  ctx.beginPath();
  ctx.arc(mcX + mcH / 2, mcY + mcH / 2, mcH / 2, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#F79E1B";
  ctx.beginPath();
  ctx.arc(mcX + mcW - mcH / 2, mcY + mcH / 2, mcH / 2, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#fff";
  ctx.font = `400 ${2.05 * u}px Roboto, "Noto Sans", Arial, sans-serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "top";
  ctx.fillText("mastercard", mcX + mcW / 2, mcY + mcH + 0.35 * u);

  ctx.restore();
}

function drawMedicareCard(ctx, w, h) {
  const r = w * 0.035;
  ctx.save();
  ctx.beginPath();
  ctx.roundRect(0, 0, w, h, r);
  ctx.clip();

  const headH = h * 0.22;
  ctx.fillStyle = "#8fd196";
  ctx.fillRect(0, 0, w, headH);
  ctx.strokeStyle = "#77b87f";
  ctx.lineWidth = w * 0.006;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  for (let y = -20; y < headH + 40; y += h * 0.055) {
    for (let x = -20; x < w + 40; x += w * 0.07) {
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x + w * 0.018, y + h * 0.022);
      ctx.lineTo(x, y + h * 0.044);
      ctx.stroke();
    }
  }
  ctx.fillStyle = "#111";
  ctx.font = `700 ${w * 0.055}px Roboto, "Noto Sans", Arial, sans-serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("Medicare card", w / 2, headH / 2);

  ctx.fillStyle = "#fff";
  ctx.fillRect(0, headH, w, h - headH);

  ctx.save();
  ctx.globalAlpha = 0.18;
  ctx.fillStyle = "#8bb8e8";
  ctx.font = `800 ${w * 0.16}px Roboto, "Noto Sans", Arial, sans-serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("myGov", w / 2, headH + (h - headH) * 0.52);
  ctx.restore();

  const pad = w * 0.055;
  let y = headH + pad;
  ctx.textAlign = "left";
  ctx.textBaseline = "top";
  ctx.fillStyle = "#6b7178";
  ctx.font = `400 ${w * 0.032}px Roboto, "Noto Sans", Arial, sans-serif`;
  ctx.fillText("Card number", pad, y);
  y += w * 0.042;
  ctx.fillStyle = "#111";
  ctx.font = `700 ${w * 0.058}px Roboto, "Noto Sans", Arial, sans-serif`;
  ctx.fillText(profile.medicareNumber, pad, y);
  y += w * 0.1;

  const names = [profile.member1, profile.member2].filter((s) => String(s).trim());
  names.forEach((n, i) => {
    ctx.fillStyle = "#111";
    ctx.font = `400 ${w * 0.042}px Roboto, "Noto Sans", Arial, sans-serif`;
    ctx.fillText(`${i + 1}.  ${n}`, pad + w * 0.02, y);
    y += w * 0.07;
  });
  y += w * 0.02;
  ctx.fillStyle = "#6b7178";
  ctx.font = `400 ${w * 0.032}px Roboto, "Noto Sans", Arial, sans-serif`;
  ctx.fillText("Valid to", pad, y);
  y += w * 0.042;
  ctx.fillStyle = "#111";
  ctx.font = `600 ${w * 0.042}px Roboto, "Noto Sans", Arial, sans-serif`;
  ctx.fillText(profile.validTo, pad, y);
  ctx.restore();
}

function drawHccCard(ctx, w, h) {
  const r = w * 0.03;
  ctx.save();
  ctx.beginPath();
  ctx.roundRect(0, 0, w, h, r);
  ctx.clip();
  const headH = h * 0.22;
  ctx.fillStyle = "#1c7a40";
  ctx.fillRect(0, 0, w, headH);
  ctx.fillStyle = "#fff";
  ctx.font = `600 ${w * 0.05}px Roboto, "Noto Sans", Arial, sans-serif`;
  ctx.textAlign = "left";
  ctx.textBaseline = "middle";
  ctx.fillText("Health Care Card", w * 0.05, headH / 2);

  ctx.fillStyle = "#fcfddf";
  ctx.fillRect(0, headH, w, h - headH);
  const pad = w * 0.055;
  let y = headH + pad;
  ctx.fillStyle = "#6b7178";
  ctx.font = `400 ${w * 0.032}px Roboto, "Noto Sans", Arial, sans-serif`;
  ctx.textAlign = "left";
  ctx.textBaseline = "top";
  ctx.fillText("Name", pad, y);
  y += w * 0.045;
  ctx.fillStyle = "#111";
  ctx.font = `700 ${w * 0.055}px Roboto, "Noto Sans", Arial, sans-serif`;
  ctx.fillText(profile.fullName, pad, y);
  y += w * 0.11;
  ctx.fillStyle = "#6b7178";
  ctx.font = `400 ${w * 0.032}px Roboto, "Noto Sans", Arial, sans-serif`;
  ctx.fillText("Initials", pad, y);
  y += w * 0.045;
  ctx.fillStyle = "#111";
  ctx.font = `700 ${w * 0.055}px Roboto, "Noto Sans", Arial, sans-serif`;
  ctx.fillText(profile.initials, pad, y);
  ctx.restore();
}

function exportCardPng(kind) {
  let canvas;
  let filename;
  if (kind === "medicare") {
    canvas = document.createElement("canvas");
    canvas.width = 2000;
    canvas.height = 1260;
    drawMedicareCard(canvas.getContext("2d"), canvas.width, canvas.height);
    filename = `medicare-${slugFile(profile.member1 || profile.fullName)}.png`;
  } else if (kind === "hcc") {
    canvas = document.createElement("canvas");
    canvas.width = 2000;
    canvas.height = 1260;
    drawHccCard(canvas.getContext("2d"), canvas.width, canvas.height);
    filename = `health-care-card-${slugFile(profile.initials)}.png`;
  } else {
    canvas = document.createElement("canvas");
    canvas.width = DA_EXPORT_W;
    canvas.height = Math.round(DA_EXPORT_W / DA_RATIO);
    const ctx = canvas.getContext("2d");
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";
    drawDiamondCard(ctx, canvas.width, canvas.height);
    filename = `diamond-awards-${slugFile(cardholderName())}.png`;
  }
  return downloadCanvas(canvas, filename);
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
  paintDiamondCards();

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
    "f-cardname": profile.cardholder,
    "f-cardnum": profile.cardNumber,
    "f-from": profile.validFrom,
    "f-to": profile.cardValidTo,
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
  profile.cardholder = g("f-cardname").trim();
  profile.cardNumber = formatPan(g("f-cardnum").trim() || ORIGINALS.cardNumber);
  profile.validFrom = formatDateMMYY(g("f-from").trim(), ORIGINALS.validFrom);
  profile.cardValidTo = formatDateMMYY(g("f-to").trim(), ORIGINALS.cardValidTo);
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
    diamond: "diamond",
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
  dest.innerHTML = src.innerHTML
    .replace(/id="f-/g, 'id="m-f-')
    .replace(/id="saveDetails"/, 'id="m-saveDetails"')
    .replace(/id="exportPng"/, 'id="m-exportPng"')
    .replace(/id="resetDetails"/, 'id="m-resetDetails"');
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
document.getElementById("editor")?.addEventListener("input", (e) => {
  if (e.target && e.target.id === "f-exportcard") return;
  readEditor("", true);
});
document.getElementById("exportPng")?.addEventListener("click", () => {
  exportCardPng(document.getElementById("f-exportcard")?.value || "diamond");
});
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
  const exp = e.target.closest("[data-export]");
  if (exp) {
    exportCardPng(exp.dataset.export);
    return;
  }
  if (e.target.id === "exportMenuPng") {
    closeOverlays();
    const kind = stack[stack.length - 1];
    if (kind === "diamond" || kind === "medicare" || kind === "hcc") exportCardPng(kind);
    else toast("Open a card to export");
    return;
  }
  if (e.target.id === "m-exportPng") {
    exportCardPng(document.getElementById("m-f-exportcard")?.value || "diamond");
    return;
  }
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
mountDiamondCards();
applyProfile();
renderInbox();

if ("serviceWorker" in navigator) {
  navigator.serviceWorker.register("sw.js").catch(() => {});
}
