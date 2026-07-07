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
    { id: 1,  name: "Apel Fuji",         price: 1.5, produceId: "#4131", stock: 12, image: "https://res.cloudinary.com/dgwef8ttm/image/upload/v1736589286/25-01-11-03-50-09-954_deco_m2ofbh.jpg" },
    { id: 2,  name: "Jeruk Navel",       price: 2.0, produceId: "#4012", stock: 9, image: "https://res.cloudinary.com/dgwef8ttm/image/upload/v1736591406/25-01-11-04-29-12-930_deco_r9gznn.jpg" },
    { id: 3,  name: "Pisang",            price: 1.2, produceId: "#4011", stock: 14, image: "https://res.cloudinary.com/dgwef8ttm/image/upload/v1736591160/25-01-11-04-24-17-097_deco_htwecb.jpg" },
    { id: 4,  name: "Anggur",            price: 3.5, produceId: "#4022", stock: 7, image: "https://res.cloudinary.com/dgwef8ttm/image/upload/v1736589285/25-01-11-03-50-38-513_deco_spywdb.jpg" },
    { id: 5,  name: "Stroberi",          price: 4.5, produceId: "#4252", stock: 6, image: "https://res.cloudinary.com/dgwef8ttm/image/upload/v1736614071/25-01-11-10-44-32-511_deco_doxshi.jpg" },
    { id: 6,  name: "Blueberry",         price: 5.0, produceId: "#4264", stock: 5, image: "https://res.cloudinary.com/dgwef8ttm/image/upload/v1736614070/25-01-11-10-46-19-754_deco_g51gta.jpg" },
    { id: 7,  name: "Nanas",             price: 3.0, produceId: "#4430", stock: 8, image: "https://res.cloudinary.com/dgwef8ttm/image/upload/v1736614070/25-01-11-10-46-43-469_deco_lhzog2.jpg" },
    { id: 8,  name: "Mangga",            price: 2.8, produceId: "#4951", stock: 10, image: "https://res.cloudinary.com/dgwef8ttm/image/upload/v1736614071/25-01-11-10-45-34-043_deco_dmdlw1.jpg" },
    { id: 9,  name: "Kiwi",              price: 1.9, produceId: "#4301", stock: 11, image: "https://res.cloudinary.com/dgwef8ttm/image/upload/v1736614625/25-01-11-10-55-05-579_deco_zbrqpd.jpg" },
    { id: 10, name: "Semangka (Potong)", price: 3.2, produceId: "#4032", stock: 4, image: "https://res.cloudinary.com/dgwef8ttm/image/upload/v1736614185/25-01-11-10-48-13-815_deco_ogtsmo.jpg" }
  ];

  let cart = {};

  // Biaya penanganan kecil biar operasional toko tetap jalan.
  const HANDLING_FEE = 0.30;

  // Kupon demo publik. Di app statis, semua nilai client-side tetap bisa dilihat.
  const KUPON_DEMO = "TEMANFARMER";
  let diskon = 0; // 0 = tanpa diskon, 0.9 = potong 90%

  const productSection = document.getElementById("product-section");
  const cartDetailsEl = document.getElementById("cart-details");
  const totalPriceEl = document.getElementById("modal-total-price");
  const cartCountEl = document.getElementById("cart-count");
  const reviewModal = document.getElementById("review-modal");
  const cartBreakdownEl = document.getElementById("cart-breakdown");

  function formatMoney(amount) {
    return Number(amount).toFixed(2);
  }

  function getProduct(id) {
    return products.find((item) => String(item.id) === String(id));
  }

  function clampQuantity(id, quantity) {
    const product = getProduct(id);
    if (!product) return 0;
    const next = Number(quantity);
    if (!Number.isInteger(next) || next <= 0) return 0;
    return Math.min(next, product.stock);
  }

  function sanitizeCart() {
    let changed = false;

    Object.keys(cart).forEach((id) => {
      const product = getProduct(id);
      if (!product) {
        delete cart[id];
        changed = true;
        return;
      }

      const next = clampQuantity(id, cart[id].count);
      if (next === 0) {
        delete cart[id];
        changed = true;
        return;
      }

      if (cart[id].count !== next) {
        cart[id].count = next;
        changed = true;
      }

      cart[id].price = product.price;
    });

    return changed;
  }

  /* RENDER PRODUK */
  function renderProducts() {
    productSection.innerHTML = "";

    products.forEach((product) => {
      const quantity = cart[product.id] ? cart[product.id].count : 0;
      const sisa = Math.max(0, product.stock - quantity);
      const atLimit = quantity >= product.stock;

      const productCard = document.createElement("article");
      productCard.classList.add("product");
      productCard.innerHTML = `
        <p class="produce-id">${product.produceId}</p>
        <img src="${product.image}" alt="${product.name}" class="product-image">
        <div class="item-meta">
          <h2>${product.name}</h2>
          <p class="price">$${formatMoney(product.price)}</p>
        </div>
        <p class="stock">stok tersedia: ${sisa}</p>
        <div class="quantity-controls">
          <button class="quantity-button minus-button" data-id="${product.id}">−</button>
          <span class="quantity-display" id="quantity-${product.id}">${quantity}</span>
          <button class="quantity-button plus-button" data-id="${product.id}" ${atLimit ? "disabled" : ""}>+</button>
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
    const fixed = sanitizeCart();
    cartDetailsEl.innerHTML = "";
    let totalPrice = 0;

    if (Object.keys(cart).length === 0) {
      cartDetailsEl.innerHTML = `<p class="empty-cart">Keranjang kamu masih kosong.</p>`;
      totalPriceEl.textContent = formatMoney(0);
      cartBreakdownEl.innerHTML = "";
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
            <div class="cart-item-price">$${formatMoney(item.price)} / buah</div>
          </div>
          <strong>$${formatMoney(itemTotal)}</strong>
        </div>
        <div class="cart-item-controls">
          <input type="number" min="1" max="${item.stock}" class="edit-quantity-input" value="${item.count}" data-id="${item.id}">
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
      preview.textContent = "Catatan: " + note;
      cartDetailsEl.appendChild(preview);
    }

    // Total akhir ditampilkan bersama rincian yang sama di sidebar.
    const subtotal = totalPrice;
    const handling = HANDLING_FEE;
    const diskonNilai = (subtotal + handling) * diskon;
    const total = subtotal + handling - diskonNilai;

    totalPriceEl.textContent = formatMoney(total);
    cartBreakdownEl.innerHTML = `
      <div class="row"><span>Subtotal</span><span>$${formatMoney(subtotal)}</span></div>
      <div class="row"><span>Biaya penanganan</span><span>$${formatMoney(handling)}</span></div>
      ${diskon ? `<div class="row"><span>Diskon kupon</span><span>-$${formatMoney(diskonNilai)}</span></div>` : ""}
    `;
    if (fixed) {
      showToast("Jumlah barang disesuaikan ke stok yang tersedia.");
    }
    updateCartCount();
    renderProducts();
  }

  /* TAMBAH BARANG */
  function addToCart(id) {
    const product = getProduct(id);
    if (!product) return;

    if (!cart[id]) {
      cart[id] = { ...product, count: 0 };
    }
    if (cart[id].count >= product.stock) {
      showToast("Stok maksimal untuk item ini sudah tercapai.");
      return;
    }
    cart[id].price = product.price; // pakai harga dari katalog, bukan dari DOM
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
    const next = clampQuantity(id, quantity);
    if (next === 0) {
      delete cart[id];
    } else {
      cart[id].count = next;
    }
    renderCart();
  }

  /* KUPON */
  function applyCoupon() {
    const code = document.getElementById("coupon").value;
    const msg = document.getElementById("coupon-msg");
    if (code === KUPON_DEMO) {
      diskon = 0.9;
      msg.textContent = "Kupon demo aktif. Potongan 90% terlihat di ringkasan.";
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
    if (sanitizeCart()) {
      renderCart();
    }
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
      row.innerHTML = `<span>${item.name} x ${item.count}</span><span>$${formatMoney(line)}</span>`;
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
      const product = getProduct(target.dataset.id);
      if (!product || !Number.isInteger(quantity) || quantity <= 0) {
        target.value = cart[target.dataset.id] ? cart[target.dataset.id].count : "";
        return;
      }
      if (quantity > product.stock) {
        target.value = product.stock;
        updateQuantity(target.dataset.id, product.stock);
        showToast("Jumlah dibatasi ke stok maksimum.");
        return;
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
