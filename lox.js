const fs = require('fs').promises;
const path = require('path');
const readline = require('readline');

// TODO:
// add scanner class 4.4
// https://craftinginterpreters.com/scanning.html

const tokenType = new Set([
  // Single-character tokens
  'LEFT_PAREN', 'RIGHT_PAREN', 'LEFT_BRACE', 'RIGHT_BRACE',
  'COMMA', 'DOT', 'MINUS', 'PLUS', 'SEMICOLON', 'SLASH', 'STAR',

  // One or two character tokens
  'BANG', 'BANG_EQUAL',
  'EQUAL', 'EQUAL_EQUAL',
  'GREATER', 'GREATER_EQUAL',
  'LESS', 'LESS_EQUAL',

  // Literals
  'IDENTIFIER', 'STRING', 'NUMBER',

  // Keywords
  'AND', 'CLASS', 'ELSE', 'FALSE', 'FUN', 'FOR', 'IF', 'NIL', 'OR',
  'PRINT', 'RETURN', 'SUPER', 'THIS', 'TRUE', 'VAR', 'WHILE',

  'EOF'
]);

class Token {
  constructor(type, lexeme, literal, line) {
    this.type = type;
    this.lexeme = lexeme;
    this.literal = literal;
    this.line = line;
  }

  toString() {
    return `${this.type} ${this.lexeme} ${this.literal}`;
  }
}

class Lox {
  constructor() {
    const args = process.argv.slice(2);
    if (args.length > 1) {
      console.log("Usage: jlox [script]");
    } else if (args.length === 1) {
      this.runFile(args[2]);
    } else {
      this.runPrompt();
    }
  }

  static hadError = false;

  async runFile(filePath) {
    try {
      const data = await fs.readFile(path.resolve(filePath), 'utf8');
      run(data);
      if (this.hadError) process.exit(1);
    } catch (error) {
      console.error('Error reading file:', error);
    }
  }

  runPrompt() {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });

    rl.setPrompt('> ');
    rl.prompt();

    rl.on('line', (line) => {
      if (line.trim() === '') {
        rl.close();
        return;
      }
      run(line);
      this.hadError = false;
      rl.prompt();
    });

    rl.on('close', () => {
      console.log('Exiting...');
      process.exit(0);
    });
  }

  run(source) { 
    const scanner = new Scanner(source);
    const tokens = scanner.scanTokens();

    for (let token of tokens) {
      console.log(token);
    }
  };

  error(line, message) {
    report(line, "", message);
  }

  report(line, where, message) {
    console.error("[line" + line + "] Error" + where + ": " + message);
    this.hadError = true;
  }
}

const lox = new Lox();