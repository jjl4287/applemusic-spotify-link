<template>
  <div class="min-h-screen bg-gradient-to-br from-[#2C2824] to-[#1A1816] py-[clamp(2rem,4vw,3rem)] transition-all duration-300">
    <div class="container max-w-6xl mx-auto px-[clamp(1rem,4vw,2rem)]">
      <div class="backdrop-blur-xl bg-white/10 rounded-2xl shadow-lg p-[clamp(1.5rem,3vw,2rem)] mb-[clamp(1.5rem,3vw,2rem)] border border-white/10">
        <h1 class="text-4xl font-medium text-left text-white mb-[clamp(1.5rem,3vw,2rem)] font-playfair">Convert Music Links</h1>
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
            class="hover-transform click-effect shadow-button px-6 py-3 bg-primary-purple/80 text-white rounded-xl hover:bg-primary-purple-light/80 disabled:bg-white/5 disabled:text-white/30 disabled:cursor-not-allowed transition-colors font-medium backdrop-blur-sm border border-white/10 font-mono"
          >
            {{ isLoading ? 'Converting...' : 'Convert' }}
          </button>
        </div>

        <transition
          enter-active-class="transition-all duration-500 ease-out"
          enter-from-class="opacity-0 transform translate-y-4"
          enter-to-class="opacity-100 transform translate-y-0"
          leave-active-class="transition-all duration-300 ease-in"
          leave-from-class="opacity-100 transform translate-y-0"
          leave-to-class="opacity-0 transform translate-y-4"
        >
          <div v-if="result" class="backdrop-blur-md bg-white/5 rounded-xl p-6 border border-white/10 mb-8">
            <div class="flex gap-[clamp(1.5rem,3vw,2rem)]">
              <img v-if="result.album_art" :src="result.album_art" :alt="result.title" class="w-64 h-64 object-cover rounded-lg shadow-xl" />
              <div class="flex-1 flex flex-col">
                <div class="flex-1">
                  <div class="flex items-center justify-between mb-4">
                    <h3 class="text-2xl font-medium text-white font-playfair">{{ result.content_type === 'artist' ? result.artist : `${result.title} by ${result.artist}` }}</h3>
                    <span class="px-3 py-1 bg-white/10 rounded-full text-white/80 text-sm uppercase tracking-wide">{{ result.content_type }}</span>
                  </div>
                  <div v-if="result.content_type !== 'artist' && result.album" class="text-white/70 mb-2 text-lg">Album: {{ result.album }}</div>
                  <div v-if="result.content_type !== 'artist' && result.release_date" class="text-white/70 mb-4 text-lg">Released: {{ new Date(result.release_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) }}</div>
                  <div v-if="result.content_type === 'artist' && result.genres && result.genres.length" class="text-white/70 mb-4 text-lg">Genres: {{ result.genres.join(', ') }}</div>
                </div>
                <div v-if="!result.error" class="flex gap-4">
                  <a 
                    :href="result.spotify_url" 
                    target="_blank" 
                    rel="noopener"
                    class="flex-1 hover-transform click-effect shadow-button px-6 py-3 bg-primary-purple/80 text-white rounded-xl hover:bg-primary-purple-light/80 transition-colors text-center font-medium backdrop-blur-sm border border-white/10"
                  >
                    Open in Spotify
                  </a>
                  <button 
                    @click="copyToClipboard"
                    class="hover-transform click-effect shadow-button px-6 py-3 bg-secondary-purple/80 text-white rounded-xl hover:bg-secondary-purple-dark/80 transition-colors font-medium backdrop-blur-sm border border-white/10"
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
        </transition>

        <transition
          enter-active-class="transition-all duration-500 ease-out"
          enter-from-class="opacity-0 transform translate-y-4"
          enter-to-class="opacity-100 transform translate-y-0"
          leave-active-class="transition-all duration-300 ease-in"
          leave-from-class="opacity-100 transform translate-y-0"
          leave-to-class="opacity-0 transform translate-y-4"
        >
          <div v-if="error" class="text-red-600 bg-red-50 rounded-xl p-4 mb-6">
            {{ error }}
          </div>
        </transition>

        <!-- Conversion History -->
        <transition
          enter-active-class="transition-all duration-500 ease-out"
          enter-from-class="opacity-0 transform translate-y-4"
          enter-to-class="opacity-100 transform translate-y-0"
          leave-active-class="transition-all duration-300 ease-in"
          leave-from-class="opacity-100 transform translate-y-0"
          leave-to-class="opacity-0 transform translate-y-4"
        >
          <div v-if="history.length > 0 && result" class="backdrop-blur-xl bg-white/10 rounded-2xl shadow-lg p-8 border border-white/10">
            <h2 class="text-3xl font-bold mb-6 text-white font-playfair">Conversion History</h2>
            <transition-group
              tag="div"
              class="space-y-4"
              enter-active-class="transition-all duration-500 ease-out"
              enter-from-class="opacity-0 transform translate-y-4"
              enter-to-class="opacity-100 transform translate-y-0"
              leave-active-class="transition-all duration-300 ease-in"
              leave-from-class="opacity-100 transform translate-y-0"
              leave-to-class="opacity-0 transform translate-y-4"
              move-class="transition-transform duration-500"
            >
              <div 
                v-for="(item, index) in history.slice(1)" 
                :key="index"
                class="backdrop-blur-md bg-white/5 rounded-xl p-6 border border-white/10"
              >
                <div class="flex gap-[clamp(1.5rem,3vw,2rem)]">
                  <img v-if="item.album_art" :src="item.album_art" :alt="item.title" class="w-64 h-64 object-cover rounded-lg shadow-xl" />
                  <div class="flex-1 flex flex-col">
                    <div class="flex-1">
                      <div class="flex items-center justify-between mb-4">
                        <h3 class="text-2xl font-medium text-white font-playfair">
                          {{ item.content_type === 'artist' ? item.artist : `${item.title} by ${item.artist}` }}
                        </h3>
                        <span class="px-3 py-1 bg-white/10 rounded-full text-white/80 text-sm uppercase tracking-wide">{{ item.content_type }}</span>
                      </div>
                      <div v-if="item.content_type !== 'artist' && item.album" class="text-white/70 mb-2 text-lg">Album: {{ item.album }}</div>
                      <div v-if="item.content_type !== 'artist' && item.release_date" class="text-white/70 mb-4 text-lg">Released: {{ new Date(item.release_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) }}</div>
                      <div v-if="item.content_type === 'artist' && item.genres && item.genres.length" class="text-white/70 mb-4 text-lg">Genres: {{ item.genres.join(', ') }}</div>
                    </div>
                    <div v-if="!item.error" class="flex gap-4">
                      <a 
                        :href="item.spotify_url" 
                        target="_blank" 
                        rel="noopener"
                        class="flex-1 hover-transform click-effect shadow-button px-6 py-3 bg-primary-purple/80 text-white rounded-xl hover:bg-primary-purple-light/80 transition-colors text-center font-medium backdrop-blur-sm border border-white/10"
                      >
                        Open in Spotify
                      </a>
                      <button 
                        @click="() => copyHistoryLink(item.spotify_url)" 
                        class="hover-transform click-effect shadow-button px-6 py-3 bg-secondary-purple/80 text-white rounded-xl hover:bg-secondary-purple-dark/80 transition-colors font-medium backdrop-blur-sm border border-white/10"
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
            </transition-group>
          </div>
        </transition>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import axios from 'axios'
