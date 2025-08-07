function updateCodeTagState(span) {
  const current = span.dataset.state || "maybe";
  let next;
  if (current === "maybe") {
    next = "yes";
    span.style.backgroundColor = "#8f8";
  } else if (current === "yes") {
    next = "no";
    span.style.backgroundColor = "#f88";
  } else {
    next = "maybe";
    span.style.backgroundColor = "#ddd";
  }
  span.dataset.state = next;
}


let availableCodes = [];

const codeCategories = {"Activity": ["bestiality", "cbt", "enema", "exhibition", "fisting", "incest", "interracial", "lactation", "modification", "pregnant", "scatology", "size", "snuff", "spanking", "Swallowing", "teen", "Tit Torture", "toys", "transgender", "transvestite", "voyeurism", "WaterSport", "Young"], "Consent": ["blackmail", "consensual", "Forced", "humiliation", "mc", "nc", "reluctant", "romantic", "torture"], "Content": ["Extreme", "Hardcore", "Heavy", "Light", "no codes by author", "Rated R", "Rated XXX", "Serious", "violent"], "Fetish": ["B/D", "BDSM", "bondage", "chastity belt", "D/s", "feet", "hair", "latex", "lingerie", "Rape", "S/M", "slavery"], "Gender": ["F/f", "F/f+", "F/m", "F/m+", "F/mf", "F+/f", "F+/f+", "F+/fm", "F+/m", "F+/m+", "f-self", "M/f", "M/f+", "M/m", "M/m+", "M/mf", "M+/f", "M+/f+", "M+/m", "M+/m+", "MF/f", "MF/m", "MF/mf", "m-self"], "Theme": ["bible", "college", "documentary", "Fantasy", "gothic", "HighSchool", "historical", "job", "On Line", "real", "ScFi", "slow", "spoof"]};

let groups = [];

function addGroup() {
  const id = groups.length;
  groups.push({ logic: "and", codes: [] });

  const groupDiv = document.createElement("div");
  groupDiv.className = "group";
  groupDiv.innerHTML = `
    <div class="group-controls">
      <label>Logik:
        <select onchange="groups[${id}].logic = this.value">
          <option value="and">UND</option>
          <option value="or">ODER</option>
        </select>
      </label>
    </div>
    <div id="group-${id}"></div>
  `;
  document.getElementById("groupContainer").appendChild(groupDiv);

  const groupCodes = document.getElementById("group-" + id);
  for (const [subcat, codes] of Object.entries(codeCategories)) {
    const title = document.createElement("div");
    title.textContent = subcat;
    title.style.fontWeight = "bold";
    title.style.marginTop = "8px";
    groupCodes.appendChild(title);

    const codeBlock = document.createElement("div");
    codes.forEach(code => {
      const span = document.createElement("span");
      span.className = "badge";
      span.textContent = code;
      span.style.cursor = "pointer";
      
	  span.dataset.state = "maybe";  // Startwert setzen
	  span.onclick = () => updateCodeTagState(span);
	  
      codeBlock.appendChild(span);
    });
    groupCodes.appendChild(codeBlock);
  }
}

function applyAdvancedFilter() {
  document.getElementById("results").innerText = JSON.stringify(groups, null, 2);
}

function resetAdvancedFilter() {
  groups = [];
  document.getElementById("groupContainer").innerHTML = "";
  document.getElementById("results").innerHTML = "";
}


let currentPage = 1;
let rowsPerPage = 25;
let filteredStories = [];

function applyAdvancedFilter() {
  if (!stories.length) {
    console.warn("Stories noch nicht geladen.");
    return;
  }

  filteredStories = [];

  for (const story of stories) {
    const storyCodes = Object.keys(story)
      .filter(k => k.startsWith("code_") && story[k])
      .map(k => story[k]);

    let storyMatches = true;

    for (const group of groups) {
      if (group.codes.length === 0) continue;
      if (group.logic === "and") {
        if (!group.codes.every(code => storyCodes.includes(code))) {
          storyMatches = false;
          break;
        }
      } else if (group.logic === "or") {
        if (!group.codes.some(code => storyCodes.includes(code))) {
          storyMatches = false;
          break;
        }
      }
    }

    if (storyMatches) filteredStories.push(story);
  }

  currentPage = 1;
  renderTable();
}

