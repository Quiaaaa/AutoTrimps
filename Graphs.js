var basepath = 'AutoTrimps/' // LOCAL ONLY

function safeSetItems(name, data) {
    try {
        localStorage.setItem(name, data);
    } catch (e) {
        if (e.code == 22) {
            // Storage full, maybe notify user or do some clean-up
            debug("Error: LocalStorage is full, or error. Attempt to delete some portals from your graph or restart browser.");
        }
    }
}

var enableDebug = false;
function debug(message, type, lootIcon) {
    if (enableDebug)
        console.debug(0 + ' ' + message);
}

var MODULES = {}
// Above code should be in GraphsOnly.js, is here only only for ease of local testing


var GRAPHSETTINGS = {
    universeSelection: 1,
    u1graphSelection: null,
    u2graphSelection: null,
    rememberSelected: [],
}

function saveSetting(key, value) {
    if (key !== null && value !== null) GRAPHSETTINGS[key] = value;
    safeSetItems("GRAPHSETTINGS", JSON.stringify(GRAPHSETTINGS));
}

var chart1;

// This is not a good function. It is not my function.  
// It is all of the UI and loading of scripts that should not be littering global scope
// TODO reduce screaming, remove some of the useless buttons, decide what new ones should be added
function init() {
    var head = document.getElementsByTagName("head")[0]
    var chartscript = document.createElement("script");
    chartscript.type = "text/javascript";
    chartscript.src = "https://code.highcharts.com/highcharts.js";
    head.appendChild(chartscript);

    var newItem = document.createElement("TD");
    newItem.appendChild(document.createTextNode("Graphs"))
    newItem.setAttribute("class", "btn btn-default")
    newItem.setAttribute("onclick", "autoToggleGraph(); drawGraph(); swapGraphUniverse();");

    var settingbarRow = document.getElementById("settingsTable").firstElementChild.firstElementChild;
    settingbarRow.insertBefore(newItem, settingbarRow.childNodes[10])

    document.getElementById("settingsRow").innerHTML += `
        <div id="graphParent" style="display: none; height: 600px; overflow: auto;">
        <div id="graph" style="margin-bottom: 10px;margin-top: 5px; height: 530px;"></div>`;
    document.getElementById("graphParent").innerHTML += `
        <div id="graphFooter" style="height: 50px;font-size: 1em;">
        <div id="graphFooterLine1" style="display: -webkit-flex;flex: 0.75;flex-direction: row; height:30px;"></div>
        <div id="graphFooterLine2"></div></div>`;

    function createSelector(id, sourceList, textMod = "", onchangeMod = "") {
        let selector = document.createElement("select");
        selector.id = id;
        selector.setAttribute("style", "");
        selector.setAttribute("onchange", "saveSetting(this.id, this.value); drawGraph();" + onchangeMod);
        for (var item of sourceList) {
            let opt = document.createElement("option");
            opt.value = item;
            opt.text = textMod + item;
            selector.appendChild(opt);
        }
        selector.value = GRAPHSETTINGS[selector.id]
        return selector;
    }

    // Create Universe and Graph selectors
    var universeFooter = document.getElementById("graphFooterLine1");
    [
        ["universeSelection", [1, 2], "Universe ", " swapGraphUniverse();"],
        ["u1graphSelection", graphList.filter((g) => g.universe == 1 || !g.universe).map((g) => g.selectorText)],
        ["u2graphSelection", graphList.filter((g) => g.universe == 2 || !g.universe).map((g) => g.selectorText)]
    ].forEach((opts) => universeFooter.appendChild(createSelector(...opts)))

    universeFooter.innerHTML += `
        <div><button onclick="drawGraph()" style="margin-left:0.5em;">Refresh</button></div>
        <div style="flex:0 100 5%;"></div><div><input type="checkbox" id="clrChkbox" onclick="toggleClearButton();"></div>
        <div style="margin-left: 0.5vw;"><button id="clrAllDataBtn" onclick="clearData(null,true); drawGraph();" class="btn" disabled="" style="flex:auto; padding: 2px 6px;border: 1px solid white;">Clear All Previous Data</button></div>
        <div style="flex:0 100 5%;"></div><div style="flex:0 2 3.5vw;"><input style="width:100%;min-width: 40px;" id="deleteSpecificTextBox"></div>
        <div style="flex:auto; margin-left: 0.5vw;"><button onclick="deleteSpecific(); drawGraph();">Delete Specific Portal</button></div>
        <div style="float:right; margin-right: 0.5vw;"><button onclick="toggleSpecificGraphs()">Invert Selection</button></div>
        <div style="float:right; margin-right: 1vw;"><button onclick="toggleAllGraphs()">All Off/On</button></div>`

    // AAAAAAAAAAAAAAAAAAAAAAAAAAAA (Setting the inner HTML of the parent element resets the value of these? what the fuck)
    document.querySelector("#universeSelection").value = GRAPHSETTINGS.universeSelection
    document.querySelector("#u1graphSelection").value = GRAPHSETTINGS.u1graphSelection
    document.querySelector("#u2graphSelection").value = GRAPHSETTINGS.u2graphSelection

    document.getElementById("graphFooterLine2").innerHTML += `
        <span style="float: left;" onmouseover=\'tooltip("Tips", "customText", event, "You can zoom by dragging a box around an area. You can turn portals off by clicking them on the legend. Quickly view the last portal by clicking it off, then Invert Selection. Or by clicking All Off, then clicking the portal on. To delete a portal, Type its portal number in the box and press Delete Specific. Using negative numbers in the Delete Specific box will KEEP that many portals (starting counting backwards from the current one), ie: if you have Portals 1000-1015, typing -10 will keep 1005-1015. There is a browser data storage limitation of 10MB, so do not exceed 20 portals-worth of data.")\' onmouseout=\'tooltip("hide")\'>Tips: Hover for usage tips.</span>
        <input style="height: 20px; float: right; margin-right: 0.5vw;" type="checkbox" id="rememberCB">
        <span style="float: right; margin-right: 0.5vw;">Try to Remember Which Portals are Selected when switching between Graphs:</span>
        <input onclick="toggleDarkGraphs()" style="height: 20px; float: right; margin-right: 0.5vw;" type="checkbox" id="blackCB">
        <span style="float: right; margin-right: 0.5vw;">Black Graphs:</span>`;

    MODULES.graphs.themeChanged = function () {
        if (game && game.options.menu.darkTheme.enabled != lastTheme) {
            function f(h) {
                h.style.color = 2 == game.options.menu.darkTheme.enabled ? "" : "black";
            }
            function g(h) {
                if ("graphSelection" == h.id) return void (2 != game.options.menu.darkTheme.enabled && (h.style.color = "black"));
            }
            toggleDarkGraphs();
            var c = document.getElementsByTagName("input"),
                d = document.getElementsByTagName("select"),
                e = document.getElementById("graphFooterLine1").children;
            for (let h of c) f(h);
            for (let h of d) f(h);
            for (let h of e) f(h);
            for (let h of e) g(h);
        }
        game && (lastTheme = game.options.menu.darkTheme.enabled);
    }
    MODULES.graphs.themeChanged();
}

