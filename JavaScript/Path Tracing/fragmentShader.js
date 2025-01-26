const fragmentShaderSource = `#version 300 es
    precision mediump float;

    uniform vec2 u_resolution;
    uniform float u_h;
    uniform float u_w;
    uniform int u_maxBounceCount;
    uniform vec3 u_camera;
    uniform int u_numSpheres;
    uniform int u_numRaysPixel;
    uniform float u_atmosphereIntensity;

    const int maxSpheres = 10;

    uniform vec3 u_spheresCenter[maxSpheres];
    uniform float u_spheresRadius[maxSpheres];
    uniform vec3 u_spheresColor[maxSpheres];
    uniform vec3 u_spheresEmissionColor[maxSpheres];
    uniform float u_spheresEmissionStrength[maxSpheres];
    uniform float u_spheresSmoothness[maxSpheres];

    out vec4 fragColor;

    struct Ray
    {
        vec3 dir;
        vec3 origin;
    };

    struct Material
    {
        vec3 color;
        vec3 emissionColor;
        float emissionStrength;
        float smoothness;
    };

    struct Sphere
    {
        vec3 center;
        float radius;
        Material material;
    };
    
    struct HitInfo
    {
        bool didHit;
        float dist;
        vec3 hitPoint;
        vec3 normal;
        Material material;
    };

    struct Triangle
    {
        vec3 posA, posB, posC;
        vec3 normalA, normalB, normalC;
    };

    struct MeshInfo
    {
        uint firstTriangleIndex;
        uint numTriangles;
        vec3 boundsMin;
        vec3 boundsMax;
        Material material;
    };

    vec3 rayDir(){
        float u = u_w * (gl_FragCoord.x / u_resolution.x - 0.5);
        float v = u_h * (gl_FragCoord.y / u_resolution.y - 0.5);

        vec3 dir = vec3(u, v, -1.0);
        
        return normalize(dir);
    }

    HitInfo RaySphere(Ray ray, vec3 sphereCenter, float sphereRadius){
        HitInfo hitInfo;

        vec3 offsetRayOrigin = ray.origin - sphereCenter;

        float a = dot(ray.dir, ray.dir);
        float b = 2.0 * dot(offsetRayOrigin, ray.dir);
        float c = dot(offsetRayOrigin, offsetRayOrigin) - sphereRadius * sphereRadius;

        float delta = b * b - 4.0 * a * c;

        if (delta >= 0.0){
            float dist = (- b - sqrt(delta)) / (2.0 * a);

            if (dist >= 0.0){
                hitInfo.didHit = true;
                hitInfo.dist = dist;
                hitInfo.hitPoint = ray.origin + ray.dir * dist;
                hitInfo.normal = normalize(hitInfo.hitPoint - sphereCenter);
            }
        }

        return hitInfo;
    }

    HitInfo CalculateRayCollision(Ray ray){
        HitInfo closestHit;
        closestHit.dist = 1e20;

        for(int i = 0; i < u_numSpheres; i++){
            Sphere sphere;
            sphere.center = u_spheresCenter[i];
            sphere.radius = u_spheresRadius[i];
            
            sphere.material.color = u_spheresColor[i];
            sphere.material.emissionColor = u_spheresEmissionColor[i];
            sphere.material.emissionStrength = u_spheresEmissionStrength[i];
            sphere.material.smoothness = u_spheresSmoothness[i];

            HitInfo hitInfo = RaySphere(ray, sphere.center, sphere.radius);

            if (hitInfo.didHit && hitInfo.dist < closestHit.dist){
                closestHit = hitInfo;
                closestHit.material = sphere.material;
            }
        }

        return closestHit;
    }

    float RandomValue(inout uint state) {
        state = state * uint(747796405) + uint(2891336453);
        uint result = ((state >> ((state >> 28) + uint(4))) ^ state) * uint(277803737);
        result = (result >> 22) ^ result;
        return float(result) / 4294967295.0;
    }

    float RandomValueNormal(inout uint state){
        float theta = 2.0 * 3.1415926 * RandomValue(state);
        float rho = sqrt(-2.0 * log(RandomValue(state)));
        return rho * cos(theta);
    }

    vec3 RandomDirection(inout uint state){
        float x = RandomValueNormal(state);
        float y = RandomValueNormal(state);
        float z = RandomValueNormal(state);

        return normalize(vec3(x, y, z));
    }

    vec3 RandomHemisphereDirection(vec3 normal, inout uint state){
        vec3 dir = RandomDirection(state);
        return dir * sign(dot(normal, dir));
    }

    vec3 GetEnvironmentLight(Ray ray, float intensity){
        float skyGradientT = smoothstep(0.0, 0.4, ray.dir.y); 

        vec3 skyGradient = mix(vec3(1, 1, 1), vec3(0.5, 0.8, 1.0), skyGradientT);

        float groundToSkyT = smoothstep(-0.1, 0.0, ray.dir.y);

        return mix(vec3(0.5, 0.5, 0.5), skyGradient, groundToSkyT) * intensity;
    }

    vec3 reflectRay(vec3 dirIn, vec3 normal){
        return dirIn - 2.0 * dot(dirIn, normal) * normal;
    }

    HitInfo RayTriangle(Ray ray, Triangle tri){
        vec3 edgeAB = tri.posB - tri.posA;
        vec3 edgeAC = tri.posC - tri.posA;
        vec3 normalVector = cross(edgeAB, edgeAC);
        vec3 ao = ray.origin - tri.posA;
        vec3 dao = cross(ao, ray.dir);

        float determinant = -dot(ray.dir, normalVector);
        float invDet = 1.0 / determinant;

        float dist = dot(ao, normalVector) * invDet;
        float u = dot(ao, normalVector) * invDet;
        float v = -dot(edgeAC, dao) * invDet;
        float w = 1.0 - u - v;

        HitInfo hitInfo;
        hitInfo.didHit = determinant >= 1e-6 && dist >= 0.0 && u >= 0.0 && v >= 0.0 && w >= 0.0;
        hitInfo.hitPoint = ray.origin + ray.dir * dist;
        hitInfo.normal = normalize(tri.normalA * w + tri.normalB * u + tri.normalC * v);
        hitInfo.dist = dist;
        return hitInfo;
    }

    vec3 Trace(Ray ray, inout uint state){
        vec3 incomingLight = vec3(0, 0, 0);
        vec3 rayColor = vec3(1, 1, 1);

        for(int i = 0; i <= u_maxBounceCount; i++){
            HitInfo hitInfo = CalculateRayCollision(ray);

            if (hitInfo.didHit){
                Material material = hitInfo.material;
                ray.origin = hitInfo.hitPoint;

                vec3 difusseDir = normalize(hitInfo.normal + RandomDirection(state));
                vec3 specularDir = reflectRay(ray.dir, hitInfo.normal);
                ray.dir = mix(difusseDir, specularDir, material.smoothness);
                
                vec3 emittedLight = material.emissionColor * material.emissionStrength;
                incomingLight += emittedLight * rayColor;
                rayColor *= material.color;
            } else {
                incomingLight += GetEnvironmentLight(ray, u_atmosphereIntensity) * rayColor;
                break; 
            }
        }

        return incomingLight;
    }

    void main() {
        Ray ray;
        ray.origin = u_camera;
        ray.dir = rayDir();

        uint idx = uint(gl_FragCoord.y * u_resolution.x + gl_FragCoord.x);
        uint seed = idx;

        vec3 totalIncomingLight = vec3(0, 0, 0);

        for(int i = 0; i < u_numRaysPixel; i++){
            totalIncomingLight += Trace(ray, seed);
        }

        totalIncomingLight *= 1.0 / float(u_numRaysPixel);

        fragColor = vec4(totalIncomingLight, 1.0);
    }
`;