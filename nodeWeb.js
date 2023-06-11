
var http = require('http'),
	fs = require('fs');

const uPlot = require('./uPlot')


let data = [
  [1546300800, 1546387200],    // x-values (timestamps)
  [        35,         71],    // y-values (series 1)
  [        90,         15],    // y-values (series 2)
];


fs.readFile('./scatter.html', function (err, html) {
	if (err) {
		throw err;
	}
	http.createServer(function (request, response) {
		response.writeHeader(200, {"Content-Type": "text/html"});
		response.write(html);
		response.end();
	}).listen(8081);
});


