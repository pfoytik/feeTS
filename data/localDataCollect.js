/*
create an sqlite database and create a table for height, timestamp, and medianfee
*/
const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('data/data.db');
db.serialize(() => {
    db.run('CREATE TABLE IF NOT EXISTS data (height INTEGER, timestamp INTEGER, medianfee INTEGER)');
    db.run('CREATE TABLE IF NOT EXISTS seasonal (height INTEGER, timestamp INTEGER, medianfee INTEGER)');
    db.run('CREATE TABLE IF NOT EXISTS trend (height INTEGER, timestamp INTEGER, medianfee INTEGER)');
    }
);

/*
use mempool.space/api/v1/blocks/ api to get all the blocks data by 15 blocks
*/
const axios = require('axios');
const { STL } = require('node-statsd');
const apiUrl = 'https://mempool.space/api/v1/blocks';

const fetchBlockData = async () => {
    const response = await axios.get(apiUrl);
    return response.data;
    }

const fetchBlockDataHeight = async (height) => {
    const response = await axios.get(apiUrl + '/' + height);
    return response.data;
    }

/*
read response of fetchBlockData and extract height, timestamp, and medianfee
*/
const readBlockData = async () => {
    const blockData = await fetchBlockData();
    const timeSeriesData = blockData.map((block) => ({
        height: block.height,
        timestamp: block.timestamp,
        value: block.extras.medianFee,
    }));
    return timeSeriesData;
    }

// overload readBlockData to read data from a specific height
const readBlockDataHeight = async (height) => {
    const blockData = await fetchBlockDataHeight(height);
    const timeSeriesData = blockData.map((block) => ({
        height: block.height,
        timestamp: block.timestamp,
        value: block.extras.medianFee,
    }));
    return timeSeriesData;
    }


/*
record the timeSeriesData into the database
*/
const recordBlockData = async () => {
    timeSeriesData = await readBlockData();
    console.log(timeSeriesData[0].height);
    console.log(timeSeriesData[timeSeriesData.length-1].height);
    
    let low = timeSeriesData[timeSeriesData.length-1].height;
    
    
    while(low > 794600) {
        const stmt = db.prepare('INSERT INTO data VALUES (?, ?, ?)');
        for (const data of timeSeriesData) {
            console.log(data.height, data.timestamp, data.value);
            stmt.run(data.height, data.timestamp, data.value);
            }
        stmt.finalize();
        
        
        timeSeriesData = await readBlockDataHeight(low);
        low = timeSeriesData[timeSeriesData.length-1].height;
    }
}
    

//run this file
recordBlockData();

