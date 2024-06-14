const fs = require('fs').promises;
const path = require('path');
const readline = require('readline');

// TODO:
// [done ?] FIX LEXEME reading
// [] Add support to Lox’s scanner for C-style /* ... */ block comments
// [] Extract scanner to a new source file
// [] Create AST Printer class from:
// https://craftinginterpreters.com/representing-code.html

// For now I will probably use an object instead of a set, because it
// more closely follows javas enums
const TokenType = Object.freeze({
  // One-character tokens
  LEFT_PAREN: 'LEFT_PAREN',
  RIGHT_PAREN: 'RIGHT_PAREN',
  LEFT_BRACE: 'LEFT_BRACE',
  RIGHT_BRACE: 'RIGHT_BRACE',
  COMMA: 'COMMA',
  DOT: 'DOT',
  MINUS: 'MINUS',
  PLUS: 'PLUS',
  SEMICOLON: 'SEMICOLON',
  SLASH: 'SLASH',
  STAR: 'STAR',

  // One or two character tokens
  BANG: 'BANG',
  BANG_EQUAL: 'BANG_EQUAL',
  EQUAL: 'EQUAL',
  EQUAL_EQUAL: 'EQUAL_EQUAL',
  GREATER: 'GREATER',
  GREATER_EQUAL: 'GREATER_EQUAL',
  LESS: 'LESS',
  LESS_EQUAL: 'LESS_EQUAL',

  // Literals
  IDENTIFIER: 'IDENTIFIER',
  STRING: 'STRING',
  NUMBER: 'NUMBER',

  // Keywords
  AND: 'AND',
  CLASS: 'CLASS',
  ELSE: 'ELSE',
  FALSE: 'FALSE',
  FUN: 'FUN',
  FOR: 'FOR',
  IF: 'IF',
  NIL: 'NIL',
  OR: 'OR',
  PRINT: 'PRINT',
  RETURN: 'RETURN',
  SUPER: 'SUPER',
  THIS: 'THIS',
  TRUE: 'TRUE',
  VAR: 'VAR',
  WHILE: 'WHILE',

  EOF: 'EOF'
});

const Keywords = Object.freeze({
  'and': 'AND',
  'class': 'CLASS',
  'else': 'ELSE',
  'false': 'FALSE',
  'for': 'FOR',
  'fun': 'FUN',
  'if': 'IF',
  'nil': 'NIL',
  'or': 'OR',
  'print': 'PRINT',
  'return': 'RETURN',
  'super': 'SUPER',
  'this': 'THIS',
  'true': 'TRUE',
  'var': 'VAR',
  'while': 'WHILE'
});

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

class Expr {
  constructor(left, operator, right) {
    this.left = left;
    this.operator = operator;
    this.right = right;
  }
}

class ExprBinary {
  constructor(left, operator, right) {
    this.left = left;
    this.operator = operator;
    this.right = right;
  }
}

class ExprUnary {
  constructor(operator, right) {
    this.operator = operator;
    this.right = right;
  }
}

class ExprLiteral {
  constructor(literal) {
    this.literal = literal;
  }
}

class ExprGrouping {
  constructor(grouping) {
    this.grouping = grouping;
  }
}

class Parser {
  // #tokens;
  #current = 0;

  constructor(tokens) {
    this.tokens = tokens;
  }

  expression() {
    return this.equality();
  }

  parse() {
    try {
      return this.expression();
    } catch (error) {
      if (error.name === "ParseError") return null;
    }
  }

  equality() {
    let expr = this.comparison();

    while (this.match(TokenType.BANG_EQUAL, TokenType.EQUAL_EQUAL)) {
      let operator = this.previous();
      let right = this.comparison();
      expr = new ExprBinary(expr, operator, right);
    }

    return expr;
  }

  comparison() {
    let expr = this.term();

    while (this.match(TokenType.GREATER, TokenType.GREATER_EQUAL,
      TokenType.LESS, TokenType.LESS_EQUAL
    )) {
      let operator = this.previous();
      let right = this.term();
      expr = new ExprBinary(expr, operator, right);
    }

    return expr;
  }

