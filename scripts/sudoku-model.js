/**
 * @param {integer[]} tiles An array of tiles to select. The tile is represented 
 * by its absolute position (0 indexed). Requires: 0 <= tiles[i] <= 80.
 * @param {Board} board The board to use.
 */
function selectTiles(tiles, board) {
	// if not adding to selection, clear the previous selction
    if (!board.add) { clearSelection();}

    // add selected class to all tiles in passed list
    for (var i = 0; i < tiles.length; i++) {
        var row = index2D(tiles[i])[0]
        var col = index2D(tiles[i])[1]

        getTile2D(row, col).addClass("selected");
    }
}

/**
 * @param {number} tile An integer representing where the cursor should be.
 * @param {Board} board The board to use.
 * The cursor is essentially a special case of selection (class="selected"). 
 * Unlike selection, there can only be on cursor, hence its
 * implementation with html id. The cursor tile is also always selected.
 */
function setCursor(tile, board) {
    board.cursorIndex = tile;

    // Remove cursor
    $("#grid td.cursor").removeClass("cursor")

    // Clear selection
    if (!board.add) { clearSelection(); }

    // Select tile and set cursor to tile
    getTile1D(tile).addClass("selected cursor");
}

/**
 * Moves the cursor orthogonally and wraps around the board.
 */
function moveCursor(direction, board) {
	var nextCursor = board.cursorIndex;
    if (direction.toLowerCase().charAt(0) == "u") {
        if ( (nextCursor - 9) >= 0)
            nextCursor -= 9;
        else
            nextCursor += 72;
    } else if (direction.toLowerCase().charAt(0) == "d") {
        if ( (nextCursor + 9) <= 80)
            nextCursor += 9;
        else
            nextCursor -= 72;
    } else if (direction.toLowerCase().charAt(0) == "l") {
        if ( (nextCursor % 9) != 0)
            nextCursor -= 1;
        else
            nextCursor += 8;
    } else if (direction.toLowerCase().charAt(0) == "r") {
        if ( (nextCursor % 9) != 8)
            nextCursor += 1;
        else
            nextCursor -= 8;
    }
    setCursor(nextCursor, board);
}

/**
 * General insert function, determines which function is called by board's mode attribute
 */
function insert(digit, board) {
    if (board.mode == board.modes["digit"])
        insertDigits(digit);
    else if (board.mode == board.modes["note"])
        insertNote(digit);
    else if (board.mode == board.modes["color"])
        insertColor(digit);
}

/**
 * Inserts a digit into 1 tile.
 */
function insertDigit(digit, tile, lock) {
    tileElem = getTile1D(tile);

    // Select tile and set cursor to tile
    tileElem.addClass("digit");
    tileElem.removeClass("note");
    if (lock)
        tileElem.addClass("locked");

    tileElem.children("div").text(digit.toString());
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

/**
 * Places a note into the selection on the board.
 * @param {number} digit Interger in [1, 9] to be placed.
 * This replaces digits already in the selection. If the note is
 * already in the tile, remove it. Otherwise add it to the notes.
 */
function insertNote(digit) {
    $("#grid td.selected").each(function() {
        if (!$(this).hasClass("digit")) {
            var currentNotes = $(this).children("div").text();

            // create array to track what digits are "noted"
            var notes = new Array(9);
            for (var i = 0; i < 9; i++)
                notes[i] = false;
            for (var i = 0; i < currentNotes.length; i++) {
                var num = parseInt(currentNotes.charAt(i));
                notes[num-1] = true;
            }
            notes[digit-1] = !notes[digit-1]; // toggles the given digit
            // create note string, so that it is in currect order
            var newNotes = "";
            for (var i = 0; i < 9; i++) {
                if (notes[i]) {
                    newNotes = newNotes + (i+1).toString();
                }
            }
            // set relevant html
            $(this).children("div").text(newNotes);
            $(this).addClass("note");
        }
    });
}

/**
 * Sets the class of selected tiles to be the appropriate color.
 */
function insertColor(number) {
    colorMap = {1:"red", 2:"green", 3:"blue", 4:"yellow",
                5:"magenta", 6:"mint", 7:"lightblue", 8:"white",
                9:"black"};
    $("#grid td.selected div").removeClass("red green blue yellow magenta mint lightblue white black");
    if (number > 0 && number < 10)
        $("#grid td.selected div").addClass(colorMap[number]);
}
/**
 * Clears the whole grid in regards to selection.
 */
function clearSelection() {
    for (var i = 0; i < 81; i++) {
        getTile1D(i).removeClass("selected");
    }
}


/**
 * Clears digits and notes from selection.
 */
function resetTiles() {
    $("#grid td.selected").each(function() {
        if (!$(this).hasClass("locked")) {
            $(this).removeClass("digit");
            $(this).removeClass("note");
            $(this).children("div").text("");
        }
    });
}

/**
 * Locks selected tiles so that they cannot be modified (if they are inputed digits)
 */
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

/**
 * Clears whole board of everything.
 */
function clearBoard() {
	for (var i = 0; i < 81; i++) {
        var tile = getTile1D(i);
        tile.removeClass("digit note locked");
        tile.children("div").removeClass("red green blue yellow magenta mint lightblue white black");
        tile.children("div").text("");
    }
    clearErrors();
}

/**
 * Returns true of the passed tile is valid by normal sudoku rules.
 */
function validateTile(index) {
    var row = index2D(index)[0]
    var col = index2D(index)[1]
    var tile = getTile1D(index);
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
            var tile2 = getTile2D(row2, col2);
            if (tile2.hasClass("digit") && tile2.children("div").html() == digit)
                digitCount++;
            if (digitCount > 1)
                return false;
        }
    }

    // check for same digits in row
    digitCount = 0;
    for (var col2 = 0; col2 < 9; col2++) {
        var tile2 = getTile2D(row, col2);
        if (tile2.hasClass("digit") && tile2.children("div").html() == digit)
            digitCount++;
        if (digitCount > 1)
            return false;
    }

    // check for same digits in column        
    digitCount = 0;
    for (var row2 = 0; row2 < 9; row2++) {
        var tile2 = getTile2D(row2, col);
        if (tile2.hasClass("digit") && tile2.children("div").html() == digit)
            digitCount++;
        if (digitCount > 1)
            return false;
    }
    return true;
}

