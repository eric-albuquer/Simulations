const spheresCenter = new Float32Array([
    5, 502.5, -22,
    -7, 502, -8,
    0, 0, 0,
    0, 5000, 0,
    5, 501, -8,
    -1, 501.8, -11
])

const spheresRadius = new Float32Array([
    3,
    2,
    500,
    500,
    1,
    2
])

const spheresColor = new Float32Array([
    1, 1, 1,
    0, 1, 0,
    0.1, 0.4, 0.8,
    0, 0, 0,
    1, 0, 1,
    1, 1, 0
])

const spheresEmissionColor = new Float32Array([
    0, 0, 0,
    0, 0, 0,
    0, 0, 0,
    1, 1, 1,
    0, 0, 0,
    1, 1, 0
])

const spheresEmissionStrength = new Float32Array([
    0,
    0,
    0,
    20,
    0,
    3
])

const spheresSmoothness = new Float32Array([
    1,
    0,
    0,
    0,
    0,
    0
])

const uSpheresCenterLocation = gl.getUniformLocation(program, "u_spheresCenter");
const uSpheresRadiusLocation = gl.getUniformLocation(program, "u_spheresRadius");
const uSpheresColorLocation = gl.getUniformLocation(program, "u_spheresColor");
const uSpheresEmissionColorLocation = gl.getUniformLocation(program, "u_spheresEmissionColor");
const uSpheresEmissionStrengthLocation = gl.getUniformLocation(program, "u_spheresEmissionStrength");
const uSpheresSmoothnessLocation = gl.getUniformLocation(program, "u_spheresSmoothness");
const uNumSpheresLocation = gl.getUniformLocation(program, "u_numSpheres");

gl.uniform1i(uNumSpheresLocation, spheresSmoothness.length);
gl.uniform3fv(uSpheresColorLocation, spheresColor);
gl.uniform1fv(uSpheresRadiusLocation, spheresRadius);
gl.uniform3fv(uSpheresEmissionColorLocation, spheresEmissionColor);
gl.uniform1fv(uSpheresEmissionStrengthLocation, spheresEmissionStrength);
gl.uniform1fv(uSpheresSmoothnessLocation, spheresSmoothness);