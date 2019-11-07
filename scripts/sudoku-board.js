const modeCount = 3;
const modes = {"digit":0, "note":1, "color":2};

// globals
var cursor = 0; // position of cursor
var keys = {}; // keyboard keys currently pressed
var add = false; // Should tiles be added to current selection?
var mouseDown = false; // mouse currently pressed
var mode = modes["digit"]; // what mode are we in?
var lastMode = modes["digit"]; // Last mode used that is not the current mode
var eventStack = []; // Records select actions from the user to allow for undoing
var errorCheck = false; // Should the board automatically check for errors

function init() {
    var start = new Date();

    if ($("#errorSwitch").is(':checked'))
        errorCheck = true;

    // Drag select listeners
    // Click and drag
    $("#grid td").mouseover(function (e) {
        if (mouseDown) {
            $(this).addClass("selected");
            var row = $(this).parent().attr("id").charCodeAt(0) - "A".charCodeAt(0);
            // find all single digits and parse the first one
            var col = parseInt(($(this).attr("class")).match(/\d/)[0]); 
            setCursor(index1D(row, col - 1), true);
        }
    });
    // inital mouse click
    $("#grid td").mousedown(function (e) {
        if (!add) { clearSelection(); }
        $(this).addClass("selected");
        var row = $(this).parent().attr("id").charCodeAt(0) - "A".charCodeAt(0);
        // find all single digits and parse the first one
        var col = parseInt(($(this).attr("class")).match(/\d/)[0]); 
        setCursor(index1D(row, col - 1), add);
        e.preventDefault();
        mouseDown = true;
    });
    // detect mouse up
    $(document).mouseup(function (e) {
        mouseDown = false;
    });

    // Prevents spacebar from activating buttons
    document.querySelectorAll("button, input").forEach( function(item) {
        item.addEventListener('focus', function() {
            this.blur();
        })
    });


    // Key event handler
    $(document).keydown(function (e) {
        e.preventDefault();
        keys[e.key] = true;

        if (keys[" "]) { setMode(mode + 1); }
        if (keys["Shift"]) { setMode(modes["note"]) }
        if (keys["Control"]) { add = true; }
        if (keys["Enter"]) { lockTiles(); }

        if (e.which >= 49 && e.which <= 57)  { // keys 1-9
            var digit = e.which - 48;
            if (mode == modes["note"]) { insertNote(digit); }
            else if (mode == modes["digit"]) { insertDigits(digit); }
            else if (mode == modes["color"]) { insertColor(digit); }
        }
        if (keys["w"] || keys["W"] || keys["ArrowUp"]) { moveCursor("up", add); }
        if (keys["s"] || keys["S"] || keys["ArrowDown"]) { moveCursor("down", add); }
        if (keys["a"] || keys["A"] || keys["ArrowLeft"]) { moveCursor("left", add); }
        if (keys["d"] || keys["D"] || keys["ArrowRight"]) { moveCursor("right", add); }

        if (keys["Delete"] || keys["Backspace"]) { 
            if (mode == modes["color"]) {
                insertColor(8);
            } else {
                resetTile();
            }
        }

        if (e.key != "Shift" && e.key != "Control") { // Non-modifyer keys
            keys[e.key] = false;
            if (errorCheck)
                validateBoard();
        }
    });

    // detect modifier key up
    $(document).keyup(function (e) {
        if (e.key == "Control") { add = false; }
        if (e.key == "Shift") { setMode(lastMode); }
        if (e.key == "Shift" || e.key == "Control") { 
            keys[e.key] = false;
        }
    });
    console.log("Loading done, elapsed time (s): " + (new Date() - start) / 1000);
}

function toggleErrorChecking() {
    errorCheck = !errorCheck;
    if (errorCheck)
        validateBoard();
    else
        clearErrors();
}

/**
 * @param {integer[]} tiles An array of tiles to select. The tile is represented 
 * by its absolute position (0 indexed). Requires: 0 <= tiles[i] <= 80.
 * @param {boolean} add If add is true, tiles will be added to current selection. 
 * If false, tiles will overide/replace current selection
 */
function selectTiles(tiles, add) {
    if (!add) { clearSelection(); }

    for (var i = 0; i < tiles.length; i++) {
        var row = index2D(tiles[i])[0]
        var col = index2D(tiles[i])[1]

        $("#grid tr:nth-child("+ (row+1) +") td:nth-child("+ (col+1) +")").addClass("selected");
    }
}


/**
 * @param {number} tile An integer representing where the cursor should be.
 * @param {boolean} add If add is true, tiles will be added to current selection. 
 * If false, tiles will overide/replace current selection
 * The cursor is essentially a special case of selection (class="selected"). 
 * Unlike selection, there can only be on cursor, hence its
 * implementation with html id. The cursor tile is also always selected.
 */
