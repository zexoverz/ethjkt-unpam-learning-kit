// ============================================================
// KampusSwap - frontend (ethers.js v6 + MetaMask)
//
// DEX mini lengkap: SWAP + TAMBAH/TARIK LIKUIDITAS + HISTORY.
// Alamat & logo ada di config.js -> MURID EDIT DI SANA, bukan di sini.
// ============================================================

const TOKEN_A_ADDRESS = CONFIG.TOKEN_A.address;
const TOKEN_B_ADDRESS = CONFIG.TOKEN_B.address;
const AMM_ADDRESS = CONFIG.AMM_ADDRESS;
const SEPOLIA_CHAIN_ID = BigInt(CONFIG.SEPOLIA_CHAIN_ID);
const SEPOLIA_HEX = "0x" + SEPOLIA_CHAIN_ID.toString(16); // "0xaa36a7"

const ERC20_ABI = [
  "function symbol() view returns (string)",
  "function decimals() view returns (uint8)",
  "function balanceOf(address) view returns (uint256)",
  "function allowance(address owner, address spender) view returns (uint256)",
  "function approve(address spender, uint256 amount) returns (bool)",
];

const AMM_ABI = [
  "function reserveA() view returns (uint256)",
  "function reserveB() view returns (uint256)",
  "function totalShares() view returns (uint256)",
  "function shares(address) view returns (uint256)",
  "function getAmountOut(uint256 amountIn, uint256 reserveIn, uint256 reserveOut) pure returns (uint256)",
  "function addLiquidity(uint256 amountA, uint256 amountB) returns (uint256)",
  "function removeLiquidity(uint256 shareAmount) returns (uint256, uint256)",
  "function swapAforB(uint256 amountIn) returns (uint256)",
  "function swapBforA(uint256 amountIn) returns (uint256)",
  "event Swapped(address indexed user, address tokenIn, uint256 amountIn, uint256 amountOut)",
  "event LiquidityAdded(address indexed lp, uint256 amountA, uint256 amountB, uint256 sharesMinted)",
  "event LiquidityRemoved(address indexed lp, uint256 amountA, uint256 amountB, uint256 sharesBurned)",
];

// --- state global ---
let provider, signer, account, readProvider;
let chainOk = false;
let tokenA, tokenB, amm;
let decA = 18n, decB = 18n, symA = "TOKEN A", symB = "TOKEN B";
let swapDir = "AtoB";       // arah swap (A->B / B->A)
let curRA = 0n, curRB = 0n; // cache reserve (buat auto-pair likuiditas)
let history = [];

const $ = (id) => document.getElementById(id);

function log(msg) {
  const now = new Date().toLocaleTimeString();
  $("log").textContent = `[${now}] ${msg}\n` + $("log").textContent;
}
function fmt(raw, dec) {
  return Number(ethers.formatUnits(raw, dec)).toLocaleString("id-ID", { maximumFractionDigits: 2 });
}
function fmtNum(x) {
  return Number(x).toLocaleString("id-ID", { maximumFractionDigits: 4 });
}
function trimNum(s) {
  const n = Number(s);
  if (!isFinite(n)) return "";
  return String(Math.round(n * 1e6) / 1e6);
}
function ready() {
  if (!account) { alert("Connect wallet dulu."); return false; }
  if (!chainOk) { alert("Pindah ke jaringan Sepolia dulu."); return false; }
  return true;
}

// ============================================================
// TAB SWITCHING
// ============================================================
function showTab(which) {
  const isSwap = which === "swap";
  $("viewSwap").classList.toggle("hidden", !isSwap);
  $("viewLiquidity").classList.toggle("hidden", isSwap);
  $("tabSwap").classList.toggle("tab--active", isSwap);
  $("tabLiquidity").classList.toggle("tab--active", !isSwap);
}
function showSub(which) {
  const isAdd = which === "add";
  $("viewAdd").classList.toggle("hidden", !isAdd);
  $("viewRemove").classList.toggle("hidden", isAdd);
  $("subAdd").classList.toggle("subtab--active", isAdd);
  $("subRemove").classList.toggle("subtab--active", !isAdd);
}
function showLogTab(which) {
  const isLog = which === "log";
  $("log").classList.toggle("hidden", !isLog);
  $("history").classList.toggle("hidden", isLog);
  $("tabLog").classList.toggle("subtab--active", isLog);
  $("tabHistory").classList.toggle("subtab--active", !isLog);
}

