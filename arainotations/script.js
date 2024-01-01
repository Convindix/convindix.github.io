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
    } else if (hasCharOnBaseLevel(str, '+')) { //Sum
      var summands = splitOnBaseChars(str, '+');
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
    super(func);
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
              if(VNFTerm.lss(a.args[i], b.args[i])){
                return true;
              }else if(VNFTerm.lss(b.args[i], a.args[i])){
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
            return !(VNFTerm.equ(a, b) || VNFTerm.lss(b, a));
          case "phi":
            var asub = a.args[0];
            var aarg = a.args[1];
            var bsub = b.args[0];
            var barg = b.args[1];
            if(VNFTerm.lss(asub, bsub)){
              return VNFTerm.lss(aarg, b);
            }else if(VNFTerm.equ(asub, bsub)){
              return VNFTerm.lss(aarg, barg);
            }else{ //asub > bsub
              return !(VNFTerm.equ(a, b) || VNFTerm.lss(b, a));
            }
            break;
        }
        break;
    }
  }
  static parseToTerm(str) {
    console.log(str);
    /*Parses string to VNFTerm, looking for these tokens:
    0 - becomes CSymbol {func: '0'}
    f(a,b) - becomes Term {func: "phi", args: [a,b]}
    a+b+...+z (expanded greedily) - becomes CSymbol {type: "sum", arg: [a,b,...,z]}
    Will throw error for any string with balanced parentheses, since only the outermost pair of parentheses is removed at each step of recursion
    */
    if (str == "0") {
      return new CSymbol('0');
    } else if (hasCharOnBaseLevel(str, '+')) { //Sum
      var summands = splitOnBaseChars(str, '+');
      return new VNFTerm("sum", summands.map(VNFTerm.parseToTerm));
    } else if (str.slice(0, 2) == "f(" && str[str.length - 1] == ")" && splitOnCharAtGivenDepth(str, ',', 1).length == 2) { //phi(a,b), with two arguments separated by comma
      var argument = str.slice(2, -1);
      var args = splitOnBaseChars(argument, ',');
      console.log(args);
      return new VNFTerm("phi", args.map(VNFTerm.parseToTerm));
    } else {
      throw "Invalid term";
    }
  }
  isStd(){ //Tentative standardness algorithm
    switch(this.func){
      case "0":
        return true;
      case "sum":
        //TODO: lexicographic check here
      case "phi":
        return VNFTerm.lss(a.args[0], a) && VNFTerm.lss(a.args[1], a); //From https://googology.fandom.com/wiki/List_of_systems_of_fundamental_sequences#Veblen_Normal_Form
    }
  }
}

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

function testCNFStd() {
  var str = document.getElementById("testCNF").value;
  var term = LCNFTerm.parseToTerm(str);
  console.log(term);
  console.log(term.isStd());
}

function testVNFStd() {
  var str = document.getElementById("testVNF").value;
  var term = VNFTerm.parseToTerm(str);
  console.log(term);
  console.log(term.isStd());
}
