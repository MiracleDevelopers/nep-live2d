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
                            {{ Math.round(value * 100) / 100 }}
                        </slot>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script lang="ts">
import { movable } from '@/core/utils/dom';
import { clamp } from '@/core/utils/math';
import Vue from 'vue';
import { Component, Model, Prop, Ref } from 'vue-property-decorator';

@Component
export default class Slider extends Vue {
    @Model('change', { default: 0 }) readonly value!: number;
    @Prop({ default: 1 }) readonly max!: number;
    @Prop({ default: 0 }) readonly min!: number;
    @Prop({ default: 0 }) readonly step!: number;
    @Prop({ default: false, type: Boolean }) readonly progress!: boolean;
    @Prop({ default: false, type: Boolean }) readonly overlay!: boolean;

    @Ref('track') track!: HTMLDivElement;
    @Ref('thumb') thumb!: HTMLDivElement;
    @Ref('overlay') overlayRef!: HTMLDivElement;

    domReady = false;

    pressed = false;

    get position() {
        // must access dependencies explicitly
        // @see http://optimizely.github.io/vuejs.org/guide/computed.html
        const fraction = (this.value - this.min) / (this.max - this.min);

        return this.domReady ? fraction * (this.track.offsetWidth - this.thumb.offsetWidth) + 'px' : '0px';
    }

    private mounted() {
        this.domReady = true;
        this.setupMovement();
    }

    private setupMovement() {
        let mouseOffsetX = 0;

        const moveListeners = {
            start: (e: MouseEvent) => {
                this.pressed = true;

                let mouseXInThumb = e.clientX - this.thumb.getBoundingClientRect().left;

                if (mouseXInThumb < 0 || mouseXInThumb > this.thumb.offsetWidth) {
                    mouseXInThumb = this.thumb.offsetWidth / 2;
                }

                mouseOffsetX = mouseXInThumb + this.track.getBoundingClientRect().left;

                moveListeners.move(e);
            },

            move: (e: MouseEvent) => {
                const trackWidth = this.track.offsetWidth - this.thumb.offsetWidth;

                const value =
                    (clamp(e.clientX - mouseOffsetX, 0, trackWidth) / trackWidth) * (this.max - this.min) + this.min;

                const snappedValue =
                    this.step === 0 || value === this.max ? value : value - ((value - this.min) % this.step);

                if (snappedValue !== this.value) {
                    this.$emit('change', snappedValue);
                }
            },

            end: () => (this.pressed = false),
        };

        movable(this.track, undefined, moveListeners);
        movable(this.overlayRef, undefined, moveListeners);
    }
}
</script>

<style scoped lang="stylus">
@require './vars'

.slider
    display flex
    width 240px
    padding 16px 8px

.label
    width 30%

.slider-wrapper
    position relative
    flex-grow 1
    height 20px

.progress
    position absolute
    height 100%
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
    width 100%
    height 100%
    background-color #0001
    transition background-color .1s

.thumb
    position absolute
    z-index 1
    top 0
    left 0
    width 20px
    height 20px
    background-color var(--accentColor)
    box-shadow 0 0 5px 0 rgba(0, 0, 0, 0.3)

.overlay
    position relative
    top -10px
    left -10px
    width 40px
    height 40px
    color #EEE0
    font-size 20px
    line-height 40px
    overflow hidden
    white-space nowrap
    text-align center
    background-color var(--accentColor) !important
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