function renderTable() {
  const start = (currentPage - 1) * rowsPerPage;
  const end = start + rowsPerPage;
  const pageData = filteredStories.slice(start, end);

  const container = document.getElementById("results");
  container.innerHTML = "";

  if (pageData.length === 0) {
    container.innerHTML = "<em>Keine passenden Stories gefunden.</em>";
    return;
  }

  const table = document.createElement("table");
  table.className = "story-table";
  const header = document.createElement("tr");
  ["Titel", "Autor", "Bewertung", "Stimmen", "Datum"].forEach(label => {
    const th = document.createElement("th");
    th.textContent = label;
    header.appendChild(th);
  });
  table.appendChild(header);

  pageData.forEach((story, index) => {
    const row = document.createElement("tr");
    row.innerHTML = `
      <td>${story.title}</td>
      <td>${story.author}</td>
      <td>${story.rating_score}</td>
      <td>${story.rating_votes}</td>
      <td>${story.added_on}</td>
    `;
    row.onclick = () => expandRow(row, story);
    table.appendChild(row);
  });

  container.appendChild(table);
  renderPagination();
}

function expandRow(row, story) {
  if (row.nextSibling && row.nextSibling.classList.contains("expansion")) {
    row.nextSibling.remove();
    return;
  }

  const detailsRow = document.createElement("tr");
  detailsRow.className = "expansion";
  const cell = document.createElement("td");
  cell.colSpan = 5;
  cell.innerHTML = `
    <strong><a href="detail.html?file=${story.html}" target="_blank">${story.title}</a></strong><br>
    <em>${story.synopsis}</em><br>
    ${Object.keys(story).filter(k => k.startsWith("code_") && story[k])
      .map(k => '<span class="badge">' + story[k] + '</span>').join(" ")}
  `;
  detailsRow.appendChild(cell);
  row.parentNode.insertBefore(detailsRow, row.nextSibling);
}

function renderPagination() {
  const container = document.getElementById("results");
  const nav = document.createElement("div");
  nav.className = "pagination";

  const totalPages = Math.ceil(filteredStories.length / rowsPerPage);
  const jump = (offset) => {
    currentPage = Math.min(Math.max(currentPage + offset, 1), totalPages);
    renderTable();
  };

  const sizes = [25, 50, 100];
  const sizeSelect = document.createElement("select");
  sizes.forEach(size => {
    const option = document.createElement("option");
    option.value = size;
    option.textContent = size + " pro Seite";
    if (size === rowsPerPage) option.selected = true;
    sizeSelect.appendChild(option);
  });
  sizeSelect.onchange = () => {
    rowsPerPage = parseInt(sizeSelect.value);
    currentPage = 1;
    renderTable();
  };

  const jumpBack = document.createElement("button");
  jumpBack.textContent = "«";
  jumpBack.onclick = () => jump(-10);

  const back = document.createElement("button");
  back.textContent = "‹";
  back.onclick = () => jump(-1);

  const forward = document.createElement("button");
  forward.textContent = "›";
  forward.onclick = () => jump(1);

  const jumpForward = document.createElement("button");
  jumpForward.textContent = "»";
  jumpForward.onclick = () => jump(10);

  nav.append(sizeSelect, jumpBack, back,
    document.createTextNode(` Seite ${currentPage} / ${totalPages} `),
    forward, jumpForward);

  container.appendChild(nav);
}

window.addEventListener("DOMContentLoaded", () => {
  Papa.parse("stories.csv", {
    download: true,
    header: true,
    delimiter: ";",
    quoteChar: '"',
    complete: function(results) {
      stories = results.data.filter(row => row.html);
      console.log("Stories geladen:", stories.length);
    }
  });
});


// --- Filter-Verwaltung ---
function saveCurrentFilter() {
  const name = prompt("Filtername eingeben:");
  if (!name) return;

  const filters = JSON.parse(localStorage.getItem("savedFilters") || "{}");
  filters[name] = groups;
  localStorage.setItem("savedFilters", JSON.stringify(filters));
  updateFilterDropdown();
}

function loadFilter(name) {
  const filters = JSON.parse(localStorage.getItem("savedFilters") || "{}");
  if (filters[name]) {
    groups = filters[name];
    renderGroups();
    applyAdvancedFilter();
  }
}

