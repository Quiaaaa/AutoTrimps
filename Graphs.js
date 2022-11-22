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
    newItem.setAttribute("onclick", "autoToggleGraph(); drawGraph();");

    var settingbarRow = document.getElementById("settingsTable").firstElementChild.firstElementChild;
    settingbarRow.insertBefore(newItem, settingbarRow.childNodes[10])

    document.getElementById("settingsRow").innerHTML += `
        <div id="graphParent" style="display: none; height: 600px; overflow: auto;">
        <div id="graph" style="margin-bottom: 10px;margin-top: 5px; height: 530px;"></div>`;
    document.getElementById("graphParent").innerHTML += `
        <div id="graphFooter" style="height: 50px;font-size: 1em;">
        <div id="graphFooterLine1" style="display: -webkit-flex;flex: 0.75;flex-direction: row; height:30px;"></div>
        <div id="graphFooterLine2"></div></div>`;

    function createSelector(id, sourceList, textMod = "") {
        var selector = document.createElement("select");
        selector.id = id;
        selector.setAttribute("style", "");
        selector.setAttribute("onchange", "drawGraph()");
        for (var item of sourceList) {
            let opt = document.createElement("option");
            opt.value = item;
            opt.text = textMod + item;
            selector.appendChild(opt);
        }
        return selector;
    }

    var universeFooter = document.getElementById("graphFooterLine1");
    var u1graphList = Object.values(graphList).filter((g) => g.universe == 1 || !g.universe).map((g) => g.selectorText)
    var u2graphList = Object.values(graphList).filter((g) => g.universe == 2 || !g.universe).map((g) => g.selectorText)
    var universeSel = createSelector("universeSelection", [1, 2], "Universe ");
    var u1graphSel = createSelector("u1graphSelection", u1graphList)
    var u2graphSel = createSelector("u2graphSelection", u2graphList)

    universeFooter.appendChild(universeSel)
    universeFooter.appendChild(u1graphSel)
    universeFooter.appendChild(u2graphSel)

    universeFooter.innerHTML += `
        <div><button onclick="drawGraph()" style="margin-left:0.5em;">Refresh</button></div>
        <div style="flex:0 100 5%;"></div><div><input type="checkbox" id="clrChkbox" onclick="toggleClearButton();"></div>
        <div style="margin-left: 0.5vw;"><button id="clrAllDataBtn" onclick="clearData(null,true); drawGraph();" class="btn" disabled="" style="flex:auto; padding: 2px 6px;border: 1px solid white;">Clear All Previous Data</button></div>
        <div style="flex:0 100 5%;"></div><div style="flex:0 2 3.5vw;"><input style="width:100%;min-width: 40px;" id="deleteSpecificTextBox"></div>
        <div style="flex:auto; margin-left: 0.5vw;"><button onclick="deleteSpecific(); drawGraph();">Delete Specific Portal</button></div>
        <div style="float:right; margin-right: 0.5vw;"><button onclick="toggleSpecificGraphs()">Invert Selection</button></div>
        <div style="float:right; margin-right: 1vw;"><button onclick="toggleAllGraphs()">All Off/On</button></div>`

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
    this.customFunction;
    this.useAccumulator;
    this.xTitle = "Zone";
    this.yTitle = this.selectorText;
    this.formatter = null;
    this.valueSuffix = "";
    this.xminFloor = 1;
    this.yminFloor = null;
    this.yType = "Linear";
    this.graphData = [];
    this.typeCheck = "number"
    //this.precision = 0;
    this.conditional = () => { return true };
    this.graphFunc = function () {
        this.allPurposeGraph();
    }
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
                    // TODO fix these for 1+ days
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
                valueSuffix: this.valueSuffix,
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
        //let oldData = JSON.stringify(this.graphData)
        let valueSuffix = this.valueSuffix;
        this.graphFunc();
        this.formatter = function () {
            var ser = this.series; // this is the most fucking confusing use of 'this' ever, this function is called by a highcharts object
            return '<span style="color:' + ser.color + '" >●</span> ' + ser.name + ": <b>" + prettify(this.y) + valueSuffix + "</b><br>";
        };
        chart1 = new Highcharts.Chart(this.createHighChartsObj());
        saveSelectedGraphs();
        //if (oldData != JSON.stringify(this.graphData)) { } // This was used in the previous version but it seems to just make graphs act weirdly when you're on the same zone?
        if (document.getElementById("rememberCB").checked) {
            applyRememberedSelections();
        }
    }
    // prepares data series for Highcharts, and optionally transforms it with customFunction and/or useAccumulator
    this.allPurposeGraph = function () {
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
                cleanData.push(x)
            }
            this.graphData.push({
                name: `Portal ${portal.totalPortals}: ${portal.challenge}`,
                data: cleanData,
                //universe: portal.universe
            })
            //TODO This is 100% not finished and I forget where I left off
            /*
            if (this.customFunction && !this.useAccumulator) {
                graphData.data = graphData.data.map((a, b) => { let out = this.customFunction(a, b); return out < 0 ? 1 : out; });
            } else if (this.customFunction && this.useAccumulator) {
                
                let tempData = graphData.data.map((a))
                    accumulator += this.customFunction(allSaveData[i], allSaveData[i - 1]);
                if (accumulator < 0) accumulator = 1;
                graphData[graphData.length - 1].data.push(accumulator);
            } else {
                if (allSaveData[i][item] >= 0) graphData[graphData.length - 1].data.push(allSaveData[i][item] * 1);
                else if (extraChecks) graphData[graphData.length - 1].data.push(-1);
            }
            */
        }
    }
}

