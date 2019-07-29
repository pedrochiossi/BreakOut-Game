const colors = ['green', 'blue', 'purple', 'red', 'orange', 'lemon', 'brown', 'aqua', 'yellow','gray'];
const items = ['balls', 'enlarge', 'shrink', 'fire', 'laser', 'fast', '100', '500', '250', 'slow', 'heart'];
const bricks = [];
const touchedItems = [];
const container = document.getElementById('canvas-container');
let grays = 0;
let inactives = 0;

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

  checkifWin() {
    if (bricks.length * bricks[0].length === grays + inactives) {
      alert('YOU WIN! CONGRATULATIONS!');
      document.location.reload();
    }
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
    }
    if (left || right) {
      this.dx = -this.dx;
    }
    if ((this.x > paddle.x && this.x < paddle.x + paddle.width) && (this.y + this.dy > game.canvas.height - this.radius - paddle.height)) {
      this.dy = -this.dy;
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
    brickImg.src = `/images/${this.color}-tile.png`;
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
    itemImg.src = `/images/item-${this.name}.png`;
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
      default:
    }
  }
}


const ball = new Ball();
const paddle = new Paddle();

function createBricks(columns, rows) {
  // creates a 2D array of choosen size and populates it with bricks of random colors.
  for (let i = 0; i < columns; i += 1) {
    bricks[i] = [];
    for (let j = 0; j < rows; j += 1) {
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
      if (brick.status === 1) {
        // condition when ball colides with brick
        if (ball.x > brick.x && ball.x < (brick.x + brick.width) && ball.y > brick.y && ball.y < (brick.y + brick.height)) {
          ball.dy = -ball.dy;
          ball.dx *= 1.02;
          ball.dy *= 1.02;
          // gray bricks stays in the canvas, only reflects the ball and don't increase the score.
          if (brick.color !== 'gray') {
            brick.status = 0;
            inactives += 1;
            game.score += 10;
          }
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
  heart.src = '/images/item-heart.png';
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
  game.checkifWin();
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
