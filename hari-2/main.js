// ============================================================
//  PASAR PAGI - mesin keranjang belanja
//  Versi ini memperbaiki bug, celah keamanan, dan dark pattern
//  dari versi latihan awal.
// ============================================================

document.addEventListener("DOMContentLoaded", () => {
  const products = [
    { id: 1, name: "Apel Fuji", price: 1.5, stock: 12, produceId: "#4131", image: "https://res.cloudinary.com/dgwef8ttm/image/upload/v1736589286/25-01-11-03-50-09-954_deco_m2ofbh.jpg" },
    { id: 2, name: "Jeruk Navel", price: 2.0, stock: 10, produceId: "#4012", image: "https://res.cloudinary.com/dgwef8ttm/image/upload/v1736591406/25-01-11-04-29-12-930_deco_r9gznn.jpg" },
    { id: 3, name: "Pisang", price: 1.2, stock: 18, produceId: "#4011", image: "https://res.cloudinary.com/dgwef8ttm/image/upload/v1736591160/25-01-11-04-24-17-097_deco_htwecb.jpg" },
    { id: 4, name: "Anggur", price: 3.5, stock: 8, produceId: "#4022", image: "https://res.cloudinary.com/dgwef8ttm/image/upload/v1736589285/25-01-11-03-50-38-513_deco_spywdb.jpg" },
    { id: 5, name: "Stroberi", price: 4.5, stock: 7, produceId: "#4252", image: "https://res.cloudinary.com/dgwef8ttm/image/upload/v1736614071/25-01-11-10-44-32-511_deco_doxshi.jpg" },
    { id: 6, name: "Blueberry", price: 5.0, stock: 6, produceId: "#4264", image: "https://res.cloudinary.com/dgwef8ttm/image/upload/v1736614070/25-01-11-10-46-19-754_deco_g51gta.jpg" },
    { id: 7, name: "Nanas", price: 3.0, stock: 9, produceId: "#4430", image: "https://res.cloudinary.com/dgwef8ttm/image/upload/v1736614070/25-01-11-10-46-43-469_deco_lhzog2.jpg" },
    { id: 8, name: "Mangga", price: 2.8, stock: 11, produceId: "#4951", image: "https://res.cloudinary.com/dgwef8ttm/image/upload/v1736614071/25-01-11-10-45-34-043_deco_dmdlw1.jpg" },
    { id: 9, name: "Kiwi", price: 1.9, stock: 14, produceId: "#4301", image: "https://res.cloudinary.com/dgwef8ttm/image/upload/v1736614625/25-01-11-10-55-05-579_deco_zbrqpd.jpg" },
    { id: 10, name: "Semangka (Potong)", price: 3.2, stock: 9, produceId: "#4032", image: "https://res.cloudinary.com/dgwef8ttm/image/upload/v1736614185/25-01-11-10-48-13-815_deco_ogtsmo.jpg" }
  ];

  let cart = {};

  const HANDLING_FEE = 0.30;
  const COUPONS = {
    PANENHEMAT: 0.10,
  };
  let diskon = 0;

  const productSection = document.getElementById("product-section");
  const cartDetailsEl = document.getElementById("cart-details");
  const totalPriceEl = document.getElementById("modal-total-price");
  const subtotalPriceEl = document.getElementById("subtotal-price");
  const handlingFeeEl = document.getElementById("handling-fee");
  const discountRowEl = document.getElementById("discount-row");
  const discountPriceEl = document.getElementById("discount-price");
  const cartCountEl = document.getElementById("cart-count");
  const reviewModal = document.getElementById("review-modal");

  function formatMoney(value) {
    return Number(value).toFixed(2);
  }

  function findProduct(id) {
    return products.find((item) => item.id === Number(id));
  }

  function calculateTotals() {
    const subtotal = Object.values(cart).reduce((sum, item) => sum + item.count * item.price, 0);
    const handlingFee = subtotal > 0 ? HANDLING_FEE : 0;
    const beforeDiscount = subtotal + handlingFee;
    const discountAmount = beforeDiscount * diskon;
    const total = beforeDiscount - discountAmount;
    return { subtotal, handlingFee, discountAmount, total };
  }

  function setText(parent, className, text) {
    const el = document.createElement("div");
    el.className = className;
    el.textContent = text;
    parent.appendChild(el);
  }

  function updateBreakdown() {
    const { subtotal, handlingFee, discountAmount, total } = calculateTotals();
    subtotalPriceEl.textContent = formatMoney(subtotal);
    handlingFeeEl.textContent = formatMoney(handlingFee);
    discountPriceEl.textContent = formatMoney(discountAmount);
    discountRowEl.hidden = discountAmount <= 0;
    totalPriceEl.textContent = formatMoney(total);
  }

  function renderProducts() {
    productSection.innerHTML = "";

    products.forEach((product) => {
      const quantity = cart[product.id] ? cart[product.id].count : 0;
      const productCard = document.createElement("article");
      productCard.classList.add("product");
      productCard.innerHTML = `
        <p class="produce-id">${product.produceId}</p>
        <img src="${product.image}" alt="${product.name}" class="product-image">
        <div class="item-meta">
          <h2>${product.name}</h2>
          <p class="price">$${formatMoney(product.price)}</p>
        </div>
        <p class="stock">stok tersedia: ${product.stock}</p>
        <div class="quantity-controls">
          <button class="quantity-button minus-button" data-id="${product.id}" type="button">&minus;</button>
          <span class="quantity-display" id="quantity-${product.id}">${quantity}</span>
          <button class="quantity-button plus-button" data-id="${product.id}" type="button">+</button>
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

    if (Object.keys(cart).length === 0) {
      cartDetailsEl.innerHTML = `<p class="empty-cart">Keranjang kamu masih kosong.</p>`;
      updateCartCount();
      updateBreakdown();
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
          <i class="fas fa-trash delete-icon" data-id="${item.id}" aria-label="Hapus ${item.name}"></i>
        </div>
      `;
      cartDetailsEl.appendChild(listItem);
    });

    const note = document.getElementById("note").value.trim();
    if (note) {
      const preview = document.createElement("div");
      preview.className = "note-preview";
      preview.textContent = "Catatan: " + note;
      cartDetailsEl.appendChild(preview);
    }

    updateCartCount();
    updateBreakdown();
    renderProducts();
  }

  function addToCart(id) {
    const product = findProduct(id);
    if (!product) return;

    if (!cart[product.id]) {
      cart[product.id] = { ...product, count: 0 };
    }

    if (cart[product.id].count >= product.stock) {
      showToast("Stok " + product.name + " hanya " + product.stock + ".");
      return;
    }

    cart[product.id].count++;
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

  function updateQuantity(id, rawQuantity) {
    const item = cart[id];
    const product = findProduct(id);
    const quantity = Number(rawQuantity);

    if (!item || !product) return;

    if (!Number.isInteger(quantity) || quantity < 1) {
      showToast("Jumlah harus angka bulat minimal 1.");
      renderCart();
      return;
    }

    item.count = Math.min(quantity, product.stock);
    if (quantity > product.stock) {
      showToast("Jumlah disesuaikan dengan stok " + product.stock + ".");
    }
    renderCart();
  }

  function applyCoupon() {
    const code = document.getElementById("coupon").value.trim().toUpperCase();
    const msg = document.getElementById("coupon-msg");

    if (COUPONS[code]) {
      diskon = COUPONS[code];
      msg.textContent = "Kupon aktif! Potongan " + Math.round(diskon * 100) + "%.";
      msg.style.color = "#6e7b61";
    } else {
      diskon = 0;
      msg.textContent = "Kode kupon salah.";
      msg.style.color = "#b96f5c";
    }
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
    Object.values(cart).forEach((item) => {
      const line = item.count * item.price;
      const row = document.createElement("div");
      row.className = "review-line";
      const left = document.createElement("span");
      const right = document.createElement("span");
      left.textContent = item.name + " x " + item.count;
      right.textContent = "$" + formatMoney(line);
      row.append(left, right);
      itemsEl.appendChild(row);
    });

    const noteWrap = document.getElementById("review-note-wrap");
    noteWrap.innerHTML = "";
    const note = document.getElementById("note").value.trim();
    if (note) {
      const n = document.createElement("div");
      n.className = "review-note";
      n.textContent = "Catatan: " + note;
      noteWrap.appendChild(n);
    }

    const { subtotal, handlingFee, discountAmount, total } = calculateTotals();
    const breakdown = document.getElementById("review-breakdown");
    breakdown.innerHTML = "";
    setTextRow(breakdown, "Subtotal", "$" + formatMoney(subtotal));
    setTextRow(breakdown, "Biaya penanganan", "$" + formatMoney(handlingFee));
    if (discountAmount > 0) {
      setTextRow(breakdown, "Kupon (-" + Math.round(diskon * 100) + "%)", "-$" + formatMoney(discountAmount));
    }
    setTextRow(breakdown, "Total", "$" + formatMoney(total), true);

    reviewModal.classList.add("open");
  }

  function setTextRow(parent, label, value, grand = false) {
    const row = document.createElement("div");
    row.className = "row" + (grand ? " grand" : "");
    setText(row, "label", label);
    setText(row, "value", value);
    parent.appendChild(row);
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
    if (target.id === "note") {
      renderCart();
    }
  });

  document.addEventListener("change", (event) => {
    const target = event.target;
    if (target.classList.contains("edit-quantity-input")) {
      updateQuantity(target.dataset.id, target.value);
    }
  });

  renderProducts();
  renderCart();
});
