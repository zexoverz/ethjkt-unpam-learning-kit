// ============================================================
//  PASAR PAGI - mesin keranjang belanja
// ============================================================

document.addEventListener("DOMContentLoaded", () => {
  const products = [
    { id: 1, name: "Apel Fuji", price: 1.5, stock: 12, produceId: "#4131", image: "https://res.cloudinary.com/dgwef8ttm/image/upload/v1736589286/25-01-11-03-50-09-954_deco_m2ofbh.jpg" },
    { id: 2, name: "Jeruk Navel", price: 2.0, stock: 10, produceId: "#4012", image: "https://res.cloudinary.com/dgwef8ttm/image/upload/v1736591406/25-01-11-04-29-12-930_deco_r9gznn.jpg" },
    { id: 3, name: "Pisang", price: 1.2, stock: 18, produceId: "#4011", image: "https://res.cloudinary.com/dgwef8ttm/image/upload/v1736591160/25-01-11-04-24-17-097_deco_htwecb.jpg" },
    { id: 4, name: "Anggur", price: 3.5, stock: 8, produceId: "#4022", image: "https://res.cloudinary.com/dgwef8ttm/image/upload/v1736589285/25-01-11-03-50-38-513_deco_spywdb.jpg" },
    { id: 5, name: "Stroberi", price: 4.5, stock: 9, produceId: "#4252", image: "https://res.cloudinary.com/dgwef8ttm/image/upload/v1736614071/25-01-11-10-44-32-511_deco_doxshi.jpg" },
    { id: 6, name: "Blueberry", price: 5.0, stock: 7, produceId: "#4264", image: "https://res.cloudinary.com/dgwef8ttm/image/upload/v1736614070/25-01-11-10-46-19-754_deco_g51gta.jpg" },
    { id: 7, name: "Nanas", price: 3.0, stock: 11, produceId: "#4430", image: "https://res.cloudinary.com/dgwef8ttm/image/upload/v1736614070/25-01-11-10-46-43-469_deco_lhzog2.jpg" },
    { id: 8, name: "Mangga", price: 2.8, stock: 13, produceId: "#4951", image: "https://res.cloudinary.com/dgwef8ttm/image/upload/v1736614071/25-01-11-10-45-34-043_deco_dmdlw1.jpg" },
    { id: 9, name: "Kiwi", price: 1.9, stock: 14, produceId: "#4301", image: "https://res.cloudinary.com/dgwef8ttm/image/upload/v1736614625/25-01-11-10-55-05-579_deco_zbrqpd.jpg" },
    { id: 10, name: "Semangka (Potong)", price: 3.2, stock: 6, produceId: "#4032", image: "https://res.cloudinary.com/dgwef8ttm/image/upload/v1736614185/25-01-11-10-48-13-815_deco_ogtsmo.jpg" }
  ];

  let cart = {};
  let diskon = 0;

  const HANDLING_FEE = 0.30;

  const productSection = document.getElementById("product-section");
  const cartDetailsEl = document.getElementById("cart-details");
  const totalPriceEl = document.getElementById("modal-total-price");
  const cartCountEl = document.getElementById("cart-count");
  const reviewModal = document.getElementById("review-modal");

  function formatMoney(amount) {
    return amount.toFixed(2);
  }

  function getCartSubtotal() {
    return Object.values(cart).reduce((sum, item) => sum + item.count * item.price, 0);
  }

  function getCartTotal(subtotal) {
    return (subtotal + HANDLING_FEE) * (1 - diskon);
  }

  function renderSidebarBreakdown(subtotal) {
    const breakdownEl = document.getElementById("cart-breakdown");

    if (subtotal === 0) {
      breakdownEl.innerHTML = "";
      totalPriceEl.textContent = "0.00";
      return;
    }

    const totalBeforeDiscount = subtotal + HANDLING_FEE;
    const discountAmount = totalBeforeDiscount * diskon;

    breakdownEl.innerHTML = `
      <div class="row"><span>Subtotal</span><span>$${formatMoney(subtotal)}</span></div>
      <div class="row"><span>Biaya penanganan</span><span>$${formatMoney(HANDLING_FEE)}</span></div>
      ${diskon ? `<div class="row"><span>Diskon</span><span>-$${formatMoney(discountAmount)}</span></div>` : ""}
    `;
    totalPriceEl.textContent = formatMoney(getCartTotal(subtotal));
  }

  function renderProducts() {
    productSection.innerHTML = "";

    products.forEach((product) => {
      const quantity = cart[product.id] ? cart[product.id].count : 0;
      const remainingStock = Math.max(product.stock - quantity, 0);
      const isSoldOut = remainingStock === 0;

      const productCard = document.createElement("article");
      productCard.classList.add("product");
      productCard.innerHTML = `
        <p class="produce-id">${product.produceId}</p>
        <img src="${product.image}" alt="${product.name}" class="product-image">
        <div class="item-meta">
          <h2>${product.name}</h2>
          <p class="price">$${formatMoney(product.price)}</p>
        </div>
        <p class="stock">Stok tersedia: ${remainingStock}</p>
        <div class="quantity-controls">
          <button class="quantity-button minus-button" data-id="${product.id}">-</button>
          <span class="quantity-display" id="quantity-${product.id}">${quantity}</span>
          <button class="quantity-button plus-button" data-id="${product.id}" ${isSoldOut ? "disabled" : ""}>+</button>
        </div>
      `;
      productSection.appendChild(productCard);
    });
  }

  function updateCartCount() {
    const totalCount = Object.values(cart).reduce((sum, item) => sum + item.count, 0);
    cartCountEl.textContent = totalCount;
  }

  function renderCart() {
    cartDetailsEl.innerHTML = "";
    const subtotal = getCartSubtotal();

    if (Object.keys(cart).length === 0) {
      cartDetailsEl.innerHTML = `<p class="empty-cart">Keranjang kamu masih kosong.</p>`;
      renderSidebarBreakdown(0);
      updateCartCount();
      renderProducts();
      return;
    }

    Object.values(cart).forEach((item) => {
      const itemTotal = item.count * item.price;

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

    const note = document.getElementById("note").value;
    if (note) {
      const preview = document.createElement("div");
      preview.className = "note-preview";
      preview.textContent = "Catatan: " + note;
      cartDetailsEl.appendChild(preview);
    }

    renderSidebarBreakdown(subtotal);
    updateCartCount();
    renderProducts();
  }

  function addToCart(id) {
    const product = products.find((item) => item.id == id);
    if (!product) return;

    if (!cart[id]) {
      cart[id] = { ...product, count: 0 };
    }

    if (cart[id].count >= product.stock) {
      showToast("Stok produk ini sudah habis.");
      return;
    }

    cart[id].price = product.price;
    cart[id].count++;
    renderCart();
  }

  function removeFromCart(id) {
    if (!cart[id]) return;
    cart[id].count--;
    if (cart[id].count <= 0) {
      delete cart[id];
    }
    renderCart();
  }

  function deleteItem(id) {
    delete cart[id];
    renderCart();
  }

  function updateQuantity(id, quantity) {
    if (!cart[id]) return;

    if (!Number.isInteger(quantity) || quantity < 1) {
      showToast("Jumlah barang harus berupa angka minimal 1.");
      renderCart();
      return;
    }

    cart[id].count = Math.min(quantity, cart[id].stock);
    renderCart();
  }

  function applyCoupon() {
    const msg = document.getElementById("coupon-msg");
    diskon = 0;
    msg.textContent = "Kupon diproses oleh server. Demo offline ini tidak menyimpan kode kupon rahasia di browser.";
    msg.style.color = "#6e7b61";
    renderCart();
  }

  let toastTimer = null;
  function showToast(message) {
    const t = document.getElementById("toast");
    t.textContent = message;
    t.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => t.classList.remove("show"), 3000);
  }

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

    const total = getCartTotal(subtotal);
    const potongan = (subtotal + HANDLING_FEE) * diskon;

    document.getElementById("review-breakdown").innerHTML = `
      <div class="row"><span>Subtotal</span><span>$${formatMoney(subtotal)}</span></div>
      <div class="row"><span>Biaya penanganan</span><span>$${formatMoney(HANDLING_FEE)}</span></div>
      ${diskon ? `<div class="row"><span>Diskon</span><span>-$${formatMoney(potongan)}</span></div>` : ""}
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

  document.addEventListener("input", (event) => {
    const target = event.target;
    if (target.classList.contains("edit-quantity-input")) {
      updateQuantity(target.dataset.id, Number(target.value));
    }
    if (target.id === "note") {
      renderCart();
    }
  });

  renderProducts();
  renderCart();
});
