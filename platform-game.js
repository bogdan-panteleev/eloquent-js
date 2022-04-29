const level = `
###########
#.........#
#..o++o...#
#.........#
#.#####...#
#.@..o....#
#......o..#
#......o..#
#......o..#
#......o..#
#......o..#
###########
`;

class Game {
	static standardSize = 30;
	static gravity = 39;
	static jumpStrength = 25;
	static horizontalSpeed = 10;
	static wobbleSpeed = 8;
	static wobbleDist = 0.2;

	constructor(map, player, coins) {
		if (map) {
			this.staticMap = map;
		}
		if (player) {
			this.player = player;
		}
		this.coins = coins || [];
	}
	tick(time) {
		return new Game(this.staticMap, this.playerTick(time), this.coinsTick(time));
	}
	parse(level) {
		this.staticMap = level
			.split('\n')
			.filter((row) => row.trim())
			.map((str, y) =>
				str.split('').map((item, x) => {
					if (item === '@') {
						this.player = {
							x,
							y: y - 1 / 1.2,
							speedX: 0,
							direction: 'ltr',
							speedY: 0.1,
							size: { width: 0.5, height: 1 },
						};
						return '.';
					}
					if (item === 'o') {
						this.coins.push({
							baseX: x + 0.5,
							baseY: y + 0.5,
							radius: 0.25,
							wobble: Math.random() * Math.PI * 2,
						});
						return '.';
					}
					return item;
				})
			);
		return this;
	}
	movedPlayer(time) {
		const newSpeedY = this.player.speedY + time * Game.gravity;
		const newY = this.player.y + time * newSpeedY;

		const xChange = time * this.player.speedX * (this.player.direction === 'ltr' ? 1 : -1);
		const newX = this.player.x + xChange;

		let movedPlayer = {
			...this.player,
			x: newX,
			y: newY,
			speedY: newSpeedY,
			direction: this.player.direction,
		};
		return movedPlayer;
	}
	coinsTick(time) {
		const updatedCoins = this.coins.map((coin) => {
			const wobble = coin.wobble + time * Game.wobbleSpeed;
			return {
				...coin,
				x: coin.baseX + Math.cos(wobble) * Game.wobbleDist,
				y: coin.baseY + Math.sin(wobble) * Game.wobbleDist,
				wobble,
			};
		});
		return this.gatherCoins(updatedCoins);
	}
	playerTick(time) {
		if (this.player.dead) {
			return this.player;
		}
		let movedPlayer = this.movedPlayer(time);
		const movedHorizontally = { ...movedPlayer, y: this.player.y };
		const movedVertically = { ...movedPlayer, x: this.player.x };

		if (this.preventsMove(movedVertically, 'bottom')) {
			movedPlayer = {
				...movedPlayer,
				y: Math.floor(movedPlayer.y + this.player.size.height) - this.player.size.height,
				speedY: 0,
			};
		}
		if (this.preventsMove(movedVertically, 'top')) {
			movedPlayer = {
				...movedPlayer,
				y: Math.ceil(movedPlayer.y),
				speedY: 0,
			};
		}

		if (this.preventsMove(movedHorizontally, 'right')) {
			movedPlayer = {
				...movedPlayer,
				x: Math.floor(movedPlayer.x + movedPlayer.size.width) - movedPlayer.size.width,
				// speedX: 0,
			};
		}
		if (this.preventsMove(movedHorizontally, 'left')) {
			movedPlayer = {
				...movedPlayer,
				x: Math.ceil(movedPlayer.x),
				// speedX: 0,
			};
		}

		if (this.inLava(movedPlayer)) {
			movedPlayer = { ...movedPlayer, dead: true };
		}

		return movedPlayer;
	}
	inLava(player) {
		return range(Math.floor(player.y), Math.ceil(player.y + player.size.height)).some((y) => {
			return range(Math.floor(player.x), Math.ceil(player.x + player.size.width)).some(
				(x) => this.staticMap[y][x] === '+' && this.overlaps(player, { x, y, width: 1, height: 1 })
			);
		});
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

	jump() {
		if (this.preventsMove(this.movedPlayer(this.pass(5)), 'bottom')) {
			this.player = { ...this.player, speedY: -Game.jumpStrength };
		}
	}
	movePlayer(direction) {
		this.player = { ...this.player, direction, speedX: Game.horizontalSpeed };
	}
	stopPlayer() {
		this.player = { ...this.player, speedX: 0 };
	}
	pass(time) {
		return time / 1000;
	}
}

runGame(new Game().parse(level));

function runGame(currentGame) {
	const standardSize = Game.standardSize;

	const canvas = document.createElement('canvas');
	canvas.width = currentGame.staticMap[0].length * standardSize;
	canvas.height = currentGame.staticMap.length * standardSize;
	document.body.append(canvas);
	document.body.addEventListener('keydown', (event) => {
		if (event.key === 'ArrowUp') {
			currentGame.jump();
		}
	});
	document.body.addEventListener('keydown', (event) => {
		if (event.key === 'ArrowRight') {
			currentGame.movePlayer('ltr');
		}
	});
	document.body.addEventListener('keyup', (event) => {
		if (event.key === 'ArrowRight') {
			currentGame.stopPlayer();
		}
	});
	document.body.addEventListener('keydown', (event) => {
		if (event.key === 'ArrowLeft') {
			currentGame.movePlayer('rtl');
		}
	});
	document.body.addEventListener('keyup', (event) => {
		if (event.key === 'ArrowLeft') {
			currentGame.stopPlayer();
		}
	});

	makeStep(currentGame, canvas);

	function makeStep(game, canvas) {
		drawGame(game, canvas);

		const then = new Date();
		requestAnimationFrame(() => {
			const now = new Date();
			const time = now - then > 20 ? 20 : now - then;
			currentGame = game.tick(game.pass(time));
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
