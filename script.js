// Initialize variables
let lifeGrid, rows = 50, cols = 50, perceptron, outputChart;
let intervalId = null;
let isRunning = false;

// Initialize Gun.js
const gun = Gun();



document.addEventListener("DOMContentLoaded", function() {
  // Initialize new chart
  const ctxChart = document.getElementById('outputChartCanvas').getContext('2d');
  outputChart = new Chart(ctxChart, {
    type: 'line',
    data: {
      labels: [],
      datasets: [{
        label: 'Perceptron Output',
        data: [],
        borderColor: 'rgba(75, 192, 192, 1)',
        borderWidth: 1
      }]
    },
    options: {
      scales: {
        y: {
          beginAtZero: true
        }
      }
    }
  });

  // Initialize canvas and context for lifeGrid
  const canvas = document.getElementById("mainCanvas");
  const ctx = canvas.getContext("2d");

  // Initialize canvas and context for Perceptron output
  const perceptronCanvas = document.getElementById("perceptronCanvas");
  const perceptronCtx = perceptronCanvas.getContext("2d");

  // Initialize grid variables
  const rows = 150;
  const cols = 150;
  const cellWidth = canvas.width / cols;
  const cellHeight = canvas.height / rows;

  let lifeGrid = Array.from({ length: rows }, () => 
    Array.from({ length: cols }, () => Math.random() < 0.5 ? 0 : 1)
  );

  class Perceptron {
    constructor(inputCount) {
      this.weights = Array.from({ length: inputCount }, () => Math.random() * 2 - 1);
      this.bias = Math.random() * 2 - 1;
      this.learningRate = 0.1;
    }

    tanh(x) {
      return Math.tanh(x);
    }

    feedForward(inputs) {
      let sum = this.bias + inputs.reduce((acc, val, i) => acc + this.weights[i] * val, 0);
      return this.tanh(sum);
    }

    train(inputs, target) {
      const guess = this.feedForward(inputs);
      const error = target - guess;
      this.weights = this.weights.map((w, i) => w + this.learningRate * error * inputs[i]);
      this.bias += this.learningRate * error;
      return error;
    }
  }

  const perceptron = new Perceptron(rows * cols);

  const clearCanvas = (context, canvas) => context.clearRect(0, 0, canvas.width, canvas.height);

  const drawLifeGrid = () => {
    lifeGrid.forEach((row, i) => {
      row.forEach((cell, j) => {
        ctx.fillStyle = cell ? "red" : "blue";
        ctx.fillRect(j * cellWidth, i * cellHeight, cellWidth, cellHeight);
      });
    });
  };

  const drawPerceptronOutput = () => {
    lifeGrid.forEach((row, i) => {
      row.forEach((cell, j) => {
        const input = [cell];
        const output = perceptron.feedForward(input);
        const colorValue = Math.floor((output + 1) * 127.5);
        perceptronCtx.fillStyle = `rgb(${colorValue}, ${colorValue}, ${colorValue})`;
        perceptronCtx.fillRect(j * cellWidth, i * cellHeight, cellWidth, cellHeight);
      });
    });
  };
  
  const updateGrid = () => {
    const newGrid = Array.from({ length: rows }, () => Array(cols).fill(0));

    for (let i = 0; i < rows; i++) {
      for (let j = 0; j < cols; j++) {
        const neighbors = [
          [i - 1, j - 1], [i - 1, j], [i - 1, j + 1],
          [i, j - 1],                   [i, j + 1],
          [i + 1, j - 1], [i + 1, j], [i + 1, j + 1]
        ];

        const liveNeighbors = neighbors.reduce((acc, [x, y]) => {
          if (x >= 0 && x < rows && y >= 0 && y < cols) {
            acc += lifeGrid[x][y];
          }
          return acc;
        }, 0);

        newGrid[i][j] = (lifeGrid[i][j] && (liveNeighbors === 2 || liveNeighbors === 3)) || (!lifeGrid[i][j] && liveNeighbors === 3) ? 1 : 0;
      }
    }

   
    const flatGrid = newGrid.flat();
    const aliveCells = flatGrid.reduce((acc, val) => acc + val, 0);
    const target = aliveCells > 25 ? 1 : 0;

    const error = perceptron.train(flatGrid, target);
    document.getElementById("loss").innerText = Math.abs(error).toFixed(4);

    const output = perceptron.feedForward(flatGrid);
    document.getElementById("outputValue").innerText = output.toFixed(4);
    

    lifeGrid = newGrid;
    drawLifeGrid();
 // Send output to Gun.js
 gun.get('neuralNetworkOutput').put({
    output: output
  });

  // Update the chart
  outputChart.data.labels.push(new Date().toLocaleTimeString());
  outputChart.data.datasets[0].data.push(output);
  outputChart.update();

  // Limit the number of data points
  if (outputChart.data.labels.length > 20) {
    outputChart.data.labels.shift();
    outputChart.data.datasets[0].data.shift();
  }
    

  // Limit the number of data points
  if (outputChart.data.labels.length > 20) {
    outputChart.data.labels.shift();
    outputChart.data.datasets[0].data.shift();
  }
    // Clear both canvases
    clearCanvas(ctx, canvas);
    clearCanvas(perceptronCtx, perceptronCanvas);
     // Redraw the life grid
  drawLifeGrid();

  // Draw the Perceptron output
  drawPerceptronOutput();
};



document.getElementById("toggleBtn").addEventListener("click", () => {
  const toggleBtn = document.getElementById("toggleBtn");
  if (!isRunning) {
    intervalId = setInterval(updateGrid, 500);
    isRunning = true;
    toggleBtn.innerText = "Stop";
  } else {
    clearInterval(intervalId);
    isRunning = false;
    toggleBtn.innerText = "Start";
  }
});
 // Initial draw
 drawLifeGrid();
 drawPerceptronOutput();  // Draw this initially too
});