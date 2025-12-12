let originalData = null;

const map = new maplibregl.Map({
    container: 'map',
    style: 'https://gsi-cyberjapan.github.io/gsivectortile-mapbox-gl-js/pale.json',
    center: [140.09326457924092, 39.72685467419477],
    zoom: 8
});

// 各年を表示するかどうか管理
let yearVisible = {
    2021: true,
    2022: true,
    2023: true,
    2024: true,
    2025: true
};

// -------------------------
// 年ごとの色
// -------------------------
const yearColors = {
    2021: "#4285F4",
    2022: "#0F9D58",
    2023: "#F4B400",
    2024: "#F57C00",
    2025: "#DB4437"
};

// -------------------------
// チェックボックス式の凡例
// -------------------------
const legendDiv = document.getElementById("legend");

Object.keys(yearColors).forEach(year => {
    const item = document.createElement("div");
    item.className = "legend-item";

    // チェックボックス
    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.checked = true;
    checkbox.dataset.year = year;

    // 色ボックス
    const colorBox = document.createElement("span");
    colorBox.className = "legend-color";
    colorBox.style.backgroundColor = yearColors[year];

    // ラベル（年）
    const label = document.createElement("span");
    label.textContent = year;

    // チェックで ON/OFF
    checkbox.addEventListener("change", () => {
        yearVisible[year] = checkbox.checked;
        applyFilters();
    });

    item.appendChild(checkbox);
    item.appendChild(colorBox);
    item.appendChild(label);
    legendDiv.appendChild(item);
});

// -------------------------
// CSV読込
// -------------------------
document.getElementById("fileInput").addEventListener("change", function (e) {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function (event) {
        const csvText = event.target.result;
        originalData = Papa.parse(csvText, { header: true }).data;

        updateMap();
    };
    reader.readAsText(file, "UTF-8");
});

// -------------------------
// マップ更新
// -------------------------
function updateMap() {
    if (!originalData) return;

    const geojson = {
        type: "FeatureCollection",
        features: originalData
            .filter(row => {
                if (!row["獣種"] || !row["目撃日時"]) return false;
                return row["獣種"].trim() === "ツキノワグマ";
            })
            .map(row => {
            const dt = new Date(row["目撃日時"]);
            const y = dt.getFullYear();

                return {
                    type: "Feature",
                    geometry: {
                        type: "Point",
                        coordinates: [
                            parseFloat(row["y(経度)"]),
                            parseFloat(row["x(緯度)"])
                        ]
                    },
                    properties: {
                        ...row,
                        year: y
                    }
                };
            })
    };

    if (map.getSource("bear_points")) {
        map.getSource("bear_points").setData(geojson);
    } else {
        map.addSource("bear_points", {
            type: "geojson",
            data: geojson
        });

        map.addLayer({
            id: "bear-layer",
            type: "circle",
            source: "bear_points",
            paint: {
                "circle-radius": 4,
                "circle-stroke-width": 1,
                "circle-stroke-color": "#ffffff",
                "circle-color": [
                    "match",
                    ["get", "year"],
                    2021, "#4285F4",
                    2022, "#0F9D58",
                    2023, "#F4B400",
                    2024, "#F57C00",
                    2025, "#DB4437",
                    "#999999"
                ]
            }
        });
    }

    // フィルタ適用
    applyFilters();
}

// -------------------------
// 年フィルタを適用
// -------------------------
function applyFilters() {
    if (!map.getLayer("bear-layer")) return;

    const activeYears = Object.keys(yearVisible)
        .filter(y => yearVisible[y])
        .map(y => parseInt(y));

    const filter = ["in", ["get", "year"], ["literal", activeYears]];

    map.setFilter("bear-layer", filter);
}