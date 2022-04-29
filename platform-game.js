const level = `
......................
..#................#..
..#................#..
..#.........o.o....#..
..#................#..
..#####............#..
......#......@.....#..
......##############..
......................
`;

class Player {
	constructor({ staticMap, x, y, speedX, direction, speedY, size }) {
		this.staticMap = staticMap;
		this.x = x;
		this.y = y;
		this.speedX = speedX;
		this.direction = direction;
		this.speedY = speedY;
		this.size = size;
	}

	patch(changes) {
		return new Player({
			staticMap: this.staticMap,
			x: this.x,
			y: this.y,
			speedX: this.speedX,
			direction: this.direction,
			speedY: this.speedY,
			size: this.size,
			...changes,
		});
	}

	die() {
		this.dead = true;
	}

	tick(time) {
		if (this.dead) {
			return this;
		}
		let movedPlayer = this.move(time);
		const movedHorizontally = this.patch({ ...movedPlayer, y: this.y });
		const movedVertically = this.patch({ ...movedPlayer, x: this.x });

		if (this.preventsMove(movedVertically, 'bottom')) {
			movedPlayer = this.patch({
				...movedPlayer,
				y: Math.floor(movedPlayer.y + this.size.height) - this.size.height,
				speedY: 0,
			});
		}
		if (this.preventsMove(movedVertically, 'top')) {
			movedPlayer = this.patch({
				...movedPlayer,
				y: Math.ceil(movedPlayer.y),
				speedY: 0,
			});
		}

		if (this.preventsMove(movedHorizontally, 'right')) {
			movedPlayer = this.patch({
				...movedPlayer,
				x: Math.floor(movedPlayer.x + movedPlayer.size.width) - movedPlayer.size.width,
			});
		}
		if (this.preventsMove(movedHorizontally, 'left')) {
			movedPlayer = this.patch({
				...movedPlayer,
				x: Math.ceil(movedPlayer.x),
			});
		}

		if (this.inLava(movedPlayer)) {
			movedPlayer.die();
		}

		return movedPlayer;
	}

	move(time) {
		const newSpeedY = this.speedY + time * Game.gravity;
		const newY = this.y + time * newSpeedY;

		const xChange = time * this.speedX * (this.direction === 'ltr' ? 1 : -1);
		const newX = this.x + xChange;

		return this.patch({ x: newX, y: newY, speedY: newSpeedY });
	}

	preventsMove(newPlayer, direction) {
		if (direction === 'bottom') {
			const yBottom = Math.floor(newPlayer.y + newPlayer.size.height);
			const bottomXSquares = range(Math.floor(newPlayer.x), Math.ceil(newPlayer.x + newPlayer.size.width));
			return bottomXSquares.some((square) => {
				try {
					return (
						this.staticMap[yBottom][square] === '#' &&
						this.overlaps(newPlayer, {
							x: square,
							y: yBottom,
							width: 1,
							height: 1,
						})
					);
				} catch (e) {
					return false;
				}
			});
		}

		if (direction === 'top') {
			const yTop = Math.floor(newPlayer.y);
			const topXSquares = range(Math.floor(newPlayer.x), Math.ceil(newPlayer.x + newPlayer.size.width));
			return topXSquares.some(
				(square) =>
					this.staticMap[yTop][square] === '#' &&
					this.overlaps(newPlayer, {
						x: square,
						y: yTop,
						width: 1,
						height: 1,
					})
			);
		}

		if (direction === 'right') {
			const rightYSquares = range(Math.floor(newPlayer.y), Math.ceil(newPlayer.y + newPlayer.size.height));
			const xRight = Math.floor(newPlayer.x + newPlayer.size.width);
			return rightYSquares.some(
				(square) =>
					this.staticMap[square][xRight] === '#' &&
					this.overlaps(newPlayer, {
						y: square,
						x: xRight,
						width: 1,
						height: 1,
					})
			);
		}

		if (direction === 'left') {
			const leftYSquares = range(Math.floor(newPlayer.y), Math.ceil(newPlayer.y + newPlayer.size.height));
			const xLeft = Math.floor(newPlayer.x);
			return leftYSquares.some(
				(square) =>
					this.staticMap[square][xLeft] === '#' &&
					this.overlaps(newPlayer, {
						y: square,
						x: xLeft,
						width: 1,
						height: 1,
					})
			);
		}

		return false;
	}

	overlaps(player, { x, y, width, height }) {
		function lineOverlaps(first, second) {
			return second.start < first.end || first.end > second.start;
		}
		return (
			lineOverlaps({ start: player.x, end: player.x + player.size.width }, { start: x, end: x + width }) &&
			lineOverlaps({ start: player.y, end: player.y + player.size.height }, { start: y, end: y + height })
		);
	}

	inLava(player) {
		return range(Math.floor(player.y), Math.ceil(player.y + player.size.height)).some((y) => {
			return range(Math.floor(player.x), Math.ceil(player.x + player.size.width)).some(
				(x) => this.staticMap[y][x] === '+' && this.overlaps(player, { x, y, width: 1, height: 1 })
			);
		});
	}

	jump() {
		if (this.preventsMove(this.move(Game.pass(5)), 'bottom')) {
			this.speedY = -Game.jumpStrength;
		}
	}

	go(direction) {
		this.direction = direction;
		this.speedX = Game.horizontalSpeed;
	}
	stop() {
		this.speedX = 0;
	}
}