  // addition and subtraction
  term() {
    let expr = this.factor();

    while (this.match(TokenType.MINUS, TokenType.PLUS)) {
      let operator = this.previous();
      let right = this.factor();
      expr = new ExprBinary(expr, operator, right);
    }

    return expr;
  }

  // multiplication and division
  factor() {
    let expr = this.unary();

    while (this.match(TokenType.SLASH, TokenType.STAR)) {
      let operator = this.previous();
      let right = this.unary();
      expr = new ExprBinary(expr, operator, right);
    }

    return expr;
  }

  unary() {
    if (this.match(TokenType.BANG, TokenType.MINUS)) {
      let operator = this.previous();
      let right = this.unary();
      return new ExprUnary(operator, right);
    }

    return this.primary();
  }

  primary() {
    if (this.match(TokenType.FALSE)) return new ExprLiteral(false);
    if (this.match(TokenType.TRUE)) return new ExprLiteral(true);
    if (this.match(TokenType.NIL)) return new ExprLiteral(null);

    if (this.match(TokenType.NUMBER, TokenType.STRING)) {
      return new ExprLiteral(this.previous().literal);
    }

    if (this.match(TokenType.LEFT_PAREN)) {
      let expr = this.expression();
      consume(TokenType.RIGHT_PAREN, "Expect ')' after expression.");
      return new ExprGrouping(expr);
    }

    throw this.error(this.peek(), "Expect expression.");
  }

  match(...types) {
    for (let type of types) {
      if (this.check(type)) {
        this.advance();
        return true;
      }
    }
    return false;
  }

  consume(type, message) {
    if (this.check(type)) return this.advance();

    throw error(this.peek(), message);
  }

  check(type) {
    if (this.isAtEnd()) return false;
    return this.peek().type = type; // eeee...
  }

  advance() {
    if (!this.isAtEnd()) this.#current++;
    return this.previous();
  }

  isAtEnd() {
    return this.peek().type == TokenType.EOF;
  }

  peek() {
    return this.tokens[current];
  }

  previous() {
    return tokens[current - 1];
  }

  error(token, message) {
    Lox.parseError(token, message);
    return new ParseError();
  }

  synchronize() {
    this.advance();

    while (!this.isAtEnd()) {
      if (this.previous().type == TokenType.SEMICOLON) return;

      switch (this.peek().type) {
        case TokenType.CLASS:
        case TokenType.FUN:
        case TokenType.VAR:
        case TokenType.FOR:
        case TokenType.IF:
        case TokenType.WHILE:
        case TokenType.PRINT:
        case TokenType.RETURN:
        case TokenType.DEFAULT:
          return;
      }
    }

    this.advance();
  }
}

// TODO: should this be somehow moved into Parser class???
class ParseError extends Error {
  constructor() {
    this.name = "ParseError";
  }
};

class Scanner {
  // source;
  #tokens = [];
  #start = 0;
  #current = 0;
  #line = 1;

  constructor(source) {
    this.source = source;
  }

  scanTokens() {
    while (!this.isAtEnd()) {
      this.#start = this.#current;
      this.scanToken();
    }

    this.#tokens.push(new Token(TokenType.EOF, "", null, this.#line))
    return this.#tokens;
  }

