const colors = ['green', 'blue', 'purple', 'red', 'orange', 'lemon', 'brown', 'aqua', 'yellow', 'gray'];
const items = ['balls', 'enlarge', 'shrink', 'fire', 'laser', 'fast', '100', '500', '250', 'slow', 'heart'];
const bricks = [];
const touchedItems = [];
const scores = [];
const container = document.getElementById('canvas-container');
let grays = 0;
let inactives = 0;
const keys = {};
const startButton = document.getElementById('play-button');
const restartButton = document.getElementById('restart-button');
const cancelButton = document.getElementById('cancel-button');
const modalHeader = document.getElementsByClassName('modal-header');
const presentation = document.getElementById('presentation');
const modalBody = document.getElementsByClassName('modal-body');
const AudioContext = window.AudioContext || window.webkitAudioContext;
const audioCtx = new AudioContext();
let requestId;
let stopGame = false;

// BufferLoader to load all sound effects.
class BufferLoader {
  constructor(context, urlList, callback) {
    this.context = context;
    this.urlList = urlList;
    this.bufferList = [];
    this.onload = callback;
    this.loadCount = 0;
  }

  loadBuffer(url, index) {
    // Load buffer asynchronously
    const request = new XMLHttpRequest();
    request.open('GET', url, true);
    request.responseType = 'arraybuffer';
    const loader = this;

    request.onload = () => {
      // Asynchronously decode the audio file data in request.response
      loader.context.decodeAudioData(request.response, (buffer) => {
        if (!buffer) {
          alert('error decoding file data: ' + url);
          return;
        }
        loader.bufferList[index] = buffer;
      },
      (error) => {
        console.error('decodeAudioData error', error);
      });
    };
    request.onerror = () => {
      alert('BufferLoader: XHR error');
    };
    request.send();
  }

  load() {
    for (let i = 0; i < this.urlList.length; i += 1) {
      this.loadBuffer(this.urlList[i], i);
    }
  }
}

const bufferLoader = new BufferLoader(
  audioCtx,
  [
    './audio/bounce.wav',
    './audio/metal-hit-2.wav',
    './audio/8-bit-powerup.wav',
    './audio/crack.wav',
    './audio/laser7.wav',
  ],
);

window.onload = () => {
  bufferLoader.load();
};

function playSound(buffer) {
  const source = audioCtx.createBufferSource();
  source.buffer = buffer;
  source.connect(audioCtx.destination);
  source.start(0);
}

const game = {
  canvas: document.createElement('canvas'),
  start() {
    this.canvas.width = window.innerWidth - 200;
    this.canvas.height = window.innerHeight - 100;
    this.brickColumns = Math.floor((this.canvas.width - 52) / 83);
    this.brickRows = 5;
    this.context = this.canvas.getContext('2d');
    container.insertBefore(this.canvas, container.childNodes[0]);
    this.score = 0;
    this.lives = 3;
  },

  clear() {
    this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);
  },

  stop() {
    window.cancelAnimationFrame(requestId);
    stopGame = true;
    scores.push(this.score);
  },

  restart() {
    this.score = 0;
    this.lives = 3;
    grays = 0;
    inactives = 0;
    stopGame = false;
    ball.reset();
    paddle.width = 120;
  },

  checkifWin() {
    if (bricks.length * bricks[0].length === grays + inactives) {
      game.stop();
      modalHeader[0].children[0].innerText = 'YOU WIN! CONGRATULATIONS!';

      modalBody[0].innerHTML = `
      <p>You are really good at this. Feel free to play again!</p>
      <p>Your score: <strong>${game.score}</strong></p>
      <p> Highest score: <strong>${Math.max(...scores)}</strong></p>`

      $('#modal-result').modal();
    }
  },
};

class Paddle {
  constructor() {
    this.height = 20;
    this.width = 120;
    this.x = game.canvas.width - this.width / 2;
    this.hasLaser = false;
  }

  draw() {
    const ctx = game.context;
    ctx.fillStyle = '#0095DD';
    ctx.fillRect(this.x, game.canvas.height - this.height, this.width, this.height);
  }

  // Moves when the left and right keys are pressed
  move() {
    if (keys[39] && (this.x < game.canvas.width - this.width)) {
      this.x += 15;
    } else if (keys[37] && this.x > 0) {
      this.x -= 15;
    }
  }
}

const paddle = new Paddle();


