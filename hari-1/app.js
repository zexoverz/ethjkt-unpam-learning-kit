// ==========================================================
// KAMEN RIDER GACHA - HARI 1
// Simulator gacha yang menarik Kamen Rider sejati!
//
// File ini dibangun bertahap:
//   1) Mesin rarity + pity (lokal)
//   2) Dataset hardcoded Kamen Rider
//   3) Render kartu Kamen Rider (gambar, era, stat, henshin)
// ==========================================================

// ---------- Konfigurasi rarity & pity ----------
const PITY_MAX = 10; // tarikan ke-10 dijamin Legend (SSR)

// Peluang tiap tier: SSR 3%, EPIC 10%, RARE 30%, sisanya COMMON.
const RATE_SSR = 0.03;
const RATE_EPIC = 0.10;
const RATE_RARE = 0.30;

const SHINY_RATE = 1 / 40; // peluang Henshin Form (versi spesial)

// ---------- Dataset Kamen Rider ----------
// Kolam Kamen Rider per tier dengan gambar
const RIDERS_DATA = {
  // SSR - Kamen Rider Legendaris
  ssr: [
    { id: 1, name: "Kamen Rider Black", era: "Showa", power: 95, speed: 88, defense: 92, image: "https://i.pinimg.com/564x/71/2a/e7/712ae71b31a1e9a3e0b8c4d5e6f7g8h9.jpg" },
    { id: 2, name: "Kamen Rider 1", era: "Showa", power: 90, speed: 85, defense: 90, image: "https://i.pinimg.com/564x/81/2b/f7/812bf71b41b9c5d6e7f8g9h0i1j2k3l4.jpg" },
    { id: 3, name: "Kamen Rider V3", era: "Showa", power: 92, speed: 87, defense: 91, image: "https://i.pinimg.com/564x/91/3c/g7/913cg71b51c0d6e7f8g9h0i1j2k3l4m5.jpg" },
    { id: 4, name: "Decade", era: "Heisei", power: 99, speed: 95, defense: 94, image: "https://i.pinimg.com/564x/a1/4d/h7/a14dh71b61d1e7f8g9h0i1j2k3l4m5n6.jpg" },
    { id: 5, name: "OOO", era: "Heisei", power: 94, speed: 92, defense: 89, image: "https://i.pinimg.com/564x/b1/5e/i7/b15ei71b71e2f8g9h0i1j2k3l4m5n6o7.jpg" },
  ],
  // EPIC - Kamen Rider Kuat
  epic: [
    { id: 6, name: "Kamen Rider 2", era: "Showa", power: 88, speed: 86, defense: 87, image: "https://i.pinimg.com/564x/c1/6f/j7/c16fj71b81f3g9h0i1j2k3l4m5n6o7p8.jpg" },
    { id: 7, name: "Kamen Rider Stronger", era: "Showa", power: 91, speed: 83, defense: 89, image: "https://i.pinimg.com/564x/d1/7g/k7/d17gk71b92g4h0i1j2k3l4m5n6o7p8q9.jpg" },
    { id: 8, name: "W", era: "Heisei", power: 90, speed: 91, defense: 88, image: "https://i.pinimg.com/564x/e1/8h/l7/e18hl71ba3h5i1j2k3l4m5n6o7p8q9r0.jpg" },
    { id: 9, name: "Fourze", era: "Heisei", power: 89, speed: 89, defense: 87, image: "https://i.pinimg.com/564x/f1/9i/m7/f19im71bb4i6j2k3l4m5n6o7p8q9r0s1.jpg" },
  ],
  // RARE - Kamen Rider Standar
  rare: [
    { id: 10, name: "Kamen Rider Agito", era: "Heisei", power: 85, speed: 87, defense: 84, image: "https://i.pinimg.com/564x/g1/0j/n7/g10jn71bc5j7k3l4m5n6o7p8q9r0s1t2.jpg" },
    { id: 11, name: "Kamen Rider Blade", era: "Heisei", power: 84, speed: 85, defense: 86, image: "https://i.pinimg.com/564x/h1/1k/o7/h11ko71bd6k8l4m5n6o7p8q9r0s1t2u3.jpg" },
    { id: 12, name: "Kamen Rider Hibiki", era: "Heisei", power: 86, speed: 82, defense: 88, image: "https://i.pinimg.com/564x/i1/2l/p7/i12lp71be7l9m5n6o7p8q9r0s1t2u3v4.jpg" },
    { id: 13, name: "Kamen Rider Kabuto", era: "Heisei", power: 88, speed: 90, defense: 85, image: "https://i.pinimg.com/564x/j1/3m/q7/j13mq71bf8m0n6o7p8q9r0s1t2u3v4w5.jpg" },
    { id: 14, name: "Kamen Rider Den-O", era: "Heisei", power: 83, speed: 88, defense: 82, image: "https://i.pinimg.com/564x/k1/4n/r7/k14nr71cg9n1o7p8q9r0s1t2u3v4w5x6.jpg" },
  ],
  // COMMON - Kamen Rider Lainnya
  common: [
    { id: 15, name: "Kamen Rider Kiva", era: "Heisei", power: 82, speed: 84, defense: 81, image: "https://i.pinimg.com/564x/l1/5o/s7/l15os71ch0o2p8q9r0s1t2u3v4w5x6y7.jpg" },
    { id: 16, name: "Kamen Rider Wizard", era: "Heisei", power: 81, speed: 86, defense: 80, image: "https://i.pinimg.com/564x/m1/6p/t7/m16pt71ci1p3q9r0s1t2u3v4w5x6y7z8.jpg" },
    { id: 17, name: "Kamen Rider Gaim", era: "Heisei", power: 80, speed: 85, defense: 79, image: "https://i.pinimg.com/564x/n1/7q/u7/n17qu71cj2q4r0s1t2u3v4w5x6y7z8a9.jpg" },
    { id: 18, name: "Kamen Rider Drive", era: "Heisei", power: 82, speed: 92, defense: 78, image: "https://i.pinimg.com/564x/o1/8r/v7/o18rv71ck3r5s1t2u3v4w5x6y7z8a9b0.jpg" },
    { id: 19, name: "Kamen Rider Ghost", era: "Heisei", power: 79, speed: 83, defense: 77, image: "https://i.pinimg.com/564x/p1/9s/w7/p19sw71cl4s6t2u3v4w5x6y7z8a9b0c1.jpg" },
    { id: 20, name: "Kamen Rider Ex-Aid", era: "Heisei", power: 78, speed: 89, defense: 76, image: "https://i.pinimg.com/564x/q1/0t/x7/q10tx71cm5t7u3v4w5x6y7z8a9b0c1d2.jpg" },
  ]
};

