/**
 * An RGB Split Filter.
 *
 * @class
 * @extends PIXI.Filter
 * @memberof PIXI.filters
 */
function RGBSplitFilter()
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
         uniform vec2 red;
         uniform vec2 green;
         uniform vec2 blue;
         void main(void)
         {
            gl_FragColor.r = texture2D(uSampler, vTextureCoord + red/filterArea.xy).r;
            gl_FragColor.g = texture2D(uSampler, vTextureCoord + green/filterArea.xy).g;
            gl_FragColor.b = texture2D(uSampler, vTextureCoord + blue/filterArea.xy).b;
            gl_FragColor.a = texture2D(uSampler, vTextureCoord).a;
         }`
    );

    this.red = [-10, 0];
    this.green = [0, 10];
    this.blue = [0, 0];
}

RGBSplitFilter.prototype = Object.create(PIXI.Filter.prototype);
RGBSplitFilter.prototype.constructor = RGBSplitFilter;

Object.defineProperties(RGBSplitFilter.prototype, {
    /**
     * Red channel offset.
     *
     * @member {PIXI.Point}
     * @memberof PIXI.filters.RGBSplitFilter#
     */
    red: {
        get: function ()
        {
            return this.uniforms.red;
        },
        set: function (value)
        {
            this.uniforms.red = value;
        }
    },

    /**
     * Green channel offset.
     *
     * @member {PIXI.Point}
     * @memberof PIXI.filters.RGBSplitFilter#
     */
    green: {
        get: function ()
        {
            return this.uniforms.green;
        },
        set: function (value)
        {
            this.uniforms.green = value;
        }
    },

    /**
     * Blue offset.
     *
     * @member {PIXI.Point}
     * @memberof PIXI.filters.RGBSplitFilter#
     */
    blue: {
        get: function ()
        {
            return this.uniforms.blue.value;
        },
        set: function (value)
        {
            this.uniforms.blue.value = value;
        }
    }
});