import { useMotion } from '@vueuse/motion'
import '@fontsource/playfair-display/400.css'
import '@fontsource/playfair-display/700.css'
import '@fontsource/fira-code/400.css'
import '@fontsource/fira-code/500.css'
import '@fontsource/fira-code/600.css'

const appleUrl = ref('')
const result = ref(null)
const error = ref('')
const isLoading = ref(false)
const history = ref([])

// Load history when component is mounted
onMounted(() => {
  const savedHistory = localStorage.getItem('conversionHistory')
  if (savedHistory) {
    history.value = JSON.parse(savedHistory)
  }
})

const saveHistory = () => {
  localStorage.setItem('conversionHistory', JSON.stringify(history.value))
}

// Configure axios base URL
axios.defaults.baseURL = 'https://backend-967436713449.us-central1.run.app'

const convertLink = async (e) => {
  if (e) e.preventDefault()
  
  if (!appleUrl.value) {
    error.value = 'Please enter an Apple Music URL'
    return
  }
  
  isLoading.value = true
  error.value = ''
  console.log('Attempting API request to /api/convert with URL:', appleUrl.value)
  
  try {
    console.log('Making API request...')
    const response = await axios.post('/api/convert', {
      apple_music_url: appleUrl.value
    })
    console.log('API Response:', response)
    result.value = response.data
    
    // Add to history
    history.value = [response.data, ...history.value]
    saveHistory()
    
    // Clear input
    appleUrl.value = ''
  } catch (err) {
    console.error('API Error:', {
      status: err.response?.status,
      statusText: err.response?.statusText,
      data: err.response?.data,
      config: {
        url: err.config?.url,
        method: err.config?.method,
        headers: err.config?.headers
      }
    })
    error.value = err.response?.data?.error || 
      `Error (${err.response?.status || 'unknown'}): ${err.response?.statusText || 'An error occurred while converting the link'}`
  } finally {
    isLoading.value = false
  }
}

const copyToClipboard = async () => {
  if (result.value?.spotify_url) {
    try {
      await navigator.clipboard.writeText(result.value.spotify_url)
    } catch (err) {
      console.error('Failed to copy to clipboard:', err)
    }
  }
}

const copyHistoryLink = async (url) => {
  try {
    await navigator.clipboard.writeText(url)
  } catch (err) {
    console.error('Failed to copy to clipboard:', err)
  }
}
</script>

<style>
:root {
  --primary-purple: #9d4edd;
  --primary-purple-light: #b589df;
  --secondary-purple: #4a1259;
  --secondary-purple-dark: #2f0a3c;
}

.hover-transform {
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.hover-transform:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 15px -3px rgba(0, 0, 0, 0.2);
}

.click-effect:active {
  transform: scale(0.98) translateY(1px);
  box-shadow: 0 2px 4px -1px rgba(0, 0, 0, 0.1);
}

.shadow-button {
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
  transition: box-shadow 0.2s ease;
}

.shadow-button:hover {
  box-shadow: 0 6px 12px -2px rgba(0, 0, 0, 0.15), 0 3px 6px -2px rgba(0, 0, 0, 0.1);
}

.backdrop-blur-xl {
  backdrop-filter: blur(20px);
}

.backdrop-blur-md {
  backdrop-filter: blur(12px);
}

.shadow-xl {
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.2), 0 10px 10px -5px rgba(0, 0, 0, 0.1);
}
</style>