function setCursor(tile, add) {
    cursor = tile;
    var row = index2D(tile)[0]
    var col = index2D(tile)[1]

    // Remove cursor
    $("#grid td.cursor").removeClass("cursor")
    // Clear selection
    if (!add) { clearSelection(); }

    // Select tile and set cursor to tile
    $("#grid tr:nth-child("+ (row+1) +") td:nth-child("+ (col+1) +")").addClass("selected cursor");
}

/**
 * Clears the whole grid in regards to selection.
 */
function clearSelection() {
    for (var i = 0; i < 9; i++) {
        for (var j = 0; j < 9; j++) {
            $("#grid tr:nth-child("+ (i + 1) +") td:nth-child("+ (j + 1) +")").removeClass("selected");
        }
    }
}

/**
 * Converts a 1d index to a 2d index and returns as a array of length 2: [row, column]
 * @param {number} tile Index to be converted.
 */
function index2D(tile) {
    return [Math.floor(tile / 9), tile % 9];
}


/**
 * Converts a 2d index to a 1d index and returns the 1d index as an integer
 * @param {number} row Row index to be converted.
 * @param {number} col Column index to be converted.
 */
function index1D(row, col) {
    return row * 9 + col;
}

/**
 * Sets the class of selected tiles to be the appropriate color.
 */
function insertColor(number) {
    colorMap = {1:"red", 2:"green", 3:"blue", 4:"yellow",
                5:"magenta", 6:"mint", 7:"lightblue", 8:"white",
                9:"black"};
    $("#grid td.selected div").removeClass("red green blue yellow magenta mint lightblue white black");
    $("#grid td.selected div").addClass(colorMap[number]);
}

/**
 * Places a digit into the selection on the board.
 * @param {number} digit Interger in [1, 9] to be placed.
 * This replaces notes and digits already in the selection.
 * Delete the digit and set the tile to a note if the same digit is entered into it.
 */
function insertDigits(digit) {
    $("#grid td.selected div").each(function() {
        if (!$("#grid td.selected").hasClass("locked")) {
            $("#grid td.selected").addClass("digit");
            $("#grid td.selected").removeClass("note");
            $(this).text(digit.toString());
        }
    });
}

function insertDigit(digit, tile, lock) {
    var row = index2D(tile)[0]
    var col = index2D(tile)[1]
    tileElem = $("#grid tr:nth-child("+ (row+1) +") td:nth-child("+ (col+1) +")");
    // Select tile and set cursor to tile
    tileElem.addClass("digit");
    tileElem.removeClass("note");
    if (lock) {
        tileElem.addClass("locked");
    }
    $("#grid tr:nth-child("+ (row+1) +") td:nth-child("+ (col+1) +") div").text(digit.toString());
}

/**
 * Clears digits and notes from selection.
 */
function resetTile() {
    $("#grid td.selected").each(function() {
        if (!$(this).hasClass("locked")) {
            $(this).removeClass("digit");
            $(this).removeClass("note");
            $(this).children("div").text("");
        }
    });
}

/**
 * Places a note into the selection on the board.
 * @param {number} digit Interger in [1, 9] to be placed.
 * This replaces digits already in the selection. If the note is
 * already in the tile, remove it. Otherwise add it to the notes.
 */
function insertNote(digit) {
    $("#grid td.selected").each(function() {
        if ($(this).hasClass("digit")) {
            // do this
        } else {
            var currentNotes = $(this).children("div").text();
            var notes = new Array(9);
            for (var i = 0; i < 9; i++) {
                notes[i] = false;
            }
            for (var i = 0; i < currentNotes.length; i++) {
                var num = parseInt(currentNotes.charAt(i));
                notes[num-1] = true;
            }
            notes[digit-1] = !notes[digit-1]; // flips if the digit should be a note
            var newNotes = "";
            for (var i = 0; i < 9; i++) {
                if (notes[i]) {
                    newNotes = newNotes + (i+1).toString();
                }
            }
            $(this).children("div").text(newNotes);
            $(this).addClass("note");
        }
    });
}

/**
 * Moves the cursor orthogonally and wraps around the board.
 */
