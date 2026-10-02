<script setup lang="ts">
import { useToast } from '../composables/useToast'

const { toasts, remove } = useToast()
</script>

<template>
  <div
    class="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-[9999] flex flex-col space-y-2.5 max-w-sm w-full pointer-events-none px-3 sm:px-0"
    aria-live="polite"
    aria-label="Pemberitahuan"
  >
    <TransitionGroup name="toast">
      <div
        v-for="toast in toasts"
        :key="toast.id"
        class="pointer-events-auto rounded-2xl bg-[#eaf0f7] p-3.5 sm:p-4 shadow-[6px_6px_16px_#cad5e2,-6px_-6px_16px_#ffffff] border border-white/90 flex items-start space-x-3 transition-all duration-200"
      >
        <!-- Icon Container Neumorphic -->
        <div
          class="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 shadow-[2px_2px_5px_#cad5e2,-2px_-2px_5px_#ffffff]"
          :class="[
            toast.type === 'success' ? 'bg-[#007979] text-white' : '',
            toast.type === 'error' ? 'bg-[#E37434] text-white' : '',
            toast.type === 'warning' ? 'bg-[#f59e0b] text-white' : '',
            toast.type === 'info' ? 'bg-[#24B1B1] text-white' : '',
          ]"
        >
          <!-- Success Icon -->
          <svg
            v-if="toast.type === 'success'"
            class="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7" />
          </svg>

          <!-- Error Icon -->
          <svg
            v-else-if="toast.type === 'error'"
            class="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M6 18L18 6M6 6l12 12" />
          </svg>

          <!-- Warning Icon -->
          <svg
            v-else-if="toast.type === 'warning'"
            class="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>

          <!-- Info Icon -->
          <svg
            v-else
            class="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>

        <!-- Message Body -->
        <div class="flex-1 min-w-0 pt-0.5">
          <p class="text-xs font-bold text-slate-800 leading-snug break-words">
            {{ toast.message }}
          </p>
        </div>

        <!-- Dismiss Button -->
        <button
          @click="remove(toast.id)"
          class="w-6 h-6 rounded-lg text-slate-400 hover:text-slate-700 active:shadow-[inset_1px_1px_2px_#cad5e2] flex items-center justify-center transition-all flex-shrink-0"
          title="Tutup"
        >
          <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </TransitionGroup>
  </div>
</template>

<style scoped>
.toast-enter-active {
  transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
}
.toast-leave-active {
  transition: all 0.2s cubic-bezier(0.7, 0, 0.84, 0);
}
.toast-enter-from {
  opacity: 0;
  transform: translateY(16px) scale(0.94);
}
.toast-leave-to {
  opacity: 0;
  transform: translateY(8px) scale(0.96);
}
</style>
