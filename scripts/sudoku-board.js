loadScript("/scripts/sudoku-model.js");

// globals
var board = new Board();
var keys = {}; // keyboard keys currently pressed
var mouseDown = false; // mouse currently pressed
var puzzles;
var puzzleNumber = -1;

// var eventStack = []; // Records select actions from the user to allow for undoing

function Board() {
    this.cursorIndex = 0; // position of cursor
    this.add = false; // Should selection grow or be replaced?
    this.modes = {"digit":0, "note":1, "color":2};
    this.modeCount = Object.keys(this.modes).length;
    this.mode = this.modes["digit"]; // what mode are we in?
    this.lastMode = this.modes["digit"]; // Last mode used that is not the current mode
}

function init() {
    var start = new Date();
    // Drag select listeners
    // inital mouse click
    $("#grid td").mousedown(function (e) {
        if (!board.add) 
            clearSelection();
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
            // dragging a click is the special case where selection is ALWAYS added to the board, 
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

        if (keys[" "]) { setMode(board.mode + 1, board); }
        if (keys["Shift"]) { setMode(board.modes["note"], board) }
        if (keys["Control"]) { board.add = true; }
        if (keys["Enter"]) { lockTiles(); }

        if (e.which >= 49 && e.which <= 57)  { // keys 1-9
            var digit = e.which - 48;
            insert(digit, board);
            // validate board, if error checking switch is enabled and a digit is placed (Later if something is deleted)
            if ($("#errorSwitch").is(':checked') && board.mode == board.modes["digit"]) 
                validateBoard();
        }
        if (keys["ArrowUp"]) { moveCursor("up", board); }
        if (keys["ArrowDown"]) { moveCursor("down", board); }
        if (keys["ArrowLeft"]) { moveCursor("left", board); }
        if (keys["ArrowRight"]) { moveCursor("right", board); }

        if (keys["Delete"] || keys["Backspace"]) { 
            if (board.mode == board.modes["color"])
                insertColor(0);
            else {
                resetTiles();
                // validate board, if error checking switch is enabled 
                if ($("#errorSwitch").is(':checked')) 
                    validateBoard();
            }
        }

        if (e.key != "Shift" && e.key != "Control") // Non-modifyer keys
            keys[e.key] = false;
    });

    // detect modifier key up
    $(document).keyup(function (e) {
        if (e.key == "Control") { board.add = false; }
        if (e.key == "Shift") { setMode(board.lastMode, board); }
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

    // Load pre-made puzzles
    $.getJSON("scripts/puzzles.json", function(data) {
        puzzles = data["puzzles"];
    });

    console.log("Loading done, elapsed time (s): " + (new Date() - start) / 1000);
}

function toggleErrorChecking() {
    if ($("#errorSwitch").is(':checked'))
        validateBoard();
    else
        clearErrors();
}

function nextPuzzle() {
    puzzleNumber = Math.min(puzzleNumber + 1, puzzles.length - 1);
    setPuzzle(puzzles[puzzleNumber], 9);
}

function previousPuzzle() {
    puzzleNumber = Math.max(puzzleNumber - 1, 0);
    setPuzzle(puzzles[puzzleNumber], 9);
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
        setPuzzle(board, size);
    });
}

function setPuzzle(board, size) {
    clearBoard();
    for (var row = 0; row < size; row++) {
            for (var col = 0; col < size; col++) {
                if (board[row][col] != 0) {
                    insertDigit(board[row][col], index1D(row, col), true);
                }
            }
        }
}

function loadScript(url) {
    var script = document.createElement("script");  // create a script DOM node
    script.src = url;  // set its src to the provided URL

    document.body.appendChild(script);
}

init();