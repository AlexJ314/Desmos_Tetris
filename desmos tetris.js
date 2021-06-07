/*TODO:
    Display next 2 blocks
    Increase score
    Increase speed correctly
    Adjust rotation fall delay
    Safety on left and right
    Measure device orientation / tilt for control on mobile
*/

var game_board; //Global variable, the game

class Game {
    //Contains the game itself and its methods / variables
    constructor(width=10, height=20) {
        this.width = width; //Game width
        this.height = height; //Game height
        this.calculator = Desmos.GraphingCalculator(document.getElementById('calculator'), {border:false, lockViewport: true}); //The Desmos display
    }

    setup() {
        //Final setup
        this.middle = Math.floor(this.width / 2) - 1; //Where the middle of the board it (Left rounding)
        this.grid_setup(); //Make the game board
        this.calc_setup(); //Make the calculator display
        this.blocks = []; //All created blocks
        this.active = false; //Currently active block
        this.score = 0; //Player score
        this.loop = [0, 0]; //Variables associated with time delay and game tick
        this.tick = 1000; //Game tick speed (milliseconds)
        this.stopped = false; //Is the game over?
        this.paused = false; //Is the game paused?
        this.new_block(); //Make your first block
        this.do_loop(); //Start the game
    }

    grid_setup() {
        //Set up the field on which the game is played
        this.grid = [];
        for(var c=0; c<this.width; c++) {
            this.grid[c] = [];
            for(var r=0; r<this.height+2; r++) {
                this.grid[c][r] = 0;
            }
        }
    }

    calc_setup() {
        //This is the Desmos interface
        var width = Math.max(10/(6.625)*this.height, 1.3*this.width); //Make the calculator grid lines square
        var height = this.height; //Only see the top and bottom the the board
        var spacing = 0.1*width;
        this.calculator.setMathBounds({left: -spacing, right: width-spacing, bottom: 0, top: height});
        this.calculator.setExpression({id: "Width", latex: "W="+this.width, sliderBounds: {min: 4, max: 1000, step: 1}});
        this.calculator.setExpression({id: "Height", latex: "H="+this.height, sliderBounds: {min: 4, max: 1000, step: 1}});
        this.calculator.setExpression({id: "Left", latex: "x\\le0\\left\\{y\\ge0\\right\\}\\left\\{y\\le"+height+"\\right\\}", color: '#000000'});
        this.calculator.setExpression({id: "Right", latex: "x\\ge"+this.width+"\\left\\{y\\ge0\\right\\}\\left\\{y\\le"+height+"\\right\\}", color: '#000000'});
        this.calculator.setExpression({id: "Bottom", latex: "y\\le0", color: '#000000'});
        this.calculator.setExpression({id: "Top", latex: "y\\ge"+height, color: '#000000'});
    }

    new_block() {
        //The game pieces and how to choose which to play
        var shape;
        switch(Math.floor(Math.random()*7)) {
            case 0:
                shape = new IBlock();
                break;
            case 1:
                shape = new OBlock();
                break;
            case 2:
                shape = new TBlock();
                break;
            case 3:
                shape = new SBlock();
                break;
            case 4:
                shape = new ZBlock();
                break;
            case 5:
                shape = new JBlock();
                break;
            case 6:
                shape = new LBlock();
                break;
            default:
                shape = new IBlock();
                break;
        }
        if (this.active) { //Save old piece to grid
            for(let i=0; i<this.active.loc.length; i++) {
                game_board.grid[this.active.loc[i][0]][this.active.loc[i][1]] = this.active.id[i];
            }
        }
        this.active = shape; //The newly activate piece (Not saved to grid until placed)
        this.blocks.push(this.active); //All created blocks
        this.check_line(); //Can we clear a line?
    }

    fall() {
        //Called each game tick
        this.active.down(); //Move the block down
        if (this.active.placed) { //If the active block has been placed, make a new one
            this.new_block();
        }
    }

