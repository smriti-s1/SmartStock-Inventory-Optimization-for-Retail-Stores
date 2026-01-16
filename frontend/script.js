// script.js — FINAL COMPLETE VERSION

// Redirect to login if not authenticated
const logoutBtn = document.getElementById("logout-btn");
if (logoutBtn) {
  logoutBtn.addEventListener("click", () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    window.location.href = "auth.html";
  });
}

// 🔒 Protect dashboard
if (!localStorage.getItem("token")) {
  window.location.href = "auth.html";
}

const API_BASE_URL = "http://127.0.0.1:8000";

// MAIN EVENT LISTENER
document.addEventListener("DOMContentLoaded", () => {
  console.debug("script.js: DOMContentLoaded");

  // script.js -> Paste this AT THE VERY TOP (Outside DOMContentLoaded)

// Global function to handle transfer approval
window.approveTransfer = async function(fromStore, toStore, family, qty, btnElement) {
  
  if(!confirm(`Confirm Transfer?\n\nMove ${qty} units of ${family}\nFrom Store ${fromStore} ➡️ Store ${toStore}`)) {
    return;
  }

  // Disable button to prevent double click
  btnElement.textContent = "Processing...";
  btnElement.disabled = true;
  btnElement.style.background = "#6b7280"; // Grey

  try {
    const res = await fetch("http://127.0.0.1:8000/inventory/transfer", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        from_store: fromStore,
        to_store: toStore,
        family: family,
        qty: qty
      })
    });

    const data = await res.json();

    if (res.ok) {
      alert(`✅ Success!\nNew Donor Stock: ${data.new_donor_stock}\nNew Receiver Stock: ${data.new_receiver_stock}`);
      
      // Remove the row from table visually
      const row = btnElement.closest("tr");
      row.style.opacity = "0.3";
      row.style.pointerEvents = "none";
      btnElement.textContent = "Done";
    } else {
      alert("❌ Error: " + data.detail);
      btnElement.textContent = "Retry";
      btnElement.disabled = false;
      btnElement.style.background = "var(--error-text)";
    }

  } catch (e) {
    console.error(e);
    alert("Network Error");
    btnElement.textContent = "Retry";
    btnElement.disabled = false;
  }
};
  // --- ELEMENTS ---
  const errorBox = document.getElementById("error-box");
  const loadAutoBtn = document.getElementById("load-auto-btn");
  const exportCsvBtn = document.getElementById("export-csv-btn");
  const autoAlertsContainer = document.getElementById("auto-alerts-container");
  const autoTableBody = document.getElementById("auto-table-body");
  const autoChartCanvas = document.getElementById("auto-chart");

  // Auto-refresh controls
  const autoRefreshToggle = document.getElementById("auto-refresh-toggle");
  const autoRefreshIntervalSelect = document.getElementById("auto-refresh-interval");
  const lastUpdatedEl = document.getElementById("last-updated");

  // Auto search controls
  const autoSearchInput = document.getElementById("auto-search");
  const autoSearchBtn = document.getElementById("auto-search-btn");
  const autoSearchClearBtn = document.getElementById("auto-search-clear-btn");

  // Filter & sort controls
  const statusFilterSelect = document.getElementById("status-filter");
  const sortModeSelect = document.getElementById("sort-mode");

  // Critical Alerts section
  const criticalStoreFilterSelect = document.getElementById("critical-store-filter");
  const criticalFilterSelect = document.getElementById("critical-filter");
  const criticalTableBody = document.getElementById("critical-table-body");
  const criticalHelpText = document.getElementById("critical-help-text");

  // Summary Dashboard elements
  const summaryStoreFilterSelect = document.getElementById("summary-store-filter");
  const summaryStatusFilterSelect = document.getElementById("summary-status-filter");
  const kpiUnderstock = document.getElementById("kpi-understock");
  const kpiOverstock = document.getElementById("kpi-overstock");
  const kpiStockout = document.getElementById("kpi-stockout");
  const kpiStores = document.getElementById("kpi-stores");
  const summaryCriticalBody = document.getElementById("summary-critical-body");
  const summaryHelper = document.getElementById("summary-helper");

  // Manage Items elements
  const manageSearchInput = document.getElementById("manage-search");
  const manageSearchBtn = document.getElementById("manage-search-btn");
  const manageRefreshBtn = document.getElementById("manage-refresh-btn");
  const manageTableBody = document.getElementById("manage-table-body");
  const manageMsg = document.getElementById("manage-msg");

  // Manage Form Inputs
  const itemIdHidden = document.getElementById("item-id");
  const itemStoreInput = document.getElementById("item-store");
  const itemFamilyInput = document.getElementById("item-family");
  const itemStockInput = document.getElementById("item-stock");
  const itemAddBtn = document.getElementById("item-add-btn");
  const itemUpdateBtn = document.getElementById("item-update-btn");
  const itemDeleteBtn = document.getElementById("item-delete-btn");
  const itemClearBtn = document.getElementById("item-clear-btn");

  // Recent inserts UI
  const recentTableBody = document.getElementById("recent-table-body");
  const recentCountEl = document.getElementById("recent-count");
  const recentClearBtn = document.getElementById("recent-clear-btn");

  // Notification Elements
  const toggleEmailCard = document.getElementById("toggle-email-card");
  const toggleSmsCard = document.getElementById("toggle-sms-card");
  const statusEmailText = document.getElementById("status-email-text");
  const statusSmsText = document.getElementById("status-sms-text");
  const btnMasterSend = document.getElementById("btn-master-send");
  const alertSystemMsg = document.getElementById("alert-system-msg");

  // Chatbot Elements
  const chatToggleBtn = document.getElementById("chat-toggle-btn");
  const chatWindow = document.getElementById("chat-window");
  const chatCloseBtn = document.getElementById("chat-close-btn");
  const chatInput = document.getElementById("chat-input");
  const chatSendBtn = document.getElementById("chat-send-btn");
  const chatMessages = document.getElementById("chat-messages");

  // Theme
  const themeToggleBtn = document.getElementById("theme-toggle");
  const root = document.documentElement;

  // --- NEW ANALYTICS ELEMENTS ---
  const loadAbcBtn = document.getElementById("load-abc-btn");
  const abcInsightsList = document.getElementById("abc-insights-list");
  const abcChartCanvas = document.getElementById("abc-chart");
  const loadAnomBtn = document.getElementById("load-anom-btn");
  const anomTableBody = document.getElementById("anom-table-body");
  const loadMbaBtn = document.getElementById("load-mba-btn");
  const mbaStoreInput = document.getElementById("mba-store-input");
  const mbaRulesContainer = document.getElementById("mba-rules-container");

  // --- GLOBAL STATE ---
  let autoChart = null;
  let abcChartInstance = null; // New chart instance
  let lastAutoItems = []; 
  let autoSearchValue = ""; 
  let recentInserts = []; 
  let autoRefreshIntervalId = null;
  
  // Notification State
  let settingsState = {
    email: false,
    sms: false
  };

  // --- LOAD LOCAL STORAGE ---
  try {
    const saved = localStorage.getItem("smartstock_recent_inserts_v1");
    if (saved) recentInserts = JSON.parse(saved);
  } catch (e) {
    recentInserts = [];
  }

  // --- NAVIGATION (FIXED) ---
  const navButtons = document.querySelectorAll(".nav-btn");
  const views = {
    alerts: document.getElementById("view-alerts"),
    summary: document.getElementById("view-summary"),
    range: document.getElementById("view-range"),
    manage: document.getElementById("view-manage"),
    analytics: document.getElementById("view-analytics"), // ADDED THIS
  };

  function stopAutoRefresh() {
    if (autoRefreshIntervalId !== null) {
      clearInterval(autoRefreshIntervalId);
      autoRefreshIntervalId = null;
    }
    if (autoRefreshToggle) autoRefreshToggle.checked = false;
  }

  navButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      const viewName = btn.getAttribute("data-view");
      navButtons.forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");

      Object.entries(views).forEach(([key, el]) => {
        if (el) { // Check if element exists
            if (key === viewName) el.classList.remove("hidden");
            else el.classList.add("hidden");
        }
      });

      if (viewName !== "alerts") stopAutoRefresh();

      if (viewName === "manage") {
        loadItems();
        renderRecentDashboard();
      }
    });
  });

  // --- THEME ---
  function getAxisTextColor() {
    return root.getAttribute("data-theme") === "dark" ? "#e5e7eb" : "#111827";
  }

  function getGridColor() {
    return root.getAttribute("data-theme") === "dark" ? "rgba(55, 65, 81, 0.6)" : "rgba(156, 163, 175, 0.7)";
  }

  function updateChartTheme(chart) {
    if (!chart) return;
    try {
      const axis = getAxisTextColor();
      const grid = getGridColor();
      if (chart.options.scales) {
        if (chart.options.scales.x) {
          chart.options.scales.x.ticks.color = axis;
          chart.options.scales.x.grid.color = grid;
        }
        if (chart.options.scales.y) {
          chart.options.scales.y.ticks.color = axis;
          chart.options.scales.y.grid.color = grid;
        }
      }
      chart.update();
    } catch (e) {}
  }

  function applyTheme(theme) {
    root.setAttribute("data-theme", theme);
    localStorage.setItem("theme", theme);
    themeToggleBtn.textContent = theme === "dark" ? "🌙" : "☀️";
    updateChartTheme(autoChart);
    if(window._rangeChartInstance) updateChartTheme(window._rangeChartInstance);
  }

  const savedTheme = localStorage.getItem("theme") || "dark";
  applyTheme(savedTheme);

  themeToggleBtn.addEventListener("click", () => {
    const current = root.getAttribute("data-theme") || "dark";
    applyTheme(current === "dark" ? "light" : "dark");
  });

  // --- HELPERS ---
  function showError(msg) {
    if (errorBox) { errorBox.textContent = msg; errorBox.classList.remove("hidden"); }
  }
  function clearError() {
    if (errorBox) { errorBox.textContent = ""; errorBox.classList.add("hidden"); }
  }
  function formatNumber(num) {
    return Number(num).toLocaleString(undefined, { maximumFractionDigits: 2 });
  }
  function updateLastUpdated() {
    if (lastUpdatedEl) lastUpdatedEl.textContent = "Last updated: " + new Date().toLocaleTimeString();
  }
  function getDerivedStatus(item) {
    const demand = Number(item.predicted_sales || 0);
    const stock = Number(item.current_stock || 0);
    if (demand > 0 && stock <= 0.05 * demand) return "stockout";
    return item.status;
  }

  // --- RECENT DASHBOARD ---
  function saveRecentToStorage() {
    localStorage.setItem("smartstock_recent_inserts_v1", JSON.stringify(recentInserts));
  }
  function renderRecentDashboard() {
    if (!recentTableBody || !recentCountEl) return;
    recentTableBody.innerHTML = "";
    if (!recentInserts.length) {
      recentCountEl.textContent = "No recent inserts.";
      return;
    }
    recentCountEl.textContent = `Recent inserts: ${recentInserts.length}`;
    recentInserts.slice().reverse().forEach((it) => {
      const tr = document.createElement("tr");
      tr.innerHTML = `<td>${it.store_nbr}</td><td>${it.family}</td><td>${formatNumber(it.current_stock)}</td>`;
      recentTableBody.appendChild(tr);
    });
  }

  // --- NOTIFICATION CONTROLLER ---
  async function loadAlertSettings() {
    try {
      const res = await fetch(API_BASE_URL + "/alert-settings");
      const data = await res.json();
      settingsState.email = data.email;
      settingsState.sms = data.sms;
      renderToggleUI();
    } catch (err) { console.error(err); }
  }

  function renderToggleUI() {
    if(!toggleEmailCard || !toggleSmsCard) return;

    if (settingsState.email) {
      toggleEmailCard.classList.add("active-email");
      statusEmailText.textContent = "ON";
      if(toggleEmailCard.querySelector(".status-indicator")) 
          toggleEmailCard.querySelector(".status-indicator").textContent = "Active";
    } else {
      toggleEmailCard.classList.remove("active-email");
      statusEmailText.textContent = "OFF";
      if(toggleEmailCard.querySelector(".status-indicator")) 
          toggleEmailCard.querySelector(".status-indicator").textContent = "Inactive";
    }

    if (settingsState.sms) {
      toggleSmsCard.classList.add("active-sms");
      statusSmsText.textContent = "ON";
      if(toggleSmsCard.querySelector(".status-indicator")) 
          toggleSmsCard.querySelector(".status-indicator").textContent = "Active";
    } else {
      toggleSmsCard.classList.remove("active-sms");
      statusSmsText.textContent = "OFF";
      if(toggleSmsCard.querySelector(".status-indicator")) 
          toggleSmsCard.querySelector(".status-indicator").textContent = "Inactive";
    }
  }

  async function updateBackendSettings() {
    try {
      if(alertSystemMsg) alertSystemMsg.textContent = "Saving...";
      await fetch(API_BASE_URL + "/alert-settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settingsState)
      });
      if(alertSystemMsg) alertSystemMsg.textContent = ""; 
    } catch (err) { console.error(err); }
  }

  if (toggleEmailCard) {
    toggleEmailCard.addEventListener("click", () => {
      settingsState.email = !settingsState.email;
      renderToggleUI();
      updateBackendSettings();
    });
  }

  if (toggleSmsCard) {
    toggleSmsCard.addEventListener("click", () => {
      settingsState.sms = !settingsState.sms;
      renderToggleUI();
      updateBackendSettings();
    });
  }

  // script.js mein "btnMasterSend" ka event listener replace karo:
