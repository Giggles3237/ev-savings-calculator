let vehicleData = [];

document.addEventListener('DOMContentLoaded', () => {
    $('.select2').select2({
        theme: 'classic',
        placeholder: 'Select an option',
        allowClear: true
    });

    fetch('vehiclesMedium.json')
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok ' + response.statusText);
            }
            return response.json();
        })
        .then(data => {
            vehicleData = data;
            populateYearOptions();
        })
        .catch(error => {
            console.error("Failed to load vehicle data:", error);
            showError('Failed to load vehicle data. Please try again later.');
        });
});

function populateYearOptions() {
    const years = [...new Set(vehicleData.map(vehicle => vehicle.year))].sort((a, b) => a - b);
    
    ['current', 'intended'].forEach(prefix => {
        const yearSelect = document.getElementById(`${prefix}VehicleYear`);
        yearSelect.innerHTML = '<option></option>';
        years.forEach(year => {
            const option = document.createElement('option');
            option.value = year;
            option.textContent = year;
            yearSelect.appendChild(option);
        });
    });

    document.getElementById('loading').classList.add('hidden');
    document.getElementById('savingsForm').classList.remove('hidden');
}

function populateMakes(prefix) {
    const selectedYear = document.getElementById(`${prefix}VehicleYear`).value;
    const makeSelect = document.getElementById(`${prefix}VehicleMake`);
    let makes;
    
    if (prefix === 'current') {
        // Filter out electric vehicles for current vehicle selection
        makes = [...new Set(vehicleData.filter(vehicle => 
            vehicle.year == selectedYear && 
            vehicle.fuelType1 !== 'Electricity' &&
            vehicle.fuelType2 !== 'Electricity'
        ).map(vehicle => vehicle.make))].sort();
    } else {
        // Only show electric vehicles for intended vehicle selection
        makes = [...new Set(vehicleData.filter(vehicle => 
            vehicle.year == selectedYear && 
            (vehicle.fuelType1 === 'Electricity' || vehicle.fuelType2 === 'Electricity')
        ).map(vehicle => vehicle.make))].sort();
    }
    
    makeSelect.innerHTML = '<option></option>';
    makes.forEach(make => {
        const option = document.createElement('option');
        option.value = make;
        option.textContent = make;
        makeSelect.appendChild(option);
    });

    $(`#${prefix}VehicleMake`).val(null).trigger('change');
    $(`#${prefix}VehicleModel`).val(null).trigger('change');
}

function populateModels(prefix) {
    const selectedYear = document.getElementById(`${prefix}VehicleYear`).value;
    const selectedMake = document.getElementById(`${prefix}VehicleMake`).value;
    const modelSelect = document.getElementById(`${prefix}VehicleModel`);
    
    if (!selectedYear || !selectedMake) {
        modelSelect.innerHTML = '<option>Select Year and Make First</option>';
        return;
    }

    let models;
    if (prefix === 'current') {
        // Filter out electric vehicles for current vehicle selection
        models = vehicleData.filter(vehicle => 
            vehicle.year == selectedYear && 
            vehicle.make == selectedMake && 
            vehicle.fuelType1 !== 'Electricity' &&
            vehicle.fuelType2 !== 'Electricity'
        ).map(vehicle => vehicle.model).sort();
    } else {
        // Only show electric vehicles for intended vehicle selection
        models = vehicleData.filter(vehicle => 
            vehicle.year == selectedYear && 
            vehicle.make == selectedMake && 
            (vehicle.fuelType1 === 'Electricity' || vehicle.fuelType2 === 'Electricity')
        ).map(vehicle => vehicle.model).sort();
    }
    
    modelSelect.innerHTML = '<option></option>';
    models.forEach(model => {
        const option = document.createElement('option');
        option.value = model;
        option.textContent = model;
        modelSelect.appendChild(option);
    });
}

function updateCityHighwayRatioLabel(value) {
    document.getElementById('cityHighwayRatioLabel').textContent = value;
}

document.getElementById('calculateButton').addEventListener('click', calculateSavings);

function showError(message) {
    const errorDiv = document.createElement('div');
    errorDiv.className = 'bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative';
    errorDiv.role = 'alert';
    errorDiv.innerHTML = `
        <strong class="font-bold">Error!</strong>
        <span class="block sm:inline">${message}</span>
    `;
    document.getElementById('results').innerHTML = '';
    document.getElementById('results').appendChild(errorDiv);
}