// 
function Graph(dataVar, universe, selectorText, additionalParams = {}) {
    // graphTitle, customFunction, useAccumulator, xTitle, yTitle, formatter, valueSuffix, xminFloor, yminFloor, yType
    this.dataVar = dataVar
    this.universe = universe; // false, 1, 2
    this.selectorText = selectorText ? selectorText : dataVar;
    this.graphTitle = this.selectorText;
    this.graphType = "line"
    this.customFunction;
    this.useAccumulator;
    this.xTitle = "Zone";
    this.yTitle = this.selectorText;
    this.formatter;
    this.valueSuffix = "";
    this.xminFloor = 1;
    this.yminFloor;
    this.yType = "Linear";
    this.graphData = [];
    this.typeCheck = "number"
    //this.precision = 0;
    this.conditional = () => { return true };
    for (const [key, value] of Object.entries(additionalParams)) {
        this[key] = value;
    }
    // create an object to pass to Highcharts.Chart
    this.createHighChartsObj = function () {
        return {
            chart: {
                renderTo: "graph",
                zoomType: "xy",
                resetZoomButton: {
                    position: {
                        align: "right",
                        verticalAlign: "top",
                        x: -20,
                        y: 15,
                    },
                    relativeTo: "chart",
                },
            },
            title: {
                text: this.graphTitle,
                x: -20,
            },
            plotOptions: {
                series: {
                    lineWidth: 1,
                    animation: false,
                    marker: {
                        enabled: false,
                    },
                },
            },
            xAxis: {
                floor: this.xminFloor,
                title: {
                    text: this.xTitle,
                },
            },
            yAxis: {
                floor: this.yminFloor,
                title: {
                    text: this.yTitle,
                },
                plotLines: [
                    {
                        value: 0,
                        width: 1,
                        color: "#808080",
                    },
                ],
                type: this.yType,
                dateTimeLabelFormats: {
                    // TODO write a whole new *duration* formatter instead of a datetime formatter
                    second: "%H:%M:%S",
                    minute: "%H:%M:%S",
                    hour: "%H:%M:%S",
                    day: "%H:%M:%S",
                    week: "%H:%M:%S",
                    month: "%H:%M:%S",
                    year: "%H:%M:%S",
                },
            },
            tooltip: {
                pointFormatter: this.formatter,
            },
            legend: {
                layout: "vertical",
                align: "right",
                verticalAlign: "middle",
                borderWidth: 0,
            },
            series: this.graphData,
            additionalParams: {},
        }
    }
    // Main Graphing function
    this.updateGraph = function () {
        let valueSuffix = this.valueSuffix;
        if (this.graphType == "line") this.lineGraph();
        if (this.graphType == "column") this.columnGraph();
        this.formatter = this.formatter
            || function () {
                var ser = this.series; // 'this' being the highcharts object that uses formatter()
                return '<span style="color:' + ser.color + '" >●</span> ' + ser.name + ": <b>" + prettify(this.y) + valueSuffix + "</b><br>";
            };
        chart1 = new Highcharts.Chart(this.createHighChartsObj());
        saveSelectedGraphs();
        if (document.getElementById("rememberCB").checked) {
            applyRememberedSelections();
        }
    }
    // prepares data series for Highcharts, and optionally transforms it with customFunction and/or useAccumulator
    this.lineGraph = function () {
        var item = this.dataVar;
        this.graphData = [];
        for (const portal of Object.values(portalSaveData)) {
            if (!(item in portal.perZoneData)) continue; // ignore blank
            if (portal.universe != GRAPHSETTINGS.universeSelection) continue; // ignore inactive universe
            let cleanData = [];
            for (index in portal.perZoneData[item]) {
                let x = portal.perZoneData[item][index];
                if (typeof this.customFunction === "function") {
                    x = this.customFunction(portal, index);
                    if (x < 0) x = null;
                }
                if (this.useAccumulator) x += cleanData.length === 0 ? 0 : cleanData.at(-1);
                if (this.typeCheck && typeof x != this.typeCheck) x = null;
                cleanData.push([index, x])
            }
            this.graphData.push({
                name: `Portal ${portal.totalPortals}: ${portal.challenge}`,
                data: cleanData,
            })
        }
    }
    // prepares column data series from per-portal data
    this.columnGraph = function () {
        var item = this.portalVar;
        this.xTitle = "Portal"
        this.graphData = [];
        let cleanData = []
        // TODO test for datavar in portal, or in perZoneData, if you ever want to make column graphs based on max(perZoneData)
        for (const portal of Object.values(portalSaveData)) {
            cleanData.push([portal.totalPortals, portal[item]])
        }
        this.graphData.push({
            name: this.yTitle,
            data: cleanData,
            type: "column",
        });

    }
}