class Ball {
  constructor() {
    this.x = game.canvas.width / 2;
    this.y = game.canvas.height + 100;
    this.dx = 4;
    this.dy = 4;
    this.radius = 8;
    this.color = 'white';
  }

  draw() {
    const ctx = game.context;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
    ctx.fillStyle = this.color;
    ctx.fill();
    ctx.closePath();
    this.x += this.dx;
    this.y += this.dy;
    this.bounce();
  }

  reset() {
    this.x = game.canvas.width / 2;
    this.y = game.canvas.height - 50;
    this.dx = 3.5;
    this.dy = -3.5;
  }

  bounce() {
    const top = (this.y + this.dy < this.radius);
    const bottom = (this.y + this.dy > game.canvas.height - this.radius);
    const left = (this.x + this.dx < this.radius);
    const right = (this.x + this.dx > game.canvas.width - this.radius);
    if (top) {
      this.dy = -this.dy;
      playSound(bufferLoader.bufferList[0]);
    }
    if (left || right) {
      this.dx = -this.dx;
      playSound(bufferLoader.bufferList[0]);
    }
    if ((this.x > paddle.x && this.x < paddle.x + paddle.width) && (this.y + this.dy > game.canvas.height - this.radius - paddle.height)) {
      this.dy = -this.dy;
      playSound(bufferLoader.bufferList[0]);
    }
    if (bottom) {
      game.lives -= 1;
      if (game.lives < 1) {
        game.stop();
        modalHeader[0].children[0].innerText = 'GAME OVER!';

        modalBody[0].innerHTML = `
        <p>You lost all your lives, dont worry, try it again!</p>
        <p>Your score: <strong>${game.score}</strong></p>
        <p> Highest score: <strong>${Math.max(...scores)}</strong></p>`;

        $('#modal-result').modal();
      } else {
        this.reset();
      }
    }
  }
}

const ball = new Ball();

class Brick {
  constructor(color) {
    this.x = 0;
    this.y = 0;
    this.width = 75;
    this.height = 25;
    this.offsetTop = 35;
    this.offsetLeft = 30;
    this.padding = 8;
    this.color = color;
    this.item = 'none';
    this.status = 1;
    this.droppedItem = false;
  }

  draw() {
    const ctx = game.context;
    const brickImg = new Image();
    brickImg.src = `./images/${this.color}-tile.png`;
    ctx.drawImage(brickImg, this.x, this.y, this.width, this.height);
  }
}

class Item {
  constructor(name) {
    this.name = name;
    this.x = 0;
    this.y = 0;
    this.dy = 3;
    this.width = 47;
    this.heigth = 18;
  }

  draw() {
    const ctx = game.context;
    const itemImg = new Image();
    itemImg.src = `./images/item-${this.name}.png`;
    ctx.drawImage(itemImg, this.x, this.y, this.width, this.heigth);
  }

  fall() {
    this.y += this.dy;
  }

  hitBottom() {
    return (this.y + this.dy > game.canvas.height - this.heigth);
  }

  hitPaddle() {
    if (this.hitBottom() && (this.x > paddle.x && this.x < paddle.x + paddle.width)) {
      playSound(bufferLoader.bufferList[2]);
      this.action();
      touchedItems.shift();
    } else if (this.hitBottom()) {
      touchedItems.shift();
    }
  }

  action() {
    switch (this.name) {
      case 'slow':
        ball.dx *= 0.8;
        ball.dy *= 0.8;
        break;
      case 'fast':
        ball.dx *= 1.05;
        ball.dy *= 1.05;
        break;
      case 'heart':
        game.lives += 1;
        break;
      case 'shrink':
        paddle.width -= 20;
        break;
      case 'enlarge':
        paddle.width += 50;
        break;
      case '100':
        game.score += 100;
        break;
      case '250':
        game.score += 250;
        break;
      case '500':
        game.score += 500;
        break;
      case 'fire':
        ball.color = 'red';
        setTimeout(() => {
          ball.color = 'white';
        }, 6000);
        break;
      case 'laser':
        paddle.hasLaser = true;
        break;
      default:
    }
  }
}

