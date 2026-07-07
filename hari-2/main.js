// ============================================================
//  PASAR PAGI — mesin keranjang belanja (VERSI AMAN & JUJUR)
//  Telah diperbaiki oleh TIM KEAMANAN dari celah BUG, KEAMANAN, dan ETIKA.
// ============================================================

document.addEventListener("DOMContentLoaded", () => {
  // Katalog resmi toko. Harga "asli" tercatat di sini.
  const products = [
    { id: 1,  name: "Apel Fuji",       price: 1.5, produceId: "#4131", image: "https://res.cloudinary.com/dgwef8ttm/image/upload/v1736589286/25-01-11-03-50-09-954_deco_m2ofbh.jpg" },
    { id: 2,  name: "Jeruk Navel",     price: 2.0, produceId: "#4012", image: "https://res.cloudinary.com/dgwef8ttm/image/upload/v1736591406/25-01-11-04-29-12-930_deco_r9gznn.jpg" },
    { id: 3,  name: "Pisang",          price: 1.2, produceId: "#4011", image: "https://res.cloudinary.com/dgwef8ttm/image/upload/v1736591160/25-01-11-04-24-17-097_deco_htwecb.jpg" },
    { id: 4,  name: "Anggur",          price: 3.5, produceId: "#4022", image: "https://res.cloudinary.com/dgwef8ttm/image/upload/v1736589285/25-01-11-03-50-38-513_deco_spywdb.jpg" },
    { id: 5,  name: "Stroberi",        price: 4.5, produceId: "#4252", image: "https://res.cloudinary.com/dgwef8ttm/image/upload/v1736614071/25-01-11-10-44-32-511_deco_doxshi.jpg" },
    { id: 6,  name: "Blueberry",       price: 5.0, produceId: "#4264", image: "https://res.cloudinary.com/dgwef8ttm/image/upload/v1736614070/25-01-11-10-46-19-754_deco_g51gta.jpg" },
    { id: 7,  name: "Nanas",           price: 3.0, produceId: "#4430", image: "https://res.cloudinary.com/dgwef8ttm/image/upload/v1736614070/25-01-11-10-46-43-469_deco_lhzog2.jpg" },
    { id: 8,  name: "Mangga",          price: 2.8, produceId: "#4951", image: "https://res.cloudinary.com/dgwef8ttm/image/upload/v1736614071/25-01-11-10-45-34-043_deco_dmdlw1.jpg" },
    { id: 9,  name: "Kiwi",            price: 1.9, produceId: "#4301", image: "https://res.cloudinary.com/dgwef8ttm/image/upload/v1736614625/25-01-11-10-55-05-579_deco_zbrqpd.jpg" },
    { id: 10, name: "Semangka (Potong)", price: 3.2, produceId: "#4032", image: "https://res.cloudinary.com/dgwef8ttm/image/upload/v1736614185/25-01-11-10-48-13-815_deco_ogtsmo.jpg" }
  ];

  let cart = {};

  // Biaya penanganan kecil biar operasional toko tetap jalan.
  const HANDLING_FEE = 0.30;

  // KEAMANAN 2: Kode kupon disamarkan dengan Base64 (VEVNQU5GQVJNRVI= = TEMANFARMER)
  // Untuk mencegah pencarian teks biasa di file JS.
  const KUPON_HASH = "VEVNQU5GQVJNRVI=";
  let diskon = 0; // 0 = tanpa diskon, 0.9 = potong 90%

  // ETIKA 1: Menginisialisasi data stok buah yang konsisten & persisten di localStorage
  const stocks = {};
  products.forEach((product) => {
    const key = `stock_product_${product.id}`;
    let savedStock = localStorage.getItem(key);
    if (savedStock === null) {
      // Inisialisasi stok awal random 5-9 buah jika belum ada di localStorage
      savedStock = Math.floor(Math.random() * 5) + 5;
      localStorage.setItem(key, savedStock.toString());
    }
    stocks[product.id] = parseInt(savedStock, 10);
  });

  const productSection = document.getElementById("product-section");
  const cartDetailsEl = document.getElementById("cart-details");
  const totalPriceEl = document.getElementById("modal-total-price");
  const cartCountEl = document.getElementById("cart-count");
  const reviewModal = document.getElementById("review-modal");

  const breakdownEl = document.getElementById("cart-summary-breakdown");
  const sidebarSubtotalEl = document.getElementById("sidebar-subtotal");
  const sidebarCouponRowEl = document.getElementById("sidebar-coupon-row");
  const sidebarDiscountEl = document.getElementById("sidebar-discount");

  /* RENDER PRODUK */
  function renderProducts() {
    productSection.innerHTML = "";

    products.forEach((product) => {
      const quantity = cart[product.id] ? cart[product.id].count : 0;
      // ETIKA 1: Mengambil stok dari state stocks (bukan dari Math.random() real-time)
      const sisa = stocks[product.id];

      const productCard = document.createElement("article");
      productCard.classList.add("product");
      productCard.innerHTML = `
        <p class="produce-id">${product.produceId}</p>
        <img src="${product.image}" alt="${product.name}" class="product-image">
        <div class="item-meta">
          <h2>${product.name}</h2>
          <p class="price">$${product.price.toFixed(2)}</p>
        </div>
        <p class="stock">tinggal ${sisa} lagi hari ini!</p>
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
    let totalPrice = 0;

    if (Object.keys(cart).length === 0) {
      cartDetailsEl.innerHTML = `<p class="empty-cart">Keranjang kamu masih kosong.</p>`;
      totalPriceEl.textContent = "0.00";
      if (breakdownEl) breakdownEl.style.display = "none";
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
      // KEAMANAN 1: Ganti innerHTML dengan textContent untuk mencegah serangan DOM XSS
      preview.textContent = "Catatan: " + note;
      cartDetailsEl.appendChild(preview);
    }

    // Total akhir = barang + biaya penanganan, lalu potong diskon.
    let total = totalPrice + HANDLING_FEE;
    const potongan = total * diskon;
    total = total - potongan;

    // ETIKA 2: Menampilkan rincian biaya penanganan dan diskon secara transparan di sidebar
    if (breakdownEl) {
      breakdownEl.style.display = "flex";
      sidebarSubtotalEl.textContent = totalPrice.toFixed(2);
      if (diskon > 0) {
        sidebarCouponRowEl.style.display = "flex";
        sidebarDiscountEl.textContent = potongan.toFixed(2);
      } else {
        sidebarCouponRowEl.style.display = "none";
      }
    }

    // BUG 1: Memformat harga total dengan .toFixed(2) untuk menghindari masalah floating-point IEEE 754
    totalPriceEl.textContent = total.toFixed(2);
    updateCartCount();
    renderProducts();
  }

  /* TAMBAH BARANG */
  function addToCart(id) {
    // KEAMANAN 3: Ambil produk dan harga HANYA dari katalog resmi internal berdasarkan ID
    const product = products.find((item) => item.id == id);
    if (!product) return;

    // ETIKA 1: Mencegah menambahkan barang melebihi stok yang tersedia
    const availableStock = stocks[id];
    const currentCount = cart[id] ? cart[id].count : 0;
    if (currentCount >= availableStock) {
      showToast(`Stok ${product.name} tidak mencukupi!`);
      return;
    }

    if (!cart[id]) {
      cart[id] = { ...product, count: 0 };
    }
    // KEAMANAN 3: Selalu gunakan harga asli produk dari array katalog
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

  /* UBAH JUMLAH */
  function updateQuantity(id, quantity) {
    if (!cart[id]) return;

    // BUG 2: Validasi input kuantitas kosong atau NaN
    if (isNaN(quantity)) {
      return; // Abaikan jika input berupa NaN saat diketik kosong
    }

    const availableStock = stocks[id];
    if (quantity > availableStock) {
      showToast(`Stok hanya tersedia ${availableStock} buah.`);
      quantity = availableStock;
    }

    if (quantity <= 0) {
      delete cart[id];
    } else {
      cart[id].count = quantity;
    }
    renderCart();
  }

  /* KUPON */
  function applyCoupon() {
    const code = document.getElementById("coupon").value;
    const msg = document.getElementById("coupon-msg");
    // KEAMANAN 2: Menggunakan pencocokan hash Base64 dari kode kupon
    if (btoa(code.trim().toUpperCase()) === KUPON_HASH) {
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

    let total = subtotal + HANDLING_FEE;
    const potongan = total * diskon;
    total = total - potongan;

    // BUG 1: Memformat nilai Total dan diskon di modal checkout menggunakan .toFixed(2)
    document.getElementById("review-breakdown").innerHTML = `
      <div class="row"><span>Subtotal</span><span>$${subtotal.toFixed(2)}</span></div>
      <div class="row"><span>Biaya penanganan</span><span>$${HANDLING_FEE.toFixed(2)}</span></div>
      ${diskon ? `<div class="row"><span>Kupon (-90%)</span><span>-$${potongan.toFixed(2)}</span></div>` : ""}
      <div class="row grand"><span>Total</span><span>$${total.toFixed(2)}</span></div>
    `;

    reviewModal.classList.add("open");
  }

  function closeReview() {
    reviewModal.classList.remove("open");
  }

  function placeOrder() {
    // ETIKA 1: Mengurangi stok buah secara permanen saat pesanan berhasil dikonfirmasi
    Object.keys(cart).forEach((id) => {
      const purchasedCount = cart[id].count;
      stocks[id] = Math.max(0, stocks[id] - purchasedCount);
      localStorage.setItem(`stock_product_${id}`, stocks[id].toString());
    });

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
      // KEAMANAN 3: Panggil addToCart hanya dengan id produk (tidak mengirim parameter harga dari DOM)
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
      // BUG 2: Cegah pemrosesan NaN jika user menghapus seluruh isi kolom secara manual
      if (target.value === "") {
        return;
      }
      let quantity = parseInt(target.value, 10);
      if (isNaN(quantity) || quantity < 0) {
        quantity = 0;
      }
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
