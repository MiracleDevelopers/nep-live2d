<template>
    <div :class="['slider', { pressed }]">
        <div class="label">
            <slot />
        </div>
        <div class="slider-wrapper">
            <div v-if="progress" class="progress" :style="{ width: position }"></div>
            <div ref="track" class="track">
                <div ref="thumb" :class="['thumb', { display: overlay }]" :style="{ left: position }">
                    <div ref="overlay" :class="['overlay', { visible: overlay }]">
                        <slot name="display">
                            {{ displayValue }}
                        </slot>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script lang="ts">
import Draggable from '@/core/utils/Draggable';
import { clamp } from '@/core/utils/math';
import ConfigBindingMixin from '@/module/config/reusable/ConfigBindingMixin';
import { Component, Mixins, Model, Prop, Ref } from 'vue-property-decorator';

@Component
export default class Slider extends Mixins(ConfigBindingMixin) {
    @Model('change', { default: 0 }) readonly value!: number;

    @Prop({ default: 1, type: Number }) readonly max!: number;
    @Prop({ default: 0, type: Number }) readonly min!: number;
    @Prop({ default: 0, type: Number }) readonly step!: number;
    @Prop({ default: false, type: Boolean }) readonly int!: boolean;
    @Prop({ default: false, type: Boolean }) readonly inverse!: boolean;
    @Prop({ default: false, type: Boolean }) readonly progress!: boolean;
    @Prop({ default: false, type: Boolean }) readonly overlay!: boolean;

    @Ref('track') track!: HTMLDivElement;
    @Ref('thumb') thumb!: HTMLDivElement;
    @Ref('overlay') overlayRef!: HTMLDivElement;

    domReady = false;
    reactFlag = false;

    pressed = false;

    get position() {
        // must access dependencies explicitly
        // @see http://optimizely.github.io/vuejs.org/guide/computed.html
        const fraction = (this.offsetValue - this.min) / (this.max - this.min);

        // a flag to force re-computation of the computed property
        // noinspection BadExpressionStatementJS
        this.reactFlag;

        return this.domReady ? fraction * (this.track.offsetWidth - this.thumb.offsetWidth) + 'px' : '0px';
    }

    get offsetValue() {
        const sum = this.min + this.max;
        return this.inverse ? sum - this.value : this.value;
    }

    get displayValue() {
        // keep at most 2 decimals
        return Math.round(this.offsetValue * 100) / 100;
    }

    mounted() {
        this.domReady = true;
        this.setupMovement();
    }

    activated() {
        // force update
        this.reactFlag = !this.reactFlag;
    }

    setupMovement() {
        let mouseOffsetX = 0;

        const draggableTrack = new Draggable(this.track);
        const draggableOverlay = new Draggable(this.overlayRef);

        draggableTrack.onStart = draggableOverlay.onStart = (e: MouseEvent) => {
            this.pressed = true;

            let mouseXInThumb = e.clientX - this.thumb.getBoundingClientRect().left;

            if (mouseXInThumb < 0 || mouseXInThumb > this.thumb.offsetWidth) {
                mouseXInThumb = this.thumb.offsetWidth / 2;
            }

            mouseOffsetX = mouseXInThumb + this.track.getBoundingClientRect().left;

            // perform a movement at start
            draggableTrack.onDrag(e);

            return true;
        };

        draggableTrack.onDrag = draggableOverlay.onDrag = (e: MouseEvent) => {
            const trackWidth = this.track.offsetWidth - this.thumb.offsetWidth;

            let value =
                (clamp(e.clientX - mouseOffsetX, 0, trackWidth) / trackWidth) * (this.max - this.min) + this.min;

            // snap the value
            value = this.step === 0 || value === this.max ? value : value - ((value - this.min) % this.step);

            if (value !== this.offsetValue) {
                if (this.int) {
                    value = ~~value;
                }

                if (this.inverse) {
                    value = this.min + this.max - value;
                }

                this.updateValue(value);
            }

            return true;
        };

        draggableTrack.onEnd = draggableOverlay.onEnd = () => (this.pressed = false);
    }
}
</script>

<style scoped lang="stylus">
@require './vars'

$height = 20px

.slider
    display flex
    width 240px
    padding 12px 16px
    align-items center

.slider-wrapper
    position relative
    flex-grow 1
    max-width 240px
    height $height

.progress
    position absolute
    top ($height / 4)
    height ($height / 2)
    background-color var(--accentColor)

    &:after
        content ''
        position absolute
        display block
        top 0
        right 0
        bottom 0
        left 0
        background-color #FFF9

.track
    position absolute
    top ($height / 4)
    width 100%
    height ($height / 2)
    background-color #0001
    box-shadow inset 0 0 4px #0002
    transition background-color .1s

.thumb
    position absolute
    z-index 1
    top -($height / 4)
    left 0
    width $height
    height $height
    background-color var(--accentColor)

.overlay
    position relative
    top -10px
    left -10px
    width $height * 2
    height $height * 2
    color #EEE0
    font-size $height
    line-height $height * 2
    overflow hidden
    white-space nowrap
    text-align center
    background-color var(--accentColor) !important
    box-shadow 0 0 5px 0 rgba(0, 0, 0, 0.3)
    transform scale(.5)
    transition transform .1s, color .1s

.pressed .track,
.track:hover,
.overlay:hover
    background-color #0002

    .visible
        color #EEE
        transform scale(1)
</style>
