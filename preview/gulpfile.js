
'use strict';
var gulp  = require('gulp');
var browserify = require('gulp-browserify');
var concat = require('gulp-concat');

gulp.task('browserify', function () {
  gulp.src('./src/js/*')
    .pipe(concat('bundle.js'))
    .pipe(browserify())
    .pipe(gulp.dest('./public/js'))
})
gulp.watch('./src/js/*.js', ['browserify']);


gulp.task('default', ['browserify']);
