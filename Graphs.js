const Graphs = {
	Backend: {
		_lastSave: new Date(),
		_safeLocalStorage: function (name, data) {
			try {
				if (name === "portalDataCurrent") {
					// save at most every 450ms. Stringify is too expensive to run at max speed in timewarp, but still save every zone in liq otherwise
					if ((new Date() - this._lastSave) / 450 < 1) return;
					else this._lastSave = new Date();
				}
				if (typeof data != "string") data = JSON.stringify(data);
				localStorage.setItem(name, data);
			} catch (e) {
				if (e.code == 22 || e.code == 1014) { //
					// Storage full, delete oldest 10 portals from history, and try again
					console.debug(`Deleting oldest 10 portals ${Object.keys(Graphs.portalSaveData)[0]} - ${Object.keys(Graphs.portalSaveData)[10]}`);
					var delCount = 10;
					for (var i = 0; i < delCount; i++) {
						delete Graphs.portalSaveData[Object.keys(Graphs.portalSaveData)[i]];
					}
					this.savePortalData(true, true); // force a blocking save
					console.warn(`Ran out of Local Storage, consider lowering your saved portals to something under ${Object.keys(Graphs.portalSaveData).length}`);
				}
			}
		},

		// create a fake url for our compression webworker to live at. This is so cursed. (getting around cross-source issues with -monkey)
		_compressionUrl: URL.createObjectURL(new Blob([`
  		var LZString = function () { var r = String.fromCharCode, o = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=", n = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+-$", e = {}; function t(r, o) { if (!e[r]) { e[r] = {}; for (var n = 0; n < r.length; n++)e[r][r.charAt(n)] = n } return e[r][o] } var i = { compressToBase64: function (r) { if (null == r) return ""; var n = i._compress(r, 6, function (r) { return o.charAt(r) }); switch (n.length % 4) { default: case 0: return n; case 1: return n + "==="; case 2: return n + "=="; case 3: return n + "=" } }, decompressFromBase64: function (r) { return null == r ? "" : "" == r ? null : i._decompress(r.length, 32, function (n) { return t(o, r.charAt(n)) }) }, compressToUTF16: function (o) { return null == o ? "" : i._compress(o, 15, function (o) { return r(o + 32) }) + " " }, decompressFromUTF16: function (r) { return null == r ? "" : "" == r ? null : i._decompress(r.length, 16384, function (o) { return r.charCodeAt(o) - 32 }) }, compressToUint8Array: function (r) { for (var o = i.compress(r), n = new Uint8Array(2 * o.length), e = 0, t = o.length; e < t; e++) { var s = o.charCodeAt(e); n[2 * e] = s >>> 8, n[2 * e + 1] = s % 256 } return n }, decompressFromUint8Array: function (o) { if (null == o) return i.decompress(o); for (var n = new Array(o.length / 2), e = 0, t = n.length; e < t; e++)n[e] = 256 * o[2 * e] + o[2 * e + 1]; var s = []; return n.forEach(function (o) { s.push(r(o)) }), i.decompress(s.join("")) }, compressToEncodedURIComponent: function (r) { return null == r ? "" : i._compress(r, 6, function (r) { return n.charAt(r) }) }, decompressFromEncodedURIComponent: function (r) { return null == r ? "" : "" == r ? null : (r = r.replace(/ /g, "+"), i._decompress(r.length, 32, function (o) { return t(n, r.charAt(o)) })) }, compress: function (o) { return i._compress(o, 16, function (o) { return r(o) }) }, _compress: function (r, o, n) { if (null == r) return ""; var e, t, i, s = {}, u = {}, a = "", p = "", c = "", l = 2, f = 3, h = 2, d = [], m = 0, v = 0; for (i = 0; i < r.length; i += 1)if (a = r.charAt(i), Object.prototype.hasOwnProperty.call(s, a) || (s[a] = f++, u[a] = !0), p = c + a, Object.prototype.hasOwnProperty.call(s, p)) c = p; else { if (Object.prototype.hasOwnProperty.call(u, c)) { if (c.charCodeAt(0) < 256) { for (e = 0; e < h; e++)m <<= 1, v == o - 1 ? (v = 0, d.push(n(m)), m = 0) : v++; for (t = c.charCodeAt(0), e = 0; e < 8; e++)m = m << 1 | 1 & t, v == o - 1 ? (v = 0, d.push(n(m)), m = 0) : v++, t >>= 1 } else { for (t = 1, e = 0; e < h; e++)m = m << 1 | t, v == o - 1 ? (v = 0, d.push(n(m)), m = 0) : v++, t = 0; for (t = c.charCodeAt(0), e = 0; e < 16; e++)m = m << 1 | 1 & t, v == o - 1 ? (v = 0, d.push(n(m)), m = 0) : v++, t >>= 1 } 0 == --l && (l = Math.pow(2, h), h++), delete u[c] } else for (t = s[c], e = 0; e < h; e++)m = m << 1 | 1 & t, v == o - 1 ? (v = 0, d.push(n(m)), m = 0) : v++, t >>= 1; 0 == --l && (l = Math.pow(2, h), h++), s[p] = f++, c = String(a) } if ("" !== c) { if (Object.prototype.hasOwnProperty.call(u, c)) { if (c.charCodeAt(0) < 256) { for (e = 0; e < h; e++)m <<= 1, v == o - 1 ? (v = 0, d.push(n(m)), m = 0) : v++; for (t = c.charCodeAt(0), e = 0; e < 8; e++)m = m << 1 | 1 & t, v == o - 1 ? (v = 0, d.push(n(m)), m = 0) : v++, t >>= 1 } else { for (t = 1, e = 0; e < h; e++)m = m << 1 | t, v == o - 1 ? (v = 0, d.push(n(m)), m = 0) : v++, t = 0; for (t = c.charCodeAt(0), e = 0; e < 16; e++)m = m << 1 | 1 & t, v == o - 1 ? (v = 0, d.push(n(m)), m = 0) : v++, t >>= 1 } 0 == --l && (l = Math.pow(2, h), h++), delete u[c] } else for (t = s[c], e = 0; e < h; e++)m = m << 1 | 1 & t, v == o - 1 ? (v = 0, d.push(n(m)), m = 0) : v++, t >>= 1; 0 == --l && (l = Math.pow(2, h), h++) } for (t = 2, e = 0; e < h; e++)m = m << 1 | 1 & t, v == o - 1 ? (v = 0, d.push(n(m)), m = 0) : v++, t >>= 1; for (; ;) { if (m <<= 1, v == o - 1) { d.push(n(m)); break } v++ } return d.join("") }, decompress: function (r) { return null == r ? "" : "" == r ? null : i._decompress(r.length, 32768, function (o) { return r.charCodeAt(o) }) }, _decompress: function (o, n, e) { var t, i, s, u, a, p, c, l = [], f = 4, h = 4, d = 3, m = "", v = [], g = { val: e(0), position: n, index: 1 }; for (t = 0; t < 3; t += 1)l[t] = t; for (s = 0, a = Math.pow(2, 2), p = 1; p != a;)u = g.val & g.position, g.position >>= 1, 0 == g.position && (g.position = n, g.val = e(g.index++)), s |= (u > 0 ? 1 : 0) * p, p <<= 1; switch (s) { case 0: for (s = 0, a = Math.pow(2, 8), p = 1; p != a;)u = g.val & g.position, g.position >>= 1, 0 == g.position && (g.position = n, g.val = e(g.index++)), s |= (u > 0 ? 1 : 0) * p, p <<= 1; c = r(s); break; case 1: for (s = 0, a = Math.pow(2, 16), p = 1; p != a;)u = g.val & g.position, g.position >>= 1, 0 == g.position && (g.position = n, g.val = e(g.index++)), s |= (u > 0 ? 1 : 0) * p, p <<= 1; c = r(s); break; case 2: return "" }for (l[3] = c, i = c, v.push(c); ;) { if (g.index > o) return ""; for (s = 0, a = Math.pow(2, d), p = 1; p != a;)u = g.val & g.position, g.position >>= 1, 0 == g.position && (g.position = n, g.val = e(g.index++)), s |= (u > 0 ? 1 : 0) * p, p <<= 1; switch (c = s) { case 0: for (s = 0, a = Math.pow(2, 8), p = 1; p != a;)u = g.val & g.position, g.position >>= 1, 0 == g.position && (g.position = n, g.val = e(g.index++)), s |= (u > 0 ? 1 : 0) * p, p <<= 1; l[h++] = r(s), c = h - 1, f--; break; case 1: for (s = 0, a = Math.pow(2, 16), p = 1; p != a;)u = g.val & g.position, g.position >>= 1, 0 == g.position && (g.position = n, g.val = e(g.index++)), s |= (u > 0 ? 1 : 0) * p, p <<= 1; l[h++] = r(s), c = h - 1, f--; break; case 2: return v.join("") }if (0 == f && (f = Math.pow(2, d), d++), l[c]) m = l[c]; else { if (c !== h) return null; m = i + i.charAt(0) } v.push(m), l[h++] = i + m.charAt(0), i = m, 0 == --f && (f = Math.pow(2, d), d++) } } }; return i }(); "function" == typeof define && define.amd ? define(function () { return LZString }) : "undefined" != typeof module && null != module ? module.exports = LZString : "undefined" != typeof angular && null != angular && angular.module("LZString", []).factory("LZString", function () { return LZString });
  		onmessage = function (event) { postMessage(LZString.compressToBase64(event.data)); self.close(); }
			`], { type: 'text/javascript' })),

		savePortalData: function (saveAll = true, forceImmediate) {
			// Save Portal Data to history, or current only
			var currentPortal = Graphs.getportalID();
			if (saveAll) {
				try {
					if (typeof window.Worker === 'function' && !forceImmediate) {
						worker = new Worker(this._compressionUrl);
						worker.onmessage = this._recievedCompressedSave;
						worker.postMessage(JSON.stringify(Graphs.portalSaveData));
					}
					else {
						console.debug("Fallback to non-webworker");
						this._safeLocalStorage("portalDataHistory", LZString.compressToBase64(JSON.stringify(Graphs.portalSaveData)));
					}
				}
				catch (e) {
					console.debug("Error saving graph history", e.code, e);
				}
			}
			else {
				var portalObj = {};
				portalObj[currentPortal] = Graphs.portalSaveData[currentPortal];
				this._safeLocalStorage("portalDataCurrent", portalObj);
			}
		},

		_recievedCompressedSave: function (event) {
			var saveString = event.data;
			Graphs.Backend._safeLocalStorage("portalDataHistory", saveString);
			console.debug("Successfully used a webworker to save graph data");
		},

		saveSetting: function (key, value) {
			// Save settings, with or without updating a key
			if (key !== null && value !== null) Graphs.Settings[key] = value;
			this._safeLocalStorage("GRAPHSETTINGS", Graphs.Settings);
		},

		_safeLoad: function (storagekey, compressed) {
			var input = localStorage.getItem(storagekey);
			if (input) {
				if (compressed) input = LZString.decompressFromBase64(input);
				try {
					var out = JSON.parse(input);
					if (out && Object.entries(out).length > 0) return out;
				}
				catch (e) {
					console.error("Failed to load Graph history", e);
				}
			}
			return null;
		},

		loadGraphData: function () {
			var loadedData = this._safeLoad("portalDataHistory", true)
			var currentPortal = this._safeLoad("portalDataCurrent")
			if (loadedData) {
				if (currentPortal) { loadedData[Object.keys(currentPortal)[0]] = Object.values(currentPortal)[0] }
				// remake object structure
				for (const [portalID, portalData] of Object.entries(loadedData)) {
					Graphs.portalSaveData[portalID] = new Graphs.Portal();
					try {
						for (const [k, v] of Object.entries(portalData)) {
							Graphs.portalSaveData[portalID][k] = v;
						}
					}
					catch (e) {
						console.log(`Error on loading ${portalID}`, portalData)
					}
				}
			}
			var loadedSettings = this._safeLoad("GRAPHSETTINGS")
			if (loadedSettings !== null) {
				for (const [k, v] of Object.entries(loadedSettings)) {
					Graphs.Settings[k] = v;
				}
			}
			// initialize save space for the toggles
			if (Graphs.Settings.toggles == null) Graphs.Settings.toggles = {};
			for (const graph of GraphsConfig.graphList) {
				if (graph.toggles) {
					if (Graphs.Settings.toggles[graph.id] === undefined) { Graphs.Settings.toggles[graph.id] = {} }
					graph.toggles.forEach((toggle) => {
						if (Graphs.Settings.toggles[graph.id][toggle] === undefined) { Graphs.Settings.toggles[graph.id][toggle] = false }
					})
				}
			}
			Graphs.Settings.open = false;
		},

		importGraphs: function () {
			var currentdata = localStorage.portalDataHistory; // make a backup
			// get user input and put it in localstorage
			var exportArea = document.getElementById("exportArea")
			var data = exportArea.value;
			localStorage.portalDataHistory = data;
			Graphs.portalSaveData = {} // wipe old data
			try {
				this.loadGraphData();
			}
			catch (e) {
				exportArea.innerHTML = "Error loading graph data, are you sure that was what you wanted to paste?"
				console.log(e)
				localStorage.portalDataHistory = currentdata
				this.loadGraphData()
			}
		},

		clearData: function (keepN, clrall = false) {
			// TODO it is awkward as fuck that this works on portal number, when IDs are universe + portal number.  
			// Fixing that would remove a lot of ugliness here and in deleteSpecific.
			var universe = Graphs.Settings.universeSelection
			var changed = false;
			var currentPortalNumber = getTotalPortals();
			if (clrall) { // delete all but current
				Graphs.debugMsg(`Deleting ${Object.keys(Graphs.portalSaveData).length - 1} Portals, clearall ${clrall}`)
				for (const [portalID, portalData] of Object.entries(Graphs.portalSaveData)) {
					if (portalData.totalPortals != currentPortalNumber && portalData.universe == universe) { // only delete currently selected universe data
						delete Graphs.portalSaveData[portalID];
						changed = true;
					}
				}
			}
			else { // keep keepN portals in selected universe , delete the rest
				var portals = Object.entries(Graphs.portalSaveData).filter((data) => data[1].universe == universe).map((data) => { return data[0] });
				// TODO 100% sure there's a better way than filter().map() but I'm not looking it up right now
				if (keepN < portals.length) Graphs.debugMsg(`Existing Portals (${Object.keys(Graphs.portalSaveData).length}): ${Object.keys(Graphs.portalSaveData)}`)
				while (keepN < portals.length) {
					var current = portals.shift()
					Graphs.debugMsg(`Deleting ${current}, keepn ${keepN}`)
					delete Graphs.portalSaveData[current];
					changed = true;
				}
			}
			if (changed) {
				Graphs.debugMsg("Saving Portal Data after deletions")
				this.savePortalData(true)
				Graphs.UI.showHideUnused();
			}
		},

		deleteSpecific: function () {
			var portalNum = document.getElementById("deleteSpecificTextBox").value
			if (isNaN(parseInt(portalNum))) { // challenge name deletion
				var portalType = portalNum.toLocaleLowerCase()
				if (portalType === "") return; // Don't delete everything with blank input, that would be bad.
				for (const [portalID, portalData] of Object.entries(Graphs.portalSaveData)) {
					if (portalData.challenge.toLocaleLowerCase().includes(portalType) && portalData.universe == Graphs.Settings.universeSelection) { // only delete if in selected universe
						delete Graphs.portalSaveData[portalID];
						Graphs.debugMsg(`Deleting ${portalID}, deleteSpecific`)
					}
				}
			} else {
				portalNum = parseInt(portalNum)
				if (portalNum < 0) { this.clearData(Math.abs(portalNum)); } // keep X portals, delete the rest
				else if (portalNum > 0) { // single portal deletion
					for (const [portalID, portalData] of Object.entries(Graphs.portalSaveData)) {
						if (portalData.totalPortals === portalNum && portalData.universe == Graphs.Settings.universeSelection) { // only delete if in selected universe
							delete Graphs.portalSaveData[portalID];
							Graphs.debugMsg(`Deleting ${portalID}, deleteSpecific`)
						}
					}
				}
			}
			this.savePortalData(true)
			Graphs.UI.showHideUnused();
		}
	},

	UI: {
		_lastTheme: -1,
		importExportGraphsDialog: function () {
			this.escapeATWindows(true) // close graphs... rendering graphs while also having up to 5MB of text on display is a bad time.
			// Code shamelessly lifted from the main game. How much of this is needed?  I'm not going to find out. 
			if (game.global.lockTooltip && event != 'update') return;
			if (game.global.lockTooltip && isItIn && event == 'update') return;
			var elem = document.getElementById("tooltipDiv");
			swapClass("tooltipExtra", "tooltipExtraNone", elem);
			document.getElementById('tipText').className = "";
			var ondisplay = null; // if non-null, called after the tooltip is displayed
			openTooltip = null;

			Graphs.Backend.savePortalData(true, true); // force save
			var saveText = localStorage.portalDataHistory
			var buttonHTML;
			var downloadBlob;
			if (Blob !== null) {
				var blob = new Blob([saveText], { type: 'text/plain' });
				var uri = URL.createObjectURL(blob);
				downloadBlob = uri;
			} else {
				downloadBlob = 'data:text/plain,' + encodeURIComponent(saveText);
			}
			var saveName = `Trimps Graphs ${Object.keys(Graphs.portalSaveData)[0]} - ${Graphs.last(Object.keys(Graphs.portalSaveData))}`;
			tooltipText = "This is your graph data. To Import, paste your data here and then click import.  If you did that and then realized you actually wanted to export, re-open this dialog and then don't do it in that order again. <br/><br/><textarea spellcheck='false' id='exportArea' style='width: 100%' rows='5'>" + saveText + "</textarea>";
			buttonHTML = "<div class='maxCenter'><div id='confirmTooltipBtn' class='btn btn-info' onclick='cancelTooltip()'>Got it</div> ";
			if (document.queryCommandSupported('copy')) {
				buttonHTML += "<div id='clipBoardBtn' class='btn btn-success'>Export</div>";
			}
			buttonHTML += `
    <div id='importBtn' class='btn btn-success' onclick='Graphs.Backend.importGraphs()'>Import</div>
    <a id='downloadLink' target='_blank' download="${saveName}"'.txt', href=${downloadBlob}>
    <div class='btn btn-danger' id='downloadBtn'>Download as File</div></a>
    </div>`;

			ondisplay = tooltips.handleCopyButton();
			game.global.lockTooltip = true;
			elem.style.left = "33.75%";
			elem.style.top = "25%";

			var titleText;
			titleText = "Import/Export Graph Data"
			lastTooltipTitle = titleText;
			tip2 = ""
			var tipNum = (tip2) ? "2" : "";
			document.getElementById("tipTitle" + tipNum).innerHTML = titleText;
			document.getElementById("tipText" + tipNum).innerHTML = tooltipText;
			document.getElementById("tipCost" + tipNum).innerHTML = buttonHTML;
			elem.style.display = "block";
			if (ondisplay !== null)
				ondisplay();
		},

		_createStyles: function () {
			let styleElem = document.createElement("style");
			styleElem.textContent = `
				#graphParent {
					height: 600px;
					overflow: auto;
					position: relative;
					display: grid;
					grid-template-columns: repeat(3,  minmax(1fr, max-content));
					grid-template-rows: 2.5em 1fr 2.5em 2.5em;
					font-size: 1em;
				}

				#toggleDiv {
					grid-area: 1 / 1;
					margin: 1em;
					z-index: 1;
				}

				#graph {
					grid-column: 1/-1;
					grid-row: 1/3;
				}

				#graphFooter {
					grid-column: 1/-1;
					grid-row: 3/-1;
					display: grid;
					grid-template-columns: subgrid;
					grid-template-rows: subgrid;
					margin-top: .2em
				}

				#graphFooter .footerR1 {
					grid-row: 1;
				}

				#graphFooter .footerR2 {
					grid-row: 2;
				}

				#graphFooter .footerLeft {
					grid-column: 1;
				}

				#graphFooter .footerCenter {
					grid-column: 2;
					justify-self: center;
				}

				#graphFooter .footerRight {
					grid-column: 3;
					justify-self: end;
				}

				#graphParent input:not([type=checkbox]) {
					width: 3em;
					text-align: center;
				}

				.btnContainer {
					margin: 0 .5em 0 .5em;
				}

				#graphParent  button, input, select {
					background: black;
					color: white;
					padding: .2em;
					border-radius: 0px;
					border: 1px solid white;
				}
			`;
			document.head.appendChild(styleElem);
		},

		createUI: function () {
			// Create all of the UI elements and load in scripts needed

			for (const source of ["https://code.highcharts.com/11.1.0/highcharts.js", "https://code.highcharts.com/11.1.0/modules/boost.js"]) {
				var chartscript = document.createElement("script");
				chartscript.type = "text/javascript";
				chartscript.src = source
				chartscript.async = false
				document.head.appendChild(chartscript);
			}

			this._createStyles();

			var graphsButton = document.createElement("TD");
			graphsButton.innerText = "Graphs";
			graphsButton.classList.add("btn", "btn-default");
			graphsButton.id = "graphsBtn";
			graphsButton.addEventListener("click", function () { Graphs.UI.escapeATWindows(false); Graphs.ChartArea.draw(); Graphs.UI.swapGraphUniverse(); });

			// insert after Achievements
			document.getElementById("settingsTable").firstElementChild.firstElementChild.childNodes[9].insertAdjacentElement("afterend", graphsButton);

			/* 
			Layout is a 3 column, 4 row grid
			Header r1, overlapping the Graph
			Graph  r1-2
			Footer r3-4
			*/
			document.getElementById("settingsRow").insertAdjacentHTML("afterbegin",
				`
				<div id="graphParent" style="display: none;">
					<div id="toggleDiv"></div>
					<div id="graph"></div>
					<div id="graphFooter">
						<div class="footerLeft footerR1">
							<span id="graphsSelectorContainer" class="btnContainer"></span>
						</div>
						<div class="footerCenter footerR1">
							<span class="btnContainer">
								<input id="clrChkbox" type="checkbox">
								<button id="clrAllDataBtn" class="btn" disabled="">Clear All U1 Data</button>
							</span>
							<span class="btnContainer" id="deleteSpecificCont">
								<input id="deleteSpecificTextBox">
								<button id="deleteSpecificBtn">Delete Specific U1 Portals</button>
							</span>
						</div>
						<div class="footerRight footerR1">
							<span id="GraphsLegendCtrl" class="btnContainer">
								<button id="GraphsInvertSelection">Invert Selection</button>
								<button id="GraphsToggleAll">All Off/On</button>
							</span>
							<button id="GraphsExport" class="btnContainer">Import/Export</button>
						</div>
						<div class="footerLeft footerR2">
							<button id="GraphsRefresh" class="btnContainer">Refresh</button>
							<span class="btnContainer"><input type="checkbox" id="liveCheckbox">Live Updates</span>
						</div>
						<div class="footerCenter footerR2">
							<span class="btnContainer"><input id="portalCountTextBox">Displayed Portals</span>
							<span class="btnContainer"><input id="portalsSavedTextBox">Saved Portals</span>
						</div>
						<div class="footerRight footerR2">
							<span class="btnContainer"><input id="blackCB" type="checkbox">Black Graphs</span>
						</div>
					</div>
				</div>
    `);

			function createSelector(id, sourceList, textMod = "", onchangeMod) {
				var selector = document.createElement("select");
				selector.id = id;
				//selector.setAttribute("style", "");
				selector.addEventListener("change", function () { Graphs.Backend.saveSetting(this.id, this.value); Graphs.ChartArea.draw(); });
				if (onchangeMod) { selector.addEventListener("change", onchangeMod); }
				for (var item of sourceList) {
					var opt = document.createElement("option");
					opt.value = item;
					opt.text = textMod + item;
					selector.appendChild(opt);
				}
				selector.value = Graphs.Settings[selector.id];
				return selector;
			};

			// Create Universe and Graph selectors
			var selectorContainer = document.querySelector("#graphsSelectorContainer");
			[
				["universeSelection", [1, 2], "Universe ", function () { Graphs.UI.swapGraphUniverse(); }],
				["u1graphSelection", GraphsConfig.graphList.filter((g) => g.universe == 1 || !g.universe).map((g) => g.selectorText)],
				["u2graphSelection", GraphsConfig.graphList.filter((g) => g.universe == 2 || !g.universe).map((g) => g.selectorText)],
			].forEach((opts) => selectorContainer.appendChild(createSelector(...opts)))

			var GraphsTipsDelete = "To delete a portal, type its portal number in the box and press Delete Specific. Using negative numbers in the Delete Specific box will keep that many portals (starting counting backwards from the current one), ie: if you have Portals 1000-1015, typing -10 will keep 1005-1015. <br> You can also delete portals by challenge name, matches are non case sensitive and allow partial matches, ie coord matches Coordinated."
			var GraphsTips = "You can zoom by dragging a box around an area. You can toggle portals by clicking them on the legend, or double click to toggle all of the same challenge. <br> Quickly view the last portal by clicking it off, then Invert Selection. Or by clicking All Off, then clicking the portal on."

			const GraphUIEvents = [
				["click", "GraphsRefresh", function () { Graphs.ChartArea.draw() }],
				["click", "clrChkbox", function () { Graphs.UI.toggleClearButton() }],
				["click", "clrAllDataBtn", function () { Graphs.Backend.clearData("null", true); Graphs.ChartArea.draw(); }],
				["click", "deleteSpecificBtn", function () { Graphs.Backend.deleteSpecific(); Graphs.ChartArea.draw() }],
				["click", "GraphsInvertSelection", function () { Graphs.ChartArea.toggleSpecific() }],
				["click", "GraphsToggleAll", function () { Graphs.ChartArea.toggleAll() }],
				["click", "GraphsExport", function () { Graphs.UI.importExportGraphsDialog() }],
				["click", "liveCheckbox", function () { Graphs.Backend.saveSetting('live', this.checked) }],
				["click", "blackCB", function () { Graphs.UI.toggleDarkGraphs() }],
				["mouseover", "deleteSpecificCont", function () { tooltip("Tips", "customText", event, `${GraphsTipsDelete}`) }],
				["mouseover", "GraphsLegendCtrl", function () { tooltip("Tips", "customText", event, `${GraphsTips}`) }],
				["change", "portalCountTextBox", function () { Graphs.Backend.saveSetting('portalsDisplayed', this.value); Graphs.ChartArea.update(); }],
				["change", "portalsSavedTextBox", function () { Graphs.Backend.saveSetting('maxGraphs', this.value); Graphs.Backend.clearData(this.value); Graphs.ChartArea.update(); }],
			]

			for (const [eventType, elemID, eventFunc] of GraphUIEvents) {
				let targetElem = document.getElementById(elemID)
				targetElem.addEventListener(eventType, eventFunc)
				if (eventType === "mouseover") {
					targetElem.addEventListener("mouseout", function () { tooltip("hide"); })
				}
			}

			// Set toggles to saved values
			document.querySelector("#blackCB").checked = Graphs.Settings.darkTheme;
			document.querySelector("#portalCountTextBox").value = Graphs.Settings.portalsDisplayed;
			document.querySelector("#portalsSavedTextBox").value = Graphs.Settings.maxGraphs;
			document.querySelector("#liveCheckbox").checked = Graphs.Settings.live;

			this.toggleDarkGraphs();
			this.showHideUnused()
		},

		swapGraphUniverse: function () {
			// Show/hide the universe-specific graph selectors
			var universe = Graphs.Settings.universeSelection;
			var active = `u${universe}`
			var inactive = `u${universe == 1 ? 2 : 1}`
			document.getElementById(`${active}graphSelection`).style.display = '';
			document.getElementById(`${inactive}graphSelection`).style.display = 'none';
			document.getElementById("clrAllDataBtn").innerText = `Clear All U${universe} Data`;
			document.getElementById("deleteSpecificBtn").innerText = `Delete Specific U${universe} Portals`;
		},

		toggleClearButton: function () {
			document.getElementById("clrAllDataBtn").disabled = !document.getElementById("clrChkbox").checked;
		},

		toggleDarkGraphs: function () {
			if (game) {
				var darkcss = document.getElementById("dark-graph.css")
				var dark = document.getElementById("blackCB").checked;
				Graphs.Backend.saveSetting("darkTheme", dark)
				if (!darkcss && dark) {
					var b = document.createElement("link");
					b.rel = "stylesheet";
					b.type = "text/css";
					b.id = "dark-graph.css";
					b.href = graphsBasePath + "dark-graph.css";
					document.head.appendChild(b);
					Graphs.debugMsg("Adding dark-graph.css file", "graphs");
				}
				else if (darkcss && !dark) {
					document.head.removeChild(darkcss)
					Graphs.debugMsg("Removing dark-graph.css file", "graphs")
				}
			}
		},

		escapeATWindows: function (escPressed = true) {
			// Toggle AT windows with UI, or force close with Esc
			var a = document.getElementById("tooltipDiv");
			if (a.style.display != "none") return void cancelTooltip(); // old code, uncertain what it's for or why it's here.
			for (elemId of ["autoSettings", "autoTrimpsTabBarMenu", "graphParent"]) {
				var elem = document.getElementById(elemId);
				if (!elem) continue;
				if (elemId === "graphParent") { // toggle Graphs window
					var open = elem.style.display === "grid";
					if (escPressed) open = true; // override to always close
					elem.style.display = open ? "none" : "grid";
					Graphs.Settings.open = !open;
					trimpStatsDisplayed = !open; // HACKS disable hotkeys without touching Trimps settings
				}
				else { elem.style.display = "none"; } // close other windows
			}
		},

		showHideUnused: function () {
			// Hide graphs that have no collected data
			var activeUniverses = [];
			for (const graph of GraphsConfig.graphList) {
				if (graph.graphType != "line") continue; // ignore column graphs (pure laziness, the only two always exist anyways)
				const universes = graph.universe ? [graph.universe] : [1, 2]
				for (const universe of universes) {
					var style = "none"
					for (portal of Object.values(Graphs.portalSaveData)) {
						if (portal.perZoneData[graph.dataVar] && portal.universe === universe  // has collected data, in the right universe
							&& new Set(portal.perZoneData[graph.dataVar].filter(x => x === 0 || x)).size > 1) { // and there is nonzero, variable data
							style = ""
							if (!activeUniverses.includes(universe)) activeUniverses.push(universe);
							break;
						}
					}
					// hide unused graphs
					document.querySelector(`#u${universe}graphSelection [value="${graph.selectorText}"]`).style.display = style;
				}
			}
			// hide universe selector if graphs are only in one universe
			var universeSel = document.querySelector(`#universeSelection`);
			if (activeUniverses.length === 1) {
				universeSel.style.display = "none";
				Graphs.Settings.universeSelection = activeUniverses[0];
				this.swapGraphUniverse()
			}
			else {
				universeSel.style.display = "";
			}
		},

	},

	ChartArea: {
		chart: undefined,
		_lookupGraph: function (selectorText) {
			for (const graph of GraphsConfig.graphList) {
				if (graph.selectorText === selectorText) return graph;
			}
		},
		draw: function () {
			// Draws the graph currently selected by the user
			function makeCheckbox(graph, toggle) {
				// TOGGLES
				// create checkbox element labeled with the toggle
				var container = document.createElement("span")
				var checkbox = document.createElement("input");
				var label = document.createElement("span");

				container.style.padding = "0rem .5rem";
				checkbox.type = "checkbox";
				checkbox.id = toggle;
				// initialize the checkbox to saved value
				checkbox.checked = Graphs.Settings.toggles[graph][toggle];

				// create a godawful inline function to set saved value on change, apply exclusions, and update the graph
				function manageCheckbox() {
					if (GraphsConfig.toggledGraphs[toggle] && GraphsConfig.toggledGraphs[toggle].exclude) {
						GraphsConfig.toggledGraphs[toggle].exclude.forEach(exTog => Graphs.Settings.toggles[graph][exTog] = false)
					}
					Graphs.Settings.toggles[graph][toggle] = this.checked;
					Graphs.ChartArea.draw();
				}
				checkbox.addEventListener("click", manageCheckbox)

				label.innerText = toggle;
				label.style.color = "#757575";

				container.appendChild(checkbox)
				container.appendChild(label)
				return container;
			}
			Graphs.Push.zoneData(); // update current zone data on request
			this.update();
			var universe = Graphs.Settings.universeSelection;
			var selectedGraph = document.getElementById(`u${universe}graphSelection`);
			if (selectedGraph.value) {
				// draw the graph
				var graph = this._lookupGraph(selectedGraph.value);
				// create toggle elements
				toggleDiv = document.querySelector("#toggleDiv")
				toggleDiv.innerHTML = "";
				if (graph.toggles) {
					for (const toggle of graph.toggles) {
						toggleDiv.appendChild(makeCheckbox(graph.id, toggle))
					}
				}
			}
			Graphs.UI.showHideUnused();
		},

		update: function () {
			var universe = Graphs.Settings.universeSelection;
			var selectedGraph = document.getElementById(`u${universe}graphSelection`);
			if (selectedGraph.value) {
				// draw the graph
				var graph = this._lookupGraph(selectedGraph.value);
				graph.updateGraph();
			}
		},

		// Graph Selection
		saveSelected: function () {
			if (!this.chart) return;
			for (var i = 0; i < this.chart.series.length; i++) {
				Graphs.Settings.rememberSelected[i] = this.chart.series[i].visible;
			}
			Graphs.Backend.saveSetting();
		},
		applyRemembered: function () {
			if (this.chart.series.length !== Graphs.Settings.rememberSelected.length) {
				Graphs.Settings.rememberSelected = [] // if the graphlist changes, order is no longer guaranteed
			}
			for (var i = 0; i < this.chart.series.length; i++) {
				if (Graphs.Settings.rememberSelected[i] === false) { this.chart.series[i].setVisible(false, false); }
			}
			this.chart.redraw()
		},
		toggleSpecific: function () {
			for (const chart of this.chart.series) {
				chart.visible ? chart.setVisible(false, false) : chart.setVisible(true, false);
			}
			this.chart.redraw();
		},
		toggleAll: function () {
			// toggle all graphs to the opposite of the average visible/hidden state
			var visCount = 0;
			this.chart.series.forEach(chart => visCount += chart.visible)
			for (const chart of this.chart.series) {
				visCount > this.chart.series.length / 2 ? chart.setVisible(false, false) : chart.setVisible(true, false);
			}
			this.chart.redraw()
		},
		toggleNamed: function (name) {
			// toggle all graphs that share the same name as the clicked graph to on
			for (const chart of this.chart.series) {
				// If the last word of the name matches, toggle it
				if (chart.name.split(" ").pop() === name.split(" ").pop()) {
					chart.setVisible(true, false);
				} else {
					chart.setVisible(false, false);
				}
			}
			this.chart.redraw()
		},
	},

	Push: {
		zoneData: function () {
			//debug("Starting Zone " + getGameData.world(), "graphs");
			const portalID = Graphs.getportalID();
			if (!Graphs.portalSaveData[portalID] || GraphsConfig.getGameData.world() === 1) { // reset portal data if restarting a portal
				Graphs.Backend.savePortalData(true) // save old portal to history
				Graphs.portalSaveData[portalID] = new Graphs.Portal();
				Graphs.Backend.clearData(Graphs.Settings.maxGraphs); // clear out old portals
			}
			Graphs.portalSaveData[portalID].update();
			Graphs.Backend.savePortalData(false) // save current portal
			if (Graphs.Settings.live && Graphs.Settings.open) {
				Graphs.ChartArea.update();
			}
		},

		triggerData: function (updates = [[]],) {
			const portalID = Graphs.getportalID();
			try {
				if (!Graphs.portalSaveData[portalID]) {
					this.zoneData(); // create portal data if we somehow trigger a non-zone event without a portal created
					console.debug("Current portal did not start logging correctly, restarting", portalID)
				}
				var perZoneData = Graphs.portalSaveData[portalID].perZoneData;
				var world = GraphsConfig.getGameData.world();
				for (var [name, value, cuum, accumulator, customx] of updates) {
					if (customx) world = customx;
					if (!perZoneData[name][world] && accumulator) perZoneData[name][world] += perZoneData[name][world - 1] || 0
					if (cuum) perZoneData[name][world] = value + perZoneData[name][world] || 0;
					else perZoneData[name][world] = value;
				}
			}
			catch (e) {
				console.debug("Failed to update: ", portalID, updates, e)
			}
			Graphs.Backend.savePortalData(false) // save current portal
			if (Graphs.Settings.live && Graphs.Settings.open) {
				Graphs.ChartArea.update();
			}
		},

		mapData: function () {
			this.triggerData([
				["timeOnMap", GraphsConfig.getGameData.timeOnMap(), true, true],
				["mapCount", 1, true, true]])
		},
	},

	formatters: {
		datetime: function () {
			var ser = this.series;
			return '<span style="color:' + ser.color + '" >●</span> ' + ser.name + ": <b>" + Graphs.formatters._formatDuration(this.y / 1000) + "</b><br>";
		},
		defaultPoint: function () {
			var ser = this.series; // 'this' being the highcharts object that uses formatter()
			return '<span style="color:' + ser.color + '" >●</span> ' + ser.name + ": <b>" + prettify(this.y) + "</b><br>";
		},
		defaultAxis: function () {
			// These are Trimps format functions for durations(modified) and numbers, respectively
			if (this.dateTimeLabelFormat) return Graphs.formatters._formatDuration(this.value / 1000)
			else return prettify(this.value);
		},
		// returns _d _h _m _s or _._s
		_formatDuration: function (timeSince) {
			var timeObj = {
				d: Math.floor(timeSince / 86400),
				h: Math.floor(timeSince / 3600) % 24,
				m: Math.floor(timeSince / 60) % 60,
				s: Math.floor(timeSince % 60),
			}
			var milliseconds = Math.floor(timeSince % 1 * 10)
			var timeString = "";
			var unitsUsed = 0
			for (const [unit, value] of Object.entries(timeObj)) {
				if (value === 0 && timeString === "") continue;
				unitsUsed++;
				if (value) timeString += value.toString() + unit + " ";
			}
			if (unitsUsed <= 1) {
				timeString = [timeObj.s.toString().padStart(1, "0"), milliseconds.toString(), "s"].join(".");
			}
			return timeString
		},
	},

	Graph: function (dataVar, universe, selectorText, additionalParams = {}) {
		// graphTitle, customFunction, useAccumulator, xTitle, yTitle, formatter, xminFloor, yminFloor, yType
		this.dataVar = dataVar
		this.universe = universe; // false, 1, 2
		this.selectorText = selectorText ? selectorText : dataVar;
		this.id = selectorText.replace(/ /g, "_")
		this.graphTitle = this.selectorText;
		this.graphType = "line"
		this.customFunction;
		this.useAccumulator;
		this.xTitle = "Zone";
		this.yTitle = this.selectorText;
		this.formatter = Graphs.formatters.defaultPoint;
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
			return {
				chart: {
					renderTo: "graph",
					zoomType: "xy",
					animation: false,
					shadow: false,
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
					style: {
						fontSize: '2rem'
					}
				},
				boost: {
					useGPUTranslations: true,
					// Chart-level boost when there are more than 5 series in the chart
					seriesThreshold: 101
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
						style: {
							fontSize: "1.5rem"
						},
					},
					labels: {
						style: {
							fontSize: "1.2rem"
						},
					},
				},
				yAxis: {
					floor: this.yminFloor,
					title: {
						text: this.yTitle,
						style: {
							fontSize: "1.5rem"
						},
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
						formatter: Graphs.formatters.defaultAxis,
						style: {
							fontSize: "1.2rem"
						},
					},
					endOnTick: false,
					maxPadding: .05,
				},
				tooltip: {
					animation: false,
					shadow: false,
					pointFormatter: this.formatter,
					style: {
						fontSize: "1.2rem"
					},
				},
				legend: {
					layout: "vertical",
					align: "right",
					verticalAlign: "middle",
					borderWidth: 0,
					padding: 0,
					itemMarginBottom: 0,
					itemMarginTop: 0,
					itemStyle: {
						fontSize: "1rem",
					},
				},
				series: this.graphData,
				additionalParams: {},
			}
		}
		// Main Graphing function
		this.updateGraph = function () {
			var HighchartsObj;
			if (this.graphType == "line") HighchartsObj = this.lineGraph();
			if (this.graphType == "column") HighchartsObj = this.columnGraph();
			Graphs.ChartArea.saveSelected();
			Graphs.ChartArea.chart = new Highcharts.Chart(HighchartsObj);
			Graphs.ChartArea.applyRemembered();
		}
		// prepares data series for Highcharts, and optionally transforms it with toggled options, customFunction and useAccumulator
		this.lineGraph = function () {
			var highChartsObj = this.createHighChartsObj() // make default object, to be customized as needed
			var item = this.dataVar;
			this.graphData = [];
			this.useAccumulator = false; // HACKS ( only one set of graphs uses an accumulator and it's on a toggle )
			var maxS3 = Math.max(...Object.values(Graphs.portalSaveData).map((portal) => portal.s3).filter((s3) => s3));
			var activeToggles = [];
			if (this.toggles) {
				// Modify the chart area based on the toggles active
				activeToggles = Object.keys(GraphsConfig.toggledGraphs).filter(toggle => Graphs.Settings.toggles[this.id][toggle])
				activeToggles.forEach(toggle => GraphsConfig.toggledGraphs[toggle].graphMods(this, highChartsObj)); // 
			}
			// get all possible active data vars
			var activeDataVars = [item]
			activeToggles.forEach(toggle => { if (GraphsConfig.toggledGraphs[toggle].dataVars) activeDataVars.push(GraphsConfig.toggledGraphs[toggle].dataVars) });
			var portalCount = 0;
			// parse data per portal
			for (const portal of Object.values(Graphs.portalSaveData).reverse()) {
				if (!activeDataVars.some(dvar => dvar in portal.perZoneData)) continue; // ignore completely blank
				if (portal.universe != Graphs.Settings.universeSelection) continue; // ignore inactive universe
				var cleanData = [];
				// parse the requested datavar
				var xprev = 0;
				for (const index in portal.perZoneData[item]) {
					var x = portal.perZoneData[item][index];
					var time = portal.perZoneData.currentTime[index];
					if (typeof this.customFunction === "function") {
						x = this.customFunction(portal, index);
						if (x < 0) x = null;
					}
					// TOGGLES
					// handle toggles that replace whole data vars first
					for (var toggle of activeToggles) {
						if (["perZone", "perHr"].includes(toggle)) continue;
						try { x = GraphsConfig.toggledGraphs[toggle].customFunction(portal, item, index, x, time, maxS3, xprev); }
						catch (e) {
							x = 0;
							Graphs.debugMsg(`Error graphing data on: ${item} ${toggle}, ${e.message}`)
						}
					}
					// handle special time and X modifying toggles
					originalx = x // save before modifiers for perZone use
					if (activeToggles.includes("perZone")) {  // must always be first 
						[x, time] = GraphsConfig.toggledGraphs.perZone.customFunction(portal, item, index, x, false, false, xprev);
					}
					if (activeToggles.includes("perHr")) {  // must always be first 
						x = GraphsConfig.toggledGraphs.perHr.customFunction(portal, item, index, x, time, maxS3, xprev);
					}
					xprev = originalx;
					//if (this.useAccumulator) { x += last(cleanData) !== undefined ? last(cleanData)[1] : 0; }
					if (this.typeCheck && typeof x != this.typeCheck) x = null;
					cleanData.push([Number(index), x]) // highcharts expects number, number, not str, number
				}
				if (activeToggles.includes("perZone") && ["fluffy", "scruffy"].includes(item)) {
					cleanData.splice(cleanData.length - 1); // current zone is too erratic to include due to weird order of granting fluffy exp 
				}
				this.graphData.push({
					name: `Portal ${portal.totalPortals}: ${portal.challenge}`,
					data: cleanData,
					zIndex: -portalCount,
					events: {
						legendItemClick: (e) => {
							// Namespaced with trimps because we have no ownership of the object
							// But it is persistent so it works
							if (!e.target.trimpsLastClick || (Date.now() - e.target.trimpsLastClick) > 500) {
								e.target.trimpsLastClick = Date.now();
							} else {
								e.preventDefault();
								Graphs.ChartArea.toggleNamed(e.target.name)
							}
						}
					}
				})
				portalCount++;
				if (portalCount >= Graphs.Settings.portalsDisplayed) break;
			}
			highChartsObj.series = this.graphData;
			return highChartsObj;
		}
		// prepares multi-column data series from per-portal data.
		this.columnGraph = function () {
			var highChartsObj = this.createHighChartsObj() // make default object, to be customized as needed
			highChartsObj.xAxis.title.text = "Portal"
			highChartsObj.xAxis.floor = 0;
			highChartsObj.plotOptions.series = { groupPadding: .2, pointPadding: 0, animation: false, borderColor: "black" }
			// set up axes for each column so they scale independently
			var activeColumns = this.columns.filter(column => !(column.universe && column.universe != Graphs.Settings.universeSelection));
			if (Graphs.Settings.toggles[this.id].perHr) { // disable time when comparing things over time.  x/x is not interesting data.
				GraphsConfig.toggledGraphs.perHr.graphMods(false, highChartsObj)
				activeColumns = activeColumns.filter(column => column.dataVar !== "currentTime")
			}
			this.graphData = [];
			var yAxis = 0;
			var displayedColumns = [];
			for (const column of activeColumns) {
				var hasData = false;
				var cleanData = []
				var currUniPortals = Object.values(Graphs.portalSaveData).filter(portal => portal.universe == Graphs.Settings.universeSelection);
				for (const portal of Object.values(currUniPortals).slice(Math.max(Object.values(currUniPortals).length - Graphs.Settings.portalsDisplayed, 0))) {
					//if (portal.universe != Graphs.Settings.universeSelection) continue;
					var data = undefined;
					if (portal[column.dataVar]) { data = portal[column.dataVar]; }
					if (portal.perZoneData[column.dataVar]) {
						var max = Graphs.last(portal.perZoneData[column.dataVar]);
						if (!max) max = Math.max(...portal.perZoneData[column.dataVar].filter(Number.isFinite))
						data = max;
					}
					if (column.customFunction) { data = column.customFunction(portal, data); }
					if (Graphs.Settings.toggles[this.id].perHr) { // HACKS a headache for future me if other toggles are wanted here.
						data = data / (Graphs.last(portal.perZoneData.currentTime) / 3600000);
					}
					if (data) hasData = true
					cleanData.push([portal.totalPortals, data])
				}
				if (hasData) { // only add columns if there is any data in that column over all portals
					var series = {
						name: column.title,
						data: cleanData,
						type: "column",
						yAxis: yAxis,
						color: column.color,
					}
					if (column.dataVar === "currentTime") { // HACKS override formatter for time vars
						series["tooltip"] = { "pointFormatter": Graphs.formatters.datetime }
					}
					this.graphData.push(series);
					displayedColumns.push(column)
					yAxis += 1;
				}
			}
			// Label the axes
			var axes = displayedColumns.map(column => { return { visible: false, endOnTick: false } });
			// reduce padding between portals as portals increase
			highChartsObj.plotOptions.series["groupPadding"] = .5 / this.graphData[0].data.length ** .6;
			if (this.graphData[0].data.length > 15) {
				highChartsObj.plotOptions.series["borderWidth"] = 0.1;
			}
			highChartsObj.yAxis = axes;
			highChartsObj.series = this.graphData;
			return highChartsObj;
		}
	},

	Portal: function () {
		// Stores and updates data for an individual portal
		this.universe = GraphsConfig.getGameData.universe();
		this.totalPortals = getTotalPortals();
		this.challenge = GraphsConfig.getGameData.challengeActive() === 'Daily'
			? getCurrentChallengePane().split('.')[0].substr(13).slice(0, 16) // names dailies by their start date, only moderately cursed
			: GraphsConfig.getGameData.challengeActive();
		this.initialNullifium = game.global.nullifium;
		this.totalNullifium = GraphsConfig.getGameData.nullifium();
		this.totalVoidMaps = GraphsConfig.getGameData.totalVoids();
		this.cinf = GraphsConfig.getGameData.cinf();
		if (this.universe === 1) {
			this.totalHelium = game.global.totalHeliumEarned;
			this.initialFluffy = GraphsConfig.getGameData.fluffy() - game.stats.bestFluffyExp.value; // adjust for mid-run graph start
			this.initialDE = GraphsConfig.getGameData.essence();
		}
		if (this.universe === 2) {
			this.totalRadon = game.global.totalRadonEarned;
			this.initialScruffy = GraphsConfig.getGameData.scruffy() - game.stats.bestFluffyExp2.value; // adjust for mid-run graph start
			this.initialMutes = GraphsConfig.getGameData.mutatedSeeds();
			this.s3 = GraphsConfig.getGameData.s3();
		}
		// create an object to collect only the relevant data per zone, without fromEntries because old JS
		this.perZoneData = {};
		var perZoneItems = GraphsConfig.graphList.filter((graph) =>
			(graph.universe == this.universe || !graph.universe) // only save data relevant to the current universe
			&& graph.conditional() && graph.dataVar) // and for relevant challenges, with datavars 
			.map((graph) => graph.dataVar)
			.concat(["currentTime", "mapCount", "timeOnMap", "mapHeRn", "warpPerGiga"]); // always graph time vars
		perZoneItems.forEach((name) => this.perZoneData[name] = []);

		// update per zone data and special totals
		this.update = function () { // check source of the update
			const world = GraphsConfig.getGameData.world();
			this.totalNullifium = game.global.nullifium - this.initialNullifium + GraphsConfig.getGameData.nullifium();
			this.totalVoidMaps = GraphsConfig.getGameData.totalVoids();
			for (const [name, data] of Object.entries(this.perZoneData)) {
				if (world + 1 < data.length) { // FENCEPOSTING (zones are 1 indexed)
					data.splice(world + 1) // trim 'future' zones on reload
				}
				if (name === "c23increase") {
					data[world] = Math.max(GraphsConfig.getGameData[name](), data[world] || 0);
					continue;
				}
				// These are non-zone dependent and update on their own rules, but need to be cumulative 
				if (["mapHeRn", "timeOnMap", "mapCount"].includes(name)) {
					if (!data[world]) data[world] = data[world - 1] || 0
					continue;
				}
				// don't touch these at all on zone transition
				if (["warpPerGiga"].includes(name)) {
					continue;
				}
				try {
					data[world] = GraphsConfig.getGameData[name]();
				}
				catch {
					console.debug("Unknown data type:", name)
				}
			}
		}
	},

	portalSaveData: {},

	getportalID: function () { return `u${GraphsConfig.getGameData.universe()} p${getTotalPortals()}` },

	//default settings
	Settings: {
		universeSelection: 1,
		u1graphSelection: null,
		u2graphSelection: null,
		rememberSelected: [],
		toggles: {},
		darkTheme: true,
		maxGraphs: 60, // Highcharts gets a bit angry rendering more graphs, 30 is the maximum you can fit on the legend before it splits into pages.
		portalsDisplayed: 30,
		mapsRepaired: false,
	},

	diff: function (dataVar, initial) {
		// diff between x and x-1, or x and initial
		return function (portal, i) {
			var e1 = portal.perZoneData[dataVar][i];
			var e2 = initial ? initial : portal.perZoneData[dataVar][i - 1];
			if (e1 === null || e2 === null) return null;
			return e1 - e2
		}
	},

	last: function (arr) {
		return arr[arr.length - 1]
	},

	// --------- Misc Functions --------- 
	enableGraphsDebug: true,
	debugMsg: function () {
		if (this.enableGraphsDebug)
			console.debug(...arguments);
	},


	repairMapData: function () {
		// one time fix for a change in how data is saved
		if (Graphs.Settings.mapsRepaired) return;
		for (var [portal, data] of Object.entries(Graphs.portalSaveData)) {
			for (dataVar of ["mapCount", "timeOnMap"]) {
				var firstMap = data.perZoneData[dataVar].findIndex(val => val > 0);
				var totalData = data.perZoneData[dataVar].filter(x => x > 0).length
				if (data.perZoneData[dataVar].length > totalData + firstMap && firstMap != -1) { // original repair
					var cuum = 0
					for (const [i, value] of data.perZoneData[dataVar].entries()) {
						cuum += value || 0;
						Graphs.portalSaveData[portal].perZoneData[dataVar][i] = cuum
					}
				}
			}
			Graphs.Backend.saveSetting("mapsRepaired", true)
			console.log("Mapping data format updated")
		}
	},


}

