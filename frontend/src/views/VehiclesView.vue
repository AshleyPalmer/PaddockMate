<script setup lang="ts">
import { computed, inject, onMounted, ref } from "vue";
import { useRouter } from "vue-router";
import VehicleCard from "../components/vehicle/VehicleCard.vue";
import VehicleModal from "../components/vehicle/VehicleModal.vue";
import PmButton from "../components/ui/PmButton.vue";
import type { PaddockMateDB, VehicleEntity } from "../db/paddockMateDb";
import { useVehicleStore, type CreateVehicleInput } from "../stores/vehicleStore";

const router = useRouter();
const injectedDb = inject<PaddockMateDB | undefined>("db", undefined);
const vehicleStore = useVehicleStore(injectedDb);

const isModalOpen = ref(false);
const editingVehicle = ref<VehicleEntity | null>(null);

onMounted(async () => {
  await vehicleStore.fetchVehicles();
});

const activeVehicle = computed(() => vehicleStore.activeVehicle);

const continueButtonText = computed(() => {
  if (!activeVehicle.value) {
    return "Select a vehicle to continue →";
  }
  const name =
    activeVehicle.value.nickname?.trim() ||
    `${activeVehicle.value.make} ${activeVehicle.value.model}`;
  return `Continue with ${name} →`;
});

function handleSelectVehicle(vehicle: VehicleEntity) {
  vehicleStore.setActiveVehicle(vehicle.id);
}

function handleEditVehicle(vehicle: VehicleEntity) {
  editingVehicle.value = vehicle;
  isModalOpen.value = true;
}

function handleAddVehicle() {
  editingVehicle.value = null;
  isModalOpen.value = true;
}

async function handleSaveVehicle(payload: CreateVehicleInput & { id?: string }) {
  if (payload.id) {
    const { id, ...updates } = payload;
    await vehicleStore.updateVehicle(id, updates);
  } else {
    await vehicleStore.createVehicle(payload);
  }
  isModalOpen.value = false;
  editingVehicle.value = null;
}

function handleCloseModal() {
  isModalOpen.value = false;
  editingVehicle.value = null;
}

function continueToTrackDay() {
  if (activeVehicle.value) {
    router.push("/track-days/new");
  }
}
</script>

<template>
  <div class="min-h-screen bg-[#0b0f17] text-white">
    <main class="mx-auto max-w-2xl px-4 py-8 pb-32">
      <!-- Header -->
      <header class="mb-6">
        <div class="font-mono text-xs font-bold tracking-widest text-[#d4f933] uppercase">
          01 / PREPARE YOUR CAR
        </div>
        <div class="mt-1 flex items-center justify-between gap-4">
          <h1 class="text-3xl font-black tracking-tight text-white uppercase">YOUR GARAGE</h1>
          <PmButton
            type="button"
            variant="secondary"
            class="!w-auto px-4 py-2.5 text-xs"
            @click="handleAddVehicle"
          >
            Add vehicle +
          </PmButton>
        </div>
        <p class="mt-1 text-sm font-medium text-gray-400">
          Choose the vehicle you're taking out today.
        </p>
      </header>

      <!-- Vehicle List -->
      <section v-if="vehicleStore.vehicles.length > 0" class="space-y-4" aria-label="Vehicles list">
        <VehicleCard
          v-for="vehicle in vehicleStore.vehicles"
          :key="vehicle.id"
          :vehicle="vehicle"
          :selected="vehicleStore.activeVehicleId === vehicle.id"
          @select="handleSelectVehicle(vehicle)"
          @edit="handleEditVehicle(vehicle)"
        />
      </section>

      <!-- Empty State -->
      <section v-else class="rounded-2xl border border-dashed border-[#2d3748] p-8 text-center">
        <div class="text-base font-bold text-gray-300">No vehicles in your garage yet.</div>
        <p class="mt-1 text-xs text-gray-400">
          Add your first vehicle to configure default tyre pressures and track setups.
        </p>
        <div class="mt-4 flex justify-center">
          <PmButton type="button" variant="primary" class="!w-auto px-6" @click="handleAddVehicle">
            Add vehicle +
          </PmButton>
        </div>
      </section>
    </main>

    <!-- Sticky Bottom Continue Bar -->
    <footer
      class="fixed right-0 bottom-0 left-0 z-40 border-t border-[#2d3748] bg-[#0b0f17]/95 p-4 backdrop-blur-md"
    >
      <div class="mx-auto max-w-2xl">
        <PmButton
          type="button"
          variant="primary"
          :disabled="!activeVehicle"
          @click="continueToTrackDay"
        >
          {{ continueButtonText }}
        </PmButton>
      </div>
    </footer>

    <!-- Vehicle Modal -->
    <VehicleModal
      :is-open="isModalOpen"
      :vehicle="editingVehicle"
      @close="handleCloseModal"
      @save="handleSaveVehicle"
    />
  </div>
</template>
