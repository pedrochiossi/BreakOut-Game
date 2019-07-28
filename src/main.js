
const colors = ['green', 'blue', 'purple', 'red', 'orange', 'lemon', 'brown', 'aqua', 'yellow','gray'];
const items = ['balls', 'enlarge', 'shrink', 'fire', 'laser', 'fast', '100', '500', '250', 'slow', 'heart'];
const bricks = [];
const touchedItems = [];
const container = document.getElementById('canvas-container');

const game = {
  canvas: document.createElement('canvas'),
  start() {
    this.canvas.width = window.innerWidth - 200;
    this.canvas.height = window.innerHeight - 100;
    this.context = this.canvas.getContext('2d');
    container.insertBefore(this.canvas, container.childNodes[0]);
    this.score = 0;
    this.lives = 3;
  },

  clear() {
    this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);
  },
};

class Paddle {
  constructor() {
    this.height = 20;
    this.width = 120;
    this.x = game.canvas.width - this.width / 2;
  }

  draw() {
    const ctx = game.context;
    ctx.fillStyle = '#0095DD';
    ctx.fillRect(this.x, game.canvas.height - this.height, this.width, this.height);
  }
}


class Ball {
  constructor() {
    this.x = game.canvas.width / 2;
    this.y = game.canvas.height + 100;
    this.dx = 4;
    this.dy = 4;
    this.radius = 8;
  }

  draw() {
    const ctx = game.context;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
    ctx.fillStyle = 'white';
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
      bounceSound.play();
    }
    if (left || right) {
      this.dx = -this.dx;
      bounceSound.play();
    } 
    if ((this.x > paddle.x && this.x < paddle.x + paddle.width) && (this.y + this.dy > game.canvas.height - this.radius - paddle.height)) {
      this.dy = -this.dy;
      bounceSound.play();
    }
    if (bottom) {
      game.lives -= 1;
      if (game.lives < 1) {
        alert('GAME OVER');
        document.location.reload();
      } else {
        this.reset();
      }
    }
  }
}

class Sound {
  constructor(src) {
    this.sound = document.createElement('audio');
    this.sound.src = src;
    this.sound.setAttribute('preload', 'auto');
    this.sound.setAttribute('controls', 'none');
    this.sound.style.display = 'none';
    document.body.appendChild(this.sound);
  }
  
  play() {
    this.sound.play();
  }

  stop() {
    this.sound.pause();
  }

  playback(speed) {
    this.sound.playbackRate = speed;
  }
}

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
    brickImg.src = `../images/${this.color}-tile.png`;
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
    itemImg.src = `../images/item-${this.name}.png`;
    ctx.drawImage(itemImg, this.x, this.y, this.width, this.heigth);
  }

  fall() {
    this.y += this.dy;
  }
}

const bounceSound = new Sound('../audio/bounce.wav');
bounceSound.playback(2.5);
const ball = new Ball();
const paddle = new Paddle();

function createBricks(columns, rows) {
  // creates a 2D array of choosen size and populates it with bricks of random colors.
  for (let i = 0; i < columns; i += 1) {
    bricks[i] = [];
    for (let j = 0; j < rows; j += 1) {
      const randomColor = colors[Math.floor(Math.random() * colors.length)];
      bricks[i][j] = new Brick(randomColor);
    }
  }
  // populates 7 random bricks with random items
  for (let n = 0; n <= 7; n += 1) {
    const randomItem = items[Math.floor(Math.random() * items.length)];
    const randomRow = Math.floor(Math.random() * rows);
    const randomColumn = Math.floor(Math.random() * columns);
    bricks[randomColumn][randomRow].item = new Item(randomItem);
  }
}

// Draws all bricks from the bricks array on the canvas.
function drawBricks(columns, rows) {
  for (let i = 0; i < columns; i += 1) {
    for (let j = 0; j < rows; j += 1) {
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
function checkCollision(columns, rows) {
  for (let i = 0; i < columns; i += 1) {
    for (let j = 0; j < rows; j += 1) {
      const brick = bricks[i][j];
      let cnt;
      if (brick.status === 1) {
        // condition when ball colides with brick
        if (ball.x > brick.x && ball.x < (brick.x + brick.width) && ball.y > brick.y && ball.y < (brick.y + brick.height)) {
          ball.dy = -ball.dy;
          // gray bricks stays in the canvas, only reflects the ball and don't increase the score.
          if (brick.color === 'gray') {
            // reflects the ball with higher speed.
            ball.dx *= 1.05;
            ball.dy *= 1.05;
            cnt += 1;
          } else {
            // other bricks also reflects the ball with a slight speed increase.
            ball.dx *= 1.02;
            ball.dy *= 1.02;
            // sets status to 0 so it doesn't get drawn on drawBricks().
            brick.status = 0;
            game.score += 10;
          }
        }
        if (game.score >= 10 * ((columns * rows)-cnt)) {
          alert('YOU WIN, CONGRATULATIONS!');
          document.location.reload();
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
  heart.src = '../images/item-heart.png';
  for (let i = 1; i <= game.lives; i += 1) {
    ctx.drawImage(heart, game.canvas.width - ((i * 30) + 10), 5, 25, 25);
  }
}

// Main function to draw and update the game using requestAnimationFrame
function updateGame() {
  game.clear();
  drawBricks(14, 5);
  paddle.draw();
  ball.draw();
  checkCollision(14, 5);
  drawAllItems();
  drawScore();
  drawLives();
  requestAnimationFrame(updateGame);
}

game.start();
createBricks(14,5);
updateGame();

// User can move the paddle with mouse pointer.
document.onmousemove = (e) => {
  const relativeX = e.clientX - game.canvas.offsetLeft;
  if (relativeX > 0 && relativeX < game.canvas.width) {
    paddle.x = relativeX - paddle.width / 2;
  }
};

// User can move the paddle with keyboard right and left arrows.
document.onkeydown = (e) => {
  if ((e.key === 'Right' || e.key === 'ArrowRight') && paddle.x < game.canvas.width - paddle.width) {
    paddle.x += 30;
  } else if ((e.key === 'Left' || e.key === 'ArrowLeft') && paddle.x > 0) {
    paddle.x -= 30;
  }
};