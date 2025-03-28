<script setup lang="ts">
import { toRefs, useTemplateRef } from "vue";
import {
  Waveform,
  type IWaveCoreOptions,
  type IWaveLayoutOptions,
} from "waveform-visualizer";
import { useAudioWaveform } from "../composables/useAudioWaveform";
import type { Truc } from "../types";

const props = defineProps<{ item: Truc }>();
const { item } = toRefs(props);
const canvas = useTemplateRef<HTMLCanvasElement>("waveform");
const { peaks, onPeakReload } = useAudioWaveform(item);

onPeakReload(() => {
  if (!canvas.value) return;
  const waveLayoutOptions: IWaveLayoutOptions = {
    waveTopPercentage: 50,
  };
  const waveCoreOptions: IWaveCoreOptions = {
    layout: waveLayoutOptions,
    data: peaks.value,
  };
  const waveform = new Waveform(waveCoreOptions);
  waveform.setCanvasElement(canvas.value);
  waveform.draw();
});
</script>

<template>
  <canvas ref="waveform"></canvas>
</template>

<style scoped>
canvas {
  width: 100%;
  height: 100%;
}
</style>
