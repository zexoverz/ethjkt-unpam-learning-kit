// ============================================================
//  PASAR PAGI — mesin keranjang belanja
//  "Ditulis AI." Katanya udah rapi, aman, siap jualan.
//
//  Kodenya JALAN & keliatan meyakinkan. Tapi jangan ketipu:
//  diselipin BUG, CELAH KEAMANAN, dan POLA GELAP (dark pattern).
//  Tugas kamu (TIM KEAMANAN): jalanin, belanja, lalu BEDAH pelan.
//  Kamu gerbang terakhir sebelum ini "dijual" ke orang beneran.
// ============================================================

// ============================================================
//  CATATAN PERBAIKAN — BATCH 1
//
//  [FIX-01] SEC-01  : XSS — ganti innerHTML → textContent pada note preview
//  [FIX-02] SEC-02  : Price manipulation — ambil harga dari products[], bukan DOM
//  [FIX-03] SEC-03  : Kupon hardcoded — obfuscate + TODO comment server-side
//  [FIX-04] BUG-01  : Floating point — tambah .toFixed(2) di semua tampilan total
//  [FIX-05] BUG-02  : renderProducts() berlebihan — pisah jadi updateProductQtyDisplay()
//  [FIX-06] BUG-03  : NaN di updateQuantity — tambah isNaN() guard
//  [FIX-07] BUG-04  : Max quantity — tambah konstanta MAX_QUANTITY = 99
//  [FIX-08] BUG-05  : Handling fee tersembunyi — tampilkan di sidebar (lihat index.html)
//  [FIX-09] DARK-01 : Stok random palsu — ganti dengan stockMap tetap per produk
//  [FIX-10] CODE-02 : Tidak ada persistensi — tambah localStorage untuk keranjang
// ============================================================

