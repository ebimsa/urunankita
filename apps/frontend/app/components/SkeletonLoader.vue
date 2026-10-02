<script setup lang="ts">
withDefaults(
  defineProps<{
    variant?: 'lines' | 'card' | 'metrics' | 'table'
    lines?: number
    height?: string
    count?: number
  }>(),
  {
    variant: 'lines',
    lines: 3,
    height: 'h-4',
    count: 1,
  },
)
</script>

<template>
  <!-- 1. Variant: METRICS (Dua Kartu Keuangan Besar Neumorphic) -->
  <div v-if="variant === 'metrics'" class="grid grid-cols-1 lg:grid-cols-2 gap-5 sm:gap-6 animate-pulse">
    <div
      v-for="i in 2"
      :key="i"
      class="rounded-3xl bg-[#eaf0f7] shadow-[8px_8px_18px_#cad5e2,-8px_-8px_18px_#ffffff] border border-white/80 p-5 sm:p-6 space-y-4"
    >
      <div class="flex justify-between items-center pb-3 border-b border-slate-200/60">
        <div class="h-4 w-28 bg-[#cbd8e5] rounded-xl"></div>
        <div class="h-4 w-16 bg-[#cbd8e5] rounded-lg"></div>
      </div>
      <div class="space-y-2 py-2">
        <div class="h-3 w-32 bg-[#d8e3ef] rounded-md"></div>
        <div class="h-8 w-48 bg-[#cbd8e5] rounded-2xl"></div>
      </div>
      <div class="h-10 w-full bg-[#d8e3ef] rounded-2xl"></div>
    </div>
  </div>

  <!-- 2. Variant: CARD (Kartu Neumorphic Tunggal) -->
  <div v-else-if="variant === 'card'" class="space-y-4 animate-pulse">
    <div
      v-for="c in count"
      :key="c"
      class="rounded-3xl bg-[#eaf0f7] shadow-[8px_8px_18px_#cad5e2,-8px_-8px_18px_#ffffff] border border-white/80 p-5 sm:p-6 space-y-4"
    >
      <div class="flex items-center space-x-3">
        <div class="w-10 h-10 rounded-2xl bg-[#cbd8e5] flex-shrink-0"></div>
        <div class="space-y-1.5 flex-1">
          <div class="h-4 w-1/3 bg-[#cbd8e5] rounded-lg"></div>
          <div class="h-3 w-1/4 bg-[#d8e3ef] rounded-md"></div>
        </div>
      </div>
      <div class="space-y-2 pt-2">
        <div class="h-3.5 w-full bg-[#d8e3ef] rounded-md"></div>
        <div class="h-3.5 w-5/6 bg-[#d8e3ef] rounded-md"></div>
        <div class="h-3.5 w-2/3 bg-[#d8e3ef] rounded-md"></div>
      </div>
    </div>
  </div>

  <!-- 3. Variant: TABLE (Baris Daftar Tabular) -->
  <div v-else-if="variant === 'table'" class="space-y-3 animate-pulse">
    <div
      v-for="r in lines"
      :key="r"
      class="rounded-2xl bg-[#eaf0f7] p-3.5 sm:p-4 shadow-[inset_2px_2px_4px_#cbd7e5,inset_-2px_-2px_4px_#ffffff] flex items-center justify-between gap-3"
    >
      <div class="flex items-center space-x-3 flex-1 min-w-0">
        <div class="w-8 h-8 rounded-xl bg-[#cbd8e5] flex-shrink-0"></div>
        <div class="space-y-1.5 flex-1 min-w-0">
          <div class="h-3.5 w-2/5 bg-[#cbd8e5] rounded-md"></div>
          <div class="h-2.5 w-1/4 bg-[#d8e3ef] rounded-sm"></div>
        </div>
      </div>
      <div class="h-6 w-20 bg-[#cbd8e5] rounded-xl flex-shrink-0"></div>
    </div>
  </div>

  <!-- 4. Variant: LINES (Default Baris Teks Bervariasi) -->
  <div v-else class="space-y-2.5 animate-pulse">
    <div
      v-for="n in lines"
      :key="n"
      :class="[
        'rounded-xl bg-[#cbd8e5]',
        height,
        n % 3 === 1 ? 'w-full' : n % 3 === 2 ? 'w-4/5' : 'w-3/5',
      ]"
    ></div>
  </div>
</template>
