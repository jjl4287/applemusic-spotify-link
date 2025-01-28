<template>
  <div class="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 py-8">
    <div class="container max-w-5xl mx-auto px-[clamp(1rem,4vw,2rem)]">
      <div class="backdrop-blur-xl bg-white/10 rounded-2xl shadow-lg p-8 mb-8 border border-white/10">
        <h1 class="text-3xl font-bold text-left text-white mb-8 font-decorative">Convert Music Links</h1>
        <div class="flex gap-[clamp(1rem,2vw,1.5rem)] mb-[clamp(1.5rem,3vw,2rem)]">
          <input 
            v-model="appleUrl" 
            type="text" 
            placeholder="Paste Apple Music URL here"
            @keyup.enter="convertLink"
            class="flex-1 px-4 py-3 rounded-xl border border-white/20 bg-white/5 text-white focus:border-white/40 focus:outline-none transition-colors placeholder-white/50 font-mono"
          >
          <button 
            @click="convertLink" 
            :disabled="isLoading"
            class="hover-transform click-effect px-6 py-3 bg-primary-purple/80 text-white rounded-xl hover:bg-primary-purple-light/80 disabled:bg-white/5 disabled:text-white/30 disabled:cursor-not-allowed transition-colors font-medium backdrop-blur-sm border border-white/10 font-mono"
          >
            {{ isLoading ? 'Converting...' : 'Convert' }}
          </button>
        </div>

        <div v-if="result" class="backdrop-blur-md bg-white/5 rounded-xl p-6 border border-white/10 fade-in">
          <div class="flex gap-[clamp(1.5rem,3vw,2rem)]">
            <img v-if="result.album_art" :src="result.album_art" :alt="result.title" class="w-64 h-64 object-cover rounded-lg shadow-xl" />
            <div class="flex-1 flex flex-col">
              <div class="flex-1">
                <div class="flex items-center justify-between mb-4">
                  <h3 class="text-2xl font-medium text-white">{{ result.title }} by {{ result.artist }}</h3>
                  <span class="px-3 py-1 bg-white/10 rounded-full text-white/80 text-sm uppercase tracking-wide">{{ result.content_type }}</span>
                </div>
                <div v-if="result.album" class="text-white/70 mb-2">Album: {{ result.album }}</div>
                <div v-if="result.release_date" class="text-white/70 mb-4">Released: {{ new Date(result.release_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) }}</div>
              </div>
              <div v-if="!result.error" class="flex gap-4">
                <a 
                  :href="result.spotify_url" 
                  target="_blank" 
                  rel="noopener"
                  class="flex-1 px-6 py-3 bg-primary-purple/80 text-white rounded-xl hover:bg-primary-purple-light/80 transition-colors text-center font-medium backdrop-blur-sm border border-white/10"
                >
                  Open in Spotify
                </a>
                <button 
                  @click="copyToClipboard"
                  class="px-6 py-3 bg-secondary-purple/80 text-white rounded-xl hover:bg-secondary-purple-dark/80 transition-colors font-medium backdrop-blur-sm border border-white/10"
                >
                  Copy Link
                </button>
              </div>
              <div v-else class="text-red-600 text-sm">
                {{ result.error }}
              </div>
            </div>
          </div>
        </div>

        <div v-if="error" class="text-red-600 bg-red-50 rounded-xl p-4 mb-6">
          {{ error }}
        </div>
      </div>

      <!-- Conversion History -->
      <div v-if="history.length > 0" class="backdrop-blur-xl bg-white/10 rounded-2xl shadow-lg p-8 border border-white/10">
        <h2 class="text-2xl font-semibold mb-6 text-white font-mono">Conversion History</h2>
        <div class="space-y-4">
          <div 
            v-for="(item, index) in history" 
            :key="index"
            class="backdrop-blur-md bg-white/5 rounded-xl p-6 border border-white/10"
          >
            <div class="flex gap-[clamp(1.5rem,3vw,2rem)]">
              <img v-if="item.album_art" :src="item.album_art" :alt="item.title" class="w-64 h-64 object-cover rounded-lg shadow-xl" />
              <div class="flex-1 flex flex-col">
                <div class="flex-1">
                  <div class="flex items-center justify-between mb-4">
                    <h3 class="text-2xl font-medium text-white">{{ item.title }} by {{ item.artist }}</h3>
                    <span class="px-3 py-1 bg-white/10 rounded-full text-white/80 text-sm uppercase tracking-wide">{{ item.content_type }}</span>
                  </div>
                  <div v-if="item.album" class="text-white/70 mb-2">Album: {{ item.album }}</div>
                  <div v-if="item.release_date" class="text-white/70 mb-4">Released: {{ new Date(item.release_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) }}</div>
                </div>
                <div v-if="!item.error" class="flex gap-4">
                  <a 
                    :href="item.spotify_url" 
                    target="_blank" 
                    rel="noopener"
                    class="flex-1 px-6 py-3 bg-primary-purple/80 text-white rounded-xl hover:bg-primary-purple-light/80 transition-colors text-center font-medium backdrop-blur-sm border border-white/10"
                  >
                    Open in Spotify
                  </a>
                  <button 
                    @click="() => copyHistoryLink(item.spotify_url)" 
                    class="px-6 py-3 bg-secondary-purple/80 text-white rounded-xl hover:bg-secondary-purple-dark/80 transition-colors font-medium backdrop-blur-sm border border-white/10"
                  >
                    Copy Link
                  </button>
                </div>
                <div v-else class="text-red-600 text-sm">
                  {{ item.error }}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref } from 'vue'
