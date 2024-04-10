import GenderShape from "./shapeClasses";

export default class DotManager {
  arr: GenderShape[] = [];
  numWanted: number | undefined;

  constructor(numWanted?: number) {
    if (numWanted) {
      this.numWanted = numWanted;
      this.initDots();
    }
  }

  initDots() {
    for (let i = 0; i < this.numWanted!; i++) {
      const shape = new GenderShape({ dotManager: this });
      this.arr.push(shape);
      // this.quadTree?.insert(shape.shape)
    }
  }

  remove(shape: GenderShape) {
    const index = this.arr.indexOf(shape);
    this.arr[index].shape.remove();
    this.arr.splice(index, 1);
  }

  update() {
    for (const dot of this.arr) {
      dot.run();
    }
  }
}
