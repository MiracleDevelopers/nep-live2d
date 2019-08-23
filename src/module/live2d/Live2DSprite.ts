import Live2DModel from '@/core/live2d/Live2DModel';
import { Tagged } from '@/core/utils/log';
import { Renderer } from '@pixi/core';
import { DisplayObject } from '@pixi/display';

export default class Live2DSprite extends DisplayObject implements Tagged {
    tag = Live2DSprite.name;

    model: Live2DModel;

    // temporary 4x4 matrix
    // prettier-ignore
    modelTransform = new Float32Array([
        1, 0, 0, 0,
        0, 1, 0, 0,
        0, 0, 1, 0,
        0, 0, 0, 1,
    ]);

    /** The scale from WebGL's context size to model's logical size. */
    drawingScaleX = 1;
    drawingScaleY = 1;

    private _width: number;
    private _height: number;

    get width() {
        return this._width;
    }

    set width(value) {
        this.scale.x = value > 0 ? value / this._width : 1;
        this._width = value;
    }

    get height() {
        return this._height;
    }

    set height(value) {
        this.scale.y = value > 0 ? value / this._height : 1;
        this._height = value;
    }

    static async create(modelSettingsFile: string, gl: WebGLRenderingContext) {
        const model = await Live2DModel.create(modelSettingsFile, gl);
        return new Live2DSprite(model);
    }

    private constructor(model: Live2DModel) {
        super();

        this.model = model;
        this._width = model.width;
        this._height = model.height;
    }

    updateTransformByGL(gl: WebGLRenderingContext) {
        this.drawingScaleX = this.model.logicalWidth / gl.drawingBufferWidth;
        this.drawingScaleY = -this.model.logicalHeight / gl.drawingBufferHeight; // flip Y
    }

    /**
     * @event Live2DSprite#hit
     * @type {string} - The name of hit area.
     */
    /**
     * Performs hit action on sprite.
     *
     * @param x - The x position in world space.
     * @param y - The y position in world space.
     *
     * @fires Live2DSprite#hit
     */
    hit(x: number, y: number) {
        this.model
            .hitTest((x - this.position.x) / this.scale.x, (y - this.position.y) / this.scale.y)
            .forEach(hitAreaName => this.emit('hit', hitAreaName));
    }

    /** @override */
    render(renderer: Renderer) {
        this.updateTransform();

        const wt = this.transform.worldTransform;
        const transform = this.modelTransform;

        // put sprite's 3x3 matrix into model's 4x4 matrix
        transform[0] = wt.a * this.drawingScaleX;
        transform[1] = wt.c * this.drawingScaleY;
        transform[4] = wt.b * this.drawingScaleX;
        transform[5] = wt.d * this.drawingScaleY;
        transform[12] = wt.tx * this.drawingScaleX;
        transform[13] = wt.ty * this.drawingScaleY;

        this.model.update(transform);
    }

    destroy() {
        this.model.release();
        super.destroy();
    }
}
