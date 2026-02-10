function getValueByPath(obj, path) {
    if (obj === null || obj === undefined) return undefined;
    if (typeof path !== 'string' || !path) return undefined;
    return path.split('.').reduce((acc, key) => (acc && acc[key] !== undefined ? acc[key] : undefined), obj);
}

class Parser {
    // 构造函数和辅助方法保持不变
    constructor(expression, context, helpers = {}) {
        this.expression = expression;
        this.context = context;
        this.helpers = helpers;
        this.pos = 0;
        this.globals = {
            Number,
            String,
            Boolean,
            Array,
            Object,
            JSON,
            Math,
            Date,
            parseInt,
            parseFloat,
            isNaN,
            isFinite,
        };
        this.allowedMethods = [
            // --- Array (只读) ---
            'map', 'filter', 'find', 'some', 'every', 'join',
            'slice', 'concat', 'includes', 'indexOf', 'lastIndexOf',
            'flat', 'flatMap', 'reduce', 'reduceRight',
            // forEach 是一个特例，它不返回值但可能被用来做有副作用的操作，
            // 但在我们的沙盒里，它无法修改外部作用域，只能修改数组元素自身（如果是对象），
            // 相对安全，可以保留。
            'forEach',

            // --- String (所有方法都是只读的) ---
            'toUpperCase', 'toLowerCase', 'trim', 'trimStart', 'trimEnd',
            'startsWith', 'endsWith', 'includes', 'indexOf', 'lastIndexOf',
            'substring', 'slice', 'replace', 'replaceAll', 'split', 'repeat',
            'charAt', 'charCodeAt', 'concat', 'match', 'search', 'padStart', 'padEnd',
            'toLocaleLowerCase', 'toLocaleUpperCase',

            // --- Number (所有方法都是只读的) ---
            'toFixed', 'toPrecision', 'toExponential', 'toLocaleString',

            // --- Object (只读) ---
            'hasOwnProperty', 'keys', 'values', 'entries',

            // --- Date (只读 get 系列) ---
            'getDate', 'getDay', 'getFullYear', 'getHours', 'getMinutes', 'getMonth',
            'getSeconds', 'getTime', 'getTimezoneOffset', 'getUTCDate', 'getUTCDay',
            'getUTCFullYear', 'getUTCHours', 'getUTCMinutes', 'getUTCMonth', 'getUTCSeconds',
            'toLocaleDateString', 'toLocaleTimeString', 'toLocaleString', 'toISOString',

            // toString 和 valueOf 是安全的
            'toString', 'valueOf'
        ];
    }

    parse() {
        try {
            // [核心改造] 检查是否为包含 `let` 的多语句模式
            const trimmedExpression = this.expression.trim();
            if (trimmedExpression.startsWith('let ') || trimmedExpression.includes(';')) {
                return this.parseStatements();
            } else {
                // 回退到原始的单一表达式解析模式
                const result = this.parsePipe();
                this.skipWhitespace();
                if (this.pos < this.expression.length) {
                    throw new Error(`Unexpected token at end of expression`);
                }
                return result;
            }
        } catch (e) {
            const sub = this.expression.substring(0, this.pos);
            const linePointer = sub.replace(/./g, ' ') + '^';
            console.error(
                `[Expression Parser Error] ${e.message}\n` +
                `Expression: "${this.expression}"\n` +
                `            ${linePointer}\n` +
                `Remaining: "${this.expression.substring(this.pos)}"`
            );
            return undefined;
        }
    }

