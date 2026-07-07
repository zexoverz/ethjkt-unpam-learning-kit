// ============================================================
//  PASAR PAGI — mesin keranjang belanja
//  "Ditulis AI." Katanya udah rapi, aman, siap jualan.
//
//  Versi awalnya sengaja berisi bug, celah keamanan, dan pola gelap.
//  Versi ini sudah diperbaiki dari temuan audit di reports.md.
// ============================================================

document.addEventListener("DOMContentLoaded", () => {
  // Katalog resmi toko. Harga disimpan dalam sen agar hitungan uang stabil.
  const products = [
    { id: 1,  name: "Apel Fuji",         priceCents: 150, stock: 12, produceId: "#4131", image: "https://res.cloudinary.com/dgwef8ttm/image/upload/v1736589286/25-01-11-03-50-09-954_deco_m2ofbh.jpg" },
    { id: 2,  name: "Jeruk Navel",       priceCents: 200, stock: 10, produceId: "#4012", image: "https://res.cloudinary.com/dgwef8ttm/image/upload/v1736591406/25-01-11-04-29-12-930_deco_r9gznn.jpg" },
    { id: 3,  name: "Pisang",            priceCents: 120, stock: 18, produceId: "#4011", image: "https://res.cloudinary.com/dgwef8ttm/image/upload/v1736591160/25-01-11-04-24-17-097_deco_htwecb.jpg" },
    { id: 4,  name: "Anggur",            priceCents: 350, stock: 8,  produceId: "#4022", image: "https://res.cloudinary.com/dgwef8ttm/image/upload/v1736589285/25-01-11-03-50-38-513_deco_spywdb.jpg" },
    { id: 5,  name: "Stroberi",          priceCents: 450, stock: 6,  produceId: "#4252", image: "https://res.cloudinary.com/dgwef8ttm/image/upload/v1736614071/25-01-11-10-44-32-511_deco_doxshi.jpg" },
    { id: 6,  name: "Blueberry",         priceCents: 500, stock: 5,  produceId: "#4264", image: "https://res.cloudinary.com/dgwef8ttm/image/upload/v1736614070/25-01-11-10-46-19-754_deco_g51gta.jpg" },
    { id: 7,  name: "Nanas",             priceCents: 300, stock: 7,  produceId: "#4430", image: "https://res.cloudinary.com/dgwef8ttm/image/upload/v1736614070/25-01-11-10-46-43-469_deco_lhzog2.jpg" },
    { id: 8,  name: "Mangga",            priceCents: 280, stock: 9,  produceId: "#4951", image: "https://res.cloudinary.com/dgwef8ttm/image/upload/v1736614071/25-01-11-10-45-34-043_deco_dmdlw1.jpg" },
    { id: 9,  name: "Kiwi",              priceCents: 190, stock: 11, produceId: "#4301", image: "https://res.cloudinary.com/dgwef8ttm/image/upload/v1736614625/25-01-11-10-55-05-579_deco_zbrqpd.jpg" },
    { id: 10, name: "Semangka (Potong)", priceCents: 320, stock: 4,  produceId: "#4032", image: "https://res.cloudinary.com/dgwef8ttm/image/upload/v1736614185/25-01-11-10-48-13-815_deco_ogtsmo.jpg" }
  ];

  let cart = {};

  const HANDLING_FEE_CENTS = 30;

  // Promo publik demo. Kupon sensitif tetap harus divalidasi di server.
  const PUBLIC_COUPON = "PASARPAGI10";
  const PUBLIC_COUPON_PERCENT = 10;
  let discountPercent = 0;

  const productSection = document.getElementById("product-section");
  const cartDetailsEl = document.getElementById("cart-details");
  const totalPriceEl = document.getElementById("modal-total-price");
  const subtotalPriceEl = document.getElementById("subtotal-price");
  const handlingFeeEl = document.getElementById("handling-fee");
  const discountRowEl = document.getElementById("discount-row");
  const discountPriceEl = document.getElementById("discount-price");
  const cartCountEl = document.getElementById("cart-count");
  const reviewModal = document.getElementById("review-modal");

  function formatMoney(cents) {
    return (cents / 100).toFixed(2);
  }

  function getProduct(id) {
    return products.find((item) => item.id === Number(id));
  }

  function getCartTotals() {
    const subtotalCents = Object.values(cart).reduce((sum, item) => {
      return sum + item.count * item.priceCents;
    }, 0);
    const discountCents = Math.round((subtotalCents + HANDLING_FEE_CENTS) * discountPercent / 100);
    const totalCents = subtotalCents + HANDLING_FEE_CENTS - discountCents;

    return { subtotalCents, discountCents, totalCents };
  }

  /* RENDER PRODUK */
  function renderProducts() {
    productSection.innerHTML = "";

    products.forEach((product) => {
      const quantity = cart[product.id] ? cart[product.id].count : 0;
      const isMaxed = quantity >= product.stock;

      const productCard = document.createElement("article");
      productCard.classList.add("product");
      productCard.innerHTML = `
        <p class="produce-id">${product.produceId}</p>
        <img src="${product.image}" alt="${product.name}" class="product-image">
        <div class="item-meta">
          <h2>${product.name}</h2>
          <p class="price">$${formatMoney(product.priceCents)}</p>
        </div>
        <p class="stock">Stok tersedia: ${product.stock}</p>
        <div class="quantity-controls">
          <button class="quantity-button minus-button" data-id="${product.id}">−</button>
          <span class="quantity-display" id="quantity-${product.id}">${quantity}</span>
          <button class="quantity-button plus-button" data-id="${product.id}" ${isMaxed ? "disabled" : ""}>+</button>
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
      subtotalPriceEl.textContent = "0.00";
      handlingFeeEl.textContent = "0.00";
      discountPriceEl.textContent = "0.00";
      discountRowEl.hidden = true;
      totalPriceEl.textContent = "0.00";
      updateCartCount();
      renderProducts();
      return;
    }

    Object.values(cart).forEach((item) => {
      const itemTotalCents = item.count * item.priceCents;

      const listItem = document.createElement("div");
      listItem.classList.add("cart-item");
      listItem.innerHTML = `
        <div class="cart-item-top">
          <div>
            <div class="cart-item-name">${item.name}</div>
            <div class="cart-item-price">$${formatMoney(item.priceCents)} / buah</div>
          </div>
          <strong>$${formatMoney(itemTotalCents)}</strong>
        </div>
        <div class="cart-item-controls">
          <input type="number" min="1" max="${item.stock}" class="edit-quantity-input" value="${item.count}" data-id="${item.id}">
          <button type="button" class="delete-button" data-id="${item.id}">Hapus</button>
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

    const { subtotalCents, discountCents, totalCents } = getCartTotals();

    subtotalPriceEl.textContent = formatMoney(subtotalCents);
    handlingFeeEl.textContent = formatMoney(HANDLING_FEE_CENTS);
    discountPriceEl.textContent = formatMoney(discountCents);
    discountRowEl.hidden = discountCents === 0;
    totalPriceEl.textContent = formatMoney(totalCents);
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
      showToast(`Stok ${product.name} hanya ${product.stock}.`);
      renderCart();
      return;
    }

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
    const item = cart[id];
    if (!item) return;

    if (!Number.isInteger(quantity)) {
      showToast("Jumlah harus angka bulat.");
      renderCart();
      return;
    }

    if (quantity <= 0) {
      delete cart[id];
    } else if (quantity > item.stock) {
      item.count = item.stock;
      showToast(`Stok ${item.name} hanya ${item.stock}.`);
    } else {
      item.count = quantity;
    }
    renderCart();
  }

  /* KUPON */
  function applyCoupon() {
    const code = document.getElementById("coupon").value.trim().toUpperCase();
    const msg = document.getElementById("coupon-msg");
    if (code === PUBLIC_COUPON) {
      discountPercent = PUBLIC_COUPON_PERCENT;
      msg.textContent = `Kupon aktif! Potongan ${PUBLIC_COUPON_PERCENT}%.`;
      msg.style.color = "#6e7b61";
    } else {
      discountPercent = 0;
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
    Object.values(cart).forEach((item) => {
      const row = document.createElement("div");
      row.className = "review-line";
      const name = document.createElement("span");
      const price = document.createElement("span");
      name.textContent = `${item.name} x ${item.count}`;
      price.textContent = `$${formatMoney(item.count * item.priceCents)}`;
      row.append(name, price);
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

    const { subtotalCents, discountCents, totalCents } = getCartTotals();

    document.getElementById("review-breakdown").innerHTML = `
      <div class="row"><span>Subtotal</span><span>$${formatMoney(subtotalCents)}</span></div>
      <div class="row"><span>Biaya penanganan</span><span>$${formatMoney(HANDLING_FEE_CENTS)}</span></div>
      ${discountCents ? `<div class="row"><span>Kupon (-${discountPercent}%)</span><span>-$${formatMoney(discountCents)}</span></div>` : ""}
      <div class="row grand"><span>Total</span><span>$${formatMoney(totalCents)}</span></div>
    `;

    reviewModal.classList.add("open");
  }

  function closeReview() {
    reviewModal.classList.remove("open");
  }

  function placeOrder() {
    closeReview();
    cart = {};
    discountPercent = 0;
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
    if (target.classList.contains("delete-button")) {
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
      if (target.value === "") return;
      const quantity = Number(target.value);
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
