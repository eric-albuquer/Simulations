const fov = Math.PI / 3
const aspectRatio = width / height

const h = 2 * Math.tan(fov / 2)
const w = h * aspectRatio

const camera = new Float32Array([0, 505, 7])

const atmosphereIntensity = 0.07

const maxBounceCount = 30

const numRaysPixel = 256

const uNumRaysPixelLocation = gl.getUniformLocation(program, "u_numRaysPixel");
const uHLocation = gl.getUniformLocation(program, "u_h");
const uWLocation = gl.getUniformLocation(program, "u_w");
const uMaxBounceLocation = gl.getUniformLocation(program, "u_maxBounceCount");
const uCameraLocation = gl.getUniformLocation(program, "u_camera");
const uAtmosphereIntensityLocation = gl.getUniformLocation(program, "u_atmosphereIntensity")
const uResolutionLocation = gl.getUniformLocation(program, "u_resolution");

gl.uniform2f(uResolutionLocation, width, height);
gl.uniform1f(uHLocation, h);
gl.uniform1f(uWLocation, w);
gl.uniform1f(uAtmosphereIntensityLocation, atmosphereIntensity);
gl.uniform1i(uMaxBounceLocation, maxBounceCount);
gl.uniform1i(uNumRaysPixelLocation, numRaysPixel);
gl.uniform3fv(uCameraLocation, camera);


let time = 0.5
const radius = 3000

function render() {
    spheresCenter[9] = radius * Math.sin(time * 0.9)
    spheresCenter[10] = radius * Math.sin(time)
    spheresCenter[11] = radius * Math.cos(time)

    time += 0.01

    gl.uniform3fv(uCameraLocation, camera);
    gl.uniform3fv(uSpheresCenterLocation, spheresCenter);

    // Desenhar o triângulo cobrindo a tela
    gl.drawArrays(gl.TRIANGLES, 0, 6);

    // Chamar a próxima atualização
    requestAnimationFrame(render);
}

// Iniciar a renderização
render();