    /**
     * [新增方法] 用于解析由分号分隔的语句序列。（已优化）
     */
    parseStatements() {
        // [优化] 使用一个简单的状态机来分割语句，以避免错误地分割字符串中的分号
        const statements = [];
        let currentStatement = '';
        let inString = null; // null, "'", or '"'
        for (let i = 0; i < this.expression.length; i++) {
            const char = this.expression[i];

            if (inString) {
                if (char === inString) {
                    inString = null; // 结束字符串
                }
            } else {
                if (char === "'" || char === '"') {
                    inString = char; // 进入字符串
                } else if (char === ';') {
                    // 遇到语句分隔符，且不在字符串内
                    if (currentStatement.trim()) {
                        statements.push(currentStatement.trim());
                    }
                    currentStatement = '';
                    continue; // 跳过添加分号本身
                }
            }
            currentStatement += char;
        }
        // 添加最后一个语句
        if (currentStatement.trim()) {
            statements.push(currentStatement.trim());
        }

        const localScope = {};
        let lastResult = undefined;

        for (const statement of statements) {
            // 后续逻辑保持不变...
            const currentContext = { ...this.context, ...localScope };

            if (statement.startsWith('let ')) {
                const declaration = statement.substring(4);
                const eqIndex = declaration.indexOf('=');
                if (eqIndex === -1) throw new Error(`Invalid 'let' statement: missing '='. Statement: "${statement}"`);

                const varName = declaration.substring(0, eqIndex).trim();
                if (!varName) throw new Error(`Invalid 'let' statement: missing variable name. Statement: "${statement}"`);

                const expressionBody = declaration.substring(eqIndex + 1).trim();
                if (!expressionBody) throw new Error(`Invalid 'let' statement: missing expression. Statement: "${statement}"`);

                const subParser = new Parser(expressionBody, currentContext, this.helpers);
                const value = subParser.parse();
                localScope[varName] = value;
            } else {
                const subParser = new Parser(statement, currentContext, this.helpers);
                lastResult = subParser.parse();
            }
        }
        return lastResult;
    }

    peek() { return this.expression[this.pos]; }
    consume() { return this.expression[this.pos++]; }
    skipWhitespace() { while (this.pos < this.expression.length && /\s/.test(this.peek())) this.pos++; }
    match(token) {
        this.skipWhitespace();
        if (this.expression.substring(this.pos, this.pos + token.length) === token) {
            // 检查 token 是否是一个 "keyword-like" 标识符（由字母组成）
            const isKeywordLike = /^[a-zA-Z]+$/.test(token);
            if (isKeywordLike) {
                // 如果是关键字，则检查它后面是否是 "单词边界"
                // 即表达式结尾，或者不是字母/数字/下划线
                const nextChar = this.expression[this.pos + token.length];
                if (nextChar && /[a-zA-Z0-9_]/.test(nextChar)) {
                    return false; // 后面还有字母，说明不是独立的关键字，例如 typeofSomething
                }
            }
            
            // 修复 | 和 || 的冲突
            if (token === '|' && this.expression.substring(this.pos, this.pos + 2) === '||') {
                return false;
            }

            this.pos += token.length;
            return true;
        }
        return false;
    }

    // --- Grammar Parsing Methods (with corrected precedence) ---

    // 优先级从低到高: Pipe -> Ternary -> Nullish -> Logical OR -> Logical AND -> Equality -> Comparison -> Additive -> Multiplicative -> Unary -> CallMember -> Primary

    // ... (parsePipe down to parseAdditive are unchanged)
    parsePipe() {
        let left = this.parseTernary();
        while (this.match('|')) {
            const filterName = this.parseIdentifier(true);
            const filterFunc = this.helpers[filterName];
            if (typeof filterFunc !== 'function') { throw new Error(`Filter "${filterName}" not found.`); }
            const args = [];
            while (this.match(':')) {
                args.push(this.parseCallMember());
            }
            left = filterFunc(left, ...args);
        }
        return left;
    }
    parseTernary() {
        const condition = this.parseNullishCoalescing();
        if (this.match('?')) {
            const trueExpr = this.parseTernary();
            if (!this.match(':')) throw new Error("Expected ':' in ternary expression");
            const falseExpr = this.parseTernary();
            return condition ? trueExpr : falseExpr;
        }
        return condition;
    }

    // null合并运算符
    parseNullishCoalescing() {
        let left = this.parseLogicalOr();
        while (this.match('??')) {
            const right = this.parseLogicalOr();
            left = (left !== null && left !== undefined) ? left : right;
        }
        return left;
    }

    // 逻辑或
    parseLogicalOr() {
        let left = this.parseLogicalAnd();
        while (this.match('||')) {
            // 1. 先无条件地解析右侧表达式，以推进指针
            const right = this.parseLogicalAnd();
            // 2. 然后再对两个已解析出的值进行逻辑运算
            left = left || right;
        }
        return left;
    }

    parseLogicalAnd() {
        let left = this.parseEquality();
        while (this.match('&&')) {
            // 1. 先无条件地解析右侧表达式
            const right = this.parseEquality();
            // 2. 然后再进行逻辑运算
            left = left && right;
        }
        return left;
    }

