// ============================================================
// PASAR PAGI - mesin keranjang belanja
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

  const HANDLING_FEE = 0.30;
  const MAX_QUANTITY = 99;
  const PUBLIC_COUPONS = {
    FARM10: 0.1
  };

  let cart = {};
  let discount = 0;
  let toastTimer = null;

  const productSection = document.getElementById("product-section");
  const cartDetailsEl = document.getElementById("cart-details");
  const totalPriceEl = document.getElementById("cart-total-price");
  const handlingFeeEl = document.getElementById("handling-fee");
  const cartCountEl = document.getElementById("cart-count");
  const reviewModal = document.getElementById("review-modal");
  const couponMsgEl = document.getElementById("coupon-msg");

  function money(value) {
    return `$${value.toFixed(2)}`;
  }

  function calculateTotals() {
    const subtotal = Object.values(cart).reduce((sum, item) => {
      return sum + item.count * item.price;
    }, 0);
    const handlingFee = subtotal > 0 ? HANDLING_FEE : 0;
    const beforeDiscount = subtotal + handlingFee;
    const discountAmount = beforeDiscount * discount;

    return {
      subtotal,
      handlingFee,
      discountAmount,
      total: beforeDiscount - discountAmount
    };
  }

  function showToast(message) {
    const toast = document.getElementById("toast");
    toast.textContent = message;
    toast.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove("show"), 3000);
  }

  function renderProducts() {
    productSection.replaceChildren();

    products.forEach((product) => {
      const quantity = cart[product.id]?.count || 0;
      const productCard = document.createElement("article");
      productCard.className = "product";

      const produceId = document.createElement("p");
      produceId.className = "produce-id";
      produceId.textContent = product.produceId;

      const image = document.createElement("img");
      image.src = product.image;
      image.alt = product.name;
      image.className = "product-image";

      const itemMeta = document.createElement("div");
      itemMeta.className = "item-meta";

      const title = document.createElement("h2");
      title.textContent = product.name;

      const price = document.createElement("p");
      price.className = "price";
      price.textContent = money(product.price);

      itemMeta.append(title, price);

      const stock = document.createElement("p");
      stock.className = "stock";
      stock.textContent = "tersedia hari ini";

      const controls = document.createElement("div");
      controls.className = "quantity-controls";

      const minus = document.createElement("button");
      minus.className = "quantity-button minus-button";
      minus.dataset.id = product.id;
      minus.type = "button";
      minus.textContent = "-";

      const quantityDisplay = document.createElement("span");
      quantityDisplay.className = "quantity-display";
      quantityDisplay.id = `quantity-${product.id}`;
      quantityDisplay.textContent = quantity;

      const plus = document.createElement("button");
      plus.className = "quantity-button plus-button";
      plus.dataset.id = product.id;
      plus.type = "button";
      plus.textContent = "+";

      controls.append(minus, quantityDisplay, plus);
      productCard.append(produceId, image, itemMeta, stock, controls);
      productSection.appendChild(productCard);
    });
  }

  function updateCartCount() {
    const totalCount = Object.values(cart).reduce((sum, item) => sum + item.count, 0);
    cartCountEl.textContent = totalCount;
  }

  function renderCart() {
    cartDetailsEl.replaceChildren();

    if (Object.keys(cart).length === 0) {
      const empty = document.createElement("p");
      empty.className = "empty-cart";
      empty.textContent = "Keranjang kamu masih kosong.";
      cartDetailsEl.appendChild(empty);
    } else {
      Object.values(cart).forEach((item) => {
        const itemTotal = item.count * item.price;
        const listItem = document.createElement("div");
        listItem.className = "cart-item";

        const top = document.createElement("div");
        top.className = "cart-item-top";

        const info = document.createElement("div");
        const itemName = document.createElement("div");
        itemName.className = "cart-item-name";
        itemName.textContent = item.name;

        const itemPrice = document.createElement("div");
        itemPrice.className = "cart-item-price";
        itemPrice.textContent = `${money(item.price)} / buah`;

        info.append(itemName, itemPrice);

        const itemTotalEl = document.createElement("strong");
        itemTotalEl.textContent = money(itemTotal);

        top.append(info, itemTotalEl);

        const controls = document.createElement("div");
        controls.className = "cart-item-controls";

        const quantityInput = document.createElement("input");
        quantityInput.type = "number";
        quantityInput.min = "1";
        quantityInput.max = String(MAX_QUANTITY);
        quantityInput.className = "edit-quantity-input";
        quantityInput.value = item.count;
        quantityInput.dataset.id = item.id;

        const deleteIcon = document.createElement("button");
        deleteIcon.className = "delete-icon";
        deleteIcon.type = "button";
        deleteIcon.dataset.id = item.id;
        deleteIcon.textContent = "Hapus";
        deleteIcon.setAttribute("aria-label", `Hapus ${item.name}`);

        controls.append(quantityInput, deleteIcon);
        listItem.append(top, controls);
        cartDetailsEl.appendChild(listItem);
      });

      const note = document.getElementById("note").value.trim();
      if (note) {
        const preview = document.createElement("div");
        preview.className = "note-preview";
        preview.textContent = `Catatan: ${note}`;
        cartDetailsEl.appendChild(preview);
      }
    }

    const totals = calculateTotals();
    handlingFeeEl.textContent = money(totals.handlingFee);
    totalPriceEl.textContent = money(totals.total);
    updateCartCount();
    renderProducts();
  }

  function addToCart(id) {
    const product = products.find((item) => item.id === Number(id));
    if (!product) return;

    if (!cart[product.id]) {
      cart[product.id] = { ...product, count: 0 };
    }

    if (cart[product.id].count >= MAX_QUANTITY) {
      showToast(`Maksimal ${MAX_QUANTITY} buah per item.`);
      return;
    }

    cart[product.id].count += 1;
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
    if (!cart[id]) return;

    if (!Number.isInteger(quantity) || quantity < 1) {
      showToast("Jumlah barang minimal 1.");
      renderCart();
      return;
    }

    cart[id].count = Math.min(quantity, MAX_QUANTITY);
    renderCart();
  }

  function applyCoupon() {
    const code = document.getElementById("coupon").value.trim().toUpperCase();

    if (PUBLIC_COUPONS[code]) {
      discount = PUBLIC_COUPONS[code];
      couponMsgEl.textContent = `Kupon aktif! Potongan ${(discount * 100).toFixed(0)}%.`;
      couponMsgEl.style.color = "#6e7b61";
    } else {
      discount = 0;
      couponMsgEl.textContent = "Kode kupon salah.";
      couponMsgEl.style.color = "#b96f5c";
    }

    renderCart();
  }

  function createBreakdownRow(label, value, isGrand = false) {
    const row = document.createElement("div");
    row.className = isGrand ? "row grand" : "row";

    const labelEl = document.createElement("span");
    labelEl.textContent = label;

    const valueEl = document.createElement("span");
    valueEl.textContent = value;

    row.append(labelEl, valueEl);
    return row;
  }

  function openReview() {
    if (Object.keys(cart).length === 0) {
      showToast("Keranjang kamu masih kosong.");
      return;
    }

    const itemsEl = document.getElementById("review-items");
    itemsEl.replaceChildren();

    Object.values(cart).forEach((item) => {
      const line = item.count * item.price;
      const row = document.createElement("div");
      row.className = "review-line";

      const label = document.createElement("span");
      label.textContent = `${item.name} x ${item.count}`;

      const amount = document.createElement("span");
      amount.textContent = money(line);

      row.append(label, amount);
      itemsEl.appendChild(row);
    });

    const noteWrap = document.getElementById("review-note-wrap");
    noteWrap.replaceChildren();

    const note = document.getElementById("note").value.trim();
    if (note) {
      const noteEl = document.createElement("div");
      noteEl.className = "review-note";
      noteEl.textContent = `Catatan: ${note}`;
      noteWrap.appendChild(noteEl);
    }

    const totals = calculateTotals();
    const breakdown = document.getElementById("review-breakdown");
    breakdown.replaceChildren();
    breakdown.append(
      createBreakdownRow("Subtotal", money(totals.subtotal)),
      createBreakdownRow("Biaya penanganan tetap", money(totals.handlingFee))
    );

    if (discount) {
      breakdown.append(
        createBreakdownRow(`Kupon (-${(discount * 100).toFixed(0)}%)`, `-${money(totals.discountAmount)}`)
      );
    }

    breakdown.append(createBreakdownRow("Total", money(totals.total), true));
    reviewModal.classList.add("open");
    reviewModal.setAttribute("aria-hidden", "false");
  }

  function closeReview() {
    reviewModal.classList.remove("open");
    reviewModal.setAttribute("aria-hidden", "true");
  }

  function placeOrder() {
    closeReview();
    cart = {};
    discount = 0;
    document.getElementById("note").value = "";
    document.getElementById("coupon").value = "";
    couponMsgEl.textContent = "";
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
      updateQuantity(target.dataset.id, Number.parseInt(target.value, 10));
    }
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && reviewModal.classList.contains("open")) {
      closeReview();
    }
  });

  renderProducts();
  renderCart();
});
