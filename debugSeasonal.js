const express = require('express');
const { formatISO } = require('date-fns');
const axios = require('axios');
const { STL } = require('node-statsd');

const app = express();

// Fetch block data from Mempool.space API
const fetchBlockData = async () => {
  const apiUrl = 'https://mempool.space/api/v1/blocks';
  const response = await axios.get(apiUrl);
  return response.data;
};

app.get('/', async (req, res) => {
  try {
    const blockData = await fetchBlockData();

    // Extract median fee and timestamp
    const timeSeriesData = blockData.map((block) => ({
      timestamp: block.timestamp,
      value: block.extras.medianFee,
    }));

    // Extract values for seasonal decomposition
    const values = timeSeriesData.map((data) => data.value);

    // Perform seasonal decomposition
    const decomposition = new STL().setValues(values).forecast();

    // Extract seasonal, trend, and remainder components
    const seasonalComponent = decomposition.seasonal;
    const trendComponent = decomposition.trend;
    const remainderComponent = decomposition.remainder;

    res.send(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Median Fee Time Series</title>
          <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
          <script src="https://cdn.jsdelivr.net/npm/date-fns"></script>
          <script src="https://cdn.jsdelivr.net/npm/chartjs-adapter-date-fns/dist/chartjs-adapter-date-fns.bundle.min.js"></script>
        </head>
        <body>
          <canvas id="chart"></canvas>
          <canvas id="seasonalChart"></canvas>
          <script>
            const ctx = document.getElementById('chart').getContext('2d');
            const labels = ${JSON.stringify(timeSeriesData.map((data) => formatISO(new Date(data.timestamp))))};
            const data = ${JSON.stringify(timeSeriesData.map((data) => data.value))};
            const chart = new Chart(ctx, {
              type: 'line',
              data: {
                labels: labels,
                datasets: [{
                  label: 'Median Fee',
                  data: data,
                  type: 'line',
                  fill: false,
                  borderColor: 'blue',
                  borderWidth: 1
                }]
              },
              options: {
                responsive: true,
                scales: {
                  x: {
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
                    title: {
                      display: true,
                      text: 'Median Fee'
                    }
                  }
                }
              }
            });

            const seasonalCtx = document.getElementById('seasonalChart').getContext('2d');
            const seasonalChart = new Chart(seasonalCtx, {
              type: 'line',
              data: {
                labels: labels,
                datasets: [{
                  label: 'Seasonal Component',
                  data: ${JSON.stringify(seasonalComponent)},
                  type: 'line',
                  fill: false,
                  borderColor: 'green',
                  borderWidth: 1
                }, {
                  label: 'Trend Component',
                  data: ${JSON.stringify(trendComponent)},
                  type: 'line',
                  fill: false,
                  borderColor: 'red',
                  borderWidth: 1
                }, {
                  label: 'Remainder Component',
                  data: ${JSON.stringify(remainderComponent)},
                  type: 'line',
                  fill: false,
                  borderColor: 'purple',
                  borderWidth: 1
                }]
              },
              options: {
                responsive: true,
                scales: {
                  x: {
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
                    title: {
                      display: true,
                      text: 'Component Value'
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
