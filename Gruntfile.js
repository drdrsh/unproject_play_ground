module.exports = function(grunt) {

    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),
		serve: {
			options: {
				port: 9000,
				serve: {
					path: './source/'
				}
			}
		},
        
		"open" : {
			dev : {
				path: 'http://127.0.0.1:9000/index.html'
			}
		},
		
        "bower-install-simple": {
            options: {
                color: true 
            },
            "prod": {
                options: {
                    production: true
                }
            },
            "dev": {
                options: {
                    production: false
                }
            }
        },
		
		bowercopy: {
            source: { 
                options: {
                    clean: false
                },
                files: {
                    "source/assets/lib/toastr/css/toastr.css" : "./toastr/toastr.css",
                    "source/assets/lib/toastr/js/toastr.js" : "./toastr/toastr.js",
					"source/assets/lib/ace/js/ace.js" : "./ace-builds/src/ace.js",
					"source/assets/lib/ace/js/theme-monokai.js" : "./ace-builds/src/theme-monokai.js",
					"source/assets/lib/ace/js/mode-glsl.js" : "./ace-builds/src/mode-glsl.js",
					"source/assets/lib/gl-matrix/js/gl-matrix.min.js" : "./gl-matrix/dist/gl-matrix-min.js",
 
					"source/assets/lib/jquery/js/jquery.js" : "./jquery/dist/jquery.js"
                }
            }
        }
    });
    
    grunt.loadNpmTasks("grunt-bower-install-simple");
    grunt.loadNpmTasks('grunt-bowercopy');
	grunt.loadNpmTasks('grunt-open');
	grunt.loadNpmTasks('grunt-serve');
    
    // task setup 
    grunt.registerTask('default', ['bower-install-simple', 'bowercopy']);
	grunt.registerTask('server', ['open:dev', 'serve']);
	
};