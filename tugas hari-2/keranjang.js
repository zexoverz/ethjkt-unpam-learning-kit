// ============================================================
//  PASAR PAGI - mesin keranjang belanja
//  Tugas hari-2: perbaikan bug, keamanan input, stok, dan harga.
// ============================================================

document.addEventListener("DOMContentLoaded", () => {
  const products = [
    { id: 1, name: "Apel Fuji", price: 1.5, stock: 4, produceId: "#4131", image: "https://res.cloudinary.com/dgwef8ttm/image/upload/v1736589286/25-01-11-03-50-09-954_deco_m2ofbh.jpg" },
    { id: 2, name: "Jeruk Navel", price: 2.0, stock: 5, produceId: "#4012", image: "https://res.cloudinary.com/dgwef8ttm/image/upload/v1736591406/25-01-11-04-29-12-930_deco_r9gznn.jpg" },
    { id: 3, name: "Pisang", price: 1.2, stock: 5, produceId: "#4011", image: "https://res.cloudinary.com/dgwef8ttm/image/upload/v1736591160/25-01-11-04-24-17-097_deco_htwecb.jpg" },
    { id: 4, name: "Anggur", price: 3.5, stock: 3, produceId: "#4022", image: "https://res.cloudinary.com/dgwef8ttm/image/upload/v1736589285/25-01-11-03-50-38-513_deco_spywdb.jpg" },
    { id: 5, name: "Stroberi", price: 4.5, stock: 2, produceId: "#4252", image: "https://res.cloudinary.com/dgwef8ttm/image/upload/v1736614071/25-01-11-10-44-32-511_deco_doxshi.jpg" },
    { id: 6, name: "Blueberry", price: 5.0, stock: 2, produceId: "#4264", image: "https://res.cloudinary.com/dgwef8ttm/image/upload/v1736614070/25-01-11-10-46-19-754_deco_g51gta.jpg" },
    { id: 7, name: "Nanas", price: 3.0, stock: 3, produceId: "#4430", image: "https://res.cloudinary.com/dgwef8ttm/image/upload/v1736614070/25-01-11-10-46-43-469_deco_lhzog2.jpg" },
    { id: 8, name: "Mangga", price: 2.8, stock: 4, produceId: "#4951", image: "https://res.cloudinary.com/dgwef8ttm/image/upload/v1736614071/25-01-11-10-45-34-043_deco_dmdlw1.jpg" },
    { id: 9, name: "Kiwi", price: 1.9, stock: 5, produceId: "#4301", image: "https://res.cloudinary.com/dgwef8ttm/image/upload/v1736614625/25-01-11-10-55-05-579_deco_zbrqpd.jpg" },
    { id: 10, name: "Semangka (Potong)", price: 3.2, stock: 3, produceId: "#4032", image: "https://res.cloudinary.com/dgwef8ttm/image/upload/v1736614185/25-01-11-10-48-13-815_deco_ogtsmo.jpg" },
  ];

  let cart = {};
  let discount = 0;

  const HANDLING_FEE = 0.3;
  const COUPON_CODE = "PASARPAGI10";
  const COUPON_DISCOUNT = 0.1;

  const productSection = document.getElementById("product-section");
  const cartDetailsEl = document.getElementById("cart-details");
  const cartSummaryEl = document.getElementById("cart-summary-breakdown");
  const cartCountEl = document.getElementById("cart-count");
  const reviewModal = document.getElementById("review-modal");

  const formatMoney = (value) => value.toFixed(2);

  function getProduct(id) {
    return products.find((product) => product.id === Number(id));
  }

  function buildBreakdown(subtotal) {
    const fee = subtotal > 0 ? HANDLING_FEE : 0;
    const discountAmount = (subtotal + fee) * discount;
    const total = subtotal + fee - discountAmount;

    return {
      subtotal,
      fee,
      discountAmount,
      total,
    };
  }

  function renderBreakdownRows(target, sums) {
    if (!target) return;

    target.innerHTML = `
      <div class="row"><span>Subtotal</span><span>$${formatMoney(sums.subtotal)}</span></div>
      <div class="row"><span>Biaya penanganan</span><span>$${formatMoney(sums.fee)}</span></div>
      ${sums.discountAmount ? `<div class="row"><span>Kupon (-10%)</span><span>-$${formatMoney(sums.discountAmount)}</span></div>` : ""}
      <div class="row grand"><span>Total</span><span>$${formatMoney(sums.total)}</span></div>
    `;
  }

  function updateCartCount() {
    const totalCount = Object.values(cart).reduce((sum, item) => sum + item.count, 0);
    cartCountEl.textContent = totalCount;
  }

  function renderProducts() {
    productSection.innerHTML = "";

    products.forEach((product) => {
      const quantity = cart[product.id] ? cart[product.id].count : 0;
      const remainingStock = product.stock - quantity;
      const outOfStock = remainingStock <= 0;

      const productCard = document.createElement("article");
      productCard.classList.add("product");
      productCard.innerHTML = `
        <p class="produce-id">${product.produceId}</p>
        <img src="${product.image}" alt="${product.name}" class="product-image">
        <div class="item-meta">
          <h2>${product.name}</h2>
          <p class="price">$${formatMoney(product.price)}</p>
        </div>
        <p class="stock">${outOfStock ? "stok habis" : `tinggal ${remainingStock} lagi hari ini!`}</p>
        <div class="quantity-controls">
          <button class="quantity-button minus-button" data-id="${product.id}">-</button>
          <span class="quantity-display" id="quantity-${product.id}">${quantity}</span>
          <button class="quantity-button plus-button" data-id="${product.id}" ${outOfStock ? "disabled" : ""}>+</button>
        </div>
      `;
      productSection.appendChild(productCard);
    });
  }

  function renderCart() {
    cartDetailsEl.innerHTML = "";
    let subtotal = 0;

    if (Object.keys(cart).length === 0) {
      cartDetailsEl.innerHTML = `<p class="empty-cart">Keranjang kamu masih kosong.</p>`;
      renderBreakdownRows(cartSummaryEl, buildBreakdown(0));
      updateCartCount();
      renderProducts();
      return;
    }

    Object.values(cart).forEach((item) => {
      const officialProduct = getProduct(item.id);
      if (!officialProduct) return;

      item.name = officialProduct.name;
      item.price = officialProduct.price;
      item.stock = officialProduct.stock;

      const itemTotal = item.count * item.price;
      subtotal += itemTotal;

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

    renderBreakdownRows(cartSummaryEl, buildBreakdown(subtotal));
    updateCartCount();
    renderProducts();
  }

  function addToCart(id) {
    const product = getProduct(id);
    if (!product) return;

    const currentQuantity = cart[product.id] ? cart[product.id].count : 0;
    if (currentQuantity >= product.stock) {
      showToast(`${product.name} sudah mencapai batas stok hari ini.`);
      return;
    }

    if (!cart[product.id]) {
      cart[product.id] = { ...product, count: 0 };
    }

    cart[product.id].price = product.price;
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

    const product = getProduct(id);
    if (!product || !Number.isInteger(quantity)) {
      renderCart();
      return;
    }

    if (quantity <= 0) {
      delete cart[id];
    } else {
      if (quantity > product.stock) {
        showToast(`${product.name} sudah mencapai batas stok hari ini.`);
      }

      cart[id].count = Math.min(quantity, product.stock);
      cart[id].price = product.price;
      cart[id].stock = product.stock;
    }

    renderCart();
  }

  function applyCoupon() {
    const code = document.getElementById("coupon").value.trim().toUpperCase();
    const msg = document.getElementById("coupon-msg");

    if (code === COUPON_CODE) {
      discount = COUPON_DISCOUNT;
      msg.textContent = "Kupon aktif! Potongan 10%.";
      msg.style.color = "#6e7b61";
    } else {
      discount = 0;
      msg.textContent = "Kode kupon salah.";
      msg.style.color = "#b96f5c";
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
    itemsEl.innerHTML = "";

    let subtotal = 0;
    Object.values(cart).forEach((item) => {
      const officialProduct = getProduct(item.id);
      if (!officialProduct) return;

      const line = item.count * officialProduct.price;
      subtotal += line;

      const row = document.createElement("div");
      row.className = "review-line";
      row.innerHTML = `<span>${officialProduct.name} x ${item.count}</span><span>$${formatMoney(line)}</span>`;
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

    renderBreakdownRows(document.getElementById("review-breakdown"), buildBreakdown(subtotal));
    reviewModal.classList.add("open");
  }

  function closeReview() {
    reviewModal.classList.remove("open");
  }

  function placeOrder() {
    closeReview();
    cart = {};
    discount = 0;
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
      const rawValue = target.value.trim();
      const quantity = rawValue === "" ? NaN : Number(rawValue);
      updateQuantity(target.dataset.id, quantity);
    }

    if (target.id === "note") {
      renderCart();
    }
  });

  renderProducts();
  renderCart();
});