    do_loop(new_tick=this.tick) {
        //How to do the game tick
        this.tick = new_tick;
        clearTimeout(this.loop[0]); //Make sure this is the only loop running
        clearInterval(this.loop[1]); //What above said
        game_board.loop[0] = setTimeout(function() { //Now go ahead and set up the tick
            game_board.loop[1] = setInterval(function() {game_board.fall();}, game_board.tick);
        }, 0.5*game_board.tick);
    }

    check_line() {
        //Can a line be cleared?
        var clear;
        for(let row=0; row<this.height; row++) {
            clear = true;
            for(let col=0; col<this.width; col++) {
                if (game_board.grid[col][row] == 0) {
                    clear = false;
                }
            }
            if (clear) {
                this.clear_line(row); //Clear the line (visible)
                this.update_fall(row); //Lower the blocks (invisible)
                this.update_locs(row); //Tell the blocks they were lowered (invisible)
                this.redraw(); //Redraw the blocks at their new locations (visible)
                this.do_loop(Math.max(50, this.tick*0.99)); //Increase game speed
                row--; //We just deleted a row, it might need to be cleared again
            }
        }
    }

    clear_line(row) {
        //Tell Desmos to get rid of the cleared line
        for(let i=0; i<this.width; i++) {
            this.calculator.removeExpression({id: game_board.grid[i][row]});
            game_board.grid[i][row] = 0; //Clear grid memory, just in case
        }
    }

    update_fall(fall_to, distance=1) {
        //Lower the blocks
        for(let row=fall_to; row<this.height; row++) {
            for(let col=0; col<this.width; col++) {
                game_board.grid[col][row] = game_board.grid[col][row+distance]; //Row = the one above it
                game_board.grid[col][row+distance] = 0; //Clear the above row, just in case
            }
        }
    }

    update_locs(row) {
        //Tell the blocks they moved
        for(let i=0; i<this.blocks.length; i++) {
            for(let j=0; j<this.blocks[i].loc.length; j++) {
                if (this.blocks[i].loc[j][1] > row) { //If the block is above the cleared line, fall
                    this.blocks[i].loc[j][1] -= 1;
                } else if (this.blocks[i].loc[j][1] == row) { //If the block is in the cleared line, move it out of play
                    this.blocks[i].loc[j][1] = -1;
                }
            }
        }
    }

    redraw() {
        //Just redraw everything
        for(let i=0; i<this.blocks.length; i++) {
            this.blocks[i].draw();
        }
    }

    pause() {
        //How to pause
        if (this.paused) { //If paused, set up tick
            this.do_loop();
        } else { //If not paused, pause it
            clearTimeout(this.loop[0]);
            clearInterval(this.loop[1]);
        }
        this.paused = !this.paused; //Remember the game state
    }

    gameover() {
        //How to end the game
        clearTimeout(this.loop[0]);
        clearInterval(this.loop[1]);
        window.alert("Game Over");
        this.stopped = true;
    }

    reset() {
        //Reset the game
        //Clear tick
        clearTimeout(this.loop[0]);
        clearInterval(this.loop[1]);

        //Clear all blocks
        for(let i=0; i<this.blocks.length; i++) {
            for(let j=0; j<this.blocks[i].id.length; j++) {
                this.calculator.removeExpression({id: this.blocks[i].id[j]});
            }
        }

        //Set dimentions
        var expr = this.calculator.expressionAnalysis;
        this.width = expr.Width.evaluation.value; //Width from slider
        this.height = expr.Height.evaluation.value; //Height from slider

        //Finish setup
        this.setup();
    }
}

class Block {
    //The default single block model
    constructor(loc, color) {
        this.set_id(); //Give the squares making up the block an id (array)
        this.rot = 0; //How much the block has rotated
        this.loc = loc; //Where the block is
        this.color = color; //Block color
        this.create(); //How to make a block
        this.placed = false; //If the block has been placed
    }

    set_id() {
        //Give the block a unique id
        this.id = [];
        var d = new Date();
        var num = d.getTime();
        for(let i=0; i<4; i++) {
            this.id[i] = num + i/10;
        }
    }