const GraphsConfig = {

	// To add a new graph, add it to graphList with the desired options,
	// If using a new dataVar, add that to getGameData
	// To make a new toggle, add the required logic to toggledGraphs

	// hopefully complete, not verified
	stackChallenges: { Balance: "balanceStacks", Decay: "stacks", Life: "stacks", Toxicity: "stacks", Frigid: "warmth", Unbalance: "balanceStacks", Melt: "stacks", Quagmire: "exhaustedStacks", Wither: "trimpStacks", Revenge: "stacks", Mayhem: "stacks", Storm: "totalClouds", Insanity: "insanity", Berserk: "weakened", Exterminate: "swarmStacks", Pandemonium: "pandemonium", Smithless: "fakeSmithies", Desolation: "chilled", Nurture: "level", },

	getGameData: {
		currentTime: () => { return getGameTime() - game.global.portalTime }, // portalTime changes on pause, 'when a portal started' is not a static concept
		timeOnMap: () => {
			// this time is wrong if the player sits in map chamber. Then again, they might want that time included in 'map' time. (this is basically unavoidable, so the player definitely wants that time tracked as map time)
			// NOT MY BUG The game does not accurately track time on map in timewarp, thus it is impossible to track it in graphs.
			// cap the start time to the zone, otherwise the first map gets bogus time due to how Trimps works
			var start = game.global.mapStarted < game.global.zoneStarted ? game.global.zoneStarted : game.global.mapStarted
			return getGameTime() - start
		},
		world: () => { return game.global.world },
		challengeActive: () => { return game.global.challengeActive },
		voids: () => { return game.global.totalVoidMaps },
		totalVoids: () => { return game.stats.totalVoidMaps.value },
		nullifium: () => { return recycleAllExtraHeirlooms(true) },
		coord: () => { return game.upgrades.Coordination.allowed - game.upgrades.Coordination.done },
		overkill: () => {
			if (game.options.menu.overkillColor.enabled == 0) toggleSetting("overkillColor");
			if (game.global.gridArray && game.global.gridArray[0] && game.global.gridArray[0].name == "Liquimp") return 100;
			// TODO this is an overly fragile check for overkill cells, but a rewrite would use a stats var that doesn't include liq. 
			else return document.getElementById("grid").getElementsByClassName("cellColorOverkill").length;
		},
		zoneTime: () => { return Math.round((getGameTime() - game.global.zoneStarted) * 100) / 100 }, // rounded to x.xs, not used
		mapbonus: () => { return game.global.mapBonus },
		empower: () => { return game.global.challengeActive == "Daily" && typeof game.global.dailyChallenge.empower !== "undefined" ? game.global.dailyChallenge.empower.stacks : 0 },
		lastWarp: () => { return game.global.lastWarp },
		essence: () => { return game.global.spentEssence + game.global.essence },
		heliumOwned: () => { return game.resources.helium.owned },
		//magmite: () => { return game.global.magmite },
		//magmamancers: () => { return game.jobs.Magmamancer.owned },
		fluffy: () => {
			// cap exp at maximum for an evo, because Trimps doesn't do it and it causes horrible horrible bugs
			var maxExp = Math.floor((1000 * Math.pow(5, Fluffy.getCurrentPrestige())) * ((Math.pow(4, 10) - 1) / (4 - 1)))
			var exp = Math.min(game.global.fluffyExp, maxExp);
			//sum of all previous evo costs + current exp, because Trimps doesn't store this
			for (var evo = 0; evo < Fluffy.getCurrentPrestige(); evo++) {
				exp += Math.floor((1000 * Math.pow(5, evo)) * ((Math.pow(4, 10) - 1) / (4 - 1)));;
			}
			return exp
		},
		nursery: () => { return game.buildings.Nursery.purchased },
		nurseryCurrent: () => { return game.buildings.Nursery.owned }, // TODO possible fancy graph with both stats
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
		s3: () => { return game.global.lastRadonPortal },
		u1hze: () => { return game.global.highestLevelCleared },
		u2hze: () => { return game.global.highestRadonLevelCleared },
		c23increase: () => {
			if (game.global.challengeActive !== "" && game.global.runningChallengeSquared) {
				// (mostly) Trimps code
				var challenge = game.global.challengeActive;
				var challengeList = game.challenges[challenge].multiChallenge || [challenge];
				var totalDif = 0;
				for (var x = 0; x < challengeList.length; x++) {
					var challengeName = challengeList[x];
					challenge = game.challenges[challengeName];
					var dif = getIndividualSquaredReward(challengeName, game.global.world) - getIndividualSquaredReward(challengeName);
					totalDif += dif;
				}
				return Math.max(0, totalDif);
			}
			else { return 0; }
		},
		cinf: () => { return countChallengeSquaredReward(false, false, true) },
		mutatedSeeds: () => { return game.global.mutatedSeedsSpent + game.global.mutatedSeeds },
		runetrinkets: () => { return game.stats.runetrinkets.value },
		chalBalance: () => { return game.challenges.Balance.balanceStacks },
		chalStacks: () => {
			for (const [chal, stacks] of Object.entries(GraphsConfig.stackChallenges)) {
				if (challengeActive(chal)) return game.challenges[chal][stacks]
			}
		},
	},

	// Create all the Graph objects
	// Graphs.Graph(dataVar, universe, selectorText, additionalParams)
	// additionalParams include graphTitle, conditional, customFunction, useAccumulator, toggles, xTitle, yTitle, formatter
	graphList: [
		new Graphs.Graph("currentTime", false, "Clear Time", {
			yType: "datetime",
			formatter: Graphs.formatters.datetime,
			toggles: ["perZone", "mapTime", "mapCount"],
			// , "mapPct" TODO having issues with accumulators on this one, more trouble than it's worth given nobody asked for it
		}),
		// U1 Graphs
		new Graphs.Graph("heliumOwned", 1, "Helium", {
			toggles: ["perHr", "perZone", "lifetime", "world", "map"]
		}),
		new Graphs.Graph("fluffy", 1, "Fluffy Exp", {
			conditional: () => { return GraphsConfig.getGameData.u1hze() >= 299 && GraphsConfig.getGameData.fluffy() < 4266662510275000 }, // pre unlock, post E10L10
			customFunction: (portal, i) => { return Graphs.diff("fluffy", portal.initialFluffy)(portal, i) },
			toggles: ["perHr", "perZone",]
		}),
		new Graphs.Graph("essence", 1, "Dark Essence", {
			conditional: () => { return GraphsConfig.getGameData.essence() < 5.826e+39 },
			customFunction: (portal, i) => { return Graphs.diff("essence", portal.initialDE)(portal, i) },
			toggles: ["perHr", "perZone",],
			xminFloor: 181,
		}),
		new Graphs.Graph("nursery", 1, "Nurseries", {
			graphTitle: "Nurseries Purchased",
			toggles: ["perZone"]
		}),
		new Graphs.Graph("lastWarp", 1, "Warpstations", {
			toggles: ["perGiga"],
			graphTitle: "Warpstations built on previous Giga",
			conditional: () => { return GraphsConfig.getGameData.u1hze() >= 59 && ((game.global.totalHeliumEarned - game.global.heliumLeftover) < 10 ** 10) }, // Warp unlock, less than 10B He allocated
			xminFloor: 60,
		}),
		new Graphs.Graph("amals", 1, "Amalgamators"),
		new Graphs.Graph("wonders", 1, "Wonders", {
			conditional: () => { return GraphsConfig.getGameData.challengeActive() === "Experience" },
			xminFloor: 300,
		}),

		// U2 Graphs
		new Graphs.Graph("radonOwned", 2, "Radon", {
			toggles: ["perHr", "perZone", "lifetime", "s3normalized", "world", "map"]
		}),
		new Graphs.Graph("scruffy", 2, "Scruffy Exp", {
			customFunction: (portal, i) => { return Graphs.diff("scruffy", portal.initialScruffy)(portal, i) },
			toggles: ["perHr", "perZone",]
		}),
		new Graphs.Graph("runetrinkets", 2, "Runetrinkets", {
			conditional: () => { return GraphsConfig.getGameData.u2hze() >= 130 }, // unlock (close enough)
			toggles: ["perHr", "perZone"],
			xminFloor: 100,
		}
		),
		new Graphs.Graph("mutatedSeeds", 2, "Mutated Seeds", {
			conditional: () => { return GraphsConfig.getGameData.u2hze() >= 190 },
			customFunction: (portal, i) => { return Graphs.diff("mutatedSeeds", portal.initialMutes)(portal, i) },
			toggles: ["perHr", "perZone"],
			xminFloor: 200,
		}),
		new Graphs.Graph("worshippers", 2, "Worshippers", {
			conditional: () => { return GraphsConfig.getGameData.u2hze() >= 49 },
			xminFloor: 50,
		}),
		new Graphs.Graph("smithies", 2, "Smithies"),
		new Graphs.Graph("bonfires", 2, "Bonfires", {
			graphTitle: "Active Bonfires",
			conditional: () => { return GraphsConfig.getGameData.challengeActive() === "Hypothermia" }
		}),
		new Graphs.Graph("embers", 2, "Embers", {
			conditional: () => { return GraphsConfig.getGameData.challengeActive() === "Hypothermia" }
		}),
		new Graphs.Graph("cruffys", 2, "Cruffys", {
			conditional: () => { return false }, // getGameData.challengeActive() === "Nurture"
			graphTitle: "Cruffys (Depreciated in favor of Challenge Stacks)"

		}),

		// Generic Graphs
		new Graphs.Graph("c23increase", false, "C2 Bonus", {
			conditional: () => { return game.global.runningChallengeSquared },
			toggles: ["perHr", "perZone", "lifetime"]
		}),
		new Graphs.Graph("voids", false, "Void Map History", {
			graphTitle: "Void Map History (voids finished during the same level acquired are not counted/tracked)",
			yTitle: "Number of Void Maps",
		}),
		new Graphs.Graph("coord", false, "Coordinations", {
			graphTitle: "Unbought Coordinations",
		}),
		new Graphs.Graph("overkill", false, "Overkill Cells", {
			// Overkill unlock zones (roughly)
			conditional: () => {
				return ((GraphsConfig.getGameData.universe() == 1 && GraphsConfig.getGameData.u1hze() >= 169)
					|| (GraphsConfig.getGameData.universe() == 2 && GraphsConfig.getGameData.u2hze() >= 200))
			}
		}),
		new Graphs.Graph("mapbonus", false, "Map Bonus"),
		new Graphs.Graph("empower", false, "Empower", {
			conditional: () => { return GraphsConfig.getGameData.challengeActive() === "Daily" && typeof game.global.dailyChallenge.empower !== "undefined" }
		}),
		new Graphs.Graph("chalStacks", false, "Challenge Stacks", {
			conditional: () => { return Object.keys(GraphsConfig.stackChallenges).some((chal) => { return challengeActive(chal); }) }
		}),
		new Graphs.Graph(false, false, "Portal Stats", {
			graphTitle: "Portal Stats",
			graphType: "column",
			toggles: ["perHr"],
			columns: [
				{ dataVar: "totalVoidMaps", title: "Voids", color: "#4d0e8c" },
				{ dataVar: "totalNullifium", title: "Nu", color: "#8a008a" },
				{ dataVar: "heliumOwned", universe: 1, title: "Helium", color: "#5bc0de" },
				{ dataVar: "radonOwned", universe: 2, title: "Radon", color: "#5bc0de" },
				{ dataVar: "fluffy", universe: 1, title: "Pet Exp", color: "green", customFunction: (portal, x) => { return x - portal.initialFluffy } },
				{ dataVar: "scruffy", universe: 2, title: "Pet Exp", color: "green", customFunction: (portal, x) => { return x - portal.initialScruffy } },
				{ dataVar: "c23increase", title: "C2 Bonus", color: "#003b99" },
				{ dataVar: "mutatedSeeds", universe: 2, title: "Mutated Seeds", customFunction: (portal, x) => { return x - portal.initialMutes } },
				{ dataVar: "world", title: "Zone Reached", color: "#a16e08", customFunction: (portal, x) => { return portal.perZoneData.mapbonus.length - 1 } },
				{ dataVar: "currentTime", title: "Run Time", type: "datetime", color: "#928DAD" }, // TODO some vars should be on shared axes... woo
				//{ dataVar: "timeOnMap", title: "Mapping Time", type: "datetime", customFunction: () => { } }, // TODO should be sum not max
			],
		}),
	],

	// rules for toggle based graphs
	// TODO code cleanup, change linegraph so that when there is a datavar and no custom function, it pulls data from the datavar instead of the base graph
	toggledGraphs: {
		mapCount: {
			dataVars: ["mapCount"],
			exclude: ["mapTime", "mapPct"],
			graphMods: (graph, highChartsObj) => {
				highChartsObj.tooltip.pointFormatter = Graphs.formatters.defaultPoint;
				highChartsObj.yAxis.type = "Linear";
				highChartsObj.title.text = "Maps Run"
				highChartsObj.yAxis.title.text = "Maps Run"
			},
			customFunction: (portal, item, index, x) => {
				x = portal.perZoneData.mapCount[index];
				return x
			}
		},
		mapTime: {
			dataVars: ["timeOnMap"],
			exclude: ["mapCount", "mapPct"],
			graphMods: (graph, highChartsObj) => {
				highChartsObj.title.text = "Time in Maps";
			},
			customFunction: (portal, item, index, x) => {
				x = portal.perZoneData.timeOnMap[index]
				return x;
			}
		},
		perGiga: {
			dataVars: ["warpPerGiga"],
			graphMods: (graph, highChartsObj) => {
				highChartsObj.title.text = "Warpstations per Gigastation"
				highChartsObj.yAxis.title.text = "Warpstations"
				highChartsObj.xAxis.title.text = "Gigastations"
				highChartsObj.xAxis.floor = 0
				highChartsObj.xAxis.ceiling = 40
			},
			customFunction: (portal, item, index, x) => {
				x = portal.perZoneData.warpPerGiga[index];
				return x
			},
		},
		/*
		mapPct: { // not used
			dataVars: ["timeOnMap"],
			exclude: ["mapCount", "mapTime"],
			graphMods: (graph, highChartsObj) => {
				highChartsObj.tooltip = { pointFormatter: formatters.defaultPoint };
				highChartsObj.yAxis.type = "Linear"
				highChartsObj.title.text = "% of Clear time spent Mapping"
				highChartsObj.yAxis.title.text = "% Clear Time"
			},
			customFunction: (portal, item, index, x) => {
				x = portal.perZoneData.timeOnMap[index] / x || 0;
				return x;
			}
		},
		*/
		perZone: {
			graphMods: (graph, highChartsObj) => {
				highChartsObj.title.text += " each Zone"
				graph.useAccumulator = false // HACKS this might be incredibly stupid, find out later when you use this option for a different case!
			},
			customFunction: (portal, item, index, x, time, maxS3, xprev) => {
				// discard diffs when there isn't data before or on the zone
				if (index == 1) return [x, portal.perZoneData.currentTime[index]]; // short circuit for zone 1 which has no diff
				var xdiff = null;
				var timediff = null
				if (x !== null && xprev !== null) {
					xdiff = x - xprev;
				}
				if (portal.perZoneData.currentTime[index] !== null && portal.perZoneData.currentTime[index - 1] !== null) {
					timediff = portal.perZoneData.currentTime[index] - portal.perZoneData.currentTime[index - 1]
				}
				return [xdiff, timediff];
			}
		},
		perHr: {
			graphMods: (graph, highChartsObj) => {
				highChartsObj.title.text += " / Hour"
			},
			customFunction: (portal, item, index, x, time, maxS3, xprev) => {
				return x / (time / 3600000);
			}
		},
		world: {
			dataVars: ["mapHeRn"],
			exclude: ["map"],
			graphMods: (graph, highChartsObj) => {
				highChartsObj.title.text += `, World Only`;
			},
			customFunction: (portal, item, index, x) => {
				x = (portal.universe == 1) ? portal.perZoneData.heliumOwned[index] : portal.perZoneData.radonOwned[index]
				return x - portal.perZoneData.mapHeRn[index] || 0;
			}
		},
		map: {
			dataVars: ["mapHeRn"],
			exclude: ["world"],
			graphMods: (graph, highChartsObj) => {
				highChartsObj.title.text += `, Map Only`;
			},
			customFunction: (portal, item, index, x) => {
				return portal.perZoneData.mapHeRn[index] || 0
			}
		},
		lifetime: {
			graphMods: (graph, highChartsObj) => {
				highChartsObj.title.text += " % of Lifetime Total";
				highChartsObj.yAxis.title.text += " % of lifetime"
			},
			customFunction: (portal, item, index, x) => {
				var initial;
				if (item === "heliumOwned") { initial = portal.totalHelium; }
				if (item === "radonOwned") { initial = portal.totalRadon; }
				if (item === "c23increase") { initial = portal.cinf; }
				if (!initial) {
					Graphs.debugMsg("Attempted to calc lifetime percent of an unknown type:" + item);
					return 0;
				}
				if (item === "c23increase") {
					var totalBonus = (1 + (initial[1] / 100)) * initial[0]; // calc initial cinf            
					var c2 = initial[0];
					var c3 = initial[1];
					portal.universe == 1 ? c2 += x : c3 += x;
					var newBonus = (1 + (c3 / 100)) * c2; // calc final cinf
					x = ((newBonus - totalBonus) / (totalBonus ? totalBonus : 1));
				}
				else { x = x / (initial ? initial : 1) }
				return x * 100;
			}
		},
		s3normalized: {
			graphMods: (graph, highChartsObj) => {
				var maxS3 = Math.max(...Object.values(Graphs.portalSaveData).map((portal) => portal.s3).filter((s3) => s3));
				highChartsObj.title.text += `, Normalized to z${maxS3} S3`
			},
			customFunction: (portal, item, index, x, time, maxS3) => {
				x = x / 1.03 ** portal.s3 * 1.03 ** maxS3
				return x;
			}
		},
	},
}


