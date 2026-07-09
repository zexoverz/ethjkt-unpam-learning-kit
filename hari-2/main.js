// Pasar Pagi cart demo.
// This static page shows local estimates only. Real prices, coupons, stock,
// and orders must be validated by a backend before any payment is accepted.

document.addEventListener("DOMContentLoaded", () => {
  const products = [
    { id: 1, name: "Apel Fuji", price: 1.5, produceId: "#4131", stock: 12, image: "https://res.cloudinary.com/dgwef8ttm/image/upload/v1736589286/25-01-11-03-50-09-954_deco_m2ofbh.jpg" },
    { id: 2, name: "Jeruk Navel", price: 2.0, produceId: "#4012", stock: 8, image: "https://res.cloudinary.com/dgwef8ttm/image/upload/v1736591406/25-01-11-04-29-12-930_deco_r9gznn.jpg" },
    { id: 3, name: "Pisang", price: 1.2, produceId: "#4011", stock: 15, image: "https://res.cloudinary.com/dgwef8ttm/image/upload/v1736591160/25-01-11-04-24-17-097_deco_htwecb.jpg" },
    { id: 4, name: "Anggur", price: 3.5, produceId: "#4022", stock: 5, image: "https://res.cloudinary.com/dgwef8ttm/image/upload/v1736589285/25-01-11-03-50-38-513_deco_spywdb.jpg" },
    { id: 5, name: "Stroberi", price: 4.5, produceId: "#4252", stock: 6, image: "https://res.cloudinary.com/dgwef8ttm/image/upload/v1736614071/25-01-11-10-44-32-511_deco_doxshi.jpg" },
    { id: 6, name: "Blueberry", price: 5.0, produceId: "#4264", stock: 4, image: "https://res.cloudinary.com/dgwef8ttm/image/upload/v1736614070/25-01-11-10-46-19-754_deco_g51gta.jpg" },
    { id: 7, name: "Nanas", price: 3.0, produceId: "#4430", stock: 7, image: "https://res.cloudinary.com/dgwef8ttm/image/upload/v1736614070/25-01-11-10-46-43-469_deco_lhzog2.jpg" },
    { id: 8, name: "Mangga", price: 2.8, produceId: "#4951", stock: 10, image: "https://res.cloudinary.com/dgwef8ttm/image/upload/v1736614071/25-01-11-10-45-34-043_deco_dmdlw1.jpg" },
    { id: 9, name: "Kiwi", price: 1.9, produceId: "#4301", stock: 9, image: "https://res.cloudinary.com/dgwef8ttm/image/upload/v1736614625/25-01-11-10-55-05-579_deco_zbrqpd.jpg" },
    { id: 10, name: "Semangka (Potong)", price: 3.2, produceId: "#4032", stock: 10, image: "https://res.cloudinary.com/dgwef8ttm/image/upload/v1736614185/25-01-11-10-48-13-815_deco_ogtsmo.jpg" }
  ];

  let cart = {};
  const HANDLING_FEE = 0.30;

  const productSection = document.getElementById("product-section");
  const cartDetailsEl = document.getElementById("cart-details");
  const totalPriceEl = document.getElementById("modal-total-price");
  const cartCountEl = document.getElementById("cart-count");
  const reviewModal = document.getElementById("review-modal");
  const sidebarBreakdownEl = document.getElementById("sidebar-breakdown");
  const couponInput = document.getElementById("coupon");
  const couponMsg = document.getElementById("coupon-msg");
  const noteInput = document.getElementById("note");

  function money(value) {
    return `$${value.toFixed(2)}`;
  }

  function findProduct(id) {
    return products.find((item) => item.id === Number(id));
  }

  function appendText(parent, tagName, className, text) {
    const el = document.createElement(tagName);
    if (className) el.className = className;
    el.textContent = text;
    parent.appendChild(el);
    return el;
  }

  function clearChildren(el) {
    while (el.firstChild) {
      el.removeChild(el.firstChild);
    }
  }

  function activeCartItems() {
    return Object.values(cart).filter((item) => Number.isInteger(item.count) && item.count > 0);
  }

  function cartSubtotal() {
    return activeCartItems().reduce((sum, item) => sum + item.count * item.price, 0);
  }

  function renderProducts() {
    clearChildren(productSection);

    products.forEach((product) => {
      const quantity = cart[product.id] ? cart[product.id].count : 0;
      const remaining = product.stock - quantity;

      const productCard = document.createElement("article");
      productCard.className = "product";

      appendText(productCard, "p", "produce-id", product.produceId);

      const image = document.createElement("img");
      image.className = "product-image";
      image.src = product.image;
      image.alt = product.name;
      image.loading = "lazy";
      image.referrerPolicy = "no-referrer";
      productCard.appendChild(image);

      const meta = document.createElement("div");
      meta.className = "item-meta";
      appendText(meta, "h2", "", product.name);
      appendText(meta, "p", "price", money(product.price));
      productCard.appendChild(meta);

      const stock = appendText(
        productCard,
        "p",
        remaining === 0 ? "stock stock-empty" : "stock",
        remaining === 0 ? "Stok habis." : `Stok tersedia: ${remaining}`
      );
      stock.setAttribute("aria-live", "polite");

      const controls = document.createElement("div");
      controls.className = "quantity-controls";

      const minus = document.createElement("button");
      minus.className = "quantity-button minus-button";
      minus.dataset.id = product.id;
      minus.type = "button";
      minus.textContent = "-";
      controls.appendChild(minus);

      appendText(controls, "span", "quantity-display", String(quantity));

      const plus = document.createElement("button");
      plus.className = "quantity-button plus-button";
      plus.dataset.id = product.id;
      plus.type = "button";
      plus.textContent = "+";
      if (remaining <= 0) plus.disabled = true;
      controls.appendChild(plus);

      productCard.appendChild(controls);
      productSection.appendChild(productCard);
    });
  }

  function updateCartCount() {
    const totalCount = activeCartItems().reduce((sum, item) => sum + item.count, 0);
    cartCountEl.textContent = totalCount;
  }

  function renderBreakdown(target, subtotal, isReview = false) {
    clearChildren(target);

    const rows = [
      ["Subtotal", money(subtotal)],
      ["Biaya penanganan", money(HANDLING_FEE)]
    ];

    rows.forEach(([label, value]) => {
      const row = document.createElement("div");
      row.className = isReview ? "row" : "breakdown-row";
      appendText(row, "span", "", label);
      appendText(row, "span", "", value);
      target.appendChild(row);
    });

    if (isReview) {
      const totalRow = document.createElement("div");
      totalRow.className = "row grand";
      appendText(totalRow, "span", "", "Total estimasi");
      appendText(totalRow, "span", "", money(subtotal + HANDLING_FEE));
      target.appendChild(totalRow);
    }
  }

  function renderCart() {
    const activeElementId = document.activeElement ? document.activeElement.dataset.id : null;
    const isInputActive = document.activeElement && document.activeElement.classList.contains("edit-quantity-input");

    clearChildren(cartDetailsEl);
    const items = activeCartItems();

    if (items.length === 0) {
      appendText(cartDetailsEl, "p", "empty-cart", "Keranjang kamu masih kosong.");
      totalPriceEl.textContent = "0.00";
      clearChildren(sidebarBreakdownEl);
      updateCartCount();
      renderProducts();
      return;
    }

    items.forEach((item) => {
      const itemTotal = item.count * item.price;

      const listItem = document.createElement("div");
      listItem.className = "cart-item";

      const top = document.createElement("div");
      top.className = "cart-item-top";

      const description = document.createElement("div");
      appendText(description, "div", "cart-item-name", item.name);
      appendText(description, "div", "cart-item-price", `${money(item.price)} / buah`);
      top.appendChild(description);
      appendText(top, "strong", "", money(itemTotal));
      listItem.appendChild(top);

      const controls = document.createElement("div");
      controls.className = "cart-item-controls";

      const input = document.createElement("input");
      input.type = "number";
      input.min = "1";
      input.step = "1";
      input.className = "edit-quantity-input";
      input.value = item.count;
      input.dataset.id = item.id;
      controls.appendChild(input);

      const deleteButton = document.createElement("button");
      deleteButton.className = "delete-button";
      deleteButton.dataset.id = item.id;
      deleteButton.type = "button";
      deleteButton.textContent = "Hapus";
      controls.appendChild(deleteButton);

      listItem.appendChild(controls);
      cartDetailsEl.appendChild(listItem);
    });

    const note = noteInput.value;
    if (note) {
      const preview = appendText(cartDetailsEl, "div", "note-preview", `Catatan: ${note}`);
      preview.setAttribute("aria-live", "polite");
    }

    const subtotal = cartSubtotal();
    renderBreakdown(sidebarBreakdownEl, subtotal);
    totalPriceEl.textContent = (subtotal + HANDLING_FEE).toFixed(2);
    updateCartCount();
    renderProducts();

    if (isInputActive && activeElementId) {
      const inputToFocus = cartDetailsEl.querySelector(`.edit-quantity-input[data-id="${activeElementId}"]`);
      if (inputToFocus) {
        inputToFocus.focus();
        const val = inputToFocus.value;
        inputToFocus.value = "";
        inputToFocus.value = val;
      }
    }
  }

  function addToCart(id) {
    const product = findProduct(id);
    if (!product) return;

    if (!cart[product.id]) {
      cart[product.id] = { ...product, count: 0 };
    }

    if (cart[product.id].count >= product.stock) {
      showToast(`Stok ${product.name} tidak mencukupi.`);
      return;
    }

    cart[product.id].price = product.price;
    cart[product.id].count += 1;
    renderCart();
  }

  function removeFromCart(id) {
    const product = findProduct(id);
    if (!product || !cart[product.id]) return;

    cart[product.id].count -= 1;
    if (cart[product.id].count <= 0) {
      delete cart[product.id];
    }
    renderCart();
  }

  function deleteItem(id) {
    delete cart[Number(id)];
    renderCart();
  }

  function updateQuantity(id, rawValue) {
    const product = findProduct(id);
    if (!product || !cart[product.id]) return;

    const quantity = Number(rawValue);
    if (!Number.isInteger(quantity) || quantity <= 0) {
      delete cart[product.id];
      showToast("Item dihapus karena jumlah tidak valid.");
    } else if (quantity > product.stock) {
      cart[product.id].count = product.stock;
      showToast(`Stok ${product.name} hanya ${product.stock}.`);
    } else {
      cart[product.id].count = quantity;
    }
    renderCart();
  }

  function applyCoupon() {
    const code = couponInput.value.trim();
    if (!code) {
      couponMsg.textContent = "";
      couponMsg.className = "coupon-msg";
      return;
    }

    couponMsg.textContent = "Kupon tidak diterapkan di demo statis. Validasi diskon harus dilakukan server.";
    couponMsg.className = "coupon-msg coupon-msg-warning";
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
    const items = activeCartItems();
    if (items.length === 0) {
      showToast("Keranjang kamu masih kosong.");
      return;
    }

    const itemsEl = document.getElementById("review-items");
    clearChildren(itemsEl);

    items.forEach((item) => {
      const line = item.count * item.price;
      const row = document.createElement("div");
      row.className = "review-line";
      appendText(row, "span", "", `${item.name} x ${item.count}`);
      appendText(row, "span", "", money(line));
      itemsEl.appendChild(row);
    });

    const noteWrap = document.getElementById("review-note-wrap");
    clearChildren(noteWrap);
    const note = noteInput.value;
    if (note) {
      appendText(noteWrap, "div", "review-note", `Catatan: ${note}`);
    }

    renderBreakdown(document.getElementById("review-breakdown"), cartSubtotal(), true);
    reviewModal.classList.add("open");
  }

  function closeReview() {
    reviewModal.classList.remove("open");
  }

  function placeOrder() {
    closeReview();
    cart = {};
    couponInput.value = "";
    couponMsg.textContent = "";
    couponMsg.className = "coupon-msg";
    noteInput.value = "";
    renderCart();
    showToast("Simulasi disimpan. Belum ada pembayaran atau order nyata.");
  }

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

  document.addEventListener("input", (event) => {
    const target = event.target;
    if (target.classList.contains("edit-quantity-input")) {
      updateQuantity(target.dataset.id, target.value);
    }
    if (target.id === "note") {
      renderCart();
    }
  });

  renderProducts();
  renderCart();
});