// Warna untuk era Kamen Rider
const ERA_COLORS = {
  "Showa": "#FF6B6B",
  "Heisei": "#4ECDC4",
  "Reiwa": "#95E1D3"
};

// Label stat Kamen Rider
const STAT_LABELS = {
  "power": "POWER",
  "speed": "SPEED",
  "defense": "DEFENSE"
};

// Ambil satu angka acak dalam [min, max].
function acakAntara(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

// Ambil satu elemen acak dari array.
function pilihAcak(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

// Pilih Kamen Rider sesuai tier hasil roll.
function pickRider(kelas) {
  return pilihAcak(RIDERS_DATA[kelas]);
}

// ---------- State permainan ----------
let pity = 0;      // tarikan sejak Legendary terakhir
let total = 0;     // total tarikan
let ssrCount = 0;  // total Legendary/Mythical didapat

// Koleksi Pokédex: id -> data Pokémon yang pernah didapat (+ jumlahnya).
let collection = {};

// ---------- Simpan / muat progres (localStorage) ----------
// Semua progres bertahan walau browser ditutup / halaman di-refresh.
const STORAGE_KEY = "kamren_rider_gacha_v1";

function saveState() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ total, pity, ssrCount, collection }));
  } catch (e) {
    // localStorage bisa penuh atau diblokir — abaikan, game tetap jalan.
  }
}

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return;
    const s = JSON.parse(raw);
    total = s.total || 0;
    pity = s.pity || 0;
    ssrCount = s.ssrCount || 0;
    collection = s.collection || {};
  } catch (e) {
    // Data rusak -> mulai dari nol saja.
    collection = {};
  }
}

