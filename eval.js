const { ExprVisitor } = require("./expr");
const { RuntimeError } = require("./helper");
const { StmtVisitor } = require("./stmt");
const { TokenType } = require("./token");

// TODO:
// extend Interpreter class to accept Stmt
// do we need to somehow use mixins?
// https://craftinginterpreters.com/statements-and-state.html#executing-statements
// https://stackoverflow.com/questions/29879267/es6-class-multiple-inheritance
// for a static solution we have:
// class A {}
// class B extends A {}
// class C extends B {}

class Interpreter extends ExprVisitor {
    visitBinaryExpr(expr) {
        const left = this.evaluate(expr.left);
        const right = this.evaluate(expr.right);

        switch (expr.operator.type) {
            case TokenType.GREATER:
                this.checkNumberOperands(expr.operator, left, right);
                return Number(left) > Number(right);
            case TokenType.GREATER_EQUAL:
                this.checkNumberOperands(expr.operator, left, right);
                return Number(left) >= Number(right);
            case TokenType.LESS:
                this.checkNumberOperands(expr.operator, left, right);
                return Number(left) < Number(right);
            case TokenType.LESS_EQUAL:
                this.checkNumberOperands(expr.operator, left, right);
                return Number(left) <= Number(right);
            case TokenType.BANG_EQUAL:
                this.checkNumberOperands(expr.operator, left, right);
                return !this.isEqual(left, right);
            case TokenType.EQUAL_EQUAL:
                this.checkNumberOperands(expr.operator, left, right);
                return this.isEqual(left, right);
            case TokenType.MINUS:
                this.checkNumberOperand(expr.operator, right);
                return Number(left) - Number(right);
            // plus is special, because we can concatenate 
            // strings or add numbers
            case TokenType.PLUS:
                // add support for concatenation of numbers and strings
                if ((typeof left === "string" && typeof right === "number") ||
                    (typeof left === "number" && typeof right === "string")) {
                    return String(left) + String(right);
                }
                if (typeof left === "number" && typeof right === "number") {
                    return Number(left) + Number(right);
                }
                if (typeof left === "string" && typeof right === "string") {
                    return String(left) + String(right);
                }

                throw new RuntimeError(`${expr.operator}, Operands must be two numbers of two strings.`);
            case TokenType.SLASH:
                // add support for divide by zero exception for numbers
                if (typeof left === "number" && right === 0) {
                    throw new RuntimeError(`${left} / ${right}, Arithmetic Exception: Cannot divide by zero.`);
                }
                this.checkNumberOperands(expr.operator, left, right);
                return Number(left) / Number(right);
            case TokenType.STAR:
                this.checkNumberOperands(expr.operator, left, right);
                return Number(left) * Number(right);
            default:
                return;
        }

        return null; // can't be reached otherwise
    }
    visitUnaryExpr(expr) {
        const right = this.evaluate(expr.right);

        switch (expr.operator.type) {
            case TokenType.BANG:
                return !this.isTruthy(right);
            case TokenType.MINUS:
                return -Number(right); // we cast the numerical value of right
            default:
                return;
        }

        return null; // can't be reached otherwise
    }
    visitLiteralExpr(expr) {
        return expr.value;
    }
    visitGroupingExpr(expr) {
        return this.evaluate(expr.expression);
    }
    visitExpressionStmt(stmt) {
        this.evaluate(stmt.expression);
    }
    visitPrintStmt(stmt) {
        const value = this.evaluate(stmt.expression);
        console.log(this.stringify(value));
        return null;
    }

    evaluate(expr) {
        return expr.accept(this);
    }

    // TODO: this could be wrong
    isTruthy(object) {
        if (object === null) return false;

        if (typeof object === "boolean") {
            return Boolean(object);
        }

        return true;
    }

    isEqual(a, b) {
        if (a === null && b === null) return true;
        if (a === null) return false;

        // TODO: see if this is sufficient or we need a custom func
        return a === b;
    }

    // used to catch errors for minus
    checkNumberOperand(operator, operand) {
        if (typeof operand === "number") return;
        throw new RuntimeError(`${operator}, Operand must be a number.`);
    }

    // used to catch errors for everything else
    checkNumberOperands(operator, left, right) {
        if (typeof left === "number" && typeof right === "number") {
            return;
        }

        throw new RuntimeError(`${operator}, Operands must be numbers.`);
    }

    interpret(statements) {
        try {
            for (const statement of statements) {
                this.execute(statement);
            }
        } catch (error) {
            console.log(`Error ${error}`);
        }
        // try {
        //     const value = this.evaluate(expression);
        //     console.log(this.stringify(value));
        // } catch (error) {
        //     // TODO: fix this?
        //     // Lox.runtimeError(error);
        //     console.log(error);
        // }
    }

    execute(stmt) {
        stmt.accept(this);
    }

    stringify(object) {
        if (object === null) return "nil";

        if (typeof object === "number") {
            let text = String(object);

            // this is mostly for Javas floating point
            // but in JS we can use both at the same time, so:
            // TODO: check if this is correct
            if (text.endsWith(".0")) {
                text = text.substring(0, text.length - 2);
            }

            return text;
        }

        return String(object);
    }
}

module.exports = { Interpreter };