// --------- Runtime ---------
if (typeof graphsBasePath === 'undefined') graphsBasePath = 'https://Quiaaaa.github.io/AutoTrimps/'; //Link to your own Github here if you forked!
if (localStorage["allSaveData"]) delete localStorage["allSaveData"]; // remove old AT graph data

Graphs.Backend.loadGraphData();
Graphs.UI.createUI()
Graphs.repairMapData() // fix for change in data structure

// Listen for Esc key presses, somehow. This is ancient eldritch mess, but it works?  
document.addEventListener(
	"keydown",
	function (a) {
		1 != game.options.menu.hotkeys.enabled || game.global.preMapsActive || game.global.lockTooltip
			|| ctrlPressed || heirloomsShown || 27 != a.keyCode || Graphs.UI.escapeATWindows();
	},
	true
);

// --------- Trimps Wrappers ---------

//On Zone transition
var originalnextWorld = nextWorld;
nextWorld = function () {
	try {
		if (game.options.menu.pauseGame.enabled) return;
		if (null === Graphs.portalSaveData) Graphs.portalSaveData = {};
		if (GraphsConfig.getGameData.world()) { Graphs.Push.zoneData(); }
	}
	catch (e) { Graphs.debugMsg("Gather info failed: ", e) }
	return originalnextWorld(...arguments);
}