    parseEquality() {
        let left = this.parseComparison();
        while (true) {
            if (this.match('===')) left = left === this.parseComparison();
            else if (this.match('!==')) left = left !== this.parseComparison();
            else if (this.match('==')) left = left == this.parseComparison();
            else if (this.match('!=')) left = left != this.parseComparison();
            else break;
        }
        return left;
    }
    parseComparison() {
        let left = this.parseAdditive();
        while (true) {
            if (this.match('<=')) left = left <= this.parseAdditive();
            else if (this.match('>=')) left = left >= this.parseAdditive();
            else if (this.match('<')) left = left < this.parseAdditive();
            else if (this.match('>')) left = left > this.parseAdditive();
            else break;
        }
        return left;
    }
    parseAdditive() {
        let left = this.parseMultiplicative();
        while (true) {
            if (this.match('+')) left += this.parseMultiplicative();
            else if (this.match('-')) left -= this.parseMultiplicative();
            else break;
        }
        return left;
    }

    parseMultiplicative() {
        let left = this.parseUnary();
        while (true) {
            if (this.match('*')) {
                left *= this.parseUnary();
            } else if (this.match('/')) {
                const right = this.parseUnary();
                if (right === 0) throw new Error("Division by zero");
                left /= right;
            } else if (this.match('%')) { // <-- [FIX 1] 添加取模运算符
                const right = this.parseUnary();
                if (right === 0) throw new Error("Modulo by zero");
                left %= right;
            }
            else {
                break;
            }
        }
        return left;
    }

    // CRITICAL FIX: The call chain is now correct.
    // Unary -> CallMember -> Primary

    parseUnary() {
        // [新增] 添加对 typeof 操作符的支持
        if (this.match('typeof')) {
            // typeof 的操作数是它右边的整个一元表达式
            // 例如 typeof !a，它会先计算 !a，然后对结果取 typeof
            // 这与 JS 的行为一致
            const value = this.parseUnary();
            return typeof value;
        }

        if (this.match('!')) {
            return !this.parseUnary();
        }
        
        // 如果没有一元操作符，则解析更高优先级的表达式
        return this.parseCallMember();
    }

    parseCallMember() {
        let object = this.parsePrimary();

        while (true) {
            // [UNCHANGED] Optional chaining check
            if (object === undefined) {
                this.skipWhitespace();
                const next = this.peek();
                const isOptional = this.expression.substring(this.pos, this.pos + 2) === '?.';
                if (next === '.' || next === '[' || isOptional) {
                    this.skipMemberAccess();
                    continue;
                } else {
                    break;
                }
            }

            this.skipWhitespace();

            // [FIX 1B] Handle direct function calls like Number(...)
            if (this.match('(')) {
                if (typeof object !== 'function') {
                    // It's possible the identifier resolved to a non-function value.
                    // Let's create a more informative error message.
                    let objectName = 'value';
                    try {
                        // Attempt to reconstruct what was parsed to give a better error.
                        // This is a bit of a heuristic.
                        const subExpr = this.expression.substring(0, this.pos - 1).trim();
                        const lastSpace = subExpr.lastIndexOf(' ');
                        const lastParen = subExpr.lastIndexOf('(');
                        objectName = `"${subExpr.substring(Math.max(lastSpace, lastParen) + 1)}"`;
                    } catch (e) {/* ignore */ }
                    throw new Error(`Cannot call ${objectName}, it is not a function.`);
                }
                // Use .apply(null,...) for global functions that don't need a `this` context.
                object = object.apply(null, this.parseArguments());
                continue; // Continue loop for chained calls like func()()
            }


            let optional = false;
            if (this.expression.substring(this.pos, this.pos + 2) === '?.') {
                optional = true;
                this.pos += 2;
                this.skipWhitespace();
            } else if (this.match('.')) {
                optional = false;
            }

            if (optional || this.expression[this.pos - 1] === '.') {
                if (this.peek() === '[') {
                    this.consume();
                    const key = this.parsePipe();
                    if (!this.match(']')) throw new Error("Expected ']' for member access");
                    if (optional && (object === null || object === undefined)) {
                        object = undefined;
                    } else {
                        if (object === null || object === undefined) throw new Error(`Cannot read property '${key}' of ${object}`);
                        object = object[key];
                    }
                    continue;
                }

                const property = this.parseIdentifier(true);

                if (this.match('(')) {
                    if (optional && (object === null || object === undefined)) {
                        this.skipArguments();
                        object = undefined;
                    } else {
                        object = this.executeMethod(object, property, this.parseArguments());
                    }
                } else {
                    if (optional && (object === null || object === undefined)) {
                        object = undefined;
                    } else {
                        if (object === null || object === undefined) throw new Error(`Cannot read property '${property}' of ${object}`);
                        object = object[property];
                    }
                }
                continue;
            }

            if (this.match('[')) {
                const key = this.parsePipe();
                if (!this.match(']')) throw new Error("Expected ']' for member access");
                if (object === null || object === undefined) throw new Error(`Cannot read property '${key}' of ${object}`);
                object = object[key];
                continue;
            }

            break;
        }
        return object;
    }

