import { ref, onMounted, type Ref, watch, computed } from "vue";
import type { Truc } from "../types";

export function useAudioWaveform(item: Ref<Truc>) {
  const peaks = ref<number[]>([]);
  const finalPeaks = computed(() => peaks.value.slice(0, item.value.w));

  watch(finalPeaks, () => {
    onPeakReloadCallbacks.forEach((callback) => callback());
  });

  const onPeakReloadCallbacks: (() => void)[] = [];
  const onPeakReload = (callback: () => void) => {
    onPeakReloadCallbacks.push(callback);
  };

  onMounted(async () => {
    if (!item.value.audio) return;

    const audioContext = new AudioContext();
    const response = await fetch(item.value.audio.src);
    const arrayBuffer = await response.arrayBuffer();
    const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);

    const channelData = audioBuffer.getChannelData(0);
    const samples = item.value.w;

    const blockSize = Math.floor(channelData.length / samples);
    const peakValues = new Array(samples).fill(0);

    // la taille de base de la musique est Math.floor(item.audio.duration)
    // la taille réelle après redimension est item.w, ça doit etre notre nombre de sample

    for (let i = 0; i < samples; i++) {
      let sum = 0;
      for (let j = 0; j < blockSize; j++) {
        sum += Math.abs(channelData[i * blockSize + j]);
      }
      peakValues[i] = (sum / blockSize) * 100; // Normalisation 0-100
    }

    peaks.value = peakValues;
    onPeakReloadCallbacks.forEach((callback) => callback());
  });

  return { peaks: finalPeaks, onPeakReload };
}
