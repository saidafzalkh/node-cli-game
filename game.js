import crypto from "crypto";
import Table from "cli-table";
import colors from "colors";
import PromptSync from "prompt-sync";
const prompt = PromptSync();

class Game {
  constructor(options, table) {
    this.options = options;
    this.table = table;
    this.security = new Security();
    this.rules = new Rules();
  }

  start() {
    let key = this.security.getKey().toUpperCase();
    let computerMove = this.makeMove();
    let hmac = this.security.getHmac(computerMove.name, key).toUpperCase();

    console.log("HMAC: " + hmac);

    let playerMove = this.getPlayerInput();
    let result = this.rules.checkWinner(
      playerMove.id,
      computerMove.id,
      this.options
    );
    console.log("\n");
    console.log(colors.cyan("Your move: ") + playerMove.name);
    console.log(colors.blue("Computer move: ") + computerMove.name);
    console.log("HMAC key: " + key);

    switch (result) {
      case 0:
        console.log(colors.yellow("Draw!"));
        break;
      case -1:
        console.log(colors.red("You Loose!"));
        break;
      default:
        console.log(colors.green("You Win!"));
        break;
    }
  }

  showMenu() {
    let menu = colors.green("Available moves: ");
    this.options.forEach((e, i) => (menu += `\n${i + 1} - ${e}`));
    menu += `\n${colors.red("0 - Exit")} \n${colors.yellow("? - Help")}`;
    console.log(menu);
  }

  makeMove() {
    let random = Math.floor(Math.random() * this.options.length);
    return { id: random + 1, name: this.options[random] };
  }

  getPlayerInput() {
    this.showMenu();
    let input;
    do {
      input = prompt(colors.cyan("Enter your move:") + " ");
    } while (
      !((+input >= 0 && +input < this.options.length + 1) || input === "?") ||
      input.trim() === ""
    );

    switch (input) {
      case "0":
        process.exit();
      case "?":
        console.log(this.table);
        this.getPlayerInput();
        break;
      default:
        return { id: +input, name: this.options[+input - 1] };
    }
  }
}

class Validation {
  constructor() {}

  checkArgv(argv) {
    if (argv.length === 0) {
      console.log(
        colors.red("you need to add arguments!") +
          "\nThe number of arguments must be " +
          colors.magenta("greater than or equal to three, odd and unique.")
      );
      process.exit();
    }
    if (argv.length < 3) {
      console.log(
        "The number of arguments must be " +
          colors.magenta("greater than or equal to three")
      );
      process.exit();
    }
    if (argv.length % 2 === 0) {
      console.log("The number of arguments must be " + colors.magenta("odd"));
      process.exit();
    }
    if (argv.length !== new Set(argv).size) {
      console.log(colors.magenta("arguments should be uniq"));
      process.exit();
    }

    return argv;
  }
}

class Rules {
  constructor() {}

  checkWinner(player, computer, options) {
    let dif = player - computer;
    let mid = Math.floor(options.length / 2);
    let min = 0 - mid;
    let max = options.length;

    if (dif === 0) return 0;
    if ((dif >= min && dif < 0) || (dif <= max && dif > mid)) return -1;
    else return 1;
  }
}

class GameTable extends Rules {
  constructor() {
    super();
  }

  create(options) {
    let head = this.createHead(options);
    let body = this.createBody(options);
    let table = new Table(head);
    body.forEach((e) => table.push(e));
    return table.toString();
  }

  createHead(options) {
    return { head: ["", ...options.map((e) => colors.blue(e))] };
  }

  createCell(player, computer, options) {
    switch (this.checkWinner(player, computer, options)) {
      case 0:
        return colors.yellow("Draw");
      case -1:
        return colors.red("Loose");
      default:
        return colors.green("Win");
    }
  }

  createBody(options) {
    return options.map((e, i) => ({
      [colors.cyan(e)]: options.map((_, j) =>
        this.createCell(i + 1, j + 1, options)
      ),
    }));
  }
}

class Security {
  constructor() {}

  getRandom() {
    let bytes = new Uint8Array(32);
    return crypto.getRandomValues(bytes);
  }

  getKey() {
    let oneByteRandomNumbers = this.getRandom();
    let key = "";
    for (let dec of oneByteRandomNumbers) {
      let hex = dec.toString(16);
      key += hex.length === 1 ? "0" + hex : hex;
    }
    return key;
  }

  getHmac(data, key) {
    return crypto.createHmac("sha256", key).update(data).digest("hex");
  }
}

const validator = new Validation();
const argv = validator.checkArgv(process.argv.slice(2));
const game = new Game(argv, new GameTable().create(argv));

game.start();
