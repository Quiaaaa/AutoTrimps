var basepath = 'https://Quiaaaa.github.io/AutoTrimps/' //Link to your own Github here if you forked!

//var isSteam = false;

function ATscriptLoad(path, module) {
  if (module == null) graphsDebug('Wrong Syntax. Script could not be loaded.')
  if (path == null) path = '';
  var scriptElem = document.createElement('script');
  scriptElem.src = basepath + path + module + '.js'
  scriptElem.id = module + '_MODULE'
  document.head.appendChild(scriptElem)
}

function initializeGraphs() {
  ATscriptLoad('', 'Graphs');
  graphsDebug('AutoTrimps - Zek Graphs Only Fork Loaded!', '*spinner3');
}

var enableGraphsDebug = false;
function graphsDebug(message) {
  if (enableGraphsDebug)
    console.debug(...arguments);
}

if (typeof MODULES === 'undefined') MODULES = {}
var startupDelay = 1000;
setTimeout(initializeGraphs, startupDelay);