function moveCursor(direction, add) {
    if (direction.toLowerCase().charAt(0) == "u") {
        if ( (cursor - 9) >= 0) {
            cursor -= 9;
        } else {
            cursor += 72;
        }
    } else if (direction.toLowerCase().charAt(0) == "d") {
        if ( (cursor + 9) <= 80) {
            cursor += 9;
        } else {
            cursor -= 72;
        }
    } else if (direction.toLowerCase().charAt(0) == "l") {
        if ( (cursor % 9) != 0) {
            cursor -= 1;
        } else {
            cursor += 8;
        }
    } else if (direction.toLowerCase().charAt(0) == "r") {
        if ( (cursor % 9) != 8) {
            cursor += 1;
        } else {
            cursor -= 8;
        }
    }
    setCursor(cursor, add);
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

function lockTiles() {
    $("#grid td.selected").each(function() {
        if ($(this).hasClass("digit")) {
            if ($(this).hasClass("locked")) {
                $(this).removeClass("locked");
            } else {
                $(this).addClass("locked");
            }
        }
    });
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

function clearBoard() {
    for (var i = 0; i < 9; i++) {
        for (var j = 0; j < 9; j++) {
            var tile = $("#grid tr:nth-child("+ (i + 1) +") td:nth-child("+ (j + 1) +")");
            tile.removeClass("digit note locked");
            tile.children("div").removeClass("red green blue yellow magenta mint lightblue white black");
            tile.children("div").text("");
        }
    }
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

/**
 * Returns true of the passed tile is valid by normal sudoku rules.
 */
function validateTile(index) {
    var row = index2D(index)[0]
    var col = index2D(index)[1]
    var tile = $("#grid tr:nth-child("+ (row + 1) +") td:nth-child("+ (col + 1) +")");
    var digit = tile.children("div").html();
    // Determine box index
    boxRow = 0;
    if (row > 2 && row < 6) { boxRow = 1; }
    else if (row >= 6) { boxRow = 2; }

    boxCol = 0;
    if (col > 2 && col < 6) { boxCol = 1; }
    else if (col >= 6) { boxCol = 2; }

    boxIndex = boxRow * 3 + boxCol;
    tileIndex = index1D(row, col);

    // check for same digits in box
    var digitCount = 0;
    for (var row2 = boxRow * 3; row2 < (boxRow+1) * 3; row2++) {
        for (var col2 = boxCol * 3; col2 < (boxCol+1) * 3; col2++) {
            var tile2 = $("#grid tr:nth-child("+ (row2 + 1) +") td:nth-child("+ (col2 + 1) +")");
            if (tile2.hasClass("digit") && tile2.children("div").html() == digit)
                digitCount++;
            if (digitCount > 1)
                return false;
        }
    }

    // check for same digits in row
    digitCount = 0;
    for (var col2 = 0; col2 < 9; col2++) {
        var tile2 = $("#grid tr:nth-child("+ (row + 1) +") td:nth-child("+ (col2 + 1) +")");
        if (tile2.hasClass("digit") && tile2.children("div").html() == digit)
            digitCount++;
        if (digitCount > 1)
            return false;
    }

    // check for same digits in column        
    digitCount = 0;
    for (var row2 = 0; row2 < 9; row2++) {
        var tile2 = $("#grid tr:nth-child("+ (row2 + 1) +") td:nth-child("+ (col + 1) +")");
        if (tile2.hasClass("digit") && tile2.children("div").html() == digit)
            digitCount++;
        if (digitCount > 1)
            return false;
    }

    return true;
}

function validateBoard() {
    // Go through the whole board and determine if any digit placed is 
    // impissoble by simplest sudoku rules. i.e. is it in a box/row/col as the same digit.
    var validTileCount = 0;
    for (var row = 0; row < 9; row++) {
        for (var col = 0; col < 9; col++) {
            var tile = $("#grid tr:nth-child("+ (row + 1) +") td:nth-child("+ (col + 1) +")");
            if (tile.hasClass("digit") && tile.children("div").html() != "") { 
            // if the tile is empty, it is not in error, but we don't want to count it towards validTileCount
            // so that an empty board is not considered completed
                if (!validateTile(index1D(row, col))) {
                    tile.addClass("error");
                } else {
                    tile.removeClass("error");
                    validTileCount++;
                }
            } else {
                // Don't increment validTileCount
                tile.removeClass("error");
            }
        }
    }
    return validTileCount;
}

function clearErrors() {
    for (var row = 0; row < 9; row++) {
        for (var col = 0; col < 9; col++) {
            $("#grid tr:nth-child("+ (row + 1) +") td:nth-child("+ (col + 1) +")").removeClass("error");
        }
    }
}

/**
 * Creates an event object to keep track of actions performed by the user.
 * @param {string} overwritten is what content was overWritten by the action
 * @param {string} overwrittenType If overwrittenType == "note", then overWritten will be a integer array
 * else if overwritten == "digit", overWritten will be an integer in [0, 9] where 0 is an empty cell.
 * else if overwritten == "none", then nothing was overwritten and overwritten should be null.
 * @param {string} action What action was performed: ("insertDigit", "insertDigits", "insertNote", "resetTile", "lockTiles")
 * @param {integer} effectedTile 1D index of effected tile.
 */
function event(action, effectedTile, overwrittenType, overwritten) {
    this.action = action;
    this.effectedTile = effectedTile;
    this.overwrittenType = overwrittenType;
    this.overwritten = overwritten;
}

init();