// Show/hide the universe-specific graph selectors
function swapGraphUniverse() {
    var universe = GRAPHSETTINGS.universeSelection;
    var active = `u${universe}`
    var inactive = `u${universe == 1 ? 2 : 1}`
    document.getElementById(`${active}graphSelection`).style.display = '';
    document.getElementById(`${inactive}graphSelection`).style.display = 'none';
}

// Draws the graph currently selected by the user
function drawGraph() {
    function lookupGraph(selectorText) {
        for (const graph of graphList) {
            if (graph.selectorText === selectorText) return graph;
        }
    }
    var universe = GRAPHSETTINGS.universeSelection;
    var selectedGraph = document.getElementById(`u${universe}graphSelection`);
    if (selectedGraph.value) {
        lookupGraph(selectedGraph.value).updateGraph();
    }
}

// Custom Function Helpers
function elapsedHours(portal, i) {
    let time = portal.perZoneData.currentTime[i];
    return time ? (time - portal.portalTime) / 3600000 : null;
}

function dataVarPerHour(dataVar) {
    return function (portal, i) { return portal.perZoneData[dataVar][i] / elapsedHours(portal, i) }
}

// diff between x and x-1, or x and initial
function diff(dataVar, initial) {
    return function (portal, i) {
        let e1 = portal.perZoneData[dataVar][i];
        let e2 = initial ? initial : portal.perZoneData[dataVar][i - 1];
        if (e1 === null || e2 === null) return null;
        return e1 - e2
    }
}

