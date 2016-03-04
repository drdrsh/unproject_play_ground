var Vec3 = function (x, y, z) {
  var vec = [x, y, z];
  vec.x = x;
  vec.y = y;
  vec.z = z;
  vec.len = function () {
    return Math.sqrt(x * x + y * y + z * z);
  };
  vec.is_zero = function () {
    return vec.len() == 0;
  };
  vec.mul = function (a) {
    return Vec3(a * x, a * y, a * z);
  };
  vec.normalize = function () {
    return vec.is_zero() ? vec : vec.mul(1 / vec.len());
  };
  vec.dot = function (other) {
    return x * other.x + y * other.y + z * other.z;
  };
  vec.add = function (other) {
    return Vec3(x + other.x, y + other.y, z + other.z);
  };
  vec.sub = function (other) {
    return Vec3(x - other.x, y - other.y, z - other.z);
  };
  vec.cross = function (other) {
    return Vec3(
      y * other.z - z * other.y,
      z * other.x - x * other.z,
      x * other.y - y * other.x);
  };
  vec.reflect = function (other) {
    // TBD: it it ok?
    var d2 = vec.dot(other) * 2;
    return Vec3(x - d2 * other.x, y - d2 * other.y, z - d2 * other.z);
    //return other.add(other.sub(vec));
  };
  return vec;
};
var perspectiveMatrix = function (fov, aspect, near, far) {
  // as gluPerspective(), but "fov" is radian, aspect = h / w
  var zoom = 1.0 / Math.tan(fov / 2);
  return tr([
    zoom / aspect, 0, 0, 0,
    0, zoom, 0, 0,
    0, 0, (far + near) / (near - far), 2 * far * near / (near - far),
    0, 0, -1, 0,
  ]);
};
var lookAtMatrix = function (eye, center, up) {
  // as gluLookAt(), but each params are Vec3
  var lz = center.sub(eye).normalize(); // z-axis of eye ray
  var nup = up.normalize();
  var lx = lz.cross(nup); // x-axis of eye ray
  var ly = lx.cross(lz);  // y-axis of eye ray
  return tr([
    lx.x, lx.y, lx.z, -eye.x,
    ly.x, ly.y, ly.z, -eye.y,
    -lz.x, -lz.y, -lz.z, -eye.z,
    0, 0, 0, 1,
  ]); // = identity4.rotate(lx, ly, -lz).translate(-eye)
};
// for C array layout of OpenGL matrix
var tr = function (mat) {
  return [
    mat[0], mat[4], mat[8], mat[12],
    mat[1], mat[5], mat[9], mat[13],
    mat[2], mat[6], mat[10], mat[14],
    mat[3], mat[7], mat[11], mat[15],
  ];
};




THREE.Raycaster.prototype = {

		constructor: THREE.Raycaster,

		linePrecision: 1,

		set: function ( origin, direction ) {

			// direction is assumed to be normalized (for accurate distance calculations)

			this.ray.set( origin, direction );

		},

		setFromCamera: function ( coords, camera ) {

			if ( camera instanceof THREE.PerspectiveCamera ) {

				this.ray.origin.setFromMatrixPosition( camera.matrixWorld );
				this.ray.direction.set( coords.x, coords.y, 0.5 ).unproject( camera ).sub( this.ray.origin ).normalize();

			} else if ( camera instanceof THREE.OrthographicCamera ) {

				this.ray.origin.set( coords.x, coords.y, - 1 ).unproject( camera );
				this.ray.direction.set( 0, 0, - 1 ).transformDirection( camera.matrixWorld );

			} else {

				console.error( 'THREE.Raycaster: Unsupported camera type.' );

			}

		},

		intersectObject: function ( object, recursive ) {

			var intersects = [];

			intersectObject( object, this, intersects, recursive );

			intersects.sort( ascSort );

			return intersects;

		},

		intersectObjects: function ( objects, recursive ) {

			var intersects = [];

			if ( Array.isArray( objects ) === false ) {

				console.warn( 'THREE.Raycaster.intersectObjects: objects is not an Array.' );
				return intersects;

			}

			for ( var i = 0, l = objects.length; i < l; i ++ ) {

				intersectObject( objects[ i ], this, intersects, recursive );

			}

			intersects.sort( ascSort );

			return intersects;

		}

	};

}( THREE ) );