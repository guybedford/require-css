module.exports = function (cssStr, params) {
    console.log("Transforming css (len: {len}) with params"
        .replace('{len}', cssStr.length),
        params);
    return '/** @gobengo: I HAVE TRANSFORMED YOU **/\n'+cssStr;
};
