// helper functions

// random functions
function randomInt(n) {
    return Math.floor(Math.random() * n);
};

function randomBit() {
    return randomInt(2);
};

function randomSign() {
    return Math.pow(-1, randomInt(2));
}

// array functions
function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
};

function numArray(n) {
    let arr = [];
    for(let i = 0; i < n; i++) {
        arr.push(i);
    }
    return arr;
}

// color functions
function rgb(r, g, b) {
    return "rgb(" + r + "," + g + "," + b + ")";
};

function hsl(h, s, l) {
    return "hsl(" + h + "," + s + "%," + l + "%)";
};

// distance functions
function distance(a, b) {
    return Math.sqrt(Math.pow(b.x - a.x, 2) + Math.pow(b.y - a.y, 2));
}

function length(a) {
    return Math.sqrt(a.x*a.x + a.y*a.y);
}

// 2d vector functions
function normalize(a) {
    var magnitude = length(a);
    if (magnitude != 0) {
        a.x /= magnitude;
        a.y /= magnitude;
    }
}

function limit(a, max) {
    var magnitude = length(a);
    if (magnitude > max) {
        a.x *= max / magnitude;
        a.y *= max /magnitude;
    }
}

// download text file
function download(filename, text) {
    var pom = document.createElement('a');
    pom.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(text));
    pom.setAttribute('download', filename);
    pom.click();
};

// database functions
function databaseConnected() {
    const dbDiv = document.getElementById("db");
    dbDiv.classList.remove("db-disconnected");
    dbDiv.classList.add("db-connected");
};

function databaseDisconnected() {
    const dbDiv = document.getElementById("db");
    dbDiv.classList.remove("db-connected");
    dbDiv.classList.add("db-disconnected");
};