class CSymbol { //Constant symbol
  constructor(symb) {
    this.symb = symb; //Currently only "0" used
  }
}

class Phi{
  /*
  Phi with sub=a and arg=b is Veblen phi(a,b) (not Rathjen's capital Phi function)
  typeof sub is Term
  typeof arg is Term*/
  constructor(sub, arg){
    this.sub = sub;
    this.arg = arg;
  }
  static equ(a, b){ //TODO: Change this to "practical equality" (e.g. f(0,f(1,0)) == f(1,0))
    if(Term.lss(a.sub, b.sub) && !a.arg.isFixedPoint(a.sub)){ //If alpha<gamma and beta not a fixed point of phi_alpha, then phi_alpha(beta) != phi_gamma(delta), since ran(phi_gamma) consists only of f.p.s of phi_alpha
      return false;
    }
    if(Term.equ(a.sub, b.sub) && !Term.equ(a.arg, b.arg)){ //If alpha=gamma and beta != delta, then phi_alpha(beta) != phi_gamma(delta), by injectivity
      return false;
    }
  }
  static lss(a, b){//Currently inaccurate for f(0,f(1,0)) vs f(1,0). The bug is that VNFTerm.equ is not "practical equality", but string equality
    if(Phi.lss(a.sub, b.sub)){
      return Phi.lss(a.arg, b);
    }else if(Phi.equ(a.sub, b.sub)){
      return Phi.lss(a.arg, b.arg);
    }else{ //asub > bsub
      return !(Phi.equ(a, b) || Phi.lss(b, a));
    }
  }
  isFixedPoint(a){ //Is this a fixed point of phi_a?
    return Phi.lss(a, this.sub) || this.arg.isFixedPoint(a);
  }
  isStd(){ //Tentative standardness algorithm
    return VNFTerm.lss(this.args[0], this) && VNFTerm.lss(this.args[1], this); //From https://googology.fandom.com/wiki/List_of_systems_of_fundamental_sequences#Veblen_Normal_Form
  }
  /*static parseToTerm(str) {
    /*Parses string to VNFTerm, looking for these tokens:
    0 - becomes CSymbol {func: '0'}
    f(a,b) - becomes Term {func: "phi", args: [a,b]}
    a+b+...+z (expanded greedily) - becomes CSymbol {type: "sum", arg: [a,b,...,z]}
    Will throw error for any string with balanced parentheses, since only the outermost pair of parentheses is removed at each step of recursion
    * /
    if (str == "0") {
      return new CSymbol('0');
    } else if (hasCharOnBaseLevel(str, '+')) { //Sum
      var summands = splitOnBaseChars(str, '+');
      return new VNFTerm("sum", summands.map(VNFTerm.parseToTerm));
    } else if (str.slice(0, 2) == "f(" && str[str.length - 1] == ")" && splitOnCharAtGivenDepth(str, ',', 1).length == 2) { //phi(a,b), with two arguments separated by comma
      var argument = str.slice(2, -1);
      var args = splitOnBaseChars(argument, ',');
      return new VNFTerm("phi", args.map(VNFTerm.parseToTerm));
    } else {
      throw "Invalid term";
    }
  }*/
}

/*class MultLambdaExp{ //A single "a*Lambda^b", a intended to be <Lambda
  //Not sure how to make it so that CSymbol not a sybtype of this, but this is a subtype of Term
  constructor(coeff, exp){
    /*typeof coeff is LCNFTerm
    typeof exp is LCNFTerm* /
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
    All summands are >0* /
  constructor(func, arg) {
    /*typeof func is string
    typeof arg is either undefined or an array of MultLambdaExps* /
    super(func);
    this.arg = arg;
  }
  static equ(a, b) { //TODO: Change this to "practical equality"
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
    Will throw error for any string with unbalanced parentheses, since only the outermost pair of parentheses is removed at each step of recursion
    * /
    if (str == "0") {
      return new CSymbol('0');
    } else if (hasCharOnBaseLevel(str, '+')) { //Sum
      var summands = splitOnBaseChars(str, '+');
      return new LCNFTerm("sum", summands.map(LCNFTerm.parseToTerm));
    } else if (str.slice(0, 3) == "L^(" && str[str.length - 1] == ")") { //L^a, TODO: make this include the coefficients
      return new LCNFTerm("lexp", LCNFTerm.parseToTerm(str.slice(3, -1)));
    } else {
      throw "Invalid term";
    }
  }
}*/

function hasCharAtGivenDepth(str, char, givenDepth) { //Does char appear in str within pairs of parentheses to the given depth?
  //For example, hasCharAtGivenDepth("f(c+d,e+f(g,h))", "+", 1) is true, hasCharAtGivenDepth("f(c+d,e+f(g,h))", "+", 0) is false
  var depth = 0;
  for (var i = 0; i < str.length; i++) {
    if (str[i] == '(') {
      depth++;
    }
    if (str[i] == ')') {
      depth--;
    }
    if (str[i] == char && depth == givenDepth) {
      return true;
    }
  }
  return false;
}

function splitOnCharAtGivenDepth(str, char, givenDepth) { //Splits str on every instance of char that's at depth givenDepth in parentheses
  var pieces = [""];
  var depth = 0;
  for (var i = 0; i < str.length; i++) {
    if (str[i] == '(') {
      depth++;
    }
    if (str[i] == ')') {
      depth--;
    }
    if (str[i] == char && depth == givenDepth) {
      pieces.push("");
    } else { //Other characters fall into pieces
      pieces[pieces.length - 1] = pieces[pieces.length - 1] + str[i];
    }
  }
  return pieces;
}

function hasCharOnBaseLevel(str, char){ //Does char appear in str at the "base level", not enclosed in parentheses?
  return hasCharAtGivenDepth(str, char, 0);
}

function splitOnBaseChars(str, char){ //Splits str on instances of char at "base level"
  return splitOnCharAtGivenDepth(str, char, 0);
}

/*function testCNFStd() {
  var str = document.getElementById("testCNF").value;
  var term = LCNFTerm.parseToTerm(str);
  console.log(term);
  console.log(term.isStd());
}*/

function testVNFStd() {
  var str = document.getElementById("testVNF").value;
  var term = VNFTerm.parseToTerm(str);
  console.log(term);
  console.log(term.isStd());
}
