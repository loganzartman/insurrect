/**
 * An RGB Split Filter.
 *
 * @class
 * @extends PIXI.Filter
 * @memberof PIXI.filters
 */
function ThresholdFilter()
{
    PIXI.Filter.call(this,
        // vertex shader
        `attribute vec2 aVertexPosition;
         attribute vec2 aTextureCoord;
         uniform mat3 projectionMatrix;
         varying vec2 vTextureCoord;
         void main(void)
         {
             gl_Position = vec4((projectionMatrix * vec3(aVertexPosition, 1.0)).xy, 0.0, 1.0);
             vTextureCoord = aTextureCoord;
         }`,
        // fragment shader
        `precision mediump float;
         varying vec2 vTextureCoord;
         uniform sampler2D uSampler;
         uniform vec4 filterArea;
         uniform float threshold;
         void main(void)
         {
            float r = texture2D(uSampler, vTextureCoord).r;
            float g = texture2D(uSampler, vTextureCoord).g;
            float b = texture2D(uSampler, vTextureCoord).b;
            float a = texture2D(uSampler, vTextureCoord).a;
            float x = (r+g+b)/3.0;
            if (x > threshold) {
                gl_FragColor = vec4(r,g,b,a);
            }
            else {
                gl_FragColor = vec4(0.0,0.0,0.0,a);
            }
         }`
    );

    this.threshold = 0.5;
}

ThresholdFilter.prototype = Object.create(PIXI.Filter.prototype);
ThresholdFilter.prototype.constructor = ThresholdFilter;

Object.defineProperties(ThresholdFilter.prototype, {
    /**
     * Red channel offset.
     *
     * @member {PIXI.Point}
     * @memberof PIXI.filters.ThresholdFilter#
     */
    threshold: {
        get: function ()
        {
            return this.uniforms.threshold;
        },
        set: function (value)
        {
            this.uniforms.threshold = value;
        }
    }
});