    create() {
        //Go about making a block
        if (this.occupied()) { //If the space is occupied, end the game
            game_board.gameover();
            return;
        }
        this.set_id(); //Give the block an id
        this.draw(); //Display the block
    }

    draw() {
        //How to display the block
        var tmp_id;
        for(let i=0; i<this.loc.length; i++) {
            if (this.loc[i][1] >= 0) {
                tmp_id = this.id[i]; //If not placed, use the block's id
                if (this.placed) { //If placed, the grid remembers the block's id
                    tmp_id = game_board.grid[this.loc[i][0]][this.loc[i][1]]
                }
                game_board.calculator.setExpression({id: tmp_id, latex: "\\operatorname{polygon}(("+this.loc[i][0]+","+this.loc[i][1]+"), ("+(this.loc[i][0]+1)+","+this.loc[i][1]+"), ("+(this.loc[i][0]+1)+","+(this.loc[i][1]+1)+"), ("+this.loc[i][0]+","+(this.loc[i][1]+1)+"))", color: this.color});
            }
        }
    }

    move(x, y, render=true) {
        //How to move the block around
        if (this.placed) { //If placed, move the block id on the grid
            var tmp_loc = this.loc;
            for(let i=0; i<this.loc.length; i++) {
                game_board.grid[this.loc[i][0]][this.loc[i][1]] = 0;
            }
            for(let i=0; i<this.loc.length; i++) {
                this.loc[i][0] = tmp_loc[i][0] + x;
                this.loc[i][1] = tmp_loc[i][1] + y;
                game_board.grid[this.loc[i][0]][this.loc[i][1]] = this.id[i];
            }
        } else { //Otherwise, move its location
            for(let i=0; i<this.loc.length; i++) {
                this.loc[i][0] += x;
                this.loc[i][1] += y;
            }
        }
        if (render) { //If we actually want it drawn, draw it
            this.draw();
        }
    }

    left() {
        //Move left
        var open = true;
        for(let i=0; i<this.loc.length; i++) {
            if (0 != game_board.grid[this.loc[i][0] - 1][this.loc[i][1]]) { //Check new location is empty
                open = false;
            }
        }
        if (open && !this.placed) { //If open and not placed, move it
            this.move(-1, 0);
        }
    }

    right() {
        //Move right
        var open = true;
        for(let i=0; i<this.loc.length; i++) {
            if (0 != game_board.grid[this.loc[i][0] + 1][this.loc[i][1]]) { //Check new location is empty
                open = false;
            }
        }
        if (open && !this.placed) { //If empty and not placed, move it
            this.move(1, 0);
        }
    }

    down(render=true) {
        //Move down
        var open = !this.placed;
        for(let i=0; i<this.loc.length; i++) {
            if (0 != game_board.grid[this.loc[i][0]][this.loc[i][1] - 1]) { //Check open
                open = false;
            }
        }
        if (open) {
            this.move(0, -1, render);
        } else {
            this.placed = true; //If can't move down, it's been placed
        }
    }

    rotate() {
        //How to rotate the block
        if (this.try_rotate(0, 0)) { //Try default rotation
            this.do_rotate(0, 0);
        } else {
            for(let x=-1; x<=1; x++) { //Try Wall / Floor kicks (offset by 1)
                for(let y=0; y<=1; y++) {
                    if (this.try_rotate(x, y)) {
                        this.do_rotate(x, y);
                        return; //Success? Stop trying!
                    }
                }
            }
            for(let x=-2; x<=2; x+=4) { //Try Wall / Floor kicks (offset by 2)
                for(let y=0; y<=2; y+=2) {
                    if (this.try_rotate(x, y)) {
                        this.do_rotate(x, y);
                        return; //Success? Stop trying!
                    }
                }
            }
        }
    }

