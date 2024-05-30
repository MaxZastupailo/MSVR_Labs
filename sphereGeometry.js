function CreateSphereData() {
    let vertexList = [];

    let u = 0,
        v = 0;
    while (u < Math.PI * 2) {
        while (v < Math.PI) {
            let v1 = getSphereVertex(u, v);
            let v2 = getSphereVertex(u + 0.1, v);
            let v3 = getSphereVertex(u, v + 0.1);
            let v4 = getSphereVertex(u + 0.1, v + 0.1);
            vertexList.push(v1.x/5, v1.y/5, v1.z/5);
            vertexList.push(v2.x/5, v2.y/5, v2.z/5);
            vertexList.push(v3.x/5, v3.y/5, v3.z/5);
            vertexList.push(v3.x/5, v3.y/5, v3.z/5);
            vertexList.push(v2.x/5, v2.y/5, v2.z/5);
            vertexList.push(v4.x/5, v4.y/5, v4.z/5);
            v += 0.1;
        }
        v = 0;
        u += 0.1;
    }
    return vertexList
}

const radius = 0.2;
function getSphereVertex(long, lat) {
    return {
        x: radius * Math.cos(long) * Math.sin(lat),
        y: radius * Math.sin(long) * Math.sin(lat),
        z: radius * Math.cos(lat)
    }
}