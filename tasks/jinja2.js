/*
 * grunt-jinja2
 * https://github.com/hyspace/grunt-jinja2
 *
 * Copyright (c) 2013 shan zhou
 * Licensed under the MIT license.
 */

'use strict';

module.exports = function(grunt) {

  // Please see the Grunt documentation for more information regarding task
  // creation: http://gruntjs.com/creating-tasks
  var path = require('path');
  var jinja2ShellPath = 'bin/jinja2_shell.py'

  grunt.registerMultiTask('jinja2', 'render jinja2 template to html using original jinja2 (in python)', function() {
    // Merge task-specific and/or target-specific options with these defaults.
    var async = grunt.util.async;
    var done = this.async();

    var options = this.options({
      context_path:'context',
      template_path:'templates'
    });

    if(!grunt.file.exists(options.context_path)){
      grunt.log.warn('Context path "' + options.context_path + '" not found.');
    }
    if(!grunt.file.exists(options.template_path)){
      grunt.log.warn('Template path "' + options.template_path + '" not found.');
    }
    if (!/\/$/.test(options.template_path)) options.template_path += path.sep;
    if (!/\/$/.test(options.context_path)) options.context_path += path.sep;


    // Iterate over all specified file groups.
    var valid_files = this.files.filter(function(f) {
        // Warn on and remove invalid source files (if nonull was set).
        var filepath = f.src[0]
        if (!grunt.file.exists(filepath)) {
          grunt.log.warn('Source file "' + filepath + '" not found.');
          return false;
        } else if (filepath.indexOf(options.template_path)!==0) {
          grunt.log.warn('Source file "' + filepath + '" not in the template path.');
          return false;
        } else {
          return true;
        }
    });
    async.forEach(valid_files, function(f, cb) {
      //ignore multi src files
      var src = f.src[0];
      //get relative path
      var template_path = src.replace(options.template_path,'')
      //get context path form relative path
      var context_path = options.context_path + template_path.replace(/\.\w+$/,'.json')
      //test context file
      var use_context = grunt.file.exists(context_path) && grunt.file.readJSON(context_path)

      var args = ['-t', template_path, '-b', options.template_path]
      if (use_context){
        args.push('-d', context_path)
      }

      //run python command
      grunt.util.spawn({
          cmd: jinja2ShellPath,
          args: args
      }, function (error, result, code) {
        if (error) {
          grunt.log.warn('Error occured in rendering file "' + f.dest + '". message below:');
          return cb(error);
        }else if(result){
          grunt.file.write(f.dest, result.stdout);
          if(use_context){
            grunt.log.writeln('File "' + f.dest + '" created with context "' + context_path + '".');
          } else {
            grunt.log.writeln('File "' + f.dest + '" created without context.');
          }
          cb();
        }
      });

    },function(error) {
      done(!error);
    });
  });

};