function deleteFilter(name) {
  const filters = JSON.parse(localStorage.getItem("savedFilters") || "{}");
  if (filters[name]) {
    if (confirm("Filter wirklich löschen?")) {
      delete filters[name];
      localStorage.setItem("savedFilters", JSON.stringify(filters));
      updateFilterDropdown();
    }
  }
}

function renameFilter(oldName) {
  const newName = prompt("Neuer Name für Filter:", oldName);
  if (!newName || newName === oldName) return;

  const filters = JSON.parse(localStorage.getItem("savedFilters") || "{}");
  if (filters[oldName]) {
    filters[newName] = filters[oldName];
    delete filters[oldName];
    localStorage.setItem("savedFilters", JSON.stringify(filters));
    updateFilterDropdown();
  }
}

function updateFilterDropdown() {
  const filters = JSON.parse(localStorage.getItem("savedFilters") || "{}");
  const sel = document.getElementById("filterSelect");
  sel.innerHTML = "";
  for (const name of Object.keys(filters)) {
    const opt = document.createElement("option");
    opt.value = name;
    opt.textContent = name;
    sel.appendChild(opt);
  }
}

// --- Export/Import ---
function exportCurrentFilter() {
  const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(groups, null, 2));
  const link = document.createElement("a");
  link.setAttribute("href", dataStr);
  link.setAttribute("download", "filter.json");
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

function importFilterFromFile(event) {
  const file = event.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = function(e) {
    try {
      groups = JSON.parse(e.target.result);
      renderGroups();
    applyAdvancedFilter();
    } catch (err) {
      alert("Fehler beim Importieren.");
    }
  };
  reader.readAsText(file);
}

// --- Filterbereich ein-/ausklappbar ---
function toggleFilterPanel() {
  const panel = document.getElementById("filterPanel");
  panel.style.display = (panel.style.display === "none") ? "block" : "none";
}

window.addEventListener("DOMContentLoaded", () => {
  Papa.parse("stories.csv", {
    download: true,
    header: true,
    delimiter: ";",
    quoteChar: '"',
    complete: function(results) {
      stories = results.data.filter(row => row.html);
      updateFilterDropdown();
    }
  });
});


let currentFilterName = null;

function loadFilter(name) {
  const filters = JSON.parse(localStorage.getItem("savedFilters") || "{}");
  if (filters[name]) {
    groups = filters[name];
    currentFilterName = name;
    document.getElementById("activeFilterName").innerHTML =
      "🔹 Aktiver Filter: <strong>" + name + "</strong>";
    renderGroups();
    renderGroups();
    applyAdvancedFilter();
  }
}

function renderGroups() {
  const panel = document.getElementById("filterPanel");
  const groupContainerId = "groupContainer";

  let container = document.getElementById(groupContainerId);
  if (container) container.remove();

  container = document.createElement("div");
  container.id = groupContainerId;

  groups.forEach((group, idx) => {
    const wrapper = document.createElement("div");
    wrapper.style.marginBottom = "0.5em";

    const logicSelect = document.createElement("select");
    logicSelect.innerHTML = '<option value="and">UND</option><option value="or">ODER</option>';
    logicSelect.value = group.logic;
    logicSelect.onchange = () => {
      group.logic = logicSelect.value;
      renderGroups();
    applyAdvancedFilter();
    };

    const deleteBtn = document.createElement("button");
    deleteBtn.textContent = "❌";
    deleteBtn.title = "Filtergruppe entfernen";
    deleteBtn.style.marginLeft = "0.5em";
    deleteBtn.onclick = () => {
      if (confirm("Diese Filtergruppe wirklich entfernen?")) {
        groups.splice(idx, 1);
        renderGroups();
        renderGroups();
    applyAdvancedFilter();
      }
    };

    const codes = group.codes.map(code => `<span class="badge">${code}</span>`).join(" ");

    wrapper.appendChild(logicSelect);
    wrapper.appendChild(deleteBtn);
    const codesSpan = document.createElement("span");
    codesSpan.innerHTML = " " + codes;
    wrapper.appendChild(codesSpan);

    container.appendChild(wrapper);
  });

  panel.appendChild(container);
}