// ============================================================
// CONNECT / SWITCH CHAIN / DISCONNECT (satu tombol, 3 keadaan)
// ============================================================
function setConnectBtn(icon, label) {
  $("connectInner").innerHTML = `<i data-lucide="${icon}"></i> <span>${label}</span>`;
  if (window.lucide) lucide.createIcons();
}
function updateConnectBtn() {
  if (!account) return setConnectBtn("wallet", "Connect");
  if (!chainOk) return setConnectBtn("refresh-cw", "Ganti ke Sepolia");
  return setConnectBtn("log-out", "Disconnect");
}
function onConnectClick() {
  if (!account) return connect();
  if (!chainOk) return switchChain();
  return disconnect();
}

async function connect() {
  if (!window.ethereum) {
    alert("MetaMask nggak kedetek. Install extension MetaMask-nya.");
    return;
  }
  sessionStorage.removeItem("ks_disconnected");
  provider = new ethers.BrowserProvider(window.ethereum);
  await provider.send("eth_requestAccounts", []);
  signer = await provider.getSigner();
  account = await signer.getAddress();

  const net = await provider.getNetwork();
  chainOk = net.chainId === SEPOLIA_CHAIN_ID;
  $("account").textContent = account.slice(0, 6) + "…" + account.slice(-4);
  $("network").textContent = chainOk ? "Sepolia" : `chainId ${net.chainId} (bukan Sepolia)`;

  if (chainOk) {
    // pakai signer -> bisa NULIS/transaksi
    tokenA = new ethers.Contract(TOKEN_A_ADDRESS, ERC20_ABI, signer);
    tokenB = new ethers.Contract(TOKEN_B_ADDRESS, ERC20_ABI, signer);
    amm = new ethers.Contract(AMM_ADDRESS, AMM_ABI, signer);
    if (!symA || symA === "TOKEN A") await loadTokenMeta();
    log(`Connected: ${account}`);
    await refresh();
  } else {
    // biarkan contracts tetap read-only (data pool tetap kebaca)
    log("Wallet konek tapi BUKAN Sepolia. Klik 'Ganti ke Sepolia'.");
  }
  updateConnectBtn();
  refreshActionState();
}

async function switchChain() {
  if (!window.ethereum) return;
  try {
    await window.ethereum.request({ method: "wallet_switchEthereumChain", params: [{ chainId: SEPOLIA_HEX }] });
    // MetaMask emit 'chainChanged' -> halaman reload -> auto-connect
  } catch (e) {
    if (e.code === 4902) {
      try {
        await window.ethereum.request({
          method: "wallet_addEthereumChain",
          params: [{
            chainId: SEPOLIA_HEX,
            chainName: "Sepolia",
            nativeCurrency: { name: "Sepolia ETH", symbol: "ETH", decimals: 18 },
            rpcUrls: [CONFIG.RPC_URL],
            blockExplorerUrls: ["https://sepolia.etherscan.io"],
          }],
        });
      } catch (e2) { log("Gagal nambah jaringan: " + (e2.message || e2)); }
    } else {
      log("Gagal ganti jaringan: " + (e.shortMessage || e.message));
    }
  }
}

async function disconnect() {
  sessionStorage.setItem("ks_disconnected", "1");
  // beneran cabut izin biar MetaMask "lupa" akun -> next Connect nanya pilih akun lagi.
  try {
    if (window.ethereum && window.ethereum.request) {
      await window.ethereum.request({ method: "wallet_revokePermissions", params: [{ eth_accounts: {} }] });
    }
  } catch (e) { /* wallet lama nggak support revoke -> abaikan */ }
  signer = null; account = null; provider = null; chainOk = false;
  $("account").textContent = "belum connect";
  $("network").textContent = "-";
  ["balA", "balB", "myShares", "myShares2"].forEach((id) => ($(id).textContent = "-"));
  updateConnectBtn();
  refreshActionState();
  initReadOnly(); // balikin ke read-only + reload data pool
  log("Wallet di-disconnect. Klik Connect buat pilih akun lagi.");
}

