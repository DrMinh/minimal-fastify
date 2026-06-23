export class ExampleService {

    counter = 10;

    constructor() { }

    addCount() {
        return this.counter++;
    }
}