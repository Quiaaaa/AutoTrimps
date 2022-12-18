var basepath = 'https://Quiaaaa.github.io/AutoTrimps/' //Link to your own Github here if you forked!

//var isSteam = false;

function ATscriptLoad(path, module) {
    if (module == null) debug('Wrong Syntax. Script could not be loaded.')
    if (path == null) path = '';
    var scriptElem = document.createElement('script');
    scriptElem.src = basepath + path + module + '.js'
    scriptElem.id = module + '_MODULE'
    document.head.appendChild(scriptElem)
}

function initializeGraphs() {
    ATscriptLoad('', 'Graphs');
    debug('AutoTrimps - Zek Graphs Only Fork Loaded!', '*spinner3');
}

var enableDebug = false;
function debug(message, type, lootIcon) {
    if (enableDebug)
        console.debug(0 + ' ' + message);
}

var MODULES = {}
var startupDelay = 1000;
setTimeout(initializeGraphs, startupDelay);

