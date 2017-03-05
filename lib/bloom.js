var BlurXFilter = PIXI.filters.BlurXFilter,
    BlurYFilter = PIXI.filters.BlurYFilter,
    ColorMatrixFilter = PIXI.filters.ColorMatrixFilter,
    VoidFilter = PIXI.filters.VoidFilter;

/**
 * The BloomFilter applies a Gaussian blur to an object.
 * The strength of the blur can be set for x- and y-axis separately.
 *
 * @class
 * @extends PIXI.Filter
 * @memberof PIXI.filters
 */
function BloomFilter()
{
    PIXI.Filter.call(this);
    this.cmFilter = new ColorMatrixFilter();
    this.threshold = new ThresholdFilter();
    this.blurXFilter = new BlurXFilter();
    this.blurYFilter = new BlurYFilter();

    this.padding = 0;
    this.cmFilter.saturate(2);
    this.cmFilter.brightness(0.04,true);
    this.cmFilter.contrast(7,true);

    this.blurYFilter.blendMode = PIXI.BLEND_MODES.ADD;

    this.defaultFilter = new VoidFilter();
}

BloomFilter.prototype = Object.create(PIXI.Filter.prototype);
BloomFilter.prototype.constructor = BloomFilter;

BloomFilter.prototype.apply = function (filterManager, input, output)
{
    var renderTarget = filterManager.getRenderTarget(true);

    //TODO - copyTexSubImage2D could be used here?
    this.defaultFilter.apply(filterManager, input, output);

    this.cmFilter.apply(filterManager, input, renderTarget);
    this.threshold.apply(filterManager, renderTarget, input);
    this.blurXFilter.apply(filterManager, input, renderTarget);
    this.blurYFilter.apply(filterManager, renderTarget, output);

    filterManager.returnRenderTarget(renderTarget);
};

Object.defineProperties(BloomFilter.prototype, {
    /**
     * Sets the strength of both the blurX and blurY properties simultaneously
     *
     * @member {number}
     * @memberOf PIXI.filters.BloomFilter#
     * @default 2
     */
    blur: {
        get: function ()
        {
            return this.blurXFilter.blur;
        },
        set: function (value)
        {
            this.blurXFilter.blur = this.blurYFilter.blur = value;
        }
    },

    /**
     * Sets the strength of the blurX property
     *
     * @member {number}
     * @memberOf PIXI.filters.BloomFilter#
     * @default 2
     */
    blurX: {
        get: function ()
        {
            return this.blurXFilter.blur;
        },
        set: function (value)
        {
            this.blurXFilter.blur = value;
        }
    },

    /**
     * Sets the strength of the blurY property
     *
     * @member {number}
     * @memberOf PIXI.filters.BloomFilter#
     * @default 2
     */
    blurY: {
        get: function ()
        {
            return this.blurYFilter.blur;
        },
        set: function (value)
        {
            this.blurYFilter.blur = value;
        }
    }
});