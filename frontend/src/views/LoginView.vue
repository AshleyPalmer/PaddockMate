<script setup lang="ts">
import { ref } from "vue";
import { useRouter } from "vue-router";
import PmButton from "../components/ui/PmButton.vue";
import PmCard from "../components/ui/PmCard.vue";
import PmInput from "../components/ui/PmInput.vue";

const router = useRouter();

// Form state
const email = ref("");
const password = ref("");
const trustDevice = ref(true);

// Validation errors
const emailError = ref("");
const passwordError = ref("");

function handleContinueOffline() {
  router.push("/track-days/new");
}

function handleSignIn() {
  emailError.value = "";
  passwordError.value = "";

  let hasError = false;
  if (!email.value.trim()) {
    emailError.value = "Email is required";
    hasError = true;
  }
  if (!password.value.trim()) {
    passwordError.value = "Password is required";
    hasError = true;
  }

  if (hasError) {
    return;
  }

  // Navigate to track day setup upon authenticated sign in
  router.push("/track-days/new");
}
</script>

<template>
  <div class="min-h-screen bg-[#0b0f17] text-white">
    <main class="mx-auto flex w-full max-w-md flex-col px-4 py-8 pb-20 sm:py-12">
      <!-- PaddockMate Logo Header -->
      <header class="mb-8 flex items-center justify-between">
        <div class="flex items-center gap-2.5">
          <div class="flex items-center gap-1" aria-hidden="true">
            <span class="h-6 w-1.5 rounded-full bg-[#d4f933]"></span>
            <span class="h-6 w-1.5 rounded-full bg-[#d4f933]"></span>
          </div>
          <span class="font-mono text-xl font-black tracking-widest text-white">PADDOCKMATE</span>
        </div>
        <span
          class="rounded-full border border-[#2d3748] bg-[#161b22] px-2.5 py-1 font-mono text-[11px] font-bold tracking-wider text-[#d4f933]"
        >
          OFFLINE FIRST
        </span>
      </header>

      <div class="space-y-6">
        <!-- Hero Banner Matching Figma Frame 1 -->
        <section
          class="relative overflow-hidden rounded-2xl border border-[#2d3748] bg-gradient-to-b from-[#161b22] to-[#0b0f17] p-6 shadow-xl"
          aria-label="Hero banner"
        >
          <div class="space-y-2">
            <div class="font-mono text-xs font-bold tracking-widest text-[#d4f933] uppercase">
              BUILT FOR THE PIT LANE
            </div>
            <h1 class="text-2xl font-black tracking-tight text-white uppercase sm:text-3xl">
              LESS GUESSWORK. MORE GOOD LAPS.
            </h1>
            <p class="text-sm font-semibold tracking-wide text-gray-300">
              Pressures. Geometry. Every session.
            </p>
          </div>
        </section>

        <!-- Returning Driver / Guest Card -->
        <section aria-label="Returning driver offline access">
          <PmCard class="space-y-4 border-[#2d3748] bg-[#161b22] p-5 shadow-lg">
            <div class="flex items-center justify-between">
              <span class="font-mono text-xs font-bold tracking-widest text-[#d4f933] uppercase">
                RETURNING DRIVER
              </span>
              <span
                class="inline-flex items-center gap-1.5 rounded-full bg-[#d4f933]/10 px-2.5 py-0.5 font-mono text-[11px] font-bold text-[#d4f933]"
              >
                ● Saved session
              </span>
            </div>

            <!-- Driver profile indicator -->
            <div class="flex items-center gap-3">
              <div
                class="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-[#2d3748] bg-[#1c2330] font-mono text-sm font-black text-[#d4f933]"
                aria-hidden="true"
              >
                AP
              </div>
              <div>
                <div class="text-sm font-bold text-white">Ashley Palmer · saved on this device</div>
                <div class="font-mono text-xs text-gray-400">Local driver profile</div>
              </div>
            </div>

            <!-- Explanatory note -->
            <p class="text-xs leading-relaxed text-gray-300">
              Log instantly without signal. Changes sync automatically when you're back online.
            </p>

            <!-- Offline action CTA -->
            <PmButton
              data-testid="btn-continue-offline"
              type="button"
              variant="primary"
              class="min-h-[48px] text-sm font-black tracking-wider uppercase"
              @click="handleContinueOffline"
            >
              Continue offline as Ashley →
            </PmButton>
          </PmCard>
        </section>

        <!-- Driver Sign In Form -->
        <section
          class="rounded-2xl border border-[#2d3748] bg-[#161b22] p-5 shadow-lg"
          aria-label="Driver credentials sign in"
        >
          <header class="mb-4">
            <h2 class="font-mono text-xs font-bold tracking-widest text-gray-400 uppercase">
              DRIVER SIGN IN
            </h2>
          </header>

          <form class="space-y-4" novalidate @submit.prevent="handleSignIn">
            <PmInput
              id="email"
              v-model="email"
              type="email"
              name="email"
              label="EMAIL ADDRESS"
              placeholder="driver@paddockmate.app"
              :error="emailError"
              required
            />

            <PmInput
              id="password"
              v-model="password"
              type="password"
              name="password"
              label="PASSWORD"
              placeholder="••••••••"
              :error="passwordError"
              required
            />

            <!-- Trust this device checkbox (touch target >= 48px) -->
            <label
              data-testid="checkbox-trust-device-container"
              class="flex min-h-[48px] cursor-pointer items-center gap-3 py-1 text-sm text-gray-300 select-none"
            >
              <input
                v-model="trustDevice"
                type="checkbox"
                name="trustDevice"
                class="h-5 w-5 rounded border border-[#2d3748] bg-[#0b0f17] text-[#d4f933] accent-[#d4f933] focus:ring-1 focus:ring-[#d4f933] focus:outline-none"
              />
              <span class="font-medium text-white">Trust this device</span>
            </label>

            <!-- Sign In CTA -->
            <PmButton
              data-testid="btn-sign-in"
              type="submit"
              variant="secondary"
              class="min-h-[48px] text-sm font-black tracking-wider uppercase"
            >
              Sign in →
            </PmButton>
          </form>

          <!-- Divider -->
          <div class="relative my-6 flex items-center justify-center">
            <div class="absolute inset-0 flex items-center">
              <div class="w-full border-t border-[#2d3748]"></div>
            </div>
            <div
              class="relative bg-[#161b22] px-3 font-mono text-[10px] font-bold tracking-wider text-gray-500 uppercase"
            >
              OR CONNECT ACCOUNT
            </div>
          </div>

          <!-- Social Sign In (Phase 2 - Disabled) -->
          <div class="space-y-3">
            <PmButton
              data-testid="btn-social-google"
              type="button"
              variant="outline"
              :disabled="true"
              class="min-h-[48px] cursor-not-allowed text-xs font-bold tracking-wide uppercase opacity-50"
            >
              <svg class="h-4 w-4" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                <path
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  fill="#4285F4"
                />
                <path
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  fill="#34A853"
                />
                <path
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  fill="#FBBC05"
                />
                <path
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  fill="#EA4335"
                />
              </svg>
              <span>Continue with Google</span>
            </PmButton>

            <PmButton
              data-testid="btn-social-apple"
              type="button"
              variant="outline"
              :disabled="true"
              class="min-h-[48px] cursor-not-allowed text-xs font-bold tracking-wide uppercase opacity-50"
            >
              <svg class="h-4 w-4" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                <path
                  d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 6.87c.66-.82 1.11-1.96.99-3.1-.96.04-2.12.64-2.8 1.44-.6.69-1.12 1.83-.98 2.94 1.07.08 2.15-.49 2.79-1.28z"
                />
              </svg>
              <span>Continue with Apple</span>
            </PmButton>

            <div
              class="pt-1 text-center font-mono text-[11px] font-bold tracking-wider text-gray-500 uppercase"
            >
              Cloud synchronisation · Phase 2
            </div>
          </div>
        </section>
      </div>
    </main>
  </div>
</template>
