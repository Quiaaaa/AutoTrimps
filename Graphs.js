function safeLocalStorage(name, data) {
  try {
    if (name === "portalDataCurrent") {
      // save at most every 450ms. Stringify is too expensive to run at max speed in timewarp, but still save every zone in liq otherwise
      if ((new Date() - lastSave) / 450 < 1) return
      else lastSave = new Date();
    }
    if (typeof data != "string") data = JSON.stringify(data);
    localStorage.setItem(name, data);
  } catch (e) {
    if (e.code == 22 || e.code == 1014) { // 
      // Storage full, delete oldest portal from history, and try again
      delete portalSaveData[Object.keys(portalSaveData)[0]];
      savePortalData(true);
      safeLocalStorage(name, data)
      console.debug("AT Graphs Error: LocalStorage is full. Automatically deleting a graph to clear up space.", e.code, e);
    }
  }
}

// Save Portal Data to history, or current only
function savePortalData(saveAll = true) {
  var currentPortal = getportalID();
  if (saveAll) {
    safeLocalStorage("portalDataHistory", LZString.compressToBase64(JSON.stringify(portalSaveData)))
  }
  else {
    let portalObj = {}
    portalObj[currentPortal] = portalSaveData[currentPortal];
    safeLocalStorage("portalDataCurrent", portalObj)
  }
}

// Save settings, with or without updating a key
function saveSetting(key, value) {
  if (key !== null && value !== null) GRAPHSETTINGS[key] = value;
  safeLocalStorage("GRAPHSETTINGS", GRAPHSETTINGS);
}