document.addEventListener("DOMContentLoaded", () => {
  // Katalog resmi toko. Harga "asli" tercatat di sini.
  const products = [
    {
      id: 1,
      name: "Apel Fuji",
      price: 1.5,
      produceId: "#4131",
      image:
        "https://res.cloudinary.com/dgwef8ttm/image/upload/v1736589286/25-01-11-03-50-09-954_deco_m2ofbh.jpg",
    },
    {
      id: 2,
      name: "Jeruk Navel",
      price: 2.0,
      produceId: "#4012",
      image:
        "https://res.cloudinary.com/dgwef8ttm/image/upload/v1736591406/25-01-11-04-29-12-930_deco_r9gznn.jpg",
    },
    {
      id: 3,
      name: "Pisang",
      price: 1.2,
      produceId: "#4011",
      image:
        "https://res.cloudinary.com/dgwef8ttm/image/upload/v1736591160/25-01-11-04-24-17-097_deco_htwecb.jpg",
    },
    {
      id: 4,
      name: "Anggur",
      price: 3.5,
      produceId: "#4022",
      image:
        "https://res.cloudinary.com/dgwef8ttm/image/upload/v1736589285/25-01-11-03-50-38-513_deco_spywdb.jpg",
    },
    {
      id: 5,
      name: "Stroberi",
      price: 4.5,
      produceId: "#4252",
      image:
        "https://res.cloudinary.com/dgwef8ttm/image/upload/v1736614071/25-01-11-10-44-32-511_deco_doxshi.jpg",
    },
    {
      id: 6,
      name: "Blueberry",
      price: 5.0,
      produceId: "#4264",
      image:
        "https://res.cloudinary.com/dgwef8ttm/image/upload/v1736614070/25-01-11-10-46-19-754_deco_g51gta.jpg",
    },
    {
      id: 7,
      name: "Nanas",
      price: 3.0,
      produceId: "#4430",
      image:
        "https://res.cloudinary.com/dgwef8ttm/image/upload/v1736614070/25-01-11-10-46-43-469_deco_lhzog2.jpg",
    },
    {
      id: 8,
      name: "Mangga",
      price: 2.8,
      produceId: "#4951",
      image:
        "https://res.cloudinary.com/dgwef8ttm/image/upload/v1736614071/25-01-11-10-45-34-043_deco_dmdlw1.jpg",
    },
    {
      id: 9,
      name: "Kiwi",
      price: 1.9,
      produceId: "#4301",
      image:
        "https://res.cloudinary.com/dgwef8ttm/image/upload/v1736614625/25-01-11-10-55-05-579_deco_zbrqpd.jpg",
    },
    {
      id: 10,
      name: "Semangka (Potong)",
      price: 3.2,
      produceId: "#4032",
      image:
        "https://res.cloudinary.com/dgwef8ttm/image/upload/v1736614185/25-01-11-10-48-13-815_deco_ogtsmo.jpg",
    },
  ];

  // [FIX-09] DARK-01: Stok nyata & tetap per produk — bukan Math.random()
  // Sebelumnya: Math.floor(Math.random() * 5) + 1  ← dark pattern (urgensi palsu)
  const stockMap = {
    1: 12, 2: 8,  3: 20, 4: 6,  5: 9,
    6: 5,  7: 7,  8: 11, 9: 14, 10: 4,
  };

  // [FIX-10] CODE-02: Muat keranjang dari localStorage agar tidak hilang saat refresh
  // Sebelumnya: let cart = {}  ← selalu mulai dari kosong setiap refresh
  let cart = JSON.parse(localStorage.getItem("pasarPagiCart") || "{}");

  // Biaya penanganan kecil biar operasional toko tetap jalan.
  const HANDLING_FEE = 0.3;

  // [FIX-07] BUG-04: Konstanta batas quantity maksimum per item
  const MAX_QUANTITY = 99;

  // [FIX-03] SEC-03: TODO — Validasi kupon HARUS dipindah ke server-side.
  // Menyimpan kode kupon di client-side JS tidak aman: siapapun bisa baca
  // via DevTools → Sources → main.js. Solusi benar: kirim kode ke API,
  // biarkan server yang memvalidasi dan mengembalikan besar diskon.
  // Ini hanya simulasi sementara dengan nama variabel disamarkan.
  // ⚠️ atob() masih bisa di-decode di console: atob("VEVNQU5GQVJNRVI=")
  const _ck = atob("VEVNQU5GQVJNRVI=");
  // [FIX-12] DARK-02: Komentar diperbarui — diskon sekarang 10%, bukan 90%
  let diskon = 0; // 0 = tanpa diskon, 0.1 = potong 10%

  const productSection = document.getElementById("product-section");
  const cartDetailsEl = document.getElementById("cart-details");
  const totalPriceEl = document.getElementById("modal-total-price");
  const cartCountEl = document.getElementById("cart-count");
  const reviewModal = document.getElementById("review-modal");

  // [FIX-10] CODE-02: Simpan state keranjang ke localStorage setiap ada perubahan
  function saveCart() {
    localStorage.setItem("pasarPagiCart", JSON.stringify(cart));
  }

  /* RENDER PRODUK */
  function renderProducts() {
    productSection.innerHTML = "";

    products.forEach((product) => {
      const quantity = cart[product.id] ? cart[product.id].count : 0;
      // [FIX-09] DARK-01: Ambil stok dari stockMap — bukan random
      const sisa = stockMap[product.id] ?? 5;

      const productCard = document.createElement("article");
      productCard.classList.add("product");
      productCard.innerHTML = `
        <p class="produce-id">${product.produceId}</p>
        <img src="${product.image}" alt="${product.name}" class="product-image">
        <div class="item-meta">
          <h3>${product.name}</h3>
          <p class="price">$${product.price.toFixed(2)}</p>
        </div>
        <p class="stock">stok hari ini: ${sisa}</p>
        <div class="quantity-controls">
          <button class="quantity-button minus-button" data-id="${product.id}">−</button>
          <span class="quantity-display" id="quantity-${product.id}">${quantity}</span>
          <button class="quantity-button plus-button" data-id="${product.id}" data-price="${product.price}">+</button>
        </div>
      `;
      productSection.appendChild(productCard);
    });
  }

  // [FIX-05] BUG-02: Fungsi baru — hanya update angka quantity di kartu produk
  // tanpa re-render seluruh grid (tidak memicu ulang stockMap / random stok).
  // Sebelumnya: renderCart() memanggil renderProducts() penuh setiap kali
  // keranjang berubah → stok "berubah-ubah" setiap aksi user.
  function updateProductQtyDisplay() {
    products.forEach((product) => {
      const qEl = document.getElementById(`quantity-${product.id}`);
      if (qEl) {
        qEl.textContent = cart[product.id] ? cart[product.id].count : 0;
      }
    });
  }

  /* HITUNG JUMLAH BARANG DI KERANJANG */
  function updateCartCount() {
    const totalCount = Object.values(cart).reduce(
      (sum, item) => sum + item.count,
      0,
    );
    cartCountEl.textContent = totalCount;
  }

  /* RENDER KERANJANG */
  function renderCart() {
    cartDetailsEl.innerHTML = "";
    let totalPrice = 0;

    if (Object.keys(cart).length === 0) {
      cartDetailsEl.innerHTML = `<p class="empty-cart">Keranjang kamu masih kosong.</p>`;
      totalPriceEl.textContent = "0.00";
      updateCartCount();
      // [FIX-05] BUG-02: Gunakan updateProductQtyDisplay, bukan renderProducts()
      updateProductQtyDisplay();
      return;
    }

    Object.values(cart).forEach((item) => {
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
          <input type="number" min="1" max="${MAX_QUANTITY}" class="edit-quantity-input" value="${item.count}" data-id="${item.id}">
          <i class="fas fa-trash delete-icon" data-id="${item.id}"></i>
        </div>
      `;
      cartDetailsEl.appendChild(listItem);
    });

    // [FIX-01] SEC-01: Ganti innerHTML → textContent untuk mencegah XSS
    // Sebelumnya: preview.innerHTML = "Catatan: " + note
    // Serangan: ketik <img src=x onerror="alert(1)"> di kolom catatan → eksekusi JS!
    const note = document.getElementById("note").value;
    if (note) {
      const preview = document.createElement("div");
      preview.className = "note-preview";
      preview.textContent = "Catatan: " + note; // [FIX-01] aman dari XSS
      cartDetailsEl.appendChild(preview);
    }

    // Total akhir = barang + biaya penanganan, lalu potong diskon.
    let total = totalPrice + HANDLING_FEE;
    total = total - total * diskon;

    // [FIX-04] BUG-01: Tambahkan .toFixed(2) — cegah floating point aneh
    // Sebelumnya: totalPriceEl.textContent = total
    // Contoh bug: 1.2 + 1.5 + 0.3 = "3.0000000000000004"
    totalPriceEl.textContent = total.toFixed(2);

    updateCartCount();
    // [FIX-05] BUG-02: Ganti renderProducts() → updateProductQtyDisplay()
    // Sebelumnya: renderProducts() ← rebuild seluruh grid + stok random berubah
    updateProductQtyDisplay();
  }

  /* TAMBAH BARANG */
  function addToCart(id, price) {
    const product = products.find((item) => item.id == id);
    if (!product) return;

    if (!cart[id]) {
      cart[id] = { ...product, count: 0 };
    }
    // [FIX-02] SEC-02: Gunakan harga dari katalog products[], BUKAN dari atribut DOM
    // Sebelumnya: cart[id].price = price  ← price diambil dari data-price di HTML
    // Serangan: ubah data-price="5" → data-price="0.01" di DevTools → harga $0.01
    cart[id].price = product.price; // [FIX-02] harga server-of-truth ada di sini
    cart[id].count++;
    saveCart(); // [FIX-10]
    renderCart();
  }

  /* KURANGI BARANG */
  function removeFromCart(id) {
    if (!cart[id]) return;
    cart[id].count--;
    if (cart[id].count <= 0) {
      delete cart[id];
    }
    saveCart(); // [FIX-10]
    renderCart();
  }

  /* HAPUS BARANG */
  function deleteItem(id) {
    delete cart[id];
    saveCart(); // [FIX-10]
    renderCart();
  }

  /* UBAH JUMLAH */
  function updateQuantity(id, quantity) {
    if (!cart[id]) return;
    // [FIX-06] BUG-03: Guard NaN — parseInt("abc") = NaN, NaN <= 0 = false
    // Sebelumnya tanpa guard: cart[id].count = NaN → total menjadi NaN
    // [FIX-07] BUG-04: Math.min() batasi ke MAX_QUANTITY — cegah quantity tak wajar
    if (isNaN(quantity) || quantity <= 0) {
      delete cart[id];
    } else {
      cart[id].count = Math.min(quantity, MAX_QUANTITY);
    }
    saveCart(); // [FIX-10]
    renderCart();
  }

  /* KUPON */
  function applyCoupon() {
    const code = document.getElementById("coupon").value;
    const msg = document.getElementById("coupon-msg");
    // [FIX-03] SEC-03: Bandingkan dengan _ck (bukan nama jelas KUPON_RAHASIA)
    // ⚠️ Ini masih tidak aman! Di produksi: validasi HARUS di server-side.
    // [FIX-12] DARK-02: Diskon diturunkan 90% → 10%
    // Sebelumnya: diskon = 0.9 — hampir gratis, merugikan bisnis & bisa dieksploitasi
    if (code === _ck) {
      diskon = 0.1;
      msg.textContent = "Kupon aktif! Potongan 10%.";
      msg.style.color = "#6e7b61";
    } else {
      diskon = 0;
      msg.textContent = "Kode kupon salah.";
      msg.style.color = "#b96f5c";
    }
    renderCart();
  }

  // [FIX-11] SEC-04: Validasi integritas harga keranjang vs. katalog
  // Mendeteksi & memperbaiki jika ada harga di cart yang berbeda dari products[]
  // CATATAN: Ini lapisan pertahanan client-side saja.
  // Di produksi: server HARUS memvalidasi ulang harga sebelum memproses pembayaran.
  function validateCartIntegrity() {
    let tampered = false;
    Object.values(cart).forEach((item) => {
      const catalog = products.find((p) => p.id == item.id);
      if (catalog && item.price !== catalog.price) {
        // Harga tidak cocok — kembalikan ke harga katalog resmi
        cart[item.id].price = catalog.price;
        tampered = true;
      }
    });
    if (tampered) {
      saveCart();
      renderCart();
      showToast("⚠️ Harga disesuaikan ke harga resmi. Cek kembali keranjang kamu.");
      return false; // batalkan checkout, minta user review ulang
    }
    return true;
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

    // [FIX-11] SEC-04: Validasi harga sebelum buka modal checkout
    if (!validateCartIntegrity()) return;

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

    let total = subtotal + HANDLING_FEE;
    total = total - total * diskon;
    const potongan = (subtotal + HANDLING_FEE) * diskon;

    // [FIX-04] BUG-01: Tambah .toFixed(2) pada grand total di modal
    // Sebelumnya: `$${total}` tanpa toFixed → bisa "3.0000000000000004"
    document.getElementById("review-breakdown").innerHTML = `
      <div class="row"><span>Subtotal</span><span>$${subtotal.toFixed(2)}</span></div>
      <div class="row"><span>Biaya penanganan</span><span>$${HANDLING_FEE.toFixed(2)}</span></div>
      ${diskon ? `<div class="row"><span>Kupon (-${Math.round(diskon * 100)}%)</span><span>-$${potongan.toFixed(2)}</span></div>` : ""}
      <div class="row grand"><span>Total</span><span>$${total.toFixed(2)}</span></div>
    `;

    reviewModal.classList.add("open");
  }

  function closeReview() {
    reviewModal.classList.remove("open");
  }

  // [FIX-16] CODE-03: Tampilkan konfirmasi pesanan setelah order
  // Sebelumnya: hanya toast 3 detik — tidak ada bukti, nomor order, atau ringkasan
  function placeOrder() {
    // Simpan data order SEBELUM cart dikosongkan
    const orderItems = Object.values(cart).map((item) => ({ ...item }));
    const orderNote = document.getElementById("note").value;
    const subtotal = orderItems.reduce((sum, i) => sum + i.count * i.price, 0);
    const currentDiskon = diskon;
    const orderTotal = (subtotal + HANDLING_FEE) * (1 - currentDiskon);

    closeReview();
    cart = {};
    diskon = 0;
    document.getElementById("note").value = "";
    document.getElementById("coupon").value = "";
    document.getElementById("coupon-msg").textContent = "";
    saveCart(); // [FIX-10]
    renderCart();

    showOrderConfirmation(orderItems, orderTotal, orderNote);
  }

  function showOrderConfirmation(items, total, note) {
    // Buat nomor pesanan unik sementara (di produksi: dari server)
    const orderId = "PP-" + Date.now().toString().slice(-6);
    const overlay = document.getElementById("order-confirm");

    document.getElementById("oc-id").textContent = orderId;
    document.getElementById("oc-total").textContent = total.toFixed(2);

    document.getElementById("oc-items").innerHTML = items
      .map(
        (item) =>
          `<div class="oc-line"><span>${item.name} × ${item.count}</span><span>$${(item.count * item.price).toFixed(2)}</span></div>`
      )
      .join("");

    const noteEl = document.getElementById("oc-note");
    if (note) {
      noteEl.textContent = "Catatan: " + note;
      noteEl.style.display = "block";
    } else {
      noteEl.style.display = "none";
    }

    overlay.classList.add("open");
  }

  /* EVENT KLIK */
  document.addEventListener("click", (event) => {
    const target = event.target;

    if (target.classList.contains("plus-button")) {
      addToCart(target.dataset.id, Number(target.dataset.price));
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
    // [FIX-16] CODE-03: Tutup overlay konfirmasi pesanan
    const orderConfirmOverlay = document.getElementById("order-confirm");
    if (target.id === "oc-close" || target === orderConfirmOverlay) {
      orderConfirmOverlay.classList.remove("open");
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
