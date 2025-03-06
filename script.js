$(document).ready(function() {
// Initially disable buttons
$("#downloadJson").prop("disabled", true);
$("#downloadExcel").addClass("disabled");

// Show loader
$("#loader").show();

// Global variables for table data
var allTableData = [];
var filteredTableData = [];

// Mapping objects for names (from codes)
var stateMapping = {};    // key: state code (col B), value: state name (col E) for state rows
var districtMapping = {}; // key: district code (col C), value: district name (col E) for district rows

// Function to initialize DataTable with pagination size 20
function initializeDataTable() {
    $("#resultTable").DataTable({
    "order": [[ 1, "desc" ]],
    "pageLength": 20,
    "columnDefs": [
        { "type": "num", "targets": [1, 2, 4, 7, 8] }
    ]
    });
}

// Function to populate the table based on area type and district filter (if applicable)
function populateTable(filterTypes) {
    if ($.fn.DataTable.isDataTable('#resultTable')) {
    $('#resultTable').DataTable().destroy();
    }
    $("#resultTable tbody").empty();
    
    // Filter data by area types.
    filteredTableData = allTableData.filter(function(item) {
    return filterTypes.indexOf(item.type) !== -1;
    });
    
    // If only Subdistrict is selected and district filter is visible, filter further.
    if (filterTypes.length === 1 && filterTypes[0] === "Subdistrict" && $("#districtFilterContainer").is(":visible")) {
    var selectedDistrict = $("#districtFilter").val();
    if (selectedDistrict && selectedDistrict !== "All") {
        filteredTableData = filteredTableData.filter(function(item) {
        return item.districtName === selectedDistrict;
        });
    }
    }
    
    // Append rows for each filtered item. Area name is clickable.
    filteredTableData.forEach(function(item, index) {
    var rowHtml = "<tr>" +
        "<td><a href='#' class='area-info' data-index='" + index + "'>" + item.area + "</a></td>" +
        "<td>" + item.population + "</td>" +
        "<td>" + item.languagesCount + "</td>" +
        "<td>" + item.L1 + "</td>" +
        "<td>" + item.L1Count + "</td>" +
        "<td>" + item.L1Percent + "%</td>" +
        "<td>" + item.L2 + "</td>" +
        "<td>" + item.L2Count + "</td>" +
        "<td>" + item.L2Percent + "%</td>" +
        "</tr>";
    $("#resultTable tbody").append(rowHtml);
    });
    initializeDataTable();
}

// Function to populate the district filter with unique district names from subdistrict rows.
function populateDistrictFilter() {
    var districtSet = new Set();
    allTableData.forEach(function(item) {
    if (item.type === "Subdistrict") {
        districtSet.add(item.districtName);
    }
    });
    var districtArr = Array.from(districtSet).sort();
    var optionsHtml = "<option value='All'>All</option>";
    districtArr.forEach(function(district) {
    optionsHtml += "<option value='" + district + "'>" + district + "</option>";
    });
    $("#districtFilter").html(optionsHtml);
}

// When area type multi-select changes.
$("#areaFilter").change(function() {
    var selected = $(this).val() || [];
    if (selected.length === 1 && selected[0] === "Subdistrict") {
    $("#districtFilterContainer").show();
    populateDistrictFilter();
    } else {
    $("#districtFilterContainer").hide();
    $("#districtFilter").val("All");
    }
    populateTable(selected);
});

// When district filter changes.
$("#districtFilter").change(function() {
    var selectedAreaTypes = $("#areaFilter").val() || [];
    populateTable(selectedAreaTypes);
});

// Path to the Excel file.
var url = "DDW-C16-STMT-MDDS-2100.XLSX";
var oReq = new XMLHttpRequest();
oReq.open("GET", url, true);
oReq.responseType = "arraybuffer";
oReq.onload = function(e) {
    var arraybuffer = oReq.response;
    var data = new Uint8Array(arraybuffer);
    var workbook = XLSX.read(data, {type:"array"});
    var firstSheetName = workbook.SheetNames[0];
    var worksheet = workbook.Sheets[firstSheetName];
    var jsonData = XLSX.utils.sheet_to_json(worksheet, {header: 1});
    
    // Group rows by area name.
    var results = {}; 
    for (var i = 1; i < jsonData.length; i++) {
        var row = jsonData[i];
        // Expected columns:
        // Col B (index 1): State Code
        // Col C (index 2): District Code
        // Col D (index 3): Subdistrict Code
        // Col E (index 4): Area Name
        // Col G (index 6): Mother Tongue (with a numeric prefix)
        // Col H (index 7): Count
        var stateCode = row[1] || "";
        var districtCode = row[2] ? row[2].toString() : "";
        var subdistrictCode = row[3] ? row[3].toString() : "";
        var areaName = row[4];
        var languageRaw = row[6];
        var count = parseInt(row[7]) || 0;
        
        if (!areaName || !languageRaw) continue;
        
        // Determine area type.
        var areaType = "";
        if(districtCode === "000" && subdistrictCode === "00000") {
        areaType = "State";
        } else if(subdistrictCode === "00000") {
        areaType = "District";
        } else {
        areaType = "Subdistrict";
        }
        
        // Build mappings for names.
        if(areaType === "State") {
        stateMapping[stateCode] = areaName;
        }
        if(areaType === "District") {
        districtMapping[districtCode] = areaName;
        }
        
        // Only include rows where language starts with a digit and doesn't contain "Others"
        if (!/^\d/.test(languageRaw) || languageRaw.toLowerCase().indexOf("others") !== -1) {
        continue;
        }
        
        // Remove numeric prefix.
        var langMatch = languageRaw.match(/^\d+\s+(.*)/);
        var language = langMatch ? langMatch[1].trim() : languageRaw.trim();
        
        if (!results[areaName]) {
        results[areaName] = {
            totalPopulation: 0,
            languages: {},
            type: areaType,
            stateCode: stateCode,
            districtCode: districtCode
        };
        }
        results[areaName].totalPopulation += count;
        if (results[areaName].languages[language]) {
        results[areaName].languages[language] += count;
        } else {
        results[areaName].languages[language] = count;
        }
    }
    
    // Build final table data.
    allTableData = [];
    for (var area in results) {
        var areaData = results[area];
        var totalPopulation = areaData.totalPopulation;
        var languages = areaData.languages;
        var languagesCount = Object.keys(languages).length;
        var sortedLang = Object.keys(languages).sort(function(a, b) {
        return languages[b] - languages[a];
        });
        var L1 = sortedLang[0] || "";
        var L1Count = languages[L1] || 0;
        var L1Percent = totalPopulation ? ((L1Count / totalPopulation) * 100).toFixed(2) : "0.00";
        var L2 = sortedLang[1] || "";
        var L2Count = languages[L2] || 0;
        var L2Percent = totalPopulation ? ((L2Count / totalPopulation) * 100).toFixed(2) : "0.00";
        
        var dispStateName = "";
        var dispDistrictName = "";
        if(areaData.type === "State") {
        dispStateName = area;
        dispDistrictName = "N/A";
        } else if(areaData.type === "District") {
        dispStateName = stateMapping[areaData.stateCode] || areaData.stateCode;
        dispDistrictName = area;
        } else {
        dispStateName = stateMapping[areaData.stateCode] || areaData.stateCode;
        dispDistrictName = districtMapping[areaData.districtCode] || areaData.districtCode;
        }
        
        allTableData.push({
        area: area,
        population: totalPopulation,
        languagesCount: languagesCount,
        L1: L1,
        L1Count: L1Count,
        L1Percent: L1Percent,
        L2: L2,
        L2Count: L2Count,
        L2Percent: L2Percent,
        type: areaData.type,
        stateName: dispStateName,
        districtName: dispDistrictName
        });
    }
    
    // Initially populate table with default filter: Subdistrict.
    populateTable(["Subdistrict"]);
    // Trigger change event to ensure district filter appears.
    $("#areaFilter").trigger("change");
    
    $("#loader").fadeOut();
    $("#downloadJson").prop("disabled", false);
    $("#downloadExcel").removeClass("disabled");
    
    $("#downloadJson").click(function() {
        var dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(filteredTableData, null, 2));
        var downloadAnchorNode = document.createElement('a');
        downloadAnchorNode.setAttribute("href", dataStr);
        downloadAnchorNode.setAttribute("download", "tableData.json");
        document.body.appendChild(downloadAnchorNode);
        downloadAnchorNode.click();
        downloadAnchorNode.remove();
    });
};
oReq.send();

// Modal popup when an area name is clicked.
$(document).on("click", ".area-info", function(e) {
    e.preventDefault();
    var index = $(this).data("index");
    var item = filteredTableData[index];
    $("#modalAreaName").text(item.area);
    $("#modalAreaType").text(item.type);
    $("#modalStateName").text(item.stateName);
    $("#modalDistrictName").text(item.districtName);
    $("#areaModal").modal("show");
});
});