class Coin {
	static create(x, y) {
		return new Coin(x, y);
	}
	constructor(baseX, baseY, x, y, wobble) {
		this.baseX = baseX;
		this.baseY = baseY;
		this.radius = 0.25;
		this.wobble = wobble || Math.random() * Math.PI * 2;
		this.x = x || baseX;
		this.y = y || baseY;
	}
	tick(time) {
		const wobble = this.wobble + time * Game.wobbleSpeed;
		return new Coin(
			this.baseX,
			this.baseY,
			this.baseX + Math.cos(wobble) * Game.wobbleDist,
			this.baseY + Math.sin(wobble) * Game.wobbleDist,
			wobble
		);
	}
}

class Game {
	static standardSize = 30;
	static gravity = 39;
	static jumpStrength = 15;
	static horizontalSpeed = 7;
	static wobbleSpeed = 8;
	static wobbleDist = 0.2;

	static pass(time) {
		return time / 1000;
	}

	static parse(level) {
		const coins = [];
		let playerX;
		let playerY;
		const staticMap = level
			.split('\n')
			.filter((row) => row.trim())
			.map((str, y) =>
				str.split('').map((item, x) => {
					if (item === '@') {
						playerX = x;
						playerY = y;
						return '.';
					}
					if (item === 'o') {
						coins.push({
							baseX: x + 0.5,
							baseY: y + 0.5,
						});
						return '.';
					}
					return item;
				})
			);
		return new Game(
			staticMap,
			new Player({
				staticMap: staticMap,
				x: playerX,
				y: playerY,
				speedX: 0,
				direction: 'ltr',
				speedY: 0.1,
				size: { width: 0.5, height: 1 },
			}),
			coins.map((coin) => Coin.create(coin.baseX, coin.baseY))
		);
	}

	constructor(map, player, coins) {
		this.staticMap = map;
		this.player = player;
		this.coins = coins;
	}

	tick(time) {
		return new Game(this.staticMap, this.player.tick(time), this.coinsTick(time));
	}
	coinsTick(time) {
		const updatedCoins = this.coins.map((coin) => coin.tick(time));
		return this.gatherCoins(updatedCoins);
	}

	gatherCoins(coins) {
		return coins.filter((coin) => !this.isCoinGathered(this.player, coin));
	}
	isCoinGathered(player, coin) {
		const distance = Math.sqrt(
			Math.pow(player.x + player.size.width / 2 - coin.x, 2) +
				Math.pow(player.y + player.size.height / 2 - coin.y, 2)
		);
		return distance <= coin.radius * 1.3;
	}
}

runGame(Game.parse(level));

function runGame(currentGame) {
	const standardSize = Game.standardSize;

	const canvas = document.createElement('canvas');
	canvas.width = currentGame.staticMap[0].length * standardSize;
	canvas.height = currentGame.staticMap.length * standardSize;
	document.body.append(canvas);
	document.body.addEventListener('keydown', (event) => {
		if (event.key === 'ArrowUp') {
			currentGame.player.jump();
		}
	});
	document.body.addEventListener('keydown', (event) => {
		if (event.key === 'ArrowRight') {
			currentGame.player.go('ltr');
		}
	});
	document.body.addEventListener('keyup', (event) => {
		if (event.key === 'ArrowRight') {
			currentGame.player.stop();
		}
	});
	document.body.addEventListener('keydown', (event) => {
		if (event.key === 'ArrowLeft') {
			currentGame.player.go('rtl');
		}
	});
	document.body.addEventListener('keyup', (event) => {
		if (event.key === 'ArrowLeft') {
			currentGame.player.stop();
		}
	});

	makeStep(currentGame, canvas);

	function makeStep(game, canvas) {
		drawGame(game, canvas);

		const then = new Date();
		requestAnimationFrame(() => {
			const now = new Date();
			const time = now - then > 20 ? 20 : now - then;
			currentGame = game.tick(Game.pass(time));
			makeStep(currentGame, canvas);
		});
	}
}

function drawGame(game, canvas) {
	const ctx = canvas.getContext('2d');

	ctx.clearRect(0, 0, canvas.width, canvas.height);

	game.staticMap.forEach((row, y) => {
		row.forEach((item, x) => {
			if (item === '#') {
				ctx.fillStyle = 'black';
				ctx.fillRect(x * Game.standardSize, y * Game.standardSize, Game.standardSize, Game.standardSize);
			}
			if (item === '+') {
				ctx.fillStyle = 'red';
				ctx.fillRect(x * Game.standardSize, y * Game.standardSize, Game.standardSize, Game.standardSize);
			}
		});
	});

	if (!game.player.dead) {
		ctx.fillStyle = 'blue';
		ctx.fillRect(
			game.player.x * Game.standardSize,
			game.player.y * Game.standardSize,
			game.player.size.width * Game.standardSize,
			game.player.size.height * Game.standardSize
		);
	}

	game.coins.forEach((coin) => {
		ctx.beginPath();
		ctx.arc(
			coin.x * Game.standardSize,
			coin.y * Game.standardSize,
			coin.radius * Game.standardSize,
			0,
			2 * Math.PI,
			false
		);
		ctx.fillStyle = 'black';
		ctx.fill();
	});
}

function range(from, to) {
	const arr = [];
	let i = from;
	while (i <= to) {
		arr.push(i);
		i++;
	}
	return arr;
}
