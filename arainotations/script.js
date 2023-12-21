class CSymbol { //Constant symbol
  constructor(func) {
    this.func = func; //Func is the symbol, like a 0-ary function symbol. Currently only "0" used
  }
}

class MultLambdaExp{ //A single "a*Lambda^b", a intended to be <base
  //Not sure how to make it so that CSymbol not a sybtype of this, but this is a subtype of Term
  constructor(coeff, exp){
    /*typeof coeff is LCNFTerm
    typeof exp is LCNFTerm*/
    this.coeff = coeff;
    this.exp = exp;
  }
  static equ(a, b){
    return JSON.stringify(a) == JSON.stringify(b);
  }
  static lss(a, b){
    return LCNFTerm.lss(a.exp, b.exp) || (LCNFTerm.equ(a.exp, b.exp) && LCNFTerm.lss(a.coeff, b.coeff));
  }
}

class LCNFTerm extends CSymbol { //Base-Lambda CNF, an array of MultLambdaExp's.
  /*Note that implementation of "0" is rolled into MultLambdaExp (i.e. to use 0 in a hereditary LCNF representation, e.g. as in 3*L^(0*L^0)), use a MultLambdaExp as in 0*^L^0 or similar.
    Assumptions:
    Bases of any MultLambdaExp's appearing in this.arg match
    All summands are >0*/
  constructor(func, arg) {
    super(func);
    this.arg = arg;
  }
  static equ(a, b) {
    return JSON.stringify(a) == JSON.stringify(b);
  }
  static lss(a, b) {
    //Lexicographical comparison
    for(var i = 0; i < a.args.length; i++){
      if(i > b.args.length){
        return false;
      }
      if(MultLambdaExp.lss(a.args[i], b.args[i])){
        return true;
      }else{
        return false;
      }
    }
    return false; //Equal
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

class VNFTerm extends CSymbol{
  /* func is "0", "sum", or "phi"
  args is array of Terms */
  constructor(func, args){
    this.func = func;
    this.args = args;
  }
  static equ(a, b){
    return JSON.stringify(a) == JSON.stringify(b);
  }
  static lss(a, b){
    switch(a.func){
      case "0":
        return b.func != "0";
        break;
      case "sum":
        switch(b.func){
          case "0":
            return false; //a's summands assumed to be >0
            break;
          case "sum":
            for(var i = 0; i<a.args.length; i++){
              if(VNFTerm.lss(a.args[i], b.args[i]){
                return true;
              }else if(VNFTerm.lss(b.args[i], a.args[i]){
                return false;
              }
              if(i == a.args.length-1 && a.args.length < b.args.length){ //a ran out of addends
                return true;
              }
            }
            return false; //Equal
          case "phi":
            for(var i = 0; i<a.args.length; i++){
              if(!VNFTerm.lss(a.args[i], b)){
                return false;
              }
            }
            return true;
        }
        break;
      case "phi":
        switch(b.func){
          case "0":
          case "sum":
            return !(VNFTerm.equ(a, b) || VNFTerm.lss(a, b));
          case "phi":
            //TODO
            break;
        }
        break;
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
