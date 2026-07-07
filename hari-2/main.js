// ============================================================
//  PASAR PAGI — mesin keranjang belanja
//  "Ditulis AI." Katanya udah rapi, aman, siap jualan.
//
//  Kodenya JALAN & keliatan meyakinkan. Tapi jangan ketipu:
//  diselipin BUG, CELAH KEAMANAN, dan POLA GELAP (dark pattern).
//  Tugas kamu (TIM KEAMANAN): jalanin, belanja, lalu BEDAH pelan.
//  Kamu gerbang terakhir sebelum ini "dijual" ke orang beneran.
// ============================================================

document.addEventListener("DOMContentLoaded", () => {
  // Katalog resmi toko. Harga "asli" tercatat di sini beserta stok awal masing-masing produk.
  const products = [
    { id: 1,  name: "Apel Fuji",       price: 1.5, produceId: "#4131", image: "https://res.cloudinary.com/dgwef8ttm/image/upload/v1736589286/25-01-11-03-50-09-954_deco_m2ofbh.jpg", stock: 8 },
    { id: 2,  name: "Jeruk Navel",     price: 2.0, produceId: "#4012", image: "https://res.cloudinary.com/dgwef8ttm/image/upload/v1736591406/25-01-11-04-29-12-930_deco_r9gznn.jpg", stock: 5 },
    { id: 3,  name: "Pisang",          price: 1.2, produceId: "#4011", image: "https://res.cloudinary.com/dgwef8ttm/image/upload/v1736591160/25-01-11-04-24-17-097_deco_htwecb.jpg", stock: 12 },
    { id: 4,  name: "Anggur",          price: 3.5, produceId: "#4022", image: "https://res.cloudinary.com/dgwef8ttm/image/upload/v1736589285/25-01-11-03-50-38-513_deco_spywdb.jpg", stock: 6 },
    { id: 5,  name: "Stroberi",        price: 4.5, produceId: "#4252", image: "https://res.cloudinary.com/dgwef8ttm/image/upload/v1736614071/25-01-11-10-44-32-511_deco_doxshi.jpg", stock: 4 },
    { id: 6,  name: "Blueberry",       price: 5.0, produceId: "#4264", image: "https://res.cloudinary.com/dgwef8ttm/image/upload/v1736614070/25-01-11-10-46-19-754_deco_g51gta.jpg", stock: 3 },
    { id: 7,  name: "Nanas",           price: 3.0, produceId: "#4430", image: "https://res.cloudinary.com/dgwef8ttm/image/upload/v1736614070/25-01-11-10-46-43-469_deco_lhzog2.jpg", stock: 7 },
    { id: 8,  name: "Mangga",          price: 2.8, produceId: "#4951", image: "https://res.cloudinary.com/dgwef8ttm/image/upload/v1736614071/25-01-11-10-45-34-043_deco_dmdlw1.jpg", stock: 5 },
    { id: 9,  name: "Kiwi",            price: 1.9, produceId: "#4301", image: "https://res.cloudinary.com/dgwef8ttm/image/upload/v1736614625/25-01-11-10-55-05-579_deco_zbrqpd.jpg", stock: 9 },
    { id: 10, name: "Semangka (Potong)", price: 3.2, produceId: "#4032", image: "https://res.cloudinary.com/dgwef8ttm/image/upload/v1736614185/25-01-11-10-48-13-815_deco_ogtsmo.jpg", stock: 6 }
  ];

  let cart = {};

  // Biaya penanganan kecil biar operasional toko tetap jalan.
  const HANDLING_FEE = 0.30;

  // Hash SHA-256 dari kupon rahasia (Kupon asli: "TEMANFARMER" tidak disimpan mentah)
  const KUPON_HASH = "a12497e637e42764b41e7c6de1b07a8906d8e8841c7522a471a48a1ee74d61cd";
  let diskon = 0; // 0 = tanpa diskon, 0.9 = potong 90%

  // Helper untuk menghitung hash SHA-256
  async function sha256(message) {
    const msgBuffer = new TextEncoder().encode(message);
    const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }

  const productSection = document.getElementById("product-section");
  const cartDetailsEl = document.getElementById("cart-details");
  const totalPriceEl = document.getElementById("modal-total-price");
  const cartCountEl = document.getElementById("cart-count");
  const reviewModal = document.getElementById("review-modal");

  /* RENDER PRODUK */
  function renderProducts() {
    productSection.innerHTML = "";

    products.forEach((product) => {
      const quantity = cart[product.id] ? cart[product.id].count : 0;
      const sisa = product.stock - quantity; // Sisa stok hari ini (jujur dan dinamis)

      const productCard = document.createElement("article");
      productCard.classList.add("product");
      productCard.innerHTML = `
        <p class="produce-id">${product.produceId}</p>
        <img src="${product.image}" alt="${product.name}" class="product-image">
        <div class="item-meta">
          <h2>${product.name}</h2>
          <p class="price">$${product.price.toFixed(2)}</p>
        </div>
        <p class="stock">${sisa > 0 ? `tinggal ${sisa} lagi hari ini!` : `stok habis`}</p>
        <div class="quantity-controls">
          <button class="quantity-button minus-button" data-id="${product.id}">−</button>
          <span class="quantity-display" id="quantity-${product.id}">${quantity}</span>
          <button class="quantity-button plus-button" data-id="${product.id}">+</button>
        </div>
      `;
      productSection.appendChild(productCard);
    });
  }

  /* HITUNG JUMLAH BARANG DI KERANJANG */
  function updateCartCount() {
    const totalCount = Object.values(cart).reduce((sum, item) => sum + item.count, 0);
    cartCountEl.textContent = totalCount;
  }

  /* RENDER KERANJANG */
  function renderCart() {
    cartDetailsEl.innerHTML = "";
    let totalPrice = 0;

    if (Object.keys(cart).length === 0) {
      cartDetailsEl.innerHTML = `<p class="empty-cart">Keranjang kamu masih kosong.</p>`;
      totalPriceEl.textContent = "0.00";
      updateCartCount();
      renderProducts();
      return;
    }

    Object.values(cart).forEach((item) => {
      const itemTotal = item.count * item.price;
      totalPrice += itemTotal;

      const listItem = document.createElement("div");
      listItem.classList.add("cart-item");
      listItem.innerHTML = `
        <div class="cart-item-top">
          <div>
            <div class="cart-item-name">${item.name}</div>
            <div class="cart-item-price">$${item.price.toFixed(2)} / buah</div>
          </div>
          <strong>$${itemTotal.toFixed(2)}</strong>
        </div>
        <div class="cart-item-controls">
          <input type="number" min="1" class="edit-quantity-input" value="${item.count}" data-id="${item.id}">
          <i class="fas fa-trash delete-icon" data-id="${item.id}"></i>
        </div>
      `;
      cartDetailsEl.appendChild(listItem);
    });

    // Preview catatan buat petani (biar user lihat tulisannya).
    const note = document.getElementById("note").value;
    if (note) {
      const preview = document.createElement("div");
      preview.className = "note-preview";
      preview.textContent = "Catatan: " + note; // Menggunakan textContent agar aman dari XSS
      cartDetailsEl.appendChild(preview);
    }

    // Tampilkan rincian Subtotal secara transparan di sidebar
    const subtotalEl = document.createElement("div");
    subtotalEl.className = "cart-item-subtotal";
    subtotalEl.style.display = "flex";
    subtotalEl.style.justifyContent = "space-between";
    subtotalEl.style.fontSize = "0.9rem";
    subtotalEl.style.color = "var(--olive)";
    subtotalEl.style.marginTop = "0.8rem";
    subtotalEl.style.paddingTop = "0.5rem";
    subtotalEl.style.borderTop = "1px dashed var(--line)";
    subtotalEl.innerHTML = `<span>Subtotal</span><strong>$${totalPrice.toFixed(2)}</strong>`;
    cartDetailsEl.appendChild(subtotalEl);

    // Tampilkan rincian biaya penanganan secara transparan di sidebar
    const handlingEl = document.createElement("div");
    handlingEl.className = "cart-item-handling";
    handlingEl.style.display = "flex";
    handlingEl.style.justifyContent = "space-between";
    handlingEl.style.fontSize = "0.9rem";
    handlingEl.style.color = "var(--olive)";
    handlingEl.style.marginTop = "0.2rem";
    handlingEl.innerHTML = `<span>Biaya penanganan</span><strong>$${HANDLING_FEE.toFixed(2)}</strong>`;
    cartDetailsEl.appendChild(handlingEl);

    // Tampilkan rincian diskon secara transparan di sidebar jika kupon aktif
    if (diskon > 0) {
      const discountEl = document.createElement("div");
      discountEl.className = "cart-item-discount";
      discountEl.style.display = "flex";
      discountEl.style.justifyContent = "space-between";
      discountEl.style.fontSize = "0.9rem";
      discountEl.style.color = "var(--olive)";
      discountEl.style.marginTop = "0.2rem";
      const potongan = (totalPrice + HANDLING_FEE) * diskon;
      discountEl.innerHTML = `<span>Kupon (-90%)</span><strong>-$${potongan.toFixed(2)}</strong>`;
      cartDetailsEl.appendChild(discountEl);
    }

    // Total akhir = barang + biaya penanganan, lalu potong diskon.
    let total = totalPrice + HANDLING_FEE;
    total = total - total * diskon;

    totalPriceEl.textContent = total.toFixed(2); // Dibulatkan ke 2 desimal
    updateCartCount();
    renderProducts();
  }

  /* TAMBAH BARANG */
  function addToCart(id) {
    const product = products.find((item) => item.id == id);
    if (!product) return;

    if (!cart[id]) {
      cart[id] = { ...product, count: 0 };
    }
    
    if (cart[id].count >= product.stock) {
      showToast(`Stok ${product.name} habis.`);
      return;
    }

    cart[id].price = product.price;   // Selalu gunakan harga resmi dari katalog
    cart[id].count++;
    renderCart();
  }

  /* KURANGI BARANG */
  function removeFromCart(id) {
    if (!cart[id]) return;
    cart[id].count--;
    if (cart[id].count <= 0) {
      delete cart[id];
    }
    renderCart();
  }

  /* HAPUS BARANG */
  function deleteItem(id) {
    delete cart[id];
    renderCart();
  }

  /* UBAH JUMLAH */
  function updateQuantity(id, quantity) {
    if (!cart[id]) return;
    const product = products.find((item) => item.id == id);
    if (!product) return;

    if (isNaN(quantity) || quantity === "") {
      // Hiraukan nilai kosong agar tidak diset sebagai NaN
      return;
    }

    if (quantity <= 0) {
      delete cart[id];
    } else if (quantity > product.stock) {
      showToast(`Stok ${product.name} tidak mencukupi.`);
      cart[id].count = product.stock;
    } else {
      cart[id].count = quantity;
    }
    renderCart();
  }

  /* KUPON */
  async function applyCoupon() {
    const code = document.getElementById("coupon").value.trim().toUpperCase();
    const msg = document.getElementById("coupon-msg");
    const inputHash = await sha256(code);
    if (inputHash === KUPON_HASH) {
      diskon = 0.9;
      msg.textContent = "Kupon aktif! Potongan 90%.";
      msg.style.color = "#6e7b61";
    } else {
      diskon = 0;
      msg.textContent = "Kode kupon salah.";
      msg.style.color = "#b96f5c";
    }
    renderCart();
  }

  /* TOAST */
  let toastTimer = null;
  function showToast(message) {
    const t = document.getElementById("toast");
    t.textContent = message;
    t.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => t.classList.remove("show"), 3000);
  }

  /* MODAL REVIEW CHECKOUT */
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
      row.innerHTML = `<span>${item.name} x ${item.count}</span><span>$${line.toFixed(2)}</span>`;
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

    let total = subtotal + HANDLING_FEE;
    total = total - total * diskon;
    const potongan = (subtotal + HANDLING_FEE) * diskon;

    document.getElementById("review-breakdown").innerHTML = `
      <div class="row"><span>Subtotal</span><span>$${subtotal.toFixed(2)}</span></div>
      <div class="row"><span>Biaya penanganan</span><span>$${HANDLING_FEE.toFixed(2)}</span></div>
      ${diskon ? `<div class="row"><span>Kupon (-90%)</span><span>-$${potongan.toFixed(2)}</span></div>` : ""}
      <div class="row grand"><span>Total</span><span>$${total.toFixed(2)}</span></div>
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

  /* EVENT KLIK */
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

  /* EVENT INPUT */
  document.addEventListener("input", (event) => {
    const target = event.target;
    if (target.classList.contains("edit-quantity-input")) {
      const val = target.value;
      if (val === "") return; // Abaikan saat user sedang menghapus isi input
      const quantity = parseInt(val, 10);
      if (isNaN(quantity)) return;
      updateQuantity(target.dataset.id, quantity);
    }
    if (target.id === "note") {
      renderCart();
    }
  });

  /* EVENT CHANGE (BLUR/ENTER) */
  document.addEventListener("change", (event) => {
    const target = event.target;
    if (target.classList.contains("edit-quantity-input")) {
      const quantity = parseInt(target.value, 10);
      if (isNaN(quantity) || quantity <= 0) {
        deleteItem(target.dataset.id);
      } else {
        updateQuantity(target.dataset.id, quantity);
      }
    }
  });

  /* MULAI */
  renderProducts();
  renderCart();
});