function pctOfInitial(dataVar, initial) {
    return function (portal, i) {
        return portal.perZoneData[dataVar][i] / initial;
    }
}

var formatters = {
    // TODO look up how to change the formatting based on the total duration
    datetime: function () {
        var ser = this.series;
        return '<span style="color:' + ser.color + '" >●</span> ' + ser.name + ": <b>" + Highcharts.dateFormat("%H:%M:%S", this.y) + "</b><br>";
    },
}

/*  TODO
    The whole He, He/hr, * lifetime, + normalized, is a big ugly mess.  
    Highcharts can do 'dynamic' graphs, it would be amazing to get all these options on ONE graph, so you have checkboxes instead of 5 graphs
    Per hour, % Lifetime, S3 normalized
    Maybe after that I'll figure out how to make these function factory factory functions less ugly
    I made them up as I went along and it shows
    a lot
*/

// Graph(dataVar, universe, selectorText, additionalParams) {
// graphTitle, customFunction, useAccumulator, xTitle, yTitle, formatter, valueSuffix, xminFloor, yminFloor, yType
const graphList = [
    // U1 Graphs
    ["heliumOwned", 1, "Helium - He/Hr", {
        customFunction: dataVarPerHour("heliumOwned")
    }],
    ["heliumOwned", 1, "Helium - Total"],
    ["heliumOwned", 1, "HeHr % / LifetimeHe", {
        customFunction: (portal, i) => { return pctOfInitial("heliumOwned", portal.totalHelium)(portal, i) / elapsedHours(portal, i) }
    }],
    ["heliumOwned", 1, "He % / LifetimeHe", {
        customFunction: (portal, i) => { return pctOfInitial("heliumOwned", portal.totalHelium)(portal, i) }
    }],
    ["fluffy", 1, "Fluffy XP", {
        conditional: () => { return game.global.highestLevelCleared >= 300 },
        customFunction: (portal, i) => { return diff("fluffy", portal.initialFluffy)(portal, i) }
    }],
    ["fluffy", 1, "Fluffy XP PerHour", {
        conditional: () => { return game.global.highestLevelCleared >= 300 },
        customFunction: (portal, i) => { return diff("fluffy", portal.initialFluffy)(portal, i) / elapsedHours(portal, i) }
    }],
    ["amals", 1, "Amalgamators"],
    ["wonders", 1, "Wonders", {
        conditional: () => { return getGameData.challengeActive() === "Experience" }
    }],

    // U2 Graphs
    ["radonOwned", 2, "Radon - Rn/Hr", {
        customFunction: dataVarPerHour("radonOwned")
    }],
    ["radonOwned", 2, "Radon - Rn/Hr Normalized", {
        customFunction: (portal, i) => { return dataVarPerHour("radonOwned")(portal, i) / 1.03 ** portal.s3 }
    }],
    ["radonOwned", 2, "Radon - Total"],
    ["radonOwned", 2, "RnHr % / LifetimeRn", {
        customFunction: (portal, i) => { return pctOfInitial("radonOwned", portal.totalRadon)(portal, i) / elapsedHours(portal, i) }
    }],
    ["radonOwned", 2, "Rn % / LifetimeRn", {
        customFunction: (portal, i) => { return pctOfInitial("radonOwned", portal.totalRadon)(portal, i) }
    }],
    ["smithies", 2, "Smithies"],
    ["scruffy", 2, "Scruffy XP", {
        customFunction: (portal, i) => { return diff("scruffy", portal.initialScruffy)(portal, i) }
    }],
    ["scruffy", 2, "Scruffy XP PerHour", {
        customFunction: (portal, i) => { return diff("scruffy", portal.initialScruffy)(portal, i) / elapsedHours(portal, i) }
    }],
    ["worshippers", 2, "Worshippers", {
        conditional: () => { return game.global.highestRadonLevelCleared >= 50 }
    }],
    ["bonfires", 2, "Bonfires", {
        graphTitle: "Active Bonfires",
        conditional: () => { return getGameData.challengeActive() === "Hypothermia" }
    }],
    ["embers", 2, "Embers", {
        conditional: () => { return getGameData.challengeActive() === "Hypothermia" }
    }],
    ["cruffys", 2, "Cruffys", {
        conditional: () => { return getGameData.challengeActive() === "Nurture" }
    }],

    // Generic Graphs
    ["voids", false, "Void Map History", {
        graphTitle: "Void Map History (voids finished during the same level acquired are not counted/tracked)",
        yTitle: "Number of Void Maps",
    }],
    [false, false, "Total Voids", {
        portalVar: "totalVoidMaps",
        graphType: "column",
        graphTitle: "Total Void Maps Run"
    }],
    ["coord", false, "Coordinations", {
        graphTitle: "Unbought Coordinations",
    }],
    [false, false, "Nullifium Gained", {
        portalVar: "totalNullifium",
        graphType: "column",
    }],
    ["overkill", false, "Overkill Cells"],
    ["currentTime", false, "Clear Time", {
        customFunction: (portal, i) => { return Math.round(diff("currentTime")(portal, i)) },
        yType: "datetime",
        formatter: formatters.datetime
    }],
    ["currentTime", false, "Cumulative Clear Time", {
        customFunction: (portal, i) => { return Math.round(diff("currentTime", portal.portalTime)(portal, i)) },
        yType: "datetime",
        formatter: formatters.datetime
    }],
    ["mapbonus", false, "Map Bonus"],
    ["empower", false, "Empower", {
        conditional: () => { return getGameData.challengeActive() === "Daily" && typeof game.global.dailyChallenge.empower !== "undefined" }
    }]
].map(opts => new Graph(...opts));

