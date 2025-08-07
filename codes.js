console.log("codes.js vollständig geladen");
    renderFilter();

  function renderFilter() {
    const grouped = {};
    allCodes.forEach(code => {
      const group = code["sub category"]?.trim() || "Allgemein";
      if (!grouped[group]) grouped[group] = [];
      grouped[group].push(code);

    codeFilter.innerHTML = "";

    for (const group of Object.keys(grouped).sort()) {
      const section = document.createElement("div");
      section.className = "code-group";

      const title = document.createElement("h3");
      title.textContent = group;
      section.appendChild(title);

      const row = document.createElement("div");
      row.className = "code-row";

      for (const code of grouped[group]) {
        const box = document.createElement("div");
        box.className = "code-box";

        const label = document.createElement("span");
        label.textContent = code.code;

        const buttons = document.createElement("div");
        buttons.className = "button-group";

        const states = { maybe: "❔", yes: "✔️", no: "❌" };
        Object.entries(states).forEach(([state, icon]) => {
          const btn = document.createElement("button");
          btn.textContent = icon;
          btn.classList.toggle("selected", filters[code.code] === state);
          btn.title = state;
          btn.addEventListener("click", () => {
            filters[code.code] = state;
            renderFilter();
          buttons.appendChild(btn);

        box.appendChild(label);
        box.appendChild(buttons);
        row.appendChild(box);
      }

      section.appendChild(row);
      codeFilter.appendChild(section);
    }
  }

  function storyMatchesTextFilter(story) {
    const keyword = (codeSearch.value || "");
    return !keyword || (
      (story.title || "").includes(keyword) ||
      (story.author || "").includes(keyword) ||
      (story.synopsis || "").includes(keyword)
    );
  }

  function applyFiltersAndRenderResults() {
    fetch("stories.csv")
      .then(res => res.text())
      .then(text => {
        const rows = text.split("\n").map(r => r.split(";"));
        const headers = rows[0];
        const stories = rows.slice(1).map(row => {
          const obj = {};
          headers.forEach((h, i) => obj[h] = row[i]);
          return obj;

        const activeFilters = Object.entries(filters).filter(([code, val]) => val !== "maybe");

        const result = stories.filter(story => {
          
const codes = Array.from({length: 50}, (_, i) => {
  const val = story[`code_${i+1}`];
  return val && typeof val === "string" ? val.trim() : null;
}).filter(Boolean);

          for (const [code, val] of activeFilters) {
            const hasCode = codes.includes(code);
            if (val === "yes" && !codes.includes(code)) return false;
            if (val === "no" && codes.includes(code)) return false;
          }

          return storyMatchesTextFilter(story);

        filteredStories = result;
        currentPage = 1;
        renderResultsTable(filteredStories);
  }

  function renderResultsTable(storiesRaw) {
    const tbody = document.querySelector("#resultsTable tbody");
    const perPage = parseInt(document.getElementById("entriesPerPage").value || "25");
    entriesPerPage = perPage;
    const start = (currentPage - 1) * perPage;
    const pageItems = storiesRaw.slice(start, start + perPage);

    tbody.innerHTML = "";
    for (const story of pageItems) {
      const tr = document.createElement("tr");
      const tdTitle = document.createElement("td");
      const tdAuthor = document.createElement("td");
      const tdScore = document.createElement("td");
      const tdVotes = document.createElement("td");
      const tdDate = document.createElement("td");

      tdTitle.textContent = story.title;
      tdAuthor.textContent = story.author;
      tdScore.textContent = story.rating_score || "-";
      tdVotes.textContent = story.rating_votes || "-";
      tdDate.textContent = story.added_on || "-";

      tr.appendChild(tdTitle);
      tr.appendChild(tdAuthor);
      tr.appendChild(tdScore);
      tr.appendChild(tdVotes);
      tr.appendChild(tdDate);
      tr.style.cursor = "pointer";

      const detailRow = document.createElement("tr");
      detailRow.style.display = "none";
      const tdDetail = document.createElement("td");
      tdDetail.colSpan = 5;

      const codes = Array.from({length: 50}, (_, i) => story[`code_${i+1}`]).filter(Boolean).join(", ");
      tdDetail.innerHTML = `
        <strong>Synopsis:</strong> ${story.synopsis || "—"}<br>
        <strong>Codes:</strong> ${codes || "—"}
      `;
      detailRow.appendChild(tdDetail);

      let expanded = false;
      tr.addEventListener("click", () => {
        expanded = !expanded;
        detailRow.style.display = expanded ? "table-row" : "none";
        if (expanded) {
          tdTitle.innerHTML = `<a href="detail.html?file=${story.index}.html" target="_blank">${story.title}</a>`;
          tdAuthor.innerHTML = `<a href="index.html?author=${encodeURIComponent(story.author)}">${story.author}</a>`;
        } else {
          tdTitle.textContent = story.title;
          tdAuthor.textContent = story.author;
        }

      tbody.appendChild(tr);
      tbody.appendChild(detailRow);
    }

    updatePaginationInfo();
  }

  function updatePaginationInfo() {
    const totalPages = Math.ceil(filteredStories.length / entriesPerPage);
    document.getElementById("pageInfo").textContent = `Seite ${currentPage} von ${totalPages}`;
  }

  function setupPaginationControls() {
    for (let delta of [-10, -5, -1, 1, 5, 10]) {
      const id = (delta < 0 ? "prev" : "next") + Math.abs(delta);
      const btn = document.getElementById(id);
      if (btn) {
        btn.addEventListener("click", () => {
          currentPage += delta;
          if (currentPage < 1) currentPage = 1;
          renderResultsTable(filteredStories);
      }
    }

    document.getElementById("entriesPerPage").addEventListener("change", () => {
      currentPage = 1;
      renderResultsTable(filteredStories);

    document.getElementById("sortField").addEventListener("change", e => {
      currentSort = e.target.value;
      filteredStories.sort((a, b) => (a[currentSort] || "").localeCompare(b[currentSort] || ""));
      renderResultsTable(filteredStories);
  }

  function saveCurrentProfile() {
    const name = prompt("Filterprofil speichern als:");
    if (name) {
      localStorage.setItem("codefilter_profile_" + name, JSON.stringify(filters));
      alert("Gespeichert.");
      updateProfileSelector();
    }
  }

  function loadProfile(name) {
    const stored = localStorage.getItem("codefilter_profile_" + name);
    if (stored) {
      filters = JSON.parse(stored);
      renderFilter();
    }
  }

  function updateProfileSelector() {
    const container = document.getElementById("profileSelector");
    if (!container) return;

    container.innerHTML = "";
    const keys = Object.keys(localStorage).filter(k => k.startsWith("codefilter_profile_"));
    for (const k of keys) {
      const profileName = k.replace("codefilter_profile_", "");
      const btn = document.createElement("button");
      btn.textContent = profileName;
      btn.addEventListener("click", () => loadProfile(profileName));
      container.appendChild(btn);
    }
  }

  const applyBtn = document.createElement("button");
  applyBtn.textContent = "🔍 Filter anwenden";
  applyBtn.style.margin = "1em";
  applyBtn.addEventListener("click", applyFiltersAndRenderResults);
  

  loadCodes();
  setupPaginationControls();
  updateProfileSelector();


  let currentSort = "title";

  async function loadCodes() {
    const res = await fetch("codes.csv");
    const text = await res.text();
    const rows = text.split("\n").map(r => r.split(";"));
    const headers = rows[0];
    allCodes = rows.slice(1).map(row => {
      const obj = {};
      headers.forEach((h, i) => obj[h] = row[i]);
      return obj;
    renderFilter();
  }

  function renderFilter() {
    const grouped = {};
    allCodes.forEach(code => {
      const group = code["sub category"]?.trim() || "Allgemein";
      if (!grouped[group]) grouped[group] = [];
      grouped[group].push(code);

    codeFilter.innerHTML = "";

    for (const group of Object.keys(grouped).sort()) {
      const section = document.createElement("div");
      section.className = "code-group";

      const title = document.createElement("h3");
      title.textContent = group;
      section.appendChild(title);

      const row = document.createElement("div");
      row.className = "code-row";

      for (const code of grouped[group]) {
        const box = document.createElement("div");
        box.className = "code-box";

        const label = document.createElement("span");
        label.textContent = code.code;

        const buttons = document.createElement("div");
        buttons.className = "button-group";

        const states = { maybe: "❔", yes: "✔️", no: "❌" };
        Object.entries(states).forEach(([state, icon]) => {
          const btn = document.createElement("button");
          btn.textContent = icon;
          btn.classList.toggle("selected", filters[code.code] === state);
          btn.title = state;
          btn.addEventListener("click", () => {
            filters[code.code] = state;
            renderFilter();
          buttons.appendChild(btn);

        box.appendChild(label);
        box.appendChild(buttons);
        row.appendChild(box);
      }

      section.appendChild(row);
      codeFilter.appendChild(section);
    }
  }

  function storyMatchesTextFilter(story) {
    const keyword = (codeSearch.value || "");
    return !keyword || (
      (story.title || "").includes(keyword) ||
      (story.author || "").includes(keyword) ||
      (story.synopsis || "").includes(keyword)
    );
  }

  function applyFiltersAndRenderResults() {
    fetch("stories.csv")
      .then(res => res.text())
      .then(text => {
        const rows = text.split("\n").map(r => r.split(";"));
        const headers = rows[0];
        const stories = rows.slice(1).map(row => {
          const obj = {};
          headers.forEach((h, i) => obj[h] = row[i]);
          return obj;

        const activeFilters = Object.entries(filters).filter(([code, val]) => val !== "maybe");

        const result = stories.filter(story => {
          
const codes = Array.from({length: 50}, (_, i) => {
  const val = story[`code_${i+1}`];
  return val && typeof val === "string" ? val.trim() : null;
}).filter(Boolean);

          for (const [code, val] of activeFilters) {
            const hasCode = codes.includes(code);
            if (val === "yes" && !codes.includes(code)) return false;
            if (val === "no" && codes.includes(code)) return false;
          }

          return storyMatchesTextFilter(story);

        filteredStories = result;
        currentPage = 1;
        renderResultsTable(filteredStories);
  }

  function renderResultsTable(storiesRaw) {
    const tbody = document.querySelector("#resultsTable tbody");
    const perPage = parseInt(document.getElementById("entriesPerPage").value || "25");
    entriesPerPage = perPage;
    const start = (currentPage - 1) * perPage;
    const pageItems = storiesRaw.slice(start, start + perPage);

    tbody.innerHTML = "";
    for (const story of pageItems) {
      const tr = document.createElement("tr");
      const tdTitle = document.createElement("td");
      const tdAuthor = document.createElement("td");
      const tdScore = document.createElement("td");
      const tdVotes = document.createElement("td");
      const tdDate = document.createElement("td");

      tdTitle.textContent = story.title;
      tdAuthor.textContent = story.author;
      tdScore.textContent = story.rating_score || "-";
      tdVotes.textContent = story.rating_votes || "-";
      tdDate.textContent = story.added_on || "-";

      tr.appendChild(tdTitle);
      tr.appendChild(tdAuthor);
      tr.appendChild(tdScore);
      tr.appendChild(tdVotes);
      tr.appendChild(tdDate);
      tr.style.cursor = "pointer";

      const detailRow = document.createElement("tr");
      detailRow.style.display = "none";
      const tdDetail = document.createElement("td");
      tdDetail.colSpan = 5;

      const codes = Array.from({length: 50}, (_, i) => story[`code_${i+1}`]).filter(Boolean).join(", ");
      tdDetail.innerHTML = `
        <strong>Synopsis:</strong> ${story.synopsis || "—"}<br>
        <strong>Codes:</strong> ${codes || "—"}
      `;
      detailRow.appendChild(tdDetail);

      let expanded = false;
      tr.addEventListener("click", () => {
        expanded = !expanded;
        detailRow.style.display = expanded ? "table-row" : "none";
        if (expanded) {
          tdTitle.innerHTML = `<a href="detail.html?file=${story.index}.html" target="_blank">${story.title}</a>`;
          tdAuthor.innerHTML = `<a href="index.html?author=${encodeURIComponent(story.author)}">${story.author}</a>`;
        } else {
          tdTitle.textContent = story.title;
          tdAuthor.textContent = story.author;
        }

      tbody.appendChild(tr);
      tbody.appendChild(detailRow);
    }

    updatePaginationInfo();
  }

  function updatePaginationInfo() {
    const totalPages = Math.ceil(filteredStories.length / entriesPerPage);
    document.getElementById("pageInfo").textContent = `Seite ${currentPage} von ${totalPages}`;
  }

  function setupPaginationControls() {
    for (let delta of [-10, -5, -1, 1, 5, 10]) {
      const id = (delta < 0 ? "prev" : "next") + Math.abs(delta);
      const btn = document.getElementById(id);
      if (btn) {
        btn.addEventListener("click", () => {
          currentPage += delta;
          if (currentPage < 1) currentPage = 1;
          renderResultsTable(filteredStories);
      }
    }

    document.getElementById("entriesPerPage").addEventListener("change", () => {
      currentPage = 1;
      renderResultsTable(filteredStories);

    document.getElementById("sortField").addEventListener("change", e => {
      currentSort = e.target.value;
      filteredStories.sort((a, b) => (a[currentSort] || "").localeCompare(b[currentSort] || ""));
      renderResultsTable(filteredStories);
  }

  function saveCurrentProfile() {
    const name = prompt("Filterprofil speichern als:");
    if (name) {
      localStorage.setItem("codefilter_profile_" + name, JSON.stringify(filters));
      alert("Gespeichert.");
      updateProfileSelector();
    }
  }

  function loadProfile(name) {
    const stored = localStorage.getItem("codefilter_profile_" + name);
    if (stored) {
      filters = JSON.parse(stored);
      renderFilter();
    }
  }

  function updateProfileSelector() {
    const container = document.getElementById("profileSelector");
    if (!container) return;

    container.innerHTML = "";
    const keys = Object.keys(localStorage).filter(k => k.startsWith("codefilter_profile_"));
    for (const k of keys) {
      const profileName = k.replace("codefilter_profile_", "");
      const btn = document.createElement("button");
      btn.textContent = profileName;
      btn.addEventListener("click", () => loadProfile(profileName));
      container.appendChild(btn);
    }
  }

  const applyBtn = document.createElement("button");
  applyBtn.textContent = "🔍 Filter anwenden";
  applyBtn.style.margin = "1em";
  applyBtn.addEventListener("click", applyFiltersAndRenderResults);
  

  loadCodes();
  setupPaginationControls();
  updateProfileSelector();


document.addEventListener("DOMContentLoaded", () => {
  document.getElementById("filterBtn")?.addEventListener("click", applyFiltersAndRenderResults);
