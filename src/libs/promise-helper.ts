export class PromiseHelper {
    /**
     * This method returns a promise that resolves to the result of an asynchronous operation without using callback
     * @returns
     * @example
     * const {resolve, reject, result} = PromiseHelper.getPromise<MyCustomType>();
     * if(success) resolve(mycustomValue);
     * else reject('error');
     * await result;
     */
    static getPromise<T>(): { result: Promise<T>, resolve: (value: T) => void, reject: (reason?: any) => void } {
        let resolve: (value: T) => void = () => { };
        let reject: (reason?: any) => void = () => { };
        const result = new Promise<T>((r, j) => {
            resolve = r;
            reject = j;
        });
        return { result, resolve, reject };
    }
}
