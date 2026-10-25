<script setup lang="ts">
import { computed, reactive, watch } from "vue";
import type { Drivetrain, PressureUnit, VehicleEntity } from "../../db/paddockMateDb";
import type { CreateVehicleInput } from "../../stores/vehicleStore";
import PmButton from "../ui/PmButton.vue";
import PmInput from "../ui/PmInput.vue";
import PmStepper from "../ui/PmStepper.vue";

const props = withDefaults(
  defineProps<{
    isOpen: boolean;
    vehicle?: VehicleEntity | null;
  }>(),
  {
    vehicle: null,
  }
);

const emit = defineEmits<{
  (e: "close"): void;
  (e: "save", data: CreateVehicleInput & { id?: string }): void;
}>();

const drivetrains: Drivetrain[] = ["RWD", "FWD", "AWD"];
const pressureUnits: PressureUnit[] = ["PSI", "BAR", "KPA"];

const pressureLimits = computed(() => {
  if (form.pressureUnit === "BAR") {
    return { min: 0.5, max: 4.0, step: 0.05, label: "0.5 and 4.0 BAR" };
  }
  if (form.pressureUnit === "KPA") {
    return { min: 50, max: 400, step: 5, label: "50 and 400 KPA" };
  }
  return { min: 10.0, max: 50.0, step: 0.1, label: "10.0 and 50.0 PSI" };
});

const form = reactive({
  nickname: "",
  make: "",
  model: "",
  year: undefined as number | undefined,
  chassis: "",
  fuel: "",
  drivetrain: "RWD" as Drivetrain,
  tyreModel: "",
  frontTyreSize: "",
  rearTyreSize: "",
  suspension: "",
  pressureUnit: "PSI" as PressureUnit,
  coldPressureFront: 26.0,
  coldPressureRear: 26.0,
  targetPressureFront: 30.0,
  targetPressureRear: 30.0,
});

const errors = reactive({
  make: "",
  model: "",
  pressures: "",
});

function getDefaultCold(unit: PressureUnit): number {
  if (unit === "BAR") return 1.8;
  if (unit === "KPA") return 180;
  return 26.0;
}

function getDefaultTarget(unit: PressureUnit): number {
  if (unit === "BAR") return 2.1;
  if (unit === "KPA") return 210;
  return 30.0;
}

function resetForm() {
  if (props.vehicle) {
    form.nickname = props.vehicle.nickname ?? "";
    form.make = props.vehicle.make ?? "";
    form.model = props.vehicle.model ?? "";
    form.year = props.vehicle.year;
    form.chassis = props.vehicle.chassis ?? "";
    form.fuel = props.vehicle.fuel ?? "";
    form.drivetrain = props.vehicle.drivetrain ?? "RWD";
    form.tyreModel = props.vehicle.tyreModel ?? "";
    form.frontTyreSize = props.vehicle.frontTyreSize ?? "";
    form.rearTyreSize = props.vehicle.rearTyreSize ?? "";
    form.suspension = props.vehicle.suspension ?? "";
    form.pressureUnit = props.vehicle.pressureUnit ?? "PSI";
    const defaultCold = getDefaultCold(form.pressureUnit);
    const defaultTarget = getDefaultTarget(form.pressureUnit);
    form.coldPressureFront = props.vehicle.defaultColdPressureFl ?? defaultCold;
    form.coldPressureRear = props.vehicle.defaultColdPressureRl ?? defaultCold;
    form.targetPressureFront = props.vehicle.defaultTargetPressureFl ?? defaultTarget;
    form.targetPressureRear = props.vehicle.defaultTargetPressureRl ?? defaultTarget;
  } else {
    form.nickname = "";
    form.make = "";
    form.model = "";
    form.year = undefined;
    form.chassis = "";
    form.fuel = "";
    form.drivetrain = "RWD";
    form.tyreModel = "";
    form.frontTyreSize = "";
    form.rearTyreSize = "";
    form.suspension = "";
    form.pressureUnit = "PSI";
    form.coldPressureFront = 26.0;
    form.coldPressureRear = 26.0;
    form.targetPressureFront = 30.0;
    form.targetPressureRear = 30.0;
  }
  errors.make = "";
  errors.model = "";
  errors.pressures = "";
}

watch(
  () => form.pressureUnit,
  (newUnit, oldUnit) => {
    if (!oldUnit || newUnit === oldUnit) return;
    const limits = pressureLimits.value;
    if (form.coldPressureFront < limits.min || form.coldPressureFront > limits.max) {
      const defCold = getDefaultCold(newUnit);
      form.coldPressureFront = defCold;
      form.coldPressureRear = defCold;
    }
    if (form.targetPressureFront < limits.min || form.targetPressureFront > limits.max) {
      const defTarget = getDefaultTarget(newUnit);
      form.targetPressureFront = defTarget;
      form.targetPressureRear = defTarget;
    }
  }
);

