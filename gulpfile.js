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
    node_env = argv.env || 'development',
    scss_path = ['src/**/*.scss', '!node_modules'],
    output_path = 'dist',
    output_path_style = `${output_path}/style`,
    output_path_style_modules = `${output_path_style}/modules/`,
    module_ext_name = `${node_env === 'production' ? '.min.css' : '.css'}`,
    concat_theme_name = `${theme}${node_env === 'production' ? '.min' : ''}.css`;

const scssTask = done => {
    gulp.src([...scss_path, '!src/theme/*.scss'])
        .pipe(sourcemaps.init())
        .on('error', scss.logError)//错误信息
        .pipe(setGlobalScss())
        .pipe(scss())
        .pipe(gulpif(node_env === 'production', cleanCss())) // 仅在生产环境时候进行压缩
        .pipe(autoprefix())
        .pipe(rename((path) => {
            path.extname = module_ext_name
        }))
        .pipe(sourcemaps.write('./'))
        .pipe(gulp.dest(output_path_style_modules))
        .pipe(filter(`**/*.css`))   //合并过滤
        .pipe(concat(concat_theme_name))
        .pipe(sourcemaps.write('./'))
        .pipe(gulp.dest(output_path_style))
        .pipe(bSync.reload({
            stream: true
        }))
    done()
}

// scss 全局变量注入
const setGlobalScss = () => {
    const resDefault = fs.readFileSync(`./src/theme/${theme}.scss`),
        resCommon = fs.readFileSync('./src/theme/common.scss'),
        scssString = resCommon.toString() + " \n " + resDefault.toString();
    return header(scssString);
}

const watchPipe = done => {
    const watcher = gulp.watch(scss_path);
    watcher.on("change", gulp.series('clean', 'scss'))
    watcher.on("add", gulp.series('clean', 'scss'))
    watcher.on("unlink", gulp.series('clean', 'scss'))
    done()
}

const cleanFiles = () => {
    return del(output_path_style, { read: false })
}

const server = (done) => {
    bSync({
        server: {
            baseDir: 'dist'
        }
    })
    done()
}

const injectTask = () => {
    const target = gulp.src('./public/index.html'),
        source = gulp.src('./src/index.js', { read: false });
    // .pipe(
    //     inject(
    //         gulp.src(`${output_path_style}/${concat_theme_name}`, { read: false }),
    //         { starttag: '<!-- inject:head:{{ext}} -->' }
    //     )
    // )
    return target.pipe(inject(source, { relative: true }))
        .pipe(gulp.dest(output_path));
}

gulp.task('clean', cleanFiles)
gulp.task('watch', watchPipe)
gulp.task('scss', scssTask)
gulp.task('html', injectTask)
gulp.task('server', server)
gulp.task('default', gulp.series('clean', gulp.parallel('scss'), 'html', 'server', 'watch'))