// Draws the graph currently selected by the user
function drawGraph() {
    GRAPHSETTINGS.universeSelection = document.getElementById('universeSelection').value;
    var universe = GRAPHSETTINGS.universeSelection;
    var active = `u${universe}`
    var inactive = `u${universe == 1 ? 2 : 1}`
    document.getElementById(`${active}graphSelection`).style.display = '';
    document.getElementById(`${inactive}graphSelection`).style.display = 'none';
    var selectedGraph = document.getElementById(`${active}graphSelection`);
    if (selectedGraph.value) {
        graphList[selectedGraph.value].updateGraph();
    }
}


// TODO all of the data in the switch should be in graphList instead, as soon as I decide how to handle accumulators and custom functions
/*
function setGraphData(graph) {
    switch (graph) {
        case "Refresh":
            graphData = [];

            title = "Refresh";
            xTitle = "Refresh";
            yTitle = "Refresh";

            break;
        // TODO ALL OF THIS SHOULD BE MOVED TO graphList and the definition of a graph
        case "Void Maps":
            var currentPortal = -1;
            var totalVoids = 0;
            var theChallenge = "";
            graphData = [];
            for (var i in allSaveData) {
                if (allSaveData[i].totalPortals != currentPortal) {
                    if (currentPortal == -1) {
                        theChallenge = allSaveData[i].challenge;
                        currentPortal = allSaveData[i].totalPortals;
                        graphData.push({
                            name: "Void Maps",
                            data: [],
                            type: "column",
                        });
                        continue;
                    }
                    graphData[0].data.push([allSaveData[i - 1].totalPortals, totalVoids]);
                    theChallenge = allSaveData[i].challenge;
                    totalVoids = 0;
                    currentPortal = allSaveData[i].totalPortals;
                }
                if (allSaveData[i].voids > totalVoids) {
                    totalVoids = allSaveData[i].voids;
                }
            }
            title = "Void Maps (completed)";
            xTitle = "Portal";
            yTitle = "Number of Void Maps";

            break;

        case "Nullifium Gained":
            var currentPortal = -1;
            var totalNull = 0;
            var theChallenge = "";
            graphData = [];
            var averagenulli = 0;
            var sumnulli = 0;
            var count = 0;
            for (var i in allSaveData) {
                if (allSaveData[i].totalPortals != currentPortal) {
                    if (currentPortal == -1) {
                        theChallenge = allSaveData[i].challenge;
                        currentPortal = allSaveData[i].totalPortals;
                        graphData.push({
                            name: "Nullifium Gained",
                            data: [],
                            type: "column",
                        });
                        continue;
                    }
                    graphData[0].data.push([allSaveData[i - 1].totalPortals, totalNull]);
                    count++;
                    sumnulli += totalNull;
                    theChallenge = allSaveData[i].challenge;
                    totalNull = 0;
                    currentPortal = allSaveData[i].totalPortals;
                }
                if (allSaveData[i].nullifium > totalNull) {
                    totalNull = allSaveData[i].nullifium;
                }
            }
            averagenulli = sumnulli / count;
            title = "Nullifium Gained Per Portal";
            if (averagenulli) title = "Average " + title + " = " + averagenulli;
            xTitle = "Portal";
            yTitle = "Nullifium Gained";

            break;

        case "Clear Time":
            graphData = allPurposeGraph("cleartime1", true, null, function specialCalc(e1, e2) {
                return Math.round((e1.currentTime - e2.currentTime - (e1.portalTime - e2.portalTime)) / 1000);
            });
            title = "Time to clear zone";
            yTitle = "Clear Time";
            valueSuffix = " Seconds";
            yminFloor = 0;
            break;
        case "Cumulative Clear Time":
            graphData = allPurposeGraph(
                "cumucleartime1",
                true,
                null,
                function specialCalc(e1, e2) {
                    return Math.round(e1.currentTime - e2.currentTime - (e1.portalTime - e2.portalTime));
                },
                true
            );
            title = "Cumulative Time (at END of zone#)";
            yTitle = "Cumulative Clear Time";
            yType = "datetime";
            formatter = function () {
                var ser = this.series;
                return '<span style="color:' + ser.color + '" >●</span> ' + ser.name + ": <b>" + Highcharts.dateFormat("%H:%M:%S", this.y) + "</b><br>";
            };
            yminFloor = 0;
            break;
        case "HeHr % / LifetimeHe":
            graphData = allPurposeGraph("hehr", true, "string");
            title = "He/Hr % of LifetimeHe";
            yTitle = "He/Hr % of LifetimeHe";
            yminFloor = 0;
            precision = 4;
            break;
        case "He % / LifetimeHe":
            graphData = allPurposeGraph("helife", true, "string");
            title = "He % of LifetimeHe";
            yTitle = "He % of LifetimeHe";
            yminFloor = 0;
            precision = 4;
            break;
        case "Radon - Rn/Hr":
            graphData = allPurposeGraph("radonhr", true, null, function specialCalc(e1, e2) {
                return Math.floor(e1.radonOwned / ((e1.currentTime - e1.portalTime) / 3600000));
            });
            title = "Radon/Hour (Cumulative)";
            yTitle = "Radon/Hour";
            yminFloor = 0;
            precision = 2;
            break;
        case "Radon - Rn/Hr Normalized":
            graphData = allPurposeGraph("radonhr", true, null, function specialCalc(e1, e2) {
                return Math.floor(e1.radonOwned / 1.03 ** e1.s3 / ((e1.currentTime - e1.portalTime) / 3600000));
            });
            title = "Radon/Hour (Cumulative, S3 Normalized)";
            yTitle = "Radon/Hour";
            yminFloor = 0;
            precision = 2;
            break;
        case "Radon - Total":
            graphData = allPurposeGraph("radonOwned", true, null, function specialCalc(e1, e2) {
                return Math.floor(e1.radonOwned);
            });
            title = "Radon (Lifetime Total)";
            yTitle = "Radon";
            break;
        case "RnHr % / LifetimeRn":
            graphData = allPurposeGraph("rnhr", true, "string");
            title = "Rn/Hr % of LifetimeRn";
            yTitle = "Rn/Hr % of LifetimeRn";
            yminFloor = 0;
            precision = 4;
            break;
        case "Rn % / LifetimeRn":
            graphData = allPurposeGraph("rnlife", true, "string");
            title = "Rn % of LifetimeRn";
            yTitle = "Rn % of LifetimeRn";
            yminFloor = 0;
            precision = 4;
            break;
        case "Scruffy XP":
            graphData = allPurposeGraph("scruffy", true, "number");
            title = "Scruffy XP (Lifetime Total)";
            yTitle = "Scruffy XP";
            xminFloor = 0;
            break;
        case "Scruffy XP PerHour":
            var currentPortal = -1;
            var currentZone = -1;
            var startScruffy = 0;
            graphData = [];
            for (var i in allSaveData) {
                if (allSaveData[i].totalPortals != currentPortal) {
                    graphData.push({
                        name: "Portal " + allSaveData[i].totalPortals + ": " + allSaveData[i].challenge,
                        data: [],
                    });
                    currentPortal = allSaveData[i].totalPortals;
                    currentZone = 0;
                    startScruffy = allSaveData[i].scruffy;
                }
                if (currentZone != allSaveData[i].world - 1 && i > 0) {
                    var loop = allSaveData[i].world - 1 - currentZone;
                    while (loop > 0) {
                        graphData[graphData.length - 1].data.push(allSaveData[i - 1][item] * 1);
                        loop--;
                    }
                }
                if (currentZone != 0) {
                    graphData[graphData.length - 1].data.push(Math.floor((allSaveData[i].scruffy - startScruffy) / ((allSaveData[i].currentTime - allSaveData[i].portalTime) / 3600000)));
                }
                currentZone = allSaveData[i].world;
            }
            title = "Scruffy XP/Hour (Cumulative)";
            yTitle = "Scruffy XP/Hour";
            xminFloor = 1;
            break;
        case "OverkillCells":
            var currentPortal = -1;
            graphData = [];
            for (var i in allSaveData) {
                if (allSaveData[i].totalPortals != currentPortal) {
                    graphData.push({
                        name: "Portal " + allSaveData[i].totalPortals + ": " + allSaveData[i].challenge,
                        data: [],
                    });
                    currentPortal = allSaveData[i].totalPortals;
                    if (allSaveData[i].world == 1 && currentZone != -1) graphData[graphData.length - 1].data.push(0);

                    if (currentZone == -1 || allSaveData[i].world != 1) {
                        var loop = allSaveData[i].world;
                        while (loop > 0) {
                            graphData[graphData.length - 1].data.push(0);
                            loop--;
                        }
                    }
                }
                if (currentZone < allSaveData[i].world && currentZone != -1) {
                    var num = allSaveData[i].overkill;
                    if (num) graphData[graphData.length - 1].data.push(num);
                }
                currentZone = allSaveData[i].world;
            }
            title = "Overkilled Cells";
            yTitle = "Overkilled Cells";
            break;
    }
}
*/

