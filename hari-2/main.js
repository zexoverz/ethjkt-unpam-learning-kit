// ============================================================
//  PASAR PAGI - mesin keranjang belanja
//  Versi diperbaiki: input divalidasi, output user aman, harga
//  tidak dipercaya dari DOM, stok jujur, dan total transparan.
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
    { id: 9, name: "Kiwi", price: 1.9, stock: 13, produceId: "#4301", image: "https://res.cloudinary.com/dgwef8ttm/image/upload/v1736614625/25-01-11-10-55-05-579_deco_zbrqpd.jpg" },
    { id: 10, name: "Semangka (Potong)", price: 3.2, stock: 9, produceId: "#4032", image: "https://res.cloudinary.com/dgwef8ttm/image/upload/v1736614185/25-01-11-10-48-13-815_deco_ogtsmo.jpg" }
  ];

  let cart = {};
  const HANDLING_FEE = 0.30;
  const PUBLIC_COUPONS = { PASARPAGI: 0.1 };
  let diskon = 0;

  const productSection = document.getElementById("product-section");
  const cartDetailsEl = document.getElementById("cart-details");
  const totalPriceEl = document.getElementById("modal-total-price");
  const cartBreakdownEl = document.getElementById("cart-breakdown");
  const cartCountEl = document.getElementById("cart-count");
  const reviewModal = document.getElementById("review-modal");

  function formatMoney(value) {
    return Number(value).toFixed(2);
  }

  function getProductById(id) {
    return products.find((item) => item.id === Number(id));
  }

  function normalizeQuantity(value, max) {
    const quantity = Number.parseInt(value, 10);
    if (!Number.isFinite(quantity)) return null;
    return Math.min(Math.max(quantity, 1), max);
  }

  function sanitizeNote(value) {
    return value
      .replace(/[<>`{}]/g, "")
      .replace(/[\u0000-\u001F\u007F]/g, "")
      .replace(/\s+/g, " ")
      .trimStart()
      .slice(0, 160);
  }

  function calculateTotals() {
    const subtotal = Object.values(cart).reduce((sum, item) => {
      const product = getProductById(item.id);
      if (!product) return sum;
      return sum + item.count * product.price;
    }, 0);
    const handlingFee = subtotal > 0 ? HANDLING_FEE : 0;
    const beforeDiscount = subtotal + handlingFee;
    const discountAmount = beforeDiscount * diskon;

    return {
      subtotal,
      handlingFee,
      discountAmount,
      total: beforeDiscount - discountAmount
    };
  }

  function createTextElement(tagName, className, text) {
    const element = document.createElement(tagName);
    if (className) element.className = className;
    element.textContent = text;
    return element;
  }

  function renderProducts() {
    productSection.innerHTML = "";

    products.forEach((product) => {
      const quantity = cart[product.id] ? cart[product.id].count : 0;
      const remainingStock = product.stock - quantity;
      const isSoldOut = remainingStock <= 0;

      const productCard = document.createElement("article");
      productCard.classList.add("product");

      const produceId = createTextElement("p", "produce-id", product.produceId);
      const image = document.createElement("img");
      image.src = product.image;
      image.alt = product.name;
      image.className = "product-image";

      const itemMeta = document.createElement("div");
      itemMeta.className = "item-meta";
      itemMeta.append(
        createTextElement("h2", "", product.name),
        createTextElement("p", "price", `$${formatMoney(product.price)}`)
      );

      const stock = createTextElement(
        "p",
        "stock",
        isSoldOut ? "stok habis" : `stok tersedia: ${remainingStock}`
      );

      const controls = document.createElement("div");
      controls.className = "quantity-controls";

      const minusButton = document.createElement("button");
      minusButton.className = "quantity-button minus-button";
      minusButton.dataset.id = product.id;
      minusButton.type = "button";
      minusButton.textContent = "-";

      const quantityDisplay = createTextElement("span", "quantity-display", String(quantity));
      quantityDisplay.id = `quantity-${product.id}`;

      const plusButton = document.createElement("button");
      plusButton.className = "quantity-button plus-button";
      plusButton.dataset.id = product.id;
      plusButton.type = "button";
      plusButton.textContent = "+";
      plusButton.disabled = isSoldOut;

      controls.append(minusButton, quantityDisplay, plusButton);
      productCard.append(produceId, image, itemMeta, stock, controls);
      productSection.appendChild(productCard);
    });
  }

  function updateCartCount() {
    const totalCount = Object.values(cart).reduce((sum, item) => sum + item.count, 0);
    cartCountEl.textContent = totalCount;
  }

  function renderCartBreakdown(totals) {
    cartBreakdownEl.innerHTML = "";
    cartBreakdownEl.append(
      createCartBreakdownRow("Subtotal", `$${formatMoney(totals.subtotal)}`),
      createCartBreakdownRow("Biaya penanganan", `$${formatMoney(totals.handlingFee)}`)
    );

    if (diskon) {
      cartBreakdownEl.appendChild(
        createCartBreakdownRow(`Kupon (-${Math.round(diskon * 100)}%)`, `-$${formatMoney(totals.discountAmount)}`)
      );
    }
  }

  function createCartBreakdownRow(label, value) {
    const row = document.createElement("div");
    row.className = "cart-breakdown-row";
    row.append(
      createTextElement("span", "", label),
      createTextElement("span", "", value)
    );
    return row;
  }

  function renderCart() {
    cartDetailsEl.innerHTML = "";

    if (Object.keys(cart).length === 0) {
      cartDetailsEl.appendChild(createTextElement("p", "empty-cart", "Keranjang kamu masih kosong."));
      const totals = calculateTotals();
      totalPriceEl.textContent = formatMoney(totals.total);
      renderCartBreakdown(totals);
      updateCartCount();
      renderProducts();
      return;
    }

    Object.values(cart).forEach((item) => {
      const product = getProductById(item.id);
      if (!product) return;

      const itemTotal = item.count * product.price;
      const listItem = document.createElement("div");
      listItem.className = "cart-item";

      const top = document.createElement("div");
      top.className = "cart-item-top";

      const meta = document.createElement("div");
      meta.append(
        createTextElement("div", "cart-item-name", product.name),
        createTextElement("div", "cart-item-price", `$${formatMoney(product.price)} / buah`)
      );
      top.append(meta, createTextElement("strong", "", `$${formatMoney(itemTotal)}`));

      const controls = document.createElement("div");
      controls.className = "cart-item-controls";

      const input = document.createElement("input");
      input.type = "number";
      input.min = "1";
      input.max = String(product.stock);
      input.className = "edit-quantity-input";
      input.value = String(item.count);
      input.dataset.id = product.id;

      const deleteIcon = document.createElement("i");
      deleteIcon.className = "fas fa-trash delete-icon";
      deleteIcon.dataset.id = product.id;

      controls.append(input, deleteIcon);
      listItem.append(top, controls);
      cartDetailsEl.appendChild(listItem);
    });

    const note = sanitizeNote(document.getElementById("note").value);
    if (note) {
      cartDetailsEl.appendChild(createTextElement("div", "note-preview", "Catatan: " + note));
    }

    const totals = calculateTotals();
    totalPriceEl.textContent = formatMoney(totals.total);
    renderCartBreakdown(totals);
    updateCartCount();
    renderProducts();
  }

  function addToCart(id) {
    const product = getProductById(id);
    if (!product) return;

    if (!cart[product.id]) {
      cart[product.id] = { id: product.id, count: 0 };
    }

    if (cart[product.id].count >= product.stock) {
      showToast("Stok untuk item ini sudah habis.");
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

  function updateQuantity(id, quantity) {
    if (!cart[id]) return;

    const product = getProductById(id);
    if (!product) return;

    const safeQuantity = normalizeQuantity(quantity, product.stock);
    cart[id].count = safeQuantity === null ? 1 : safeQuantity;
    renderCart();
  }

  function applyCoupon() {
    const code = document.getElementById("coupon").value.trim().toUpperCase();
    const msg = document.getElementById("coupon-msg");

    if (PUBLIC_COUPONS[code]) {
      diskon = PUBLIC_COUPONS[code];
      msg.textContent = `Kupon aktif! Potongan ${Math.round(diskon * 100)}%.`;
      msg.style.color = "#6e7b61";
    } else {
      diskon = 0;
      msg.textContent = code ? "Kode kupon salah." : "Masukkan kode kupon dulu.";
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
      const product = getProductById(item.id);
      if (!product) return;

      const line = item.count * product.price;
      const row = document.createElement("div");
      row.className = "review-line";
      row.append(
        createTextElement("span", "", `${product.name} x ${item.count}`),
        createTextElement("span", "", `$${formatMoney(line)}`)
      );
      itemsEl.appendChild(row);
    });

    const noteWrap = document.getElementById("review-note-wrap");
    noteWrap.innerHTML = "";
    const note = sanitizeNote(document.getElementById("note").value);
    if (note) {
      noteWrap.appendChild(createTextElement("div", "review-note", "Catatan: " + note));
    }

    const totals = calculateTotals();
    const breakdown = document.getElementById("review-breakdown");
    breakdown.innerHTML = "";
    breakdown.append(
      createBreakdownRow("Subtotal", `$${formatMoney(totals.subtotal)}`),
      createBreakdownRow("Biaya penanganan", `$${formatMoney(totals.handlingFee)}`)
    );

    if (diskon) {
      breakdown.appendChild(
        createBreakdownRow(`Kupon (-${Math.round(diskon * 100)}%)`, `-$${formatMoney(totals.discountAmount)}`)
      );
    }

    breakdown.appendChild(createBreakdownRow("Total", `$${formatMoney(totals.total)}`, true));
    reviewModal.classList.add("open");
  }

  function createBreakdownRow(label, value, isGrand = false) {
    const row = document.createElement("div");
    row.className = isGrand ? "row grand" : "row";
    row.append(
      createTextElement("span", "", label),
      createTextElement("span", "", value)
    );
    return row;
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
      updateQuantity(target.dataset.id, target.value);
    }
    if (target.id === "note") {
      const cleanNote = sanitizeNote(target.value);
      if (target.value !== cleanNote) {
        target.value = cleanNote;
      }
      renderCart();
    }
  });

  renderProducts();
  renderCart();
});