// ---------- Catat satu Kamen Rider ke koleksi ----------
function recordCatch(result) {
  const existing = collection[result.id];
  if (existing) {
    existing.count += 1;
    if (result.henshin) existing.henshin = true;
  } else {
    collection[result.id] = {
      id: result.id,
      name: result.name,
      image: result.image,
      era: result.era,
      henshin: !!result.henshin,
      count: 1,
    };
  }
}

// ---------- Elemen DOM ----------
const el = {
  card: document.getElementById("card"),
  spinner: document.getElementById("spinner"),
  sprite: document.getElementById("sprite"),
  shinyBadge: document.getElementById("shinyBadge"),
  placeholder: document.getElementById("placeholder"),
  pokeName: document.getElementById("pokeName"),
  dexNum: document.getElementById("dexNum"),
  types: document.getElementById("types"),
  rarity: document.getElementById("rarity"),
  statsPanel: document.getElementById("statsPanel"),
  total: document.getElementById("total"),
  ssrCount: document.getElementById("ssrCount"),
  pityText: document.getElementById("pityText"),
  pityFill: document.getElementById("pityFill"),
  history: document.getElementById("history"),
  err: document.getElementById("err"),
  tarik1: document.getElementById("tarik1"),
  tarik10: document.getElementById("tarik10"),
  uniqueCount: document.getElementById("uniqueCount"),
  shinyCount: document.getElementById("shinyCount"),
  collectionGrid: document.getElementById("collectionGrid"),
  collectionEmpty: document.getElementById("collectionEmpty"),
  badgeGrid: document.getElementById("badgeGrid"),
  champion: document.getElementById("champion"),
  toast: document.getElementById("toast"),
};

// ---------- Mesin rarity ----------
// Menentukan tier Kamen Rider hasil roll
function decideRarity() {
  const acak = Math.random();
  // "+1" karena tarikan ini belum masuk hitungan pity.
  if (pity + 1 >= PITY_MAX || acak < RATE_SSR) return "ssr";
  if (acak < RATE_EPIC) return "epic";
  if (acak < RATE_RARE) return "rare";
  return "common";
}

// Baru dicatat setelah tarikan benar-benar berhasil.
function commitCounters(kelas) {
  total += 1;
  pity += 1;
  if (kelas === "ssr") { pity = 0; ssrCount += 1; }
}

// ---------- Update panel statistik & pity bar ----------
function updateStats() {
  el.total.textContent = total;
  el.ssrCount.textContent = ssrCount;
  el.pityText.textContent = pity + " / " + PITY_MAX;
  el.pityFill.style.width = (pity / PITY_MAX) * 100 + "%";
}

// ---------- Status loading & error ----------
function setLoading(on) {
  el.spinner.style.display = on ? "block" : "none";
  if (on) {
    el.placeholder.style.display = "none";
    el.sprite.style.display = "none";
  }
  el.tarik1.disabled = on;
  el.tarik10.disabled = on;
}

function showError(msg) {
  el.err.textContent = msg;
}

// Bangun badge era (Showa/Heisei/Reiwa) dengan warna resminya.
function buildEra(era) {
  el.types.innerHTML = "";
  const badge = document.createElement("span");
  badge.className = "type-badge";
  badge.textContent = era;
  badge.style.background = ERA_COLORS[era] || "#666";
  el.types.appendChild(badge);
}

// Bangun 3 baris bar stat Kamen Rider (Power, Speed, Defense).
function buildStats(stats) {
  el.statsPanel.innerHTML = "";
  const statOrder = ["power", "speed", "defense"];
  statOrder.forEach(key => {
    const value = stats[key];
    if (value === undefined) return;
    const row = document.createElement("div");
    row.className = "stat-row";
    const persen = Math.min(100, (value / 100) * 100);
    row.innerHTML =
      '<span class="s-lbl">' + (STAT_LABELS[key] || key) + "</span>" +
      '<span class="s-val">' + value + "</span>" +
      '<span class="stat-bar"><span style="width:' + persen + '%"></span></span>';
    el.statsPanel.appendChild(row);
  });
}

// Gambar mana yang dipakai: henshin kalau lagi hoki, kalau tidak yang biasa.
function imageOf(result) {
  return result.image;
}

