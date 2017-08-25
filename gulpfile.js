var gulp = require('gulp');

gulp.task('css', function(){
  return gulp.src(['dist/style.css', 'css/print.css'])
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

gulp.task('pack', [ 'css', 'svg', 'png', 'img', 'js', 'examples', 'data', 'root']);