//On Portal
var originalactivatePortal = activatePortal;
activatePortal = function () {
	try { Graphs.Push.zoneData(); }
	catch (e) { Graphs.debugMsg("Gather info failed: ", e) }
	return originalactivatePortal(...arguments)
}

// On Map start
// Capture the time of the previous map, upon creating a new map
// This unfortunately loses the last map, since we grab map time at the creation of the map
var originalbuildMapGrid = buildMapGrid;
buildMapGrid = function () {
	try { Graphs.Push.mapData(); }
	catch (e) { Graphs.debugMsg("Gather info failed: ", e) }
	return originalbuildMapGrid(...arguments)
}

// On leaving maps for world
// this captures the last map when you switch away from maps
var originalmapsSwitch = mapsSwitch;
mapsSwitch = function () {
	var output = originalmapsSwitch(...arguments)
	// yes these are inverted, states are changed before the function is called, whee
	// arg[0] is used for recycling maps (is it though?)
	try {
		// This is the most cursed hook ever, I swear this was working before with a much simpler check
		if (!game.global.mapsActive && !game.global.preMapsActive && arguments[0]) Graphs.Push.mapData();
	}
	catch (e) { Graphs.debugMsg("Gather info failed: ", e) }
	return output
}

// On finishing challenges (for c2s)
var originalabandonChallenge = abandonChallenge;
abandonChallenge = function () {
	try {
		Graphs.Push.zoneData(true);
	}
	catch (e) { Graphs.debugMsg("Gather info failed: ", e) }
	return originalabandonChallenge(...arguments)
}