// ============================================================
// STATE TOMBOL AKSI (nyala cuma kalau connect + chain bener)
// ============================================================
function refreshActionState() {
  const on = !!account && chainOk;
  const labels = on
    ? { swapBtn: "Swap", addLiqBtn: "Tambah Likuiditas", removeLiqBtn: "Tarik Likuiditas" }
    : (!account
        ? { swapBtn: "Connect dulu", addLiqBtn: "Connect dulu", removeLiqBtn: "Connect dulu" }
        : { swapBtn: "Jaringan salah", addLiqBtn: "Jaringan salah", removeLiqBtn: "Jaringan salah" });
  for (const id in labels) {
    const el = $(id);
    if (el) { el.disabled = !on; el.textContent = labels[id]; }
  }
}
function disableWhilePending(on) {
  ["swapBtn", "addLiqBtn", "removeLiqBtn"].forEach((id) => { const el = $(id); if (el) el.disabled = on; });
  if (!on) refreshActionState();
}
// tombol "loading": spinner + teks langkah (biar tau harus konfirmasi lagi)
function setBtnBusy(btn, text) {
  btn.disabled = true;
  btn.innerHTML = `<span class="spinner"></span><span>${text}</span>`;
}

// ============================================================
// LABEL & DATA
// ============================================================
async function loadTokenMeta() {
  [symA, symB, decA, decB] = await Promise.all([
    tokenA.symbol(), tokenB.symbol(), tokenA.decimals(), tokenB.decimals(),
  ]);
  $("symA").textContent = symA;
  $("symB").textContent = symB;
  $("poolSymA").textContent = symA;
  $("poolSymB").textContent = symB;
  document.querySelectorAll(".ilA").forEach((e) => (e.textContent = symA));
  document.querySelectorAll(".ilB").forEach((e) => (e.textContent = symB));
  updateSwapLabels();
}

function updateSwapLabels() {
  $("fromSym").textContent = swapDir === "AtoB" ? symA : symB;
  $("toSym").textContent = swapDir === "AtoB" ? symB : symA;
  $("fromLogo").src = swapDir === "AtoB" ? CONFIG.TOKEN_A.logo : CONFIG.TOKEN_B.logo;
  $("toLogo").src = swapDir === "AtoB" ? CONFIG.TOKEN_B.logo : CONFIG.TOKEN_A.logo;
}

// muat data pool TANPA wallet (pakai RPC publik).
async function initReadOnly() {
  try {
    readProvider = new ethers.JsonRpcProvider(CONFIG.RPC_URL);
    tokenA = new ethers.Contract(TOKEN_A_ADDRESS, ERC20_ABI, readProvider);
    tokenB = new ethers.Contract(TOKEN_B_ADDRESS, ERC20_ABI, readProvider);
    amm = new ethers.Contract(AMM_ADDRESS, AMM_ABI, readProvider);
    await loadTokenMeta();
    await refresh();
  } catch (e) {
    log("Gagal load data pool: " + (e.shortMessage || e.message));
  }
}

async function refresh() {
  if (!amm) return;
  // POOL = data publik, selalu kebaca.
  const [rA, rB, ts] = await Promise.all([amm.reserveA(), amm.reserveB(), amm.totalShares()]);
  curRA = rA; curRB = rB;
  $("reserveA").textContent = fmt(rA, decA);
  $("reserveB").textContent = fmt(rB, decB);
  $("totalShares").textContent = fmt(ts, 18n);
  $("ratioHint").textContent = (rA > 0n && rB > 0n)
    ? "Isi salah satu, satunya otomatis ngikut rasio pool."
    : "Pool baru: kamu yang tentuin harga awal (isi dua-duanya).";

  // SALDO + share KAMU butuh alamat + chain bener.
  if (account && chainOk) {
    const [balA, balB, myS] = await Promise.all([
      tokenA.balanceOf(account), tokenB.balanceOf(account), amm.shares(account),
    ]);
    $("balA").textContent = fmt(balA, decA);
    $("balB").textContent = fmt(balB, decB);
    $("myShares").textContent = fmt(myS, 18n);
    $("myShares2").textContent = fmt(myS, 18n);
  }
  await preview();
}

// ============================================================
// SWAP PREVIEW (getAmountOut on-chain, GRATIS) -> cek sebelum swap
// ============================================================
async function preview() {
  const val = $("amountIn").value;
  if (!val || Number(val) <= 0 || !amm) { $("amountOut").value = ""; return; }
  try {
    if (swapDir === "AtoB") {
      const out = await amm.getAmountOut(ethers.parseUnits(val, decA), curRA, curRB);
      $("amountOut").value = fmt(out, decB);
    } else {
      const out = await amm.getAmountOut(ethers.parseUnits(val, decB), curRB, curRA);
      $("amountOut").value = fmt(out, decA);
    }
  } catch (e) {
    $("amountOut").value = "pool kosong?";
  }
}

