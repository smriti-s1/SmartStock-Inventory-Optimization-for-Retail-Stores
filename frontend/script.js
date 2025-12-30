// script.js — COMPLETE FIXED VERSION

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

  // --- GLOBAL STATE ---
  let autoChart = null;
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

  // --- NAVIGATION ---
  const navButtons = document.querySelectorAll(".nav-btn");
  const views = {
    alerts: document.getElementById("view-alerts"),
    summary: document.getElementById("view-summary"),
    range: document.getElementById("view-range"),
    manage: document.getElementById("view-manage"),
    //mba: document.getElementById("view-mba"), // NEW
    pricing: document.getElementById("view-pricing"),
    deadstock: document.getElementById("view-deadstock"), // NEW ADDED
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
        if (key === viewName) el.classList.remove("hidden");
        else el.classList.add("hidden");
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
      
      // Ye zaroor check karein ki data sahi format me aa raha hai
      console.log("Loaded Settings:", data);
      
      // State update karein
      settingsState.email = data.email;
      settingsState.sms = data.sms;
      
      // UI update function call karein
      renderToggleUI();
    } catch (err) { 
        console.error("Error loading settings:", err); 
    }
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
      if(alertSystemMsg) alertSystemMsg.textContent = "Saving settings...";
      
      // Console me print karein taaki pata chale kya bheja ja raha hai
      console.log("Sending Settings:", settingsState); 

      const res = await fetch(API_BASE_URL + "/alert-settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settingsState)
      });

      if (!res.ok) {
        throw new Error("Failed to save settings");
      }

      const data = await res.json();
      console.log("Settings Saved:", data);

      if(alertSystemMsg) {
          alertSystemMsg.textContent = "Settings Saved!";
          alertSystemMsg.style.color = "#4ade80"; // Green color
          setTimeout(() => { alertSystemMsg.textContent = ""; }, 2000);
      }
    } catch (err) { 
      console.error(err); 
      if(alertSystemMsg) {
          alertSystemMsg.textContent = "❌ Error saving settings";
          alertSystemMsg.style.color = "var(--error-text)";
      }
    }
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

  if (btnMasterSend) {
    btnMasterSend.addEventListener("click", async () => {
      if (!settingsState.email && !settingsState.sms) {
        alertSystemMsg.textContent = "⚠️ Please enable at least one method (Email or SMS).";
        alertSystemMsg.style.color = "#facc15";
        return;
      }
      alertSystemMsg.textContent = "🚀 Processing alerts...";
      alertSystemMsg.style.color = "var(--metrics-text)";
      try {
        const res = await fetch(API_BASE_URL + "/check-stock-alerts", { method: "POST" });
        const data = await res.json();
        if (res.ok) {
           alertSystemMsg.textContent = "✅ Alerts Sent!";
           alertSystemMsg.style.color = "#4ade80";
        } else {
           alertSystemMsg.textContent = "❌ Error: " + data.detail;
           alertSystemMsg.style.color = "var(--error-text)";
        }
      } catch (err) {
        alertSystemMsg.textContent = "❌ Server Error";
      }
      setTimeout(() => { if(alertSystemMsg) alertSystemMsg.textContent = ""; }, 3000);
    });
  }

  loadAlertSettings(); // Init Settings

  // --- CHATBOT LOGIC (FIXED) ---
  
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
    
    // 1. Add User Message
    addChatMessage(txt, "user-msg");
    chatInput.value = ""; // Clear input immediately

    try {
      // 2. Call backend
      const res = await fetch(`${API_BASE_URL}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: txt })
      });
      
      const data = await res.json();
      
      // 3. Add Bot Response
      addChatMessage(data.response, "bot-msg");
    } catch (e) {
      console.error("Chat Error:", e);
      addChatMessage("❌ Error connecting to bot.", "bot-msg");
    }
  }

  // Assign Listeners for Chat
  if (chatToggleBtn) {
    chatToggleBtn.onclick = (e) => {
      e.stopPropagation(); 
      chatWindow.classList.toggle("hidden");
    };
  }
  
  if (chatCloseBtn) {
    chatCloseBtn.onclick = (e) => {
      e.stopPropagation(); 
      chatWindow.classList.add("hidden");
    };
  }

  if (chatSendBtn) {
    chatSendBtn.onclick = (e) => {
      e.preventDefault();
      handleChatSend();
    };
  }

  if (chatInput) {
    chatInput.onkeypress = (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        handleChatSend();
      }
    };
  }

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

  // --- UPDATED CUSTOM RANGE HANDLER ---
  (function attachRangeHandler() {
    const btn = document.getElementById("range-load-btn");
    const storeEl = document.getElementById("range-store");
    const famEl = document.getElementById("range-family");
    const durationEl = document.getElementById("range-duration"); // NEW
    const canvas = document.getElementById("range-chart");
    const container = document.getElementById("range-container");
    const info = document.getElementById("range-info");

    if (!btn) return;

    btn.addEventListener("click", async () => {
      clearError();
      const storeVal = (storeEl.value || "").trim();
      const famVal = (famEl.value || "").trim();
      const daysVal = durationEl ? durationEl.value : "30"; // Capture days

      if (!storeVal || !famVal) { showError("Fill store and family."); return; }

      // Try variants
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

      // Build Graph
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
});

// --- MARKET BASKET ANALYSIS LOGIC ---
document.addEventListener("DOMContentLoaded", () => {
    // ... existing initialization code ...

    const mbaBtn = document.getElementById("mba-btn");
    const mbaStoreInput = document.getElementById("mba-store");
    const mbaResults = document.getElementById("mba-results");
    const mbaContainer = document.getElementById("mba-cards-container");
    const mbaMsg = document.getElementById("mba-msg");

    if (mbaBtn) {
        mbaBtn.addEventListener("click", async () => {
            const storeId = mbaStoreInput.value.trim();
            if (!storeId) {
                alert("Please enter a store number.");
                return;
            }

            // Loading State
            mbaMsg.textContent = "🤖 Crunching numbers... Finding patterns...";
            mbaMsg.style.color = "var(--metrics-text)";
            mbaResults.classList.add("hidden");
            mbaContainer.innerHTML = "";

            try {
                const res = await fetch(`${API_BASE_URL}/market-basket/${storeId}`);
                const data = await res.json();

                if (!res.ok) throw new Error("API Error");

                if (data.status === "no_data" || data.rules.length === 0) {
                    mbaMsg.textContent = "ℹ️ No strong patterns found for this store (Try Store 44 or 45).";
                    mbaMsg.style.color = "var(--muted)";
                    return;
                }

                // Render Cards
                data.rules.forEach(rule => {
                    const card = document.createElement("div");
                    card.className = "kpi-card"; // Re-using existing card style
                    card.style.borderColor = "var(--accent)";
                    card.style.background = "rgba(56, 189, 248, 0.05)";
                    
                    card.innerHTML = `
                        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;">
                            <span style="font-size:1.1rem; font-weight:bold; color:var(--accent);">
                                ${rule.item_a}
                            </span>
                            <span style="font-size:1.2rem;">➡️</span>
                            <span style="font-size:1.1rem; font-weight:bold; color:var(--accent2);">
                                ${rule.item_b}
                            </span>
                        </div>
                        <p class="small" style="color:var(--text); margin-bottom:4px;">
                            ${rule.message}
                        </p>
                        <div style="background:var(--bg); padding:6px; border-radius:6px; font-size:0.8rem; margin-top:6px; border:1px solid var(--border);">
                            💡 <strong>Tip:</strong> ${rule.recommendation}<br>
                            <span style="color:var(--muted);">Confidence: ${rule.confidence}%</span>
                        </div>
                    `;
                    mbaContainer.appendChild(card);
                });

                mbaResults.classList.remove("hidden");
                mbaMsg.textContent = `✅ Found ${data.rules.length} association rules!`;
                mbaMsg.style.color = "#4ade80"; // Green

            } catch (err) {
                console.error(err);
                mbaMsg.textContent = "❌ Error analyzing data.";
                mbaMsg.style.color = "var(--error-text)";
            }
        });
    }
});
// --- DEAD STOCK LOGIC ---
// --- DEAD STOCK LOGIC (UPDATED) ---
    // --- DEAD STOCK LOGIC (UPDATED WITH DAYS) ---
// --- DEAD STOCK LOGIC (WITH FILTER) ---
    
// --- AI PRICING STRATEGY LOGIC ---
  // --- AI PRICING STRATEGY LOGIC (FIXED) ---
  const pricingStoreInput = document.getElementById("pricing-store-input");
  const loadPricingBtn = document.getElementById("load-pricing-btn");
  const pricingTableBody = document.getElementById("pricing-table-body");

  async function loadPricingStrategy() {
    // 1. Inputs Check
    if (!pricingStoreInput || !pricingTableBody) return;
    
    const storeId = pricingStoreInput.value || 1;
    pricingTableBody.innerHTML = '<tr><td colspan="5" style="text-align:center;">🤖 AI is analyzing market trends... please wait.</td></tr>';

    try {
      console.log(`Fetching strategy for store ${storeId}...`);
      
      // 2. Fetch Data
      const res = await fetch(`${API_BASE_URL}/pricing-strategy/${storeId}`);
      
      // 3. Check Network Status
      if (!res.ok) {
        throw new Error(`Server returned status: ${res.status}`);
      }
      
      const data = await res.json();
      console.log("Data Received from Backend:", data); // <--- Ye Console me check karna

      // 4. Safe Data Access
      const items = data.items || [];
      
      pricingTableBody.innerHTML = ""; // Clear loading msg

      if (items.length === 0) {
        pricingTableBody.innerHTML = '<tr><td colspan="5" style="text-align:center;">No inventory data found for this store.</td></tr>';
        return;
      }

      // 5. Render Rows
      items.forEach(item => {
        const tr = document.createElement("tr");

        // Color Coding based on Action
        let badgeColor = "gray";
        let badgeText = item.action_label || "STANDARD"; // Fallback added
        let rowStyle = "";

        // Safe check for action_label
        const action = (item.action_label || "").toUpperCase();

        if (action === "CLEARANCE") {
          badgeColor = "#ef4444"; // Red
          badgeText = `🔥 ${item.discount_percent}% OFF`;
          rowStyle = "background: rgba(239, 68, 68, 0.1);"; 
        } else if (action === "PROMOTION") {
          badgeColor = "#f59e0b"; // Orange
          badgeText = `🏷️ ${item.discount_percent}% OFF`;
        } else if (action === "PREMIUM") {
          badgeColor = "#10b981"; // Green
          badgeText = "💎 NO DISCOUNT";
        } else if (action === "RESTOCK") {
            badgeColor = "#3b82f6"; // Blue
            badgeText = "📦 RE-ORDER";
        }

        const badgeHtml = `<span style="background:${badgeColor}; color:white; padding:4px 8px; border-radius:4px; font-weight:bold; font-size:0.8rem;">${badgeText}</span>`;

        // Safe Number Formatting
        const stockVal = item.current_stock !== undefined ? Number(item.current_stock).toFixed(0) : "0";
        const predVal = item.predicted_sales !== undefined ? Number(item.predicted_sales).toFixed(1) : "0.0";

        tr.style = rowStyle;
        tr.innerHTML = `
          <td>${item.family || "Unknown"}</td>
          <td>${stockVal}</td>
          <td>${predVal}</td>
          <td>${badgeHtml}</td>
          <td class="small" style="color:var(--muted);">${item.reason || "-"}</td>
        `;
        pricingTableBody.appendChild(tr);
      });

    } catch (err) {
      console.error("Javascript Error:", err); // <--- Ye Console me Error dikhayega
      pricingTableBody.innerHTML = `<tr><td colspan="5" style="text-align:center; color:red;">
        Error: ${err.message}. <br>Check Console (F12) for details.
      </td></tr>`;
    }
  }

  if (loadPricingBtn) {
    loadPricingBtn.addEventListener("click", loadPricingStrategy);
  }