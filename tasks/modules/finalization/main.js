//External modules
var path = require('path');
var util = require("util");

// Module Compile
exports.init = function(grunt){
    module = require(path.dirname(__dirname) + path.sep + "default").init(grunt);

    util._extend(module, {
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

            this.makeClear(configuration.target);

            configuration.uglify = {
                options: this.environment.uglify || {}
            };

            // Step 1 = Uglify
            if(typeof this.environment.uglify != "undefined" || grunt.test){

                var fileList = {};

                // Parse libraries
                if(typeof this.environment.libraries != "undefined"){
                    if(grunt.util.kindOf(this.environment.libraries) == "array"){
                        this.environment.libraries.forEach(function(library){
                            if(typeof library == "object" && library.hasOwnProperty("name")){
                                fileList[path.resolve(process.cwd(), configuration.target, library.name, "main.js")] = path.resolve(process.cwd(), configuration.source, library.name, "main.js");
                            }
                        });
                    }else{
                        grunt.log.error("[ERROR] Unknown format of environment library, please fix it");
                    }
                }

                // Parse packages
                if(typeof this.environment.packages != "undefined"){
                    if(grunt.util.kindOf(this.environment.packages) == "array"){
                        this.environment.packages.forEach(function(pkg){
                            if(typeof pkg == "object" && pkg.hasOwnProperty("name")){
                                fileList[path.resolve(process.cwd(), configuration.target, pkg.name, "main.js")] = path.resolve(process.cwd(), configuration.source, pkg.name, "main.js");
                            }
                        });
                    }else{
                        grunt.log.error("[ERROR] Unknown format of environment package, please fix it");
                    }
                }

                configuration.uglify.minimize = {
                    files: fileList
                };
            }

            // Step 2 = Libs
            if(grunt.util.kindOf(this.environment.base) == "object"){

                var libs = {};
                libs[process.cwd() + path.sep + path.normalize(configuration.target) + path.sep + "base" + path.sep + "main.js"] = [];
                for(var lib in this.environment.base){
                    libs[path.resolve(process.cwd(), configuration.target, "base/main.js")].push(path.resolve(process.cwd(), this.environment.base[lib]) + ".js");
                }

                configuration.uglify.libs = {
                    files: libs
                };
            }

            // Step 3 = Resources
            if(grunt.util.kindOf(this.environment.resources) == "array" && typeof configuration.resourcePath != "undefined"){

                // Empty files
                configuration.copy = {
                    resources: {
                        files: []
                    }
                };

                // Adding files if needed
                this.environment.resources.forEach(function(resource){
                    configuration.copy.resources.files.push({
                        expand: true,
                        cwd: process.cwd() + path.sep + path.normalize(configuration.resourcePath) + path.sep + resource + path.sep,
                        src: ["*.*", "**/*.*"],
                        dest: process.cwd() + path.sep + path.normalize(configuration.target)
                    });
                });

                // Run Task
                this.loadPlugin("grunt-contrib-copy");
                this.runTask("copy", configuration.copy, "resources");
            }

            this.configuration = configuration;

            // Run uglify
            this.loadPlugin("grunt-contrib-uglify");
            return this.runTask("uglify", configuration.uglify, ["minimize", "libs"]);
        },
        parse: function(configuration){
            var parsed = {};

            // Parsing
            if(configuration.hasOwnProperty("source")){
                parsed.source = process.cwd() + path.sep + path.normalize(configuration.source);
            }
            if(configuration.hasOwnProperty("resourcePath")){
                parsed.resourcePath = process.cwd() + path.sep + path.normalize(configuration.resourcePath);
            }
            if(configuration.hasOwnProperty("target")){
                parsed.target = process.cwd() + path.sep + path.normalize(configuration.target);
            }

            // Fix for RequireJS
            return parsed;
        }
    });

    return module;
};