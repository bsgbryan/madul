const gulp = require('gulp');
const del = require('del');
const conf = require('../gulp-conf/base');

gulp.task('clean', function doDel() {
  return del([conf.paths.tmp, conf.paths.dist]);
});