function createBricks() {
  // creates a 2D array of choosen size and populates it with bricks of random colors.
  for (let i = 0; i < game.brickColumns; i += 1) {
    bricks[i] = [];
    for (let j = 0; j < game.brickRows; j += 1) {
      const randomColor = colors[Math.floor(Math.random() * colors.length)];
      if (randomColor === 'gray') {
        grays += 1;
      }
      bricks[i][j] = new Brick(randomColor);
    }
  }
  // populates 7 random bricks with random items
  for (let n = 0; n <= 7; n += 1) {
    const randomItem = items[Math.floor(Math.random() * items.length)];
    const randomRow = Math.floor(Math.random() * game.brickRows);
    const randomColumn = Math.floor(Math.random() * game.brickColumns);
    bricks[randomColumn][randomRow].item = new Item(randomItem);
  }
}

// Draws all bricks from the bricks array on the canvas.
function drawBricks() {
  for (let i = 0; i < game.brickColumns; i += 1) {
    for (let j = 0; j < game.brickRows; j += 1) {
      const brickX = (i * (bricks[i][j].width + bricks[i][j].padding)) + bricks[i][j].offsetLeft;
      const brickY = (j * (bricks[i][j].height + bricks[i][j].padding)) + bricks[i][j].offsetTop;
      bricks[i][j].x = brickX;
      bricks[i][j].y = brickY;
      // condition to only draw untouched bricks.
      if (bricks[i][j].status === 1) {
        bricks[i][j].draw();
      }
    }
  }
}

// Checks if any brick in the bricks array colides with the ball.
function checkCollision() {
  for (let i = 0; i < game.brickColumns; i += 1) {
    for (let j = 0; j < game.brickRows; j += 1) {
      const brick = bricks[i][j];
      if (brick.status === 1) {
        // condition when ball colides with brick
        if (ball.x > brick.x && ball.x < (brick.x + brick.width) && ball.y > brick.y && ball.y < (brick.y + brick.height)) {
          if (ball.color !== 'red') {
            ball.dy = -ball.dy;
          }
          // gray bricks stays in the canvas, only reflects the ball and don't increase the score.
          if (brick.color !== 'gray') {
            brick.status = 0;
            inactives += 1;
            game.score += 10;
          } else {
            playSound(bufferLoader.bufferList[1]);
          }
          ball.dx *= 1.02;
          ball.dy *= 1.02;
        }
        // Items get drawn and dropped in the canvas when brick status is 0 and brick.item !== none.
      } else if (brick.item !== 'none' && brick.droppedItem === false) {
        brick.item.x = brick.x;
        brick.item.y = brick.y;
        touchedItems.push(brick.item);
        brick.droppedItem = true;
      }
    }
  }
}

// function to draw and drop all touched items.
function drawAllItems() {
  if (touchedItems.length > 0) {
    touchedItems.forEach((item) => {
      if (item.name === 'heart') {
        item.width = 25;
        item.height = 25;
      }
      item.draw();
      item.fall();
      item.hitPaddle();
    });
  }
}

function drawScore() {
  const ctx = game.context;
  ctx.font = '16px Arial';
  ctx.fillStyle = 'white';
  ctx.fillText(`Score: ${game.score}`, 8, 20);
}

function drawLives() {
  const ctx = game.context;
  const heart = new Image();
  heart.src = './images/item-heart.png';
  for (let i = 1; i <= game.lives; i += 1) {
    ctx.drawImage(heart, game.canvas.width - ((i * 30) + 10), 5, 25, 25);
  }
}

// Main function to draw and update the game using requestAnimationFrame
function updateGame() {
  game.clear();
  drawBricks();
  paddle.draw();
  paddle.move();
  ball.draw();
  checkCollision();
  game.checkifWin();
  drawAllItems();
  drawScore();
  drawLives();
  if (stopGame === false) {
    requestId = window.requestAnimationFrame(updateGame);
  }
}


startButton.onclick = () => {
  presentation.classList.add('hidden');
  container.classList.remove('hidden');
  game.start();
  createBricks();
  updateGame();
};

restartButton.onclick = () => {
  $('#modal-result').modal('toggle');
  game.restart();
  createBricks();
  updateGame();
};

cancelButton.onclick = () => {
  document.location.reload();
};

// User can move the paddle with mouse pointer.
document.onmousemove = (e) => {
  const relativeX = e.clientX - game.canvas.offsetLeft;
  if (relativeX > 0 && relativeX < game.canvas.width) {
    paddle.x = relativeX - paddle.width / 2;
  }
};

// User can move the paddle with keyboard right and left arrows.

// keydown and keyup listeners that add pressed key to keys object.
document.onkeydown = (e) => {
  keys[e.which] = true;
};

document.onkeyup = (e) => {
  delete keys[e.which];
};