const getGameData = {
    currentTime: () => { return new Date().getTime() },
    world: () => { return game.global.world },
    challengeActive: () => { return game.global.challengeActive },
    voids: () => { return game.global.totalVoidMaps },
    totalVoids: () => { return game.stats.totalVoidMaps.value },
    nullifium: () => { return recycleAllExtraHeirlooms(true) },
    coord: () => { return game.upgrades.Coordination.allowed - game.upgrades.Coordination.done },
    overkill: () => {
        // overly complex check for Liq, overly fragile check for overkill cells
        if (game.options.menu.overkillColor.enabled == 0) toggleSetting("overkillColor");
        if (game.options.menu.liquification.enabled && game.talents.liquification.purchased && !game.global.mapsActive && game.global.gridArray && game.global.gridArray[0] && game.global.gridArray[0].name == "Liquimp")
            return 100;
        else return document.getElementById("grid").getElementsByClassName("cellColorOverkill").length;
    },
    zoneTime: () => { return new Date().getTime() - game.global.zoneStarted },
    mapbonus: () => { return game.global.mapBonus },
    empower: () => { return game.global.challengeActive == "Daily" && typeof game.global.dailyChallenge.empower !== "undefined" ? game.global.dailyChallenge.empower.stacks : 0 },
    lastwarp: () => { return game.global.lastWarp },
    essence: () => { return game.global.spentEssence + game.global.essence },
    heliumOwned: () => { return game.resources.helium.owned },
    magmite: () => { return game.global.magmite },
    magmamancers: () => { return game.jobs.Magmamancer.owned },
    fluffy: () => { return game.global.fluffyExp },
    nursery: () => { return game.buildings.Nursery.purchased },
    amals: () => { return game.jobs.Amalgamator.owned },
    wonders: () => { return game.challenges.Experience.wonders },
    scruffy: () => { return game.global.fluffyExp2 },
    smithies: () => { return game.buildings.Smithy.owned },
    radonOwned: () => { return game.resources.radon.owned },
    worshippers: () => { return game.jobs.Worshipper.owned },
    bonfires: () => { return game.challenges.Hypothermia.bonfires },
    embers: () => { return game.challenges.Hypothermia.embers },
    cruffys: () => { return game.challenges.Nurture.level },
    universe: () => { return game.global.universe },
    portalTime: () => { return game.global.portalTime },
    s3: () => { return game.global.lastRadonPortal },
}

