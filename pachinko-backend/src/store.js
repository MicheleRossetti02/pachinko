const fs = require('fs');
const path = require('path');

const DATA_FILE = path.join(__dirname, '..', 'data.json');

function readData(){
  if (!fs.existsSync(DATA_FILE)){
    const init = {
      prizes: [
        { id: 'p0', label: 'Niente', weight: 40, column: null },
        { id: 'p1', label: 'Birra', weight: 20, column: null },
        { id: 'p2', label: 'Vino Rosso', weight: 8, column: null },
        { id: 'p3', label: 'Vino Bianco', weight: 6, column: null },
        { id: 'p4', label: 'Rosè', weight: 6, column: null },
        { id: 'p5', label: 'Toast', weight: 10, column: null },
        { id: 'p6', label: 'Nachos', weight: 10, column: null }
      ],
      stats: { plays: 0, wins: {} },
      layout: { columns: 9 }
    };
    fs.writeFileSync(DATA_FILE, JSON.stringify(init, null, 2));
  }
  return JSON.parse(fs.readFileSync(DATA_FILE));
}

function writeData(d){
  fs.writeFileSync(DATA_FILE, JSON.stringify(d, null, 2));
}

module.exports = { readData, writeData };