// Custom Function Helpers
function elapsedTime(portal, i) {
    return ((portal.perZoneData.currentTime[i] - portal.portalTime) / 3600000)
}

function dataVarPerHour(dataVar) {
    return function (portal, i) { return portal.perZoneData[dataVar][i] / elapsedTime(portal, i) }
}

function diff(dataVar) {
    return function (portal, i) { return portal.perZoneData[dataVar][i] - portal.perZoneData[dataVar][i - 1] }
}

// Graph(dataVar, universe, selectorText, additionalParams) {
// graphTitle, customFunction, useAccumulator, xTitle, yTitle, formatter, valueSuffix, xminFloor, yminFloor, yType
// The only reason this is an object instead of an array is to make it easier for one function to do a lookup.  yay.
const graphList = Object.fromEntries([
    ["heliumOwned", 1, "Helium - He/Hr", {
        customFunction: dataVarPerHour("heliumOwned")
    }],
    ["heliumOwned", 1, "Helium - Total"],
    //["helife", 1, "HeHr % / LifetimeHe"],
    //["helife", 1, "He % / LifetimeHe"],
    ["fluffy", 1, "Fluffy XP", {
        conditional: () => { return game.global.highestLevelCleared >= 300 },
        customFunction: function (portal, i) {
            return portal.perZoneData.fluffy[i] - portal.perZoneData.fluffy[1]
        }
    }],
    ["fluffy", 1, "Fluffy XP PerHour", {
        conditional: () => { return game.global.highestLevelCleared >= 300 },
        customFunction: (portal, i) => {
            return (portal.perZoneData.fluffy[i] - portal.perZoneData.fluffy[1]) / elapsedTime(portal, i)
        }
    }],
    ["amals", 1, "Amalgamators"],
    ["wonders", 1, "Wonders", {
        conditional: () => { return getGameData.challengeActive() === "Experience" }
    }],
    //["rnhr", 2, "Radon - Rn/Hr"],
    //["rnhr", 2, "Radon - Rn/Hr Normalized"],
    //["radonOwned", 2, "Radon - Total"],
    //["rnlife", 2, "RnHr % / LifetimeRn"],
    //["rnlife", 2, "Rn % / LifetimeRn"],
    ["smithies", 2, "Smithies"],
    //["scruffy", 2, "Scruffy XP"],
    //["scruffy", 2, "Scruffy XP PerHour"],
    ["worshippers", 2, "Worshippers"],
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
    ["voids", false, "Void Map History", {
        graphTitle: "Void Map History (voids finished during the same level acquired are not counted/tracked)",
        yTitle: "Number of Void Maps",
    }],
    ["coord", false, "Coordinations", {
        graphTitle: "Unbought Coordinations",
    }],
    //["nullifium", false, "Nullifium Gained"], // BAR GRAPH
    //["overkill", false, "Overkill Cells"],
    // TODO double check if there's a better way to do time, also convert types or whatever is needed to get these considered durations by highcharts

    /*
        customFunction: (portal, i) => { return diff("zoneTime")(portal, i) }
        customFunction: (portal, i) => { return portal.perZoneData.zoneTime[i] - portal.portalTime }
    */
    ["zoneTime", false, "Clear Time",],
    ["zoneTime", false, "Cumulative Clear Time", {
        useAccumulator: true
    }],
    ["mapbonus", false, "Map Bonus"],
    ["empower", false, "Empower", {
        conditional: () => { return getGameData.challengeActive() === "Daily" && typeof game.global.dailyChallenge.empower !== "undefined" }
    }]
].map(graph => { let data = new Graph(...graph); return [data.selectorText, data] }));

