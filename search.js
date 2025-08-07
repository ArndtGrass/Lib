
let stories = [];
let filteredStories = [];
let currentPage = 1;
let pageSize = 25;
let codeStates = {};  // code: "yes" | "no" | "maybe"

// Klicklogik für Dreifachzustände
document.addEventListener("DOMContentLoaded", () => {
  document.querySelectorAll(".code-button").forEach(btn => {
    const code = btn.dataset.code;
    codeStates[code] = "maybe";

    btn.addEventListener("click", () => {
      const current = codeStates[code];
      const next = current === "maybe" ? "yes" : current === "yes" ? "no" : "maybe";
      codeStates[code] = next;
      btn.classList.remove("maybe", "yes", "no");
      btn.classList.add(next);
    });
  });

  document.getElementById("titleSearch").addEventListener("input", updateFilters);
  document.getElementById("authorSearch").addEventListener("input", updateFilters);

  loadStories();
});

function loadStories() {
  fetch("stories.csv")
    .then(res => res.text())
    .then(text => {
      const rows = text.split(/\r?\n/);
      const headers = rows[0].split(";");

      stories = rows.slice(1).map(row => {
        const values = parseCsvRow(row);
        let entry = {};
        headers.forEach((h, i) => entry[h] = values[i]);
        return entry;
      }).filter(entry => entry["title"] && entry["author"]);
      updateFilters();
    });
}

function parseCsvRow(row) {
  const result = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < row.length; i++) {
    const char = row[i];
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ';' && !inQuotes) {
      result.push(current);
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current);
  return result;
}

function updateFilters() {
  const titleFilter = document.getElementById("titleSearch").value.toLowerCase();
  const authorFilter = document.getElementById("authorSearch").value.toLowerCase();

  filteredStories = stories.filter(story => {
    const titleMatch = story["title"].toLowerCase().includes(titleFilter);
    const authorMatch = story["author"].toLowerCase().includes(authorFilter);

    const codes = Object.keys(story)
      .filter(k => k.startsWith("code_") && story[k])
      .map(k => story[k]);

    for (const [code, state] of Object.entries(codeStates)) {
      if (state === "yes" && !codes.includes(code)) return false;
      if (state === "no" && codes.includes(code)) return false;
    }

    return titleMatch && authorMatch;
  });

  currentPage = 1;
  updatePagination();
  renderResults();
}

function updatePagination() {
  const pagination = document.getElementById("pagination");
  pagination.innerHTML = "";

  const pageCount = Math.ceil(filteredStories.length / pageSize);

  const jumpButton = (label, target) => {
    const btn = document.createElement("button");
    btn.textContent = label;
    btn.onclick = () => {
      currentPage = Math.max(1, Math.min(pageCount, target));
      renderResults();
    };
    pagination.appendChild(btn);
  };

  jumpButton("<<", currentPage - 10);
  jumpButton("<", currentPage - 1);

  for (let i = 1; i <= pageCount; i++) {
    if (Math.abs(currentPage - i) <= 2 || i === 1 || i === pageCount) {
      const btn = document.createElement("button");
      btn.textContent = i;
      if (i === currentPage) btn.disabled = true;
      btn.onclick = () => {
        currentPage = i;
        renderResults();
      };
      pagination.appendChild(btn);
    } else if (i === 2 || i === pageCount - 1) {
      const span = document.createElement("span");
      span.textContent = "...";
      pagination.appendChild(span);
    }
  }

  jumpButton(">", currentPage + 1);
  jumpButton(">>", currentPage + 10);

  const sizeSelect = document.createElement("select");
  [25, 50, 100].forEach(size => {
    const opt = document.createElement("option");
    opt.value = size;
    opt.text = size + " pro Seite";
    if (size === pageSize) opt.selected = true;
    sizeSelect.appendChild(opt);
  });
  sizeSelect.onchange = () => {
    pageSize = parseInt(sizeSelect.value);
    currentPage = 1;
    updatePagination();
    renderResults();
  };
  pagination.appendChild(sizeSelect);
}