watch(
  () => [props.isOpen, props.vehicle],
  () => {
    if (props.isOpen) {
      resetForm();
    }
  },
  { immediate: true }
);

function handleSubmit() {
  errors.make = "";
  errors.model = "";
  errors.pressures = "";

  let hasError = false;

  if (!form.make.trim()) {
    errors.make = "Make is required";
    hasError = true;
  }

  if (!form.model.trim()) {
    errors.model = "Model is required";
    hasError = true;
  }

  const pressures = [
    form.coldPressureFront,
    form.coldPressureRear,
    form.targetPressureFront,
    form.targetPressureRear,
  ];

  const limits = pressureLimits.value;
  if (pressures.some((p) => p < limits.min || p > limits.max)) {
    errors.pressures = `Pressures must be clamped between ${limits.label}`;
    hasError = true;
  }

  if (hasError) {
    return;
  }

  const payload: CreateVehicleInput & { id?: string } = {
    ...(props.vehicle?.id ? { id: props.vehicle.id } : {}),
    make: form.make.trim(),
    model: form.model.trim(),
    nickname: form.nickname.trim() || undefined,
    year: form.year ? Number(form.year) : undefined,
    chassis: form.chassis.trim() || undefined,
    fuel: form.fuel.trim() || undefined,
    drivetrain: form.drivetrain,
    tyreModel: form.tyreModel.trim() || undefined,
    frontTyreSize: form.frontTyreSize.trim() || undefined,
    rearTyreSize: form.rearTyreSize.trim() || undefined,
    suspension: form.suspension.trim() || undefined,
    pressureUnit: form.pressureUnit,
    defaultColdPressureFl: form.coldPressureFront,
    defaultColdPressureFr: form.coldPressureFront,
    defaultColdPressureRl: form.coldPressureRear,
    defaultColdPressureRr: form.coldPressureRear,
    defaultTargetPressureFl: form.targetPressureFront,
    defaultTargetPressureFr: form.targetPressureFront,
    defaultTargetPressureRl: form.targetPressureRear,
    defaultTargetPressureRr: form.targetPressureRear,
  };

  emit("save", payload);
  emit("close");
}
</script>

