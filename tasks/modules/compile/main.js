//External modules
var path = require('path');

// Module Compile
exports.init = function(grunt){
    return {
        name: path.basename(__dirname),
        run: function(){
            var configuration = {};

            // Load default configuration
            if(grunt.file.exists(__dirname + path.sep + "config" + path.sep + "default.json")){
                try{
                    configuration = grunt.file.readJSON(__dirname + path.sep + "config" + path.sep + "default.json");
                    grunt.log.debug(this.name + " plugin default configuration is loaded!");
                }catch(ex){
                    grunt.log.error("[ERROR] " + this.name + " plugin default configuration has error!");
                    configuration = {};
                }
            }

            // Load user created configuration
            if(grunt.file.exists(process.cwd() + path.sep + "config" + path.sep + "build" + path.sep + this.name + ".js")){
                var config = require(process.cwd() + path.sep + "config" + path.sep + "build" + path.sep + this.name + ".js")(grunt);

                //Parsing configuration
                configuration = this.mergeObjects(configuration, this.parse(config));
            }else{
                grunt.log.debug(this.name + " user configuration not found, continue");
            }

            // For Debug ->
            grunt.log.debug(configuration);

            // Setting configuration
            grunt.config.set("typescript", configuration);
            this.loadPlugin("grunt-typescript");

            grunt.task.run("typescript");
        },
        loadPlugin: function(pluginName){
            var cwd = process.cwd();
            process.chdir(this.modulePath);
            grunt.loadNpmTasks(pluginName);
            process.chdir(cwd);
        },
        parse: function(configuration){
            // Parsing
            if(configuration.hasOwnProperty("source")){
                configuration.src = process.cwd() + path.sep + path.normalize(configuration.source) + path.sep + "**" + path.sep + "*.ts";
                delete configuration.source;
            }
            if(configuration.hasOwnProperty("target")){
                configuration.dest = process.cwd() + path.sep + path.normalize(configuration.target);
                delete configuration.target;
            }
            if(configuration.hasOwnProperty("version")){
                if(configuration.hasOwnProperty("options")){
                    configuration.options.target = configuration.version;
                }else{
                    configuration.options = {target: configuration.version};
                }
                delete configuration.version;
            }

            // Fix for TypeScript
            return {
                base: configuration
            };
        },
        mergeObjects: function(){
            if(arguments.length > 1){
                var destination = arguments[0];
                for(var i = 1; i < arguments.length; i++){
                    var source = arguments[i];
                    for (var property in source){
                        if(grunt.util.kindOf(destination[property]) == "object" && grunt.util.kindOf(source[property]) == "object") {
                            destination[property] = destination[property] || {};
                            arguments.callee(destination[property], source[property]);
                        } else {
                            destination[property] = source[property];
                        }
                    }
                    return destination;
                }
            }
            return destination[0] || {};
        }
    }
};