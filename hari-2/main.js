document.addEventListener("DOMContentLoaded", () => {
  const MAX_TOTAL_ITEMS = 24;
  const HANDLING_FEE_CENTS = 30;

  const products = [
    { id: 1, name: "Apel Fuji", priceCents: 150, produceId: "#4131", stock: 8, image: "https://res.cloudinary.com/dgwef8ttm/image/upload/v1736589286/25-01-11-03-50-09-954_deco_m2ofbh.jpg" },
    { id: 2, name: "Jeruk Navel", priceCents: 200, produceId: "#4012", stock: 7, image: "https://res.cloudinary.com/dgwef8ttm/image/upload/v1736591406/25-01-11-04-29-12-930_deco_r9gznn.jpg" },
    { id: 3, name: "Pisang", priceCents: 120, produceId: "#4011", stock: 10, image: "https://res.cloudinary.com/dgwef8ttm/image/upload/v1736591160/25-01-11-04-24-17-097_deco_htwecb.jpg" },
    { id: 4, name: "Anggur", priceCents: 350, produceId: "#4022", stock: 5, image: "https://res.cloudinary.com/dgwef8ttm/image/upload/v1736589285/25-01-11-03-50-38-513_deco_spywdb.jpg" },
    { id: 5, name: "Stroberi", priceCents: 450, produceId: "#4252", stock: 6, image: "https://res.cloudinary.com/dgwef8ttm/image/upload/v1736614071/25-01-11-10-44-32-511_deco_doxshi.jpg" },
    { id: 6, name: "Blueberry", priceCents: 500, produceId: "#4264", stock: 4, image: "https://res.cloudinary.com/dgwef8ttm/image/upload/v1736614070/25-01-11-10-46-19-754_deco_g51gta.jpg" },
    { id: 7, name: "Nanas", priceCents: 300, produceId: "#4430", stock: 5, image: "https://res.cloudinary.com/dgwef8ttm/image/upload/v1736614070/25-01-11-10-46-43-469_deco_lhzog2.jpg" },
    { id: 8, name: "Mangga", priceCents: 280, produceId: "#4951", stock: 7, image: "https://res.cloudinary.com/dgwef8ttm/image/upload/v1736614071/25-01-11-10-45-34-043_deco_dmdlw1.jpg" },
    { id: 9, name: "Kiwi", priceCents: 190, produceId: "#4301", stock: 8, image: "https://res.cloudinary.com/dgwef8ttm/image/upload/v1736614625/25-01-11-10-55-05-579_deco_zbrqpd.jpg" },
    { id: 10, name: "Semangka (Potong)", priceCents: 320, produceId: "#4032", stock: 6, image: "https://res.cloudinary.com/dgwef8ttm/image/upload/v1736614185/25-01-11-10-48-13-815_deco_ogtsmo.jpg" }
  ];

  let cart = {};
  let discountRate = 0;
  let currentProductIndex = 0;
  let expandedProducts = false;

  const productSection = document.getElementById("product-section");
  const cartDetailsEl = document.getElementById("cart-details");
  const totalPriceEl = document.getElementById("modal-total-price");
  const cartCountEl = document.getElementById("cart-count");
  const reviewModal = document.getElementById("review-modal");
  const couponMsg = document.getElementById("coupon-msg");

  function money(cents) {
    return (cents / 100).toFixed(2);
  }

  function createEl(tag, className, text) {
    const el = document.createElement(tag);
    if (className) el.className = className;
    if (text !== undefined) el.textContent = text;
    return el;
  }

  function getProduct(id) {
    return products.find((item) => item.id === Number(id));
  }

  function getItemCount() {
    return Object.values(cart).reduce((sum, item) => sum + item.count, 0);
  }

  function getSubtotalCents() {
    return Object.values(cart).reduce((sum, item) => sum + item.count * item.priceCents, 0);
  }

  function getDiscountCents(subtotalCents) {
    const base = subtotalCents > 0 ? subtotalCents + HANDLING_FEE_CENTS : 0;
    return Math.round(base * discountRate);
  }

  function getTotals() {
    const subtotalCents = getSubtotalCents();
    const feeCents = subtotalCents > 0 ? HANDLING_FEE_CENTS : 0;
    const discountCents = getDiscountCents(subtotalCents);
    return {
      subtotalCents,
      feeCents,
      discountCents,
      totalCents: subtotalCents + feeCents - discountCents
    };
  }

  function buildProductCard(product) {
    const quantity = cart[product.id] ? cart[product.id].count : 0;
    const remaining = product.stock - quantity;
    const card = createEl("article", "product");

    const produceId = createEl("p", "produce-id", product.produceId);
    const image = createEl("img", "product-image");
    image.src = product.image;
    image.alt = product.name;

    const meta = createEl("div", "item-meta");
    meta.append(createEl("h2", "", product.name), createEl("p", "price", `$${money(product.priceCents)}`));

    const stock = createEl("p", "stock", `Stok tersedia: ${remaining} dari ${product.stock}`);
    const controls = createEl("div", "quantity-controls");
    const minus = createEl("button", "quantity-button minus-button", "-");
    minus.type = "button";
    minus.dataset.id = product.id;
    const count = createEl("span", "quantity-display", String(quantity));
    count.id = `quantity-${product.id}`;
    const plus = createEl("button", "quantity-button plus-button", "+");
    plus.type = "button";
    plus.dataset.id = product.id;
    plus.disabled = remaining <= 0 || getItemCount() >= MAX_TOTAL_ITEMS;

    controls.append(minus, count, plus);
    card.append(produceId, image, meta, stock, controls);
    return card;
  }

  function renderProducts() {
    productSection.replaceChildren();
    productSection.className = expandedProducts ? "product-section expanded" : "product-section carousel-mode";

    if (expandedProducts) {
      products.forEach((product) => productSection.appendChild(buildProductCard(product)));
      return;
    }

    const frame = createEl("div", "carousel-frame");
    const previous = createEl("button", "carousel-btn prev-product", "<");
    previous.type = "button";
    previous.setAttribute("aria-label", "Produk sebelumnya");
    const next = createEl("button", "carousel-btn next-product", ">");
    next.type = "button";
    next.setAttribute("aria-label", "Produk berikutnya");

    const activeProduct = products[currentProductIndex];
    const stage = createEl("div", "carousel-stage");
    stage.appendChild(buildProductCard(activeProduct));

    const indicator = createEl("p", "carousel-indicator", `${currentProductIndex + 1} / ${products.length}`);
    const expand = createEl("button", "expand-products", "Expand");
    expand.type = "button";
    expand.id = "expand-products";

    frame.append(previous, stage, next);
    productSection.append(frame, indicator, expand);
  }

  function renderBreakdown(container, totals, grandClass = false) {
    container.replaceChildren();
    const rows = [
      ["Subtotal", `$${money(totals.subtotalCents)}`],
      ["Biaya penanganan", `$${money(totals.feeCents)}`]
    ];

    if (totals.discountCents > 0) {
      rows.push(["Kupon", `-$${money(totals.discountCents)}`]);
    }

    rows.push(["Total", `$${money(totals.totalCents)}`]);

    rows.forEach(([label, value], index) => {
      const row = createEl("div", index === rows.length - 1 && grandClass ? "row grand" : "row");
      row.append(createEl("span", "", label), createEl("span", "", value));
      container.appendChild(row);
    });
  }

  function renderCart() {
    cartDetailsEl.replaceChildren();
    const totals = getTotals();

    if (Object.keys(cart).length === 0) {
      cartDetailsEl.appendChild(createEl("p", "empty-cart", "Keranjang kamu masih kosong."));
      totalPriceEl.textContent = "0.00";
      updateCartCount();
      renderProducts();
      return;
    }

    Object.values(cart).forEach((item) => {
      const itemTotal = item.count * item.priceCents;
      const listItem = createEl("div", "cart-item");
      const top = createEl("div", "cart-item-top");
      const info = createEl("div");
      info.append(createEl("div", "cart-item-name", item.name), createEl("div", "cart-item-price", `$${money(item.priceCents)} / buah`));
      top.append(info, createEl("strong", "", `$${money(itemTotal)}`));

      const controls = createEl("div", "cart-item-controls");
      const input = createEl("input", "edit-quantity-input");
      input.type = "number";
      input.min = "1";
      input.max = String(Math.min(item.stock, MAX_TOTAL_ITEMS));
      input.value = String(item.count);
      input.dataset.id = item.id;
      const deleteButton = createEl("button", "delete-icon", "Hapus");
      deleteButton.type = "button";
      deleteButton.dataset.id = item.id;
      controls.append(input, deleteButton);
      listItem.append(top, controls);
      cartDetailsEl.appendChild(listItem);
    });

    const note = document.getElementById("note").value.trim();
    if (note) {
      cartDetailsEl.appendChild(createEl("div", "note-preview", `Catatan: ${note}`));
    }

    const breakdown = createEl("div", "cart-breakdown");
    renderBreakdown(breakdown, totals);
    cartDetailsEl.appendChild(breakdown);

    totalPriceEl.textContent = money(totals.totalCents);
    updateCartCount();
    renderProducts();
  }

  function updateCartCount() {
    cartCountEl.textContent = String(getItemCount());
  }

  function addToCart(id) {
    const product = getProduct(id);
    if (!product) return;

    const currentCount = cart[product.id] ? cart[product.id].count : 0;
    if (getItemCount() >= MAX_TOTAL_ITEMS) {
      showToast(`Maksimal ${MAX_TOTAL_ITEMS} barang per pesanan.`);
      return;
    }
    if (currentCount >= product.stock) {
      showToast(`${product.name} sudah mencapai batas stok.`);
      return;
    }

    cart[product.id] = { ...product, count: currentCount + 1 };
    renderCart();
  }

  function removeFromCart(id) {
    const productId = Number(id);
    if (!cart[productId]) return;
    cart[productId].count--;
    if (cart[productId].count <= 0) {
      delete cart[productId];
    }
    renderCart();
  }

  function deleteItem(id) {
    delete cart[Number(id)];
    renderCart();
  }

  function updateQuantity(id, value) {
    const productId = Number(id);
    const item = cart[productId];
    if (!item) return;

    const quantity = Number(value);
    const otherItemsCount = getItemCount() - item.count;
    const maxAllowed = Math.min(item.stock, MAX_TOTAL_ITEMS - otherItemsCount);

    if (!Number.isInteger(quantity) || quantity < 1) {
      showToast("Jumlah harus berupa angka bulat minimal 1.");
      renderCart();
      return;
    }
    if (quantity > maxAllowed) {
      showToast(`Maksimal ${maxAllowed} untuk item ini.`);
      item.count = maxAllowed;
      renderCart();
      return;
    }

    item.count = quantity;
    renderCart();
  }

  function applyCoupon() {
    const code = document.getElementById("coupon").value;

    discountRate = 0;
    if (code.trim()) {
      couponMsg.textContent = "Kode kupon dicatat. Diskon divalidasi saat pembayaran.";
      couponMsg.className = "coupon-msg success";
    } else {
      couponMsg.textContent = "Masukkan kode kupon terlebih dahulu.";
      couponMsg.className = "coupon-msg error";
    }
    renderCart();
  }

  let toastTimer = null;
  function showToast(message) {
    const toast = document.getElementById("toast");
    toast.textContent = message;
    toast.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove("show"), 3000);
  }

  function openReview() {
    if (Object.keys(cart).length === 0) {
      showToast("Keranjang kamu masih kosong.");
      return;
    }

    const itemsEl = document.getElementById("review-items");
    itemsEl.replaceChildren();

    Object.values(cart).forEach((item) => {
      const line = item.count * item.priceCents;
      const row = createEl("div", "review-line");
      row.append(createEl("span", "", `${item.name} x ${item.count}`), createEl("span", "", `$${money(line)}`));
      itemsEl.appendChild(row);
    });

    const noteWrap = document.getElementById("review-note-wrap");
    noteWrap.replaceChildren();
    const note = document.getElementById("note").value.trim();
    if (note) {
      noteWrap.appendChild(createEl("div", "review-note", `Catatan: ${note}`));
    }

    renderBreakdown(document.getElementById("review-breakdown"), getTotals(), true);
    reviewModal.classList.add("open");
  }

  function closeReview() {
    reviewModal.classList.remove("open");
  }

  function placeOrder() {
    closeReview();
    cart = {};
    discountRate = 0;
    document.getElementById("note").value = "";
    document.getElementById("coupon").value = "";
    couponMsg.textContent = "";
    couponMsg.className = "coupon-msg";
    renderCart();
    showToast("Pesanan masuk! Sampai jumpa besok pagi.");
  }

  function moveCarousel(direction) {
    currentProductIndex = (currentProductIndex + direction + products.length) % products.length;
    renderProducts();
  }

  function expandProducts() {
    const frame = productSection.querySelector(".carousel-frame");
    if (frame) frame.classList.add("bursting");
    setTimeout(() => {
      expandedProducts = true;
      renderProducts();
    }, 520);
  }

  document.addEventListener("click", (event) => {
    const target = event.target;

    if (target.classList.contains("plus-button")) addToCart(target.dataset.id);
    if (target.classList.contains("minus-button")) removeFromCart(target.dataset.id);
    if (target.classList.contains("delete-icon")) deleteItem(target.dataset.id);
    if (target.id === "apply-coupon") applyCoupon();
    if (target.id === "checkout-button") openReview();
    if (target.id === "review-confirm") placeOrder();
    if (target.id === "review-back" || target === reviewModal) closeReview();
    if (target.classList.contains("prev-product")) moveCarousel(-1);
    if (target.classList.contains("next-product")) moveCarousel(1);
    if (target.id === "expand-products") expandProducts();
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
