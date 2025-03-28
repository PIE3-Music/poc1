<script setup lang="ts">
import { ref } from "vue";
import { GridLayout } from "grid-layout-plus";
import { onKeyDown } from "@vueuse/core";
import Waveform from "./components/Waveform.vue";
import type { Truc } from "./types/index";

const timelineDuration = ref(240);
const currentTime = ref(0); // Temps actuel
const isPlaying = ref(false);
const interval = ref<number | undefined>();

const audioTracks = ref<Truc[]>([]); // Stocke les fichiers audio

// Charger un fichier audio
const handleFileChange = (e: Event) => {
  const input = e.target as HTMLInputElement;
  const file = input?.files?.[0];
  if (!file) return;

  const url = URL.createObjectURL(file);
  const audio = new Audio(url);

  audio.onloadedmetadata = () => {
    const newTrack = {
      i: `audio-${file.name}`,
      x: 0,
      y: 0,
      w: Math.floor(audio.duration),
      maxW: Math.floor(audio.duration),
      h: 1,
      file,
      audio,
      isPlayed: false,
    };

    audioTracks.value.push(newTrack);
    console.log(`Audio ajouté (${newTrack.i}) - Durée: ${audio.duration}s`);
  };
};

// Démarrer la lecture
const playTimeline = () => {
  if (isPlaying.value) return;
  isPlaying.value = true;

  interval.value = setInterval(() => {
    currentTime.value += 0.01;

    audioTracks.value.forEach((track) => {
      if (!track.isPlayed && currentTime.value >= track.x) {
        track.audio.currentTime = currentTime.value - track.x;
        track.audio.play();
        track.isPlayed = true;
      }
      if (track.audio.currentTime >= track.w) {
        track.audio.pause();
        track.audio.currentTime = 0;
        track.isPlayed = false;
      }
    });

    if (currentTime.value >= timelineDuration.value) stopTimeline();
  }, 10);
};

// Arrêter la lecture
const stopTimeline = () => {
  clearInterval(interval.value);
  isPlaying.value = false;
  currentTime.value = 0;

  audioTracks.value.forEach((track) => {
    track.audio.pause();
    track.audio.currentTime = 0;
    track.isPlayed = false;
  });
};

// Mettre en pause
const pauseTimeline = () => {
  clearInterval(interval.value);
  isPlaying.value = false;
  audioTracks.value.forEach((track) => {
    track.audio.pause();
    track.isPlayed = false;
  });
};

onKeyDown([" "], (event) => {
  event.preventDefault();
  if (isPlaying.value) {
    stopTimeline();
  } else {
    playTimeline();
  }
});
</script>

<template>
  <div>
    <input type="file" @change="handleFileChange" accept="audio/*,.opus" />

    <div>
      <p>Temps actuel : {{ currentTime.toFixed(2) }}s</p>
      <input
        type="range"
        min="0"
        :max="timelineDuration"
        step="0.1"
        v-model.number="currentTime"
      />
      <button @click="playTimeline">▶️ Jouer</button>
      <button @click="pauseTimeline">⏸️ Pause</button>
      <button @click="stopTimeline">⏹️ Stop</button>
    </div>
  </div>

  <div class="grid">
    <GridLayout
      v-model:layout="audioTracks"
      :col-num="240"
      :margin="[0, 0]"
      is-draggable
      is-resizable
      vertical-compact
      use-css-transforms
    >
      <template #item="{ item }">
        <div class="item">
          {{ item.i }}
          <Waveform :item="item as Truc" />
        </div>
      </template>
    </GridLayout>

    <!-- Curseur de lecture -->
    <div
      class="cursor"
      :style="{ left: (currentTime / timelineDuration) * 100 + '%' }"
    ></div>
  </div>
</template>

<style scoped>
.item {
  border: 1px solid #ccc;
  width: 100%;
  height: 100%;
}

.vgl-layout {
  background-color: #eee;
}

.vgl-layout::before {
  position: absolute;
  width: 100%;
  height: 100%;
  content: "";
  background-image: linear-gradient(to right, lightgrey 1px, transparent 1px),
    linear-gradient(to bottom, lightgrey 1px, transparent 1px);
  background-repeat: repeat;
  background-size: calc(calc(100%) / 240) 40px;
}

:deep(.vgl-item:not(.vgl-item--placeholder)) {
  background-color: #ccc;
  border: 1px solid black;
}

:deep(.vgl-item--resizing) {
  opacity: 90%;
}

:deep(.vgl-item--static) {
  background-color: #cce;
}
.grid {
  position: relative;
  width: 100%;
  height: 100%;
}

.cursor {
  position: absolute;
  width: 2px;
  height: 100%;
  background-color: red;
  top: 50%;
  transform: translate(-50%, -50%);
}
</style>
