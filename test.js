// WIP


// const expression = new ExprBinary(
//   new ExprUnary(
//     new Token(TokenType.MINUS, "-", null, 1),
//     new ExprLiteral(123)
//   ),
//   new Token(TokenType.STAR, "*", null, 1),
//   new ExprGrouping(
//     new ExprLiteral(45.67)
//   )
// );

// console.log(new AstPrinter().print(expression));


// TO ADD TO TEST-FILE
// const tokens = [
//   new Token(TokenType.NUMBER, "123", 123, 1),
//   new Token(TokenType.PLUS, "+", null, 1),
//   new Token(TokenType.NUMBER, "456", 456, 1),
//   new Token(TokenType.EOF, "", null, 1)
// ];

// const parser = new Parser(tokens);
// const expr = parser.parse();
// console.log(expr); // Should be an ExprBinary