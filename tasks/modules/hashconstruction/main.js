//External modules
var path = require('path');
var util = require("util");
var crypt = require("crypto");
var fs = require('fs');

// Module Compile
exports.init = function(grunt){
    var configuration = {};
    module = require(path.dirname(__dirname) + path.sep + "default").init(grunt);

    module.registerTask('hashconstruction', 'Build task', function(){
        if(typeof module.environment.hash != "undefined"){
            configuration.hash = module.environment.hash;
            if(crypt.getHashes().indexOf(configuration.hash) < 0){
                grunt.fail.fatal("[ERROR] There is no '" + configuration.hash + "' method");
            }
        }

        if(module.generateAppNoCache()){
            grunt.log.ok("Files are hashed");
        }
    });

    util._extend(module, {
        name: path.basename(__dirname),
        run: function(){

            // Load default configuration of Hash contructor
            if(grunt.file.exists(__dirname + path.sep + "config" + path.sep + "default.json")){
                try{
                    configuration = grunt.file.readJSON(__dirname + path.sep + "config" + path.sep + "default.json");
                    grunt.log.debug(this.name + " plugin default configuration is loaded!");
                }catch(ex){
                    grunt.log.error("[ERROR] " + this.name + " plugin default configuration has error!");
                    configuration = {};
                }
            }

            this.configuration = configuration;
            configuration = this.mergeObjects(configuration, this.lastConfigurations.finalization);

            return this.runTask("hashconstruction", {default: {}}, []);
        },
        makeLibraries: function(){
            var libraries = {};

            // Make Libraries
            if(grunt.util.kindOf(this.environment.libraries) == "array"){
                this.environment.libraries.forEach(function(library){
                    if(typeof library == "object" && library.hasOwnProperty("name")){
                        var hash = crypt.createHash(configuration.hash);
                        hash.update(fs.readFileSync(path.resolve(process.cwd(), configuration.target, library.name, "main.js")));
                        libraries[library.name] = hash.digest("hex");
                        fs.renameSync(path.resolve(process.cwd(), configuration.target, library.name, "main.js"), path.resolve(process.cwd(), configuration.target, library.name, libraries[library.name] + ".js"));

                    }else{
                        grunt.log.error("[ERROR] Unknown format of environment library, please fix it");
                    }
                });
            }

            // Make Packages
            if(grunt.util.kindOf(this.environment.packages) == "array"){
                this.environment.packages.forEach(function(pkg){
                    if(typeof pkg == "object" && pkg.hasOwnProperty("name")){
                        var hash = crypt.createHash(configuration.hash);
                        hash.update(fs.readFileSync(path.resolve(process.cwd(), configuration.target, pkg.name, "main.js")));
                        libraries[pkg.name] = hash.digest("hex");
                        fs.renameSync(path.resolve(process.cwd(), configuration.target, pkg.name, "main.js"), path.resolve(process.cwd(), configuration.target, pkg.name, libraries[pkg.name] + ".js"));
                    }else{
                        grunt.log.error("[ERROR] Unknown format of environment package, please fix it");
                    }
                });
            }

            return libraries;
        },
        makeLibs: function(){
            if(grunt.file.exists(process.cwd() + path.sep + configuration.target + path.sep + "base" + path.sep + "/main.js")){
                var hash = crypt.createHash(configuration.hash);
                hash.update(fs.readFileSync(path.resolve(process.cwd(), configuration.target, "base", "main.js")));
                hash = hash.digest("hex");
                fs.renameSync(path.resolve(process.cwd(), configuration.target, "base", "main.js"), path.resolve(process.cwd(), configuration.target, "base", hash + ".js"));
                return hash;
            }
            return null;
        },
        generateAppNoCache: function(){
            var libraries = this.makeLibraries();
            var libs = this.makeLibs();

            // Gettings path
            var filePath = path.resolve(process.cwd(), configuration.target, "app.nocache.js");
            var fileText = "window.require = window.require || {};\n";

            var libPackages = [];
            var staticPackages = [];
            var packageConfig = [];

            // Parse Libraries
            if(grunt.util.kindOf(this.environment.libraries) == "array" && this.environment.libraries.length > 0){
                this.environment.libraries.forEach(function(library){
                    libPackages.push({
                        name: library.name,
                        main: libraries[library.name]
                    });

                    if(grunt.util.kindOf(library.packages) == "array" && library.packages.length > 0){
                        library.packages.forEach(function(pkg){
                            if(pkg.hasOwnProperty("config")){
                                packageConfig.push({
                                    name: pkg.name + "/main",
                                    config: pkg.config
                                });
                            }
                        });
                    }
                });
            }

            // Parse packages
            if(grunt.util.kindOf(this.environment.packages) == "array" && this.environment.packages.length > 0){
                this.environment.packages.forEach(function(pkg){
                    staticPackages.push({
                        name: pkg.name,
                        main: libraries[pkg.name]
                    });

                    if(pkg.hasOwnProperty("config")){
                        packageConfig.push({
                            name: pkg.name + "/main",
                            config: pkg.config
                        });
                    }
                });
            }

            if(libPackages.length > 0){
                var deps = libPackages.map(function(pkg){
                    return pkg.name;
                });

                fileText += 'window.require.deps = (window.require.deps || []).concat(["' + deps.join('","') + '"]);\n';
            }

            var packages = libPackages.concat(staticPackages);
            if(packages.length > 0){
                fileText += 'window.require.packages = (window.require.packages || []).concat(' + JSON.stringify(packages) + ');\n';
            }

            if(packageConfig.length > 0){
                fileText += "window.require.config = window.require.config || {};\n";
                packageConfig.forEach(function(config){
                    fileText += 'window.require.config["' + config.name + '"] = ' + JSON.stringify(config.config) + ";\n";
                });
            }

            fileText += "function __bootstrap(){\n";
            if(libs){
                fileText += "   document.write(\"<script src='base/" + libs + ".js' defer='defer'></script>\");\n";
            }
            fileText += "}\n";
            fileText += grunt.file.read(path.resolve(process.cwd(), configuration.source, "app.nocache.js"));

            grunt.file.write(filePath, fileText);

            return true;
        }
    });

    return module;
};