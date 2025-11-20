/* script.js — step 1: topbar (search, notifications, theme) + sidebar toggle + simple product search */

/* Sidebar toggle (unchanged logic but adapt to topbar presence) */
function toggleSidebar() {
  const sidebar = document.getElementById("sidebar");
  const main = document.getElementById("main");

  // compute current left value reliably
  const curLeft = window.getComputedStyle(sidebar).left;
  if (curLeft === "0px") {
    sidebar.style.left = "-260px";
    main.style.marginLeft = "0px";
  } else {
    sidebar.style.left = "0px";
    main.style.marginLeft = "260px";
  }
}

/* Section switching (same) */
function showSection(pageID) {
  document.querySelectorAll(".page").forEach(sec => sec.classList.remove("active"));
  document.getElementById(pageID).classList.add("active");
}

/* ------- Topbar: search feature (filters product cards) ------- */
const searchInput = document.getElementById("globalSearch");
if (searchInput) {
  searchInput.addEventListener("input", (e) => {
    const q = e.target.value.trim().toLowerCase();
    filterProducts(q);
  });
}

function filterProducts(query) {
  const items = document.querySelectorAll(".product");
  items.forEach(it => {
    const name = (it.dataset.name || it.textContent || "").toLowerCase();
    it.style.display = name.includes(query) ? "" : "none";
  });
}


/* ------- Notifications (demo) ------- */
const notifCountEl = document.getElementById("notifCount");
const notifBtn = document.getElementById("notifBtn");
let demoNotifCount = 3;

function updateNotif() {
  if (!notifCountEl) return;
  if (demoNotifCount > 0) {
    notifCountEl.textContent = demoNotifCount;
    notifCountEl.classList.remove("hidden");
  } else {
    notifCountEl.classList.add("hidden");
  }
}
if (notifBtn) {
  notifBtn.addEventListener("click", () => {
    alert("You have " + demoNotifCount + " demo notifications.");
    // mark as read for demo
    demoNotifCount = 0;
    updateNotif();
  });
}
updateNotif();

/* ------- Theme toggle (NOW FULLY FIXED) ------- */
const themeBtn = document.getElementById("themeBtn");
const THEME_KEY = "si_theme";

function applyTheme(theme) {
  if (theme === "dark") {
    document.documentElement.setAttribute("data-theme", "dark");
  } else {
    document.documentElement.setAttribute("data-theme", "light");
  }

  localStorage.setItem(THEME_KEY, theme);
}

const savedTheme = localStorage.getItem(THEME_KEY) || "light";
applyTheme(savedTheme);

themeBtn.addEventListener("click", () => {
  const current = document.documentElement.getAttribute("data-theme");
  const newTheme = current === "dark" ? "light" : "dark";
  applyTheme(newTheme);
});


/* ------- small UX: search focus on pressing '/' key ------- */
window.addEventListener('keydown', (e) => {
  if (e.key === '/') {
    const s = document.getElementById("globalSearch");
    if (s) {
      e.preventDefault();
      s.focus();
      s.select();
    }
  }
});

/* ------- Optional: click on product cards to open product page (demo) ------- */
document.addEventListener('click', (ev) => {
  const p = ev.target.closest && ev.target.closest('.product');
  if (p) {
    // open details - here we just show an alert for demo
    alert("Open product: " + (p.dataset.name || p.textContent));
  }
});