    // 确保以下辅助方法存在且正确
    skipMemberAccess() {
        this.skipWhitespace();
        if (this.expression.substring(this.pos, this.pos + 2) === '?.') {
            this.pos += 2;
        } else if (this.peek() === '.' || this.peek() === '[') {
            this.pos++;
        }

        this.skipWhitespace();
        if (this.peek() === '[') {
            this.skipUntil(']');
        } else {
            this.parseIdentifier(true);
            if (this.match('(')) {
                this.skipArguments();
            }
        }
    }

    skipArguments() {
        let depth = 1;
        while (this.pos < this.expression.length && depth > 0) {
            const char = this.consume();
            if (char === '(') depth++;
            else if (char === ')') depth--;
        }
    }

    skipUntil(char) {
        let openChar, closeChar;
        if (char === ']') { openChar = '['; closeChar = ']'; }
        // 可以扩展到其他括号

        let depth = 1;
        while (this.pos < this.expression.length && depth > 0) {
            const c = this.consume();
            if (c === openChar) depth++;
            else if (c === closeChar) depth--;
        }
    }

    // 主表达式：括号、数组、对象、字符串、数字、标识符
    parsePrimary() {
        this.skipWhitespace();
        const char = this.peek();
        if (char === '(') {
            this.consume();
            const result = this.parsePipe();
            if (!this.match(')')) throw new Error("Mismatched parentheses: expected ')'");
            return result;
        }
        if (char === '[') return this.parseArray();
        if (char === '{') return this.parseObject();
        if (char === "'" || char === '"') return this.parseString();
        if (/[0-9]/.test(char)) return this.parseNumber();
        if (/[a-zA-Z_]/.test(char)) return this.parseIdentifier();
        throw new Error(`Unexpected character '${char}'`);
    }


    // 对象字面量，含展开 (这个在上次修复计算属性时，逻辑已经比较健壮了，但也可以稍微调整，与 parseArray 保持一致的结构)
    parseObject() {
        if (!this.match('{')) throw new Error("Expected '{' to start object literal");
        const obj = {};
        this.skipWhitespace();

        // 如果紧跟着就是 }，说明是空对象
        if (this.match('}')) {
            return obj;
        }

        while (true) {
            this.skipWhitespace();

            if (this.match('...')) {
                const spreadValue = this.parsePipe();
                if (typeof spreadValue !== 'object' || spreadValue === null) {
                    throw new Error("Spread operand in object must be an object");
                }
                Object.assign(obj, spreadValue);
            } else {
                let key;
                const keyChar = this.peek();

                if (keyChar === '[') {
                    this.consume();
                    key = this.parsePipe();
                    if (!this.match(']')) throw new Error("Expected ']' for computed property name");
                } else if (keyChar === "'" || keyChar === '"') {
                    key = this.parseString();
                } else if (/[a-zA-Z_]/.test(keyChar)) {
                    key = this.parseIdentifier(true);
                } else {
                    throw new Error("Invalid object key");
                }

                if (!this.match(':')) throw new Error("Expected ':' after object key");
                const value = this.parsePipe();
                obj[key] = value;
            }

            this.skipWhitespace();
            if (this.match('}')) { // 匹配到 }，对象结束
                break;
            }
            if (!this.match(',')) { // 没匹配到 } 但也没匹配到 , 说明语法错误
                throw new Error("Expected ',' or '}' in object literal");
            }
            // 如果匹配到 , 则继续循环解析下一个属性
        }
        return obj;
    }

