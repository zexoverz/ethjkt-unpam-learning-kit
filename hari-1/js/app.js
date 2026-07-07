const API_URL = "https://db.ygoprodeck.com/api/v7/cardinfo.php?format=tcg&misc=yes";
const pools = { ssr: [], epic: [], rare: [], common: [] };
const collectionIds = new Set();
const collectionCards = [];
const unlockedBadges = new Set();
const allHistory = [];
const PITY_LIMIT = 1000;
const HISTORY_PREVIEW_LIMIT = 4;
const SSR_RATE = 0.0085;
const EPIC_RATE = 0.03;
const RARE_RATE = 0.20;
const badges = [
  { id: "first", name: "First Pull", rule: "Dapatkan 1 kartu.", test: function () { return collectionCards.length >= 1; } },
  { id: "five", name: "Binder Start", rule: "Koleksi 5 kartu unik.", test: function () { return collectionCards.length >= 5; } },
  { id: "ten", name: "Deck Builder", rule: "Koleksi 10 kartu unik.", test: function () { return collectionCards.length >= 10; } },
  { id: "twenty_five", name: "Local Collector", rule: "Koleksi 25 kartu unik.", test: function () { return collectionCards.length >= 25; } },
  { id: "fifty", name: "Binder Page 50", rule: "Koleksi 50 kartu unik.", test: function () { return collectionCards.length >= 50; } },
  { id: "hundred", name: "Century Binder", rule: "Koleksi 100 kartu unik.", test: function () { return collectionCards.length >= 100; } },
  { id: "two_fifty", name: "Archive Keeper", rule: "Koleksi 250 kartu unik.", test: function () { return collectionCards.length >= 250; } },
  { id: "five_hundred", name: "Museum Shelf", rule: "Koleksi 500 kartu unik.", test: function () { return collectionCards.length >= 500; } },
  { id: "ssr", name: "Shiny Hunter", rule: "Dapatkan minimal 1 SSR.", test: function () { return ssrCount >= 1; } },
  { id: "three_ssr", name: "Triple Shine", rule: "Dapatkan 3 SSR.", test: function () { return ssrCount >= 3; } },
  { id: "ten_ssr", name: "Golden Binder", rule: "Dapatkan 10 SSR.", test: function () { return ssrCount >= 10; } },
  { id: "epic_five", name: "Epic Stack", rule: "Koleksi 5 kartu Epic unik.", test: function () { return hitungRarity("epic") >= 5; } },
  { id: "rare_ten", name: "Rare Row", rule: "Koleksi 10 kartu Rare unik.", test: function () { return hitungRarity("rare") >= 10; } },
  { id: "monster", name: "Monster Slot", rule: "Koleksi 1 kartu Monster.", test: function () { return punyaTipe("Monster"); } },
  { id: "spell", name: "Spell Slot", rule: "Koleksi 1 kartu Spell.", test: function () { return punyaTipe("Spell Card"); } },
  { id: "trap", name: "Trap Slot", rule: "Koleksi 1 kartu Trap.", test: function () { return punyaTipe("Trap Card"); } },
  { id: "all_slots", name: "Main Deck Basics", rule: "Punya Monster, Spell, dan Trap.", test: function () { return punyaTipe("Monster") && punyaTipe("Spell Card") && punyaTipe("Trap Card"); } },
  { id: "dragon", name: "Dragon Caller", rule: "Koleksi 1 Dragon.", test: function () { return punyaRace("Dragon"); } },
  { id: "spellcaster", name: "Spellcaster Desk", rule: "Koleksi 1 Spellcaster.", test: function () { return punyaRace("Spellcaster"); } },
  { id: "warrior", name: "Warrior Line", rule: "Koleksi 1 Warrior.", test: function () { return punyaRace("Warrior"); } },
  { id: "machine", name: "Machine Bay", rule: "Koleksi 1 Machine.", test: function () { return punyaRace("Machine"); } },
  { id: "light", name: "Light Album", rule: "Koleksi 1 atribut LIGHT.", test: function () { return punyaAttribute("LIGHT"); } },
  { id: "dark", name: "Dark Album", rule: "Koleksi 1 atribut DARK.", test: function () { return punyaAttribute("DARK"); } },
  { id: "elements_four", name: "Four Elements", rule: "Koleksi 4 atribut berbeda.", test: function () { return hitungAttributeUnik() >= 4; } },
  { id: "pull_50", name: "50 Pulls", rule: "Lakukan 50 tarikan.", test: function () { return total >= 50; } },
  { id: "pull_100", name: "100 Pulls", rule: "Lakukan 100 tarikan.", test: function () { return total >= 100; } },
  { id: "pull_250", name: "250 Pulls", rule: "Lakukan 250 tarikan.", test: function () { return total >= 250; } }
];

