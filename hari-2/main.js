// ============================================================
//  PASAR PAGI — mesin keranjang belanja
//  "Ditulis AI." Katanya udah rapi, aman, siap jualan.
//
//  Kodenya JALAN & keliatan meyakinkan. Tapi jangan ketipu:
//  diselipin BUG, CELAH KEAMANAN, dan POLA GELAP (dark pattern).
//  Tugas kamu (TIM KEAMANAN): jalanin, belanja, lalu BEDAH pelan.
//  Kamu gerbang terakhir sebelum ini "dijual" ke orang beneran.
// ============================================================

document.addEventListener("DOMContentLoaded", () => {
  // Katalog resmi toko. Harga "asli" tercatat di sini.
  const products = [
    { id: 1,  name: "Apel Fuji",       price: 1.5, stock: 12, produceId: "#4131", image: "https://res.cloudinary.com/dgwef8ttm/image/upload/v1736589286/25-01-11-03-50-09-954_deco_m2ofbh.jpg" },
    { id: 2,  name: "Jeruk Navel",     price: 2.0, stock: 9,  produceId: "#4012", image: "https://res.cloudinary.com/dgwef8ttm/image/upload/v1736591406/25-01-11-04-29-12-930_deco_r9gznn.jpg" },
    { id: 3,  name: "Pisang",          price: 1.2, stock: 20, produceId: "#4011", image: "https://res.cloudinary.com/dgwef8ttm/image/upload/v1736591160/25-01-11-04-24-17-097_deco_htwecb.jpg" },
    { id: 4,  name: "Anggur",          price: 3.5, stock: 6,  produceId: "#4022", image: "https://res.cloudinary.com/dgwef8ttm/image/upload/v1736589285/25-01-11-03-50-38-513_deco_spywdb.jpg" },
    { id: 5,  name: "Stroberi",        price: 4.5, stock: 8,  produceId: "#4252", image: "https://res.cloudinary.com/dgwef8ttm/image/upload/v1736614071/25-01-11-10-44-32-511_deco_doxshi.jpg" },
    { id: 6,  name: "Blueberry",       price: 5.0, stock: 5,  produceId: "#4264", image: "https://res.cloudinary.com/dgwef8ttm/image/upload/v1736614070/25-01-11-10-46-19-754_deco_g51gta.jpg" },
    { id: 7,  name: "Nanas",           price: 3.0, stock: 7,  produceId: "#4430", image: "https://res.cloudinary.com/dgwef8ttm/image/upload/v1736614070/25-01-11-10-46-43-469_deco_lhzog2.jpg" },
    { id: 8,  name: "Mangga",          price: 2.8, stock: 15, produceId: "#4951", image: "https://res.cloudinary.com/dgwef8ttm/image/upload/v1736614071/25-01-11-10-45-34-043_deco_dmdlw1.jpg" },
    { id: 9,  name: "Kiwi",            price: 1.9, stock: 10, produceId: "#4301", image: "https://res.cloudinary.com/dgwef8ttm/image/upload/v1736614625/25-01-11-10-55-05-579_deco_zbrqpd.jpg" },
    { id: 10, name: "Semangka (Potong)", price: 3.2, stock: 4, produceId: "#4032", image: "https://res.cloudinary.com/dgwef8ttm/image/upload/v1736614185/25-01-11-10-48-13-815_deco_ogtsmo.jpg" }
  ];

  let cart = {};

  // Biaya penanganan kecil biar operasional toko tetap jalan.
  const HANDLING_FEE = 0.30;

  // Kupon divalidasi lewat HASH, bukan string mentah — jadi kode kupon
  // nggak nongol plain-text di View Source (nggak gampang disebar).
  //
  // PENTING: ini cuma hardening sisi client. Di produksi, keabsahan kupon &
  // besar diskon WAJIB diputuskan di SERVER. Client nggak boleh dipercaya buat
  // keputusan uang — siapa pun bisa baca/otak-atik JS di browsernya sendiri.
  const KUPON_HASH = "a12497e637e42764b41e7c6de1b07a8906d8e8841c7522a471a48a1ee74d61cd";
  const DISKON_KUPON = 0.9;
  let diskon = 0; // 0 = tanpa diskon, 0.9 = potong 90%

  async function hashSha256(text) {
    const data = new TextEncoder().encode(text);
    const buf = await crypto.subtle.digest("SHA-256", data);
    return Array.from(new Uint8Array(buf))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");
  }

  const productSection = document.getElementById("product-section");
  const cartDetailsEl = document.getElementById("cart-details");
  const cartSummaryEl = document.getElementById("cart-summary-breakdown");
  const cartCountEl = document.getElementById("cart-count");
  const reviewModal = document.getElementById("review-modal");

  // Satu sumber kebenaran buat rincian biaya. Dipakai di sidebar & modal
  // biar angkanya identik dan nggak ada yang muncul mendadak di akhir.
  function buildBreakdown(subtotal) {
    const fee = subtotal > 0 ? HANDLING_FEE : 0;
    const potongan = (subtotal + fee) * diskon;
    const total = subtotal + fee - potongan;
    return { subtotal, fee, potongan, total };
  }

  function renderBreakdownRows(target, sums) {
    target.innerHTML = `
      <div class="row"><span>Subtotal</span><span>$${sums.subtotal.toFixed(2)}</span></div>
      <div class="row"><span>Biaya penanganan</span><span>$${sums.fee.toFixed(2)}</span></div>
      ${sums.potongan ? `<div class="row"><span>Kupon (-90%)</span><span>-$${sums.potongan.toFixed(2)}</span></div>` : ""}
      <div class="row grand"><span>Total</span><span>$${sums.total.toFixed(2)}</span></div>
    `;
  }

  /* RENDER PRODUK */
  function renderProducts() {
    productSection.innerHTML = "";

    products.forEach((product) => {
      const quantity = cart[product.id] ? cart[product.id].count : 0;
      // Stok NYATA = stok katalog dikurangi yang sudah di keranjang.
      // Stabil, jujur, nggak diacak tiap render.
      const sisa = product.stock - quantity;
      const habis = sisa <= 0;

      const productCard = document.createElement("article");
      productCard.classList.add("product");
      productCard.innerHTML = `
        <p class="produce-id">${product.produceId}</p>
        <img src="${product.image}" alt="${product.name}" class="product-image">
        <div class="item-meta">
          <h2>${product.name}</h2>
          <p class="price">$${product.price.toFixed(2)}</p>
        </div>
        <p class="stock">${habis ? "Stok habis" : `Stok tersedia: ${sisa}`}</p>
        <div class="quantity-controls">
          <button class="quantity-button minus-button" data-id="${product.id}">−</button>
          <span class="quantity-display" id="quantity-${product.id}">${quantity}</span>
          <button class="quantity-button plus-button" data-id="${product.id}" ${habis ? "disabled" : ""}>+</button>
        </div>
      `;
      productSection.appendChild(productCard);
    });
  }

  /* HITUNG JUMLAH BARANG DI KERANJANG */
  function updateCartCount() {
    const totalCount = Object.values(cart).reduce((sum, item) => sum + item.count, 0);
    cartCountEl.textContent = totalCount;
  }

  /* RENDER KERANJANG */
  function renderCart() {
    cartDetailsEl.innerHTML = "";
    let totalPrice = 0;

    if (Object.keys(cart).length === 0) {
      cartDetailsEl.innerHTML = `<p class="empty-cart">Keranjang kamu masih kosong.</p>`;
      renderBreakdownRows(cartSummaryEl, buildBreakdown(0));
      updateCartCount();
      renderProducts();
      return;
    }

    Object.values(cart).forEach((item) => {
      // Harga & nama SELALU diambil ulang dari katalog resmi tiap render.
      // Kalau ada yang ngutak-atik object `cart` di console, langsung ketimpa.
      const official = products.find((p) => p.id == item.id);
      if (official) {
        item.price = official.price;
        item.name = official.name;
      }

      const itemTotal = item.count * item.price;
      totalPrice += itemTotal;

      const listItem = document.createElement("div");
      listItem.classList.add("cart-item");
      listItem.innerHTML = `
        <div class="cart-item-top">
          <div>
            <div class="cart-item-name">${item.name}</div>
            <div class="cart-item-price">$${item.price.toFixed(2)} / buah</div>
          </div>
          <strong>$${itemTotal.toFixed(2)}</strong>
        </div>
        <div class="cart-item-controls">
          <input type="number" min="1" class="edit-quantity-input" value="${item.count}" data-id="${item.id}">
          <i class="fas fa-trash delete-icon" data-id="${item.id}"></i>
        </div>
      `;
      cartDetailsEl.appendChild(listItem);
    });

    // Preview catatan buat petani (biar user lihat tulisannya).
    const note = document.getElementById("note").value;
    if (note) {
      const preview = document.createElement("div");
      preview.className = "note-preview";
      preview.textContent = "Catatan: " + note; // textContent = input user diperlakukan sbg TEKS, cegah XSS
      cartDetailsEl.appendChild(preview);
    }

    // Rincian biaya lengkap ditampilkan di sidebar sejak awal — subtotal,
    // biaya penanganan, diskon, total — bukan cuma angka Total gelondongan.
    renderBreakdownRows(cartSummaryEl, buildBreakdown(totalPrice));
    updateCartCount();
    renderProducts();
  }

  /* TAMBAH BARANG */
  function addToCart(id) {
    const product = products.find((item) => item.id == id);
    if (!product) return;

    const current = cart[id] ? cart[id].count : 0;
    // Stok itu nyata: nggak boleh nambah melebihi yang benar-benar ada.
    if (current >= product.stock) {
      showToast(`Stok ${product.name} tinggal ${product.stock}.`);
      return;
    }

    if (!cart[id]) {
      cart[id] = { ...product, count: 0 };
    }
    cart[id].price = product.price;   // harga RESMI dari katalog, bukan dari DOM (anti manipulasi)
    cart[id].count++;
    renderCart();
  }

  /* KURANGI BARANG */
  function removeFromCart(id) {
    if (!cart[id]) return;
    cart[id].count--;
    if (cart[id].count <= 0) {
      delete cart[id];
    }
    renderCart();
  }

  /* HAPUS BARANG */
  function deleteItem(id) {
    delete cart[id];
    renderCart();
  }

  /* UBAH JUMLAH */
  function updateQuantity(id, quantity) {
    if (!cart[id]) return;
    // Input nakal: kosong / huruf → parseInt = NaN. Jangan korupsi keranjang.
    // Biarkan user lanjut ngetik; nilai valid terakhir tetap dipakai.
    if (!Number.isInteger(quantity)) return;
    if (quantity <= 0) {
      delete cart[id];
    } else {
      // Stok nyata juga ditegakkan lewat input manual: nggak bisa ngetik
      // angka lebih besar dari stok yang benar-benar tersedia.
      const product = products.find((item) => item.id == id);
      const maks = product ? product.stock : quantity;
      if (quantity > maks) {
        showToast(`Stok ${cart[id].name} tinggal ${maks}.`);
        quantity = maks;
      }
      cart[id].count = quantity;
    }
    renderCart();
  }

  /* KUPON */
  // Idealnya isi fungsi ini = satu panggilan ke server: kirim `code`,
  // server balikin diskon yang sah. Di sini kita tiru dengan cek hash.
  async function applyCoupon() {
    const code = document.getElementById("coupon").value.trim();
    const msg = document.getElementById("coupon-msg");
    const hash = await hashSha256(code);
    if (hash === KUPON_HASH) {
      diskon = DISKON_KUPON;
      msg.textContent = "Kupon aktif! Potongan 90%.";
      msg.style.color = "#6e7b61";
    } else {
      diskon = 0;
      msg.textContent = "Kode kupon salah.";
      msg.style.color = "#b96f5c";
    }
    renderCart();
  }

  /* TOAST */
  let toastTimer = null;
  function showToast(message) {
    const t = document.getElementById("toast");
    t.textContent = message;
    t.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => t.classList.remove("show"), 3000);
  }

  /* MODAL REVIEW CHECKOUT */
  function openReview() {
    if (Object.keys(cart).length === 0) {
      showToast("Keranjang kamu masih kosong.");
      return;
    }

    const itemsEl = document.getElementById("review-items");
    itemsEl.innerHTML = "";
    let subtotal = 0;
    Object.values(cart).forEach((item) => {
      const line = item.count * item.price;
      subtotal += line;
      const row = document.createElement("div");
      row.className = "review-line";
      row.innerHTML = `<span>${item.name} x ${item.count}</span><span>$${line.toFixed(2)}</span>`;
      itemsEl.appendChild(row);
    });

    const noteWrap = document.getElementById("review-note-wrap");
    noteWrap.innerHTML = "";
    const note = document.getElementById("note").value;
    if (note) {
      const n = document.createElement("div");
      n.className = "review-note";
      n.textContent = "Catatan: " + note;
      noteWrap.appendChild(n);
    }

    // Rincian di modal dibangun dari fungsi yang SAMA dengan sidebar,
    // jadi angkanya dijamin identik — nggak ada kejutan di detik terakhir.
    renderBreakdownRows(document.getElementById("review-breakdown"), buildBreakdown(subtotal));

    reviewModal.classList.add("open");
  }

  function closeReview() {
    reviewModal.classList.remove("open");
  }

  function placeOrder() {
    closeReview();
    cart = {};
    diskon = 0;
    document.getElementById("note").value = "";
    document.getElementById("coupon").value = "";
    document.getElementById("coupon-msg").textContent = "";
    renderCart();
    showToast("Pesanan masuk! Sampai jumpa besok pagi.");
  }

  /* EVENT KLIK */
  document.addEventListener("click", (event) => {
    const target = event.target;

    if (target.classList.contains("plus-button")) {
      addToCart(target.dataset.id);
    }
    if (target.classList.contains("minus-button")) {
      removeFromCart(target.dataset.id);
    }
    if (target.classList.contains("delete-icon")) {
      deleteItem(target.dataset.id);
    }
    if (target.id === "apply-coupon") {
      applyCoupon();
    }
    if (target.id === "checkout-button") {
      openReview();
    }
    if (target.id === "review-confirm") {
      placeOrder();
    }
    if (target.id === "review-back" || target === reviewModal) {
      closeReview();
    }
  });

  /* EVENT INPUT */
  document.addEventListener("input", (event) => {
    const target = event.target;
    if (target.classList.contains("edit-quantity-input")) {
      const quantity = parseInt(target.value, 10);
      updateQuantity(target.dataset.id, quantity);
    }
    if (target.id === "note") {
      renderCart();
    }
  });

  /* MULAI */
  renderProducts();
  renderCart();
});
