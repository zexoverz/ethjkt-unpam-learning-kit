// ============================================================
//  PASAR PAGI — mesin keranjang belanja (VERSI SUDAH DIPERBAIKI)
//
//  Perubahan utama dibanding versi asli:
//  1. Harga SELALU diambil ulang dari katalog `products`, bukan
//     dari atribut data-price di tombol (mencegah manipulasi harga).
//  2. Semua input pengguna (catatan) di-escape sebelum dirender
//     (mencegah XSS).
//  3. Kuantitas divalidasi ketat: harus bilangan bulat positif,
//     dan dibatasi oleh stok asli (bukan angka acak).
//  4. Semua nominal uang selalu diformat dengan toFixed(2).
//  5. Biaya penanganan ditampilkan sejak di keranjang, bukan cuma
//     muncul mendadak di modal review (transparansi biaya).
//  6. Stok nyata per produk (tidak di-random ulang tiap render),
//     dan tombol "+" dinonaktifkan kalau stok habis.
// ============================================================

document.addEventListener("DOMContentLoaded", () => {
  // Katalog resmi toko. Ini SATU-SATUNYA sumber kebenaran untuk harga & stok.
  const products = [
    { id: 1,  name: "Apel Fuji",       price: 1.5, produceId: "#4131", stock: 5, image: "https://res.cloudinary.com/dgwef8ttm/image/upload/v1736589286/25-01-11-03-50-09-954_deco_m2ofbh.jpg" },
    { id: 2,  name: "Jeruk Navel",     price: 2.0, produceId: "#4012", stock: 4, image: "https://res.cloudinary.com/dgwef8ttm/image/upload/v1736591406/25-01-11-04-29-12-930_deco_r9gznn.jpg" },
    { id: 3,  name: "Pisang",          price: 1.2, produceId: "#4011", stock: 6, image: "https://res.cloudinary.com/dgwef8ttm/image/upload/v1736591160/25-01-11-04-24-17-097_deco_htwecb.jpg" },
    { id: 4,  name: "Anggur",          price: 3.5, produceId: "#4022", stock: 3, image: "https://res.cloudinary.com/dgwef8ttm/image/upload/v1736589285/25-01-11-03-50-38-513_deco_spywdb.jpg" },
    { id: 5,  name: "Stroberi",        price: 4.5, produceId: "#4252", stock: 2, image: "https://res.cloudinary.com/dgwef8ttm/image/upload/v1736614071/25-01-11-10-44-32-511_deco_doxshi.jpg" },
    { id: 6,  name: "Blueberry",       price: 5.0, produceId: "#4264", stock: 3, image: "https://res.cloudinary.com/dgwef8ttm/image/upload/v1736614070/25-01-11-10-46-19-754_deco_g51gta.jpg" },
    { id: 7,  name: "Nanas",           price: 3.0, produceId: "#4430", stock: 4, image: "https://res.cloudinary.com/dgwef8ttm/image/upload/v1736614070/25-01-11-10-46-43-469_deco_lhzog2.jpg" },
    { id: 8,  name: "Mangga",          price: 2.8, produceId: "#4951", stock: 5, image: "https://res.cloudinary.com/dgwef8ttm/image/upload/v1736614071/25-01-11-10-45-34-043_deco_dmdlw1.jpg" },
    { id: 9,  name: "Kiwi",            price: 1.9, produceId: "#4301", stock: 4, image: "https://res.cloudinary.com/dgwef8ttm/image/upload/v1736614625/25-01-11-10-55-05-579_deco_zbrqpd.jpg" },
    { id: 10, name: "Semangka (Potong)", price: 3.2, produceId: "#4032", stock: 3, image: "https://res.cloudinary.com/dgwef8ttm/image/upload/v1736614185/25-01-11-10-48-13-815_deco_ogtsmo.jpg" }
  ];

  let cart = {};

  // Biaya penanganan tetap. Sekarang ditampilkan sejak awal di keranjang.
  const HANDLING_FEE = 0.30;

  // CATATAN KEAMANAN: kode kupon TIDAK BOLEH lagi disimpan/divalidasi di
  // client dalam aplikasi produksi. Di sini validasi kupon dipindah ke
  // fungsi yang mensimulasikan pemanggilan server (lihat validateCouponWithServer).
  // Ini hanya demo front-end; pada implementasi nyata, endpoint backend
  // yang menyimpan & memvalidasi kode kupon, bukan file JS publik.
  let diskon = 0; // 0 = tanpa diskon, 0.9 = potong 90%

  const productSection = document.getElementById("product-section");
  const cartDetailsEl = document.getElementById("cart-details");
  const totalPriceEl = document.getElementById("modal-total-price");
  const cartCountEl = document.getElementById("cart-count");
  const reviewModal = document.getElementById("review-modal");

  /* Helper: escape HTML supaya input pengguna tidak pernah dieksekusi sebagai kode. */
  function escapeHtml(str) {
    const div = document.createElement("div");
    div.textContent = str;
    return div.innerHTML;
  }

  /* Helper: format uang selalu 2 desimal. */
  function formatMoney(amount) {
    return amount.toFixed(2);
  }

  /* RENDER PRODUK */
  function renderProducts() {
    productSection.innerHTML = "";

    products.forEach((product) => {
      const inCart = cart[product.id] ? cart[product.id].count : 0;
      const sisa = Math.max(product.stock - inCart, 0); // stok asli, bukan acak
      const habis = sisa <= 0;

      const productCard = document.createElement("article");
      productCard.classList.add("product");
      productCard.innerHTML = `
        <p class="produce-id">${escapeHtml(product.produceId)}</p>
        <img src="${product.image}" alt="${escapeHtml(product.name)}" class="product-image">
        <div class="item-meta">
          <h2>${escapeHtml(product.name)}</h2>
          <p class="price">$${formatMoney(product.price)}</p>
        </div>
        <p class="stock">${habis ? "stok habis" : `tinggal ${sisa} lagi hari ini!`}</p>
        <div class="quantity-controls">
          <button class="quantity-button minus-button" data-id="${product.id}">−</button>
          <span class="quantity-display" id="quantity-${product.id}">${inCart}</span>
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
      totalPriceEl.textContent = "0.00";
      updateCartCount();
      renderProducts();
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
            <div class="cart-item-name">${escapeHtml(item.name)}</div>
            <div class="cart-item-price">$${formatMoney(item.price)} / buah</div>
          </div>
          <strong>$${formatMoney(itemTotal)}</strong>
        </div>
        <div class="cart-item-controls">
          <input type="number" min="1" step="1" class="edit-quantity-input" value="${item.count}" data-id="${item.id}">
          <i class="fas fa-trash delete-icon" data-id="${item.id}"></i>
        </div>
      `;
      cartDetailsEl.appendChild(listItem);
    });

    // Catatan untuk petani — di-escape dulu supaya aman dari XSS.
    const note = document.getElementById("note").value;
    if (note) {
      const preview = document.createElement("div");
      preview.className = "note-preview";
      preview.innerHTML = "Catatan: " + escapeHtml(note);
      cartDetailsEl.appendChild(preview);
    }

    // Biaya penanganan ditampilkan transparan di sini, bukan disembunyikan
    // sampai modal review checkout (menghindari dark pattern "drip pricing").
    const feeLine = document.createElement("div");
    feeLine.className = "cart-fee-line";
    feeLine.innerHTML = `<span>Biaya penanganan</span><span>$${formatMoney(HANDLING_FEE)}</span>`;
    cartDetailsEl.appendChild(feeLine);

    let total = totalPrice + HANDLING_FEE;
    total = total - total * diskon;

    totalPriceEl.textContent = formatMoney(total);
    updateCartCount();
    renderProducts();
  }

  /* TAMBAH BARANG — harga & stok selalu diambil dari katalog resmi */
  function addToCart(id) {
    const product = products.find((item) => item.id == id);
    if (!product) return;

    const currentCount = cart[id] ? cart[id].count : 0;
    if (currentCount >= product.stock) {
      showToast("Stok tidak mencukupi.");
      return;
    }

    if (!cart[id]) {
      cart[id] = { ...product, count: 0 };
    }
    // Harga TIDAK PERNAH diambil dari DOM/tombol. Selalu dari `product.price`.
    cart[id].price = product.price;
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

  /* UBAH JUMLAH — divalidasi ketat: harus bilangan bulat positif dan <= stok */
  function updateQuantity(id, rawValue) {
    if (!cart[id]) return;

    const quantity = Number(rawValue);

    // Tolak input kosong, bukan-angka, desimal, atau negatif.
    if (rawValue === "" || !Number.isInteger(quantity) || quantity < 0) {
      showToast("Jumlah tidak valid.");
      renderCart(); // kembalikan tampilan ke nilai valid terakhir
      return;
    }

    if (quantity === 0) {
      delete cart[id];
      renderCart();
      return;
    }

    const product = products.find((p) => p.id == id);
    const maxAllowed = product ? product.stock : quantity;
    if (quantity > maxAllowed) {
      showToast(`Stok cuma tersedia ${maxAllowed}.`);
      cart[id].count = maxAllowed;
      renderCart();
      return;
    }

    cart[id].count = quantity;
    renderCart();
  }

  /* KUPON — di aplikasi nyata ini WAJIB dipindah ke backend. */
  async function applyCoupon() {
    const code = document.getElementById("coupon").value.trim();
    const msg = document.getElementById("coupon-msg");

    const valid = await validateCouponWithServer(code);
    if (valid) {
      diskon = 0.9;
      msg.textContent = "Kupon aktif! Potongan 90%.";
      msg.style.color = "#6e7b61";
    } else {
      diskon = 0;
      msg.textContent = "Kode kupon salah.";
      msg.style.color = "#b96f5c";
    }
    renderCart();
  }

  /* Placeholder validasi sisi-server. Ganti dengan fetch() ke endpoint asli. */
  async function validateCouponWithServer(code) {
    // TODO: ganti dengan pemanggilan API sungguhan, misalnya:
    // const res = await fetch('/api/validate-coupon', { method: 'POST', body: JSON.stringify({ code }) });
    // return (await res.json()).valid;
    return false;
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
      row.innerHTML = `<span>${escapeHtml(item.name)} x ${item.count}</span><span>$${formatMoney(line)}</span>`;
      itemsEl.appendChild(row);
    });

    const noteWrap = document.getElementById("review-note-wrap");
    noteWrap.innerHTML = "";
    const note = document.getElementById("note").value;
    if (note) {
      const n = document.createElement("div");
      n.className = "review-note";
      n.textContent = "Catatan: " + note; // textContent sudah aman
      noteWrap.appendChild(n);
    }

    let total = subtotal + HANDLING_FEE;
    total = total - total * diskon;
    const potongan = (subtotal + HANDLING_FEE) * diskon;

    document.getElementById("review-breakdown").innerHTML = `
      <div class="row"><span>Subtotal</span><span>$${formatMoney(subtotal)}</span></div>
      <div class="row"><span>Biaya penanganan</span><span>$${formatMoney(HANDLING_FEE)}</span></div>
      ${diskon ? `<div class="row"><span>Kupon (-90%)</span><span>-$${formatMoney(potongan)}</span></div>` : ""}
      <div class="row grand"><span>Total</span><span>$${formatMoney(total)}</span></div>
    `;

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

    if (target.classList.contains("plus-button") && !target.disabled) {
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
      updateQuantity(target.dataset.id, target.value);
    }
    if (target.id === "note") {
      renderCart();
    }
  });

  /* MULAI */
  renderProducts();
  renderCart();
});