const getGameData = {
    currentTime: () => { return new Date().getTime() },
    world: () => { return game.global.world },
    challengeActive: () => { return game.global.challengeActive },
    voids: () => { return game.global.totalVoidMaps },
    nullifium: () => { return recycleAllExtraHeirlooms(true) },
    coord: () => { return game.upgrades.Coordination.allowed - game.upgrades.Coordination.done },
    overkill: () => { return GraphsVars.OVKcellsInWorld },
    zoneTime: () => { return new Date().getTime() - game.global.zoneStarted },
    mapbonus: () => { return game.global.mapBonus },
    empower: () => { return game.global.challengeActive == "Daily" && typeof game.global.dailyChallenge.empower !== "undefined" ? game.global.dailyChallenge.empower.stacks : 0 },
    lastwarp: () => { return game.global.lastWarp },
    essence: () => { return game.global.spentEssence + game.global.essence },
    heliumOwned: () => { return game.resources.helium.owned },
    hehr: () => { return getPercent.toFixed(4) },
    helife: () => { return lifetime.toFixed(4) },
    magmite: () => { return game.global.magmite },
    magmamancers: () => { return game.jobs.Magmamancer.owned },
    fluffy: () => { return game.global.fluffyExp },
    nursery: () => { return game.buildings.Nursery.purchased },
    amals: () => { return game.jobs.Amalgamator.owned },
    wonders: () => { return game.challenges.Experience.wonders },
    scruffy: () => { return game.global.fluffyExp2 },
    smithies: () => { return game.buildings.Smithy.owned },
    radonOwned: () => { return game.resources.radon.owned },
    rnhr: () => { return RgetPercent.toFixed(4) },
    rnlife: () => { return Rlifetime.toFixed(4) },
    worshippers: () => { return game.jobs.Worshipper.owned },
    bonfires: () => { return game.challenges.Hypothermia.bonfires },
    embers: () => { return game.challenges.Hypothermia.embers },
    cruffys: () => { return game.challenges.Nurture.level },
    universe: () => { return game.global.universe },
    portalTime: () => { return game.global.portalTime },
    s3: () => { return game.global.lastRadonPortal },
    // TODO These should be derivable at graph-time rather than stored
    //var getPercent = (game.stats.heliumHour.value() / (game.global.totalHeliumEarned - (game.global.heliumLeftover + game.resources.helium.owned))) * 100;
    //var lifetime = (game.resources.helium.owned / (game.global.totalHeliumEarned - game.resources.helium.owned)) * 100;
    //var RgetPercent = (game.stats.heliumHour.value() / (game.global.totalRadonEarned - (game.global.radonLeftover + game.resources.radon.owned))) * 100;
    //var Rlifetime = (game.resources.radon.owned / (game.global.totalRadonEarned - game.resources.radon.owned)) * 100;
}

