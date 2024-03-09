const STARTSOURCE = $("gameTable").innerHTML;
var col, board

init();

function $(id) {
  return document.getElementById(id);
}

function init(){
  col = 3; //Current column, the first column is column 3 (imagine columns 0, 1, and 2 are hidden to the left)
  $("box3,1").checked = false; //Uncheck boxes to fix bug
  $("box3,2").checked = false;
  $("box3,3").checked = false;
  board = [[],[],[$("box3,1").checked, $("box3,2").checked, $("box3,3").checked]]; //Start off with possibly cached checkboxes
  $("loseScreen").style["opacity"] = "0%";
  $("loseScreen").style["width"] = "0%";
  $("loseScreen").style["height"] = "0%";
  $("loseScreen").style["opacity"] = "0%";
  $("gameTable").innerHTML = STARTSOURCE;
  $("nextButton").disabled = false;
  $("nextButton").style["margin-left"] = "0px";
}

function changeBoardValue(x,y){
  //Checks if the box is checked or not, and changes board[x-1][y-1]
  board[x-1][y-1] = $("box" + x + "," + y).checked;
}

function nextColumn() {
  //Checking for initial segments
  for(var a=2; a<=col-1; a++){
    for(var b=a+1; b<=col-1; b++){
      console.log(`checking ${a} and ${b}`);
      var t = true; //Verify all values match
      for(var i=0; i<=a; i++){
        t = t && (board[a][i] == board[b][i]);
      }
      if(t){ //If initial segment
        lose(a+1, b+1); //Indices off by one
        return;
      }
    }
  }
  //Adding new column
  col++;
  board.push(Array(col).fill(false)); //Start out all unchecked
  var newRow = document.createElement("tr");
  newRow.id = "row" + col;
  $("gameTable").prepend(newRow);
  $("row" + col).innerHTML += "<td />".repeat(col - 3); //Spacing triangle
  for (var i = 1; i <= col; i++) { //Appending new column
    var newTD = document.createElement("td");
    var newBox = document.createElement("input");
    newBox.type = "checkbox";
    newBox.id = "box" + col + "," + i;
    newBox.setAttribute("onclick", "changeBoardValue(" + col + "," + i + ")");
    newTD.append(newBox);
    $("row" + i).append(newTD);
  }
  for(var i=3; i<col; i++){ //Disabling checkboxes
    for(var j=1; j<=i; j++){
      $("box" + i + "," + j).disabled = true;
    }
  }
  $("nextButton").style["margin-left"] = Math.floor($("row1").clientWidth - $("box3,1").clientWidth) + "px"; //Line up button with current column
}

function flashRange(x, height, color) { //Flash the first "height" cells in x to color
  for (var i = 1; i <= height; i++) {
    $("box" + x + "," + i).parentNode.style["background-color"] = color;
  }
}

function lose(a, b) { //Shows the lose effect, where column a is an initial segment of column b
  //Locking button
  $("nextButton").disabled = true;
  var flashRed = function() { flashRange(a, a, "#FF7777"); flashRange(b, a, "#FF7777");}
  var flashWhite = function() { flashRange(a, a, "#FFFFFF"); flashRange(b, a, "#FFFFFF");}
  var delay = 180; //Length of a blink
  //Blink twice
  flashRed();
  //Scheduling
  setTimeout(function(){flashWhite(); setTimeout(function(){flashRed(); setTimeout(function(){flashWhite(); setTimeout(loseScreen, 600);}, delay);}, delay);}, delay);
}

function loseScreen(){
  $("finalHeight").innerHTML = col;
  $("loseScreen").style["width"] = "100%"; //Can't click through element, need to shrink and widen
  $("loseScreen").style["height"] = "100%";
  //Fade in, https://stackoverflow.com/a/6121270
  var op = 0.0;  // initial opacity
  $("loseScreen").style.display = 'block';
  var timer = setInterval(function () {
      if (op >= 1){
          clearInterval(timer);
      }
      $("loseScreen").style.opacity = op;
      $("loseScreen").style.filter = 'alpha(opacity=' + op * 100 + ")";
      op += 0.02;
  }, 10);
}
