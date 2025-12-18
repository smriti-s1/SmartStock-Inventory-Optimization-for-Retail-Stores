// script.js — merged final version (with detailed logs, robust range handler, diagnostic helper)
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

if (!localStorage.getItem("token")) {
  window.location.href = "auth.html";
}
function logout() {
  localStorage.clear();
  window.location.href = "auth.html";
}

const API_BASE_URL = "http://127.0.0.1:8000";

document.addEventListener("DOMContentLoaded", () => {
  console.debug("script.js: DOMContentLoaded");

  const errorBox = document.getElementById("error-box");

  const loadMetricsBtn = document.getElementById("load-metrics-btn");
  const metricsBox = document.getElementById("metrics-box");
  const metricMae = document.getElementById("metric-mae");
  const metricRmse = document.getElementById("metric-rmse");
  const metricR2 = document.getElementById("metric-r2");

  const checkHealthBtn = document.getElementById("check-health-btn");
  const healthStatus = document.getElementById("health-status");

  const loadAutoBtn = document.getElementById("load-auto-btn");
  const exportCsvBtn = document.getElementById("export-csv-btn");
  const autoAlertsContainer = document.getElementById("auto-alerts-container");
  const autoTableBody = document.getElementById("auto-table-body");
  const autoChartCanvas = document.getElementById("auto-chart");

  // auto-refresh controls
  const autoRefreshToggle = document.getElementById("auto-refresh-toggle");
  const autoRefreshIntervalSelect = document.getElementById(
    "auto-refresh-interval"
  );
  const lastUpdatedEl = document.getElementById("last-updated");

  // NEW Auto search controls (ensure these IDs exist in your HTML)
  const autoSearchInput = document.getElementById("auto-search");
  const autoSearchBtn = document.getElementById("auto-search-btn");
  const autoSearchClearBtn = document.getElementById("auto-search-clear-btn");

  // Filter & sort controls for ALL alerts
  const statusFilterSelect = document.getElementById("status-filter");
  const sortModeSelect = document.getElementById("sort-mode");

  // Critical Alerts section
  const criticalStoreFilterSelect = document.getElementById(
    "critical-store-filter"
  );
  const criticalFilterSelect = document.getElementById("critical-filter");
  const criticalTableBody = document.getElementById("critical-table-body");
  const criticalHelpText = document.getElementById("critical-help-text");

  // Summary Dashboard elements
  const summaryStoreFilterSelect = document.getElementById(
    "summary-store-filter"
  );
  const summaryStatusFilterSelect = document.getElementById(
    "summary-status-filter"
  );
  const kpiUnderstock = document.getElementById("kpi-understock");
  const kpiOverstock = document.getElementById("kpi-overstock");
  const kpiStockout = document.getElementById("kpi-stockout");
  const kpiStores = document.getElementById("kpi-stores");
  const summaryCriticalBody = document.getElementById("summary-critical-body");
  const summaryHelper = document.getElementById("summary-helper");

  // Range dashboard elements
  const rangeStoreInput = document.getElementById("range-store");
  const rangeFamilyInput = document.getElementById("range-family");
  const rangeLoadBtn = document.getElementById("range-load-btn");
  const rangeContainer = document.getElementById("range-container");
  const rangeChartCanvas = document.getElementById("range-chart");
  const rangeInfo = document.getElementById("range-info");

  const themeToggleBtn = document.getElementById("theme-toggle");
  const root = document.documentElement;

  // Manage Items elements (NEW) — ensure your index.html includes these IDs in the Manage view
  const manageSearchInput = document.getElementById("manage-search");
  const manageSearchBtn = document.getElementById("manage-search-btn");
  const manageRefreshBtn = document.getElementById("manage-refresh-btn");
  const manageTableBody = document.getElementById("manage-table-body");
  const manageMsg = document.getElementById("manage-msg");

  // hidden id kept in DOM and JS (the user asked to HIDE ID column — we keep a hidden input)
  const itemIdHidden = document.getElementById("item-id");
  const itemStoreInput = document.getElementById("item-store");
  const itemFamilyInput = document.getElementById("item-family");
  const itemStockInput = document.getElementById("item-stock");
  const itemAddBtn = document.getElementById("item-add-btn");
  const itemUpdateBtn = document.getElementById("item-update-btn");
  const itemDeleteBtn = document.getElementById("item-delete-btn");
  const itemClearBtn = document.getElementById("item-clear-btn");

  // Recent inserts UI (dashboard where newly inserted items show)
  const recentTableBody = document.getElementById("recent-table-body");
  const recentCountEl = document.getElementById("recent-count");
  const recentClearBtn = document.getElementById("recent-clear-btn");

  let autoChart = null;
  let rangeChart = null;
  let lastAutoItems = []; // full list from backend (unfiltered)
  let autoSearchValue = ""; // current search string for auto alerts
  let recentInserts = []; // array of created items {id, store_nbr, family, current_stock}

  let autoRefreshIntervalId = null;

  // ---------- load recentInserts from localStorage ----------
  try {
    console.debug("Loading recent inserts from localStorage");
    const saved = localStorage.getItem("smartstock_recent_inserts_v1");
    if (saved) {
      recentInserts = JSON.parse(saved);
      console.debug("Loaded recent inserts:", recentInserts.length);
    } else {
      recentInserts = [];
      console.debug("No recent inserts found.");
    }
  } catch (e) {
    recentInserts = [];
    console.warn("Failed to parse recent inserts from storage:", e);
  }

  // ---------- NAVIGATION ----------
  const navButtons = document.querySelectorAll(".nav-btn");
  const views = {
    alerts: document.getElementById("view-alerts"),
    summary: document.getElementById("view-summary"),
    range: document.getElementById("view-range"),
    info: document.getElementById("view-info"),
    manage: document.getElementById("view-manage"), // NEW view id — include in index.html
  };

  function stopAutoRefresh() {
    if (autoRefreshIntervalId !== null) {
      clearInterval(autoRefreshIntervalId);
      autoRefreshIntervalId = null;
      console.debug("Auto-refresh stopped");
    }
    if (autoRefreshToggle) {
      autoRefreshToggle.checked = false;
    }
  }

  navButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      const viewName = btn.getAttribute("data-view");
      console.info("NAV: switching to view", viewName);

      // toggle active button
      navButtons.forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");

      // show only selected view
      Object.entries(views).forEach(([key, el]) => {
        if (key === viewName) {
          el.classList.remove("hidden");
        } else {
          el.classList.add("hidden");
        }
      });

      // alerts view se bahar jaate hi auto-refresh band
      if (viewName !== "alerts") {
        stopAutoRefresh();
      }

      // When entering Manage view, refresh items + recent dashboard
      if (viewName === "manage") {
        console.debug("Entering Manage view: loading items and rendering recent dashboard");
        loadItems();
        renderRecentDashboard();
      }
    });
  });

  // ---------- Theme helpers ----------
  function getAxisTextColor() {
    const theme = root.getAttribute("data-theme") || "dark";
    return theme === "dark" ? "#e5e7eb" : "#111827";
  }

  function getGridColor() {
    const theme = root.getAttribute("data-theme") || "dark";
    return theme === "dark"
      ? "rgba(55, 65, 81, 0.6)"
      : "rgba(156, 163, 175, 0.7)";
  }

  // Fixed updateChartTheme (removed stray token; added guards)
  function updateChartTheme(chart) {
    if (!chart) return;
    try {
      const axisColor = getAxisTextColor();
      const gridColor = getGridColor();

      // only update if scales exist (Chart.js v3+)
      if (chart.options && chart.options.scales) {
        if (chart.options.scales.x && chart.options.scales.x.ticks) {
          chart.options.scales.x.ticks.color = axisColor;
        }
        if (chart.options.scales.y && chart.options.scales.y.ticks) {
          chart.options.scales.y.ticks.color = axisColor;
        }
        if (chart.options.scales.x && chart.options.scales.x.grid) {
          chart.options.scales.x.grid.color = gridColor;
        }
        if (chart.options.scales.y && chart.options.scales.y.grid) {
          chart.options.scales.y.grid.color = gridColor;
        }
      }

      chart.update();
      console.debug("Chart theme updated for chart:", chart?.canvas?.id || "(unknown)");
    } catch (err) {
      console.warn("updateChartTheme failed:", err);
    }
  }

  // ---------- Theme toggle ----------
  function applyTheme(theme) {
    root.setAttribute("data-theme", theme);
    localStorage.setItem("theme", theme);
    themeToggleBtn.textContent = theme === "dark" ? "🌙" : "☀️";

    updateChartTheme(autoChart);
    updateChartTheme(rangeChart);
  }

  const savedTheme = localStorage.getItem("theme") || "dark";
  console.debug("Applying saved theme:", savedTheme);
  applyTheme(savedTheme);

  themeToggleBtn.addEventListener("click", () => {
    const current = root.getAttribute("data-theme") || "dark";
    const next = current === "dark" ? "light" : "dark";
    console.info("Theme toggle:", current, "->", next);
    applyTheme(next);
  });

  // ---------- Helpers ----------
  function showError(message) {
    if (!errorBox) return;
    errorBox.textContent = message;
    errorBox.classList.remove("hidden");
    console.error("UI Error:", message);
  }

  function clearError() {
    if (!errorBox) return;
    errorBox.textContent = "";
    errorBox.classList.add("hidden");
  }

  function formatNumber(num) {
    return Number(num).toLocaleString(undefined, {
      maximumFractionDigits: 2,
    });
  }

  function updateLastUpdated() {
    if (!lastUpdatedEl) return;
    const now = new Date();
    lastUpdatedEl.textContent =
      "Last updated: " + now.toLocaleTimeString(undefined, { hour12: false });
    console.debug("Last updated timestamp set:", lastUpdatedEl.textContent);
  }

  // ---------- Derived status for Critical & Summary ----------
  function getDerivedStatus(item) {
    const demand = Number(item.predicted_sales || 0);
    const stock = Number(item.current_stock || 0);
    const base = item.status; // overstock / understock / ok

    if (demand > 0 && stock <= 0.05 * demand) {
      return "stockout";
    }
    return base;
  }

  // ---------- Recent Inserts helpers ----------
  function saveRecentToStorage() {
    try {
      localStorage.setItem(
        "smartstock_recent_inserts_v1",
        JSON.stringify(recentInserts)
      );
      console.debug("Saved recent inserts to localStorage:", recentInserts.length);
    } catch (e) {
      console.warn("Could not save recent inserts", e);
    }
  }

  function renderRecentDashboard() {
    if (!recentTableBody || !recentCountEl) return;
    recentTableBody.innerHTML = "";
    if (!recentInserts.length) {
      recentCountEl.textContent = "No recent inserts.";
      console.debug("Recent dashboard: no recent inserts to render");
      return;
    }
    recentCountEl.textContent = `Recent inserts: ${recentInserts.length}`;
    recentInserts.slice().reverse().forEach((it) => {
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${it.store_nbr}</td>
        <td>${it.family}</td>
        <td>${formatNumber(it.current_stock)}</td>
      `;
      recentTableBody.appendChild(tr);
    });
    console.debug("Rendered recent dashboard, items:", recentInserts.length);
  }

  // ---------- Filter & sort apply for ALL alerts ----------
  function getFilteredSortedItems() {
    let items = [...lastAutoItems];

    // apply Auto search filter (family substring OR store_nbr match)
    const search = (autoSearchValue || "").trim().toLowerCase();
    if (search) {
      items = items.filter((it) => {
        const fam = String(it.family || "").toLowerCase();
        const store = String(it.store_nbr || "").toLowerCase();
        return fam.includes(search) || store.includes(search);
      });
      console.debug("Auto search applied:", search, "items after search:", items.length);
    }

    const statusFilter = statusFilterSelect?.value || "all";
    const sortMode = sortModeSelect?.value || "none";

    if (statusFilter !== "all") {
      items = items.filter((it) => it.status === statusFilter);
      console.debug("Status filter applied:", statusFilter, "items left:", items.length);
    }

    if (sortMode === "severity_desc") {
      items.sort(
        (a, b) =>
          Math.abs(b.shortage_or_excess) - Math.abs(a.shortage_or_excess)
      );
      console.debug("Sorted items by severity desc");
    }

    return items;
  }

  // ---------- Populate store filter for critical alerts ----------
  function populateCriticalStoreFilter() {
    if (!criticalStoreFilterSelect) return;
    const stores = [
      ...new Set(lastAutoItems.map((it) => it.store_nbr)),
    ].sort((a, b) => Number(a) - Number(b));

    criticalStoreFilterSelect.innerHTML =
      '<option value="all">All stores</option>';

    stores.forEach((s) => {
      const opt = document.createElement("option");
      opt.value = String(s);
      opt.textContent = `Store ${s}`;
      criticalStoreFilterSelect.appendChild(opt);
    });
    console.debug("Populated critical store filter:", stores.length, "stores");
  }

  // ---------- Populate store filter for SUMMARY ----------
  function populateSummaryStoreFilter() {
    if (!summaryStoreFilterSelect) return;
    const stores = [
      ...new Set(lastAutoItems.map((it) => it.store_nbr)),
    ].sort((a, b) => Number(a) - Number(b));

    summaryStoreFilterSelect.innerHTML =
      '<option value="all">All stores</option>';

    stores.forEach((s) => {
      const opt = document.createElement("option");
      opt.value = String(s);
      opt.textContent = `Store ${s}`;
      summaryStoreFilterSelect.appendChild(opt);
    });
    console.debug("Populated summary store filter:", stores.length, "stores");
  }

  // ---------- Critical Alerts table ----------
  function renderCriticalTable() {
    if (!criticalTableBody || !criticalHelpText) return;

    criticalTableBody.innerHTML = "";

    if (!lastAutoItems.length) {
      criticalHelpText.textContent =
        "Load alerts above to see critical items based on demand vs stock.";
      console.debug("Critical table: no auto items loaded");
      return;
    }

    const filterValue = criticalFilterSelect?.value || "all";
    const storeFilter = criticalStoreFilterSelect?.value || "all";

    // Derived items with derivedStatus
    let critical = lastAutoItems
      .map((it) => ({
        ...it,
        derivedStatus: getDerivedStatus(it), // include stockout
      }))
      .filter((it) => it.derivedStatus !== "ok"); // only critical

    if (storeFilter !== "all") {
      critical = critical.filter(
        (it) => String(it.store_nbr) === String(storeFilter)
      );
    }

    if (filterValue !== "all") {
      critical = critical.filter((it) => it.derivedStatus === filterValue);
    }

    // Sort by severity (abs shortage/excess)
    critical.sort(
      (a, b) =>
        Math.abs(b.shortage_or_excess) - Math.abs(a.shortage_or_excess)
    );

    if (!critical.length) {
      criticalHelpText.textContent = "No critical items for this filter.";
      console.debug("Critical table: no items after filtering");
      return;
    }

    criticalHelpText.textContent = `Showing ${critical.length} critical items.`;
    console.debug("Rendering critical table items:", critical.length);

    critical.forEach((item) => {
      const tr = document.createElement("tr");

      // row color by derivedStatus
      tr.classList.add(`critical-row-${item.derivedStatus}`);

      tr.innerHTML = `
        <td>${item.store_nbr}</td>
        <td>${item.family}</td>
        <td>${item.derivedStatus.toUpperCase()}</td>
        <td>${formatNumber(item.current_stock)}</td>
        <td>${formatNumber(item.predicted_sales)}</td>
        <td>${formatNumber(item.shortage_or_excess)}</td>
      `;

      criticalTableBody.appendChild(tr);
    });
  }

  // ---------- Summary Dashboard (KPI + Filtered critical) ----------
  function updateSummaryDashboard() {
    if (!kpiUnderstock) return;

    // reset
    kpiUnderstock.textContent = "-";
    kpiOverstock.textContent = "-";
    kpiStockout.textContent = "-";
    kpiStores.textContent = "-";
    if (summaryCriticalBody) summaryCriticalBody.innerHTML = "";
    if (summaryHelper) summaryHelper.textContent = "";

    if (!lastAutoItems.length) {
      if (summaryHelper) {
        summaryHelper.textContent =
          "No data yet. Go to Auto Stock Alerts and click 'Load Alerts' first.";
      }
      console.debug("Summary dashboard: no data");
      return;
    }

    const storeFilter = summaryStoreFilterSelect?.value || "all";
    const statusFilter = summaryStatusFilterSelect?.value || "all";

    // Derived + store filter apply
    let withDerived = lastAutoItems.map((it) => ({
      ...it,
      derivedStatus: getDerivedStatus(it),
    }));

    if (storeFilter !== "all") {
      withDerived = withDerived.filter(
        (it) => String(it.store_nbr) === String(storeFilter)
      );
    }

    if (!withDerived.length) {
      if (summaryHelper) {
        summaryHelper.textContent = "No records for this store filter.";
      }
      console.debug("Summary dashboard: no records for store filter", storeFilter);
      return;
    }

    // KPIs – always per derivedStatus within current store filter
    const underCount = withDerived.filter(
      (it) => it.derivedStatus === "understock"
    ).length;
    const overCount = withDerived.filter(
      (it) => it.derivedStatus === "overstock"
    ).length;
    const stockoutCount = withDerived.filter(
      (it) => it.derivedStatus === "stockout"
    ).length;
    const storeCount = new Set(withDerived.map((it) => it.store_nbr)).size;

    kpiUnderstock.textContent = underCount;
    kpiOverstock.textContent = overCount;
    kpiStockout.textContent = stockoutCount;
    kpiStores.textContent = storeCount;

    // Table: only critical (non-ok) subset + status filter apply
    let critical = withDerived.filter((it) => it.derivedStatus !== "ok");

    if (statusFilter !== "all") {
      critical = critical.filter((it) => it.derivedStatus === statusFilter);
    }

    // sort by severity
    critical.sort(
      (a, b) =>
        Math.abs(b.shortage_or_excess) - Math.abs(a.shortage_or_excess)
    );

    if (!critical.length) {
      if (summaryHelper) {
        summaryHelper.textContent =
          "No critical items for this store + status filter.";
      }
      console.debug("Summary dashboard: no critical items after status filter");
      return;
    }

    if (summaryCriticalBody) {
      critical.forEach((item) => {
        const tr = document.createElement("tr");
        tr.classList.add(`critical-row-${item.derivedStatus}`);
        tr.innerHTML = `
          <td>${item.store_nbr}</td>
          <td>${item.family}</td>
          <td>${item.derivedStatus.toUpperCase()}</td>
          <td>${formatNumber(item.current_stock)}</td>
          <td>${formatNumber(item.predicted_sales)}</td>
          <td>${formatNumber(item.shortage_or_excess)}</td>
        `;
        summaryCriticalBody.appendChild(tr);
      });
    }

    if (summaryHelper) {
      summaryHelper.textContent = `Showing ${critical.length} critical records for ${
        storeFilter === "all" ? "all stores" : `Store ${storeFilter}`
      } with status ${
        statusFilter === "all" ? "ALL" : statusFilter.toUpperCase()
      }.`;
    }
    console.debug("Summary dashboard updated: KPIs", { underCount, overCount, stockoutCount, storeCount });
  }

  // ---------- ALL Alerts: table + chart ----------
  function renderAutoAlertsFromItems() {
    console.debug("Rendering auto alerts from items:", lastAutoItems.length);
    autoTableBody.innerHTML = "";
    if (autoChart) {
      try {
        autoChart.destroy();
      } catch (e) {
        console.warn("autoChart destroy error:", e);
      }
      autoChart = null;
    }

    const items = getFilteredSortedItems();

    if (!items.length) {
      autoAlertsContainer.classList.add("hidden");
      showError("No items match current filter.");
      console.debug("renderAutoAlertsFromItems: no matching items");
      return;
    }

    clearError();

    // table
    items.forEach((item) => {
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${item.store_nbr}</td>
        <td>${item.family}</td>
        <td>${formatNumber(item.current_stock)}</td>
        <td>${formatNumber(item.predicted_sales)}</td>
        <td>${item.status.toUpperCase()}</td>
        <td>${formatNumber(item.shortage_or_excess)}</td>
      `;
      autoTableBody.appendChild(tr);
    });

    // chart data (labels: store-family, values: shortage_or_excess)
    const labels = items.map((it) => `${it.store_nbr}-${it.family}`);
    const values = items.map((it) => it.shortage_or_excess);

    const backgroundColors = items.map((it) => {
      if (it.status === "overstock") {
        return "rgba(239, 68, 68, 0.9)"; // red
      } else if (it.status === "understock") {
        return "rgba(34, 197, 94, 0.9)"; // green
      } else {
        return "rgba(59, 130, 246, 0.9)"; // blue
      }
    });

    const borderColors = items.map((it) => {
      if (it.status === "overstock") {
        return "rgba(220, 38, 38, 1)";
      } else if (it.status === "understock") {
        return "rgba(22, 163, 74, 1)";
      } else {
        return "rgba(37, 99, 235, 1)";
      }
    });

    const ctx = autoChartCanvas.getContext("2d");
    const axisColor = getAxisTextColor();
    const gridColor = getGridColor();

    autoChart = new Chart(ctx, {
      type: "bar",
      data: {
        labels,
        datasets: [
          {
            label: "Shortage (-) / Excess (+)",
            data: values,
            backgroundColor: backgroundColors,
            borderColor: borderColors,
            borderWidth: 1.5,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: false,
          },
          tooltip: {
            callbacks: {
              title: (tooltipItems) => {
                const idx = tooltipItems[0].dataIndex;
                const item = items[idx];
                return `Store ${item.store_nbr} – ${item.family}`;
              },
              label: (tooltipItem) => {
                const idx = tooltipItem.dataIndex;
                const item = items[idx];
                const status = item.status.toUpperCase();
                const diff = item.shortage_or_excess;
                const stock = item.current_stock;
                const demand = item.predicted_sales;

                return [
                  `Status: ${status}`,
                  `Shortage/Excess: ${formatNumber(diff)}`,
                  `Current Stock: ${formatNumber(stock)}`,
                  `Predicted Demand: ${formatNumber(demand)}`,
                ];
              },
            },
          },
        },
        scales: {
          x: {
            ticks: {
              color: axisColor,
              maxRotation: 60,
              minRotation: 0,
              font: {
                size: 10,
              },
            },
            grid: {
              color: gridColor,
            },
          },
          y: {
            ticks: {
              color: axisColor,
              font: {
                size: 10,
              },
            },
            grid: {
              color: gridColor,
            },
          },
        },
      },
    });

    console.debug("Auto chart rendered, bars:", labels.length);
    autoAlertsContainer.classList.remove("hidden");
  }

  // ---------- Auto stock alerts: fetch + render ----------
  async function loadAutoAlerts() {
    clearError();
    autoAlertsContainer.classList.add("hidden");
    autoTableBody.innerHTML = "";
    lastAutoItems = [];
    console.info("Loading auto stock alerts from backend:", `${API_BASE_URL}/auto-stock-status`);

    try {
      const response = await fetch(`${API_BASE_URL}/auto-stock-status`);
      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        const msg =
          errData.detail ||
          `Failed to load auto stock alerts (status ${response.status})`;
        showError(msg);
        console.error("loadAutoAlerts error response:", response.status, errData);
        return;
      }

      const data = await response.json();
      const items = data.items || [];

      console.debug("Auto-stock-status response items:", items.length);
      if (!items.length) {
        showError("No items returned from auto stock alerts.");
        return;
      }

      lastAutoItems = items;

      // Populate store dropdowns for critical & summary section
      populateCriticalStoreFilter();
      populateSummaryStoreFilter();

      // Render ALL alerts + graph (search/filter applied inside)
      renderAutoAlertsFromItems();
      // Render Critical section
      renderCriticalTable();
      // Update Summary Dashboard
      updateSummaryDashboard();

      updateLastUpdated();
    } catch (err) {
      console.error("Failed to fetch auto stock alerts:", err);
      showError("Could not connect to backend for auto stock alerts.");
    }
  }

  if (loadAutoBtn) {
    loadAutoBtn.addEventListener("click", () => {
      loadAutoAlerts();
    });
  }

  // Auto search handlers
  if (autoSearchBtn) {
    autoSearchBtn.addEventListener("click", () => {
      autoSearchValue = autoSearchInput.value || "";
      console.debug("Auto search triggered:", autoSearchValue);
      renderAutoAlertsFromItems();
      renderCriticalTable();
    });
  }
  if (autoSearchInput) {
    autoSearchInput.addEventListener("keypress", (e) => {
      if (e.key === "Enter") {
        autoSearchValue = autoSearchInput.value || "";
        console.debug("Auto search enter pressed:", autoSearchValue);
        renderAutoAlertsFromItems();
        renderCriticalTable();
      }
    });
  }
  if (autoSearchClearBtn) {
    autoSearchClearBtn.addEventListener("click", () => {
      autoSearchInput.value = "";
      autoSearchValue = "";
      console.debug("Auto search cleared");
      renderAutoAlertsFromItems();
      renderCriticalTable();
    });
  }

  // filters change -> re-render from lastAutoItems, no new API call
  if (statusFilterSelect) {
    statusFilterSelect.addEventListener("change", () => {
      console.debug("Status filter changed:", statusFilterSelect.value);
      if (!lastAutoItems.length) return;
      renderAutoAlertsFromItems();
    });
  }

  if (sortModeSelect) {
    sortModeSelect.addEventListener("change", () => {
      console.debug("Sort mode changed:", sortModeSelect.value);
      if (!lastAutoItems.length) return;
      renderAutoAlertsFromItems();
    });
  }

  // Critical filter change
  if (criticalFilterSelect) {
    criticalFilterSelect.addEventListener("change", () => {
      console.debug("Critical filter changed:", criticalFilterSelect.value);
      if (!lastAutoItems.length) return;
      renderCriticalTable();
    });
  }

  if (criticalStoreFilterSelect) {
    criticalStoreFilterSelect.addEventListener("change", () => {
      console.debug("Critical store filter changed:", criticalStoreFilterSelect.value);
      if (!lastAutoItems.length) return;
      renderCriticalTable();
    });
  }

  // Summary filters change
  if (summaryStoreFilterSelect) {
    summaryStoreFilterSelect.addEventListener("change", () => {
      console.debug("Summary store filter changed:", summaryStoreFilterSelect.value);
      if (!lastAutoItems.length) return;
      updateSummaryDashboard();
    });
  }

  if (summaryStatusFilterSelect) {
    summaryStatusFilterSelect.addEventListener("change", () => {
      console.debug("Summary status filter changed:", summaryStatusFilterSelect.value);
      if (!lastAutoItems.length) return;
      updateSummaryDashboard();
    });
  }

  // ---------- Auto-refresh behavior ----------
  if (autoRefreshToggle && autoRefreshIntervalSelect) {
    autoRefreshToggle.addEventListener("change", () => {
      console.debug("Auto-refresh toggled:", autoRefreshToggle.checked);
      if (autoRefreshToggle.checked) {
        const seconds = Number(autoRefreshIntervalSelect.value || "60");
        const intervalMs = seconds * 1000;

        if (autoRefreshIntervalId !== null) {
          clearInterval(autoRefreshIntervalId);
        }
        loadAutoAlerts();
        autoRefreshIntervalId = setInterval(loadAutoAlerts, intervalMs);
        console.info("Auto-refresh started, interval (s):", seconds);
      } else {
        stopAutoRefresh();
      }
    });

    autoRefreshIntervalSelect.addEventListener("change", () => {
      console.debug("Auto-refresh interval changed:", autoRefreshIntervalSelect.value);
      if (autoRefreshToggle.checked) {
        stopAutoRefresh();
        autoRefreshToggle.checked = true;
        const seconds = Number(autoRefreshIntervalSelect.value || "60");
        const intervalMs = seconds * 1000;
        loadAutoAlerts();
        autoRefreshIntervalId = setInterval(loadAutoAlerts, intervalMs);
        console.info("Auto-refresh restarted with new interval (s):", seconds);
      }
    });
  }

  // ---------- Export to CSV ----------
  if (exportCsvBtn) {
    exportCsvBtn.addEventListener("click", () => {
      clearError();
      console.debug("Export CSV clicked");

      const items = getFilteredSortedItems();

      if (!items || !items.length) {
        showError("Please load alerts / apply a search that returns results before exporting CSV.");
        return;
      }

      const headers = [
        "Store",
        "Family",
        "Current Stock",
        "Predicted Demand",
        "Status",
        "Shortage/Excess",
      ];
      const rows = [headers];

      items.forEach((item) => {
        rows.push([
          item.store_nbr,
          item.family,
          item.current_stock,
          item.predicted_sales,
          item.status,
          item.shortage_or_excess,
        ]);
      });

      const csvContent = rows
        .map((row) =>
          row
            .map((value) => {
              const val = String(value ?? "");
              if (val.includes(",") || val.includes('"') || val.includes("\n")) {
                return `"${val.replace(/"/g, '""')}"`;
              }
              return val;
            })
            .join(",")
        )
        .join("\n");

      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);

      const a = document.createElement("a");
      const today = new Date().toISOString().slice(0, 10);
      a.href = url;
      a.download = `smartstock_alerts_${today}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      console.info("CSV exported, rows:", rows.length - 1);
    });
  }

  // ---------- Robust Custom Range Dashboard handler ----------
  // Replaces prior range handler; defensive + detailed logs
// --- REPLACE existing robust range handler with this enhanced one ---
(function attachEnhancedRangeHandler() {
  const btn = document.getElementById("range-load-btn");
  const storeEl = document.getElementById("range-store");
  const famEl = document.getElementById("range-family");
  const canvas = document.getElementById("range-chart");
  const container = document.getElementById("range-container");
  const info = document.getElementById("range-info");
  const API_BASE = API_BASE_URL;

  if (!btn) {
    console.error("Range handler: range-load-btn not found. Handler not attached.");
    return;
  }

  // small helper: perform fetch + return parsed JSON (or raw text on parse error)
  async function fetchRange(url) {
    console.debug("Range.fetchRange ->", url);
    const r = await fetch(url);
    const txt = await r.text();
    let json = null;
    try {
      json = JSON.parse(txt);
    } catch (e) {
      // keep json null, return raw text
    }
    return { ok: r.ok, status: r.status, json, text: txt, url };
  }

  // helper to normalize family variants to try
  function familyVariants(family) {
    const s = (family || "").trim();
    const set = new Set();
    if (!s) return [];
    set.add(s);
    set.add(s.toUpperCase());
    // Title Case
    set.add(
      s
        .toLowerCase()
        .split(/\s+/)
        .map((w) => w[0]?.toUpperCase() + w.slice(1))
        .join(" ")
    );
    // Single-space normalized
    set.add(s.replace(/\s+/g, " "));
    // replace spaces with %20 (we'll still pass via URLSearchParams but keep variant)
    set.add(s.replace(/\s+/g, "%20"));
    return Array.from(set);
  }

  btn.addEventListener("click", async (ev) => {
    console.info("Range handler (enhanced): clicked");
    try {
      clearError();
    } catch (e) {}

    if (!storeEl || !famEl || !canvas) {
      console.error("Range handler: missing DOM elements (range-store, range-family, range-chart?)");
      showError("Range UI broken: missing elements. Check console.");
      return;
    }

    const storeVal = (storeEl.value || "").trim();
    const famVal = (famEl.value || "").trim();

    if (!storeVal || !famVal) {
      showError("Please fill Store and Family before building the graph.");
      return;
    }

    const famTries = familyVariants(famVal);
    // ensure original is attempted first
    if (famTries[0] !== famVal) famTries.unshift(famVal);

    // We'll try multiple family variants until we get non-empty points
    let finalResponse = null;
    let tried = [];

    for (let i = 0; i < famTries.length; i++) {
      const famTry = famTries[i];
      const params = new URLSearchParams({ store_nbr: storeVal, family: famTry });
      const url = `${API_BASE}/range-forecast?${params.toString()}`;

      console.debug(`Range try ${i + 1}/${famTries.length}: family="${famTry}" url=${url}`);
      tried.push({ family: famTry, url });

      let res;
      try {
        res = await fetchRange(url);
      } catch (err) {
        console.error("Range fetch failed:", err);
        // network/CORS error — no point in further tries
        showError("Network/CORS error when contacting backend. See console.");
        return;
      }

      console.debug("Range response status:", res.status, "ok:", res.ok);
      // If non-ok and includes JSON detail, show it and stop trying other variants
      if (!res.ok) {
        console.warn("Range response not OK:", res.status, res.json || res.text);
        finalResponse = res;
        break;
      }

      // res.json may be null if parse failed; handle text fallback
      const payload = res.json ?? (function() {
        try { return JSON.parse(res.text); } catch(e){ return null; }
      })();

      // If payload and points present and non-empty -> success
      if (payload && Array.isArray(payload.points) && payload.points.length > 0) {
        finalResponse = { ...res, json: payload };
        console.info("Range: got non-empty points with family variant:", famTry);
        break;
      }

      // If payload exists but points empty, continue trying other variants
      if (payload && Array.isArray(payload.points) && payload.points.length === 0) {
        console.debug("Range: backend returned empty points for this variant, trying next if any.");
        finalResponse = { ...res, json: payload }; // keep last response for diagnostics
        continue;
      }

      // If payload missing or unexpected, keep last and continue
      finalResponse = res;
    } // end for

    // Final diagnostics: if finalResponse is null (shouldn't happen), bail
    if (!finalResponse) {
      console.error("Range: no response obtained from backend tries.");
      showError("No response from backend (see console).");
      return;
    }

    // If response not OK -> show debug info
    if (!finalResponse.ok) {
      console.error("Range: final response not OK:", finalResponse.status, finalResponse.json || finalResponse.text);
      const detail = (finalResponse.json && finalResponse.json.detail) ? finalResponse.json.detail : `HTTP ${finalResponse.status}`;
      showError("Backend error: " + detail);
      return;
    }

    // If json missing -> show raw text
    const payload = finalResponse.json ?? (function() { try { return JSON.parse(finalResponse.text); } catch(e){ return null; } })();

    if (!payload) {
      console.error("Range: response parse failed, raw text:", finalResponse.text.slice(0, 200));
      showError("Invalid JSON from backend. See console for raw response.");
      return;
    }

    // If payload exists but points empty -> detailed hint to user
    if (!Array.isArray(payload.points) || payload.points.length === 0) {
      console.warn("Range: payload present but points empty.", payload);
      // Provide helpful hints for the user
      let hint = "No data points returned for this Store+Family.";
      // If backend supplied message, show it
      if (payload.detail) hint += " Backend message: " + payload.detail;
      hint += " Tried variants: " + tried.map((t) => t.family || t.url).slice(0, 5).join(", ");
      showError(hint);
      console.info("Range tries summary:", tried);
      return;
    }

    // At this point we have payload.points non-empty — build chart
    try {
      const points = payload.points;
      const labels = points.map((p) => String(p.date));
      const values = points.map((p) => {
        const v = Number(p.predicted_sales);
        return Number.isFinite(v) ? v : 0;
      });

      // destroy previous chart if present
      if (window._rangeChartInstance) {
        try { window._rangeChartInstance.destroy(); } catch (e) { console.warn("destroy prev range chart", e); }
        window._rangeChartInstance = null;
      }

      const ctx = canvas.getContext("2d");
      const axisColor = getAxisTextColor();
      const gridColor = getGridColor();

      window._rangeChartInstance = new Chart(ctx, {
        type: "line",
        data: {
          labels,
          datasets: [{
            label: `Predicted Sales – Store ${payload.store_nbr || storeVal}, ${payload.family || famVal}`,
            data: values,
            fill: false,
            borderColor: "rgba(59,130,246,1)",
            borderWidth: 2,
            tension: 0.25,
            pointRadius: 2,
          }],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: { legend: { display: true } },
          scales: {
            x: { ticks: { color: axisColor, maxRotation: 60, minRotation: 0, font: { size: 10 } }, grid: { color: gridColor } },
            y: { ticks: { color: axisColor, font: { size: 10 } }, grid: { color: gridColor } },
          },
        },
      });

      if (container) container.classList.remove("hidden");
      if (info) info.textContent = `Showing ${points.length} days from ${labels[0]} to ${labels[labels.length - 1]}.`;
      clearError();
      console.info("Range: chart rendered successfully. points:", points.length);
    } catch (err) {
      console.error("Range: error while rendering chart:", err);
      showError("Error while rendering chart (see console).");
    }
  }); // end btn event
})();


  // ---------- Model metrics ----------
  if (loadMetricsBtn) {
    loadMetricsBtn.addEventListener("click", async () => {
      clearError();
      metricsBox.classList.add("hidden");
      console.debug("Load metrics clicked");

      try {
        const response = await fetch(`${API_BASE_URL}/metrics`);
        if (!response.ok) {
          const errData = await response.json().catch(() => ({}));
          const msg =
            errData.detail || `Failed to load metrics (status ${response.status})`;
          showError(msg);
          console.error("Metrics error response:", response.status, errData);
          return;
        }

        const data = await response.json();
        metricMae.textContent = formatNumber(data.mae);
        metricRmse.textContent = formatNumber(data.rmse);
        metricR2.textContent = data.r2.toFixed(3);

        metricsBox.classList.remove("hidden");
        console.debug("Metrics loaded:", data);
      } catch (err) {
        console.error("Failed to fetch metrics:", err);
        showError("Could not connect to backend for metrics.");
      }
    });
  }

  // ---------- Health check ----------
  if (checkHealthBtn) {
    checkHealthBtn.addEventListener("click", async () => {
      clearError();
      healthStatus.textContent = "Checking...";
      console.debug("Health check clicked");

      try {
        const response = await fetch(`${API_BASE_URL}/health`);
        if (!response.ok) {
          healthStatus.textContent = `Backend not healthy (status ${response.status})`;
          console.error("Health check failed:", response.status);
          return;
        }
        const data = await response.json();
        healthStatus.textContent = `Status: ${data.status} – ${data.message}`;
        console.debug("Health response:", data);
      } catch (err) {
        console.error("Health check error:", err);
        healthStatus.textContent =
          "Could not reach backend. Is it running?";
      }
    });
  }

  // ---------- MANAGE ITEMS: helper utilities ----------
  function setManageMessage(msg, isError = false) {
    if (!manageMsg) return;
    manageMsg.textContent = msg;
    manageMsg.style.color = isError ? "var(--error-text)" : "var(--muted)";
    console.debug("Manage message:", msg);
  }

  function clearManageMessage() {
    setManageMessage("");
  }

  function clearItemForm() {
    if (itemIdHidden) itemIdHidden.value = "";
    if (itemStoreInput) itemStoreInput.value = "";
    if (itemFamilyInput) itemFamilyInput.value = "";
    if (itemStockInput) itemStockInput.value = "";
    clearManageMessage();
    console.debug("Item form cleared");
  }

  // Fill the items table with rows (ID is kept internally, not shown)
  function renderManageTable(items) {
    if (!manageTableBody) return;
    manageTableBody.innerHTML = "";

    items.forEach((it) => {
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${it.store_nbr}</td>
        <td>${it.family}</td>
        <td>${formatNumber(it.current_stock)}</td>
      `;
      tr.style.cursor = "pointer";

      // click row to load into form for update/delete
      tr.addEventListener("click", () => {
        if (itemIdHidden) itemIdHidden.value = it.id; // keep id hidden
        if (itemStoreInput) itemStoreInput.value = it.store_nbr;
        if (itemFamilyInput) itemFamilyInput.value = it.family;
        if (itemStockInput) itemStockInput.value = it.current_stock;
        setManageMessage(`Loaded item (store ${it.store_nbr}, ${it.family}) for editing.`);
        console.debug("Manage table row clicked, loaded id:", it.id);
      });

      manageTableBody.appendChild(tr);
    });
    console.debug("Manage table rendered, rows:", items.length);
  }

  // Load items from backend (search optional)
  async function loadItems(search = "") {
    clearManageMessage();
    if (!manageTableBody) return;
    manageTableBody.innerHTML = "<tr><td colspan='3'>Loading...</td></tr>";
    console.info("Loading items from backend, search:", search);

    try {
      const params = new URLSearchParams();
      if (search && search.trim()) params.set("search", search.trim());
      const url = `${API_BASE_URL}/items${params.toString() ? "?" + params.toString() : ""}`;

      const res = await fetch(url);
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        renderManageTable([]);
        setManageMessage(err.detail || `Failed to load items (${res.status})`, true);
        console.error("loadItems error response:", res.status, err);
        return;
      }
      const data = await res.json();
      const items = data.items || [];
      renderManageTable(items);
      setManageMessage(`Loaded ${items.length} items.`);
      console.debug("Items loaded:", items.length);
    } catch (err) {
      console.error("Failed to load items:", err);
      renderManageTable([]);
      setManageMessage("Could not reach backend for items.", true);
    }
  }

  // Add item
  async function addItem() {
    clearManageMessage();
    const store = itemStoreInput.value?.trim();
    const family = itemFamilyInput.value?.trim();
    const stock = itemStockInput.value?.trim();
    console.debug("Add item requested:", { store, family, stock });

    if (!store || !family || !stock) {
      setManageMessage("Please fill store, family and current stock.", true);
      return;
    }

    try {
      const body = {
        store_nbr: Number(store),
        family: family,
        current_stock: Number(stock),
      };
      console.debug("POST /items body:", body);
      const res = await fetch(`${API_BASE_URL}/items`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (res.status === 201) {
        const created = await res.json();
        setManageMessage(`Created item (store ${created.store_nbr}, ${created.family})`);
        console.info("Item created:", created);
        // push to recent inserts & persist
        recentInserts.push({
          id: created.id,
          store_nbr: created.store_nbr,
          family: created.family,
          current_stock: created.current_stock,
        });
        saveRecentToStorage();
        renderRecentDashboard();

        clearItemForm();
        loadItems(manageSearchInput.value || "");
      } else {
        const err = await res.json().catch(() => ({}));
        setManageMessage(err.detail || `Failed to create item (${res.status})`, true);
        console.error("Create item failed:", res.status, err);
      }
    } catch (err) {
      console.error("Network error while creating item:", err);
      setManageMessage("Network error while creating item.", true);
    }
  }

  // Update item (uses hidden id)
  async function updateItem() {
    clearManageMessage();
    const id = itemIdHidden.value?.trim();
    const store = itemStoreInput.value?.trim();
    const family = itemFamilyInput.value?.trim();
    const stock = itemStockInput.value?.trim();
    console.debug("Update item requested:", { id, store, family, stock });

    if (!id) {
      setManageMessage("Select an item row to update (click row first).", true);
      return;
    }
    if (!store || !family || !stock) {
      setManageMessage("Please fill store, family and current stock.", true);
      return;
    }

    try {
      const body = {
        store_nbr: Number(store),
        family: family,
        current_stock: Number(stock),
      };
      console.debug("PUT /items/:id body:", id, body);
      const res = await fetch(`${API_BASE_URL}/items/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (res.ok) {
        const updated = await res.json();
        setManageMessage(`Updated item (store ${updated.store_nbr}, ${updated.family})`);
        console.info("Item updated:", updated);
        // Optionally update recentInserts if same id exists there
        const idx = recentInserts.findIndex((r) => String(r.id) === String(updated.id));
        if (idx !== -1) {
          recentInserts[idx] = {
            id: updated.id,
            store_nbr: updated.store_nbr,
            family: updated.family,
            current_stock: updated.current_stock,
          };
          saveRecentToStorage();
          renderRecentDashboard();
        }

        clearItemForm();
        loadItems(manageSearchInput.value || "");
      } else {
        const err = await res.json().catch(() => ({}));
        setManageMessage(err.detail || `Failed to update item (${res.status})`, true);
        console.error("Update item failed:", res.status, err);
      }
    } catch (err) {
      console.error("Network error while updating item:", err);
      setManageMessage("Network error while updating item.", true);
    }
  }

  // Delete item (uses hidden id)
  async function deleteItem() {
    clearManageMessage();
    const id = itemIdHidden.value?.trim();
    console.debug("Delete item requested, id:", id);

    if (!id) {
      setManageMessage("Select an item row to delete (click row first).", true);
      return;
    }

    if (!confirm(`Delete the selected item? This cannot be undone.`)) {
      console.debug("Delete cancelled by user");
      return;
    }

    try {
      const res = await fetch(`${API_BASE_URL}/items/${id}`, {
        method: "DELETE",
      });

      if (res.status === 204) {
        setManageMessage(`Deleted item.`);
        console.info("Item deleted, id:", id);
        // remove from recentInserts if present
        recentInserts = recentInserts.filter((r) => String(r.id) !== String(id));
        saveRecentToStorage();
        renderRecentDashboard();

        clearItemForm();
        loadItems(manageSearchInput.value || "");
      } else {
        const err = await res.json().catch(() => ({}));
        setManageMessage(err.detail || `Failed to delete item (${res.status})`, true);
        console.error("Delete item failed:", res.status, err);
      }
    } catch (err) {
      console.error("Network error while deleting item:", err);
      setManageMessage("Network error while deleting item.", true);
    }
  }

  // Clear recent inserts
  function clearRecentInserts() {
    if (!confirm("Clear recent inserts list? This only clears the UI list (not DB).")) {
      console.debug("Clear recent inserts cancelled by user");
      return;
    }
    recentInserts = [];
    saveRecentToStorage();
    renderRecentDashboard();
    console.info("Recent inserts cleared");
  }

  // ---------- Manage UI events ----------
  if (manageSearchBtn) {
    manageSearchBtn.addEventListener("click", () => {
      console.debug("Manage search clicked:", manageSearchInput.value);
      loadItems(manageSearchInput.value || "");
    });
  }
  if (manageSearchInput) {
    manageSearchInput.addEventListener("keypress", (e) => {
      if (e.key === "Enter") {
        console.debug("Manage search Enter pressed:", manageSearchInput.value);
        loadItems(manageSearchInput.value || "");
      }
    });
  }
  if (manageRefreshBtn) {
    manageRefreshBtn.addEventListener("click", () => {
      manageSearchInput.value = "";
      console.debug("Manage refresh clicked");
      loadItems();
    });
  }
  if (itemAddBtn) itemAddBtn.addEventListener("click", addItem);
  if (itemUpdateBtn) itemUpdateBtn.addEventListener("click", updateItem);
  if (itemDeleteBtn) itemDeleteBtn.addEventListener("click", deleteItem);
  if (itemClearBtn) itemClearBtn.addEventListener("click", clearItemForm);
  if (recentClearBtn) recentClearBtn.addEventListener("click", clearRecentInserts);

  // ---------- initial render of Recent Dashboard ----------
  renderRecentDashboard();

  console.debug("script.js: initialization complete");
  // ---------- initial load helpers (existing functionality) ----------
  // nothing auto-loaded on start; user must click Load Alerts, etc.

  // ---------- Diagnostic helper exposed to window ----------
  // Run in DevTools: runRangeDiagnostic()
  window.runRangeDiagnostic = function runRangeDiagnostic() {
    console.info("DIAG: running runRangeDiagnostic()");
    const el_store = document.getElementById("range-store");
    const el_family = document.getElementById("range-family");
    const el_btn = document.getElementById("range-load-btn");
    const el_canvas = document.getElementById("range-chart");
    const el_container = document.getElementById("range-container");

    console.log("DIAG: range-store:", !!el_store, "range-family:", !!el_family, "button:", !!el_btn, "canvas:", !!el_canvas, "container:", !!el_container);

    if (!el_store || !el_family || !el_btn || !el_canvas) {
      console.error("DIAG: Missing DOM elements. Check your index.html for IDs: range-store, range-family, range-load-btn, range-chart");
      return;
    }

    const storeVal = (el_store.value || "").trim() || "1";
    const famVal = (el_family.value || "").trim() || "GROCERY I";
    console.log("DIAG: current input values -> store:", storeVal, "family:", famVal);

    const params = new URLSearchParams({ store_nbr: storeVal, family: famVal });
    const url = `${API_BASE_URL}/range-forecast?${params.toString()}`;

    console.log("DIAG: Fetching", url, " — this checks CORS & backend response");
    fetch(url, { method: "GET" })
      .then(async (res) => {
        console.log("DIAG: HTTP status", res.status);
        const txt = await res.text().catch(()=>null);
        let parsed;
        try { parsed = JSON.parse(txt); } catch(e) { parsed = null; }
        console.log("DIAG: response text (first 1000 chars):", txt ? txt.slice(0,1000) : txt);
        if (parsed) console.log("DIAG: parsed JSON keys:", Object.keys(parsed));
        return res;
      })
      .catch((err) => {
        console.error("DIAG: fetch error — could not reach backend or CORS blocked:", err);
      });
  };
});

const alertBtn = document.getElementById("alert-btn");
const alertMsg = document.getElementById("alert-msg");

if (alertBtn) {
  alertBtn.addEventListener("click", async () => {
    alertMsg.textContent = "Checking stock & sending alerts...";
    alertMsg.style.color = "var(--muted)";

    try {
      const res = await fetch(
        "http://127.0.0.1:8000/check-stock-alerts",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            // later auth add:
            // "Authorization": "Bearer " + localStorage.getItem("token")
          }
        }
      );

      const data = await res.json();

      if (!res.ok) {
        alertMsg.textContent = data.detail || "Failed to send alerts";
        alertMsg.style.color = "var(--error-text)";
        return;
      }

      alertMsg.textContent = "✅ Alerts sent successfully!";
      alertMsg.style.color = "var(--metrics-text)";
    } catch (err) {
      console.error(err);
      alertMsg.textContent = "❌ Backend not reachable";
      alertMsg.style.color = "var(--error-text)";
    }
  });
}

const API = "http://127.0.0.1:8000";

const emailToggle = document.getElementById("emailToggle");
const smsToggle = document.getElementById("smsToggle");
const status = document.getElementById("toggleStatus");

// Load current settings
fetch(API + "/alert-settings")
  .then(res => res.json())
  .then(data => {
    emailToggle.checked = data.email;
    smsToggle.checked = data.sms;
  });

// Update on toggle
function updateSettings() {
  fetch(API + "/alert-settings", {
    method: "POST",
    headers: {"Content-Type": "application/json"},
    body: JSON.stringify({
      email: emailToggle.checked,
      sms: smsToggle.checked
    })
  })
  .then(res => res.json())
  .then(() => {
    status.textContent = "✅ Settings updated";
  });
}

emailToggle.onchange = updateSettings;
smsToggle.onchange = updateSettings;