    // 数组字面量，含展开
    parseArray() {
        if (!this.match('[')) throw new Error("Expected '[' to start array literal");
        const arr = [];
        this.skipWhitespace(); // 先跳过 [ 后的所有空白

        // 如果紧跟着就是 ]，说明是空数组
        if (this.match(']')) {
            return arr;
        }

        while (true) {
            this.skipWhitespace();

            if (this.match('...')) {
                const spreadValue = this.parsePipe();
                if (!Array.isArray(spreadValue)) throw new Error("Spread operand in array must be an array");
                arr.push(...spreadValue);
            } else {
                arr.push(this.parsePipe());
            }

            this.skipWhitespace();
            if (this.match(']')) { // 匹配到 ]，数组结束
                break;
            }
            if (!this.match(',')) { // 没匹配到 ] 但也没匹配到 , 说明语法错误
                throw new Error("Expected ',' or ']' in array literal");
            }
            // 如果匹配到 , 则继续循环解析下一个元素
        }
        return arr;
    }

    // ... (The rest of the specialized parsers and executeMethod are unchanged)
    parseString() {
        const quote = this.consume();
        const start = this.pos;
        while (this.peek() !== quote && this.pos < this.expression.length) this.pos++;
        const value = this.expression.substring(start, this.pos);
        if (this.peek() !== quote) throw new Error("Unclosed string literal");
        this.consume();
        return value;
    }
    parseNumber() {
        const start = this.pos;
        while (/[0-9.]/.test(this.peek()) && this.pos < this.expression.length) this.pos++;
        return parseFloat(this.expression.substring(start, this.pos));
    }
    parseIdentifier(asString = false) {
        this.skipWhitespace();
        const start = this.pos;
        while (/[a-zA-Z0-9_]/.test(this.peek()) && this.pos < this.expression.length) this.pos++;
        const identifier = this.expression.substring(start, this.pos);
        if (start === this.pos) throw new Error("Expected an identifier");

        if (asString) return identifier;

        if (identifier === 'true') return true;
        if (identifier === 'false') return false;
        if (identifier === 'null') return null;

        // [FIX 1A] Check for global functions/objects first
        if (this.globals.hasOwnProperty(identifier)) {
            return this.globals[identifier];
        }

        return getValueByPath(this.context, identifier);
    }

    parseArguments() {
        // [FIX 2] Rewritten to handle multiple arguments including arrow functions
        const args = [];
        if (this.peek() === ')') {
            this.consume(); // consume ')'
            return args;
        }

        do {
            this.skipWhitespace();
            if (this.isArrowFunctionAhead()) {
                args.push(this.parseArrowFunction());
            } else {
                args.push(this.parsePipe());
            }
        } while (this.match(','));

        if (!this.match(')')) {
            throw new Error("Expected ')' or ',' in arguments list");
        }
        return args;
    }
    isArrowFunctionAhead() {
        const initialPos = this.pos;
        try {
            this.skipWhitespace();
            let tempPos = this.pos;
            if (this.expression[tempPos] === '(') {
                tempPos++;
                while (tempPos < this.expression.length && this.expression[tempPos] !== ')') tempPos++;
                if (this.expression[tempPos] === ')') tempPos++;
            } else if (/[a-zA-Z_]/.test(this.expression[tempPos])) {
                while (tempPos < this.expression.length && /[a-zA-Z0-9_]/.test(this.expression[tempPos])) tempPos++;
            }
            while (tempPos < this.expression.length && /\s/.test(this.expression[tempPos])) tempPos++;
            return this.expression.substring(tempPos, tempPos + 2) === '=>';
        } finally { }
        return false;
    }
    parseArrowFunction() {
        const params = [];
        this.skipWhitespace();
        if (this.match('(')) {
            if (this.peek() !== ')') {
                do { params.push(this.parseIdentifier(true)); } while (this.match(','));
            }
            if (!this.match(')')) throw new Error('Expected ) in arrow function parameters');
        } else { params.push(this.parseIdentifier(true)); }
        if (!this.match('=>')) throw new Error("Expected '=>' in arrow function");
        const bodyStart = this.pos;
        let parenCount = 0;
        let bodyEnd = bodyStart;
        while (bodyEnd < this.expression.length) {
            const char = this.expression[bodyEnd];
            if (['(', '[', '{'].includes(char)) parenCount++;
            else if ([')', ']', '}'].includes(char)) {
                if (parenCount === 0) break;
                parenCount--;
            } else if ((char === ',' || char === ')') && parenCount === 0) { break; }
            bodyEnd++;
        }
        const body = this.expression.substring(bodyStart, bodyEnd).trim();
        this.pos = bodyEnd;
        return { type: 'ArrowFunction', params, body };
    }
    getExecutableCallback(arrowFunc) {
        const { params, body } = arrowFunc;
        return (element, index, array) => {
            const loopContext = Object.create(this.context);
            if (params[0]) loopContext[params[0]] = element;
            if (params[1]) loopContext[params[1]] = index;
            if (params[2]) loopContext[params[2]] = array;
            const subParser = new Parser(body, loopContext, this.helpers);
            return subParser.parse();
        };
    }
    executeMethod(target, methodName, args) {
        if (target === undefined || target === null) {
            throw new Error(`Cannot call method '${methodName}' on ${target}.`);
        }

        // The hasArrowFunc check is only for our custom helpers or Array methods
        const hasArrowFunc = args.length > 0 && args[0] && args[0].type === 'ArrowFunction';

        // Helper check remains the same
        if (this.helpers && this.helpers.hasOwnProperty(methodName)) {
            const helperFunc = this.helpers[methodName];

            // 确保我们拿到的确实是个函数
            if (typeof helperFunc === 'function') {
                if (hasArrowFunc) {
                    const executableCallback = this.getExecutableCallback(args[0]);
                    return helperFunc(target, executableCallback, ...args.slice(1));
                } else {
                    return helperFunc(target, ...args);
                }
            }
        }

        // [FIX] The security and type check now operates on the retrieved `method` variable.
        if (!this.allowedMethods.includes(methodName)) {
            throw new Error(`Unsupported or invalid method: '${methodName}'`);
        }

        const method = target[methodName];

        if (typeof method !== 'function') {
            throw new Error(`'${methodName}' is not a function on the target.`);
        }

        if (hasArrowFunc) {
            const executableCallback = this.getExecutableCallback(args[0]);
            // [FIX] Use .call() to set the correct `this` context (the primitive value)
            return method.call(target, executableCallback, ...args.slice(1));
        } else {
            // [FIX] Use .apply() to set the correct `this` context and pass arguments.
            // This is more robust than the spread operator for all cases.
            return method.apply(target, args);
        }
    }
}