    try_rotate(x_offset=0, y_offset=0) {
        //Test rotations
        var open = true;
        var try_rot = this.rot + 1; //Rotation to test
        var row;
        var col;
        try_rot %= this.rotations.length;
        for(var i=0; i<this.loc.length; i++) {
            col = this.loc[i][0] + this.rotations[try_rot][i][0] + x_offset;
            row = this.loc[i][1] + this.rotations[try_rot][i][1] + y_offset;
            if (row >= 0 && col >= 0 && col < game_board.width && row < game_board.height+2) { //Make sure it won't rotate out of bounds
                if (game_board.grid[col][row] != 0) {
                    open = false;
                }
            } else {
                open = false;
            }
        }
        if (open) { //It worked! Save the rotation
            this.rot = try_rot;
        }
        return(open); //Return results
    }

    do_rotate(x_offset=0, y_offset=0) {
        //Now actually rotate the piece
        for(let i=0; i<this.loc.length; i++){
            this.loc[i][0] += this.rotations[this.rot][i][0] + x_offset;
            this.loc[i][1] += this.rotations[this.rot][i][1] + y_offset;
        }
        this.draw(); //Display changes
        game_board.do_loop(); //Reset fall time delay
    }

    occupied() {
        //Can the piece spawn?
        var open = true;
        for(let i=0; i<this.loc.length; i++) {
            if (0 != game_board.grid[this.loc[i][0]][this.loc[i][1]]) {
                open = false;
            }
        }
        return(!open);
    }

    drop() {
        //How to hard drop a piece
        while(!this.placed) {
            this.down(false);
        }
        this.placed = false; //It hasn't been placed yet
        this.draw(); //Display changes
        this.placed = true; //Now it has
    }
}

class IBlock extends Block {
    //XXXX
    constructor() {
        let color = "#00ffff";
        //Location works by spawning in the top two rows and center aligning the pieces, rounding left
        let loc = [[game_board.middle-1, game_board.height], [game_board.middle, game_board.height], [game_board.middle+1, game_board.height], [game_board.middle+2, game_board.height]];
        super(loc, color);
        //Rotations work by adding / subtracting to the currect location
        this.rotations = [[[-1, 2], [0, 1], [1, 0], [2, -1]],
                          [[2, 1], [1, 0], [0, -1], [-1, -2]],
                          [[1, -2], [0, -1], [-1, 0], [-2, 1]],
                          [[-2, -1], [-1, 0], [0, 1], [1, 2]]];
    }
}

class OBlock extends Block {
    // XX
    // XX
    constructor() {
        let color = "#ffff00";
        //Location works by spawning in the top two rows and center aligning the pieces, rounding left
        let loc = [[game_board.middle, game_board.height+1], [game_board.middle+1, game_board.height+1], [game_board.middle, game_board.height], [game_board.middle+1, game_board.height]];
        super(loc, color);
        //Rotations work by adding / subtracting to the currect location
        this.rotations = [[[0, 0], [0, 0], [0, 0], [0, 0]],
                          [[0, 0], [0, 0], [0, 0], [0, 0]],
                          [[0, 0], [0, 0], [0, 0], [0, 0]],
                          [[0, 0], [0, 0], [0, 0], [0, 0]]];
    }
}

class TBlock extends Block {
    // X
    //XXX
    constructor() {
        let color = "#ff00ff";
        //Location works by spawning in the top two rows and center aligning the pieces, rounding left
        let loc = [[game_board.middle, game_board.height+1], [game_board.middle-1, game_board.height], [game_board.middle, game_board.height], [game_board.middle+1, game_board.height]];
        super(loc, color);
        //Rotations work by adding / subtracting to the currect location
        this.rotations = [[[1, 1], [-1, 1], [0, 0], [1, -1]],
                          [[1, -1], [1, 1], [0, 0], [-1, -1]],
                          [[-1, -1], [1, -1], [0, 0], [-1, 1]],
                          [[-1, 1], [-1, -1], [0, 0], [1, 1]]];
    }
}

