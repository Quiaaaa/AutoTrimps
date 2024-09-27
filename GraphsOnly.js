var graphsBasePath = 'https://Quiaaaa.github.io/AutoTrimps/' //Link to your own Github here if you forked!
//var graphsBasePath = '/AutoTrimps/'

function injectScript(id, src) {
	const script = document.createElement('script');
	script.id = id;
	script.src = src;
	script.setAttribute('crossorigin', 'anonymous');
	document.head.appendChild(script);
}

setTimeout(() => injectScript('Graphs', graphsBasePath + 'Graphs.js'), 1000);