// State utama game: pity reset setiap SSR, total dan SSR terus dihitung.
let pity = 0;
let total = 0;
let ssrCount = 0;

const card = document.getElementById("card");
const cardImage = document.getElementById("cardImage");
const cardName = document.getElementById("cardName");
const cardRarity = document.getElementById("cardRarity");
const ownedNote = document.getElementById("ownedNote");
const cardMeta = document.getElementById("cardMeta");
const cardDesc = document.getElementById("cardDesc");
const totalText = document.getElementById("total");
const ssrCountText = document.getElementById("ssrCount");
const collectionCountText = document.getElementById("collectionCount");
const poolCountText = document.getElementById("poolCount");
const pityText = document.getElementById("pityText");
const pityFill = document.getElementById("pityFill");
const history = document.getElementById("history");
const fullHistory = document.getElementById("fullHistory");
const historyPreview = document.getElementById("historyPreview");
const historyToggle = document.getElementById("historyToggle");
const historyPanel = document.getElementById("historyPanel");
const badgeList = document.getElementById("badgeList");
const badgeCount = document.getElementById("badgeCount");
const badgeToggle = document.getElementById("badgeToggle");
const badgePanel = document.getElementById("badgePanel");
const statusText = document.getElementById("status");
const tarik1 = document.getElementById("tarik1");
const tarik10 = document.getElementById("tarik10");

// Ambil satu item acak dari array hadiah.
function pilihAcak(arr) {
  const index = Math.floor(Math.random() * arr.length);
  return arr[index];
}

// Rarity gacha dibuat dari rarity cetakan kartu di data YGOPRODeck.
function kelasDariSet(cardData) {
  const setText = (cardData.card_sets || [])
    .map(function (set) { return set.set_rarity || ""; })
    .join(" ")
    .toLowerCase();

  if (/starlight|collector|ghost|quarter century|ultimate|prismatic/.test(setText)) return "ssr";
  if (/secret|ultra|platinum|gold/.test(setText)) return "epic";
  if (/super|rare/.test(setText)) return "rare";
  return "common";
}

// Bentuk data API dibuat kecil supaya fungsi tampilan tetap sederhana.
function rapikanKartu(cardData) {
  const image = (cardData.card_images && cardData.card_images[0]) || {};
  return {
    kelas: kelasDariSet(cardData),
    id: String(cardData.id || cardData.name),
    nama: cardData.name,
    type: cardData.type || "Unknown",
    race: cardData.race || "",
    attribute: cardData.attribute || "",
    desc: cardData.desc || "",
    image: image.image_url_small || image.image_url || "",
    link: cardData.ygoprodeck_url || ""
  };
}