const defaultHelpers = {
    // 返回一个排序后的新数组
    sort: (arr, callback) => {
        if (!Array.isArray(arr)) return arr;
        // 使用 slice() 创建一个浅拷贝，然后排序
        return [...arr].sort(callback);
    },
    // 返回一个反转后的新数组
    reverse: arr => {
        if (!Array.isArray(arr)) return arr;
        return [...arr].reverse();
    }
    // 注意：我们不提供 push, pop 等的 helper 版本，因为这些操作
    // 的意图就是修改，与我们“只读计算”的目标不符。
};

function expressionTool(template, context, customHelpers = {}) {
    // 1. 基本的提前退出，保持不变
    if (typeof template !== 'string' || !template.includes('{{')) {
        return template;
    }

    const allHelpers = { ...defaultHelpers, ...customHelpers };
    const interpolationRegex = /\{\{\s*(.+?)\s*\}\}/g;
    // 2. [核心改造] 使用 matchAll 获取所有匹配项，并转换为数组
    const allMatches = [...template.matchAll(interpolationRegex)];

    // 如果没有找到任何匹配项，直接返回模板
    if (allMatches.length === 0) {
        return template;
    }

    // 3. [核心改造] 通过逻辑判断是否为“纯表达式”
    // 条件：只有一个匹配项，并且该匹配项占据了整个（修剪过的）字符串
    if (allMatches.length === 1 && allMatches[0][0].trim() === template.trim()) {
        const expression = allMatches[0][1]; // 提取括号内的表达式内容
        try {
            const parser = new Parser(expression.trim(), context, allHelpers);
            // 直接返回解析器的原始结果，不进行字符串转换
            return parser.parse();
        } catch (error) {
            console.error(`Error parsing pure expression: "${expression}"`, error);
            return undefined; // 或 null，表示解析失败
        }
    }

    // 4. [核心] 如果是混合字符串，则执行替换和拼接逻辑
    return template.replace(interpolationRegex, (match, expression) => {
        try {
            const parser = new Parser(expression.trim(), context, allHelpers);
            const result = parser.parse();

            // 在拼接前，对 null 和 undefined 进行处理，避免输出 "null" 或 "undefined"
            if (result === null || result === undefined) {
                return '';
            }

            // 如果结果是对象或数组，在拼接时进行字符串化
            if (typeof result === 'object') {
                return JSON.stringify(result);
            }

            return String(result);
        } catch (error) {
            console.error(`Error parsing interpolated expression: "${expression}"`, error);
            return match; // 解析失败时，返回原始的 {{...}} 占位符
        }
    });
}

export { expressionTool }
