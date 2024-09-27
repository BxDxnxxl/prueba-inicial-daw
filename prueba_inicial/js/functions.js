//filtrar eventor por fecha
function getEventoByFecha(){
    const fechaInicio = document.getElementById("fechaInicio").value;
    const fechaFin = document.getElementById("fechaFin").value;
        $.ajax({
            type: "GET",
            url: "https://eonet.gsfc.nasa.gov/api/v3/events",
            dataType: "json",
            success: function (resultados) {
                const eventosFiltrados = resultados.events.filter(event => {
                    if (!event.geometry || event.geometry.length === 0) {
                        return false; // Ignora eventos sin geometrías
                    }
                    const fechaEvento = new Date(event.geometry[0].date);
                    return fechaEvento >= new Date(fechaInicio) && fechaEvento <= new Date(fechaFin);
                });
                
                mostrarResultadosFiltroFecha(eventosFiltrados);

            },
            error: function (xhr, status, error) {
                console.log("Error en la solicitud AJAX: " + error);
            }
        });
}


//pinta la tabla con la informacion obtenida de la funcion anterior
function mostrarResultadosFiltroFecha(events) {
    const resultadosDiv = document.getElementById("resultados");
    resultadosDiv.innerHTML = '';

    if (events.length === 0) {
        resultadosDiv.innerHTML = 'No se encontraron eventos en el rango de fechas seleccionado.';
        return;

    }

    events.forEach(event => {
        const eventoElemento = document.createElement("div");
        eventoElemento.innerHTML = `
             <table style="border-collapse: collapse; width: 100%; background-color: #f9f9f9;">
        <tr>
            <th style="border: 1px solid black; padding: 8px; width: 30%;">Título</th>
            <td style="border: 1px solid black; padding: 8px; width: 70%;">${event.title}</td>
        </tr>
        <tr>
            <th style="border: 1px solid black; padding: 8px; width: 30%;">Descripción</th>
            <td style="border: 1px solid black; padding: 8px; width: 70%;">${event.description}</td>
        </tr>
        <tr>
            <th style="border: 1px solid black; padding: 8px; width: 30%;">Fecha</th>
            <td style="border: 1px solid black; padding: 8px; width: 70%;">${event.geometry[0].date}</td>
        </tr>
    </table>
        `;
        resultadosDiv.appendChild(eventoElemento);
    });
}


//limpiar la tabla de la vista por si no quieres seguir viendola
function limpiarResultados() {
    const resultadosDiv = document.getElementById("resultados");
    resultadosDiv.innerHTML = ''; // Limpia el contenido del div
}


$(document).ready(function() {
    var map = L.map('map').setView([20, 0], 2);

    // Definir las capas base del mapa
    var baseMaps = {
        "OpenStreetMap": L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            maxZoom: 19,
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        }),
        "OpenTopoMap": L.tileLayer('https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png', {
            maxZoom: 17,
            attribution: 'Map data: &copy; <a href="https://www.opentopomap.org">OpenTopoMap</a>'
        }),
        "ESRI World Imagery": L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{x}/{y}', {
            maxZoom: 19,
            attribution: 'Tiles &copy; Esri &mdash; Source: Esri, USGS, NOAA'
        })
    };

    L.control.layers(baseMaps).addTo(map);

    // Definir los iconos
    var icons = {
        wildfires: L.icon({ iconUrl: '../img/fuego.png', iconSize: [16, 16] }),
        severeStorms: L.icon({ iconUrl: '../img/tormenta.png', iconSize: [16, 16] }),
        volcanoes: L.icon({ iconUrl: '../img/volcanoe.png', iconSize: [16, 16] }),
        seaLakeIce: L.icon({ iconUrl: '../img/ice.png', iconSize: [16, 16] })
    };

    // Cargar eventos y configurar el mapa
    loadEvents();
    setupCheckboxListeners();

    function loadEvents() {
        // Limpiar marcadores previos
        map.eachLayer(function(layer) {
            if (layer instanceof L.Marker) {
                map.removeLayer(layer);
            }
        });

        $.getJSON("https://eonet.gsfc.nasa.gov/api/v3/events", function(data) {
            data.events.forEach(event => {
                let coordinates = event.geometry[0].coordinates;
                let eventType = event.categories[0].id;
                let icon = icons[eventType];

                if (icon && document.getElementById(eventType).checked) {
                    console.log(eventType);
                    L.marker([coordinates[1], coordinates[0]], { icon: icon })
                        .addTo(map)
                        .bindPopup(`<b>${event.title}</b><br>${event.description || 'No description available'}<br>`);
                }
            });
        });
    }

    //coge todos los iconos y por cada evento detecta los cambios y 
    //actualiza el mapa con los iconos que debe de haber, ya sea eliminando o añadiendo
    function setupCheckboxListeners() {
        Object.keys(icons).forEach(eventType => {
            document.getElementById(eventType).addEventListener('change', loadEvents);
        });
    }

    // conseguir coordenadas con un click
    map.on('click', function(e) {
        var lat = e.latlng.lat;
        var lng = e.latlng.lng;
        llamadaApi = `http://api.weatherapi.com/v1/current.json?key=fdd3f3de45534618a86131555242309&q=${lat},${lng}`
        
        $.ajax({
            type: "GET",
            url: llamadaApi,
            dataType: "json",
            success: function (resultados) {
                var iconInfo = L.icon({
                    iconUrl: '../img/termometro.png', 
                    iconSize: [25, 25],
                });
                let iconTemperature = iconInfo
                L.marker([lat, lng], {iconTemperature: iconTemperature})
                .addTo(map)
                .bindPopup(`<b>${resultados.location.region}</b><br><b>${resultados.location.name}</b><br> Temperatura: ${resultados.current.temp_c} grados</b><br>Intensidad del viento: ${resultados.current.wind_kph}km/h`); 
            },
            error: function (xhr, status, error) {
                console.log("Error en la solicitud AJAX: " + error);
            }
        });
    });
});


//pone el mapa en 3d
document.addEventListener("DOMContentLoaded", function() {

    Cesium.Ion.defaultAccessToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqdGkiOiJkZjVhNzE3ZS1mMDRkLTQwMzYtYWU3NC0yY2JmNDdlYjAzYjMiLCJpZCI6MjQzNzQ1LCJpYXQiOjE3MjcxODQ1Njd9.dRBuHGiXU-zXCi6Y1URbDf5mvQWQJrketle6Cs2rE8c';

    var viewer = new Cesium.Viewer('cesiumContainer', {
        animation: false,   
        baseLayerPicker: false,
        fullscreenButton: false,
        homeButton: false,
        infoBox: false,
        sceneModePicker: false,
        timeline: false,
    });

    viewer.entities.add({
        position: Cesium.Cartesian3.fromDegrees(41.3717, 0.5313),
        point: {
            pixelSize: 15,
            outlineWidth: 2
        }
    });

    var height = 20000000;
    viewer.camera.setView({
        destination: Cesium.Cartesian3.fromDegrees(-15.5845400, 28.1375500, height)
    });
});
