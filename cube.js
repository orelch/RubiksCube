// var corners = ["A", "B", "C", "D", "U", "V", "W", "X"];
// var edges = ["A", "B", "C", "D", "H", "F", "P", "N", "U", "V", "W", "X"];

// function cornerSticker(corner, orientation, color){
//     this.corner = corner;
//     this.orient = orientation;
//     this.color = color;
// };

// function edgeSticker(edge, side, color) {
//     this.edge = edge;
//     this.side = side;
//     this.color = color;
// };

function corner(pieceName, stickers) {
    this.pieceName = pieceName;
    this.stickers = stickers;
};

function edge(pieceName, stickers) {
    this.pieceName = pieceName;
    this.stickers = stickers;
};

var BUL = new corner("BUL", ["yellow", "red", "blue"]);
var BUR = new corner("BUR", ["yellow", "blue", "orange"]);
var FUR = new corner("FUR", ["yellow", "orange", "green"]);
var FUL = new corner("FUL", ["yellow", "green", "red"]);

var FDL = new corner("FDL", ["white", "red", "green"]);
var FDR = new corner("FDR", ["white", "green", "orange"]);
var BDR = new corner("BDR", ["white", "orange", "blue"]);
var BDL = new corner("BDL", ["white", "blue", "red"]);

var BU = new edge("BU", ["yellow", "blue"]);
var UR = new edge("UR", ["yellow", "orange"]);
var FU = new edge("FU", ["yellow", "green"]);
var UL = new edge("UL", ["yellow", "red"]);

var BL = new edge("BL", ["red", "blue"]);
var FL = new edge("FL", ["red", "green"]);
var FR = new edge("FR", ["orange", "green"]);
var BR = new edge("BR", ["orange", "blue"]);

var FD = new edge("FD", ["white", "green"]);
var DR = new edge("DR", ["white", "orange"]);
var BD = new edge("BD", ["white", "blue"]);
var DL = new edge("DL", ["white", "red"]);

const PiecesArray = [BUL, BUR, FUR, FUL, FDL, FDR, BDR, BDL, BU, UR, FU, UL, BL, FL, FR, BR, FD, DR, BD, DL];

const faceList = ["F", "U", "R", "L", "D", "B"];

const displayDictionary = {
};

const RCycleCorners = ["FUR", "BUR", "BDR", "FDR"];
const RCycleEdges = ["UR", "BR", "DR", "FR"];
const RCycle = {
    cycleName: "R", 
    corners: RCycleCorners,
    edges: RCycleEdges
};

const LCycleCorners = ["BUL", "FUL", "FDL", "BDL"];
const LCycleEdges = ["UL", "FL", "DL", "BL"];
const LCycle = {
    cycleName: "L", 
    corners: LCycleCorners,
    edges: LCycleEdges
};

const UCycleCorners = ["BUL", "BUR", "FUR", "FUL"];
const UCycleEdges = ["BU", "UR", "FU", "UL"];
const UCycle = {
    cycleName: "U", 
    corners: UCycleCorners,
    edges: UCycleEdges
};

const DCycleCorners = ["FDL", "FDR", "BDR", "BDL"];
const DCycleEdges = ["FD", "DR", "BD", "DL"];
const DCycle = {
    cycleName: "D", 
    corners: DCycleCorners,
    edges: DCycleEdges
};

const FCycleCorners = ["FUL", "FUR", "FDR", "FDL"];
const FCycleEdges = ["FU", "FR", "FD", "FL"];
const FCycle = {
    cycleName: "F", 
    corners: FCycleCorners,
    edges: FCycleEdges
};

const BCycleCorners = ["BUR", "BUL", "BDL", "BDR"];
const BCycleEdges = ["BU", "BL", "BD", "BR"];
const BCycle = {
    cycleName: "B", 
    corners: BCycleCorners,
    edges: BCycleEdges
};

const Cycles = [RCycle, LCycle, UCycle, DCycle, FCycle, BCycle];

function cycle(part, cycle, face) {
    face === "R" || face === "L" || face === "F" || face === "B"
    if ((part instanceof edge && (face === "R" || face === "L")) || (part instanceof corner && (face === "R" || face === "L" || face === "F" || face === "B"))) {
        if (cycle === 0) {
            part.stickers.unshift(part.stickers.pop());
        } else if (cycle === 1) {
            part.stickers.push(part.stickers.shift());
        }
    }

    return part.stickers;
}

function cyclePiece(piece, faceCycle, face, direction) {
    var newName = "";
    var newStickers = [];
    faceCycle.forEach(function (faceLoc, index) {
        if (piece.pieceName === faceLoc) {
            if (direction == 0) {
                if (index === faceCycle.length - 1) {
                    newName = faceCycle[0];
                } else {
                    newName = faceCycle[index + 1];
                }
            } else if (direction == 1) {
                if (index === 0) {
                    newName = faceCycle[faceCycle.length - 1];
                } else {
                    newName = faceCycle[index - 1];
                }
            }
            newStickers = cycle(piece, index % 2, face);
        }
    });

    piece.pieceName = newName;
    piece.stickers = newStickers;
    return piece;
}

function findCycle(face) {
    var cycleReturn;
    Cycles.forEach(function (cycle) {
        if (cycle.cycleName === face) {
            cycleReturn = cycle;
        }
    });

    return cycleReturn;
}

function renderCube() {
    PiecesArray.forEach(function (piece) {
        for (var stickerIndex = 0; stickerIndex <= piece.stickers.length - 1; stickerIndex++) {
            var currentSticker = $("#" + piece.pieceName + stickerIndex);
            currentSticker.removeClass();
            currentSticker.addClass("box " + piece.stickers[stickerIndex]);
        }
    });
}

$("button").on("click", function (event) {
    var fullAction = $(event.target).attr("id");
    var action = fullAction.split('')[0];
    var direction = fullAction.split('')[1];

    // find all pieces affected by action
    var relevantPieces = [];
    PiecesArray.forEach(function (piece) {
        piece.pieceName.split('').forEach(function (face) {
            if (face === action) {
                relevantPieces.push(piece);
            }
        });
    });
    // find corresponding cycle
    var foundCycle = findCycle(action);

    // loop through all pieces found using the cycle
    relevantPieces.forEach(function (piece) {
        if (piece instanceof corner) {
            pieceCycle = foundCycle.corners;
        } else if (piece instanceof edge) {
            pieceCycle = foundCycle.edges;
        }

        cyclePiece(piece, pieceCycle, foundCycle.cycleName, direction);
    });

    renderCube();
});