function Portal() {
    this.universe = getGameData.universe();
    this.totalPortals = getTotalPortals(true);
    this.portalTime = getGameData.portalTime();
    this.challenge = getGameData.challengeActive() === 'Daily'
        ? getCurrentChallengePane().split('.')[0].substr(13).slice(0, 16) // names dailies by their start date, only moderately cursed
        : getGameData.challengeActive();
    this.totalNullifium = getGameData.nullifium();
    this.totalVoidMaps = getGameData.totalVoids();
    if (this.universe === 1) {
        this.totalHelium = game.global.totalHeliumEarned;
        this.initialFluffy = getGameData.fluffy();
    }
    if (this.universe === 2) {
        this.totalRadon = game.global.totalRadonEarned;
        this.initialScruffy = getGameData.scruffy();
        this.s3 = getGameData.s3();
    }
    this.perZoneData = Object.fromEntries(graphList.filter((graph) =>
        (graph.universe == this.universe || !graph.universe) // only save data relevant to the current universe
        && graph.conditional()) // and for relevant challenges
        .map(graph => [graph.dataVar, []]) // create data structure
        .concat([["currentTime", []]]) // always graph time
    );
    this.update = function () {
        const world = getGameData.world();
        // TODO Nu is a rather fragile stat, assumes recycling everything on portal. Max throughout the run makes it slightly less crappy.
        // It would be better to store an initial value, and compare to final value + recycle value
        this.totalNullifium = Math.max(this.totalNullifium, getGameData.nullifium());
        this.totalVoidMaps = getGameData.totalVoids();
        for (const [name, data] of Object.entries(this.perZoneData)) {
            data[world] = getGameData[name]();
            if (world + 1 < data.length) { // FENCEPOSTING
                data.splice(world) // trim 'future' zones on reload
            }
        }
    }
}

// Here begins old code
function toggleClearButton() {
    document.getElementById("clrAllDataBtn").disabled = !document.getElementById("clrChkbox").checked;
}

