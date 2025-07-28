precision mediump float;

in vec2 vTextureCoord;
uniform sampler2D uTexture;   // incoming texture (plain white)
uniform sampler2D uDisp;      // displacement map
uniform vec2  uRes;           // resolution of the rectangle
uniform vec4 uCenters;    // centres (0‑1 space inside rect)
uniform vec4 uLevels;
uniform vec4 uPitches;
uniform float uTime;

// single radial wave contribution
float wave(vec2 p, vec2 c, float lvl, float freq, float t){
    vec2 d = p - c;
    float l = length(d);
    float s = sin(l*freq - t) * lvl / pow(l+1.0, 2.0);
    return s;
}

void main() {
    /* normalised pixel pos inside the rectangle (0‑1) */
    vec2 uv = vTextureCoord;
    /* centre‑based coords (‑1 .. +1) for a rounder feel */
    vec2 p = (uv * 2.0 - 1.0) * vec2(uRes.x / uRes.y, 1.0) * 50.0;

    float t = uTime * 5.0;

    /* accumulate the four voices */
    float amp = 0.0;
    for (int i = 0; i < 4; i++){
        amp += wave(p, vec2(uCenters[i], 0.5) * 100.0 - 50.0,
                    uLevels[i], uPitches[i], t);
    }

    /* ------------- use amplitude two ways ------------- */
    /* 1) Displace look‑ups into the background texture   */
    vec2 dispVec = texture2D(uDisp, uv + vec2(uTime*0.02)).rg * 2.0 - 1.0;
    vec2 displacedUV = uv + dispVec * amp * 0.03;

    vec4 src = texture2D(uTexture, displacedUV);

    /* 2) Cheap four‑tap box blur whose strength = |amp|  */
    vec4 blur = (
        texture2D(uTexture, displacedUV + vec2( 0.005, 0.0 )) +
        texture2D(uTexture, displacedUV + vec2(-0.005, 0.0 )) +
        texture2D(uTexture, displacedUV + vec2( 0.0,  0.005)) +
        texture2D(uTexture, displacedUV + vec2( 0.0, -0.005))
    ) * 0.25;

    float k = clamp(abs(amp) * 3.0, 0.0, 1.0);
    vec4 color = mix(src, blur, k);

    /* optional slight emissive tint */
    color.rgb += amp * 0.4;

    gl_FragColor = color;
}