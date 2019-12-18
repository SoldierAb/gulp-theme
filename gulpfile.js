const gulp = require('gulp'),
    scss = require('gulp-sass'),
    concat = require('gulp-concat'),
    cleanCss = require('gulp-clean-css'),
    header = require('gulp-header'),
    reanme = require('gulp-rename'),
    sourcemaps = require('gulp-sourcemaps'),
    autoprefix = require('gulp-autoprefixer'),
    fs = require("fs"),
    del = require('del'),
    theme = process.env.npm_config_theme || 'default',
    scss_path = ['src/**/*.scss', '!node_modules'],
    output_path = 'dist/';

const scssTask = () => {
    gulp.src([...scss_path, '!src/theme/*.scss'])
        .pipe(sourcemaps.init())
        .on('error', scss.logError)//错误信息
        .pipe(setGlobalScss())
        .pipe(scss())
        .pipe(cleanCss())
        .pipe(autoprefix())
        .pipe(reanme((path) => {
            return {
                dirname: path.dirname,
                basename: path.basename,
                suffix: '.min',
                extname: ".css"
            }
        }))
        .pipe(sourcemaps.write('.'))
        .pipe(gulp.dest(`${output_path}/style/modules/`))
        .pipe(concat(`${theme}.min.css`))
        .pipe(sourcemaps.write('.'))
        .pipe(gulp.dest(`${output_path}/style/`))
}

// scss 全局变量注入
const setGlobalScss = () => {
    const resDefault = fs.readFileSync(`./src/theme/${theme}.scss`),
        resCommon = fs.readFileSync('./src/theme/common.scss'),
        scssString = resCommon.toString() + " \n " + resDefault.toString();
    return header(scssString);
}

const watchPipe = () => {
    const watcher = gulp.watch(scss_path);
    watcher.on("change", gulp.series('clean', 'scss'))
    watcher.on("add", gulp.series('clean', 'scss'))
    watcher.on("unlink", gulp.series('clean', 'scss'))
    // watcher.on('unlink', function (path, stats) {
    //     console.log(`File ${path} was removed,${stats}`);
    //     scssTask()
    // });
}

const cleanFiles = () => {
    return del(output_path, { read: false })
}

gulp.task('clean', cleanFiles)
gulp.task('watch', watchPipe)
gulp.task('scss', scssTask)

gulp.task('default', gulp.series('clean', gulp.parallel('scss', 'watch')))
