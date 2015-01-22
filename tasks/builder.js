module.exports = function(grunt){

    grunt.registerTask('builder', 'Build task', function(){
        var config = {};
        config.builder = grunt.config.get("builder");
        config.optiomization = grunt.config.get("builder");

        var cwd = process.cwd();

        if(typeof config.builder != "undefined"){
            if(typeof config.builder.requirejs != "undefined"){

                grunt.log.writeln("RequireJS -> Start");

                // Loading RequireJS if needed -> Start
                process.chdir(__dirname + "/../");
                grunt.loadNpmTasks("grunt-contrib-requirejs");
                process.chdir(cwd);
                // Loading -> End

                // Set configuration from config file
                grunt.config.set("requirejs", {
                    compile: {
                        options: grunt.file.readJSON(config.builder.requirejs)
                    }
                });

                // Run RequireJS
                grunt.task.run("requirejs");

                grunt.log.writeln("RequireJS -> Finished");

            }

        }

        if(typeof config.optiomization != "undefined"){

        }


        grunt.log.writeln(this.name + " is running");
    });

};