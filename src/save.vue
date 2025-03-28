<script setup>
import { ref, onMounted, onUnmounted, computed, watch } from "vue";
import { defineComponent } from "vue";
import { GridLayout, GridItem } from "grid-layout-plus";
import { reactive } from "vue";
import WaveSurfer from "wavesurfer.js";
import { onKeyDown } from "@vueuse/core";

const layout = reactive([]);

const audioFile = ref(null);
const audioUrl = ref(null);
const audio = ref(null);
const duration = ref(0);
const currentTime = ref(0);
const intervalId = ref(null);

const cssTimelinePercent = computed(() => {
  return `${(currentTime.value / duration.value) * 100}%`;
});

const handleFileChange = (event) => {
  const file = event.target.files[0];
  if (file) {
    audioUrl.value = URL.createObjectURL(file);
    audio.value = new Audio(audioUrl.value);

    // Charger les infos du fichier
    audio.value.onloadedmetadata = () => {
      duration.value = audio.value.duration.toFixed(2);
    };

    // Mettre à jour le temps actuel
    audio.value.ontimeupdate = () => {
      currentTime.value = audio.value.currentTime.toFixed(2);
    };

    layout.push({
      i: "audio",
      x: 0,
      y: 0,
      w: 1,
      h: 1,
    });
  }
};

const playAudio = () => {
  if (audio.value) {
    audio.value.play();
    startUpdatingCurrentTime();
  }
};

const pauseAudio = () => {
  if (audio.value) {
    audio.value.pause();
    stopUpdatingCurrentTime();
  }
};

onKeyDown([" "], (event) => {
  event.preventDefault();
  if (audio.value) {
    if (audio.value.paused) {
      playAudio();
    } else {
      pauseAudio();
    }
  }
});

const startUpdatingCurrentTime = () => {
  intervalId.value = setInterval(() => {
    if (audio.value) {
      currentTime.value = audio.value.currentTime.toFixed(2);
    }
  }, 100);
};

const stopUpdatingCurrentTime = () => {
  if (intervalId.value) {
    clearInterval(intervalId.value);
    intervalId.value = null;
  }
};

const handleSeek = (event) => {
  if (audio.value) {
    audio.value.currentTime = event.target.value;
    currentTime.value = event.target.value;
  }
};

watch(
  () => layout[0]?.x,
  (newX) => {
    if (audio.value) {
      const newTime = Math.max(0, Math.min(duration.value, newX)); // Limiter entre 0 et la durée
      audio.value.currentTime = newTime;
      currentTime.value = newTime;
    }
  }
);

onUnmounted(() => {
  stopUpdatingCurrentTime();
});
</script>

<template>
  <div>
    <input type="file" @change="handleFileChange" accept="audio/*,.opus" />

    <div v-if="audioUrl">
      <p>Durée : {{ duration }}s</p>
      <p>Temps actuel : {{ currentTime }}s</p>
      <input
        type="range"
        min="0"
        :max="duration"
        step="0.01"
        :value="currentTime"
        @input="handleSeek"
      />
      <button @click="playAudio">▶️ Jouer</button>
      <button @click="pauseAudio">⏸️ Pause</button>
    </div>
  </div>
  <div class="grid">
    <GridLayout
      v-model:layout="layout"
      :col-num="12"
      :row-height="30"
      is-draggable
      is-resizable
      vertical-compact
      use-css-transforms
    >
      <template #item="{ item }">
        <div class="item">{{ item.i }}</div>
      </template>
    </GridLayout>
    <div class="cursor"></div>
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
  width: calc(100% - 5px);
  height: calc(100% - 5px);
  margin: 5px;
  content: "";
  background-image: linear-gradient(to right, lightgrey 1px, transparent 1px),
    linear-gradient(to bottom, lightgrey 1px, transparent 1px);
  background-repeat: repeat;
  background-size: calc(calc(100% - 5px) / 12) 40px;
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
  left: v-bind(cssTimelinePercent);
  transform: translate(-50%, -50%);
}
</style>