function renderGroups() {
  const panel = document.getElementById("filterPanel");
  const groupContainerId = "groupContainer";

  let container = document.getElementById(groupContainerId);
  if (container) container.remove();

  container = document.createElement("div");
  container.id = groupContainerId;

  groups.forEach((group, idx) => {
    const wrapper = document.createElement("div");
    wrapper.style.marginBottom = "0.5em";
    wrapper.style.border = "1px solid #ccc";
    wrapper.style.padding = "0.5em";
    wrapper.style.borderRadius = "6px";

    const logicSelect = document.createElement("select");
    logicSelect.innerHTML = '<option value="and">UND</option><option value="or">ODER</option>';
    logicSelect.value = group.logic;
    logicSelect.onchange = () => {
      group.logic = logicSelect.value;
      renderGroups();
    applyAdvancedFilter();
    };

    const deleteBtn = document.createElement("button");
    deleteBtn.textContent = "❌";
    deleteBtn.title = "Filtergruppe entfernen";
    deleteBtn.style.marginLeft = "0.5em";
    deleteBtn.onclick = () => {
      if (confirm("Diese Filtergruppe wirklich entfernen?")) {
        groups.splice(idx, 1);
        renderGroups();
        renderGroups();
    applyAdvancedFilter();
      }
    };

    const groupHeader = document.createElement("div");
    groupHeader.appendChild(logicSelect);
    groupHeader.appendChild(deleteBtn);

    const codesDiv = document.createElement("div");
    codesDiv.style.marginTop = "0.5em";
    group.codes.forEach((code, codeIdx) => {
      const badge = document.createElement("span");
      badge.className = "badge";
      badge.style.marginRight = "0.25em";
      badge.innerHTML = code + ` <span style="cursor:pointer;" title="entfernen" onclick="removeCodeFromGroup(${idx}, '${code}')">✖</span>`;
      codesDiv.appendChild(badge);
    });

    const addBtn = document.createElement("button");
    addBtn.textContent = "➕ Code hinzufügen";
    addBtn.style.marginTop = "0.5em";
    addBtn.onclick = () => showAddCodeMenu(idx);

    wrapper.appendChild(groupHeader);
    wrapper.appendChild(codesDiv);
    wrapper.appendChild(addBtn);

    container.appendChild(wrapper);
  });

  panel.appendChild(container);
}

function removeCodeFromGroup(groupIdx, code) {
  const group = groups[groupIdx];
  group.codes = group.codes.filter(c => c !== code);
  renderGroups();
  renderGroups();
    applyAdvancedFilter();
}

function showAddCodeMenu(groupIdx) {
  const allCodes = availableCodes.map(c => c.code);
  const group = groups[groupIdx];

  const codeToAdd = prompt("Code hinzufügen (z. B. F/m):", "");
  if (!codeToAdd) return;
  if (!allCodes.includes(codeToAdd)) {
    alert("Ungültiger Code.");
    return;
  }
  if (group.codes.includes(codeToAdd)) {
    alert("Code ist bereits in dieser Gruppe.");
    return;
  }
  group.codes.push(codeToAdd);
  renderGroups();
  renderGroups();
    applyAdvancedFilter();
}


function showAddCodeMenu(groupIdx) {
  const group = groups[groupIdx];

  const menuId = "codeMenu_" + groupIdx;
  const existing = document.getElementById(menuId);
  if (existing) {
    existing.remove();
    return;
  }

  const selector = document.createElement("select");
  selector.id = menuId;

  const used = new Set(group.codes);
  const categories = {};

  availableCodes.forEach(code => {
    if (used.has(code.code)) return;
    if (!categories[code.subcategory]) {
      categories[code.subcategory] = [];
    }
    categories[code.subcategory].push(code.code);
  });

  for (const subcat of Object.keys(categories)) {
    const optgroup = document.createElement("optgroup");
    optgroup.label = subcat;
    categories[subcat].forEach(code => {
      const opt = document.createElement("option");
      opt.value = code;
      opt.textContent = code;
      optgroup.appendChild(opt);
    });
    selector.appendChild(optgroup);
  }

  const confirmBtn = document.createElement("button");
  confirmBtn.textContent = "Hinzufügen";
  confirmBtn.onclick = () => {
    const code = selector.value;
    if (!code) return;
    group.codes.push(code);
    selector.remove();
    confirmBtn.remove();
    renderGroups();
    renderGroups();
    applyAdvancedFilter();
  };

  const cancelBtn = document.createElement("button");
  cancelBtn.textContent = "Abbrechen";
  cancelBtn.onclick = () => {
    selector.remove();
    confirmBtn.remove();
    cancelBtn.remove();
  };

  const groupDiv = document.querySelectorAll("#groupContainer > div")[groupIdx];
  groupDiv.appendChild(selector);
  groupDiv.appendChild(confirmBtn);
  groupDiv.appendChild(cancelBtn);
}


