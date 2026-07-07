// ============================================================
//  PASAR PAGI - mesin keranjang belanja
//  Versi sudah diperbaiki dari laporan temuan Hari 2.
// ============================================================

document.addEventListener("DOMContentLoaded", () => {
  const products = [
    { id: 1, name: "Apel Fuji", price: 1.5, stock: 8, produceId: "#4131", image: "https://res.cloudinary.com/dgwef8ttm/image/upload/v1736589286/25-01-11-03-50-09-954_deco_m2ofbh.jpg" },
    { id: 2, name: "Jeruk Navel", price: 2.0, stock: 6, produceId: "#4012", image: "https://res.cloudinary.com/dgwef8ttm/image/upload/v1736591406/25-01-11-04-29-12-930_deco_r9gznn.jpg" },
    { id: 3, name: "Pisang", price: 1.2, stock: 12, produceId: "#4011", image: "https://res.cloudinary.com/dgwef8ttm/image/upload/v1736591160/25-01-11-04-24-17-097_deco_htwecb.jpg" },
    { id: 4, name: "Anggur", price: 3.5, stock: 7, produceId: "#4022", image: "https://res.cloudinary.com/dgwef8ttm/image/upload/v1736589285/25-01-11-03-50-38-513_deco_spywdb.jpg" },
    { id: 5, name: "Stroberi", price: 4.5, stock: 5, produceId: "#4252", image: "https://res.cloudinary.com/dgwef8ttm/image/upload/v1736614071/25-01-11-10-44-32-511_deco_doxshi.jpg" },
    { id: 6, name: "Blueberry", price: 5.0, stock: 4, produceId: "#4264", image: "https://res.cloudinary.com/dgwef8ttm/image/upload/v1736614070/25-01-11-10-46-19-754_deco_g51gta.jpg" },
    { id: 7, name: "Nanas", price: 3.0, stock: 9, produceId: "#4430", image: "https://res.cloudinary.com/dgwef8ttm/image/upload/v1736614070/25-01-11-10-46-43-469_deco_lhzog2.jpg" },
    { id: 8, name: "Mangga", price: 2.8, stock: 6, produceId: "#4951", image: "https://res.cloudinary.com/dgwef8ttm/image/upload/v1736614071/25-01-11-10-45-34-043_deco_dmdlw1.jpg" },
    { id: 9, name: "Kiwi", price: 1.9, stock: 8, produceId: "#4301", image: "https://res.cloudinary.com/dgwef8ttm/image/upload/v1736614625/25-01-11-10-55-05-579_deco_zbrqpd.jpg" },
    { id: 10, name: "Semangka (Potong)", price: 3.2, stock: 5, produceId: "#4032", image: "https://res.cloudinary.com/dgwef8ttm/image/upload/v1736614185/25-01-11-10-48-13-815_deco_ogtsmo.jpg" },
  ];

  const HANDLING_FEE = 0.30;
  const MAX_QTY = 99;
  const COUPON_CODES = {
    PASARPAGI10: 0.1,
  };

  let cart = {};
  let diskon = 0;
  let toastTimer = null;

  const productSection = document.getElementById("product-section");
  const cartDetailsEl = document.getElementById("cart-details");
  const cartBreakdownEl = document.getElementById("cart-breakdown");
  const totalPriceEl = document.getElementById("modal-total-price");
  const cartCountEl = document.getElementById("cart-count");
  const reviewModal = document.getElementById("review-modal");

  function formatMoney(value) {
    return Number(value).toFixed(2);
  }

  function showToast(message) {
    const toast = document.getElementById("toast");
    toast.textContent = message;
    toast.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove("show"), 3000);
  }

  function summary() {
    const subtotal = Object.values(cart).reduce((sum, item) => sum + item.count * item.price, 0);
    const handling = subtotal > 0 ? HANDLING_FEE : 0;
    const potongan = (subtotal + handling) * diskon;
    const total = subtotal + handling - potongan;

    return { subtotal, handling, potongan, total };
  }

  function appendMoneyRow(parent, className, label, value) {
    const row = document.createElement("div");
    row.className = className;

    const labelEl = document.createElement("span");
    labelEl.textContent = label;

    const valueEl = document.createElement("span");
    valueEl.textContent = (value < 0 ? "-$" : "$") + formatMoney(Math.abs(value));

    row.append(labelEl, valueEl);
    parent.appendChild(row);
  }

  function renderBreakdown(orderSummary) {
    cartBreakdownEl.innerHTML = "";
    appendMoneyRow(cartBreakdownEl, "breakdown-row", "Subtotal", orderSummary.subtotal);
    appendMoneyRow(cartBreakdownEl, "breakdown-row", "Biaya penanganan", orderSummary.handling);

    if (orderSummary.potongan > 0) {
      appendMoneyRow(cartBreakdownEl, "breakdown-row", "Diskon", -orderSummary.potongan);
    }
  }

  function findProduct(id) {
    return products.find((item) => item.id == id);
  }

  function getCartCount(id) {
    return cart[id] ? cart[id].count : 0;
  }

  function getRemainingStock(product) {
    return Math.max(0, product.stock - getCartCount(product.id));
  }

  function renderProducts() {
    productSection.innerHTML = "";

    products.forEach((product) => {
      const quantity = getCartCount(product.id);
      const remaining = getRemainingStock(product);
      const soldOut = remaining === 0;
      const productCard = document.createElement("article");
      productCard.classList.add("product");
      if (soldOut) {
        productCard.classList.add("sold-out");
      }
      productCard.innerHTML = `
        <p class="produce-id">${product.produceId}</p>
        <img src="${product.image}" alt="${product.name}" class="product-image">
        <div class="item-meta">
          <h2>${product.name}</h2>
          <p class="price">$${formatMoney(product.price)}</p>
        </div>
        <p class="stock ${soldOut ? "sold-out" : ""}">${soldOut ? "stok habis" : "stok tersisa " + remaining}</p>
        <div class="quantity-controls">
          <button class="quantity-button minus-button" data-id="${product.id}" ${quantity === 0 ? "disabled" : ""}>-</button>
          <span class="quantity-display" id="quantity-${product.id}">${quantity}</span>
          <button class="quantity-button plus-button" data-id="${product.id}" ${soldOut ? "disabled" : ""}>+</button>
        </div>
      `;
      productSection.appendChild(productCard);
    });
  }

  function updateCartCount() {
    const totalCount = Object.values(cart).reduce((sum, item) => sum + item.count, 0);
    cartCountEl.textContent = totalCount;
  }

  function renderNotePreview() {
    const note = document.getElementById("note").value;
    if (!note) return;

    const preview = document.createElement("div");
    preview.className = "note-preview";
    preview.textContent = "Catatan: " + note;
    cartDetailsEl.appendChild(preview);
  }

  function renderCart() {
    cartDetailsEl.innerHTML = "";

    if (Object.keys(cart).length === 0) {
      const empty = document.createElement("p");
      empty.className = "empty-cart";
      empty.textContent = "Keranjang kamu masih kosong.";
      cartDetailsEl.appendChild(empty);
    } else {
      Object.values(cart).forEach((item) => {
        const itemTotal = item.count * item.price;
        const product = findProduct(item.id);
        const maxQty = product ? product.stock : MAX_QTY;
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
            <input type="number" min="1" max="${maxQty}" step="1" class="edit-quantity-input" value="${item.count}" data-id="${item.id}">
            <i class="fas fa-trash delete-icon" data-id="${item.id}"></i>
          </div>
        `;
        cartDetailsEl.appendChild(listItem);
      });

      renderNotePreview();
    }

    const orderSummary = summary();
    renderBreakdown(orderSummary);
    totalPriceEl.textContent = formatMoney(orderSummary.total);
    updateCartCount();
    renderProducts();
  }

  function addToCart(id) {
    const product = findProduct(id);
    if (!product) return;

    if (!cart[id]) {
      cart[id] = { ...product, count: 0 };
    }

    const remaining = getRemainingStock(product);
    if (remaining <= 0) {
      showToast(product.name + " sedang habis.");
      return;
    }

    cart[id].price = product.price;
    cart[id].count += 1;
    renderCart();
  }

  function removeFromCart(id) {
    if (!cart[id]) return;

    cart[id].count -= 1;
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
    const product = findProduct(id);
    if (!cart[id] || !product) return;

    if (!Number.isInteger(quantity) || quantity < 1 || quantity > product.stock) {
      showToast("Jumlah harus angka bulat 1 sampai " + product.stock + ".");
      renderCart();
      return;
    }

    cart[id].count = quantity;
    renderCart();
  }

  function applyCoupon() {
    const msg = document.getElementById("coupon-msg");
    const code = document.getElementById("coupon").value.trim().toUpperCase();

    diskon = COUPON_CODES[code] || 0;

    if (diskon > 0) {
      msg.textContent = "Kupon aktif: potongan " + Math.round(diskon * 100) + "%.";
      msg.style.color = "#6e7b61";
    } else {
      msg.textContent = "Kode kupon tidak valid. Pakai: PASARPAGI10.";
      msg.style.color = "#b96f5c";
    }

    renderCart();
  }

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

      const label = document.createElement("span");
      label.textContent = item.name + " x " + item.count;

      const price = document.createElement("span");
      price.textContent = "$" + formatMoney(item.count * item.price);

      row.append(label, price);
      itemsEl.appendChild(row);
    });

    const noteWrap = document.getElementById("review-note-wrap");
    noteWrap.innerHTML = "";
    const note = document.getElementById("note").value;
    if (note) {
      const noteEl = document.createElement("div");
      noteEl.className = "review-note";
      noteEl.textContent = "Catatan: " + note;
      noteWrap.appendChild(noteEl);
    }

    const reviewBreakdown = document.getElementById("review-breakdown");
    const orderSummary = summary();
    reviewBreakdown.innerHTML = "";
    appendMoneyRow(reviewBreakdown, "row", "Subtotal", orderSummary.subtotal);
    appendMoneyRow(reviewBreakdown, "row", "Biaya penanganan", orderSummary.handling);

    if (orderSummary.potongan > 0) {
      appendMoneyRow(reviewBreakdown, "row", "Diskon", -orderSummary.potongan);
    }

    appendMoneyRow(reviewBreakdown, "row grand", "Total", orderSummary.total);
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
      const rawValue = target.value === "" ? NaN : Number(target.value);
      updateQuantity(target.dataset.id, rawValue);
    }
    if (target.id === "note") {
      renderCart();
    }
  });

  renderProducts();
  renderCart();
});
