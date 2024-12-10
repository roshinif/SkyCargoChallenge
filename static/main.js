document.addEventListener('DOMContentLoaded', async () => {
    // Airport Data
    const airports = [
        { id: 1, code: "LEMD", name: "Adolfo Suárez Madrid–Barajas Airport", lat: 40.471926, lon: -3.56264 },
        { id: 2, code: "LEAL", name: "Alicante-Elche Miguel Hernández Airport", lat: 38.2822, lon: -0.558156 },
        { id: 3, code: "EHAM", name: "Amsterdam Airport Schiphol", lat: 52.308601, lon: 4.76389 },
        { id: 4, code: "EGAA", name: "Belfast International Airport", lat: 54.657501, lon: -6.215829 },
        { id: 5, code: "LYBE", name: "Belgrade Nikola Tesla Airport", lat: 44.818401, lon: 20.3091 },
        { id: 6, code: "ENBR", name: "Bergen Airport, Flesland", lat: 60.2934, lon: 5.21814 },
        { id: 7, code: "EDDB", name: "Berlin Brandenburg Airport", lat: 52.351389, lon: 13.493889 },
        { id: 8, code: "EKBI", name: "Billund Airport", lat: 55.740299, lon: 9.15178 },
        { id: 9, code: "EGBB", name: "Birmingham International Airport", lat: 52.453899, lon: -1.748029 },
        { id: 10, code: "LIPE", name: "Bologna Guglielmo Marconi Airport", lat: 44.5354, lon: 11.2887 }
    ];

    // Get player_id from URL
    const params = new URLSearchParams(window.location.search);
    const playerId = params.get('player_id');

    if (!playerId) {
        alert('Player ID is missing!');
        window.location.href = '/';
        return;
    }

    // Fetch player data from the backend
    let playerData;
    try {
        const response = await fetch(`/player/${playerId}`);
        playerData = await response.json();

        if (playerData.error) {
            alert('Error fetching player data: ' + playerData.error);
            window.location.href = '/';
            return;
        }

        // Update the display panel with player data
        document.getElementById('player-name').textContent = playerData.name;
        document.getElementById('current-airport').textContent = playerData.current_airport;
        document.getElementById('fuel-level').textContent = playerData.fuel;
        document.getElementById('money-balance').textContent = playerData.money;
        document.getElementById('cargo-collected').textContent = playerData.cargo_collected;
    } catch (error) {
        console.error('Error fetching player data:', error);
        alert('Could not fetch player data.');
        window.location.href = '/';
        return;
    }

    // Initialize Map
    const map = L.map('map').setView([50.0, 10.0], 6); // Centered over Europe
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors'
    }).addTo(map);

    // Add Markers for Airports
    airports.forEach(airport => {
        L.marker([airport.lat, airport.lon]).addTo(map)
            .bindPopup(`<b>${airport.name}</b><br>Code: ${airport.code}`);
    });

    // Player Location Indicator
    let playerMarker = null;

    const updatePlayerLocation = (lat, lon) => {
        if (playerMarker) {
            map.removeLayer(playerMarker); // Remove previous marker
        }
        playerMarker = L.marker([lat, lon], {
            icon: L.icon({
                iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
                iconSize: [25, 41],
                iconAnchor: [12, 41],
                popupAnchor: [1, -34],
            })
        }).addTo(map)
            .bindPopup('Player\'s Current Location')
            .openPopup();
        map.setView([lat, lon], 6); // Center map on the player's location
    };

    // Initialize Player's Location
    const currentAirport = airports.find(airport => airport.code === playerData.current_airport) || airports[0];
    updatePlayerLocation(currentAirport.lat, currentAirport.lon);

    // Populate Dropdown with Airports
    const airportSelect = document.getElementById('airport-select');
    airports.forEach(airport => {
        const option = document.createElement('option');
        option.value = airport.code;
        option.textContent = airport.name;
        airportSelect.appendChild(option);
    });

    // Travel Action
    window.travel = async () => {
        const selectedCode = airportSelect.value;
        const selectedAirport = airports.find(airport => airport.code === selectedCode);

        if (!selectedAirport) {
            alert('Invalid airport selection!');
            return;
        }

        // Backend integration to process travel
        try {
            const response = await fetch('/travel', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    player_id: playerId,
                    destination: selectedCode
                })
            });

            const data = await response.json();
            if (data.error) {
                alert('Error traveling: ' + data.error);
                return;
            }

            alert(`Traveled to: ${selectedAirport.name}`);
            updatePlayerLocation(selectedAirport.lat, selectedAirport.lon); // Update map indicator

            // Update current airport in the display panel
            document.getElementById('current-airport').textContent = selectedCode;
        } catch (error) {
            console.error('Error during travel:', error);
            alert('Could not process travel.');
        }
    };
});
