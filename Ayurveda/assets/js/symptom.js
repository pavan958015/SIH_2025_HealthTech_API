const files = [
  { name: "ICD-11", path: "./Ayurveda/assets/data/icd11_codes.csv" },
];

let allTerms = [];
let namasteData = [];

files.forEach(file => {
  Papa.parse(file.path, {
    download: true,
    header: true,
    complete: function(data) {
      data.data.forEach(row => {
        const term = (row.term_english || "").trim();
        if (term) allTerms.push(term);
        namasteData.push(row);
      });
    }
  });
});

function showSuggestions(query) {
  const suggestionBox = document.getElementById("suggestions");
  suggestionBox.innerHTML = "";
  if (!query) {
    suggestionBox.style.display = "none";
    return;
  }
  const matches = allTerms.filter(term => term.toLowerCase().includes(query.toLowerCase())).slice(0, 5);
  if (!matches.length) {
    suggestionBox.style.display = "none";
    return;
  }
  matches.forEach(match => {
    const li = document.createElement("li");
    li.className = "list-group-item list-group-item-action";
    li.innerText = match;
    li.onclick = () => {
      document.getElementById("searchInput").value = match;
      suggestionBox.style.display = "none";
      searchSymptom();
    };
    suggestionBox.appendChild(li);
  });
  suggestionBox.style.display = "block";
}

function searchSymptom() {
  const query = document.getElementById("searchInput").value.toLowerCase();
  let results = [];

  namasteData.forEach(row => {
    const eng = (row.term_english || "").toLowerCase();
    const code = (row.namc_code || "").toLowerCase();
    const icd11mms = (row.icd11_mms || "").toLowerCase();
    const icd11tm2 = (row.icd11_tm2 || "").toLowerCase();

    if (eng.includes(query) || code === query || icd11mms === query || icd11tm2 === query) {
      results.push({
        namaste_code: row.namc_code || "-",
        icd11_code: row.icd11_mms || "-",
        icd11_tm2: row.icd11_tm2 || "-",
        english: row.term_english || "-",
        sanskrit: row.term_sanskrit || "-",
        source: "ICD-11",
        extra: row.description || row.details || ""
      });
    }
  });

  displayResults(results);
}

function displayResults(results) {
  const container = document.getElementById("results");
  if (!results.length) {
    container.innerHTML = "<p class='text-center text-danger'>No results found</p>";
    return;
  }

  let table = `
    <div class="card shadow-sm">
      <div class="card-body">
        <h5>Search Result:</h5>
        <table class="table table-bordered">
          <thead class="table-light">
            <tr>
              <th>NAMASTE Code</th>
              <th>ICD-11 Code</th>
              <th>ICD-11 TM2</th>
              <th>English</th>
              <th>Sanskrit</th>
              <th>Source</th>
              <th>Extra Info</th>
            </tr>
          </thead>
          <tbody>
  `;

  results.forEach((item, index) => {
    table += `
      <tr id="row-${index}">
        <td>${item.namaste_code}</td>
        <td>${item.icd11_code}</td>
        <td>${item.icd11_tm2}</td>
        <td>${item.english}</td>
        <td>${item.sanskrit}</td>
        <td>${item.source}</td>
        <td class="extra-info">${item.extra ? item.extra : "Loading..."}</td>
      </tr>
    `;
  });

  table += `</tbody></table></div></div>`;
  container.innerHTML = table;

  results.forEach((item, index) => {
    if (!item.extra) fetchExtraInfo(item.english, document.querySelector(`#row-${index} .extra-info`));
  });
}

function fetchExtraInfo(term, cell) {
  if (!term) {
    cell.innerHTML = "No extra info found.";
    return;
  }
  let cleanTerm = term;
  const match = term.match(/\((.*?)\)/);
  cleanTerm = match ? match[1] : term.replace(/[()]/g, "").trim();

  const apiUrl = `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(cleanTerm)}`;
  fetch(apiUrl)
    .then(res => res.json())
    .then(data => {
      if (data.extract) cell.innerText = data.extract.split(".").slice(0, 2).join(".") + ".";
      else cell.innerHTML = `No extra info found. <a href="https://www.google.com/search?q=${encodeURIComponent(cleanTerm)}" target="_blank">Search on Google</a>`;
    })
    .catch(() => {
      cell.innerHTML = `Error fetching info. <a href="https://www.google.com/search?q=${encodeURIComponent(cleanTerm)}" target="_blank">Try Google</a>`;
    });
}
