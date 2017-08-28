var browserify = require('browserify');
var sass = require('gulp-sass');
var gulp = require('gulp');
var jshint = require('gulp-jshint');
var source = require('vinyl-source-stream');
var buffer = require('vinyl-buffer');
var uglify = require('gulp-uglify');
var rename = require("gulp-rename");
var minifyCSS = require('gulp-csso');
var runSequence = require('run-sequence');

gulp.task('origo-debug', function () {
  var b = browserify({
    entries: 'origo.js',
    debug: true,
    standalone: 'origo'
  });

  return b.bundle()
    .pipe(source('origo.js'))
    .pipe(buffer())
    .pipe(jshint())
    .pipe(jshint.reporter('default'))
    .pipe(gulp.dest('./dist/'));
});

gulp.task('origo-min', function () {
  var b = browserify({
    entries: 'origo.js',
    debug: false,
    standalone: 'origo'
  });

  return b.bundle()
    .pipe(source('origo.js'))
    .pipe(buffer())
    .pipe(uglify({mangle: true}))
    .pipe(rename('origo.min.js'))
    .pipe(gulp.dest('./dist/'));
});

gulp.task('origo-js', [ 'origo-debug', 'origo-min']);

gulp.task('css-debug', function(){
  return gulp.src('scss/origo.scss')
    .pipe(sass())
    .pipe(rename('style.css'))
    .pipe(gulp.dest('dist'))
});

gulp.task('css-min', function(){
  return gulp.src('scss/origo.scss')
    .pipe(sass())
    .pipe(minifyCSS())
    .pipe(rename('style.min.css'))
    .pipe(gulp.dest('dist'))
});

gulp.task('origo-css', [ 'css-debug', 'css-min']);

gulp.task('css', function(){
  return gulp.src(['dist/style.css', 'dist/style.min.css', 'css/print.css'])
    .pipe(gulp.dest('build/css'))
});

gulp.task('svg', function(){
  return gulp.src('css/svg/*.svg')
    .pipe(gulp.dest('build/css/svg'))
});
gulp.task('png', function(){
  return gulp.src('css/png/*.png')
    .pipe(gulp.dest('build/css/png'))
});

gulp.task('img', function(){
  return gulp.src('img/**')
    .pipe(gulp.dest('build/img'))
});

gulp.task('js', function(){
  return gulp.src('dist/*.js')
    .pipe(gulp.dest('build/js'))
});

gulp.task('examples', function(){
  return gulp.src('examples/**')
    .pipe(gulp.dest('build/examples'))
});

gulp.task('data', function(){
  return gulp.src('data/*.*')
    .pipe(gulp.dest('build/data'))
});

gulp.task('root', function(){
  return gulp.src(['index.html', 'index.json'])
    .pipe(gulp.dest('build'))
});

gulp.task('pack', ['css', 'svg', 'png', 'img', 'js', 'examples', 'data', 'root']);

gulp.task('default', function(cb) {
  runSequence('origo-js', 'origo-css', 'pack');
});