function toggleDarkGraphs() {
    function removeDarkGraphs() {
        var a = document.getElementById("dark-graph.css");
        a && (document.head.removeChild(a), debug("Removing dark-graph.css file", "graphs"));
    }
    function addDarkGraphs() {
        var a = document.getElementById("dark-graph.css");
        if (!a) {
            var b = document.createElement("link");
            (b.rel = "stylesheet"), (b.type = "text/css"), (b.id = "dark-graph.css"), (b.href = basepath + "dark-graph.css"), document.head.appendChild(b), debug("Adding dark-graph.css file", "graphs");
        }
    }
    if (game) {
        var c = document.getElementById("dark-graph.css"),
            d = document.getElementById("blackCB").checked;
        (!c && (0 == game.options.menu.darkTheme.enabled || 2 == game.options.menu.darkTheme.enabled)) || MODULES.graphs.useDarkAlways || d
            ? addDarkGraphs()
            : c && (1 == game.options.menu.darkTheme.enabled || 3 == game.options.menu.darkTheme.enabled || !d) && removeDarkGraphs();
    }
}


// TODO these don't work at all?  woo.
function saveSelectedGraphs() {
    GRAPHSETTINGS.rememberSelected = [];
    for (var b, a = 0; a < chart1.series.length; a++) (b = chart1.series[a]), (GRAPHSETTINGS.rememberSelected[a] = b.visible);
}
function applyRememberedSelections() {
    for (var b, a = 0; a < chart1.series.length; a++) (b = chart1.series[a]), !1 == GRAPHSETTINGS.rememberSelected[a] && b.hide();
}
function toggleSpecificGraphs() {
    for (var b, a = 0; a < chart1.series.length; a++) (b = chart1.series[a]), b.visible ? b.hide() : b.show();
}
function toggleAllGraphs() {
    for (var c, a = 0, b = 0; b < chart1.series.length; b++) (c = chart1.series[b]), c.visible && a++;
    for (var c, b = 0; b < chart1.series.length; b++) (c = chart1.series[b]), a > chart1.series.length / 2 ? c.hide() : c.show();
}

//Up to date
function clearData(keepN, clrall = false) {
    var currentPortalNumber = getTotalPortals(true);
    if (clrall) {
        for (const [portalID, portalData] of Object.entries(portalSaveData)) {
            if (portalData.totalPortals != currentPortalNumber) {
                delete portalSaveData[portalID];
            }
        }
    } else {
        for (const [portalID, portalData] of Object.entries(portalSaveData)) {
            if (portalData.totalPortals < currentPortalNumber - keepN) {
                delete portalSaveData[portalID];
            }
        }
    }
    showHideUnusedGraphs();
}

//Up to date
function deleteSpecific() {
    var portalNum = document.getElementById("deleteSpecificTextBox").value;
    if ("" != portalNum)
        if (0 > parseInt(portalNum)) clearData(Math.abs(portalNum));
        else {
            for (const [portalID, portalData] of Object.entries(portalSaveData)) {
                if (portalData.totalPortals === portalNum) delete portalSaveData[portalID];
            }
        }
    showHideUnusedGraphs();
}

// show graph window
function autoToggleGraph() {
    game.options.displayed && toggleSettingsMenu();
    var a = document.getElementById("autoSettings");
    a && "block" === a.style.display && (a.style.display = "none");
    var a = document.getElementById("autoTrimpsTabBarMenu");
    a && "block" === a.style.display && (a.style.display = "none");
    var b = document.getElementById("graphParent");
    "block" === b.style.display ? (b.style.display = "none") : ((b.style.display = "block")); // , displayGraph()
}
// focus main game
function escapeATWindows() {
    var a = document.getElementById("tooltipDiv");
    if ("none" != a.style.display) return void cancelTooltip();
    game.options.displayed && toggleSettingsMenu();
    var b = document.getElementById("autoSettings");
    "block" === b.style.display && (b.style.display = "none");
    var b = document.getElementById("autoTrimpsTabBarMenu");
    "block" === b.style.display && (b.style.display = "none");
    var c = document.getElementById("graphParent");
    "block" === c.style.display && (c.style.display = "none");
}
document.addEventListener(
    "keydown",
    function (a) {
        1 != game.options.menu.hotkeys.enabled || game.global.preMapsActive || game.global.lockTooltip
            || ctrlPressed || heirloomsShown || 27 != a.keyCode || escapeATWindows();
    },
    true
);

