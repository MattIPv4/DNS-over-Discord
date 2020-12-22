module.exports = (str, size) => {
    const strArr = str.split('');
    let ret = [];
    while (strArr.length) ret.push(strArr.splice(0, size).join(''));
    return ret;
};