// --- script.js (Sirf btnMasterSend wala part replace karo) ---

if (btnMasterSend) {
    btnMasterSend.addEventListener("click", async () => {
      
      // UI Feedback
      alertSystemMsg.textContent = "⏳ Processing...";
      alertSystemMsg.style.color = "var(--metrics-text)";

      // Debugging: Console me check karo kya ja raha hai
      console.log("👉 SEND NOW CLICKED. Email State:", settingsState.email);

      try {
        const res = await fetch(API_BASE_URL + "/check-stock-alerts", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          // ✅ FORCE SEND SETTINGS
          body: JSON.stringify({
            email: settingsState.email, 
            sms: settingsState.sms
          })
        });

        const data = await res.json();
        
        if (res.ok) {
           alertSystemMsg.textContent = "✅ Done! Check Terminal.";
           alertSystemMsg.style.color = "#4ade80";
        } else {
           alertSystemMsg.textContent = "❌ Error: " + JSON.stringify(data);
           alertSystemMsg.style.color = "var(--error-text)";
        }

      } catch (err) {
        console.error(err);
        alertSystemMsg.textContent = "❌ Server Error";
      }
      
      setTimeout(() => { if(alertSystemMsg) alertSystemMsg.textContent = ""; }, 4000);
    });
}

  loadAlertSettings(); // Init Settings

  // --- CHATBOT LOGIC ---
  function addChatMessage(text, type) {
    if (!chatMessages) return;
    const div = document.createElement("div");
    div.className = `message ${type}`;
    div.innerHTML = text.replace(/\*\*(.*?)\*\*/g, "<b>$1</b>").replace(/\n/g, "<br>");
    chatMessages.appendChild(div);
    chatMessages.scrollTop = chatMessages.scrollHeight;
  }

  async function handleChatSend() {
    if (!chatInput) return;
    const txt = chatInput.value.trim();
    if (!txt) return;
    
    addChatMessage(txt, "user-msg");
    chatInput.value = ""; 

    try {
      const res = await fetch(`${API_BASE_URL}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: txt })
      });
      const data = await res.json();
      addChatMessage(data.response, "bot-msg");
    } catch (e) {
      addChatMessage("❌ Error connecting to bot.", "bot-msg");
    }
  }

  if (chatToggleBtn) chatToggleBtn.onclick = (e) => { e.stopPropagation(); chatWindow.classList.toggle("hidden"); };
  if (chatCloseBtn) chatCloseBtn.onclick = (e) => { e.stopPropagation(); chatWindow.classList.add("hidden"); };
  if (chatSendBtn) chatSendBtn.onclick = (e) => { e.preventDefault(); handleChatSend(); };
  if (chatInput) chatInput.onkeypress = (e) => { if (e.key === "Enter") { e.preventDefault(); handleChatSend(); } };

  // --- FILTERS & TABLES ---
  function getFilteredSortedItems() {
    let items = [...lastAutoItems];
    const search = (autoSearchValue || "").trim().toLowerCase();
    if (search) {
      items = items.filter((it) => {
        return String(it.family).toLowerCase().includes(search) || String(it.store_nbr).includes(search);
      });
    }
    const statusFilter = statusFilterSelect?.value || "all";
    if (statusFilter !== "all") {
      items = items.filter((it) => it.status === statusFilter);
    }
    const sortMode = sortModeSelect?.value || "none";
    if (sortMode === "severity_desc") {
      items.sort((a, b) => Math.abs(b.shortage_or_excess) - Math.abs(a.shortage_or_excess));
    }
    return items;
  }

  function populateCriticalStoreFilter() {
    if (!criticalStoreFilterSelect) return;
    const stores = [...new Set(lastAutoItems.map((it) => it.store_nbr))].sort((a, b) => a - b);
    criticalStoreFilterSelect.innerHTML = '<option value="all">All stores</option>';
    stores.forEach((s) => {
      const opt = document.createElement("option");
      opt.value = s;
      opt.textContent = `Store ${s}`;
      criticalStoreFilterSelect.appendChild(opt);
    });
  }

  function populateSummaryStoreFilter() {
    if (!summaryStoreFilterSelect) return;
    const stores = [...new Set(lastAutoItems.map((it) => it.store_nbr))].sort((a, b) => a - b);
    summaryStoreFilterSelect.innerHTML = '<option value="all">All stores</option>';
    stores.forEach((s) => {
      const opt = document.createElement("option");
      opt.value = s;
      opt.textContent = `Store ${s}`;
      summaryStoreFilterSelect.appendChild(opt);
    });
  }

  function renderCriticalTable() {
    if (!criticalTableBody) return;
    criticalTableBody.innerHTML = "";
    if (!lastAutoItems.length) {
      if(criticalHelpText) criticalHelpText.textContent = "Load alerts above first.";
      return;
    }

    const filterValue = criticalFilterSelect?.value || "all";
    const storeFilter = criticalStoreFilterSelect?.value || "all";

    let critical = lastAutoItems.map((it) => ({...it, derivedStatus: getDerivedStatus(it)}))
      .filter((it) => it.derivedStatus !== "ok");

    if (storeFilter !== "all") critical = critical.filter((it) => String(it.store_nbr) === storeFilter);
    if (filterValue !== "all") critical = critical.filter((it) => it.derivedStatus === filterValue);
    
    critical.sort((a, b) => Math.abs(b.shortage_or_excess) - Math.abs(a.shortage_or_excess));

    if (!critical.length) {
      if(criticalHelpText) criticalHelpText.textContent = "No critical items for filter.";
      return;
    }
    if(criticalHelpText) criticalHelpText.textContent = `Showing ${critical.length} critical items.`;

    critical.forEach((item) => {
      const tr = document.createElement("tr");
      tr.classList.add(`critical-row-${item.derivedStatus}`);
      tr.innerHTML = `
        <td>${item.store_nbr}</td><td>${item.family}</td><td>${item.derivedStatus.toUpperCase()}</td>
        <td>${formatNumber(item.current_stock)}</td><td>${formatNumber(item.predicted_sales)}</td>
        <td>${formatNumber(item.shortage_or_excess)}</td>`;
      criticalTableBody.appendChild(tr);
    });
  }

  function updateSummaryDashboard() {
    if (!kpiUnderstock) return;
    kpiUnderstock.textContent = "-"; kpiOverstock.textContent = "-";
    kpiStockout.textContent = "-"; kpiStores.textContent = "-";
    if (summaryCriticalBody) summaryCriticalBody.innerHTML = "";
    if (summaryHelper) summaryHelper.textContent = "";

    if (!lastAutoItems.length) {
      if (summaryHelper) summaryHelper.textContent = "No data yet.";
      return;
    }

    const storeFilter = summaryStoreFilterSelect?.value || "all";
    const statusFilter = summaryStatusFilterSelect?.value || "all";

    let withDerived = lastAutoItems.map((it) => ({...it, derivedStatus: getDerivedStatus(it)}));
    if (storeFilter !== "all") withDerived = withDerived.filter((it) => String(it.store_nbr) === storeFilter);

    if (!withDerived.length) return;

    kpiUnderstock.textContent = withDerived.filter((it) => it.derivedStatus === "understock").length;
    kpiOverstock.textContent = withDerived.filter((it) => it.derivedStatus === "overstock").length;
    kpiStockout.textContent = withDerived.filter((it) => it.derivedStatus === "stockout").length;
    kpiStores.textContent = new Set(withDerived.map((it) => it.store_nbr)).size;

    let critical = withDerived.filter((it) => it.derivedStatus !== "ok");
    if (statusFilter !== "all") critical = critical.filter((it) => it.derivedStatus === statusFilter);
    critical.sort((a, b) => Math.abs(b.shortage_or_excess) - Math.abs(a.shortage_or_excess));

    if (summaryCriticalBody) {
      critical.forEach((item) => {
        const tr = document.createElement("tr");
        tr.classList.add(`critical-row-${item.derivedStatus}`);
        tr.innerHTML = `
          <td>${item.store_nbr}</td><td>${item.family}</td><td>${item.derivedStatus.toUpperCase()}</td>
          <td>${formatNumber(item.current_stock)}</td><td>${formatNumber(item.predicted_sales)}</td>
          <td>${formatNumber(item.shortage_or_excess)}</td>`;
        summaryCriticalBody.appendChild(tr);
      });
    }
  }

  // --- AUTO ALERTS RENDER ---
  function renderAutoAlertsFromItems() {
    autoTableBody.innerHTML = "";
    if (autoChart) { autoChart.destroy(); autoChart = null; }

    const items = getFilteredSortedItems();
    if (!items.length) {
      autoAlertsContainer.classList.add("hidden");
      showError("No items match current filter.");
      return;
    }
    clearError();

    items.forEach((item) => {
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${item.store_nbr}</td><td>${item.family}</td><td>${formatNumber(item.current_stock)}</td>
        <td>${formatNumber(item.predicted_sales)}</td><td>${item.status.toUpperCase()}</td>
        <td>${formatNumber(item.shortage_or_excess)}</td>`;
      autoTableBody.appendChild(tr);
    });

    const labels = items.map((it) => `${it.store_nbr}-${it.family}`);
    const values = items.map((it) => it.shortage_or_excess);
    const bgColors = items.map((it) => 
      it.status === "overstock" ? "rgba(239, 68, 68, 0.9)" : 
      it.status === "understock" ? "rgba(34, 197, 94, 0.9)" : "rgba(59, 130, 246, 0.9)");

    const ctx = autoChartCanvas.getContext("2d");
    const axis = getAxisTextColor();
    const grid = getGridColor();

    autoChart = new Chart(ctx, {
      type: "bar",
      data: {
        labels,
        datasets: [{ label: "Gap", data: values, backgroundColor: bgColors }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
          x: { ticks: { color: axis }, grid: { color: grid } },
          y: { ticks: { color: axis }, grid: { color: grid } }
        }
      }
    });
    autoAlertsContainer.classList.remove("hidden");
  }

  async function loadAutoAlerts() {
    clearError();
    autoAlertsContainer.classList.add("hidden");
    try {
      const res = await fetch(`${API_BASE_URL}/auto-stock-status`);
      if (!res.ok) throw new Error("Backend error");
      const data = await res.json();
      lastAutoItems = data.items || [];
      if(!lastAutoItems.length) { showError("No items."); return; }

      populateCriticalStoreFilter();
      populateSummaryStoreFilter();
      renderAutoAlertsFromItems();
      renderCriticalTable();
      updateSummaryDashboard();
      updateLastUpdated();
    } catch (err) { showError("Failed to load alerts."); }
  }

  if (loadAutoBtn) loadAutoBtn.addEventListener("click", loadAutoAlerts);

  // Search Listeners
  if (autoSearchBtn) autoSearchBtn.addEventListener("click", () => {
    autoSearchValue = autoSearchInput.value || "";
    renderAutoAlertsFromItems(); renderCriticalTable();
  });
  if (autoSearchInput) autoSearchInput.addEventListener("keypress", (e) => {
    if(e.key === "Enter") {
      autoSearchValue = autoSearchInput.value || "";
      renderAutoAlertsFromItems(); renderCriticalTable();
    }
  });
  if (autoSearchClearBtn) autoSearchClearBtn.addEventListener("click", () => {
    autoSearchInput.value = ""; autoSearchValue = "";
    renderAutoAlertsFromItems(); renderCriticalTable();
  });

  // Filter Listeners
  if(statusFilterSelect) statusFilterSelect.addEventListener("change", renderAutoAlertsFromItems);
  if(sortModeSelect) sortModeSelect.addEventListener("change", renderAutoAlertsFromItems);
  if(criticalFilterSelect) criticalFilterSelect.addEventListener("change", renderCriticalTable);
  if(criticalStoreFilterSelect) criticalStoreFilterSelect.addEventListener("change", renderCriticalTable);
  if(summaryStoreFilterSelect) summaryStoreFilterSelect.addEventListener("change", updateSummaryDashboard);
  if(summaryStatusFilterSelect) summaryStatusFilterSelect.addEventListener("change", updateSummaryDashboard);

  // Auto Refresh
  if (autoRefreshToggle) {
    autoRefreshToggle.addEventListener("change", () => {
      if (autoRefreshToggle.checked) {
        const sec = Number(autoRefreshIntervalSelect.value || "60");
        loadAutoAlerts();
        autoRefreshIntervalId = setInterval(loadAutoAlerts, sec * 1000);
      } else { stopAutoRefresh(); }
    });
  }

  // Export CSV
  if (exportCsvBtn) {
    exportCsvBtn.addEventListener("click", () => {
      const items = getFilteredSortedItems();
      if (!items.length) { showError("No data to export."); return; }
      const headers = ["Store", "Family", "Stock", "Demand", "Status", "Gap"];
      const rows = [headers, ...items.map(i => [i.store_nbr, i.family, i.current_stock, i.predicted_sales, i.status, i.shortage_or_excess])];
      const csv = rows.map(r => r.join(",")).join("\n");
      const url = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
      const a = document.createElement("a");
      a.href = url; a.download = "alerts.csv"; a.click();
    });
  }

  // --- RANGE HANDLER ---
  (function attachRangeHandler() {
    const btn = document.getElementById("range-load-btn");
    const storeEl = document.getElementById("range-store");
    const famEl = document.getElementById("range-family");
    const durationEl = document.getElementById("range-duration"); 
    const canvas = document.getElementById("range-chart");
    const container = document.getElementById("range-container");
    const info = document.getElementById("range-info");

    if (!btn) return;

    btn.addEventListener("click", async () => {
      clearError();
      const storeVal = (storeEl.value || "").trim();
      const famVal = (famEl.value || "").trim();
      const daysVal = durationEl ? durationEl.value : "30"; 

      if (!storeVal || !famVal) { showError("Fill store and family."); return; }

      const variants = [famVal, famVal.toUpperCase()];
      let foundData = null;

      for (const v of variants) {
        const params = new URLSearchParams({ store_nbr: storeVal, family: v, days: daysVal });
        try {
          const res = await fetch(`${API_BASE_URL}/range-forecast?${params.toString()}`);
          if (res.ok) {
            const json = await res.json();
            if (json.points && json.points.length > 0) {
              foundData = json;
              break;
            }
          }
        } catch (e) {}
      }

      if (!foundData) {
        if(info) info.textContent = "No data found.";
        return;
      }

      const pts = foundData.points;
      const labels = pts.map(p => p.date);
      const vals = pts.map(p => p.predicted_sales);

      if (window._rangeChartInstance) window._rangeChartInstance.destroy();

      const ctx = canvas.getContext("2d");
      const axis = getAxisTextColor();
      const grid = getGridColor();

      window._rangeChartInstance = new Chart(ctx, {
        type: "line",
        data: {
          labels,
          datasets: [{
            label: `Forecast (${daysVal} days)`,
            data: vals,
            borderColor: "#3b82f6",
            backgroundColor: "rgba(59, 130, 246, 0.1)",
            fill: true
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: { legend: { labels: { color: axis } } },
          scales: {
            x: { ticks: { color: axis }, grid: { color: grid } },
            y: { ticks: { color: axis }, grid: { color: grid } }
          }
        }
      });

      if (container) container.classList.remove("hidden");
      if (info) info.textContent = `Showing forecast for last ${daysVal} days.`;
    });
  })();

  // --- MANAGE ITEMS LOGIC ---
  function setManageMessage(msg, err=false) {
    if(manageMsg) { manageMsg.textContent = msg; manageMsg.style.color = err ? "var(--error-text)" : "var(--muted)"; }
  }
  function renderManageTable(items) {
    if(!manageTableBody) return;
    manageTableBody.innerHTML = "";
    items.forEach(it => {
      const tr = document.createElement("tr");
      tr.innerHTML = `<td>${it.store_nbr}</td><td>${it.family}</td><td>${formatNumber(it.current_stock)}</td>`;
      tr.style.cursor = "pointer";
      tr.onclick = () => {
        if(itemIdHidden) itemIdHidden.value = it.id;
        if(itemStoreInput) itemStoreInput.value = it.store_nbr;
        if(itemFamilyInput) itemFamilyInput.value = it.family;
        if(itemStockInput) itemStockInput.value = it.current_stock;
        setManageMessage(`Editing item: ${it.family}`);
      };
      manageTableBody.appendChild(tr);
    });
  }

  async function loadItems(search = "") {
    setManageMessage("");
    try {
      const params = new URLSearchParams();
      if(search) params.set("search", search);
      const res = await fetch(`${API_BASE_URL}/items?${params.toString()}`);
      const data = await res.json();
      renderManageTable(data.items || []);
    } catch(e) { setManageMessage("Failed to load items.", true); }
  }

  async function addItem() {
    const body = {
      store_nbr: Number(itemStoreInput.value),
      family: itemFamilyInput.value,
      current_stock: Number(itemStockInput.value)
    };
    try {
      const res = await fetch(`${API_BASE_URL}/items`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body)
      });
      if(res.status === 201) {
        const created = await res.json();
        setManageMessage("Item Added!");
        recentInserts.push({ ...created });
        saveRecentToStorage();
        renderRecentDashboard();
        loadItems();
      } else { setManageMessage("Error adding item", true); }
    } catch(e) { setManageMessage("Network error", true); }
  }

  async function updateItem() {
    const id = itemIdHidden.value;
    if(!id) return setManageMessage("Select item first", true);
    const body = {
      store_nbr: Number(itemStoreInput.value),
      family: itemFamilyInput.value,
      current_stock: Number(itemStockInput.value)
    };
    try {
      const res = await fetch(`${API_BASE_URL}/items/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body)
      });
      if(res.ok) { setManageMessage("Item Updated!"); loadItems(); }
      else { setManageMessage("Update failed", true); }
    } catch(e) { setManageMessage("Network error", true); }
  }

  async function deleteItem() {
    const id = itemIdHidden.value;
    if(!id || !confirm("Delete item?")) return;
    try {
      const res = await fetch(`${API_BASE_URL}/items/${id}`, { method: "DELETE" });
      if(res.status === 204) {
        setManageMessage("Item Deleted.");
        loadItems();
      }
    } catch(e) {}
  }

  if(manageSearchBtn) manageSearchBtn.onclick = () => loadItems(manageSearchInput.value);
  if(manageRefreshBtn) manageRefreshBtn.onclick = () => { manageSearchInput.value=""; loadItems(); };
  if(itemAddBtn) itemAddBtn.onclick = addItem;
  if(itemUpdateBtn) itemUpdateBtn.onclick = updateItem;
  if(itemDeleteBtn) itemDeleteBtn.onclick = deleteItem;
  if(itemClearBtn) itemClearBtn.onclick = () => {
    itemIdHidden.value=""; itemStoreInput.value=""; itemFamilyInput.value=""; itemStockInput.value="";
    setManageMessage("");
  };
  if(recentClearBtn) recentClearBtn.onclick = () => {
    if(confirm("Clear recent list?")) { recentInserts=[]; saveRecentToStorage(); renderRecentDashboard(); }
  };

  renderRecentDashboard();

  // --- NEW ANALYTICS LOGIC (Merged) ---
  
 // script.js -> Inside Advanced Analytics Logic

// New Elements
const abcStoreInput = document.getElementById("abc-store-input");
const abcFamilyInput = document.getElementById("abc-family-input");

// 1. ABC Analysis Logic (Updated with Filters)
if (loadAbcBtn) {
  loadAbcBtn.addEventListener("click", async () => {
    loadAbcBtn.textContent = "Analyzing...";
    
    // Capture Filter Values
    const storeVal = abcStoreInput.value.trim();
    const familyVal = abcFamilyInput.value.trim();

    // Build URL Params
    const params = new URLSearchParams();
    if (storeVal) params.append("store_nbr", storeVal);
    if (familyVal) params.append("family", familyVal);

    try {
      const res = await fetch(`${API_BASE_URL}/analytics/abc?${params.toString()}`);
      const data = await res.json();

      if (data.status === "ok") {
        const dist = data.distribution; 

        // Chart Render
        if (abcChartInstance) abcChartInstance.destroy();
        const ctx = abcChartCanvas.getContext("2d");

        abcChartInstance = new Chart(ctx, {
          type: 'doughnut',
          data: {
            labels: ['Class A (High)', 'Class B (Med)', 'Class C (Low)'],
            datasets: [{
              data: [dist.A || 0, dist.B || 0, dist.C || 0],
              backgroundColor: ['#3b82f6', '#a855f7', '#64748b'],
              borderColor: 'transparent'
            }]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { position: 'right', labels: { color: '#9ca3af' } } }
          }
        });

        // Update Insights
        let topItemsHtml = (data.top_a_items || []).map(i => 
            `<li>💎 <b>Store ${i.store_nbr} - ${i.family}</b> (${formatNumber(i.sales)})</li>`
        ).join("");

        // Context Aware Title
        let title = "Global Performance";
        if(storeVal) title = `Store ${storeVal} Performance`;
        if(familyVal) title += ` (${familyVal})`;

        abcInsightsList.innerHTML = `
          <li style="color:var(--accent);">🔎 <b>Scope:</b> ${title}</li>
          <li>📦 <b>Class A:</b> ${dist.A || 0} items (High Value)</li>
  
          <li>⚖️ <b>Class B:</b> ${dist.B || 0} items (Medium Value)</li> 
  
           <li>📉 <b>Class C:</b> ${dist.C || 0} items (Low Value)</li>
          <li style="margin-top:12px; color:#38bdf8; border-bottom:1px solid #334155; padding-bottom:4px;">🔥 <b>Top 10 Class A Performers:</b></li>
          <ul style="padding-left: 20px; margin-top:8px; font-size:0.9rem;">${topItemsHtml}</ul>
        `;
      } else {
        abcInsightsList.innerHTML = "<li>⚠️ No data found for these filters.</li>";
        if (abcChartInstance) abcChartInstance.destroy();
      }
    } catch (e) { 
      console.error(e); 
      abcInsightsList.innerHTML = `<li style="color:red;">Error fetching data. Check Console.</li>`;
    }
    loadAbcBtn.textContent = "Analyze";
  });
}

  // script.js -> Inside Advanced Analytics Logic

// New Elements Capture
const anomStoreInput = document.getElementById("anom-store-input");
const anomFamilyInput = document.getElementById("anom-family-input");
const anomStatusText = document.getElementById("anom-status-text");

// 2. Anomaly Detection Logic (Unlimited + Filters)
if (loadAnomBtn) {
  loadAnomBtn.addEventListener("click", async () => {
    loadAnomBtn.textContent = "Scanning...";
    anomTableBody.innerHTML = "";
    anomStatusText.textContent = "Processing full dataset...";

    // Capture Inputs
    const storeVal = anomStoreInput.value.trim();
    const famVal = anomFamilyInput.value.trim();

    // Build URL Params
    const params = new URLSearchParams();
    if (storeVal) params.append("store_nbr", storeVal);
    if (famVal) params.append("family", famVal);

    try {
      const res = await fetch(`${API_BASE_URL}/analytics/anomalies?${params.toString()}`);
      const data = await res.json();

      if (!data.anomalies || data.anomalies.length === 0) {
        anomTableBody.innerHTML = "<tr><td colspan='6' style='text-align:center;'>✅ No anomalies found for these filters.</td></tr>";
        anomStatusText.textContent = "Scan complete. No anomalies found.";
      } else {
        // Show count
        anomStatusText.textContent = `⚠️ Found ${data.count} anomalies in the last 1 year. Showing all.`;
        
        // Render ALL Rows (No Limit)
        // Note: Agar 10,000+ rows hain to browser thoda slow ho sakta hai rendering me.
        const fragment = document.createDocumentFragment(); // Faster rendering
        
        data.anomalies.forEach(row => {
          const tr = document.createElement("tr");
          tr.style.background = "rgba(239, 68, 68, 0.08)";
          tr.innerHTML = `
            <td>${row.store_nbr}</td>
            <td>${row.family}</td>
            <td>${row.date}</td>
            <td style="font-weight:bold;">${formatNumber(row.sales)}</td>
            <td>${formatNumber(row.avg_sales)}</td>
            <td style="color:#f87171; font-weight:bold;">${row.deviation}</td>
          `;
          fragment.appendChild(tr);
        });
        
        anomTableBody.appendChild(fragment);
      }
    } catch (e) { 
      console.error(e); 
      anomTableBody.innerHTML = "<tr><td colspan='6' style='color:red;'>Failed to load data.</td></tr>";
    }
    loadAnomBtn.textContent = "Scan All";
  });
}

  // script.js -> Inside Advanced Analytics Logic

// New Element Capture
const mbaThresholdInput = document.getElementById("mba-threshold-input");
const mbaStatusText = document.getElementById("mba-status-text");

// 3. Market Basket Analysis Logic (Full Data Control)
if (loadMbaBtn) {
  loadMbaBtn.addEventListener("click", async () => {
    const store = mbaStoreInput.value.trim();
    // Default to 0.3 (30%) if empty
    let confPercent = mbaThresholdInput.value ? Number(mbaThresholdInput.value) : 30;
    let threshold = confPercent / 100; // Convert 30 -> 0.3

    loadMbaBtn.textContent = "Mining...";
    mbaRulesContainer.innerHTML = "";
    mbaStatusText.textContent = "Analyzing huge dataset... please wait.";

    try {
      // Build URL Params
      const params = new URLSearchParams();
      if (store) params.append("store_nbr", store);
      params.append("threshold", threshold);

      const res = await fetch(`${API_BASE_URL}/analytics/correlations?${params.toString()}`);
      const data = await res.json();

      if (data.status === "no_data" || !data.rules || data.rules.length === 0) {
        mbaRulesContainer.innerHTML = "<p style='grid-column: span 2; text-align:center;'>ℹ️ No patterns found above this confidence level. Try lowering 'Min Conf %'.</p>";
        mbaStatusText.textContent = "No patterns found.";
      } else {
        mbaStatusText.textContent = `✅ Found ${data.count} patterns (Min Confidence: ${confPercent}%). Showing all.`;

        // Use DocumentFragment for performance with large lists
        const fragment = document.createDocumentFragment();

        data.rules.forEach(rule => {
          const card = document.createElement("div");
          card.className = "kpi-card";
          
          // Visual coloring based on strength
          let borderColor = "#9ca3af"; // Grey (Weak)
          if (rule.confidence >= 50) borderColor = "#6366f1"; // Purple (Med)
          if (rule.confidence >= 75) borderColor = "#4ade80"; // Green (Strong)

          card.style.borderLeft = `4px solid ${borderColor}`;
          
          card.innerHTML = `
            <div style="font-size:0.85rem; color:var(--muted); display:flex; justify-content:space-between;">
                <span>Pattern</span>
                <span style="font-weight:bold; color:${borderColor}">${rule.confidence}%</span>
            </div>
            <div style="font-size:0.95rem; font-weight:600; margin: 6px 0;">
              ${rule.item_a} <span style="color:var(--accent);">↔</span> ${rule.item_b}
            </div>
            <div class="small" style="color:var(--muted);">Strong correlation detected.</div>
          `;
          fragment.appendChild(card);
        });

        mbaRulesContainer.appendChild(fragment);
      }
    } catch (e) { 
      console.error(e); 
      mbaRulesContainer.innerHTML = "<p style='color:red;'>Error loading patterns.</p>";
    }
    loadMbaBtn.textContent = "Find Patterns";
  });
}
// script.js -> Add inside Advanced Analytics Logic

  // Elements
  const loadTransferBtn = document.getElementById("load-transfer-btn");
  const transferTableBody = document.getElementById("transfer-table-body");
  const transferStatusText = document.getElementById("transfer-status-text");

  // script.js -> Inside Advanced Analytics Logic

  // New Elements
  const transferMinInput = document.getElementById("transfer-min-input");
  const transferMaxInput = document.getElementById("transfer-max-input");

  // 4. Inter-Store Transfer Logic (With Controls)
 // script.js -> Inside Advanced Analytics Logic

  // 4. Inter-Store Transfer Logic (Unlimited Data)
 // script.js -> Inside Advanced Analytics Logic -> Transfer Section

  if (loadTransferBtn) {
    loadTransferBtn.addEventListener("click", async () => {
      // Capture Inputs
      const minStock = transferMinInput.value ? Number(transferMinInput.value) : 20;
      const maxStock = transferMaxInput.value ? Number(transferMaxInput.value) : 10;
      
      loadTransferBtn.textContent = "Scanning...";
      transferTableBody.innerHTML = "";
      transferStatusText.textContent = `Scanning entire dataset...`;

      try {
        // Backend se data layenge (Unlimited)
        const res = await fetch(`${API_BASE_URL}/analytics/transfers?min_stock=${minStock}&max_stock=${maxStock}`);
        const data = await res.json();
        
        if (!data.transfers || data.transfers.length === 0) {
          // Note: colspan ab 5 hai kyunki ek column hata diya
          transferTableBody.innerHTML = "<tr><td colspan='5' style='text-align:center;'>✅ No matches found. Try relaxing the stock limits.</td></tr>";
          transferStatusText.textContent = "Optimization complete. No matches found.";
        } else {
          transferStatusText.textContent = `🚀 Found ${data.count} opportunities! Showing matches.`;
          
          const fragment = document.createDocumentFragment();
          
        // script.js -> Inside Advanced Analytics -> Transfer Logic

          data.transfers.forEach(t => {
            const tr = document.createElement("tr");
            
            // 👇 Button code updated here 👇
            // Note carefully how quotes are handled inside onclick
            tr.innerHTML = `
              <td style="color:#4ade80; font-weight:bold;">Store ${t.from_store}</td>
              <td style="color:#f87171; font-weight:bold;">Store ${t.to_store}</td>
              <td>${t.family}</td>
              <td style="font-weight:bold; font-size:1.1rem; text-align:center; background:rgba(255,255,255,0.05);">${t.qty}</td>
              <td style="text-align: right;">
                <button class="btn btn-sm" 
                  style="padding:4px 12px; font-size:0.75rem; background:var(--accent);"
                  onclick="approveTransfer(${t.from_store}, ${t.to_store}, '${t.family}', ${t.qty}, this)">
                  Approve
                </button>
              </td>
            `;
            fragment.appendChild(tr);
          });
          
          transferTableBody.appendChild(fragment);
        }
      } catch (e) {
        console.error(e);
        transferTableBody.innerHTML = "<tr><td colspan='5' style='color:red;'>Error optimizing.</td></tr>";
      }
      loadTransferBtn.textContent = "Find Matches";
    });
  }
});