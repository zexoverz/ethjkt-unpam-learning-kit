// ============================================================
//  PASAR PAGI - mesin keranjang belanja bersih setelah review
// ============================================================

document.addEventListener("DOMContentLoaded", () => {
  const products = [
    { id: 1, name: "Apel Fuji", price: 1.5, orderLimit: 12, produceId: "#4131", image: "https://res.cloudinary.com/dgwef8ttm/image/upload/v1736589286/25-01-11-03-50-09-954_deco_m2ofbh.jpg" },
    { id: 2, name: "Jeruk Navel", price: 2.0, orderLimit: 10, produceId: "#4012", image: "https://res.cloudinary.com/dgwef8ttm/image/upload/v1736591406/25-01-11-04-29-12-930_deco_r9gznn.jpg" },
    { id: 3, name: "Pisang", price: 1.2, orderLimit: 18, produceId: "#4011", image: "https://res.cloudinary.com/dgwef8ttm/image/upload/v1736591160/25-01-11-04-24-17-097_deco_htwecb.jpg" },
    { id: 4, name: "Anggur", price: 3.5, orderLimit: 8, produceId: "#4022", image: "https://res.cloudinary.com/dgwef8ttm/image/upload/v1736589285/25-01-11-03-50-38-513_deco_spywdb.jpg" },
    { id: 5, name: "Stroberi", price: 4.5, orderLimit: 7, produceId: "#4252", image: "https://res.cloudinary.com/dgwef8ttm/image/upload/v1736614071/25-01-11-10-44-32-511_deco_doxshi.jpg" },
    { id: 6, name: "Blueberry", price: 5.0, orderLimit: 6, produceId: "#4264", image: "https://res.cloudinary.com/dgwef8ttm/image/upload/v1736614070/25-01-11-10-46-19-754_deco_g51gta.jpg" },
    { id: 7, name: "Nanas", price: 3.0, orderLimit: 9, produceId: "#4430", image: "https://res.cloudinary.com/dgwef8ttm/image/upload/v1736614070/25-01-11-10-46-43-469_deco_lhzog2.jpg" },
    { id: 8, name: "Mangga", price: 2.8, orderLimit: 11, produceId: "#4951", image: "https://res.cloudinary.com/dgwef8ttm/image/upload/v1736614071/25-01-11-10-45-34-043_deco_dmdlw1.jpg" },
    { id: 9, name: "Kiwi", price: 1.9, orderLimit: 13, produceId: "#4301", image: "https://res.cloudinary.com/dgwef8ttm/image/upload/v1736614625/25-01-11-10-55-05-579_deco_zbrqpd.jpg" },
    { id: 10, name: "Semangka (Potong)", price: 3.2, orderLimit: 9, produceId: "#4032", image: "https://res.cloudinary.com/dgwef8ttm/image/upload/v1736614185/25-01-11-10-48-13-815_deco_ogtsmo.jpg" }
  ];

  let cart = {};

  const productSection = document.getElementById("product-section");
  const cartDetailsEl = document.getElementById("cart-details");
  const priceBreakdownEl = document.getElementById("price-breakdown");
  const totalPriceEl = document.getElementById("modal-total-price");
  const cartCountEl = document.getElementById("cart-count");
  const reviewModal = document.getElementById("review-modal");
  const noteInput = document.getElementById("note");
  const toast = document.getElementById("toast");

  function createElement(tag, className, text) {
    const element = document.createElement(tag);
    if (className) element.className = className;
    if (text !== undefined) element.textContent = text;
    return element;
  }

  function formatMoney(value) {
    return value.toFixed(2);
  }

  function findProduct(id) {
    return products.find((product) => product.id === Number(id));
  }

  function getCartQuantity(id) {
    return cart[id]?.count || 0;
  }

  function calculateSubtotal() {
    return Object.entries(cart).reduce((sum, [id, item]) => {
      const product = findProduct(id);
      return product ? sum + product.price * item.count : sum;
    }, 0);
  }

  function createPriceRow(label, value) {
    const row = createElement("div", "price-row");
    row.append(
      createElement("span", "", label),
      createElement("span", "", `$${formatMoney(value)}`)
    );
    return row;
  }

  function updateCartCount() {
    const totalCount = Object.values(cart).reduce((sum, item) => sum + item.count, 0);
    cartCountEl.textContent = String(totalCount);
  }

  function renderProducts() {
    productSection.replaceChildren();

    products.forEach((product) => {
      const quantity = getCartQuantity(product.id);

      const productCard = createElement("article", "product");
      productCard.appendChild(createElement("p", "produce-id", product.produceId));

      const image = createElement("img", "product-image");
      image.src = product.image;
      image.alt = product.name;
      productCard.appendChild(image);

      const meta = createElement("div", "item-meta");
      meta.append(
        createElement("h2", "", product.name),
        createElement("p", "price", `$${formatMoney(product.price)}`)
      );
      productCard.appendChild(meta);

      productCard.appendChild(createElement("p", "order-limit", `Batas pesanan: ${product.orderLimit} per item`));

      const controls = createElement("div", "quantity-controls");
      const minusButton = createElement("button", "quantity-button minus-button", "-");
      minusButton.type = "button";
      minusButton.dataset.id = String(product.id);
      minusButton.disabled = quantity <= 0;
      minusButton.setAttribute("aria-label", `Kurangi ${product.name}`);

      const quantityDisplay = createElement("span", "quantity-display", String(quantity));
      quantityDisplay.id = `quantity-${product.id}`;

      const plusButton = createElement("button", "quantity-button plus-button", "+");
      plusButton.type = "button";
      plusButton.dataset.id = String(product.id);
      plusButton.disabled = quantity >= product.orderLimit;
      plusButton.setAttribute("aria-label", `Tambah ${product.name}`);

      controls.append(minusButton, quantityDisplay, plusButton);
      productCard.appendChild(controls);
      productSection.appendChild(productCard);
    });
  }

  function renderPriceBreakdown() {
    const subtotal = calculateSubtotal();
    priceBreakdownEl.replaceChildren(
      createPriceRow("Subtotal", subtotal),
      createPriceRow("Biaya tambahan", 0)
    );
    totalPriceEl.textContent = formatMoney(subtotal);
  }

  function renderCartItem(product, item) {
    const itemTotal = item.count * product.price;
    const listItem = createElement("div", "cart-item");

    const top = createElement("div", "cart-item-top");
    const info = createElement("div");
    info.append(
      createElement("div", "cart-item-name", product.name),
      createElement("div", "cart-item-price", `$${formatMoney(product.price)} / buah`)
    );
    top.append(info, createElement("strong", "", `$${formatMoney(itemTotal)}`));

    const controls = createElement("div", "cart-item-controls");
    const quantityInput = createElement("input", "edit-quantity-input");
    quantityInput.type = "number";
    quantityInput.min = "1";
    quantityInput.max = String(product.orderLimit);
    quantityInput.step = "1";
    quantityInput.value = String(item.count);
    quantityInput.dataset.id = String(product.id);
    quantityInput.setAttribute("aria-label", `Jumlah ${product.name}`);

    const deleteButton = createElement("button", "delete-button", "Hapus");
    deleteButton.type = "button";
    deleteButton.dataset.id = String(product.id);
    deleteButton.setAttribute("aria-label", `Hapus ${product.name}`);

    controls.append(quantityInput, deleteButton);
    listItem.append(top, controls);
    return listItem;
  }

  function renderCart() {
    cartDetailsEl.replaceChildren();

    if (Object.keys(cart).length === 0) {
      cartDetailsEl.appendChild(createElement("p", "empty-cart", "Keranjang kamu masih kosong."));
    } else {
      Object.entries(cart).forEach(([id, item]) => {
        const product = findProduct(id);
        if (product) cartDetailsEl.appendChild(renderCartItem(product, item));
      });

      const note = noteInput.value.trim();
      if (note) {
        cartDetailsEl.appendChild(createElement("div", "note-preview", `Catatan: ${note}`));
      }
    }

    renderPriceBreakdown();
    updateCartCount();
    renderProducts();
  }

  function showToast(message) {
    toast.textContent = message;
    toast.classList.add("show");
    clearTimeout(showToast.timer);
    showToast.timer = setTimeout(() => toast.classList.remove("show"), 3000);
  }

  function addToCart(id) {
    const product = findProduct(id);
    if (!product) return;

    const currentQuantity = getCartQuantity(product.id);
    if (currentQuantity >= product.orderLimit) {
      showToast(`Batas pesanan ${product.name} adalah ${product.orderLimit}.`);
      return;
    }

    cart[product.id] = { count: currentQuantity + 1 };
    renderCart();
  }

  function removeFromCart(id) {
    if (!cart[id]) return;

    cart[id].count -= 1;
    if (cart[id].count <= 0) delete cart[id];
    renderCart();
  }

  function deleteItem(id) {
    delete cart[id];
    renderCart();
  }

  function updateQuantity(id, rawValue) {
    const product = findProduct(id);
    if (!product || !cart[id]) return;

    const quantity = Number(rawValue);
    if (!Number.isInteger(quantity)) {
      showToast("Jumlah barang harus angka bulat.");
      renderCart();
      return;
    }

    if (quantity < 1) {
      delete cart[id];
      renderCart();
      return;
    }

    if (quantity > product.orderLimit) {
      cart[id].count = product.orderLimit;
      showToast(`Batas pesanan ${product.name} adalah ${product.orderLimit}.`);
      renderCart();
      return;
    }

    cart[id].count = quantity;
    renderCart();
  }

  function appendReviewLine(parent, label, amount, className = "row") {
    const row = createElement("div", className);
    row.append(
      createElement("span", "", label),
      createElement("span", "", `$${formatMoney(amount)}`)
    );
    parent.appendChild(row);
  }

  function openReview() {
    if (Object.keys(cart).length === 0) {
      showToast("Keranjang kamu masih kosong.");
      return;
    }

    const itemsEl = document.getElementById("review-items");
    itemsEl.replaceChildren();

    Object.entries(cart).forEach(([id, item]) => {
      const product = findProduct(id);
      if (!product) return;

      const row = createElement("div", "review-line");
      row.append(
        createElement("span", "", `${product.name} x ${item.count}`),
        createElement("span", "", `$${formatMoney(item.count * product.price)}`)
      );
      itemsEl.appendChild(row);
    });

    const noteWrap = document.getElementById("review-note-wrap");
    noteWrap.replaceChildren();
    const note = noteInput.value.trim();
    if (note) noteWrap.appendChild(createElement("div", "review-note", `Catatan: ${note}`));

    const subtotal = calculateSubtotal();
    const reviewBreakdown = document.getElementById("review-breakdown");
    reviewBreakdown.replaceChildren();
    appendReviewLine(reviewBreakdown, "Subtotal", subtotal);
    appendReviewLine(reviewBreakdown, "Biaya tambahan", 0);
    appendReviewLine(reviewBreakdown, "Total", subtotal, "row grand");

    reviewModal.classList.add("open");
  }

  function closeReview() {
    reviewModal.classList.remove("open");
  }

  function placeOrder() {
    closeReview();
    cart = {};
    noteInput.value = "";
    renderCart();
    showToast("Pesanan masuk. Terima kasih.");
  }

  document.addEventListener("click", (event) => {
    const target = event.target;

    if (target.classList.contains("plus-button")) addToCart(target.dataset.id);
    if (target.classList.contains("minus-button")) removeFromCart(target.dataset.id);
    if (target.classList.contains("delete-button")) deleteItem(target.dataset.id);
    if (target.id === "checkout-button") openReview();
    if (target.id === "review-confirm") placeOrder();
    if (target.id === "review-back" || target === reviewModal) closeReview();
  });

  document.addEventListener("change", (event) => {
    const target = event.target;
    if (target.classList.contains("edit-quantity-input")) updateQuantity(target.dataset.id, target.value);
  });

  noteInput.addEventListener("input", renderCart);

  renderProducts();
  renderCart();
});
