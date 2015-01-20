
'use strict';
var gulp  = require('gulp');
var browserify = require('gulp-browatchify');

gulp.task('browserify', function () {
  gulp.src('./src/js/*')
    .pipe(browserify())
    .pipe(gulp.dest('./public/js/bundle.js'))
})
gulp.watch('./src/js/*.js', ['browserify']);


gulp.task('default', ['browserify']);
