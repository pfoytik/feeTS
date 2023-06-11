const express = require('express');
const uplot = require('uplot');

const app = express();

// Set the working directory to demos
process.chdir('uPlot/demos');

app.get('/', (req, res) => {
  // Create a scatter plot
  const plot = uplot.scatter('x', 'y');

  // Add data to the scatter plot
  plot.addData([
    [1, 2],
    [3, 4],
    [5, 6],
  ]);

  // Render the scatter plot
  res.render('index.html', { plot });
});

app.listen(3000, () => {
  console.log('Listening on port 3000');
});