// Load API sekali, lalu roll memakai data lokal agar tidak boros request.
async function muatKartu() {
  try {
    const response = await fetch(API_URL);
    if (!response.ok) throw new Error("API status " + response.status);

    const json = await response.json();
    const cards = json.data.map(rapikanKartu).filter(function (item) {
      return item.nama && item.image;
    });

    cards.forEach(function (item) {
      pools[item.kelas].push(item);
    });

    isiPoolKosong(cards);
    poolCountText.textContent = cards.length;
    statusText.textContent = "Siap: " + cards.length + " kartu TCG dimuat dari YGOPRODeck.";
    tarik1.disabled = false;
    tarik10.disabled = false;
    cardName.textContent = "Tekan TARIK";
    cardDesc.textContent = "Data kartu sudah siap.";
    tampilkanBadge();
  } catch (error) {
    statusText.textContent = "Gagal memuat API. Coba refresh halaman.";
    cardName.textContent = "API belum siap";
    cardDesc.textContent = error.message;
  }
}

// Cek apakah koleksi sudah punya tipe kartu tertentu.
function punyaTipe(text) {
  return collectionCards.some(function (item) {
    return item.type.indexOf(text) !== -1;
  });
}

// Hitung kartu unik dari rarity tertentu di koleksi.
function hitungRarity(kelas) {
  return collectionCards.filter(function (item) {
    return item.kelas === kelas;
  }).length;
}

// Cek race kartu seperti Dragon, Warrior, atau Spellcaster.
function punyaRace(text) {
  return collectionCards.some(function (item) {
    return item.race === text;
  });
}

// Cek attribute monster seperti LIGHT atau DARK.
function punyaAttribute(text) {
  return collectionCards.some(function (item) {
    return item.attribute === text;
  });
}

// Hitung jumlah attribute berbeda yang sudah dimiliki.
function hitungAttributeUnik() {
  const attributes = new Set();
  collectionCards.forEach(function (item) {
    if (item.attribute) attributes.add(item.attribute);
  });
  return attributes.size;
}

// Jika satu rarity kosong dari API, pakai seluruh kartu supaya roll tidak error.
function isiPoolKosong(cards) {
  Object.keys(pools).forEach(function (kelas) {
    if (pools[kelas].length === 0) pools[kelas] = cards.slice();
  });
}

// Jalankan satu tarikan dengan peluang rarity dan pity SSR di batas gratis.
function rollSatu() {
  total += 1;
  pity += 1;

  const acak = Math.random();
  let kelas = "common";

  if (pity >= PITY_LIMIT || acak < SSR_RATE) {
    kelas = "ssr";
    pity = 0;
    ssrCount += 1;
  } else if (acak < SSR_RATE + EPIC_RATE) {
    kelas = "epic";
  } else if (acak < SSR_RATE + EPIC_RATE + RARE_RATE) {
    kelas = "rare";
  }

  const item = pilihAcak(pools[kelas]);
  return Object.assign({}, item, { kelas: kelas });
}

// Catat kartu unik ke koleksi dan tandai apakah hasil ini kartu baru.
function catatKoleksi(hasil) {
  hasil.baru = !collectionIds.has(hasil.id);
  if (hasil.baru) {
    collectionIds.add(hasil.id);
    collectionCards.push(hasil);
  }
  perbaruiBadge();
}

// Buka badge yang syaratnya sudah terpenuhi.
function perbaruiBadge() {
  badges.forEach(function (badge) {
    if (badge.test()) unlockedBadges.add(badge.id);
  });
  tampilkanBadge();
}

// Render badge koleksi sebagai checklist permanen selama halaman aktif.
function tampilkanBadge() {
  badgeList.innerHTML = "";
  badges.forEach(function (badge) {
    const item = document.createElement("div");
    const unlocked = unlockedBadges.has(badge.id);
    item.className = "badge" + (unlocked ? " unlocked" : "");
    item.innerHTML =
      "<div class=\"badge-name\">" + (unlocked ? "Unlocked: " : "Locked: ") + badge.name + "</div>" +
      "<div class=\"badge-rule\">" + badge.rule + "</div>";
    badgeList.appendChild(item);
  });
  badgeCount.textContent = unlockedBadges.size + " / " + badges.length;
  badgeToggle.textContent = "BADGES " + unlockedBadges.size + " / " + badges.length;
  collectionCountText.textContent = collectionCards.length;
}