  scanToken() {
    let c = this.advance();

    switch (c) {
      case '(': this.addToken(TokenType.LEFT_PAREN); break;
      case ')': this.addToken(TokenType.RIGHT_PAREN); break;
      case '{': this.addToken(TokenType.LEFT_BRACE); break;
      case '}': this.addToken(TokenType.RIGHT_BRACE); break;
      case ',': this.addToken(TokenType.COMMA); break;
      case '.': this.addToken(TokenType.DOT); break;
      case '-': this.addToken(TokenType.MINUS); break;
      case '+': this.addToken(TokenType.PLUS); break;
      case ';': this.addToken(TokenType.SEMICOLON); break;
      case '*': this.addToken(TokenType.STAR); break;

      case '!':
        this.addToken(this.match('=') ? TokenType.BANG_EQUAL : TokenType.BANG);
        break;
      case '=':
        this.addToken(this.match('=') ? TokenType.EQUAL_EQUAL : TokenType.EQUAL);
        break;
      case '<':
        this.addToken(this.match('=') ? TokenType.LESS_EQUAL : TokenType.LESS);
        break;
      case '>':
        this.addToken(this.match('=') ? TokenType.GREATER_EQUAL : TokenType.GREATER);
        break;

      // Special case:
      // We need to take into account that division "/"
      // differs from "//" ie. comment.
      case '/':
        if (match('/')) {
          // A comment goes until the end of the line.
          while (this.peek() != '\n' && !this.isAtEnd()) this.advance();
        } else {
          this.addToken(TokenType.SLASH);
        }
        break;

      // Ignore whitespace.
      case ' ':
      case '\r':
      case '\t':
        break;

      case '\n':
        this.#line++;
        break;

      // String literals.
      case '"': this.string(); break;

      // Keywords and identifiers,
      // numbers and fractional numbers
      // and error otherwise.
      default:
        if (this.isDigit(c)) {
          this.number();
        } else if (this.isAlpha(c)) {
          this.identifier();
        } else {
          Lox.error(this.#line, "Unexpected character.");
        }
        break;
    }
  }

  isAtEnd() {
    return this.#current >= this.source.length;
  }

  // according to the book, this is for data input
  advance() {
    return this.source.charAt(this.#current++);
  }

  // and this is for output
  addToken(type, literal = null) {
    const text = this.source.substring(this.#start, this.#current);
    this.#tokens.push(new Token(type, text, literal, this.#line));
  }

  match(expected) {
    if (this.isAtEnd()) return false;
    if (this.source.charAt(this.#current) !== expected) return false;

    this.#current++;
    return true;
  }

  peek() {
    if (this.isAtEnd()) return '\0';
    return this.source.charAt(this.#current);
  }

  peekNext() {
    if (this.#current + 1 >= this.source.length) return '\0';
    return this.source.charAt(this.#current + 1);
  }

  string() {
    while (this.peek() !== '"' && !this.isAtEnd()) {
      if (this.peek() === "\n") line++;
      this.advance();
    }

    if (this.isAtEnd()) {
      Lox.error(line, "Unterminated string.");
      return;
    }

    // we have "
    this.advance();

    const value = this.source.substring(this.#start + 1, this.#current - 1);
    this.addToken(TokenType.STRING, value);
  }

  isDigit(c) {
    return c >= '0' && c <= '9';
  }

  number() {
    while (this.isDigit(this.peek())) this.advance();

    // Look for a fractional part.
    if (this.peek() === '.' && this.isDigit(this.peekNext())) {
      // Consume the "."
      this.advance();

      while (this.isDigit(this.peek())) this.advance();
    }

    this.addToken(TokenType.NUMBER,
      parseFloat(this.source.substring(this.#start, this.#current)));
  }

  identifier() {
    while (this.isAlphaNumeric(this.peek())) this.advance();

    const text = this.source.substring(this.#start, this.#current);

    // TODO: see if this is correct
    let type = Keywords[text]
      ? Keywords[text]
      : TokenType.IDENTIFIER;

    this.addToken(type);
  }

  isAlpha(c) {
    return (c >= 'a' && c <= 'z') ||
      (c >= 'A' && c <= 'Z') ||
      c === '_';
  }

  isAlphaNumeric(c) {
    return this.isAlpha(c) || this.isDigit(c);
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
      this.run(line);
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

    const parser = new Parser(tokens);
    const expression = parser.parse();

    if (this.hadError) return;

    // TODO: add AST Printer here

    for (let token of tokens) {
      console.log(token);
    }
  };

  static error(line, message) {
    this.#report(line, "", message);
  }

  static parseError(token, message) {
    if (token.type === TokenType.EOF) {
      this.#report(token.line, " at end", message);
    } else {
      this.#report(token.line, " at '" + token.lexeme + "'", message);
    }
  }

  static #report(line, where, message) {
    console.error("[line " + line + "] Error" + where + ": " + message);
    this.hadError = true;
  }
}

const lox = new Lox();