Papa.parse("codes.csv", {
  download: true,
  header: true,
  complete: function(results) {
    availableCodes = results.data;
  }
});

// Sicherheitsprüfung beim Öffnen des Dropdowns
function showAddCodeMenu(groupIdx) {
  if (!availableCodes.length) {
    alert("Codes sind noch nicht geladen. Bitte warte einen Moment.");
    return;
  }

  const group = groups[groupIdx];
  const menuId = "codeMenu_" + groupIdx;
  const existing = document.getElementById(menuId);
  if (existing) {
    existing.remove();
    return;
  }

  const selector = document.createElement("select");
  selector.id = menuId;

  const used = new Set(group.codes);
  const categories = {};

  availableCodes.forEach(code => {
    if (used.has(code.code)) return;
    if (!categories[code.subcategory]) {
      categories[code.subcategory] = [];
    }
    categories[code.subcategory].push(code.code);
  });

  for (const subcat of Object.keys(categories)) {
    const optgroup = document.createElement("optgroup");
    optgroup.label = subcat;
    categories[subcat].forEach(code => {
      const opt = document.createElement("option");
      opt.value = code;
      opt.textContent = code;
      optgroup.appendChild(opt);
    });
    selector.appendChild(optgroup);
  }

  const confirmBtn = document.createElement("button");
  confirmBtn.textContent = "Hinzufügen";
  confirmBtn.onclick = () => {
    const code = selector.value;
    if (!code) return;
    group.codes.push(code);
    selector.remove();
    confirmBtn.remove();
    cancelBtn.remove();
    renderGroups();
    renderGroups();
    applyAdvancedFilter();
  };

  const cancelBtn = document.createElement("button");
  cancelBtn.textContent = "Abbrechen";
  cancelBtn.onclick = () => {
    selector.remove();
    confirmBtn.remove();
    cancelBtn.remove();
  };

  const groupDiv = document.querySelectorAll("#groupContainer > div")[groupIdx];
  groupDiv.appendChild(selector);
  groupDiv.appendChild(confirmBtn);
  groupDiv.appendChild(cancelBtn);
}


function renderGroups() {
  const container = document.getElementById("filterGroups");
  container.innerHTML = ""; // Alte Gruppen entfernen

  groups.forEach((group, gIdx) => {
    const groupDiv = document.createElement("div");
    groupDiv.className = "filter-group";

    const logicSel = document.createElement("select");
    logicSel.innerHTML = "<option value='AND'>UND</option><option value='OR'>ODER</option>";
    logicSel.value = group.logic || "AND";
    logicSel.onchange = () => {
      group.logic = logicSel.value;
      applyAdvancedFilter();
    };
    groupDiv.appendChild(logicSel);

    group.codes.forEach(code => {
      const span = document.createElement("span");
      span.className = "code-tag";
      span.textContent = code.code;
      span.dataset.code = code.code;
      span.dataset.sub = code.sub;
      span.dataset.state = code.state || "maybe";
      updateCodeTagState(span);
      span.onclick = () => {
        const states = ["maybe", "yes", "no"];
        const idx = states.indexOf(span.dataset.state);
        span.dataset.state = states[(idx + 1) % 3];
        updateCodeTagState(span);
        code.state = span.dataset.state;
        applyAdvancedFilter();
      };
      groupDiv.appendChild(span);
    });

    const delBtn = document.createElement("button");
    delBtn.textContent = "✖";
    delBtn.title = "Diese Filtergruppe entfernen";
    delBtn.onclick = () => {
      if (confirm("Filtergruppe wirklich löschen?")) {
        groups.splice(gIdx, 1);
        renderGroups();
        applyAdvancedFilter();
      }
    };
    groupDiv.appendChild(delBtn);

    container.appendChild(groupDiv);
  });
}