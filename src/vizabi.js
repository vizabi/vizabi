class Test {
  constructor(name) {
    this.name = name;
  }
  get name() {
    return this.name;
  }
}

const test = new Test('Testing');
document.write(test.name);
