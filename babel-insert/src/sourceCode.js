/*
 * @Descripttion: 
 * @Author: wayde
 * @Date: 2023-01-11 10:04:28
 */
console.log(1);

function func() {
    console.info(2);
}

export default class Clazz {
    say() {
        console.debug(3);
    }
    render() {
        return <div>{console.error(4)}</div>
    }
}
