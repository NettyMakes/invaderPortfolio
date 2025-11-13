//#region Game variables -------------------------------------------------------------
const scene = document.getElementById("scene");
const brush = getBrush();
// ------

//#region CONSTANTS ------------------------------------------------------------------
const FPS = 1000 / 60;
const STATES = { MENU: 1, PLAY: 2, GAMEOVER: 3 }

const PADDING = 10;
const LEFT = PADDING;
const TOP = PADDING;
const BOTTOM = scene.height - PADDING;
//#endregion

let currentState = STATES.MENU;

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

const scoreboard = {
  x : LEFT,
  y : BOTTOM,
  color : "#8faff2",
  font : "40px Comic Sans MS",
  text : 0,
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

const invadersPerRow = 8;

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

  if (currentState === STATES.MENU) {
    updateMenu(time);
  } else if (currentState === STATES.PLAY) {
    updateGame(time);
  }

  draw(); 
  requestAnimationFrame(update)
}

function draw() {
  clearScreen();

  if (currentState === STATES.MENU) {
    drawMenu();
  } else if (currentState === STATES.PLAY) {
    drawGameState();
  }

}

init(); // Starts the game

//#endregion


//#region Game functions

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

function updateGame(dt) {
  updateShip();
  updateProjectiles();
  updateinvaders();
  if (isGameOver()) {
    currentState = STATES.GAMEOVER;
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



  for (let i = 0; i < invadersPerRow; i++) {
    let invader = invaders.entities[i];

    if (invaders.active) {

      invaders.x += tx;
      invaders.y += ty;

      if (isShot(invader)) {
        invader.active = false;
        scoreboard.text += 10;
      }

    }

  }

  movmentSteps++;

}

function isGameOver() {
  for (let currentInvader of invaders.entities) {
    if (currentInvader.x + invaders.width == ship.x && currentInvader.y + invaders.height  >= ship.y) {
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

function drawGameState() {


  //Draw scoreboard

  brush.fillStyle = scoreboard.color;
  brush.font = scoreboard.font;
  brush.fillText("Score: " + scoreboard.text, scoreboard.x, scoreboard.y);


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
