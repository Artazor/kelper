/**
 * Created by pkotov on 29.01.2015.
 */

var path = require("path");
var runTask = require("grunt-run-task");

exports.init = function (grunt) {
    return {
        loadPlugin: function (pluginName) {
            var cwd = process.cwd();
            process.chdir(this.modulePath);
            if (grunt.hasOwnProperty("test") && grunt.test) {
                runTask.loadNpmTasks(pluginName);
            } else {
                grunt.loadNpmTasks(pluginName);
            }
            process.chdir(cwd);
        },
        runTask: function (pluginName, conf, subtask) {
            if (grunt.hasOwnProperty("test") && grunt.test) {
                if (grunt.util.kindOf(subtask) == "array") {
                    if (subtask.length > 0) {
                        var returned = {
                            tasks: [],
                            run: function (err) {
                                if (typeof err == "function") {
                                    try {
                                        this.tasks.forEach(function (task) {
                                            task.run(function (localErr) {
                                                if (localErr) {
                                                    throw new Error(localErr);
                                                }
                                            });
                                        });
                                    } catch (ex) {
                                        err.call(this, ex);
                                        return;
                                    }
                                    err.call();
                                }
                            }
                        };

                        var obj = this;
                        subtask.forEach(function (task) {
                            if (conf.hasOwnProperty(task) && conf[task]) {
                                returned.tasks.push(runTask.task(pluginName + ":" + task, conf));
                            }
                        });

                        return returned;
                    } else {
                        return runTask.task(pluginName);
                    }
                } else {
                    return runTask.task(pluginName + ":" + (subtask ? subtask : "default"), conf);
                }
            } else {
                grunt.config.set(pluginName, conf);
                grunt.task.run(pluginName);
            }
        },
        mergeObjects: function mergeObj() {
            if (arguments.length > 1) {
                var destination = arguments[0];
                for (var i = 1; i < arguments.length; i++) {
                    var source = arguments[i];
                    for (var property in source) {
                        if (grunt.util.kindOf(destination[property]) == "object" && grunt.util.kindOf(source[property]) == "object") {
                            destination[property] = destination[property] || {};
                            mergeObj(destination[property], source[property]);
                        } else {
                            destination[property] = source[property];
                        }
                    }
                }
                return destination;
            }
            return arguments[0] || {};
        },
        smartMerge: function mergeObj() {
            if (arguments.length > 1) {
                var destination = arguments[0];
                for (var i = 1; i < arguments.length; i++) {
                    var source = arguments[i];
                    for (var property in source) {
                        // Merge objects
                        if (grunt.util.kindOf(destination[property]) == "object" && grunt.util.kindOf(source[property]) == "object") {
                            destination[property] = destination[property] || {};
                            mergeObj(destination[property], source[property]);
                        } else if (grunt.util.kindOf(destination[property]) == "array" && grunt.util.kindOf(source[property]) == "array") {
                            destination[property] = destination[property].concat(source[property]);
                        } else {
                            destination[property] = source[property];
                        }
                    }
                }
                arguments[0] = destination;
                return true;
            }
            return arguments[0] || {};
        },
        makeClear: function (target) {
            if (grunt.file.isDir(target) || grunt.file.isFile(target)) {
                grunt.verbose.ok(path.relative(process.cwd(), target) + " has been deleted");
                grunt.file.delete(target, {force: true});
            }
        }
        ,
        registerTask: function (title, description, callback) {
            if (grunt.hasOwnProperty("test") && grunt.test) {
                return runTask.registerTask(title, description, callback);
            } else {
                return grunt.registerTask(title, description, callback);
            }
        }
    }
};