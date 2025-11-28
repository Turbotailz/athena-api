<template>
  <div class="flex items-center gap-2">
    <svg
      width="24"
      height="24"
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      class="text-primary-500"
    >
      <!-- Outer Ring (Broken at top) -->
      <path
        d="M85.3553 14.6447C94.7434 24.0328 99.9996 36.7571 100 50C100 77.6142 77.6142 100 50 100C22.3858 100 0 77.6142 0 50C0.00043869 36.7571 5.25661 24.0328 14.6447 14.6447L21.7157 21.7157C14.2144 29.2171 10.0004 39.3879 10 50C10 72.0914 27.9086 90 50 90C72.0914 90 90 72.0914 90 50C89.9996 39.3879 85.7856 29.2171 78.2843 21.7157L85.3553 14.6447Z"
        fill="currentColor"
      />
      <!-- Inner "Hands" (V shape) -->
      <path
        d="M20 20 L40 50 L25 50 L15 25 Z" 
        fill="currentColor" 
        opacity="0"
      />
      <!-- Simplified Overwatch-ish logo elements -->
      <!-- Top Left segment -->
      <path
        d="M22 22C30 14 40 10 50 10C60 10 70 14 78 22L70 30C65 25 58 22 50 22C42 22 35 25 30 30L22 22Z"
        fill="currentColor"
      />
      <!-- Center Chevron -->
      <path
        d="M30 35 L50 65 L70 35 L80 45 L50 90 L20 45 L30 35Z"
        fill="currentColor"
      />
    </svg>
    <span class="font-bold text-xl leading-none tracking-tight">
      Overwatch Hero API
    </span>
  </div>
</template>