// Create all of the UI elements and load in scripts needed
// TODO reduce screaming
function init() {
  var head = document.getElementsByTagName("head")[0]

  var chartscript = document.createElement("script");
  chartscript.type = "text/javascript";
  chartscript.src = "https://code.highcharts.com/highcharts.js";
  head.appendChild(chartscript);

  var graphsButton = document.createElement("TD");
  graphsButton.appendChild(document.createTextNode("Graphs"))
  graphsButton.setAttribute("class", "btn btn-default")
  graphsButton.setAttribute("onclick", "autoToggleGraph(); drawGraph(); swapGraphUniverse();");

  var settingbarRow = document.getElementById("settingsTable").firstElementChild.firstElementChild;
  settingbarRow.insertBefore(graphsButton, settingbarRow.childNodes[10])

  document.getElementById("settingsRow").innerHTML += `
        <div id="graphParent" style="display: none; height: 600px; overflow: auto; position: relative;">
            <div id="graph" style="margin-bottom: 10px;margin-top: 5px; height: 530px;"></div>
            <div id="graphFooter" style="height: 50px;font-size: 1em;">
                <div id="graphFooterLine1" style="display: -webkit-flex;flex: 0.75;flex-direction: row; height:30px;"></div>
                <div id="graphFooterLine2"></div>
            </div>
        </div>
        `;

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
    <div style="flex:0 100 5%;"></div>
    <div><input type="checkbox" id="clrChkbox" onclick="toggleClearButton();"></div>
    <div style="margin-left: 0.5vw;">
      <button id="clrAllDataBtn" onclick="clearData(null,true); drawGraph();" class="btn" disabled="" style="flex:auto; padding: 2px 6px;border: 1px solid white;">
        Clear All Previous Data</button></div>
    <div style="flex:0 100 5%;"></div>
    <div style="flex:0 2 3.5vw;"><input style="width:100%;min-width: 40px;" id="deleteSpecificTextBox"></div>
    <div style="flex:auto; margin-left: 0.5vw;"><button onclick="deleteSpecific(); drawGraph();">Delete Specific Portal</button></div>
    <div style="float:right; margin-right: 0.5vw;"><button onclick="toggleSpecificGraphs()">Invert Selection</button></div>
    <div style="float:right; margin-right: 1vw;"><button onclick="toggleAllGraphs()">All Off/On</button></div>`

  // AAAAAAAAAAAAAAAAAAAAAAAAAAAA (Setting the inner HTML of the parent element resets the value of these? what the fuck)
  document.querySelector("#universeSelection").value = GRAPHSETTINGS.universeSelection
  document.querySelector("#u1graphSelection").value = GRAPHSETTINGS.u1graphSelection
  document.querySelector("#u2graphSelection").value = GRAPHSETTINGS.u2graphSelection

  let tipsText = `
    You can zoom by dragging a box around an area. You can turn portals off by clicking them on the legend. 
    Quickly view the last portal by clicking it off, then Invert Selection. Or by clicking All Off, then clicking the portal on. 
    To delete a portal, Type its portal number in the box and press Delete Specific. 
    Using negative numbers in the Delete Specific box will KEEP that many portals (starting counting backwards from the current one), 
    ie: if you have Portals 1000-1015, typing -10 will keep 1005-1015."
    `
  document.getElementById("graphFooterLine2").innerHTML += `
    <span style="float: left;" onmouseover=\'tooltip("Tips", "customText", event, "${tipsText}")\' onmouseout=\'tooltip("hide")\'>Tips: Hover for usage tips.</span>
    <input onclick="toggleDarkGraphs()" style="height: 20px; float: right; margin-right: 0.5vw;" type="checkbox" id="blackCB">
    <span style="float: right; margin-right: 0.5vw;">Black Graphs:</span>`;

  // Add a header with negative float hanging down on the top of the graph, for toggle buttons
  var toggleDiv = document.createElement("div");
  toggleDiv.id = "toggleDiv";
  toggleDiv.setAttribute("style", "position: absolute; top: 1rem; left: 3rem; z-index: 1;")
  toggleDiv.innerText = ""
  document.querySelector("#graphParent").appendChild(toggleDiv);

  // Handle Dark Graphs?  Old code
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

// Graph constructor 
function Graph(dataVar, universe, selectorText, additionalParams = {}) {
  // graphTitle, customFunction, useAccumulator, xTitle, yTitle, formatter, xminFloor, yminFloor, yType
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
  this.xminFloor = 1;
  this.yminFloor;
  this.yType = "Linear";
  this.graphData = [];
  this.typeCheck = "number"
  this.conditional = () => { return true };
  for (const [key, value] of Object.entries(additionalParams)) {
    this[key] = value;
  }
  this.baseGraphTitle = this.graphTitle;

  // create an object to pass to Highcharts.Chart
  this.createHighChartsObj = function () {
    // TODO BUGS Max values sometimes clip
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
      colors: ["#e60049", "#0bb4ff", "#50e991", "#e6d800", "#9b19f5", "#ffa300", "#dc0ab4", "#b3d4ff", "#00bfa0"],
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
        labels: {
          formatter: function () {
            // These are Trimps format functions for durations(modified) and numbers, respectively
            if (this.dateTimeLabelFormat) return formatDuration(this.value / 1000)
            else return prettify(this.value);
          }
        }
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
    if (this.graphType == "line") this.lineGraph();
    if (this.graphType == "column") this.columnGraph();
    this.formatter = this.formatter
      || function () {
        var ser = this.series; // 'this' being the highcharts object that uses formatter()
        return '<span style="color:' + ser.color + '" >●</span> ' + ser.name + ": <b>" + prettify(this.y) + "</b><br>";
      };
    saveSelectedGraphs();
    chart1 = new Highcharts.Chart(this.createHighChartsObj());
    applyRememberedSelections();
  }
  // prepares data series for Highcharts, and optionally transforms it with toggled options, customFunction and/or useAccumulator
  this.lineGraph = function () {
    var item = this.dataVar;
    this.graphData = [];
    this.graphTitle = this.baseGraphTitle;
    var maxS3 = Math.max(...Object.values(portalSaveData).map((portal) => portal.s3).filter((s3) => s3));
    if (this.toggles) {
      // create save space for the toggles if they don't exist
      if (GRAPHSETTINGS.toggles[this.selectorText] === undefined) { GRAPHSETTINGS.toggles[this.selectorText] = {} }
      this.toggles.forEach((toggle) => {
        if (GRAPHSETTINGS.toggles[this.selectorText][toggle] === undefined) { GRAPHSETTINGS.toggles[this.selectorText][toggle] = false }
      })
      // change the graph title per toggle
      if (GRAPHSETTINGS.toggles[this.selectorText].perHr) { this.graphTitle += " / Hour" }
      if (GRAPHSETTINGS.toggles[this.selectorText].lifetime) { this.graphTitle += " % of Lifetime Total" }
      if (GRAPHSETTINGS.toggles[this.selectorText].s3normalized) { this.graphTitle += `, Normalized to z${maxS3} S3` }
    }
    // parse data per portal
    for (const portal of Object.values(portalSaveData)) {
      if (!(item in portal.perZoneData)) continue; // ignore blank
      if (portal.universe != GRAPHSETTINGS.universeSelection) continue; // ignore inactive universe
      let cleanData = [];
      // parse the requested datavar
      for (const index in portal.perZoneData[item]) {
        let x = portal.perZoneData[item][index];
        let time = portal.perZoneData.currentTime[index];
        if (typeof this.customFunction === "function") {
          x = this.customFunction(portal, index);
          if (x < 0) x = null;
        }
        // TOGGLES
        if (this.toggles) {
          // Apply the toggled functions to the data
          for (const [toggle, bool] of Object.entries(GRAPHSETTINGS.toggles[this.selectorText])) {
            if (!bool) continue;
            switch (toggle) {
              case "perHr": {
                x = x / ((time - portal.portalTime) / 3600000)
                break;
              }
              case "lifetime": {
                let initial;
                if (item == "heliumOwned") initial = portal.totalHelium;
                if (item == "radonOwned") initial = portal.totalRadon;
                if (!initial) {
                  debug("Attempted to calc lifetime percent of an unknown type:" + item);
                  continue;
                }
                x = x / initial
                break
              }
              case "s3normalized": {
                x = x / 1.03 ** portal.s3 * 1.03 ** maxS3
                break;
              }
            }
          }
        }

        if (this.useAccumulator) x += cleanData.length === 0 ? 0 : cleanData.at(-1); // never used, leaving it in just in case
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
    // future use: test for datavar in portal, or in perZoneData, if you ever want to make column graphs based on max(perZoneData)
    for (const portal of Object.values(portalSaveData)) {
      if (portal.universe == GRAPHSETTINGS.universeSelection) {
        cleanData.push([portal.totalPortals, portal[item]])
      }
    }
    this.graphData.push({
      name: this.yTitle,
      data: cleanData,
      type: "column",
    });
  }
}

// returns _d _h _m _s or _._s
function formatDuration(timeSince) {
  let timeObj = {
    d: Math.floor(timeSince / 86400),
    h: Math.floor(timeSince / 3600) % 24,
    m: Math.floor(timeSince / 60) % 60,
    s: Math.floor(timeSince % 60),
  }
  let milliseconds = Math.floor(timeSince % 1 * 10)
  let timeString = "";
  let unitsUsed = 0
  for (const [unit, value] of Object.entries(timeObj)) {
    if (value === 0 && timeString === "") continue;
    unitsUsed++;
    if (value) timeString += value.toString() + unit + " ";
  }
  if (unitsUsed <= 1) {
    timeString = [timeObj.s.toString().padStart(1, "0"), milliseconds.toString(), "s"].join(".");
  }
  return timeString
}

// Show/hide the universe-specific graph selectors
function swapGraphUniverse() {
  let universe = GRAPHSETTINGS.universeSelection;
  let active = `u${universe}`
  let inactive = `u${universe == 1 ? 2 : 1}`
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
  // TOGGLES
  function makeCheckbox(graph, toggle) {
    // create checkbox element labeled with the toggle
    var container = document.createElement("span")
    var checkbox = document.createElement("input");
    var label = document.createElement("span");

    container.style.padding = "0rem .5rem";

    checkbox.type = "checkbox";
    checkbox.id = toggle;
    // initialize the checkbox to saved value
    checkbox.checked = GRAPHSETTINGS.toggles[graph][toggle];
    // set saved value on change, and update the graph
    checkbox.setAttribute("onclick", `GRAPHSETTINGS.toggles.${graph}.${toggle} = this.checked; drawGraph();`);

    label.innerText = toggle;

    container.appendChild(checkbox)
    container.appendChild(label)
    return container;
  }
  pushData(); // update current zone data on request
  let universe = GRAPHSETTINGS.universeSelection;
  let selectedGraph = document.getElementById(`u${universe}graphSelection`);
  if (selectedGraph.value) {
    // draw the graph
    let graph = lookupGraph(selectedGraph.value);
    graph.updateGraph();
    // create toggle elements
    toggleDiv = document.querySelector("#toggleDiv")
    toggleDiv.innerHTML = "";
    if (graph.toggles) {
      for (const toggle of graph.toggles) {
        toggleDiv.appendChild(makeCheckbox(graph.selectorText, toggle))
      }
    }
  }
  showHideUnusedGraphs();
}

// Stores and updates data for an individual portal
function Portal() {
  this.universe = getGameData.universe();
  this.totalPortals = getTotalPortals();
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
  // create an object to collect only the relevant data per zone
  this.perZoneData = Object.fromEntries(graphList.filter((graph) =>
    (graph.universe == this.universe || !graph.universe) // only save data relevant to the current universe
    && graph.conditional() && graph.dataVar) // and for relevant challenges, with datavars 
    .map(graph => [graph.dataVar, []]) // create data structure
    .concat([["currentTime", []]]) // always graph time
  );
  // update per zone data and special totals
  this.update = function () {
    const world = getGameData.world();
    // TODO Nu is a rather fragile stat, assumes recycling everything on portal. Max throughout the run makes it slightly less crappy.
    // It would be better to store an initial value, and compare to final value + recycle value
    this.totalNullifium = Math.max(this.totalNullifium, getGameData.nullifium());
    this.totalVoidMaps = getGameData.totalVoids();
    for (const [name, data] of Object.entries(this.perZoneData)) {
      data[world] = getGameData[name]();
      if (world + 1 < data.length) { // FENCEPOSTING
        data.splice(world + 1) // trim 'future' zones on reload
      }
    }
  }
}

function clearData(keepN, clrall = false) {
  let currentPortalNumber = getTotalPortals();
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
  savePortalData(true)
  showHideUnusedGraphs();
}

function deleteSpecific() {
  let portalNum = Number(document.getElementById("deleteSpecificTextBox").value);
  if (portalNum > 0)
    if (0 > parseInt(portalNum)) clearData(Math.abs(portalNum));
    else {
      for (const [portalID, portalData] of Object.entries(portalSaveData)) {
        if (portalData.totalPortals === portalNum) delete portalSaveData[portalID];
      }
    }
  savePortalData(true)
  showHideUnusedGraphs();
}

// ####### Here begins old code
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
// ####### end scary old code

// Graph Selection 

function saveSelectedGraphs() {
  if (!chart1) return;
  for (let i = 0; i < chart1.series.length; i++) {
    GRAPHSETTINGS.rememberSelected[i] = chart1.series[i].visible;
  }
  saveSetting();
}
function applyRememberedSelections() {
  for (let i = 0; i < chart1.series.length; i++) {
    if (!GRAPHSETTINGS.rememberSelected[i]) { chart1.series[i].hide(); }
  }
}
function toggleSpecificGraphs() {
  for (const chart of chart1.series) {
    chart.visible ? chart.hide() : chart.show();
  }
}
// toggle all graphs to the opposite of the average visible/hidden state
function toggleAllGraphs() {
  let visCount = 0;
  chart1.series.forEach(chart => visCount += chart.visible)
  for (const chart of chart1.series) {
    visCount > chart1.series.length / 2 ? chart.hide() : chart.show();
  }
}

// MORE SCARY OLD CODE
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

// ####### end scary old code

function getportalID() { return `u${getGameData.universe()} p${getTotalPortals()}` }

function pushData() {
  //debug("Starting Zone " + getGameData.world(), "graphs");
  const portalID = getportalID();
  if (!portalSaveData[portalID] || getGameData.world() === 1) { // reset portal data if restarting a portal
    savePortalData(true) // save old portal to history
    portalSaveData[portalID] = new Portal();
  }
  portalSaveData[portalID].update();
  clearData(50); // Safety value, probably too high
  savePortalData(false) // save current portal
}

// Hide graphs that have no collected data
function showHideUnusedGraphs() {
  for (const graph of graphList) {
    let style = "none"
    if (graph.graphType != "line") continue;
    const universes = graph.universe ? [graph.universe] : [1, 2]
    for (const universe of universes) {
      for (portal of Object.values(portalSaveData)) {
        if (portal.perZoneData[graph.dataVar] && portal.universe == universe  // has collected data, in the right universe
          && portal.perZoneData[graph.dataVar].some((z) => { return !(z === 0 || z === null) })) { // and there is nonzero data
          style = ""
          break;
        }
      }
      document.querySelector(`#u${universe}graphSelection [value="${graph.selectorText}"]`).style.display = style;
    }
  }
}

