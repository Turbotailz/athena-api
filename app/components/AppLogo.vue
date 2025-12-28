<template>
  <div class="flex items-center gap-2">
    <!-- Monochrome Icon (Current Color) -->
    <svg
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      class="text-primary-500 w-8 h-8 shrink-0"
    >
      <!-- The "A" / Lambda Shape -->
      <path
        d="M50 5 L90 95 H70 L55 55 L45 55 L30 95 H10 L50 5 Z"
        fill="currentColor"
      />
      <!-- The Crossbar (Line from bottom left) -->
      <path
        d="M25 65 L65 65 L60 75 L30 75 Z"
        fill="currentColor"
      />
    </svg>
    <!-- Project Name -->
    <span class="font-bold text-lg tracking-wide hidden md:block">
      Athena API
    </span>
  </div>
</template>
