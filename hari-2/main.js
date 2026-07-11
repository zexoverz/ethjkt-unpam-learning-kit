document.addEventListener("DOMContentLoaded", () => {

  // DATA PRODUK
  const products = [
    { id: 1, name: "Apel Fuji", price: 1.5, image: "images/apple.png" },
    { id: 2, name: "Jeruk Navel", price: 2.0, image: "images/orange.png" },
    { id: 3, name: "Pisang", price: 1.2, image: "images/banana.png" },
    { id: 4, name: "Anggur", price: 3.5, image: "images/grape.png" },
    { id: 5, name: "Stroberi", price: 4.5, image: "images/strawberry.png" },
    { id: 6, name: "Blueberry", price: 5.0, image: "images/blueberry.png" },
    { id: 7, name: "Nanas", price: 3.0, image: "images/pineapple.png" },
    { id: 8, name: "Mangga", price: 2.8, image: "images/mango.png" },
    { id: 9, name: "Kiwi", price: 1.9, image: "images/kiwi.png" },
    { id: 10, name: "Semangka (Potong)", price: 3.2, image: "images/watermelon.png" }
  ];
  let cart = [];

  const productList = document.getElementById("product-list");
  const cartList = document.getElementById("cart-list");
  const totalText = document.getElementById("total");

  // TAMPILKAN PRODUK
  function renderProducts() {
    productList.innerHTML = "";

    products.forEach((item) => {
      const div = document.createElement("div");
      div.classList.add("card");

      div.innerHTML = `
        <b>${item.name}</b> - Rp ${item.price}
        <button>Tambah</button>
      `;

      div.querySelector("button").addEventListener("click", () => {
        addToCart(item);
      });

      productList.appendChild(div);
    });
  }

  // TAMBAH KE KERANJANG
  function addToCart(item) {
    cart.push(item);
    renderCart();
  }

  // HAPUS DARI KERANJANG
  function removeFromCart(index) {
    cart.splice(index, 1);
    renderCart();
  }

  // TAMPILKAN KERANJANG
  function renderCart() {
    cartList.innerHTML = "";

    cart.forEach((item, index) => {
      const div = document.createElement("div");
      div.classList.add("card");

      div.innerHTML = `
  <img src="${product.image}" alt="${product.name}" class="product-img">
  <h3>${product.name}</h3>
  <p>Rp ${product.price}</p>
`;
      div.querySelector("button").addEventListener("click", () => {
        removeFromCart(index);
      });

      cartList.appendChild(div);
    });

    // HITUNG TOTAL
    const total = cart.reduce((sum, item) => sum + item.price, 0);
    totalText.innerText = "Total: Rp " + total;
  }

  renderProducts();
});