function calculateSavings() {
    const currentVehicle = getSelectedVehicle('current');
    const intendedVehicle = getSelectedVehicle('intended');
    const annualMileage = parseFloat(document.getElementById('annualMileage').value);
    const fuelPrice = parseFloat(document.getElementById('fuelPrice').value);
    const electricityCost = parseFloat(document.getElementById('electricityCost').value);
    const cityHighwayRatio = parseFloat(document.getElementById('cityHighwayRatio').value) / 100;

    if (!currentVehicle || !intendedVehicle || isNaN(annualMileage) || isNaN(fuelPrice) || isNaN(electricityCost)) {
        showError('Please fill in all fields with valid numbers.');
        return;
    }

    const annualCityMileage = annualMileage * cityHighwayRatio;
    const annualHighwayMileage = annualMileage * (1 - cityHighwayRatio);

    const annualFuelCost = ((annualCityMileage / currentVehicle.city08) + (annualHighwayMileage / currentVehicle.highway08)) * fuelPrice;
    const annualElectricityCost = ((annualCityMileage * intendedVehicle.cityE) + (annualHighwayMileage * intendedVehicle.highwayE)) * electricityCost/100;

    const savings = annualFuelCost - annualElectricityCost;
    const monthlySavings = savings / 12;
    const co2Savings = Math.round((currentVehicle.co2 * annualMileage / currentVehicle.comb08) - (intendedVehicle.co2 * annualMileage / intendedVehicle.comb08));
    const formattedCO2Savings = Math.abs(co2Savings) >= 1000000 ? co2Savings.toExponential(2) : Math.round(co2Savings);

    document.getElementById('results').innerHTML = `
        <div class="bg-green-100 p-6 rounded-lg shadow-md">
    <h2 class="text-2xl font-bold text-green-800 mb-4">Estimated Savings Summary</h2>
    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
            <h3 class="text-xl font-semibold text-green-700 mb-2">Annual Savings</h3>
            <p class="text-3xl font-bold text-green-600 mb-2">$${savings.toFixed(2)}</p>
            <p class="text-lg text-green-700">($${monthlySavings.toFixed(2)} per month)</p>
        </div>
        <div>
            <h3 class="text-xl font-semibold text-green-700 mb-2">Environmental Impact</h3>
            <p class="text-lg font-bold text-green-600">CO2 Emissions Reduction:</p>
            <p class="text-2xl font-bold text-green-600">${co2Savings} kg/year</p>
        </div>
    </div>
    <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
        <div>
            <h3 class="text-xl font-semibold text-blue-700 mb-2">Current Vehicle</h3>
            <p class="text-lg text-gray-700">${currentVehicle.year} ${currentVehicle.make} ${currentVehicle.model}</p>
            <p class="text-md text-gray-600">${currentVehicle.cylinders} cylinders, ${currentVehicle.displ}L ${currentVehicle.fuelType1}</p>
            <p class="font-semibold text-gray-700 mt-2">Fuel Economy:</p>
            <p class="text-md text-gray-600">City: ${currentVehicle.city08} mpg</p>
            <p class="text-md text-gray-600">Highway: ${currentVehicle.highway08} mpg</p>
            <p class="text-md text-gray-600">Combined: ${currentVehicle.comb08} mpg</p>
            <p class="font-semibold text-gray-700 mt-2">Annual Fuel Cost:</p>
            <p class="text-xl font-bold text-red-600">$${annualFuelCost.toFixed(2)}</p>
        </div>
        <div>
            <h3 class="text-xl font-semibold text-blue-700 mb-2">Electric Vehicle</h3>
            <p class="text-lg text-gray-700">${intendedVehicle.year} ${intendedVehicle.make} ${intendedVehicle.model}</p>
            <p class="text-md text-gray-600">${intendedVehicle.cylinders || 'N/A'} cylinders, ${intendedVehicle.displ || 'N/A'}L Electric</p>
            <p class="font-semibold text-gray-700 mt-2">Energy Efficiency:</p>
            <p class="text-md text-gray-600">City: ${intendedVehicle.cityE || intendedVehicle.city08} MPGe</p>
            <p class="text-md text-gray-600">Highway: ${intendedVehicle.highwayE || intendedVehicle.highway08} MPGe</p>
            <p class="text-md text-gray-600">Combined: ${intendedVehicle.combE || intendedVehicle.comb08} MPGe</p>
            <p class="font-semibold text-gray-700 mt-2">Annual Electricity Cost:</p>
            <p class="text-xl font-bold text-blue-600">$${annualElectricityCost.toFixed(2)}</p>
        </div>
    </div>
    <div class="mt-6">
        <h3 class="text-xl font-semibold text-blue-700 mb-2">Calculation Details</h3>
        <p class="text-md text-gray-600">Annual Mileage: ${annualMileage.toFixed(0)} miles</p>
        <p class="text-md text-gray-600">City Driving: ${(cityHighwayRatio * 100).toFixed(0)}%</p>
        <p class="text-md text-gray-600">Highway Driving: ${((1 - cityHighwayRatio) * 100).toFixed(0)}%</p>
        <p class="text-md text-gray-600">Current Fuel Price: $${fuelPrice.toFixed(2)}/gallon</p>
        <p class="text-md text-gray-600">Electricity Cost: $${electricityCost.toFixed(2)}/kWh</p>
    </div>
</div>
    `;
}

function getSelectedVehicle(prefix) {
    const year = document.getElementById(`${prefix}VehicleYear`).value;
    const make = document.getElementById(`${prefix}VehicleMake`).value;
    const model = document.getElementById(`${prefix}VehicleModel`).value;
    return vehicleData.find(v => v.year == year && v.make == make && v.model == model);
}
