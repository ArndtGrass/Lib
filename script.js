
document.addEventListener("DOMContentLoaded", () => {
  const tableBody = document.querySelector("#resultsTable tbody");
  const searchInput = document.querySelector("#searchInput");
  const entriesSelect = document.querySelector("#entriesPerPage");
  const sortField = document.querySelector("#sortField");
  const pageInfo = document.getElementById("pageInfo");
  const pageInfoBottom = document.getElementById("pageInfoBottom");

  let allStories = [];
  let currentPage = 1;

  const urlParams = new URLSearchParams(window.location.search);
  const authorFilter = urlParams.get("author");

  async function loadData() {
    const res = await fetch("stories.csv");
    const text = await res.text();
    const rows = text.split("\n").map(r => r.split(";"));
    const headers = rows[0];
    allStories = rows.slice(1).filter(r => r.length >= 13).map(row => {
      const obj = {};
      headers.forEach((h, i) => obj[h] = row[i]);
      return obj;
    });

    if (authorFilter) {
      searchInput.value = "";
      allStories = allStories.filter(s => s.author === authorFilter);
    }

    updatePageInfo();
    renderTable();
  }

  function getFilteredStories() {
    const query = searchInput.value.toLowerCase();
    return allStories.filter(s =>
      s.title?.toLowerCase().includes(query) ||
      s.author?.toLowerCase().includes(query) ||
      s.rating_score?.toLowerCase().includes(query)
    );
  }

  function renderTable() {
    const perPage = parseInt(entriesSelect.value);
    const sortBy = sortField.value;
    const filtered = getFilteredStories();

    filtered.sort((a, b) => (a[sortBy] || "").localeCompare(b[sortBy] || ""));

    const start = (currentPage - 1) * perPage;
    const end = start + perPage;
    const pageItems = filtered.slice(start, end);

    tableBody.innerHTML = "";

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

      const codes = Array.from({length: 50}, (_, i) => story[`code_${i+1}`]).filter(Boolean).join(", ")
        .split(",")
        .map(c => c.trim())
        .filter(Boolean)
        .join(", ");

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
      });

      tableBody.appendChild(tr);
      tableBody.appendChild(detailRow);
    }

    updatePageInfo();
  }

  function updatePageInfo() {
    const perPage = parseInt(entriesSelect.value);
    const filtered = getFilteredStories();
    const totalPages = Math.max(1, Math.ceil(filtered.length / perPage));
    if (currentPage > totalPages) currentPage = totalPages;
    const text = `Seite ${currentPage} von ${totalPages}`;
    if (pageInfo) pageInfo.textContent = text;
    if (pageInfoBottom) pageInfoBottom.textContent = text;
  }

  function setupPagination() {
    for (const suffix of ["", "b"]) {
      for (let delta of [-10, -5, -1, 1, 5, 10]) {
        const id = (delta < 0 ? "prev" : "next") + Math.abs(delta) + suffix;
        const btn = document.getElementById(id);
        if (btn) {
          btn.addEventListener("click", () => {
            currentPage += delta;
            if (currentPage < 1) currentPage = 1;
            updatePageInfo();
            renderTable();
          });
        }
      }
    }
  }

  searchInput.addEventListener("input", () => {
    currentPage = 1;
    updatePageInfo();
    renderTable();
  });

  entriesSelect.addEventListener("change", () => {
    currentPage = 1;
    updatePageInfo();
    renderTable();
  });

  sortField.addEventListener("change", () => {
    updatePageInfo();
    renderTable();
  });

  loadData();
  setupPagination();
});
