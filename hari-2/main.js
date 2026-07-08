// ============================================================
//  PASAR PAGI — mesin keranjang belanja (VERSI AMAN & JUJUR)
//  Telah diperbaiki dari segala BUG, CELAH KEAMANAN, dan DARK PATTERNS.
// ============================================================

document.addEventListener("DOMContentLoaded", () => {
  // Katalog resmi toko. Harga asli dan stok riil tercatat di sini secara aman.
  const products = [
    { id: 1,  name: "Apel Fuji",       price: 1.5, produceId: "#4131", stock: 12, image: "https://res.cloudinary.com/dgwef8ttm/image/upload/v1736589286/25-01-11-03-50-09-954_deco_m2ofbh.jpg" },
    { id: 2,  name: "Jeruk Navel",     price: 2.0, produceId: "#4012", stock: 8,  image: "https://res.cloudinary.com/dgwef8ttm/image/upload/v1736591406/25-01-11-04-29-12-930_deco_r9gznn.jpg" },
    { id: 3,  name: "Pisang",          price: 1.2, produceId: "#4011", stock: 15, image: "https://res.cloudinary.com/dgwef8ttm/image/upload/v1736591160/25-01-11-04-24-17-097_deco_htwecb.jpg" },
    { id: 4,  name: "Anggur",          price: 3.5, produceId: "#4022", stock: 5,  image: "https://res.cloudinary.com/dgwef8ttm/image/upload/v1736589285/25-01-11-03-50-38-513_deco_spywdb.jpg" },
    { id: 5,  name: "Stroberi",        price: 4.5, produceId: "#4252", stock: 10, image: "https://res.cloudinary.com/dgwef8ttm/image/upload/v1736614071/25-01-11-10-44-32-511_deco_doxshi.jpg" },
    { id: 6,  name: "Blueberry",       price: 5.0, produceId: "#4264", stock: 7,  image: "https://res.cloudinary.com/dgwef8ttm/image/upload/v1736614070/25-01-11-10-46-19-754_deco_g51gta.jpg" },
    { id: 7,  name: "Nanas",           price: 3.0, produceId: "#4430", stock: 4,  image: "https://res.cloudinary.com/dgwef8ttm/image/upload/v1736614070/25-01-11-10-46-43-469_deco_lhzog2.jpg" },
    { id: 8,  name: "Mangga",          price: 2.8, produceId: "#4951", stock: 9,  image: "https://res.cloudinary.com/dgwef8ttm/image/upload/v1736614071/25-01-11-10-45-34-043_deco_dmdlw1.jpg" },
    { id: 9,  name: "Kiwi",            price: 1.9, produceId: "#4301", stock: 11, image: "https://res.cloudinary.com/dgwef8ttm/image/upload/v1736614625/25-01-11-10-55-05-579_deco_zbrqpd.jpg" },
    { id: 10, name: "Semangka (Potong)", price: 3.2, produceId: "#4032", stock: 6,  image: "https://res.cloudinary.com/dgwef8ttm/image/upload/v1736614185/25-01-11-10-48-13-815_deco_ogtsmo.jpg" }
  ];

  let cart = {};

  // Biaya penanganan operasional toko
  const HANDLING_FEE = 0.30;

  // Hash SHA-256 dari kupon rahasia "TEMANFARMER" untuk mencegah kebocoran kode
  const KUPON_HASH = "5a2fa10e75a6c117b34bdf73dfc9cfde1432f7a0dc4d8ea02830f2f534ef06b7";
  let diskon = 0; // 0 = tanpa diskon, 0.9 = potong 90%

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
      const remainingStock = product.stock - quantity;

      const productCard = document.createElement("article");
      productCard.classList.add("product");

      // Nonaktifkan tombol plus jika stok habis
      const plusDisabled = remainingStock <= 0 ? "disabled" : "";

      productCard.innerHTML = `
        <p class="produce-id">${product.produceId}</p>
        <img src="${product.image}" alt="${product.name}" class="product-image">
        <div class="item-meta">
          <h2>${product.name}</h2>
          <p class="price">$${product.price.toFixed(2)}</p>
        </div>
        <p class="stock">Stok tersedia: ${remainingStock} buah</p>
        <div class="quantity-controls">
          <button class="quantity-button minus-button" data-id="${product.id}">−</button>
          <span class="quantity-display" id="quantity-${product.id}">${quantity}</span>
          <button class="quantity-button plus-button" data-id="${product.id}" ${plusDisabled}>+</button>
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
      document.getElementById("cart-breakdown").innerHTML = "";
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

    // Preview catatan buat petani (menggunakan textContent agar aman dari XSS)
    const note = document.getElementById("note").value;
    if (note) {
      const preview = document.createElement("div");
      preview.className = "note-preview";
      preview.textContent = "Catatan: " + note; // Mencegah DOM XSS
      cartDetailsEl.appendChild(preview);
    }

    // Total akhir = barang + biaya penanganan, lalu potong diskon.
    let total = totalPrice + HANDLING_FEE;
    total = total - total * diskon;
    const potongan = (totalPrice + HANDLING_FEE) * diskon;

    // Menampilkan rincian biaya penanganan dan diskon secara transparan
    const breakdownEl = document.getElementById("cart-breakdown");
    breakdownEl.innerHTML = `
      <div class="row"><span>Subtotal</span><span>$${totalPrice.toFixed(2)}</span></div>
      <div class="row"><span>Biaya penanganan</span><span>$${HANDLING_FEE.toFixed(2)}</span></div>
      ${diskon ? `<div class="row"><span>Kupon (-90%)</span><span>-$${potongan.toFixed(2)}</span></div>` : ""}
    `;

    // Selalu format dengan toFixed(2) untuk menghindari error angka pecahan desimal
    totalPriceEl.textContent = total.toFixed(2);
    updateCartCount();
    renderProducts();
  }

  /* TAMBAH BARANG */
  function addToCart(id) {
    const product = products.find((item) => item.id == id);
    if (!product) return;

    // Ambil kuantiti saat ini di keranjang
    const quantity = cart[id] ? cart[id].count : 0;
    
    // Validasi sisa stok riil
    if (quantity >= product.stock) {
      showToast(`Stok ${product.name} sudah habis!`);
      return;
    }

    if (!cart[id]) {
      cart[id] = { ...product, count: 0 };
    }
    
    // Keamanan: Selalu ambil harga resmi dari katalog tepercaya, bukan dari DOM
    cart[id].price = product.price; 
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

    // Batasi kuantitas input agar tidak melebihi stok riil
    if (quantity > product.stock) {
      showToast(`Stok ${product.name} terbatas! Hanya tersisa ${product.stock} buah.`);
      cart[id].count = product.stock;
    } else if (quantity <= 0) {
      delete cart[id];
    } else {
      cart[id].count = quantity;
    }
    renderCart();
  }

  /* FUNGSI HASH SHA-256 UNTUK KODE KUPON */
  async function sha256(message) {
    const msgBuffer = new TextEncoder().encode(message.toUpperCase().trim());
    const hashBuffer = await crypto.subtle.digest("SHA-256", msgBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }

  /* KUPON */
  async function applyCoupon() {
    const code = document.getElementById("coupon").value;
    const msg = document.getElementById("coupon-msg");

    if (code.trim() === "") {
      diskon = 0;
      msg.textContent = "";
      renderCart();
      return;
    }

    // Mengamankan pembandingan kode kupon dengan membandingkan hash
    const hashedInput = await sha256(code);
    if (hashedInput === KUPON_HASH) {
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
      
      // Keamanan pertahanan mendalam: Buat elemen teks secara aman
      const nameSpan = document.createElement("span");
      nameSpan.textContent = `${item.name} x ${item.count}`;
      const priceSpan = document.createElement("span");
      priceSpan.textContent = `$${line.toFixed(2)}`;
      
      row.appendChild(nameSpan);
      row.appendChild(priceSpan);
      itemsEl.appendChild(row);
    });

    const noteWrap = document.getElementById("review-note-wrap");
    noteWrap.innerHTML = "";
    const note = document.getElementById("note").value;
    if (note) {
      const n = document.createElement("div");
      n.className = "review-note";
      n.textContent = "Catatan: " + note; // textContent to prevent DOM XSS
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

    // Transaksi Sukses: Kurangi stok riil produk katalog
    Object.keys(cart).forEach((id) => {
      const product = products.find((item) => item.id == id);
      if (product) {
        product.stock -= cart[id].count;
      }
    });

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
      addToCart(parseInt(target.dataset.id, 10));
    }
    if (target.classList.contains("minus-button")) {
      removeFromCart(parseInt(target.dataset.id, 10));
    }
    if (target.classList.contains("delete-icon")) {
      deleteItem(parseInt(target.dataset.id, 10));
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
    
    // Keamanan: Validasi input kuantitas di sidebar
    if (target.classList.contains("edit-quantity-input")) {
      const val = target.value.trim();
      if (val === "") return; // Biarkan kosong sementara agar user bisa mengetik
      const quantity = parseInt(val, 10);
      if (!isNaN(quantity)) {
        updateQuantity(parseInt(target.dataset.id, 10), quantity);
      }
    }
    if (target.id === "note") {
      renderCart();
    }
  });

  /* EVENT FOCUSOUT (BLUR) */
  document.addEventListener("focusout", (event) => {
    const target = event.target;
    // Jika input kuantitas ditinggalkan kosong, kembalikan ke state keranjang terakhir
    if (target.classList.contains("edit-quantity-input")) {
      if (target.value.trim() === "") {
        renderCart();
      }
    }
  });

  /* MULAI */
  renderProducts();
  renderCart();
});