function renderResults() {
  const start = (currentPage - 1) * pageSize;
  const end = start + pageSize;
  const container = document.getElementById("results");
  container.innerHTML = "";

  filteredStories.slice(start, end).forEach(story => {
    const div = document.createElement("div");
    div.innerHTML = `<strong>${story["title"]}</strong> von ${story["author"]}`;
    container.appendChild(div);
  });
}

function resetFilters() {
  document.getElementById("titleSearch").value = "";
  document.getElementById("authorSearch").value = "";

  document.querySelectorAll(".code-button").forEach(btn => {
    const code = btn.dataset.code;
    codeStates[code] = "maybe";
    btn.classList.remove("yes", "no");
    btn.classList.add("maybe");
  });

  updateFilters();
}

let currentSortColumn = null;
let sortAscending = true;

function renderResults() {
  const start = (currentPage - 1) * pageSize;
  const end = start + pageSize;
  const container = document.getElementById("results");
  container.innerHTML = "";

  const table = document.createElement("table");
  table.style.borderCollapse = "collapse";
  table.style.width = "100%";
  table.classList.add("data-table");

  const headerRow = document.createElement("tr");
  const headers = ["Titel", "Autor", "Bewertung", "Stimmen", "Datum", "Details"];
  const keys = ["title", "author", "rating_score", "rating_votes", "added_on"];

  headers.forEach((label, i) => {
    const th = document.createElement("th");
    th.textContent = label;
    if (i < 5) {
      th.style.cursor = "pointer";
      th.onclick = () => sortBy(keys[i]);
    }
    th.style.borderBottom = "1px solid #aaa";
    headerRow.appendChild(th);
  });

  table.appendChild(headerRow);

  filteredStories.slice(start, end).forEach(story => {
    const row = document.createElement("tr");
    row.style.cursor = "pointer";

    keys.forEach(k => {
      const td = document.createElement("td");
      td.textContent = story[k] || "";
      td.style.padding = "4px 6px";
      row.appendChild(td);
    });

    const detailToggle = document.createElement("td");
    detailToggle.textContent = "▼";
    row.appendChild(detailToggle);

    const detailRow = document.createElement("tr");
    detailRow.style.display = "none";
    const detailCell = document.createElement("td");
    detailCell.colSpan = 6;
    detailCell.style.backgroundColor = "#f9f9f9";
    detailCell.style.padding = "8px";

    const synopsis = story["synopsis"] || "<em>Keine Synopsis</em>";
    const codes = Object.keys(story)
      .filter(k => k.startsWith("code_") && story[k])
      .map(k => story[k])
      .join(", ");
    const htmlFile = story["html"] || "#";

    detailCell.innerHTML = `<div class="detail-cell"><table style="width: 100%; margin-bottom: 10px;"><tr><td><a href="detail.html?file=${htmlFile}" target="_blank">${story["title"]}</a></td><td>${story["author"]}</td><td>${story["rating_score"]}</td><td>${story["rating_votes"]}</td><td>${story["added_on"]}</td></tr></table><div><strong>Synopsis:</strong><br>${synopsis}</div><div><strong>Codes:</strong> ${codes.split(", ").map(c => `<span class="badge">${c}</span>`).join(" ")}</div></div>`;

    detailRow.appendChild(detailCell);

    row.addEventListener("click", () => {
      detailRow.style.display = detailRow.style.display === "none" ? "table-row" : "none";
    });

    table.appendChild(row);
    table.appendChild(detailRow);
  });

  container.appendChild(table);
}

function sortBy(key) {
  if (currentSortColumn === key) {
    sortAscending = !sortAscending;
  } else {
    currentSortColumn = key;
    sortAscending = true;
  }

  filteredStories.sort((a, b) => {
    const valA = (a[key] || "").toString().toLowerCase();
    const valB = (b[key] || "").toString().toLowerCase();
    if (!isNaN(parseFloat(valA)) && !isNaN(parseFloat(valB))) {
      return sortAscending
        ? parseFloat(valA) - parseFloat(valB)
        : parseFloat(valB) - parseFloat(valA);
    }
    return sortAscending
      ? valA.localeCompare(valB)
      : valB.localeCompare(valA);
  });

  renderResults();
}