// collect map helium data
var originalrewardResource = rewardResource;
rewardResource = function () {
	if (arguments[0] === "helium" && game.global.mapsActive) {
		try {
			var initial = GraphsConfig.getGameData.heliumOwned() || GraphsConfig.getGameData.radonOwned();
		}
		catch (e) { Graphs.debugMsg("Gather info failed: Cthulimp: ", e) }
	}
	var output = originalrewardResource(...arguments) // always call the original function
	if (arguments[0] === "helium" && game.global.mapsActive) {
		try {
			var final = GraphsConfig.getGameData.heliumOwned() || GraphsConfig.getGameData.radonOwned();
			var gas = GraphsConfig.getGameData.heliumOwned() ? "heliumOwned" : "radonOwned";
			Graphs.Push.triggerData([["mapHeRn", final - initial, true, true], [gas, final, false, false]]) // update both map He and total He
		}
		catch (e) { Graphs.debugMsg("Gather info failed: Cthulimp: ", e) }
	}
	return output
}

// collect per-giga data
var originalbuyUpgrade = buyUpgrade;
buyUpgrade = function () {
	output = originalbuyUpgrade(...arguments);
	if (arguments[0] == "Gigastation" && output) {
		try {
			y = GraphsConfig.getGameData.lastWarp();
			x = game.upgrades.Gigastation.done;
			Graphs.Push.triggerData([["warpPerGiga", y, false, false, x]])
		}
		catch (e) { Graphs.debugMsg("Gather info failed: Warps per Giga: ", e) }
	}
}



