class RuntimeError extends Error {
    constructor(message) {
        super(message);
        this.name = "Runtime error";
    }
}

module.exports = { RuntimeError };