function flip() {
  swapDir = swapDir === "AtoB" ? "BtoA" : "AtoB";
  updateSwapLabels();
  preview();
}

// ============================================================
// AUTO-PAIR LIKUIDITAS (isi satu -> satunya ngikut rasio pool)
// ============================================================
function onAddAInput() {
  if (curRA > 0n && curRB > 0n) {
    const a = $("addA").value;
    if (a && Number(a) > 0) {
      try {
        const amtA = ethers.parseUnits(a, decA);
        const amtB = (amtA * curRB) / curRA;
        $("addB").value = trimNum(ethers.formatUnits(amtB, decB));
      } catch {}
    } else { $("addB").value = ""; }
  }
}
function onAddBInput() {
  if (curRA > 0n && curRB > 0n) {
    const b = $("addB").value;
    if (b && Number(b) > 0) {
      try {
        const amtB = ethers.parseUnits(b, decB);
        const amtA = (amtB * curRA) / curRB;
        $("addA").value = trimNum(ethers.formatUnits(amtA, decA));
      } catch {}
    } else { $("addA").value = ""; }
  }
}

// approve token ke AMM kalau izinnya belum cukup (biar 1 tombol aja).
// status(text) = update tombol biar user tau lagi ngapain.
async function ensureAllowance(token, amount, sym, status) {
  const cur = await token.allowance(account, AMM_ADDRESS);
  if (cur >= amount) return;
  if (status) status(`Approve ${sym} — cek MetaMask`);
  log(`Approve ${sym}... (konfirmasi di MetaMask)`);
  const tx = await token.approve(AMM_ADDRESS, amount);
  if (status) status(`Approve ${sym} terkirim, nunggu…`);
  await tx.wait();
  log(`Approve ${sym} sukses.`);
}

// parse 1 argumen dari event di receipt (buat history).
function parseEventArg(rc, name, arg) {
  for (const lg of rc.logs) {
    try { const p = amm.interface.parseLog(lg); if (p && p.name === name) return p.args[arg]; } catch {}
  }
  return null;
}

// ============================================================
// AKSI: SWAP (satu tombol = approve otomatis kalau perlu + swap)
// ============================================================
async function swap() {
  if (!ready()) return;
  const val = $("amountIn").value;
  if (!val || Number(val) <= 0) return alert("Isi jumlah swap dulu.");
  const dec = swapDir === "AtoB" ? decA : decB;
  const outDec = swapDir === "AtoB" ? decB : decA;
  const token = swapDir === "AtoB" ? tokenA : tokenB;
  const inSym = swapDir === "AtoB" ? symA : symB;
  const outSym = swapDir === "AtoB" ? symB : symA;
  const amountIn = ethers.parseUnits(val, dec);
  const btn = $("swapBtn");
  const status = (t) => setBtnBusy(btn, t);

  disableWhilePending(true);
  try {
    await ensureAllowance(token, amountIn, inSym, status);
    status("Konfirmasi swap di MetaMask");
    log("Kirim swap... (konfirmasi di MetaMask)");
    const tx = swapDir === "AtoB" ? await amm.swapAforB(amountIn) : await amm.swapBforA(amountIn);
    status("Menukar… (nunggu blok)");
    const rc = await tx.wait();

    const outRaw = parseEventArg(rc, "Swapped", "amountOut");
    const amtIn = Number(val);
    const amtOut = outRaw != null ? Number(ethers.formatUnits(outRaw, outDec)) : null;
    const rate = amtOut != null && amtIn > 0 ? amtOut / amtIn : null;
    log("Swap sukses!");
    addHistory({
      type: "swap",
      hash: tx.hash,
      ts: Date.now(),
      aLogo: swapDir === "AtoB" ? CONFIG.TOKEN_A.logo : CONFIG.TOKEN_B.logo,
      aAmt: fmtNum(amtIn), aSym: inSym,
      bLogo: swapDir === "AtoB" ? CONFIG.TOKEN_B.logo : CONFIG.TOKEN_A.logo,
      bAmt: amtOut != null ? fmtNum(amtOut) : "?", bSym: outSym,
      price: rate != null ? `1 ${inSym} = ${fmtNum(rate)} ${outSym}` : "",
    });
    await refresh();
  } catch (e) {
    log("Swap gagal: " + (e.shortMessage || e.message));
  } finally {
    disableWhilePending(false);
  }
}

