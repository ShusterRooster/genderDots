import paper from "paper";
import GenderShape from "./shapeClasses.js";

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

    console.log(`dotManager: ${this.arr}`);
  }

  //TODO get placing objects by distance working??
  sortByDist() {
    this.arr.sort((a, b) =>
      a.distance < b.distance ? -1 : a.distance > b.distance ? 1 : 0
    );

    //run each dot once so they have a shape
    for (let i = 0; i < this.arr.length; i++) {
      this.arr[i].run();
    }

    for (let i = this.arr.length; i > 0; i--) {
      this.arr[i].shape.sendToBack();
    }

    console.log(this.arr);
  }

  get other() {
    return this.arr[Math.floor(Math.random() * this.arr.length)];
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
