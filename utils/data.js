const fs = require("fs");
const path = require('path');

function readJSON(file) {
    try { 
        const filePath = path.join(__dirname, '..', 'data', `${file}.json`);
        const data = fs.readFileSync(filePath, 'utf8');
        return JSON.parse(data);
    } catch {
        return [];
    }
}

function writeJSON(file, data) {
    const filePath = path.join(__dirname, '..', 'data', `${file}.json`);
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
}

module.exports = { readJSON, writeJSON };