// TODO save these in their own localstorage
//this.perZoneData.universeSelection[world] = document.getElementById('universeSelection').options[document.getElementById('universeSelection').options.selectedIndex].value
//this.perZoneData.u1graphSelection[world] = document.getElementById('u1graphSelection').options[document.getElementById('u1graphSelection').options.selectedIndex].value
//this.perZoneData.u2graphSelection[world] = document.getElementById('u2graphSelection').options[document.getElementById('u2graphSelection').options.selectedIndex].value

function Portal() {
    this.universe = getGameData.universe();
    this.totalPortals = getTotalPortals(true);
    this.portalTime = getGameData.portalTime();
    this.challenge = getGameData.challengeActive() === 'Daily'
        ? getCurrentChallengePane().split('.')[0].substr(13).slice(0, 16) // names dailies by their start date, only moderately cursed
        : getGameData.challengeActive();
    this.s3 = getGameData.s3(); // TODO would be nice to only save this in U2... 
    this.perZoneData = Object.fromEntries(Object.values(graphList)
        .filter((graph) =>
            (graph.universe == this.universe || !graph.universe) // only save data relevant to the current universe
            && graph.conditional()) // and for relevant challenges
        .map(graph => [graph.dataVar, []])
        .concat([["world", []], ["currentTime", []]]) // I love []]])
    );
    this.update = function () {
        const world = getGameData.world();
        for (const [name, data] of Object.entries(this.perZoneData)) {
            data[world] = getGameData[name]();
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

// TODO put this into GRAPHSETTINGS so we can save it
var rememberSelectedVisible = [];
function saveSelectedGraphs() {
    rememberSelectedVisible = [];
    for (var b, a = 0; a < chart1.series.length; a++) (b = chart1.series[a]), (rememberSelectedVisible[a] = b.visible);
}
function applyRememberedSelections() {
    for (var b, a = 0; a < chart1.series.length; a++) (b = chart1.series[a]), !1 == rememberSelectedVisible[a] && b.hide();
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

function autoToggleGraph() {
    // TODO 
    game.options.displayed && toggleSettingsMenu();
    var a = document.getElementById("autoSettings");
    a && "block" === a.style.display && (a.style.display = "none");
    var a = document.getElementById("autoTrimpsTabBarMenu");
    a && "block" === a.style.display && (a.style.display = "none");
    var b = document.getElementById("graphParent");
    "block" === b.style.display ? (b.style.display = "none") : ((b.style.display = "block")); // , displayGraph()
}
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
        1 != game.options.menu.hotkeys.enabled || game.global.preMapsActive || game.global.lockTooltip || ctrlPressed || heirloomsShown || 27 != a.keyCode || escapeATWindows();
    },
    true
);

// Up to date (ish)
function pushData() {
    debug("Starting Zone " + getGameData.world(), "graphs");
    const portalID = `u${getGameData.universe()} p${getTotalPortals(true)}`
    if (!portalSaveData[portalID]) {
        portalSaveData[portalID] = new Portal();
    }
    portalSaveData[portalID].update();
    //clearData(10); // TODO this value should be different now wheee
    // TODO OH GOD DON'T FORCE SAVES TO LOCALSTORAGE UNLESS DATA HAS CHANGED
    // Alternately, could we please wrap the <change zone> function instead of running on a timer?
    safeSetItems("portalSaveData", JSON.stringify(portalSaveData));
    showHideUnusedGraphs();
}

//TODO update to new data var
// Much of this is now handled by conditional collection of data,
// everything should be able to be simplified down to 'do we have any of this data?'

function showHideUnusedGraphs() {
    return; // TODO TEMP DISABLE
    // Hide challenge graphs that are not in the saved data
    const graphedChallenges = [...new Set(allSaveData.map((data) => data = data.challenge))];
    const perChallengeGraphs = {
        Hypothermia: { graphs: ["Bonfires", "Embers"], universe: "u2" },
        Nurture: { graphs: ["Cruffys"], universe: "u2" },
        Experience: { graphs: ["Wonders"], universe: "u1" }
    };
    for (const [challenge, data] of Object.entries(perChallengeGraphs)) {
        const graphs = data.graphs;
        const style = graphedChallenges.includes(challenge) ? "" : "none";
        graphs.forEach((graph) => { document.querySelector(`#${data.universe}graphSelection [value=${graph}]`).style.display = style; })
    }
    // Hide specific graphs that are constant (either not unlocked yet, or maxed)
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

//TODO figure out why and where these are needed
var GraphsVars = {};
function InitGraphsVars() {
    GraphsVars.currentPortal = 0;
    GraphsVars.OVKcellsInWorld = 0;
    GraphsVars.currentworld = 0;
    GraphsVars.aWholeNewWorld = !1;
    GraphsVars.aWholeNewPortal = 0;
    GraphsVars.currentPortal = 0;
    /*
    if (allSaveData.length > 0) {
        // TODO are these three vars seriously saved on every single zone just to keep them in memory?  Put them in their own settings in localstorage ffs
        if (allSaveData[allSaveData.length - 1].universeSelection !== undefined)
            document.getElementById('universeSelection').value = allSaveData[allSaveData.length - 1].universeSelection
        if (allSaveData[allSaveData.length - 1].u1graphSelection !== undefined)
            document.getElementById('u1graphSelection').value = allSaveData[allSaveData.length - 1].u1graphSelection
        if (allSaveData[allSaveData.length - 1].u2graphSelection !== undefined)
            document.getElementById('u2graphSelection').value = allSaveData[allSaveData.length - 1].u2graphSelection
    }
    */
};

// TODO unravel mess of GraphVars
function gatherInfo() {
    if (game.options.menu.pauseGame.enabled) return;
    initializeData();
    const world = getGameData.world();
    GraphsVars.aWholeNewPortal = GraphsVars.currentPortal != getTotalPortals(true);
    if (GraphsVars.aWholeNewPortal) {
        GraphsVars.currentPortal = getTotalPortals(true);
    }
    GraphsVars.aWholeNewWorld = GraphsVars.currentworld != world;
    if (GraphsVars.aWholeNewWorld) {
        GraphsVars.currentworld = world;
        // TODO the most awful short circuit, this is 100% awful and is only here because I want to take the update off a setInterval and on to a wrapper
        pushData();
        //if (allSaveData.length > 0 && allSaveData[allSaveData.length - 1].world != world) {
        //}
        GraphsVars.OVKcellsInWorld = 0;

    }
    if (game.options.menu.overkillColor.enabled == 0) toggleSetting("overkillColor");
    if (game.options.menu.liquification.enabled && game.talents.liquification.purchased && !game.global.mapsActive && game.global.gridArray && game.global.gridArray[0] && game.global.gridArray[0].name == "Liquimp")
        GraphsVars.OVKcellsInWorld = 100;
    else GraphsVars.OVKcellsInWorld = document.getElementById("grid").getElementsByClassName("cellColorOverkill").length;
}

function loadGraphData() {
    loadedData = JSON.parse(localStorage.getItem("portalSaveData"));
    if (loadedData !== null) {
        console.log("Graphs: Found portalSaveData")
        for (const [portalID, portalData] of Object.entries(loadedData)) {
            portalSaveData[portalID] = new Portal();
            // this seems awkward? 
            for (const [k, v] of Object.entries(portalData)) {
                portalSaveData[portalID][k] = v;
            }
        }
    }
    MODULES.graphs = {}
    MODULES.graphs.useDarkAlways = false
}

var portalSaveData = {}
loadGraphData();
init()
InitGraphsVars();
var lastTheme = -1;
setInterval(gatherInfo, 100);