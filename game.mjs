//#region Game variables -------------------------------------------------------------
const scene = document.getElementById("scene");
const brush = getBrush();
// ------

//#region CONSTANTS ------------------------------------------------------------------
const FPS = 1000 / 60;
const STATES = { MENU: 1, PLAY: 2, GAMEOVER: 3, HIGHSCORE: 4}

const PADDING = 10;
const LEFT = PADDING;
const TOP = PADDING;
const BOTTOM = scene.height - PADDING;
//#endregion

let currentState = STATES.MENU;
let currentHighScore = 0; 

const MENU = {
  currentIndex: 0,
  buttons: [
    { text: "Play", action: startPlay },
    { text: "High Scores", action: showHigScores }
  ]
}

// ------

const ship = {
  x: (scene.width * 0.5) - 50,
  y: scene.height - 30,
  width: 50,
  height: 20,
  velocityX: 0,
  velocityY: 0,
  maxVelocity: 3,
  color: "#8faff2",
  bulletColor: "#ff0000ff",
  bulletOutline: "#00e1ffff"
}

const playerScore = {
  x : LEFT,
  y : BOTTOM,
  color : "#8faff2",
  font : "40px Comic Sans MS",
  score : 0,
}

const gameoverScreen = {
  x : 80,
  y : 200,
  font : "50px Comic-Sans",
  color : "#fff",
}

// ------

const projectieWidth = 5;
const projectileHeight = 7;
const projectileSpeed = 2;
const projectileCooldown = 60;
let cooldown = 0;
let projectiles = [];

// ------

//Standard form for invaders
const invaders = {
  width: 60,
  height: 20,
  padding: 10,
  sx: 50,
  sy: 20,
  speed: 1,
  direction: 1,
  entities: [],
  invaderColors: [
    '#ff0000ff',
    '#ff9d00ff',
    '#d9ff00ff',
    '#26ff00ff',
    '#00ffffff',
  ]
}

const invadersPerRow = 9;

// ------

// Movment back and forth of invaders´s are govered by counting up to a level
const maxMovmentSteps = 50;
let movmentSteps = maxMovmentSteps;

// ------
// The following is a simple way of 
let controllKeys = {
  ArrowDown: false,
  ArrowUp: false,
  ArrowLeft: false,
  ArrowRight: false,
  " ": false, // space
}

window.addEventListener("keydown", function (e) {
  controllKeys[e.key] = true;
});

window.addEventListener("keyup", function (e) {
  controllKeys[e.key] = false;
})


//#endregion


//#region Game engine ----------------------------------------------------------------

function init() {
  let invaderRowNumber = 0;
  for(let invaderColor of invaders.invaderColors){
    let x = invaders.sx;
    let y = invaders.sy + (40*invaderRowNumber);
    for (let i = 0; i < invadersPerRow; i++) {
      invaders.entities.push({ x, y, active: true, width: invaders.width, height: invaders.height, color: invaderColor});
      x += invaders.width + invaders.padding;
    }
    invaderRowNumber += 1;
  }

  invaders.speed = 1;

  currentState = STATES.MENU;
  update();
}

function update(time) {

  //Decide gamestate
  switch(currentState){
    case STATES.MENU:
      updateMenu();
      break;
    case STATES.PLAY:
      updateGame();
      break;
    case STATES.GAMEOVER:
      //updateGameOver();
      break;
    case STATES.HIGHSCORE:
      updateHighScore();
      break;
  }

  draw(); 
  requestAnimationFrame(update)
}

function draw() {
  clearScreen();

  switch(currentState){
    case STATES.MENU:
      drawMenu();
      break;
    case STATES.PLAY:
      drawGame();
      break;
    case STATES.GAMEOVER:
      drawGameOver();
      break;
    case STATES.HIGHSCORE:
      drawHighScore();
      break;
  }

}

init(); // Starts the game

//#endregion


//#region Game functions

function drawGameOver(){
  //Display GameOver screen

  brush.fillStyle = gameoverScreen.color;
  brush.font = gameoverScreen.font;
  brush.fillText("Game Over! You did well!", gameoverScreen.x, gameoverScreen.y);
  brush.fillText("Finale Score: " + playerScore.score, gameoverScreen.x, gameoverScreen.y + 60);

  //check for new high score
  if (playerScore.score > currentHighScore){
    currentHighScore = playerScore.score
    brush.fillText("NEW HIGHSCORE", gameoverScreen.x, gameoverScreen.y + 150);

  }
  brush.fillText("HighScore: " + currentHighScore, gameoverScreen.x, gameoverScreen.y + 90);
}

function updateMenu(dt) {

  if (controllKeys[" "]) {
    MENU.buttons[MENU.currentIndex].action();
  }


  if (controllKeys.ArrowUp) {
    MENU.currentIndex--;
  } else if (controllKeys.ArrowDown) {
    MENU.currentIndex++;
  }

  MENU.currentIndex = clamp(MENU.currentIndex, 0, MENU.buttons.length - 1);


}

