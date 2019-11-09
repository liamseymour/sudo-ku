loadScript("/scripts/sudoku-model.js");

// globals
const modeCount = 3;
const modes = {"digit":0, "note":1, "color":2};

var board = new Board();
var keys = {}; // keyboard keys currently pressed
var mouseDown = false; // mouse currently pressed
var mode = modes["digit"]; // what mode are we in?
var lastMode = modes["digit"]; // Last mode used that is not the current mode
// var eventStack = []; // Records select actions from the user to allow for undoing

function Board() {
    this.cursorIndex = 0; // position of cursor
    this.add = false; // Should selection grow or be replaced?
}

function init() {
    var start = new Date();

    // Drag select listeners
    // inital mouse click
    $("#grid td").mousedown(function (e) {
        if (!board.add) { clearSelection(); }
        $(this).addClass("selected");
        var row = $(this).parent().attr("id").charCodeAt(0) - "A".charCodeAt(0);
        // find all single digits and parse the first one
        var col = parseInt(($(this).attr("class")).match(/\d/)[0]); 
        setCursor(index1D(row, col - 1), board);
        e.preventDefault();
        mouseDown = true;
    });
    // Click and drag
    $("#grid td").mouseover(function (e) {
        if (mouseDown) {
            $(this).addClass("selected");
            var row = $(this).parent().attr("id").charCodeAt(0) - "A".charCodeAt(0);
            // find all single digits and parse the first one
            var col = parseInt(($(this).attr("class")).match(/\d/)[0]);
            // dragging a click ins the special case where selection is ALWAYS added to the board, 
            // but we still need to pass a board object and do not want to permanently change it
            previousAddState = board.add;
            board.add = true;
            setCursor(index1D(row, col - 1), board);
            board.add = previousAddState;
        }
    });
    // detect mouse up
    $(document).mouseup(function (e) {
        mouseDown = false;
    });

    // Key event handler
    $(document).keydown(function (e) {
        e.preventDefault();
        keys[e.key] = true;

        if (keys[" "]) { setMode(mode + 1); }
        if (keys["Shift"]) { setMode(modes["note"]) }
        if (keys["Control"]) { board.add = true; }
        if (keys["Enter"]) { lockTiles(); }

        if (e.which >= 49 && e.which <= 57)  { // keys 1-9
            var digit = e.which - 48;
            if (mode == modes["note"]) { insertNote(digit); }
            else if (mode == modes["digit"]) { insertDigits(digit); }
            else if (mode == modes["color"]) { insertColor(digit); }
        }
        if (keys["w"] || keys["W"] || keys["ArrowUp"]) { moveCursor("up", board); }
        if (keys["s"] || keys["S"] || keys["ArrowDown"]) { moveCursor("down", board); }
        if (keys["a"] || keys["A"] || keys["ArrowLeft"]) { moveCursor("left", board); }
        if (keys["d"] || keys["D"] || keys["ArrowRight"]) { moveCursor("right", board); }

        if (keys["Delete"] || keys["Backspace"]) { 
            if (mode == modes["color"]) {
                insertColor(8);
            } else {
                resetTiles();
            }
        }

        if (e.key != "Shift" && e.key != "Control") { // Non-modifyer keys
            keys[e.key] = false;
            if ($("#errorSwitch").is(':checked')) // validate board, if error checking switch is enabled
                validateBoard();
        }
    });

    // detect modifier key up
    $(document).keyup(function (e) {
        if (e.key == "Control") { board.add = false; }
        if (e.key == "Shift") { setMode(lastMode); }
        if (e.key == "Shift" || e.key == "Control") { 
            keys[e.key] = false;
        }
    });

    // Prevents spacebar from activating buttons
    document.querySelectorAll("button, input").forEach( function(item) {
        item.addEventListener('focus', function() {
            this.blur();
        })
    });

    console.log("Loading done, elapsed time (s): " + (new Date() - start) / 1000);
}

function toggleErrorChecking() {
    if ($("#errorSwitch").is(':checked'))
        validateBoard();
    else
        clearErrors();
}

/**
 * Changes global variable accordingly, if nextMode >= mode count, it will cycle back to acceptable range
 * Updates css to reflect changes. 
 * Updates global variable lastMode. 
 * @param {number} nextMode An integer for what mode to change to.
 */
function setMode(nextMode) {
    if (nextMode != mode) {
        lastMode = mode;
    }
    mode = nextMode % modeCount;
    $(".fill-pane").removeClass("selected");
    $(".pencil-pane").removeClass("selected");
    $(".color-pane").removeClass("selected");

    if (mode == modes["digit"]) {
        $(".fill-pane").addClass("selected");
    } else if (mode == modes["note"]) {
        $(".pencil-pane").addClass("selected");
    } else if (mode == modes["color"]) {
        $(".color-pane").addClass("selected");
    }
}

function hardPuzzle() {
    getPuzzle(9, "hard");
}

function mediumPuzzle() {
    getPuzzle(9, "medium");
}

function easyPuzzle() {
    getPuzzle(9, "easy");
}

function getPuzzle(size, difficulty) {
    clearBoard();
    $.getJSON("https://sugoku.herokuapp.com/board?difficulty=" + difficulty, function(data) {
        var board = data["board"];
        for (var row = 0; row < size; row++) {
            for (var col = 0; col < size; col++) {
                if (board[row][col] != 0) {
                    insertDigit(board[row][col], index1D(row, col), true);
                }
            }
        }
    });
}

function loadScript(url) {
    var script = document.createElement("script");  // create a script DOM node
    script.src = url;  // set its src to the provided URL

    document.body.appendChild(script);
}

init();