// ---------- Render kartu Kamen Rider ----------
function render(result) {
  el.placeholder.style.display = "none";
  el.sprite.style.display = "block";
  el.sprite.onerror = () => {
    el.sprite.onerror = null;
    el.sprite.src = "https://via.placeholder.com/300?text=Henshin";
  };
  el.sprite.src = imageOf(result);
  el.sprite.alt = result.name;
  el.shinyBadge.style.display = result.henshin ? "block" : "none";

  el.pokeName.textContent = result.name;
  el.dexNum.textContent = "#" + String(result.id).padStart(2, "0");

  buildEra(result.era);
  buildStats({ power: result.power, speed: result.speed, defense: result.defense });

  el.rarity.textContent = result.kelas + (result.henshin ? " ⚡ Henshin" : "");
  el.rarity.className = "rar " + result.kelas;

  // Trik reset animasi: hapus kelas, paksa reflow, pasang lagi.
  el.card.className = "card";
  void el.card.offsetWidth;
  el.card.className = "card " + result.kelas + " reveal" + (result.henshin ? " shiny" : "");
}

function addHistory(result) {
  const chip = document.createElement("div");
  chip.className = "chip " + result.kelas + (result.henshin ? " shiny" : "");
  const img = document.createElement("img");
  img.onerror = () => { img.onerror = null; img.src = "https://via.placeholder.com/100?text=Rider"; };
  img.src = imageOf(result);
  img.alt = result.name;
  chip.appendChild(img);
  chip.title = result.name + " (" + result.kelas + (result.henshin ? ", henshin" : "") + ")";
  el.history.prepend(chip);
  while (el.history.children.length > 12) {
    el.history.removeChild(el.history.lastChild);
  }
}

// ---------- Satu tarikan (lokal: ambil dari dataset) ----------
async function pull() {
  const kelas = decideRarity();
  const rider = pickRider(kelas);
  try {
    const henshin = Math.random() < SHINY_RATE;
    const result = { ...rider, kelas, henshin };
    commitCounters(kelas); // hanya dihitung kalau berhasil
    recordCatch(result);   // masukkan ke koleksi
    updateStats();
    render(result);
    addHistory(result);
    checkNewBadges();      // rayakan kalau ada badge baru
    saveState();           // simpan progres ke localStorage
    return result;
  } catch (e) {
    showError(e.message);
    return null;
  }
}

// ---------- Tombol ----------
el.tarik1.addEventListener("click", async () => {
  showError("");
  setLoading(true);
  await pull();
  setLoading(false);
});

el.tarik10.addEventListener("click", async () => {
  showError("");
  setLoading(true);
  for (let i = 0; i < 10; i++) {
    await pull(); // berurutan biar animasi enak dilihat
  }
  setLoading(false);
});

// ---------- Render koleksi (Rider Dex) ----------
function renderCollection() {
  // Urutkan berdasarkan nomor
  const daftar = Object.values(collection).sort((a, b) => a.id - b.id);
  const hensinTotal = daftar.filter(m => m.henshin).length;

  el.uniqueCount.textContent = daftar.length;
  el.shinyCount.textContent = hensinTotal;
  el.collectionEmpty.hidden = daftar.length > 0;

  el.collectionGrid.innerHTML = "";
  daftar.forEach(m => {
    const cell = document.createElement("div");
    cell.className = "dex-cell" + (m.henshin ? " shiny" : "");

    const img = document.createElement("img");
    img.onerror = () => { img.onerror = null; img.src = "https://via.placeholder.com/100?text=Rider"; };
    img.src = m.image;
    img.alt = m.name;

    cell.innerHTML =
      (m.henshin ? '<span class="shiny-star">⚡</span>' : "") +
      (m.count > 1 ? '<span class="dex-count">×' + m.count + "</span>" : "") +
      '<div class="dex-no">#' + String(m.id).padStart(2, "0") + "</div>";
    cell.insertBefore(img, cell.firstChild);
    const name = document.createElement("div");
    name.className = "dex-name";
    name.textContent = m.name;
    cell.appendChild(name);

    el.collectionGrid.appendChild(cell);
  });
}