function loadGraphData() {
  var loadedData = LZString.decompressFromBase64(localStorage.getItem("portalDataHistory"));
  var currentPortal = JSON.parse(localStorage.getItem("portalDataCurrent"));
  if (loadedData != "") {
    var loadedData = JSON.parse(loadedData);
    if (currentPortal) { loadedData[Object.keys(currentPortal)[0]] = Object.values(currentPortal)[0] }
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


// Custom Function Helpers
// diff between x and x-1, or x and initial
function diff(dataVar, initial) {
  return function (portal, i) {
    let e1 = portal.perZoneData[dataVar][i];
    let e2 = initial ? initial : portal.perZoneData[dataVar][i - 1];
    if (e1 === null || e2 === null) return null;
    return e1 - e2
  }
}

const formatters = {
  datetime: function () {
    let ser = this.series;
    return '<span style="color:' + ser.color + '" >●</span> ' + ser.name + ": <b>" + formatDuration(this.y / 1000) + "</b><br>";
  },
}

// Create all the Graph objects
// Graph(dataVar, universe, selectorText, additionalParams)
// additionalParams == graphTitle, conditional, customFunction, useAccumulator, toggles, xTitle, yTitle, formatter

// To add a new graph, add it to graphList with the desired options,
// If using a new dataVar, add that to getGameData

// Toggles are perHr, lifetime, s3normalized
// To make a new toggle, add the switch case and title mod to Graph.lineGraph

const graphList = [
  // U1 Graphs
  ["heliumOwned", 1, "Helium", {
    toggles: ["perHr", "lifetime"]
  }],
  ["fluffy", 1, "Fluffy", {
    graphTitle: "Fluffy Exp",
    conditional: () => { return getGameData.u1hze() >= 300 && getGameData.fluffy() < 3415819248011889 }, // pre unlock, post E10L10
    customFunction: (portal, i) => { return diff("fluffy", portal.initialFluffy)(portal, i) },
    toggles: ["perHr"]
  }],
  ["amals", 1, "Amalgamators"],
  ["wonders", 1, "Wonders", {
    conditional: () => { return getGameData.challengeActive() === "Experience" }
  }],

  // U2 Graphs
  ["radonOwned", 2, "Radon", {
    toggles: ["perHr", "lifetime", "s3normalized"]
  }],
  ["scruffy", 2, "Scruffy", {
    graphTitle: "Scruffy Exp",
    customFunction: (portal, i) => { return diff("scruffy", portal.initialScruffy)(portal, i) },
    toggles: ["perHr"]
  }],
  ["worshippers", 2, "Worshippers", {
    conditional: () => { return getGameData.u2hze() >= 50 }
  }],
  ["smithies", 2, "Smithies"],
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
  [false, false, "Nullifium Gained", {
    portalVar: "totalNullifium",
    graphType: "column",
  }],
  ["coord", false, "Coordinations", {
    graphTitle: "Unbought Coordinations",
  }],
  ["overkill", false, "Overkill Cells", {
    // Overkill unlock zones (roughly)
    conditional: () => {
      return ((getGameData.universe() == 1 && getGameData.u1hze() >= 170)
        || getGameData.universe() == 2 && getGameData.u2hze() >= 201)
    }
  }],
  ["currentTime", false, "Clear Time", {
    customFunction: (portal, i) => { return Math.round(diff("currentTime")(portal, i) / 100) * 100 },
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
  u1hze: () => { return game.global.highestLevelCleared },
  u2hze: () => { return game.global.highestRadonLevelCleared },
}

// Global vars
var chart1;
var lastSave = new Date()
var GRAPHSETTINGS = {
  universeSelection: 1,
  u1graphSelection: null,
  u2graphSelection: null,
  rememberSelected: [],
  toggles: {}
}
var portalSaveData = {}

// load and initialize the UI
loadGraphData();
init()
showHideUnusedGraphs()
var lastTheme = -1;


// Wrap the Trimps function for transitioning zones to avoid data loss
var originalnextWorld = nextWorld;
nextWorld = function () {
  try {
    if (game.options.menu.pauseGame.enabled) return;
    if (null === portalSaveData) portalSaveData = {};
    if (getGameData.world()) { pushData(); }
  }
  catch (e) {
    debug("Gather info failed: " + e)
  }
  originalnextWorld(...arguments);
}

// Wrap portal function to update on end of run
var originalactivatePortal = activatePortal;
activatePortal = function () {
  try {
    pushData();
  }
  catch (e) {
    debug("Gather info failed: " + e)
  }
  originalactivatePortal(...arguments)
}