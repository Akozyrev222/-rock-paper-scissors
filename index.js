const readline = require("readline-sync");
const {AsciiTable3, AlignmentEnum} = require('ascii-table3');
const {Random} = require("random-js");
const crypto = require("crypto");
const pkg = require('js-sha3');

const args = process.argv.slice(2);

const EXIT_COMMAND = '0';
const HELP_COMMAND = '?';

const DRAW = 'Draw';
const WIN = 'Win';
const LOSE = 'Lose';

const DRAW_RESULT = "It's a " + DRAW
const WIN_RESULT = `You ${WIN}!`
const LOSE_RESULT = `You ${LOSE} :(`;

const TABLE_HEADER = 'PC/USER';
const PLAYER_MOVE = 'Your move:';
const COMPUTER_MOVE = 'Computer move:';

const HMAC_KEY = 'HMAC key:';
const AVAILABLE_MOVES = 'Available moves:';
const ERROR = 'Invalid input, try again.';

class HMAC {
    constructor(key, value) {
        this.key = key;
        this.value = value;
        this.hmac = this.generateHMAC();
    }

    generateHMAC() {
        return pkg.sha3_256(`${this.key}${this.value}`);
    }

    getHMAC() {
        return this.hmac;
    }
}

class Key {
    constructor() {
        this.key = this.generateKey();
    }

    generateKey() {
        return crypto.randomBytes(256).toString("base64url");
    }

    getKey() {
        return this.key;
    }
}

class ComputerMove {
    constructor(elements) {
        this.elements = elements
        this.indexComputer = this.generateRandomMove();
        this.computerMove = elements[this.indexComputer];
    }

    generateRandomMove() {
        return new Random().integer(0, this.elements.length - 1);
    }

    getMove() {
        return this.computerMove;
    }
}

class GameRules {
    constructor(elements, playerMove, computerMove) {
        this.matrix = new Table(elements).filledMatrix;
        this.indexPlayer = elements.indexOf(playerMove);
        this.indexComputer = elements.indexOf(computerMove);
        this.result = this.matrix[this.indexPlayer][this.indexComputer];
    }

    getWinner() {
        return this.result === 0 ? DRAW_RESULT : this.result === 1 ? WIN_RESULT : LOSE_RESULT;
    }
}

class Table {
    constructor(elements) {
        this.elements = elements
        this.size = elements.length;
        this.halfSize = Math.floor(this.size / 2);
        this.matrix = this.createEmptyMatrix();
        this.filledMatrix = this.fillMatrix();
        this.convertedMatrix = this.convertMatrix();
    }

    createEmptyMatrix() {
        return Array.from({length: this.size}, () => Array(this.size).fill(0));
    }

    fillMatrix() {
        for (let i = 0; i < this.size; i++) {
            for (let j = 1; j <= this.halfSize; j++) {
                const winIndex = (i + j) % this.size;
                const loseIndex = (i - j + this.size) % this.size;
                this.matrix[i][winIndex] = 1;
                this.matrix[i][loseIndex] = -1;
            }
        }
        return this.matrix;
    }

    convertMatrix() {
        return this.matrix.map(e => e.map((i) => {
            return i === 0 ? DRAW : i === 1 ? WIN : LOSE;
        }))
    }

    printTable() {
        const table = new AsciiTable3()
            .setHeading(TABLE_HEADER, ...this.elements)
            .setAlign(3, AlignmentEnum.CENTER);
        this.elements.forEach((e, i) => table.addRow(e, ...this.convertedMatrix[i]));
        return table.toString();
    }
}

const hasDuplicates = (elements) => {
    const uniqueElements = new Set(elements);
    return uniqueElements.size !== elements.length;
}

const isEvenCount = (elements) => {
    return elements.length % 2 === 0;
}

const isValid = (elements) => {
    return !isEvenCount(elements) && !hasDuplicates(elements);
}

const printAvailableMoves = () => {
    const moves = args.map((e, i) => `\n${i + 1} - ${e}`).concat(`\n${EXIT_COMMAND} - exit`, `\n${HELP_COMMAND} - help`);
    console.log(AVAILABLE_MOVES + moves);
};

const printGameResult = (playerMoveIndex, computerMove, hmacKey) => {
    const playerMove = args[playerMoveIndex - 1];
    const game = new GameRules(args, playerMove, computerMove);
    console.log(`${PLAYER_MOVE} ${playerMove} \n${COMPUTER_MOVE} ${computerMove} `);
    console.log(game.getWinner());
    console.log(`${HMAC_KEY} ${hmacKey}`);
};
const startGame = () => {
    const computerMove = new ComputerMove(args).getMove();
    const hmacKey = new Key().getKey();
    const hmac = new HMAC(hmacKey, computerMove).getHMAC();
    const table = new Table(args).printTable();

    console.log("HMAC: " + hmac);

    while (true) {
        printAvailableMoves();
        const move = readline.question(PLAYER_MOVE);
        if (move === EXIT_COMMAND) {
            break;
        } else if (move === HELP_COMMAND) {
            console.log(table);
        } else if (!isNaN(move) && move >= 1 && move <= args.length) {
            printGameResult(move, computerMove, hmacKey);
            break;
        } else {
            console.log(ERROR);
        }
    }
}
const main = () => {
    !isValid(args) ? console.log(ERROR) : startGame();
};
main();
