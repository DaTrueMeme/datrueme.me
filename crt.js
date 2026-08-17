(function () {
    const canvas = document.getElementById('crt-canvas');
    const source = document.querySelector('.terminal-wrap');
    if (!canvas || !source) return;

    const gl = canvas.getContext('webgl', { alpha: true, premultipliedAlpha: false });
    if (!gl) return;

    const vertSrc = `
        attribute vec2 aPos;
        varying vec2 vUv;
        void main() {
            vUv = vec2(aPos.x * 0.5 + 0.5, 0.5 - aPos.y * 0.5);
            gl_Position = vec4(aPos, 0.0, 1.0);
        }
    `;

    const fragSrc = `
        precision highp float;
        varying vec2 vUv;
        uniform sampler2D uTex;
        uniform vec2 uResolution;
        uniform float uPixelSize;
        uniform float uTime;

        float rand(vec2 co) {
            return fract(sin(dot(co, vec2(12.9898, 78.233))) * 43758.5453);
        }

        void main() {
            vec2 pixelGrid = uResolution / uPixelSize;
            vec2 uv = floor(vUv * pixelGrid) / pixelGrid;

            vec3 col = texture2D(uTex, uv).rgb;

            float ca = uPixelSize / uResolution.x * 1.5;
            col.r = texture2D(uTex, uv + vec2(ca, 0.0)).r;
            col.b = texture2D(uTex, uv - vec2(ca, 0.0)).b;

            float line = mod(floor(vUv.y * uResolution.y / uPixelSize), 2.0);
            col *= mix(0.82, 1.0, line);

            float n = rand(uv * uResolution.xy + floor(uTime * 12.0));
            col *= 0.97 + n * 0.03;

            gl_FragColor = vec4(col, 1.0);
        }
    `;

    function compile(type, src) {
        const shader = gl.createShader(type);
        gl.shaderSource(shader, src);
        gl.compileShader(shader);
        if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
            console.error('CRT shader compile error:', gl.getShaderInfoLog(shader));
            return null;
        }
        return shader;
    }

    const vs = compile(gl.VERTEX_SHADER, vertSrc);
    const fs = compile(gl.FRAGMENT_SHADER, fragSrc);
    if (!vs || !fs) return;

    const program = gl.createProgram();
    gl.attachShader(program, vs);
    gl.attachShader(program, fs);
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
        console.error('CRT program link error:', gl.getProgramInfoLog(program));
        return;
    }
    gl.useProgram(program);

    const posBuf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, posBuf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
        -1, -1, 1, -1, -1, 1, 1, 1,
    ]), gl.STATIC_DRAW);
    const aPos = gl.getAttribLocation(program, 'aPos');
    gl.enableVertexAttribArray(aPos);
    gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0);

    const uTex = gl.getUniformLocation(program, 'uTex');
    const uResolution = gl.getUniformLocation(program, 'uResolution');
    const uPixelSize = gl.getUniformLocation(program, 'uPixelSize');
    const uTime = gl.getUniformLocation(program, 'uTime');

    const texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);

    const PIXEL_SIZE = 4;
    let dpr = Math.min(window.devicePixelRatio || 1, 2);
    let textureReady = false;

    function resize() {
        dpr = Math.min(window.devicePixelRatio || 1, 2);
        canvas.width = window.innerWidth * dpr;
        canvas.height = window.innerHeight * dpr;
        gl.viewport(0, 0, canvas.width, canvas.height);
    }
    window.addEventListener('resize', () => { resize(); snapshot(); });
    resize();

    function snapshot() {
        const w = window.innerWidth;
        const h = window.innerHeight;
        const html = source.outerHTML
            .replace(/#/g, '%23');

        const svg = `
            <svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}">
                <foreignObject width="100%" height="100%">
                    <div xmlns="http://www.w3.org/1999/xhtml" style="
                        background:#0a0a0a;
                        width:${w}px;
                        height:${h}px;
                        font-family:'Source Code Pro',monospace;
                        color:#e5e9e2;
                        padding:5px;
                        box-sizing:border-box;
                        font-size:1.5em;
                    ">${html}</div>
                </foreignObject>
            </svg>
        `;

        const img = new Image();
        img.onload = () => {
            gl.bindTexture(gl.TEXTURE_2D, texture);
            gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
            gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img);
            textureReady = true;
            source.classList.add('crt-source-hidden');
        };
        img.onerror = () => {
            source.classList.remove('crt-source-hidden');
        };
        img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
    }

    snapshot();
    setInterval(snapshot, 400);

    gl.disable(gl.BLEND);

    function render(t) {
        if (textureReady) {
            gl.uniform1i(uTex, 0);
            gl.uniform2f(uResolution, canvas.width, canvas.height);
            gl.uniform1f(uPixelSize, PIXEL_SIZE * dpr);
            gl.uniform1f(uTime, t * 0.001);
            gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
        }
        requestAnimationFrame(render);
    }
    requestAnimationFrame(render);
})();
