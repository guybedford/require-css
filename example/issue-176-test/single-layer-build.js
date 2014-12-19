({
    mainConfigFile: 'requireConfig.js',
    fileExclusionRegExp: /(^example)|(.git)$/,
    separateCSS: true,
    buildCSS: true,
    optimizeCss: "standard",

    name: 'main.js',
    out: 'main-out.js',
    config: {
        'css': {
            optimize: false
        }
    }
})
