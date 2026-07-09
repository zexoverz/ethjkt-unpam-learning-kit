// ============================================================
//  PASAR PAGI - versi perbaikan
//  Fokus: XSS, manipulasi harga, validasi jumlah, format uang,
//  transparansi biaya, dan penghapusan rahasia kupon dari client.
// ============================================================

document.addEventListener("DOMContentLoaded", () => {
  const products = [
    { id: 1, name: "Apel Fuji", price: 1.5, produceId: "#4131", image: "https://res.cloudinary.com/dgwef8ttm/image/upload/v1736589286/25-01-11-03-50-09-954_deco_m2ofbh.jpg" },
    { id: 2, name: "Jeruk Navel", price: 2.0, produceId: "#4012", image: "https://res.cloudinary.com/dgwef8ttm/image/upload/v1736591406/25-01-11-04-29-12-930_deco_r9gznn.jpg" },
    { id: 3, name: "Pisang", price: 1.2, produceId: "#4011", image: "https://res.cloudinary.com/dgwef8ttm/image/upload/v1736591160/25-01-11-04-24-17-097_deco_htwecb.jpg" },
    { id: 4, name: "Anggur", price: 3.5, produceId: "#4022", image: "https://res.cloudinary.com/dgwef8ttm/image/upload/v1736589285/25-01-11-03-50-38-513_deco_spywdb.jpg" },
    { id: 5, name: "Stroberi", price: 4.5, produceId: "#4252", image: "https://res.cloudinary.com/dgwef8ttm/image/upload/v1736614071/25-01-11-10-44-32-511_deco_doxshi.jpg" },
    { id: 6, name: "Blueberry", price: 5.0, produceId: "#4264", image: "https://res.cloudinary.com/dgwef8ttm/image/upload/v1736614070/25-01-11-10-46-19-754_deco_g51gta.jpg" },
    { id: 7, name: "Nanas", price: 3.0, produceId: "#4430", image: "https://res.cloudinary.com/dgwef8ttm/image/upload/v1736614070/25-01-11-10-46-43-469_deco_lhzog2.jpg" },
    { id: 8, name: "Mangga", price: 2.8, produceId: "#4951", image: "https://res.cloudinary.com/dgwef8ttm/image/upload/v1736614071/25-01-11-10-45-34-043_deco_dmdlw1.jpg" },
    { id: 9, name: "Kiwi", price: 1.9, produceId: "#4301", image: "https://res.cloudinary.com/dgwef8ttm/image/upload/v1736614625/25-01-11-10-55-05-579_deco_zbrqpd.jpg" },
    { id: 10, name: "Semangka (Potong)", price: 3.2, produceId: "#4032", image: "https://res.cloudinary.com/dgwef8ttm/image/upload/v1736614185/25-01-11-10-48-13-815_deco_ogtsmo.jpg" }
  ];

  const MAX_QUANTITY = 99;
  const HANDLING_FEE = 0.30;

  let cart = {};
  let diskon = 0;

  const productSection = document.getElementById("product-section");
  const cartDetailsEl = document.getElementById("cart-details");
  const totalPriceEl = document.getElementById("modal-total-price");
  const cartCountEl = document.getElementById("cart-count");
  const reviewModal = document.getElementById("review-modal");
  const summarySubtotalEl = document.getElementById("summary-subtotal");
  const summaryHandlingEl = document.getElementById("summary-handling");
  const summaryDiscountEl = document.getElementById("summary-discount");
  const summaryDiscountRow = document.getElementById("summary-discount-row");

  function formatMoney(value) {
    return value.toFixed(2);
  }

  function getProduct(id) {
    return products.find((item) => item.id === Number(id));
  }

  function calculateTotals() {
    const subtotal = Object.values(cart).reduce((sum, item) => {
      return sum + item.count * item.price;
    }, 0);
    const beforeDiscount = subtotal > 0 ? subtotal + HANDLING_FEE : 0;
    const discountAmount = beforeDiscount * diskon;
    const total = beforeDiscount - discountAmount;

    return { subtotal, handlingFee: subtotal > 0 ? HANDLING_FEE : 0, discountAmount, total };
  }

  function renderProducts() {
    productSection.innerHTML = "";

    products.forEach((product) => {
      const quantity = cart[product.id] ? cart[product.id].count : 0;

      const productCard = document.createElement("article");
      productCard.classList.add("product");

      const produceId = document.createElement("p");
      produceId.className = "produce-id";
      produceId.textContent = product.produceId;

      const image = document.createElement("img");
      image.src = product.image;
      image.alt = product.name;
      image.className = "product-image";

      const meta = document.createElement("div");
      meta.className = "item-meta";

      const title = document.createElement("h2");
      title.textContent = product.name;

      const price = document.createElement("p");
      price.className = "price";
      price.textContent = `$${formatMoney(product.price)}`;

      meta.append(title, price);

      const stock = document.createElement("p");
      stock.className = "stock";
      stock.textContent = "Stok mengikuti ketersediaan panen.";

      const controls = document.createElement("div");
      controls.className = "quantity-controls";

      const minusButton = document.createElement("button");
      minusButton.className = "quantity-button minus-button";
      minusButton.type = "button";
      minusButton.dataset.id = product.id;
      minusButton.textContent = "-";

      const quantityDisplay = document.createElement("span");
      quantityDisplay.className = "quantity-display";
      quantityDisplay.id = `quantity-${product.id}`;
      quantityDisplay.textContent = quantity;

      const plusButton = document.createElement("button");
      plusButton.className = "quantity-button plus-button";
      plusButton.type = "button";
      plusButton.dataset.id = product.id;
      plusButton.textContent = "+";

      controls.append(minusButton, quantityDisplay, plusButton);
      productCard.append(produceId, image, meta, stock, controls);
      productSection.appendChild(productCard);
    });
  }

  function updateCartCount() {
    const totalCount = Object.values(cart).reduce((sum, item) => sum + item.count, 0);
    cartCountEl.textContent = totalCount;
  }

  function updateSummary() {
    const totals = calculateTotals();
    summarySubtotalEl.textContent = formatMoney(totals.subtotal);
    summaryHandlingEl.textContent = formatMoney(totals.handlingFee);
    summaryDiscountEl.textContent = `-$${formatMoney(totals.discountAmount)}`;
    summaryDiscountRow.hidden = totals.discountAmount === 0;
    totalPriceEl.textContent = formatMoney(totals.total);
  }

  function renderCart() {
    cartDetailsEl.innerHTML = "";

    if (Object.keys(cart).length === 0) {
      const empty = document.createElement("p");
      empty.className = "empty-cart";
      empty.textContent = "Keranjang kamu masih kosong.";
      cartDetailsEl.appendChild(empty);
      updateCartCount();
      updateSummary();
      renderProducts();
      return;
    }

    Object.values(cart).forEach((item) => {
      const itemTotal = item.count * item.price;

      const listItem = document.createElement("div");
      listItem.classList.add("cart-item");

      const itemTop = document.createElement("div");
      itemTop.className = "cart-item-top";

      const itemText = document.createElement("div");
      const itemName = document.createElement("div");
      itemName.className = "cart-item-name";
      itemName.textContent = item.name;

      const itemPrice = document.createElement("div");
      itemPrice.className = "cart-item-price";
      itemPrice.textContent = `$${formatMoney(item.price)} / buah`;

      itemText.append(itemName, itemPrice);

      const itemTotalEl = document.createElement("strong");
      itemTotalEl.textContent = `$${formatMoney(itemTotal)}`;

      itemTop.append(itemText, itemTotalEl);

      const itemControls = document.createElement("div");
      itemControls.className = "cart-item-controls";

      const quantityInput = document.createElement("input");
      quantityInput.type = "number";
      quantityInput.min = "1";
      quantityInput.max = String(MAX_QUANTITY);
      quantityInput.className = "edit-quantity-input";
      quantityInput.value = item.count;
      quantityInput.dataset.id = item.id;

      const deleteButton = document.createElement("button");
      deleteButton.className = "delete-button";
      deleteButton.type = "button";
      deleteButton.dataset.id = item.id;
      deleteButton.textContent = "Hapus";

      itemControls.append(quantityInput, deleteButton);
      listItem.append(itemTop, itemControls);
      cartDetailsEl.appendChild(listItem);
    });

    const note = document.getElementById("note").value.trim();
    if (note) {
      const preview = document.createElement("div");
      preview.className = "note-preview";
      preview.textContent = `Catatan: ${note}`;
      cartDetailsEl.appendChild(preview);
    }

    updateCartCount();
    updateSummary();
    renderProducts();
  }

  function addToCart(id) {
    const product = getProduct(id);
    if (!product) return;

    if (!cart[product.id]) {
      cart[product.id] = { ...product, count: 0 };
    }

    if (cart[product.id].count >= MAX_QUANTITY) {
      showToast(`Jumlah maksimal ${MAX_QUANTITY} untuk tiap produk.`);
      return;
    }

    cart[product.id].price = product.price;
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
    if (!cart[id]) return;

    const quantity = Number(rawQuantity);
    if (!Number.isInteger(quantity) || quantity < 1 || quantity > MAX_QUANTITY) {
      showToast(`Jumlah harus angka bulat 1-${MAX_QUANTITY}.`);
      renderCart();
      return;
    }

    cart[id].count = quantity;
    renderCart();
  }

  function applyCoupon() {
    const msg = document.getElementById("coupon-msg");
    diskon = 0;
    msg.textContent = "Kupon perlu diverifikasi di server. Demo statis ini tidak menyimpan kupon rahasia di browser.";
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

    Object.values(cart).forEach((item) => {
      const line = item.count * item.price;
      const row = document.createElement("div");
      row.className = "review-line";

      const label = document.createElement("span");
      label.textContent = `${item.name} x ${item.count}`;

      const value = document.createElement("span");
      value.textContent = `$${formatMoney(line)}`;

      row.append(label, value);
      itemsEl.appendChild(row);
    });

    const noteWrap = document.getElementById("review-note-wrap");
    noteWrap.innerHTML = "";
    const note = document.getElementById("note").value.trim();
    if (note) {
      const n = document.createElement("div");
      n.className = "review-note";
      n.textContent = `Catatan: ${note}`;
      noteWrap.appendChild(n);
    }

    const totals = calculateTotals();
    const reviewBreakdown = document.getElementById("review-breakdown");
    reviewBreakdown.innerHTML = "";
    reviewBreakdown.append(
      createBreakdownRow("Subtotal", `$${formatMoney(totals.subtotal)}`),
      createBreakdownRow("Biaya penanganan", `$${formatMoney(totals.handlingFee)}`)
    );

    if (totals.discountAmount > 0) {
      reviewBreakdown.appendChild(createBreakdownRow("Kupon", `-$${formatMoney(totals.discountAmount)}`));
    }

    reviewBreakdown.appendChild(createBreakdownRow("Total", `$${formatMoney(totals.total)}`, true));
    reviewModal.classList.add("open");
  }

  function createBreakdownRow(labelText, valueText, isGrand = false) {
    const row = document.createElement("div");
    row.className = isGrand ? "row grand" : "row";

    const label = document.createElement("span");
    label.textContent = labelText;

    const value = document.createElement("span");
    value.textContent = valueText;

    row.append(label, value);
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
