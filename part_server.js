const express = require('express');
const { formatISO } = require('date-fns');
const axios = require('axios');
const app = express();

// Fetch block data from Mempool.space API
const fetchBlockData = async () => {
  const apiUrl = 'https://mempool.space/api/v1/blocks';
  const response = await axios.get(apiUrl);
  return response.data;
};

app.get('/data', async (req, res) => {
  try {
    const blockData = await fetchBlockData();

    // Extract median fee and timestamp
    const timeSeriesData = blockData.map(block => ({
      timestamp: block.timestamp,
      value: block.extras.medianFee
    }));

    res.json(timeSeriesData);
  } catch (error) {
    console.error('Error fetching block data:', error.message);
    res.status(500).send('Error fetching block data');
  }
});

app.use(express.static('public'));

const port = 3001;
app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});

