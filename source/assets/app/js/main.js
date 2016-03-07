(function() {

    var gErrors = {};
    var gFragmentEditor = null;
    var gVertexEditor   = null;
    
    
    function reportErrors() {
        toastr.remove();
        toastr.options = {
          "closeButton": false,
          "debug": false,
          "newestOnTop": false,
          "progressBar": false,
          "positionClass": "toast-bottom-left",
          "preventDuplicates": false,
          "onclick": null,
          "showDuration": "300",
          "hideDuration": "1000",
          "timeOut": "5000",
          "extendedTimeOut": "1000",
          "showEasing": "swing",
          "hideEasing": "linear",
          "showMethod": "fadeIn",
          "hideMethod": "fadeOut"
        }
  /*      
        if(exp.errors.length > 1){
            toastr["error"]("Multiple errors");
        } else {
//            toastr["error"](exp.errors[0].error + " on line " + exp.errors[0].line);
        }
        */
        var editors = {};
        editors[gl.VERTEX_SHADER] = gVertexEditor;
        editors[gl.FRAGMENT_SHADER] = gFragmentEditor;
        for(var idx in editors){
            ed  = editors[idx];
            err = gErrors[idx];
            var newAnnot = [];
            if(!err){
                continue;
            }
            for(var i=0;i<err.length;i++) {
                newAnnot.push({
                  row: err[i].line-1,
                  column: err[i].column,
                  text: err[i].error + " near " + err[i].near,
                  type: "error" 
                });
            }
            ed.getSession().setAnnotations(newAnnot);
        }
        
    }
    
    function onShaderChanged(){
        updateProgram();
    }
    
    $(document).ready(function(){
		
		var defaultFragment = window.localStorage.getItem('fragment_shader');
		var defaultVertex = window.localStorage.getItem('vertex_shader');
		var defaultFragment = null;
		var defaultVertex = null;
		
		if( defaultFragment === null ||  defaultVertex === null){
			defaultFragment = [
				"#ifdef GL_ES",
				"	precision highp float;",
				"#endif",
				"",
				"varying float intersects;",
				"void main( void ) {",
				"",
				"	vec3 position = gl_FragCoord.xyz;",
				"	if(intersects > 0.0) {",
				"	    gl_FragColor = vec4( 1.0, 0.0, 0.0, 1.0 );",
				"	} else {",
				"        gl_FragColor = vec4( 1.0, 1.0, 1.0, 1.0 );",
				"	}",
				"}"
			].join("\n");
			
			defaultVertex = [
				"attribute vec3 vecVertex;",
				"attribute vec3 vecNormal;",
				"",
				"uniform mat4 matP;",
				"uniform mat4 matV;",
				"uniform mat4 matM;",
				"",
				"uniform vec3 vecCameraPosition;",
				"uniform vec3 vecMouseStart;",
				"uniform vec3 vecMouseEnd;",
				"",
				"vec4  vecTransformedNormal;",
				"vec3  vecTransformedVertex;",
				"",
				"varying float intersects;",
				"",
				"",
				"",
				"bool intersectPlane(",
				"	in vec3 origin, in vec3 direction, in vec3 normal, in vec3 vertex,",
				"	out vec3 point, out float org_distance, out float pnt_distance) { ",
				"",
				"    // assuming vectors are all normalized",
				"    float denom = dot(direction, normal); ",
				"    if (denom < 1e-6) { ",
				"		return false;",
				"	}",
				"	float numerator = dot( (vertex - origin), normal );",
				"",
				"	org_distance = numerator / denom;",
				"	point = origin + (org_distance * direction);",
				"	pnt_distance = length( point - vertex );",
				"	return true;",
				"",
				"}",
				"",
				"void doIntersect() {",
				"    vec3 org = vec3(0.0, 0.0,  0.0);",
				"	vec3 dir = vec3(0.0, 0.0, -1.0);",
				"	vec3 dst = vec3(0.0, 0.0, -1.0);",
				"	vec3 nor = vec3(0.0, 1.0,  0.0);",
				"	vec3 pnt = vec3(0.0, 0.0,  0.0);",
				"	",
				"	vec3 intersection_point;",
				"	float dist_to_intersection;",
				"	float dist_to_origin;",
				"",
				"	//Mouse lock",
				"	org = vecMouseStart;",
				"	dst = vecMouseEnd;",
				"	nor = vecTransformedNormal.xyz;",
				"	pnt = vecTransformedVertex.xyz;",
				"	dir = normalize(dst - org);",
				"",
				"	bool result = intersectPlane(",
				"		org, dir, nor, pnt,",
				"		intersection_point, dist_to_origin, dist_to_intersection",
				"	);",
				"",
				"	if(result && dist_to_intersection < 5.0){",
				"		intersects = 1.0;",
				"	}",
				"}",
				"",
				"",
				"void main() { ",
				"	vec4 pos = vec4(vecVertex, 1.0 );",
				"	",
				"	vecTransformedNormal = matV * matM * vec4(vecNormal, 1.0);",
				"	vecTransformedVertex = vec3(matV * matM * pos);",
				"	doIntersect();",
				"	gl_Position = matP * matV * matM * pos;",
				"}",
			].join("\n");
		}
        $('#fragment_editor').html(defaultFragment);
        $('#vertex_editor').html(defaultVertex);
        
        
        gFragmentEditor = ace.edit("fragment_editor");
        gFragmentEditor.setTheme("ace/theme/monokai");
        gFragmentEditor.getSession().setMode("ace/mode/glsl");
        gFragmentEditor.getSession().getDocument().on("change", onShaderChanged);

        gVertexEditor = ace.edit("vertex_editor");
        gVertexEditor.setTheme("ace/theme/monokai");
        gVertexEditor.getSession().setMode("ace/mode/glsl");
        gVertexEditor.getSession().getDocument().on("change", onShaderChanged);
        
        init().then(function(){
			console.log("Resolved!");
			animate();
		});


    });
    /**
     * Provides requestAnimationFrame in a cross browser way.
     * paulirish.com/2011/requestanimationframe-for-smart-animating/
     */
    window.requestAnimationFrame = window.requestAnimationFrame || ( function() {
        return  window.webkitRequestAnimationFrame ||
                window.mozRequestAnimationFrame ||
                window.oRequestAnimationFrame ||
                window.msRequestAnimationFrame ||
                function(  callback, element ) {
                    window.setTimeout( callback, 1000 / 60 );
                };
    })();

    var canvas, 
        gl, 
        vertex_shader, fragment_shader, 
        currentProgram,
        parameters = {  
            start_time  : new Date().getTime(), 
            time        : 0, 
            screenWidth : 0, 
            screenHeight: 0 
        };
    function updateProgram() {
        
        gErrors = {};
        gFragmentEditor.getSession().clearAnnotations();
        gVertexEditor.getSession().clearAnnotations();
        
        gFragmentEditor.getSession().setOption("useWorker", false);
        
        vertex_shader = gVertexEditor.getSession().getDocument().getValue();
        fragment_shader = gFragmentEditor.getSession().getDocument().getValue();
        
        $("#fragment_container .label").removeClass('error');
        $("#vertex_container .label").removeClass('error');

        var newProgram = null;
        try { 
            newProgram = createProgram( vertex_shader, fragment_shader );
        } catch (e) {
            
            if(gErrors[gl.VERTEX_SHADER]){
                $("#vertex_container .label").addClass('error');
            } 
            if(gErrors[gl.FRAGMENT_SHADER]){
                $("#fragment_container .label").addClass('error');
            }
            reportErrors();
            return;
        }
        toastr.remove();
        
        if(currentProgram){
            gl.deleteProgram(currentProgram);
        }
        currentProgram = newProgram;
	
		window.localStorage.setItem('vertex_shader', vertex_shader);
		window.localStorage.setItem('fragment_shader', fragment_shader);
    }
    
    function clearMarkers(){
        
        var markers = null;
        
        markers = gFragmentEditor.getSession().getMarkers();
        for(var i=0;i<markers.length;i++){
            gFragmentEditor.getSession().removeMarker(markers[i]);
        }
        
        markers = gVertexEditor.getSession().getMarkers();
        for(var i=0;i<markers.length;i++){
            gVertexEditor.getSession().removeMarker(markers[i]);
        }
        
    }
    
    function parseErrors(type, e) {
        var structuredErrors = [];
        var errors = e.split("ERROR:");
        for(var i=0;i<errors.length;i++){
            if(errors[i].length == 0){
                continue;
            }
            var tokens = errors[i].split(":");
            structuredErrors.push({
                "column": parseInt(tokens[0], 10),
                "line"  : parseInt(tokens[1], 10),
                "near"  : tokens[2],
                "error" : tokens[3],
            });
        }
        gErrors[type] = structuredErrors;
        console.log(structuredErrors);
    }
    
    function init() {
        
		glMatrix.setMatrixArrayType(Float32Array);
		
        canvas = document.querySelector( 'canvas' );

        // Initialise WebGL

        try {

            gl = canvas.getContext( 'experimental-webgl' );

        } catch( error ) { }

        if ( !gl ) {

            throw "cannot create webgl context";

        }


		
        updateProgram();
        // Create Vertex buffer (2 triangles)
        gl.clearColor(0.0, 0.0, 0.0, 1.0);
		if (gl.clearDepth) {
			gl.clearDepth(1.0);
		} else {
			gl.clearDepthf(1.0); 
		  
		} 
		gl.enable(gl.DEPTH_TEST);
		gl.enable(gl.CULL_FACE);
		gl.cullFace(gl.BACK);
		
		onWindowResize();
        window.addEventListener( 'resize', onWindowResize, false );

		return onInitGL(gl, currentProgram, parameters);

    }

    function createProgram( vertex, fragment ) {

        var program = gl.createProgram();

        var vs = createShader( vertex, gl.VERTEX_SHADER );
        var fs = createShader( fragment, gl.FRAGMENT_SHADER );

        if ( vs == null || fs == null ) {
            throw "Failed to create shaders";
        }

        gl.attachShader( program, vs );
        gl.attachShader( program, fs );

        gl.deleteShader( vs );
        gl.deleteShader( fs );

        gl.linkProgram( program );

        if ( !gl.getProgramParameter( program, gl.LINK_STATUS ) ) {

            throw( "ERROR:\n" +
            "VALIDATE_STATUS: " + gl.getProgramParameter( program, gl.VALIDATE_STATUS ) + "\n" +
            "ERROR: " + gl.getError() + "\n\n" +
            "- Vertex Shader -\n" + vertex + "\n\n" +
            "- Fragment Shader -\n" + fragment );
        }

        return program;

    }

    function createShader( src, type ) {

        var shader = gl.createShader( type );

        gl.shaderSource( shader, src );
        gl.compileShader( shader );

        if ( !gl.getShaderParameter( shader, gl.COMPILE_STATUS ) ) {
            parseErrors(type, gl.getShaderInfoLog( shader ));
            return null;
        }

        return shader;

    }

    function onWindowResize( event ) {

        canvas.width = window.innerWidth / 2;
        canvas.height = window.innerHeight;

        parameters.screenWidth = canvas.width;
        parameters.screenHeight = canvas.height;

        gl.viewport( 0, 0, canvas.width, canvas.height );
		
		onResize(gl, currentProgram, parameters);
		
    }
	

	
    function animate() {
		
        requestAnimationFrame( animate );
        render();
		
    }

    function render() {

        if ( !currentProgram ) return;

        parameters.time = new Date().getTime() - parameters.start_time;

        gl.clear( gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT );

        // Load program into GPU

        gl.useProgram( currentProgram );
        
        onRenderGL(gl, currentProgram, parameters);

    }
    
})();