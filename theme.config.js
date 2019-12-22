module.exports = {
    common: './src/theme/common.scss',
    theme: {
        default: './src/theme/default.scss',
        light: './src/theme/light.scss',
        blue: './src/theme/blue.scss',
    },
    output:{
        all:'./dist/style',
    },
    themeTagId:'theme',
    injectHtml:'./public/index.html',
}