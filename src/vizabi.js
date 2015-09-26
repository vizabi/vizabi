class Test {
  constructor(name) {
    this.name = "name"
  }
  get name () {
    return this.name;
  }
}

var test = new Test("Testing");
console.log(test.name);