<template>
  <div
    v-if="isOpen"
    class="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/80 p-4 sm:p-6"
    role="dialog"
    aria-modal="true"
    aria-labelledby="vehicle-modal-title"
    @click.self="$emit('close')"
  >
    <div
      class="my-8 w-full max-w-xl rounded-2xl border border-[#2d3748] bg-[#161b22] p-6 shadow-2xl transition"
    >
      <!-- Modal Header -->
      <div class="flex items-center justify-between border-b border-[#2d3748] pb-4">
        <div>
          <div class="text-[10px] font-black tracking-widest text-[#d4f933] uppercase">
            {{ vehicle ? "EDIT VEHICLE" : "ADD VEHICLE" }}
          </div>
          <h2 id="vehicle-modal-title" class="text-xl font-black text-white">
            {{
              vehicle
                ? vehicle.nickname || `${vehicle.make} ${vehicle.model}`
                : "New Vehicle Profile"
            }}
          </h2>
        </div>
        <button
          type="button"
          class="flex h-12 min-h-[48px] w-12 min-w-[48px] cursor-pointer items-center justify-center rounded-lg text-gray-400 hover:bg-[#1c2330] hover:text-white"
          aria-label="Close modal"
          @click="$emit('close')"
        >
          ✕
        </button>
      </div>

      <!-- Form Body -->
      <form class="mt-4 space-y-4" @submit.prevent="handleSubmit">
        <PmInput v-model="form.nickname" label="Nickname / Title" placeholder="e.g. 330i · Track" />

        <div class="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <PmInput
            v-model="form.make"
            label="Make"
            placeholder="e.g. BMW"
            required
            :error="errors.make"
          />
          <PmInput
            v-model="form.model"
            label="Model"
            placeholder="e.g. 330i"
            required
            :error="errors.model"
          />
        </div>

        <div class="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <PmInput v-model="form.year" label="Year" type="number" placeholder="e.g. 2007" />
          <PmInput v-model="form.chassis" label="Chassis" placeholder="e.g. E90" />
          <PmInput v-model="form.fuel" label="Fuel" placeholder="e.g. Petrol" />
        </div>

        <!-- Drivetrain -->
        <div class="flex flex-col gap-1.5">
          <label class="text-xs font-black tracking-wider text-gray-400 uppercase">
            Drivetrain
          </label>
          <div class="grid grid-cols-3 gap-2">
            <button
              v-for="item in drivetrains"
              :key="item"
              type="button"
              :class="[
                'min-h-[48px] cursor-pointer rounded-xl border font-mono text-sm font-black transition',
                form.drivetrain === item
                  ? 'border-[#d4f933] bg-[#d4f933] text-black shadow-sm'
                  : 'border-[#2d3748] bg-[#0b0f17] text-white hover:border-gray-500',
              ]"
              @click="form.drivetrain = item"
            >
              {{ item }}
            </button>
          </div>
        </div>

        <!-- Tyres -->
        <PmInput
          v-model="form.tyreModel"
          label="Tyre Make / Model"
          placeholder="e.g. Michelin Pilot Sport 5"
        />

        <div class="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <PmInput
            v-model="form.frontTyreSize"
            label="Front Tyre Size"
            placeholder="e.g. 225/40 R18"
          />
          <PmInput
            v-model="form.rearTyreSize"
            label="Rear Tyre Size"
            placeholder="e.g. 255/35 R18"
          />
        </div>

        <!-- Suspension -->
        <PmInput
          v-model="form.suspension"
          label="Suspension"
          placeholder="e.g. Öhlins Road & Track"
        />

        <!-- Pressure Unit -->
        <div class="flex flex-col gap-1.5">
          <label class="text-xs font-black tracking-wider text-gray-400 uppercase">
            Pressure Unit
          </label>
          <div class="grid grid-cols-3 gap-2">
            <button
              v-for="unit in pressureUnits"
              :key="unit"
              type="button"
              :class="[
                'min-h-[48px] cursor-pointer rounded-xl border font-mono text-sm font-black transition',
                form.pressureUnit === unit
                  ? 'border-[#d4f933] bg-[#d4f933] text-black shadow-sm'
                  : 'border-[#2d3748] bg-[#0b0f17] text-white hover:border-gray-500',
              ]"
              @click="form.pressureUnit = unit"
            >
              {{ unit }}
            </button>
          </div>
        </div>

        <!-- Default Pressures Section -->
        <div class="space-y-4 rounded-xl border border-[#2d3748] bg-[#0b0f17] p-4">
          <div class="text-xs font-black tracking-wider text-[#d4f933] uppercase">
            Default Tyre Pressures
          </div>

          <!-- Cold Pressures -->
          <div class="space-y-2">
            <div class="text-[11px] font-bold tracking-wider text-gray-400 uppercase">
              Default Cold Pressures (Ambient)
            </div>
            <div class="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <span class="mb-1 block text-xs font-medium text-gray-400">Front (FL / FR)</span>
                <PmStepper
                  v-model="form.coldPressureFront"
                  :min="pressureLimits.min"
                  :max="pressureLimits.max"
                  :step="pressureLimits.step"
                  :unit="form.pressureUnit"
                />
              </div>
              <div>
                <span class="mb-1 block text-xs font-medium text-gray-400">Rear (RL / RR)</span>
                <PmStepper
                  v-model="form.coldPressureRear"
                  :min="pressureLimits.min"
                  :max="pressureLimits.max"
                  :step="pressureLimits.step"
                  :unit="form.pressureUnit"
                />
              </div>
            </div>
          </div>

          <!-- Target Pressures -->
          <div class="space-y-2 border-t border-[#2d3748]/50 pt-2">
            <div class="text-[11px] font-bold tracking-wider text-gray-400 uppercase">
              Default Target Pressures (Hot on Track)
            </div>
            <div class="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <span class="mb-1 block text-xs font-medium text-gray-400">Front (FL / FR)</span>
                <PmStepper
                  v-model="form.targetPressureFront"
                  :min="pressureLimits.min"
                  :max="pressureLimits.max"
                  :step="pressureLimits.step"
                  :unit="form.pressureUnit"
                />
              </div>
              <div>
                <span class="mb-1 block text-xs font-medium text-gray-400">Rear (RL / RR)</span>
                <PmStepper
                  v-model="form.targetPressureRear"
                  :min="pressureLimits.min"
                  :max="pressureLimits.max"
                  :step="pressureLimits.step"
                  :unit="form.pressureUnit"
                />
              </div>
            </div>
          </div>

          <div v-if="errors.pressures" class="text-xs font-bold text-red-400">
            {{ errors.pressures }}
          </div>
        </div>

        <!-- Action Buttons -->
        <div class="flex gap-3 border-t border-[#2d3748] pt-4">
          <PmButton type="button" variant="secondary" class="flex-1" @click="$emit('close')">
            Cancel
          </PmButton>
          <PmButton type="submit" variant="primary" class="flex-1"> Save vehicle ✓ </PmButton>
        </div>
      </form>
    </div>
  </div>
</template>
