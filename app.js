/* ID-Cal-Dashboard main JS – ES 2020
   ============================================================= */
/* global Plotly */

const CSV_URL = "infectious-diseases-by-county-year-and-sex.csv";
const GEOJSON_URL = "california_counties.geojson";

/* ===== 1. Data Load ===== */
let rawData = [];
let countiesGeo = null;

Promise.all([d3.csv(CSV_URL), d3.json(GEOJSON_URL)])
  .then(([csv, geo]) => {
    rawData = csv;
    countiesGeo = geo;
    initControls();
    computeAll(); // first render
  })
  .catch((err) => console.error("Data load error:", err));

/* ===== 2. Global state ===== */
const state = {
  disease: null,
  sex: "All",
  counties: new Set(), // empty = all
  yearMax: 2025,
};

/* ===== 3. Controls ===== */
function initControls() {
  // Populate disease & county selects, set event listeners
  const diseaseSet = new Set(rawData.map((d) => d.disease));
  const countySet = new Set(rawData.map((d) => d.county));

  fillSelect("filter-disease", [...diseaseSet]);
  fillSelect("filter-county", [...countySet]);

  // Default: first disease
  state.disease = [...diseaseSet][0];

  d3.select("#filter-disease").on("change", (e) => {
    state.disease = e.target.value;
    computeAll();
  });
  d3.select("#filter-sex").on("change", (e) => {
    state.sex = e.target.value;
    computeAll();
  });
  d3.select("#filter-county").on("change", (e) => {
    const options = Array.from(e.target.selectedOptions, (o) => o.value);
    state.counties = new Set(options);
    computeAll();
  });
  d3.select("#filter-year").on("input", (e) => {
    state.yearMax = +e.target.value;
    d3.select("#year-range-label").text(`2005-${state.yearMax}`);
    computeAll();
  });

  /* Tab navigation */
  document.querySelectorAll("#tabs button").forEach((btn) =>
    btn.addEventListener("click", () => {
      const target = btn.getAttribute("aria-controls");
      document
        .querySelectorAll("#tabs button")
        .forEach((b) => b.setAttribute("aria-selected", false));
      btn.setAttribute("aria-selected", true);

      document
        .querySelectorAll(".tab-pane")
        .forEach((pane) => (pane.hidden = pane.id !== target));
    })
  );

  /* About modal */
  const aboutModal = document.getElementById("about-modal");
  document.getElementById("about-btn").onclick = () => aboutModal.showModal();
  document.getElementById("about-close").onclick = () => aboutModal.close();
}

/* Utility to fill a <select> */
function fillSelect(id, values) {
  const sel = d3.select("#" + id);
  sel.selectAll("option").remove();
  values.forEach((v) => sel.append("option").text(v).attr("value", v));
}

/* ===== 4. Master recompute / redraw ===== */
function computeAll() {
  const dataFiltered = filterData(rawData, state);
  updateKPIs(dataFiltered);
  drawTemporal(dataFiltered);
  drawGeo(dataFiltered);
  drawDemographics(dataFiltered);
  drawComparative(dataFiltered);
  drawProgress(dataFiltered);
  drawQuality(dataFiltered);
}

/* ===== 5. Data helpers (place-holders where heavy work happens) ===== */
function filterData(data, st) {
  return data.filter((d) => {
    const year = +d.year;
    if (year > st.yearMax) return false;
    if (st.disease && d.disease !== st.disease) return false;
    if (st.sex !== "All" && d.sex !== st.sex) return false;
    if (st.counties.size && !st.counties.has(d.county)) return false;
    return true;
  });
}

/* ---------- KPIs ---------- */
function updateKPIs(df) {
  // Placeholder aggregation – replace with precise formulas
  const total = d3.sum(df, (d) => +d.cases);
  d3.select("#kpi-total-cases .kpi-value").text(total.toLocaleString());

  const incidence = computeIncidence(df);
  d3.select("#kpi-incidence .kpi-value").text(incidence.toFixed(1));

  const { deltaAbs, deltaPct } = computeYTDDelta(df);
  d3.select("#kpi-ytd .kpi-value").text(
    `${deltaAbs >= 0 ? "▲" : "▼"} ${Math.abs(deltaAbs)} (${deltaPct.toFixed(
      1
    )} %)`
  );

  const medianAge = computeMedianAge(df);
  d3.select("#kpi-median-age .kpi-value").text(medianAge.toFixed(1));
}

/* ---------- Temporal Trends ---------- */
function drawTemporal(df) {
  // Annual line / area + 95 % CI ribbon + 3-yr MA toggle
  const yearly = d3.rollups(
    df,
    (v) => d3.sum(v, (d) => +d.cases),
    (d) => +d.year
  ).sort((a, b) => d3.ascending(a[0], b[0]));

  const years = yearly.map((d) => d[0]);
  const cases = yearly.map((d) => d[1]);

  const trace = {
    x: years,
    y: cases,
    mode: "lines",
    fill: "tozeroy",
    name: "Cases",
    hovertemplate: "%{y:,} cases (%{x})<extra></extra>",
  };

  const layout = {
    title: "Annual Cases",
    xaxis: { title: "Year" },
    yaxis: { title: "Cases" },
    margin: { t: 40, l: 50, r: 20, b: 40 },
  };

  Plotly.newPlot("trend-series", [trace], layout, { responsive: true });

  // TODO: add YoY % bars, CAGR tooltip, MA toggle & CI ribbon
}

/* ---------- Geographic Patterns ---------- */
function drawGeo(df) {
  // Choropleth map & ranking table
  // TODO: aggregate by county, join with geojson, render Plotly choropleth
}

/* ---------- Demographics ---------- */
function drawDemographics(df) {
  // TODO: sex ratio dumbbell / bar & %-of-total KPI tiles
}

/* ---------- Comparative ---------- */
function drawComparative(df) {
  // TODO: small multiples, scatter/bubble, heat-map
}

/* ---------- Progress & Quality ---------- */
function drawProgress(df) {
  // TODO: cumulative proportion line, cases averted bar
}
function drawQuality(df) {
  // TODO: reporting completeness gauge, possible data-error table
}

/* ===== 6. Statistical helpers (stubs) ===== */
function computeIncidence(df) {
  // Placeholder: assume df already includes population column
  const totalCases = d3.sum(df, (d) => +d.cases);
  const totalPop = d3.sum(df, (d) => +d.population);
  return (totalCases / totalPop) * 100_000;
}
function computeYTDDelta(df) {
  // Placeholder: implement exact YTD logic
  return { deltaAbs: 0, deltaPct: 0 };
}
function computeMedianAge(df) {
  const ages = df.map((d) => +d.age_at_dx).filter((v) => !Number.isNaN(v));
  ages.sort(d3.ascending);
  return d3.quantile(ages, 0.5);
}

/* ===== 7. CSV Download ===== */
document.getElementById("download-csv").onclick = () => {
  const blob = new Blob(
    [d3.csvFormat(filterData(rawData, state))],
    { type: "text/csv;charset=utf-8;" }
  );
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "ID-Cal-export.csv";
  a.style.display = "none";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};