/**
 * Validates the entire board
 */
function validateBoard() {
    // Go through the whole board and determine if any digit placed is 
    // impissoble by simplest sudoku rules. i.e. is it in a box/row/col as the same digit.
    var validTileCount = 0;
    for (var i = 0; i < 81; i++) {
        var tile = getTile1D(i);
        if (tile.hasClass("digit") && tile.children("div").html() != "") { 
        // if the tile is empty, it is not in error, but we don't want to count it towards validTileCount
        // so that an empty board is not considered completed
            if (!validateTile(i)) {
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
    return validTileCount;
}

/**
 * Clears errors from whole board.
 */
function clearErrors() {
    for (var i = 0; i < 81; i++)
        getTile1D(i).removeClass("error");
}

/**
 * Changes global variable accordingly, if nextMode >= mode count, it will cycle back to acceptable range
 * Updates css to reflect changes. 
 * Updates global variable lastMode. 
 * @param {number} nextMode An integer for what mode to change to.
 */
function setMode(nextMode, board) {
    if (nextMode != board.mode) {
        board.lastMode = board.mode;
    }
    board.mode = nextMode % board.modeCount;
    $(".fill-pane").removeClass("selected");
    $(".pencil-pane").removeClass("selected");
    $(".color-pane").removeClass("selected");

    if (board.mode == board.modes["digit"]) {
        $(".fill-pane").addClass("selected");
    } else if (board.mode == board.modes["note"]) {
        $(".pencil-pane").addClass("selected");
    } else if (board.mode == board.modes["color"]) {
        $(".color-pane").addClass("selected");
    }
}

/** undo is NOT IMPLEMENTED
 * Creates an event object to keep track of actions performed by the user.
 * @param {string} overwritten is what content was overWritten by the action
 * @param {string} overwrittenType If overwrittenType == "note", then overWritten will be a integer array
 * else if overwritten == "digit", overWritten will be an integer in [0, 9] where 0 is an empty cell.
 * else if overwritten == "none", then nothing was overwritten and overwritten should be null.
 * @param {string} action What action was performed: ("insertDigit", "insertDigits", "insertNote", "resetTiles", "lockTiles")
 * @param {integer} effectedTile 1D index of effected tile.
 */
function event(action, effectedTile, overwrittenType, overwritten) {
    this.action = action;
    this.effectedTile = effectedTile;
    this.overwrittenType = overwrittenType;
    this.overwritten = overwritten;
}

/* * * * * * * * * * * * * * * * * * Helper Methods Below * * * * * * * * * * * * * * * * * * /


/**
 * Returns the td element with given index.
 * @param {number} index 1 dimentional index to tile in ranage [0-80]
 */
function getTile1D(index) {
	return getTile2D( index2D(index)[0], index2D(index)[1] );
}

/**
 * Returns the td element with given index.
 * @param {number} row Row index to tile in ranage [0-8]
 * @param {number} col Column index to tile in ranage [0-8]
 */
function getTile2D(row, col) {
	return $("#grid tr:nth-child("+ (row+1) +") td:nth-child("+ (col+1) +")");
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