// ============================================================
// AKSI: TAMBAH LIKUIDITAS (approve dua token + addLiquidity)
// ============================================================
async function addLiquidity() {
  if (!ready()) return;
  const a = $("addA").value, b = $("addB").value;
  if (!a || !b || Number(a) <= 0 || Number(b) <= 0) return alert("Isi jumlah A & B dulu.");
  const amtA = ethers.parseUnits(a, decA), amtB = ethers.parseUnits(b, decB);
  const btn = $("addLiqBtn");
  const status = (t) => setBtnBusy(btn, t);

  disableWhilePending(true);
  try {
    await ensureAllowance(tokenA, amtA, symA, status);
    await ensureAllowance(tokenB, amtB, symB, status);
    status("Konfirmasi tambah di MetaMask");
    log("Kirim addLiquidity... (konfirmasi di MetaMask)");
    const tx = await amm.addLiquidity(amtA, amtB);
    status("Menambah… (nunggu blok)");
    await tx.wait();
    log("Tambah likuiditas sukses! Kamu sekarang LP.");
    addHistory({
      type: "add",
      hash: tx.hash,
      ts: Date.now(),
      aLogo: CONFIG.TOKEN_A.logo, aAmt: fmtNum(Number(a)), aSym: symA,
      bLogo: CONFIG.TOKEN_B.logo, bAmt: fmtNum(Number(b)), bSym: symB,
      price: "",
    });
    await refresh();
  } catch (e) {
    log("Tambah likuiditas gagal: " + (e.shortMessage || e.message));
  } finally {
    disableWhilePending(false);
  }
}

// ============================================================
// AKSI: TARIK LIKUIDITAS (removeLiquidity, nggak perlu approve)
// ============================================================
async function fillMaxShares() {
  if (!ready()) return;
  const s = await amm.shares(account);
  $("removeShares").value = ethers.formatUnits(s, 18);
}

async function removeLiquidity() {
  if (!ready()) return;
  const val = $("removeShares").value;
  if (!val || Number(val) <= 0) return alert("Isi jumlah share yang mau ditarik.");
  const btn = $("removeLiqBtn");
  const status = (t) => setBtnBusy(btn, t);

  disableWhilePending(true);
  try {
    status("Konfirmasi tarik di MetaMask");
    log("Kirim removeLiquidity... (konfirmasi di MetaMask)");
    const tx = await amm.removeLiquidity(ethers.parseUnits(val, 18));
    status("Menarik… (nunggu blok)");
    const rc = await tx.wait();
    const ra = parseEventArg(rc, "LiquidityRemoved", "amountA");
    const rb = parseEventArg(rc, "LiquidityRemoved", "amountB");
    const aAmt = ra != null ? fmtNum(Number(ethers.formatUnits(ra, decA))) : "?";
    const bAmt = rb != null ? fmtNum(Number(ethers.formatUnits(rb, decB))) : "?";
    log("Tarik likuiditas sukses! Dua token balik ke dompetmu.");
    addHistory({
      type: "remove",
      hash: tx.hash,
      ts: Date.now(),
      aLogo: CONFIG.TOKEN_A.logo, aAmt, aSym: symA,
      bLogo: CONFIG.TOKEN_B.logo, bAmt, bSym: symB,
      price: "",
    });
    await refresh();
  } catch (e) {
    log("Tarik likuiditas gagal: " + (e.shortMessage || e.message));
  } finally {
    disableWhilePending(false);
  }
}

