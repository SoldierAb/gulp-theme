const gulp = require('gulp'),
    scss = require('gulp-sass'),
    concat = require('gulp-concat'),
    cleanCss = require('gulp-clean-css'),
    header = require('gulp-header'),
    rename = require('gulp-rename'),
    sourcemaps = require('gulp-sourcemaps'),
    autoprefix = require('gulp-autoprefixer'),
    filter = require('gulp-filter'),
    gulpif = require('gulp-if'),
    inject = require('gulp-inject'),
    bSync = require('browser-sync'),
    fs = require("fs"),
    del = require('del'),
    argv = require('yargs').argv,
    theme = process.env.npm_config_theme || 'default',
    { theme: allTheme, 
        common: commonScss, 
        themeTagId ,
        buildModules,
        output
    } = require('./theme.config.js'),
    node_env = argv.env || 'development',
    scss_path = ['src/**/*.scss', '!node_modules'],
    output_path = 'dist',
    output_path_js = `${output_path}/js`,
    output_path_style = output.all,
    output_path_style_modules = output.modules,
    module_ext_name = `${node_env === 'production' ? '.min.css' : '.css'}`,
    concat_theme_name = (param) => `${param}${node_env === 'production' ? '.min' : ''}.css`;

const themeTask = async (done) => {
    const allTask = Object.keys(allTheme).map(item => {
        return scssTask(done, item);
    })
    const allFinshed = await Promise.all(allTask)
    console.log('themeTask done');
    injectTask(done);
    done()
}

const scssTask = (done, themeType = theme) => new Promise((resolve) => {
    bundleScss(themeType).on('end', () => {
        console.log(`${themeType} build finished `);
        resolve(true);
    })
})


const bundleScss = themeType => {
    return gulp.src([...scss_path, '!src/theme/*.scss'])
        .pipe(sourcemaps.init())
        .pipe(setGlobalScss(themeType))
        .pipe(scss().on('error', scss.logError))
        .pipe(gulpif(node_env === 'production', cleanCss())) // 仅在生产环境时候进行压缩
        .pipe(autoprefix())
        .pipe(rename((path) => {
            path.extname = module_ext_name
        }))
        .pipe(sourcemaps.write('./'))
        .pipe(gulp.dest(`${output_path_style_modules}/${themeType}`))
        .pipe(filter(`**/*.css`))   //合并过滤
        .pipe(concat(concat_theme_name(themeType)))
        .pipe(sourcemaps.write('./'))
        .pipe(gulp.dest(output_path_style))

}

// scss 全局变量注入
const setGlobalScss = (themeType) => {
    const resDefault = fs.readFileSync(`./src/theme/${themeType}.scss`).toString(),
        resCommon = Array.isArray(commonScss) ? commonScss.map(commonPath => {
            return fs.readFileSync(commonPath).toString()
        }).join(" \n ") : fs.readFileSync(commonScss).toString(),
        scssString = resCommon + " \n " + resDefault;
    return header(scssString);
}

const watchPipe = done => {
    const watcher = gulp.watch(scss_path);
    watcher.on("change", gulp.series('clean', 'scss'))
    watcher.on("add", gulp.series('clean', 'scss'))
    watcher.on("unlink", gulp.series('clean', 'scss'))
    // gulp.watch([`${output_path}/**/*`, `!${output_path}/**/*.html`], gulp.parallel('html'))
    done()
}

const cleanFiles = () => {
    return del(output_path_style, { read: false })
}

const server = done => {
    bSync({
        server: {
            baseDir: [output_path, './']
        }
    })
    done()
}

const injectTask = done => {
    console.log('inject');
    const target = gulp.src('./public/index.html'),
        source = gulp.src([`${output_path}/**/*.js`, `${output_path_style}/${concat_theme_name(theme)}`, `!${output_path_style_modules}/**/*.css`], { read: false });

    return target.pipe(
        inject(source, {
            transform: function (filepath) {
                if (filepath.includes(`${theme}.css`)) {
                    return `<link id="${themeTagId}"  rel="stylesheet" type="text/css" href="${filepath}"></link>`
                }
                // Use the default transform as fallback:
                return inject.transform.apply(inject.transform, arguments);
            }
        }, { relative: true })
    ).pipe(gulp.dest(output_path))
        .pipe(bSync.reload({
            stream: true
        }))
    done()
}

const jsTask = (done) => {
    gulp.src(`./src/**/*.js`)
        .pipe(gulp.dest(output_path_js))
    done();
}



gulp.task('clean', cleanFiles)
gulp.task('watch', watchPipe)
// gulp.task('scss', scssTask)
gulp.task('scss', themeTask)
gulp.task('js', jsTask)
gulp.task('html', injectTask)
gulp.task('server', server)
gulp.task('default', gulp.series('clean', gulp.parallel('scss', 'js'), 'watch', 'server'))
gulp.task('hot-build', gulp.series('clean', gulp.parallel('scss', 'js'), 'watch'))
gulp.task('build', gulp.series('clean', gulp.parallel('scss', 'js')))
