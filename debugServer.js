const express = require('express');
const { formatISO } = require('date-fns');
const axios = require('axios');
const app = express();

// Fetch block data from Mempool.space API
//const fetchBlockData = async () => {
//  const apiUrl = 'https://mempool.space/api/v1/blocks';
//  const response = await axios.get(apiUrl);
//  return response.data;
//};

//read file blocks.json
const fs = require('fs');
const fetchBlockData = async () => {
  const data = fs.readFileSync('blocks.json', 'utf8');
  return JSON.parse(data);
};

// Calculate the moving average
const calculateMovingAverage = (data, windowSize) => {
  const movingAverage = [];
  for (let i = 0; i < data.length; i++) {
    if (i < windowSize) {
      movingAverage.push(null); // Set null for the first (windowSize - 1) data points
    } else {
      const sum = data.slice(i - windowSize + 1, i + 1).reduce((a, b) => a + b, 0);
      const average = sum / windowSize;
      movingAverage.push(average);
    }
  }
  return movingAverage;
};

app.get('/', async (req, res) => {
  try {
    const blockData = await fetchBlockData();

    // Extract median fee and timestamp
    const timeSeriesData = blockData.map(block => ({
      timestamp: block.timestamp,
      value: block.extras.medianFee
    }));

    // Calculate the moving average with a window size of 7 (1 week)
    const movingAverage = calculateMovingAverage(
      timeSeriesData.map(data => data.value),
      7
    );

    res.send(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Median Fee Time Series</title>
          <style>
            canvas {
              display: block;
              width: 100%;
              height: 100%;
            }
          </style>
          <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
          <script src="https://cdn.jsdelivr.net/npm/date-fns"></script>
          <script src="https://cdn.jsdelivr.net/npm/chartjs-adapter-date-fns/dist/chartjs-adapter-date-fns.bundle.min.js"></script>
        </head>
        <body>
          <canvas id="chart"></canvas>
          <script>
            const ctx = document.getElementById('chart').getContext('2d');
            const labels = ${JSON.stringify(timeSeriesData.map(data => formatISO(new Date(data.timestamp))))};
            const data = ${JSON.stringify(timeSeriesData.map(data => data.value))};
            const movingAverage = ${JSON.stringify(movingAverage)};
            const chart = new Chart(ctx, {
              type: 'bar',
              data: {
                labels: labels,
                datasets: [{
                  label: 'Median Fee',
                  data: data,
                  type: 'bar',
                  backgroundColor: 'rgba(0, 0, 255, 0.2)',
                  borderColor: 'blue',
                  borderWidth: 1
                }, {
                  label: 'Moving Average',
                  data: movingAverage,
                  type: 'line',
                  fill: false,
                  borderColor: 'red',
                  borderWidth: 2
                }]
              },
              options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                  x: {
                    beginAtZero: true,
                    type: 'time',
                    time: {
                      unit: 'day',
                      displayFormats: {
                        day: 'yyyy-MM-dd'
                      }
                    },
                    title: {
                      display: true,
                      text: 'Timestamp'
                    }
                  },
                  y: {
                    beginAtZero: true,
                    title: {
                      display: true,
                      text: 'Median Fee'
                    }
                  }
                }
              }
            });
          </script>
        </body>
      </html>
    `);
  } catch (error) {
    console.error('Error fetching block data:', error.message);
    res.status(500).send('Error fetching block data');
  }
});

const port = 3001;
app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