import axios from 'axios'
import { useMotion } from '@vueuse/motion'
import '@fontsource/playfair-display/400.css'
import '@fontsource/playfair-display/700.css'
import '@fontsource/fira-code/400.css'
import '@fontsource/fira-code/500.css'
import '@fontsource/fira-code/600.css'

export default {
  setup() {
    const appleUrl = ref('')
    const result = ref(null)
    const error = ref('')
    const isLoading = ref(false)
    const history = ref(JSON.parse(localStorage.getItem('conversionHistory') || '[]'))

    const saveHistory = () => {
      localStorage.setItem('conversionHistory', JSON.stringify(history.value))
    }

    const convertLink = async () => {
      if (!appleUrl.value) {
        error.value = 'Please enter an Apple Music URL'
        return
      }

      isLoading.value = true
      error.value = ''
      result.value = null

      try {
        const response = await axios.post('http://localhost:8000/convert', {
          apple_music_url: appleUrl.value
        })
        result.value = response.data
        if (result.value) {
          history.value.unshift({ ...result.value })
          saveHistory()
        }
      } catch (e) {
        error.value = e.response?.data?.detail || 'An error occurred'
      } finally {
        isLoading.value = false
      }
    }

    const copyToClipboard = () => {
      if (result.value?.spotify_url) {
        navigator.clipboard.writeText(result.value.spotify_url)
      }
    }

    const copyHistoryLink = (url) => {
      navigator.clipboard.writeText(url)
    }

    return {
      appleUrl,
      result,
      error,
      isLoading,
      history,
      convertLink,
      copyToClipboard,
      copyHistoryLink
    }
  }
}
</script>

<style>
/* Using @fontsource packages instead of Google Fonts */

:root {
  --primary-purple: #9d4edd;
  --primary-purple-light: #b589df;
  --secondary-purple: #4a1259;
  --secondary-purple-dark: #2f0a3c;
}

@tailwind base;
@tailwind components;
@tailwind utilities;

.backdrop-blur-xl {
  backdrop-filter: blur(20px);
}

.backdrop-blur-md {
  backdrop-filter: blur(12px);
}

.shadow-xl {
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.2), 0 10px 10px -5px rgba(0, 0, 0, 0.1);
}

.font-serif {
  font-family: 'Sorts Mill Goudy', serif;
  font-feature-settings: "liga" 1, "dlig" 1, "swsh" 1;
  text-rendering: optimizeLegibility;
}

.font-mono {
  font-family: "Fira Code", "Fira Mono", Menlo, Consolas, "DejaVu Sans Mono", monospace;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}

.fade-in {
  animation: fadeIn 0.6s ease-out;
}

.hover-transform {
  transition: transform 0.3s ease;
}

.hover-transform:hover {
  transform: translateY(-2px);
}

.click-effect {
  transition: transform 0.1s ease;
}

.click-effect:active {
  transform: scale(0.98);
}
</style>