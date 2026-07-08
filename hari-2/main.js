// ============================================================
//  PASAR PAGI — mesin keranjang belanja
//  "Ditulis AI." Katanya udah rapi, aman, siap jualan.
//
//  Kodenya JALAN & keliatan meyakinkan. Tapi jangan ketipu:
//  diselipin BUG, CELAH KEAMANAN, dan POLA GELAP (dark pattern).
//  Tugas kamu (TIM KEAMANAN): jalanin, belanja, lalu BEDAH pelan.
//  Kamu gerbang terakhir sebelum ini "dijual" ke orang beneran.
//
//  [FIX #1..#8] = perbaikan hasil bedah. Tiap blok ditandai +
//  dijelaskan alasannya. Lihat Report.md bagian "FIXES".
// ============================================================

document.addEventListener("DOMContentLoaded", () => {
  // Katalog resmi toko. Harga "asli" tercatat di sini.
  // [FIX #4] harga HANYA boleh dibaca dari sini (sumber kebenaran),
  //          bukan dari atribut HTML di tombol yang bisa di-edit DevTools.
  // [FIX #6] stok kini properti resmi produk (bukan Math.random tiap render).
  const products = [
    { id: 1, name: "Apel Fuji", price: 1.5, produceId: "#4131", stock: 12, image: "https://res.cloudinary.com/dgwef8ttm/image/upload/v1736589286/25-01-11-03-50-09-954_deco_m2ofbh.jpg" },
    { id: 2, name: "Jeruk Navel", price: 2.0, produceId: "#4012", stock: 9, image: "https://res.cloudinary.com/dgwef8ttm/image/upload/v1736591406/25-01-11-04-29-12-930_deco_r9gznn.jpg" },
    { id: 3, name: "Pisang", price: 1.2, produceId: "#4011", stock: 15, image: "https://res.cloudinary.com/dgwef8ttm/image/upload/v1736591160/25-01-11-04-24-17-097_deco_htwecb.jpg" },
    { id: 4, name: "Anggur", price: 3.5, produceId: "#4022", stock: 6, image: "https://res.cloudinary.com/dgwef8ttm/image/upload/v1736589285/25-01-11-03-50-38-513_deco_spywdb.jpg" },
    { id: 5, name: "Stroberi", price: 4.5, produceId: "#4252", stock: 7, image: "https://res.cloudinary.com/dgwef8ttm/image/upload/v1736614071/25-01-11-10-44-32-511_deco_doxshi.jpg" },
    { id: 6, name: "Blueberry", price: 5.0, produceId: "#4264", stock: 5, image: "https://res.cloudinary.com/dgwef8ttm/image/upload/v1736614070/25-01-11-10-46-19-754_deco_g51gta.jpg" },
    { id: 7, name: "Nanas", price: 3.0, produceId: "#4430", stock: 8, image: "https://res.cloudinary.com/dgwef8ttm/image/upload/v1736614070/25-01-11-10-46-43-469_deco_lhzog2.jpg" },
    { id: 8, name: "Mangga", price: 2.8, produceId: "#4951", stock: 10, image: "https://res.cloudinary.com/dgwef8ttm/image/upload/v1736614071/25-01-11-10-45-34-043_deco_dmdlw1.jpg" },
    { id: 9, name: "Kiwi", price: 1.9, produceId: "#4301", stock: 11, image: "https://res.cloudinary.com/dgwef8ttm/image/upload/v1736614625/25-01-11-10-55-05-579_deco_zbrqpd.jpg" },
    { id: 10, name: "Semangka (Potong)", price: 3.2, produceId: "#4032", stock: 4, image: "https://res.cloudinary.com/dgwef8ttm/image/upload/v1736614185/25-01-11-10-48-13-815_deco_ogtsmo.jpg" }
  ];

  let cart = {};

  // Biaya penanganan kecil biar operasional toko tetap jalan.
  const HANDLING_FEE = 0.30;

  // [FIX #5] Kupon "rahasia" dihapus dari client. Di toko beneran, daftar
  //          kupon valid & keputusan diskon HARUS divalidasi server-side.
  //          Di sini kita simulasikan: ada daftar diskon yang diizinkan.
  //          Client tidak tahu "apa syaratnya".
  //
  //          CATATAN PENTING (etika + keamanan): ini masih simulasi client-side
  //          untuk latihan. Di produksi, validateCoupon() ada di SERVER.
  //          Lihat Report.md FIX #5.
  const KUPON_VALID = {
    // kupon -> { diskon, label }  (diskon = pecahan potongan, 0 < d <= 0.9)
    "TEMANFARMER": { diskon: 0.10, label: "Potongan 10% (kupon petani)" }
  };
  let diskonAktif = 0; // 0 = tanpa diskon; nilai diskon yang sedang berlaku

  const productSection = document.getElementById("product-section");
  const cartDetailsEl = document.getElementById("cart-details");
  const totalPriceEl = document.getElementById("modal-total-price");
  const cartCountEl = document.getElementById("cart-count");
  const reviewModal = document.getElementById("review-modal");
  // [FIX #7] elemen rincian biaya di sidebar (agar fee transparan dari awal).
  const feeRowEl = document.getElementById("cart-fee-row");
  const subtotalRowEl = document.getElementById("cart-subtotal-row");

  // Batas aman input jumlah.
  // [FIX #8] bounds defensif: jumlah harus integer di rentang masuk akal.
  const MIN_QTY = 1;
  const MAX_QTY = 99;

  /* ---------- HELPERS ---------- */

  // [FIX #1] Format uang selalu 2 desimal. Alasan: floating-point JS bikin
  //          13.80*0.1 = 1.379999999999999. Uang WAJIB tampil rapi & akurat.
  //          (Untuk toko beneran: lebih baik simpan uang sebagai integer sen
  //           lalu format saat tampil. Lihat Report.md.)
  function formatUang(angka) {
    if (!Number.isFinite(angka)) return "0.00"; // pengaman ekstra vs NaN/Infinity
    return angka.toFixed(2);
  }

  // [FIX #8] SATU fungsi perhitungan total = single source of truth.
  //          Sebelumnya, renderCart() dan openReview() masing-masing menghitung
  //          total sendiri -> bisa tidak sinkron. Sekarang keduanya memanggil ini.
  //          Mengembalikan { subtotal, fee, potongan, total } supaya rincian
  //          konsisten di sidebar maupun modal.
  function computeTotal() {
    let subtotal = 0;
    Object.values(cart).forEach((item) => {
      subtotal += item.count * item.price;
    });
    const fee = Object.keys(cart).length > 0 ? HANDLING_FEE : 0;
    const dasar = subtotal + fee;
    // [FIX #5/8] diskonAktif sudah di-clamp saat applyCoupon, tapi kita clamp
    //            lagi di sini (defense in depth) supaya nilai aneh tidak lolos.
    const d = Math.min(0.9, Math.max(0, diskonAktif));
    const potongan = dasar * d;
    const total = dasar - potongan;
    return { subtotal, fee, potongan, total, diskon: d };
  }

  /* RENDER PRODUK */
  function renderProducts() {
    productSection.innerHTML = "";

    products.forEach((product) => {
      const quantity = cart[product.id] ? cart[product.id].count : 0;
      // [FIX #6] sisa stok dibaca dari data resmi produk (product.stock),
      //          dikurangi jumlah yang ada di keranjang. BUKAN Math.random.
      const sisa = Math.max(0, product.stock - quantity);

      const productCard = document.createElement("article");
      productCard.classList.add("product");
      // [FIX #4] data-price DIGHAPUS dari tombol. Harga tidak boleh dibaca
      //          dari DOM. addToCart sekarang mencari harga di katalog.
      productCard.innerHTML = `
        <p class="produce-id">${product.produceId}</p>
        <img src="${product.image}" alt="${product.name}" class="product-image">
        <div class="item-meta">
          <h2>${product.name}</h2>
          <p class="price">$${formatUang(product.price)}</p>
        </div>
        <p class="stock">sisa ${sisa} hari ini</p>
        <div class="quantity-controls">
          <button class="quantity-button minus-button" data-id="${product.id}">−</button>
          <span class="quantity-display" id="quantity-${product.id}">${quantity}</span>
          <button class="quantity-button plus-button" data-id="${product.id}">+</button>
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

    if (Object.keys(cart).length === 0) {
      cartDetailsEl.innerHTML = `<p class="empty-cart">Keranjang kamu masih kosong.</p>`;
      totalPriceEl.textContent = "0.00";
      // [FIX #7] sembunyikan rincian fee saat keranjang kosong.
      if (feeRowEl) feeRowEl.style.display = "none";
      if (subtotalRowEl) subtotalRowEl.style.display = "none";
      updateCartCount();
      renderProducts();
      return;
    }

    Object.values(cart).forEach((item) => {
      const itemTotal = item.count * item.price;
      const listItem = document.createElement("div");
      listItem.classList.add("cart-item");
      // [FIX #3] item.name & item.price berasal dari katalog (bukan input user),
      //          sehingga aman di innerHTML. Yang BERBAHAYA adalah catatan user.
      listItem.innerHTML = `
        <div class="cart-item-top">
          <div>
            <div class="cart-item-name">${item.name}</div>
            <div class="cart-item-price">$${formatUang(item.price)} / buah</div>
          </div>
          <strong>$${formatUang(itemTotal)}</strong>
        </div>
        <div class="cart-item-controls">
          <input type="number" min="${MIN_QTY}" max="${MAX_QTY}" class="edit-quantity-input" value="${item.count}" data-id="${item.id}">
          <i class="fas fa-trash delete-icon" data-id="${item.id}"></i>
        </div>
      `;
      cartDetailsEl.appendChild(listItem);
    });

    // Preview catatan buat petani.
    // [FIX #3] Catatan user adalah INPUT -> RENTAN XSS. Pakai textContent,
    //          BUKAN innerHTML. Konsisten dengan yang sudah benar di openReview.
    const note = document.getElementById("note").value;
    if (note) {
      const preview = document.createElement("div");
      preview.className = "note-preview";
      preview.textContent = "Catatan: " + note; // textContent = aman dari XSS
      cartDetailsEl.appendChild(preview);
    }

    // [FIX #1/8] Total dihitung SATU kali di computeTotal, lalu diformat.
    const ringkas = computeTotal();
    totalPriceEl.textContent = formatUang(ringkas.total);

    // [FIX #7] Tampilkan rincian fee di sidebar sejak awal (transparansi).
    if (subtotalRowEl) {
      subtotalRowEl.style.display = "flex";
      subtotalRowEl.innerHTML =
        `<span>Subtotal</span><span>$${formatUang(ringkas.subtotal)}</span>`;
    }
    if (feeRowEl) {
      feeRowEl.style.display = "flex";
      feeRowEl.innerHTML =
        `<span>Biaya penanganan</span><span>$${formatUang(HANDLING_FEE)}</span>`;
    }

    updateCartCount();
    renderProducts();
  }

  /* TAMBAH BARANG */
  // [FIX #4] Signature diubah: addToCart(id) — tanpa argumen harga.
  //          Kode asli menulis harga di data-price DAN mengambilnya dari sana.
  //          Cara aman: tombol kirim id saja, harga dicari di katalog products.
  function addToCart(id) {
    const product = products.find((item) => item.id == id);
    if (!product) return;
    if (!cart[id]) {
      cart[id] = { id: product.id, name: product.name, price: product.price, count: 0 };
    }
    // [FIX #4] JANGAN timpa cart[id].price dari argumen. Harga resmi sudah
    //          ada di product.price (dari katalog). Tidak menerima input harga.
    if (cart[id].count >= MAX_QTY) return; // [FIX #8] cegah jumlah ekstrem
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
  // [FIX #2] Input user divalidasi: tolak NaN, paksa integer, batasi rentang.
  //          Sebelumnya parseInt("") = NaN, lalu NaN<=0 false -> count=NaN
  //          merambat ke total. Sekarang input kotor ditolak di batas.
  function updateQuantity(id, quantity) {
    if (!cart[id]) return;
    if (!Number.isFinite(quantity)) return;     // tolak NaN / Infinity
    let q = Math.floor(quantity);               // paksa integer (parseInt potong desimal diam-diam)
    if (q < MIN_QTY) {                          // 0 / minus -> hapus item
      delete cart[id];
    } else {
      cart[id].count = Math.min(q, MAX_QTY);    // [FIX #8] cap atas
    }
    renderCart();
  }

  /* KUPON */
  // [FIX #5] Diskon di-CLAMP ke rentang [0, 0.9]. Tidak boleh 1 (gratis 100%)
  //          atau minus. Kupon divalidasi lewat tabel KUPON_VALID.
  //          Catatan: di produksi, fungsi ini = panggilan API server.
  function applyCoupon() {
    const code = document.getElementById("coupon").value.trim();
    const msg = document.getElementById("coupon-msg");
    const kupon = KUPON_VALID[code];
    if (kupon) {
      diskonAktif = Math.max(0, Math.min(kupon.diskon, 0.9)); // clamp defensif
      msg.textContent = "Kupon aktif! " + kupon.label + ".";
      msg.style.color = "#6e7b61";
    } else {
      diskonAktif = 0;
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
    const ringkas = computeTotal();
    Object.values(cart).forEach((item) => {
      const line = item.count * item.price;
      const row = document.createElement("div");
      row.className = "review-line";
      row.innerHTML = `<span>${item.name} x ${item.count}</span><span>$${formatUang(line)}</span>`;
      itemsEl.appendChild(row);
    });

    const noteWrap = document.getElementById("review-note-wrap");
    noteWrap.innerHTML = "";
    const note = document.getElementById("note").value;
    if (note) {
      const n = document.createElement("div");
      n.className = "review-note";
      n.textContent = "Catatan: " + note; // [FIX #3] textContent = aman XSS (sudah benar dari awal)
      noteWrap.appendChild(n);
    }

    document.getElementById("review-breakdown").innerHTML = `
      <div class="row"><span>Subtotal</span><span>$${formatUang(ringkas.subtotal)}</span></div>
      <div class="row"><span>Biaya penanganan</span><span>$${formatUang(HANDLING_FEE)}</span></div>
      ${ringkas.diskon ? `<div class="row"><span>Kupon</span><span>-$${formatUang(ringkas.potongan)}</span></div>` : ""}
      <div class="row grand"><span>Total</span><span>$${formatUang(ringkas.total)}</span></div>
    `;

    reviewModal.classList.add("open");
  }

  function closeReview() {
    reviewModal.classList.remove("open");
  }

  function placeOrder() {
    closeReview();
    cart = {};
    diskonAktif = 0;
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
      addToCart(target.dataset.id); // [FIX #4] kirim id saja, tanpa harga
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
