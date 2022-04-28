const level = `
###########
#.........#
#..o......#
#.#####...#
#.........#
#.........#
#.........#
#.@.......#
#.........#
#.........#
#.........#
#.........#
###########
`;

class Game {
	static standardSize = 30;
	static gravity = 39;
	static jumpStrength = 20;
	static horizontalSpeed = 8;

	constructor(map, player) {
		if (map) {
			this.staticMap = map;
		}
		if (player) {
			this.player = player;
		}
	}
	tick(time) {
		return new Game(this.staticMap, this.playerTick(time));
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
							size: { width: 1.5, height: 1.2 },
						};
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
	playerTick(time) {
		let movedPlayer = this.movedPlayer(time);

		if (this.preventsMove(movedPlayer, 'bottom')) {
			movedPlayer = {
				...movedPlayer,
				y: Math.floor(movedPlayer.y + this.player.size.height) - this.player.size.height,
				speedY: 0,
			};
			console.log('stop bottom');
		}
		if (this.preventsMove(movedPlayer, 'top')) {
			movedPlayer = {
				...movedPlayer,
				y: Math.ceil(movedPlayer.y),
				speedY: 0,
			};
			console.log('stop top');
		}

		if (this.preventsMove(movedPlayer, 'right')) {
			movedPlayer = {
				...movedPlayer,
				x: Math.floor(movedPlayer.x + movedPlayer.size.width) - movedPlayer.size.width,
				speedX: 0,
			};
			console.log('stop right');
		}
		if (this.preventsMove(movedPlayer, 'left')) {
			movedPlayer = {
				...movedPlayer,
				x: Math.ceil(movedPlayer.x),
				speedX: 0,
			};
			console.log('stop left');
		}

		return movedPlayer;
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
			return rightYSquares.some((square) => {
				const result =
					this.staticMap[square][xRight] === '#' &&
					this.overlaps(newPlayer, {
						y: square,
						x: xRight,
						width: 1,
						height: 1,
					});
				return result;
			});
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
		console.log('move: ', direction);
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
		});
	});

	ctx.fillStyle = 'blue';
	ctx.fillRect(
		game.player.x * Game.standardSize,
		game.player.y * Game.standardSize,
		game.player.size.width * Game.standardSize,
		game.player.size.height * Game.standardSize
	);
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
