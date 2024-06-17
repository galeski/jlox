const { ExprBinary, ExprGrouping, ExprLiteral, ExprUnary } = require('./expr.js');
const { Token, Keywords, TokenType } = require('./token.js');

class Parser {
  // #tokens;
  #current = 0;

  constructor(tokens) {
    this.tokens = [...tokens];
  }

  print() {
    console.log(JSON.stringify(this.tokens));
  }

  expression() {
    return this.equality();
  }

  parse() {
    try {
      return this.expression();
    } catch (error) {
      if (error.name === "ParseError") return 0;
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
    // TODO: Check this bang
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
      this.consume(TokenType.RIGHT_PAREN, "Expect ')' after expression.");
      return new ExprGrouping(expr);
    }

    throw this.error(this.peek(), "Expect expression.");
  }

  match(...types) {
    for (let type of types) {
      // console.log(type);
      if (this.check(type)) {
        console.log(type);
        this.advance();
        return true;
      }
    }
    return false;
  }

  consume(type, message) {
    if (this.check(type)) return this.advance();

    throw this.error(this.peek(), message);
  }

  check(type) {
    if (this.isAtEnd()) return false;
    return this.peek().type == type; // eeee...
  }

  advance() {
    if (!this.isAtEnd()) this.#current++;
    return this.previous();
  }

  isAtEnd() {
    return this.peek().type == TokenType.EOF;
  }

  peek() {
    return this.tokens[this.#current];
  }

  previous() {
    return this.tokens[this.#current - 1];
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
  constructor(message) {
    super(message);
    this.name = "ParseError";
  }
};

module.exports = { Parser };