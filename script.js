class CSymbol { //Constant symbol
  constructor(func) {
    this.func = func; //Func is the symbol, like a 0-ary function symbol
  }
}

class LCNFTerm extends CSymbol { //Base-Lambda CNF
  constructor(func, arg) {
    super(func);
    this.arg = arg;
  }
  static equ(a, b) {
    return JSON.stringify(a) == JSON.stringify(b);
  }
  static lss(a, b) {
    //TODO: Redo so that there are coefficients <Lambda rather than using finite sums
    switch (a.func) {
      case "0":
        return b.func != "0";
      case "sum":
        switch (b.func) {
          case "0":
            for (var i = 0; i < a.arg.length; i++) {
              if (b.func != "0") {
                return true;
              }
            }
            return false;
          case "sum":
            var i = 0;
            while (i < Math.min(a.arg.length, b.arg.length)) {
              if (LCNFTerm.lss(a.arg[i], b.arg[i])) {
                return true;
              } else if (LCNFTerm.lss(b.arg[i], a.arg[i])) {
                return false;
              }
              if (i == a.arg.length && a.arg.length < b.arg.length) { //a ran out before b
                return true;
              } else if (i == b.arg.length && b.arg.length < a.arg.length) { //b ran out before a
                return false;
              }
              i++;
            }
            return false;
          case "lexp": //Lambda exponent
            if (a.arg.length == 1) {
              return LCNFTerm.lss(a.arg[0], b);
            } else {
              for (var i = 0; i < a.arg.length; i++) {
                if (!LCNFTerm.lss(a.arg[i], b)) { //If a has a summand that is >=b
                  return false;
                }
              }
              return true;
            }
        }
      case "lexp":
        switch (b.func) {
          case "0":
          case "sum":
            return !LCNFTerm.equ(a, b) && !LCNFTerm.lss(b, a);
          case "wexp":
            return LCNFTerm.lss(a.arg, b.arg);
        }
    }
  }
  isStd() {
    switch (this.func) {
      case "0":
        return true;
      case "sum":
        if (this.arg.length < 2) { //Sum with fewer than two summands
          return false;
        }
        for (var i = 0; i < this.arg.length; i++) { //Summands in non-strictly descending order, all summands are wexps
          if (this.arg[i].func != "wexp") {
            return false;
          }
          if (i > 0 && LCNFTerm.lss(this.arg[i - 1], this.arg[i])) {
            return false;
          }
        }
        return true;
      case "lexp":
        return this.arg.isStd();
    }
  }
  static parseToTerm(str) {
    /*Parses string to CNFTerm, looking for these tokens:
    0 - becomes CSymbol {func: '0'}
    L^(a) - becomes Term {func: "lexp", arg: a}
    a+b+...+z (expanded greedily) - becomes CSymbol {type: "sum", arg: [a,b,...,z]}
    Will throw error for any string with balanced parentheses, since only the outermost pair of parentheses is removed at each step of recursion
    */
    if (str == "0") {
      return new CSymbol('0');
    } else if (hasPlusOnBaseLevel(str)) { //Sum
      var summands = splitOnBasePluses(str);
      return new LCNFTerm("sum", summands.map(LCNFTerm.parseToTerm));
    } else if (str.slice(0, 3) == "L^(" && str[str.length - 1] == ")") { //w^a
      return new LCNFTerm("lexp", LCNFTerm.parseToTerm(str.slice(3, -1)));
    } else {
      throw "Invalid term";
    }
  }
}

function hasPlusOnBaseLevel(str) { //Is there a '+' on the "base level" of str, not enclosed in any pairs of parentheses?
  var depth = 0;
  for (var i = 0; i < str.length; i++) {
    if (str[i] == '(') {
      depth++;
    }
    if (str[i] == ')') {
      depth--;
    }
    if (str[i] == '+' && depth == 0) {
      return true;
    }
  }
  return false;
}

function splitOnBasePluses(str) { //Returns array of pieces of str split on base-level pluses
  var pieces = [""];
  var depth = 0;
  for (var i = 0; i < str.length; i++) {
    if (str[i] == '(') {
      depth++;
    }
    if (str[i] == ')') {
      depth--;
    }
    if (str[i] == '+' && depth == 0) {
      pieces.push("");
    } else { //Other characters fall into pieces
      pieces[pieces.length - 1] = pieces[pieces.length - 1] + str[i];
    }
  }
  return pieces;
}

function testcnfstd() {
  var str = document.getElementById("testcnf").value;
  var term = LCNFTerm.parseToTerm(str);
  console.log(term);
  console.log(term.isStd());
}