// ============================================================
// HISTORY (txhash + token->token + harga), disimpan di localStorage
// ============================================================
const HKEY = "ks_hist_v2_" + (AMM_ADDRESS || "").toLowerCase();
function loadHistory() {
  try { history = JSON.parse(localStorage.getItem(HKEY) || "[]"); } catch { history = []; }
}
function saveHistory() {
  try { localStorage.setItem(HKEY, JSON.stringify(history.slice(0, 50))); } catch {}
}
function addHistory(entry) {
  history.unshift(entry);
  saveHistory();
  renderHistory();
  showLogTab("history"); // langsung tunjukin tab history
}
function renderHistory() {
  const el = $("history");
  if (!history.length) { el.innerHTML = '<p class="hist-empty">Belum ada transaksi.</p>'; return; }
  el.innerHTML = history.map((h) => {
    const short = h.hash ? h.hash.slice(0, 6) + "…" + h.hash.slice(-4) : "";
    const url = h.hash ? "https://sepolia.etherscan.io/tx/" + h.hash : "#";
    const d = h.ts ? new Date(h.ts) : null;
    const date = d ? d.toLocaleDateString("id-ID", { day: "2-digit", month: "2-digit", year: "numeric" }) : "";
    const time = d ? d.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }) : "";
    const mid = h.type === "swap" ? "→" : (h.type === "remove" ? "↑" : "+");
    const via = h.type === "swap" ? "Swap" : (h.type === "remove" ? "Tarik LP" : "Tambah LP");
    return `
      <div class="hist-row">
        <span class="hist-token"><img class="hist-logo" src="${h.aLogo}" alt="" /><span class="hist-amt">${h.aAmt} ${h.aSym}</span></span>
        <span class="hist-arrow">${mid}</span>
        <span class="hist-token"><img class="hist-logo" src="${h.bLogo}" alt="" /><span class="hist-amt">${h.bAmt} ${h.bSym}</span></span>
        <span class="hist-via"><span class="hist-via-top">via <b>KampusSwap</b></span><span class="hist-sub2">${via}</span></span>
        <a class="hist-date" href="${url}" target="_blank" rel="noopener" title="${h.price || ""}">
          <span class="hist-d">${date} <i data-lucide="external-link"></i></span>
          <span class="hist-t">${time}</span>
        </a>
        <span class="hist-check"><i data-lucide="circle-check"></i></span>
      </div>`;
  }).join("");
  if (window.lucide) lucide.createIcons();
}

// ============================================================
// EVENT LISTENERS
// ============================================================
$("connectBtn").addEventListener("click", onConnectClick);
$("tabSwap").addEventListener("click", () => showTab("swap"));
$("tabLiquidity").addEventListener("click", () => showTab("liquidity"));
$("subAdd").addEventListener("click", () => showSub("add"));
$("subRemove").addEventListener("click", () => showSub("remove"));
$("tabLog").addEventListener("click", () => showLogTab("log"));
$("tabHistory").addEventListener("click", () => showLogTab("history"));
$("flipBtn").addEventListener("click", flip);
$("amountIn").addEventListener("input", preview);
$("addA").addEventListener("input", onAddAInput);
$("addB").addEventListener("input", onAddBInput);
$("swapBtn").addEventListener("click", swap);
$("addLiqBtn").addEventListener("click", addLiquidity);
$("maxSharesBtn").addEventListener("click", fillMaxShares);
$("removeLiqBtn").addEventListener("click", removeLiquidity);

// ============================================================
// INIT
// ============================================================
function initUI() {
  $("brandLogo").src = CONFIG.BRAND_LOGO;
  $("titleImg").src = CONFIG.TITLE_IMG;
  document.querySelectorAll(".logoA").forEach((e) => (e.src = CONFIG.TOKEN_A.logo));
  document.querySelectorAll(".logoB").forEach((e) => (e.src = CONFIG.TOKEN_B.logo));
  $("fromLogo").src = CONFIG.TOKEN_A.logo;
  $("toLogo").src = CONFIG.TOKEN_B.logo;
  if (window.lucide) lucide.createIcons();

  showTab("swap");
  showSub("add");
  loadHistory();
  renderHistory();
  showLogTab("history"); // History jadi tab default
  updateConnectBtn();
  refreshActionState();
  boot();
}

async function boot() {
  await initReadOnly();
  if (window.ethereum && window.ethereum.on) {
    // ganti chain / ganti akun -> reload biar state bersih
    window.ethereum.on("chainChanged", () => location.reload());
    window.ethereum.on("accountsChanged", () => location.reload());
    // auto-connect kalau sebelumnya udah authorize (tanpa popup)
    if (sessionStorage.getItem("ks_disconnected") !== "1") {
      try {
        const accs = await window.ethereum.request({ method: "eth_accounts" });
        if (accs && accs.length) await connect();
      } catch {}
    }
  }
}

initUI();