// ---------- Badge Era Kamen Rider ----------
// Tiap badge "dikuasai" dengan mengumpulkan BADGE_GOAL jenis Kamen Rider dari era tertentu.
const BADGE_GOAL = 3;
const BADGES = [
  { id: "showa", name: "Showa", era: "Era Showa", icon: "🌅", color: "#FF6B6B" },
  { id: "heisei", name: "Heisei", era: "Era Heisei", icon: "🌄", color: "#4ECDC4" },
  { id: "reiwa", name: "Reiwa", era: "Era Reiwa", icon: "🌅", color: "#95E1D3" },
];

// Berapa jenis unik dari sebuah era yang sudah dikoleksi.
function countEra(era) {
  return Object.values(collection).filter(m => m.era === era).length;
}

// Kumpulan id badge yang sudah diraih saat ini.
function earnedBadgeIds() {
  return new Set(BADGES.filter(b => countEra(b.era) >= BADGE_GOAL).map(b => b.id));
}

// Ubah warna hex jadi rgba (untuk efek glow badge).
function hexToRgba(hex, alpha) {
  const n = parseInt(hex.slice(1), 16);
  return "rgba(" + ((n >> 16) & 255) + "," + ((n >> 8) & 255) + "," + (n & 255) + "," + alpha + ")";
}

function renderBadges() {
  const earned = earnedBadgeIds();
  el.champion.hidden = earned.size < BADGES.length;

  el.badgeGrid.innerHTML = "";
  BADGES.forEach(b => {
    const punya = Math.min(countEra(b.era), BADGE_GOAL);
    const isEarned = earned.has(b.id);
    const persen = (punya / BADGE_GOAL) * 100;

    const cell = document.createElement("div");
    cell.className = "badge-cell" + (isEarned ? " earned" : "");
    cell.style.setProperty("--gym", b.color);
    cell.style.setProperty("--gym-glow", hexToRgba(b.color, 0.45));
    cell.style.setProperty("--gym-soft", hexToRgba(b.color, 0.12));
    cell.innerHTML =
      (isEarned ? '<span class="badge-check">✔</span>' : "") +
      '<div class="badge-icon">' + b.icon + "</div>" +
      '<div class="badge-name">' + b.name + " Badge</div>" +
      '<div class="badge-gym">' + b.era + "</div>" +
      '<div class="badge-prog-track"><div class="badge-prog-fill" style="width:' + persen + '%"></div></div>' +
      '<div class="badge-prog-txt">' + punya + " / " + BADGE_GOAL + "</div>";
    el.badgeGrid.appendChild(cell);
  });
}

// Badge yang sudah diraih & sudah ditampilkan (biar toast tidak muncul ulang).
let shownBadges = new Set();

// Munculkan notifikasi kecil selama beberapa detik.
let toastTimer = null;
function showToast(msg) {
  el.toast.textContent = msg;
  el.toast.hidden = false;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { el.toast.hidden = true; }, 3500);
}

// Cek apakah ada badge baru setelah sebuah tarikan; kalau ada, rayakan.
function checkNewBadges() {
  const earned = earnedBadgeIds();
  earned.forEach(id => {
    if (!shownBadges.has(id)) {
      const b = BADGES.find(x => x.id === id);
      showToast(b.icon + " Badge " + b.name + " diraih! Kuasai " + b.era + "!");
    }
  });
  shownBadges = earned;
}

// ---------- Navigasi tab ----------
function switchTab(name) {
  document.querySelectorAll(".tab").forEach(t => {
    t.classList.toggle("active", t.dataset.tab === name);
  });
  document.querySelectorAll(".tab-panel").forEach(p => {
    p.hidden = p.id !== "panel-" + name;
  });
  if (name === "koleksi") renderCollection(); // selalu tampilkan data terbaru
  if (name === "badge") renderBadges();
}

document.querySelectorAll(".tab").forEach(t => {
  t.addEventListener("click", () => switchTab(t.dataset.tab));
});

// ---------- Mulai: pulihkan progres yang tersimpan ----------
loadState();
updateStats();
shownBadges = earnedBadgeIds(); // badge yang sudah diraih dari sesi lama, jangan toast ulang