function updateGame(dt) {
  updateShip();
  updateProjectiles();
  updateinvaders();
  if (isGameOver()) {
    currentState = STATES.GAMEOVER;
    setTimeout(() => {currentState = STATES.MENU},3000);
  }
}

function drawMenu() {
  let sy = 100;
  for (let i = 0; i < MENU.buttons.length; i++) {


    let text = MENU.buttons[i].text;
    if (i == MENU.currentIndex) {
      text = `> ${text} <`;
    }

    brush.fillStyle = "#8faff2";
    brush.font = "50px serif";
    brush.fillText(text, 100, sy);
    sy += 50;

  }
}

function updateinvaders() {

  let ty = 0;

  if (invaders.direction == 1 && movmentSteps >= maxMovmentSteps * 2) {
    movmentSteps = 0;
    invaders.direction *= -1
  } else if (invaders.direction == -1 && movmentSteps >= maxMovmentSteps * 2) {
    movmentSteps = 0;
    invaders.direction *= -1;
    ty += invaders.height;
  }

  let tx = invaders.speed * invaders.direction;



  for (let i = 0; i < invaders.entities.length; i++) {
    let invader = invaders.entities[i];

    if (invader.active) {

      invader.x += tx;
      invader.y += ty;

      if (isShot(invader)) {
        invader.active = false;
        playerScore.score += 10;
      }

    }

  }

  movmentSteps++;

}

function isGameOver() {
  for (let currentInvader of invaders.entities) {
    if (currentInvader.active && currentInvader.y + invaders.height  >= ship.y) {
      //Game over, player loose
      return true;
    }
  }


  return false;
}

function isShot(target) {

  for (let i = 0; i < projectiles.length; i++) {
    let projectile = projectiles[i];
    if (overlaps(target.x, target.y, target.width, target.height, projectile.x, projectile.y, projectile.width, projectile.height)) {
      projectile.active = false;
      return true;
    }
  }

  return false;
}

function updateShip() {
  if (controllKeys.ArrowLeft) {
    ship.velocityX--;
  } else if (controllKeys.ArrowRight) {
    ship.velocityX++;
  }

  ship.velocityX = clamp(ship.velocityX, ship.maxVelocity * -1, ship.maxVelocity);

  let tmpX = ship.x + ship.velocityX;
  tmpX = clamp(tmpX, 0, scene.width - ship.width);

  ship.x = tmpX;

  cooldown--;

  if (controllKeys[" "] && cooldown <= 0) {
    projectiles.push({ x: ship.x + ship.width * 0.5, y: ship.y, dir: -1, active: true, width: projectieWidth, height: projectileHeight });
    cooldown = projectileCooldown;
  }
}

function updateProjectiles() {
  let activeProjectiles = []
  for (let i = 0; i < projectiles.length; i++) {
    let projectile = projectiles[i]
    projectile.y += projectileSpeed * projectile.dir;
    if (projectile.y + projectileHeight > 0 && projectile.active) {
      activeProjectiles.push(projectile);
    }
  }
  projectiles = activeProjectiles;
}

function drawGame() {


  //Draw current score 
  brush.fillStyle = playerScore.color;
  brush.font = playerScore.font;
  brush.fillText("Score: " + playerScore.score, playerScore.x, playerScore.y);


  //Draw Ship
  brush.fillStyle = ship.color;
  brush.fillRect(ship.x, ship.y, ship.width, ship.height);

  for (let projectile of projectiles) {
    if (projectile.active) {
      brush.fillStyle = ship.bulletColor;
      brush.strokeStyle = ship.bulletOutline;
      brush.lineWidth = 1;
      brush.fillRect(projectile.x, projectile.y, projectieWidth, projectileHeight);
      brush.strokeRect(projectile.x, projectile.y, projectieWidth,projectileHeight);
    }
  }

  for (let invader of invaders.entities){
      if (invader.active) {
        //Draw invaders
        brush.fillStyle = invader.color;
        brush.fillRect(invader.x, invader.y, invader.width, invader.height);
      }
  }
}

function startPlay() {
  currentState = STATES.PLAY;
}

function showHigScores() {
  currentState = STATES.HIGHSCORE;
}

//#endregion

//#region Utility functions ----------------------------------------------------------

function getBrush() {
  return scene.getContext("2d");
}

function clearScreen() {
  if (brush) {
    brush.clearRect(0, 0, scene.width, scene.height);
  }
}

function clamp(val, min, max) {
  return Math.min(Math.max(val, min), max)
}

function overlaps(x1, y1, w1, h1, x2, y2, w2, h2) {

  if (x1 + w1 < x2 || x2 + w2 < x1) {
    return false;
  }

  if (y1 + h1 < y2 || y2 + h2 < y1) {
    return false;
  }

  return true;
}
//#endregion
