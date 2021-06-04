This is the game of Tetris played through the Desmos Graphing Calculator API


Setup:
The calculator is set to be rendered 690 pixels high with a page zoom of 90%.
This configuration can be changed through "New Desmos Tetris.html" > "<html>" > "<body>" > "<div id="calculator" ... >"

The calculator itself is set to dimention itself to a width / height ratio of 10 / 6.625 for a square grid.
This can be changed through "desmos tetris.js" > "class Game" > "calc_setup()" > "var width"

During play the "W=10" and "H=20" sliders can be changed to set the gamefield width and height upon reset


Controls:
Move piece Left: a
Move piece Right: d
Rotate piece Clockwise: w
Soft Drop piece: s
Hard Drop piece: space
Pause: p
Reset: r

These controls can be changed through "desmos tetris.js" > "function input(event)"

Play online right now: https://raw.githack.com/AlexJ314/Desmos_Tetris/New%20Desmos%20Tetris.html