const map = new maplibregl.Map({
    container: 'map',
    style: 'https://gsi-cyberjapan.github.io/gsivectortile-mapbox-gl-js/pale.json',
    center: [140.09326457924092, 39.72685467419477],
    zoom: 8
});

document.getElementById("fileInput").addEventListener("change", function (e) {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();

    reader.onload = function (event) {
        const csvText = event.target.result;

        // CSV パース
        const data = Papa.parse(csvText, { header: true }).data;

        // ツキノワグマだけ抽出
        const filtered = data.filter(row => row["獣種"] && row["獣種"].trim() === "ツキノワグマ");

        // GeoJSON へ変換
        const geojson = {
            type: "FeatureCollection",
            features: filtered.map(row => ({
                type: "Feature",
                geometry: {
                    type: "Point",
                    coordinates: [
                        parseFloat(row["y(経度)"]),
                        parseFloat(row["x(緯度)"])
                    ]
                },
                properties: row
            }))
        };

        // MapLibre に追加
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
                    "circle-radius": 3,
                    "circle-color": "#ff0000",
                    "circle-stroke-width": 1,
                    "circle-stroke-color": "#ffffff"
                }
            });
        }
    };

    reader.readAsText(file, "UTF-8");
});
