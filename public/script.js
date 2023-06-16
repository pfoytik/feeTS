document.addEventListener('DOMContentLoaded', () => {
  const ctx = document.getElementById('chart').getContext('2d');


  function calcMA(data, windowSize) {
    const movingAverages = [];
    for (let i = 0; i < data.length - windowSize; i++) {
      const start = Math.max(0, i - windowSize + 1);
      const end = i + 1;
      const subset = data.slice(start, end);
      const average = subset.reduce((a, b) => a + b) / subset.length;
      movingAverages.push(average);
    }
    return movingAverages;
  }


  const fetchData = async () => {
    try {
      const response = await fetch('/data');
      const data = await response.json();

      const labels = data.map(d => d.timestamp);
      const values = data.map(d => d.value);

      const movingAverages = calcMA(values, 10);

      const chart = new Chart(ctx, {
        type: 'line',
        data: {
          labels: labels,
          datasets: [
            {
              label: 'Median Fee',
              data: values,
              fill: false,
              borderColor: 'blue',
              borderWidth: 1
            },
            {
              label: 'Moving Average',
              data: movingAverages,
              fill: false,
              borderColor: 'red',
              borderWidth: 1
            }
          ]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
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
              beginAtZero: true,
              title: {
                display: true,
                text: 'Median Fee'
              }
            }
          }
        }
      });

    } catch (error) {
      console.error('Error fetching data:', error.message);
    }
  };
  

  fetchData();
});