// Tampilkan hasil terakhir dan refresh angka statistik di layar.
function tampilkan(hasil) {
  cardImage.src = hasil.image;
  cardImage.alt = hasil.nama;
  cardName.textContent = hasil.nama;
  cardRarity.textContent = hasil.kelas.toUpperCase();
  ownedNote.textContent = hasil.baru ? "Kartu baru masuk koleksi" : "Sudah ada di koleksi";
  cardDesc.textContent = hasil.desc;

  cardMeta.innerHTML = "";
  [hasil.type, hasil.race, hasil.attribute].filter(Boolean).forEach(function (text) {
    const tag = document.createElement("span");
    tag.className = "tag";
    tag.textContent = text;
    cardMeta.appendChild(tag);
  });

  card.className = "card";
  card.offsetWidth;
  card.className = "card " + hasil.kelas + " reveal";

  totalText.textContent = total;
  ssrCountText.textContent = ssrCount;
  collectionCountText.textContent = collectionCards.length;
  pityText.textContent = pity + " / " + PITY_LIMIT;
  pityFill.style.width = Math.min((pity / PITY_LIMIT) * 100, 100) + "%";
}

// Buat chip gambar kecil untuk preview dan panel riwayat.
function buatChip(hasil) {
  const chip = document.createElement("div");
  const img = document.createElement("img");
  chip.className = "chip " + hasil.kelas;
  img.src = hasil.image;
  img.alt = hasil.nama;
  chip.title = hasil.nama;
  chip.appendChild(img);
  return chip;
}

// Simpan semua riwayat, lalu tampilkan beberapa terakhir di layar utama.
function tambahRiwayat(hasil) {
  allHistory.unshift(hasil);
  history.innerHTML = "";
  fullHistory.innerHTML = "";

  allHistory.slice(0, HISTORY_PREVIEW_LIMIT).forEach(function (item) {
    history.appendChild(buatChip(item));
  });

  allHistory.forEach(function (item) {
    fullHistory.appendChild(buatChip(item));
  });
}

// Tarik satu kali lalu tampilkan hasilnya.
tarik1.addEventListener("click", function () {
  const hasil = rollSatu();
  catatKoleksi(hasil);
  tampilkan(hasil);
  tambahRiwayat(hasil);
});

// Tarik sepuluh kali; kartu utama menampilkan hasil terakhir.
tarik10.addEventListener("click", function () {
  for (let i = 0; i < 10; i += 1) {
    const hasil = rollSatu();
    catatKoleksi(hasil);
    tampilkan(hasil);
    tambahRiwayat(hasil);
  }
});

// Badge dibuka sebagai floating panel supaya kartu tetap jadi fokus utama.
badgeToggle.addEventListener("click", function () {
  bukaPanel(badgePanel);
});

// Riwayat lengkap bisa discroll saat jumlah pull sudah banyak.
historyToggle.addEventListener("click", function () {
  bukaPanel(historyPanel);
});

historyPreview.addEventListener("click", function () {
  bukaPanel(historyPanel);
});

// Panel floating bisa ditutup lewat tombol Tutup, area gelap, atau Escape.
document.addEventListener("click", function (event) {
  const targetId = event.target.getAttribute("data-close");
  if (targetId) tutupPanel(document.getElementById(targetId));
  if (event.target.classList.contains("modal")) tutupPanel(event.target);
});

document.addEventListener("keydown", function (event) {
  if (event.key === "Escape") {
    tutupPanel(historyPanel);
    tutupPanel(badgePanel);
  }
});

function bukaPanel(panel) {
  panel.classList.add("open");
  panel.setAttribute("aria-hidden", "false");
}

function tutupPanel(panel) {
  panel.classList.remove("open");
  panel.setAttribute("aria-hidden", "true");
}

muatKartu();