// Up to date (ish)
// TODO the game thinks a portal starts on the portal screen when you swap universes, instead of when you start a portal.  Urk.
function pushData() {
    debug("Starting Zone " + getGameData.world(), "graphs");
    const portalID = `u${getGameData.universe()} p${getTotalPortals(true)}`
    if (!portalSaveData[portalID]) {
        portalSaveData[portalID] = new Portal();
    }
    portalSaveData[portalID].update();
    //clearData(10); // TODO this value should be different now wheee
    safeSetItems("portalSaveData", JSON.stringify(portalSaveData));
    showHideUnusedGraphs();
}

function showHideUnusedGraphs() {
    // Hide graphs that have no collected data
    for (const graph of graphList) {
        // TODO this seems excessive, there is almost certainly a cheaper way to check this.
        if (graph.graphType == "line") graph.lineGraph();
        else graph.columnGraph();

        let graphData = graph.graphData
        const style = graphData.length === 0 ? "none" : "";
        const universes = graph.universe ? [graph.universe] : ["1", "2"]
        for (const universe of universes) {
            document.querySelector(`#u${universe}graphSelection [value="${graph.selectorText}"]`).style.display = style;
        }
    }
    return
    // TODO Hide specific graphs that are constant (either not unlocked yet, or maxed)
    const emptyGraphs = {
        OverkillCells: { dataName: "overkill" },
        Worshippers: { universe: "u2" },
        "Fluffy XP": { dataName: "fluffy", universe: "u1" },
        "Fluffy XP PerHour": { dataName: "fluffy", universe: "u1" },
        Amalgamators: { dataName: "amals", universe: "u1" },
        Empower: {},
    }
    for (const [graphName, data] of Object.entries(emptyGraphs)) {
        const dataName = data.dataName ? data.dataName : graphName.toLowerCase();
        const universes = data.universe ? [data.universe] : ["u1", "u2"]
        for (universe of universes) {
            const style = [...new Set(allSaveData.map((graphs) => graphs = graphs[dataName]))].length == 1 ? "none" : "";
            document.querySelector(`#${universe}graphSelection [value="${graphName}"]`).style.display = style;
        }
    }
}

function initializeData() {
    if (null === portalSaveData) portalSaveData = {};
    if (0 === portalSaveData.length) pushData();
}

function gatherInfo() {
    if (game.options.menu.pauseGame.enabled) return;
    initializeData();
    if (getGameData.world()) pushData();
}

function loadGraphData() {
    loadedData = JSON.parse(localStorage.getItem("portalSaveData"));
    if (loadedData !== null) {
        console.log("Graphs: Found portalSaveData")
        // remake object structure
        for (const [portalID, portalData] of Object.entries(loadedData)) {
            portalSaveData[portalID] = new Portal();
            for (const [k, v] of Object.entries(portalData)) {
                portalSaveData[portalID][k] = v;
            }
        }
    }
    loadedSettings = JSON.parse(localStorage.getItem("GRAPHSETTINGS"));
    if (loadedSettings !== null) GRAPHSETTINGS = loadedSettings;
    MODULES.graphs = {}
    MODULES.graphs.useDarkAlways = false
}

var portalSaveData = {}
loadGraphData();
init()
//showHideUnusedGraphs()
var lastTheme = -1;

// TODO put this in a Proxy/wrapper instead of a setInterval to avoid all the 'too slow' data errors
setInterval(gatherInfo, 100);