class SBlock extends Block {
    // XX
    //XX
    constructor() {
        let color = "#00ff00";
        //Location works by spawning in the top two rows and center aligning the pieces, rounding left
        let loc = [[game_board.middle, game_board.height+1], [game_board.middle+1, game_board.height+1], [game_board.middle-1, game_board.height], [game_board.middle, game_board.height]];
        super(loc, color);
        //Rotations work by adding / subtracting to the currect location
        this.rotations = [[[1, 1], [2, 0], [-1, 1], [0, 0]],
                          [[1, -1], [0, -2], [1, 1], [0, 0]],
                          [[-1, -1], [-2, 0], [1, -1], [0, 0]],
                          [[-1, 1], [0, 2], [-1, -1], [0, 0]]];
    }
}

class ZBlock extends Block {
    //XX
    // XX
    constructor() {
        let color = "#ff0000";
        //Location works by spawning in the top two rows and center aligning the pieces, rounding left
        let loc = [[game_board.middle-1, game_board.height+1], [game_board.middle, game_board.height+1], [game_board.middle, game_board.height], [game_board.middle+1, game_board.height]];
        super(loc, color);
        //Rotations work by adding / subtracting to the currect location
        this.rotations = [[[0, 2], [1, 1], [0, 0], [1, -1]],
                          [[2, 0], [1, -1], [0, 0], [-1, -1]],
                          [[0, -2], [-1, -1], [0, 0], [-1, 1]],
                          [[-2, 0], [-1, 1], [0, 0], [1, 1]]];
    }
}

class JBlock extends Block {
    //X
    //XXX
    constructor() {
        let color = "#0000ff";
        //Location works by spawning in the top two rows and center aligning the pieces, rounding left
        let loc = [[game_board.middle-1, game_board.height+1], [game_board.middle-1, game_board.height], [game_board.middle, game_board.height], [game_board.middle+1, game_board.height]];
        super(loc, color);
        //Rotations work by adding / subtracting to the currect location
        this.rotations = [[[0, 2], [-1, 1], [0, 0], [1, -1]],
                          [[2, 0], [1, 1], [0, 0], [-1, -1]],
                          [[0, -2], [1, -1], [0, 0], [-1, 1]],
                          [[-2, 0], [-1, -1], [0, 0], [1, 1]]];
    }
}

class LBlock extends Block {
    //  X
    //XXX
    constructor() {
        let color = "#ff8000";
        //Location works by spawning in the top two rows and center aligning the pieces, rounding left
        let loc = [[game_board.middle+1, game_board.height+1], [game_board.middle-1, game_board.height], [game_board.middle, game_board.height], [game_board.middle+1, game_board.height]];
        super(loc, color);
        //Rotations work by adding / subtracting to the currect location
        this.rotations = [[[2, 0], [-1, 1], [0, 0], [1, -1]],
                          [[0, -2], [1, 1], [0, 0], [-1, -1]],
                          [[-2, 0], [1, -1], [0, 0], [-1, 1]],
                          [[0, 2], [-1, -1], [0, 0], [1, 1]]];
    }
}

function input(event) {
    //Handles key presses
    if (event.key=="r") { //Reset game
        game_board.reset();
    }
    if (game_board.stopped) { //Ignore everything if the game is over
        return;
    }
    if (!game_board.paused) { //Ignore most stuff if game_board.paused
        switch(event.key) {
            case("a"): //Move block left
                game_board.active.left();
                break;
            case("d"): //Move block right
                game_board.active.right();
                break;
            case("s"): //Soft Drop block
                game_board.fall();
                break;
            case("w"): //Rotate block clockwise
                game_board.active.rotate();
                break;
            case(" "): //Hard Drop block
                game_board.active.drop();
                break;
            default:
                break;
        }
    }
    if (event.key=="p") { //Pause / Unpause game
        game_board.pause();
    }
}

function main() {
    //Do stuff
    game_board = new Game(); //The game (Global)
    game_board.setup(); //Set up Game
}

main(); //Sets this whole thing in motion
