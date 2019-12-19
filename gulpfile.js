const gulp = require('gulp'),
    scss = require('gulp-sass'),
    concat = require('gulp-concat'),
    cleanCss = require('gulp-clean-css'),
    header = require('gulp-header'),
    rename = require('gulp-rename'),
    sourcemaps = require('gulp-sourcemaps'),
    autoprefix = require('gulp-autoprefixer'),
    gulpif = require('gulp-if'),
    fs = require("fs"),
    del = require('del'),
    // vinyl = require('vinyl'),
    // vinyl_paths = require('vinyl-paths'),
    filter = require('gulp-filter'),
    argv = require('yargs').argv,
    theme = process.env.npm_config_theme || 'default',
    node_env = argv.env || 'development',
    scss_path = ['src/**/*.scss', '!node_modules'],
    output_path = 'dist/',
    output_path_modules = `${output_path}/modules/`;


const scssTask = () => {
    gulp.src([...scss_path, '!src/theme/*.scss'])
        .pipe(sourcemaps.init())
        .on('error', scss.logError)//错误信息
        .pipe(setGlobalScss())
        .pipe(scss())
        .pipe(gulpif(node_env === 'production', cleanCss())) // 仅在生产环境时候进行压缩
        .pipe(autoprefix())
        .pipe(rename((path) => {
            path.extname = node_env === 'production' ? '.min.css' : '.css'
        }))
        .pipe(sourcemaps.write('./'))
        .pipe(gulp.dest(output_path_modules))
        .pipe(filter([output_path,`!${output_path}**/*.map`]))
        .pipe(concat(`${theme}-test${node_env === 'production' ? '.min' : ''}.css`))
        .pipe(sourcemaps.write('./'))
        .pipe(gulp.dest(output_path))
    // .pipe(vinyl_paths(async path=>{
    //     const file = new vinyl({path});
    //     console.log(path);
    //     if(file.extname === '.css'){
    //         gulp.src(path)
    //         .pipe(sourcemaps.init())
    //         .pipe(concat(`${theme}-test${node_env === 'production' ? '.min' : ''}.css`))
    //         .pipe(sourcemaps.write('./'))
    //         .pipe(gulp.dest(output_path))
    //     } 
    // }))

}


const cssTask = () => {
    gulp.src([...scss_path, '!src/theme/*.scss'])
        .pipe(sourcemaps.init())
        .on('error', scss.logError)//错误信息
        .pipe(setGlobalScss())
        .pipe(scss())
        .pipe(gulpif(node_env === 'production', cleanCss())) // 仅在生产环境时候进行压缩
        .pipe(autoprefix())
        .pipe(concat(`${theme}${node_env === 'production' ? '.min' : ''}.css`))
        .pipe(sourcemaps.write('./'))
        .pipe(gulp.dest(output_path))
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
    watcher.on("change", gulp.series('clean', gulp.parallel('scss', 'css')))
    watcher.on("add", gulp.series('clean', gulp.parallel('scss', 'css')))
    watcher.on("unlink", gulp.series('clean', gulp.parallel('scss', 'css')))
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
gulp.task('css', cssTask)

gulp.task('default', gulp.series('clean', gulp.parallel('scss', 'css', 'watch')))