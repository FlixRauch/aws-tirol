/* Wetterstationen Tirol Beispiel */

let innsbruck = {
    lat: 47.267222,
    lng: 11.392778,
    zoom: 11
};

// WMTS Hintergrundlayer von https://lawinen.report (CC BY avalanche.report) als Startlayer
let startLayer = L.tileLayer("https://static.avalanche.report/tms/{z}/{x}/{y}.webp", {
    attribution: '&copy; <a href="https://lawinen.report">CC BY avalanche.report</a>'
})

// Overlays Objekt für die thematischen Layer
let overlays = {
    stations: L.featureGroup(),
    temperature: L.featureGroup(),
    humidity: L.featureGroup(),
    snowheight: L.featureGroup(),
    wind: L.featureGroup(),
};

// Karte initialisieren
let map = L.map("map", {
    center: [innsbruck.lat, innsbruck.lng],
    zoom: innsbruck.zoom,
    layers: [
        startLayer
    ],
});

// Layer control mit WMTS Hintergründen und Overlays
let layerControl = L.control.layers({
    "Relief avalanche.report": startLayer,
    "Esri World Imagery": L.tileLayer.provider("Esri.WorldImagery"),
}, {
    "Wetterstationen": overlays.stations,
    "Temperatur": overlays.temperature,
    "Relative Luftfeuchte": overlays.humidity,
    "Schneehöhe": overlays.snowheight,
    "Wind": overlays.wind
}).addTo(map);

// Layer control ausklappen
layerControl.expand();

// Maßstab control
L.control.scale({
    imperial: false
}).addTo(map);

// Fullscreen control
L.control.fullscreen().addTo(map);

// Wetterstationslayer beim Laden anzeigen
overlays.temperature.addTo(map);

let getColor = function(value,ramp) {
    for (let rule of ramp){
        if(value >= rule.min && value < rule.max) {
            return rule.color
        }
    }
}

let drawStations = function(geojson) {
    L.geoJSON(geojson, {
        pointToLayer: function (geoJsonPoint, latlng) {
            //Popup erstellen
            let windkmh = geoJsonPoint.properties.HS*3.6
            //let deg = geoJsonPoint.properties.WR
            let popup = `
            <strong>${geoJsonPoint.properties.name}</strong> (${geoJsonPoint.geometry.coordinates[2]}m)<br>
            Lufttemperatur(°C): ${geoJsonPoint.properties.LT}<br>
            Schneehöhe(cm): ${geoJsonPoint.properties.HS}<br>
            Windgeschwindgkeit(km/h): ${windkmh.toFixed(1)}<br>
            Windrichtung(°): ${geoJsonPoint.properties.WR}<br>
            Relative Luftfeuchte(%): ${geoJsonPoint.properties.RH}<br>
            `;
            //Erstellung von Marker
            return L.marker(latlng, {
                icon: L.icon({
                    iconUrl: `icons/wifi.png`,
                    iconAnchor: [16, 37],//Marker an die richtige Stelle binden
                    popupAnchor: [0, -37]
                })
            }).bindPopup(popup);
        }
    }).addTo(overlays.stations);//Marker und Popup zu Objekt mit Stations hinzufügen
}

let drawTemperature = function(geojson) {
    L.geoJSON(geojson, {
        filter: function(geoJsonPoint) {
            if (geoJsonPoint.properties.LT > -50 && geoJsonPoint.properties.LT < 50) {
                return true 
            }
        },
        pointToLayer: function (geoJsonPoint, latlng) {
            //Popup erstellen
            let popup = `
            <strong>${geoJsonPoint.properties.name}</strong> (${geoJsonPoint.geometry.coordinates[2]}m)
            `;
            //Erstellung von Marker
            let color = getColor(
                geoJsonPoint.properties.LT,
                COLORS.temperature
            )
            
            return L.marker(latlng, {
                icon: L.divIcon({
                    className: "aws-div-icon",
                    html: `<span style="background-color:${color}">${geoJsonPoint.properties.LT.toFixed(1)}</span>`
                })
            }).bindPopup(popup);
        }
    }).addTo(overlays.temperature);//Marker und Popup zu Objekt mit Stations hinzufügen
}

let drawSnowheight = function(geojson) {
    L.geoJSON(geojson, {
        filter: function(geoJsonPoint) {
            if (geoJsonPoint.properties.HS >0 && geoJsonPoint.properties.HS < 1000) {
                return true 
            }
        },
        pointToLayer: function (geoJsonPoint, latlng) {
            //Popup erstellen
            let popup = `
            <strong>${geoJsonPoint.properties.name}</strong> (${geoJsonPoint.geometry.coordinates[2]}m)
            `;
            //Erstellung von Marker
            let color = getColor(
                geoJsonPoint.properties.HS,
                COLORS.snowheight
            )
            
            return L.marker(latlng, {
                icon: L.divIcon({
                    className: "aws-div-icon",
                    html: `<span style="background-color:${color}">${geoJsonPoint.properties.HS.toFixed(1)}</span>`
                })
            }).bindPopup(popup);
        }
    }).addTo(overlays.snowheight);//Marker und Popup zu Objekt mit Stations hinzufügen
}

let drawWind = function(geojson) {
    L.geoJSON(geojson, {
        filter: function(geoJsonPoint) {
            if (geoJsonPoint.properties.WG >0 && geoJsonPoint.properties.WG < 300 && geoJsonPoint.properties.WR <= 360) {
                return true 
            }
        },
        pointToLayer: function (geoJsonPoint, latlng) {
            //Popup erstellen
            let popup = `
            <strong>${geoJsonPoint.properties.name}</strong> (${geoJsonPoint.geometry.coordinates[2]}m)
            `;
            //Erstellung von Marker
            let color = getColor(
                geoJsonPoint.properties.WG,
                COLORS.windSpeed
            )
            
            let deg = geoJsonPoint.properties.WR

            return L.marker(latlng, {
                icon: L.divIcon({
                    className: "aws-div-icon",
                    html: `<span style="background-color:${color}; transform: rotate(${deg}deg)"><i class="fa-solid fa-circle-arrow-up"></i>${geoJsonPoint.properties.WG.toFixed(1)}</span>`
                })
            }).bindPopup(popup);
        }
    }).addTo(overlays.wind);//Marker und Popup zu Objekt mit Stations hinzufügen
}

let drawHumidity = function(geojson) {
    L.geoJSON(geojson, {
        filter: function(geoJsonPoint) {
            if (geoJsonPoint.properties.RH >0 && geoJsonPoint.properties.RH < 101) {
                return true 
            }
        },
        pointToLayer: function (geoJsonPoint, latlng) {
            //Popup erstellen
            let popup = `
            <strong>${geoJsonPoint.properties.name}</strong> (${geoJsonPoint.geometry.coordinates[2]}m)
            `;
            //Erstellung von Marker
            let color = getColor(
                geoJsonPoint.properties.RH,
                COLORS.humidity
            )
            
            return L.marker(latlng, {
                icon: L.divIcon({
                    className: "aws-div-icon",
                    html: `<span style="background-color:${color}">${geoJsonPoint.properties.RH.toFixed(1)}</span>`
                })
            }).bindPopup(popup);
        }
    }).addTo(overlays.humidity);//Marker und Popup zu Objekt mit Stations hinzufügen
}

// Wetterstationen
async function loadData(url) {
    let response = await fetch(url);
    let geojson = await response.json();
    
    drawStations(geojson);
    drawTemperature(geojson);
    drawSnowheight(geojson);
    drawWind(geojson);
    drawHumidity(geojson);
    
}

loadData("https://static.avalanche.report/weather_stations/stations.geojson");