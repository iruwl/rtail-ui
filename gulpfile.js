var gulp = require('gulp')
var nodemon = require('gulp-nodemon')
var sync = require('browser-sync').create()
var del = require('del')
var cssnano = require('gulp-cssnano')
var concat = require('gulp-concat')
var uglify = require('gulp-uglify')
var babel = require('gulp-babel');
var imagemin = require('gulp-imagemin')
var htmlmin = require('gulp-htmlmin')
var useref = require('gulp-useref')
var sourcemaps = require('gulp-sourcemaps');

// delete dist directory
async function deleteDist(cb) {
  await del(['dist'])
  cb()
}

// optimasi css
function cssOptimize() {
  return gulp.src('app/*.css')
    .pipe(concat('style.css'))
    .pipe(cssnano())
    .pipe(gulp.dest('dist/css'))
}

// menggabung semua file js dan optimasi
function jsOptimize() {
  return gulp.src('app/*.js')
    .pipe(concat('script.js'))
    .pipe(babel())
    .pipe(uglify())
    .pipe(gulp.dest('dist/js'))
}

// optimasi image
function imgOptimize() {
  return gulp.src('app/img/*')
    .pipe(imagemin())
    .pipe(gulp.dest('dist'))
}

// copy html
function copyHtml() {
  return gulp.src('app/*.html')
    .pipe(gulp.dest('dist'))
}

// useref and bundle css/js
function bundleCssJs() {
  return gulp.src('dist/*.html')
    // .pipe(useref())
    .pipe(useref({ searchPath: ['dist/css', 'dist/js', 'node_modules'] }))
    .pipe(gulp.dest('dist'))
}

function sourcemapsJs() {
  return gulp.src('dist/js/*.js')
    .pipe(sourcemaps.init())
    .pipe(uglify())
    .pipe(sourcemaps.write())
    .pipe(gulp.dest('dist/js'))
}

// optimasi html
function htmlOptimize() {
  return gulp.src('dist/*.html')
    .pipe(htmlmin({ collapseWhitespace: true }))
    .pipe(gulp.dest('dist'))
}

// =============================================================================

function serve(cb) {
  nodemon({
    script: 'bin/rtail-custom-server.js', //this is where my express server is
    args: ['--web-version', 'development'],
    ignore: ['app/', 'node_modules/'],
    ext: 'js html css', //nodemon watches *.js, *.html and *.css files
    env: {
      'NODE_ENV': 'development'
    },
  })
  cb()
}

function watch(cb) {
  sync.init({
    port: 3000, //this can be any port, it will show our app
    proxy: 'http://localhost:8080/', //this is the port where express server run
  })

  gulp.watch(['app/**/*',])
    .on('change', function (file) {
      console.log(file)
      sync.reload()
    })
  cb()
}

// =============================================================================

// 
function mytask(cb) {
  // task body
  // cb(new Error('Something bad has happened'))
  cb()
}

exports.mytask = mytask

exports.clean = deleteDist

exports.css = cssOptimize
exports.js = jsOptimize
exports.img = imgOptimize
exports.html = htmlOptimize

exports.build = gulp.series(
  deleteDist,
  gulp.parallel(
    cssOptimize,
    jsOptimize,
    // imgOptimize,
    copyHtml,
  ),
  bundleCssJs,
  sourcemapsJs,
  htmlOptimize,
)

exports.watch = watch
exports.serve = serve
exports.app = gulp.parallel(serve, watch)
