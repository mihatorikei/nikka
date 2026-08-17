<script setup lang="ts">
import { ref, useTemplateRef } from "vue";
import { onClickOutside } from "@vueuse/core";

const emit = defineEmits(["change"]);

const el = useTemplateRef<HTMLDivElement>("el");

onClickOutside(el, () => {
    visible.value = false;
});

const props = defineProps<{
    label?: string;
    options: string[];
    default?: string;
    fieldClass?: string;
    containerClass?: string;
    lowercase?: boolean;
    disabled?: boolean;
}>();

const selectedValue = defineModel<string | null>();

const visible = ref(false);

function selectOption(value: string) {
    selectedValue.value = value;
    visible.value = false;
    emit("change");
}
</script>

<template>
    <div ref="el" class="grid gap-3 font-600 w-full text-sm">
        <p v-show="props.label" v-text="props.label ? `${props.label}: ` : ''" />
        <div class="relative w-max" :class="props.containerClass">
            <button class="bg-white bg-op-40 dark:(bg-white bg-op-10) flex items-center justify-center w-full gap-3 py-2 px-3 rounded-full focus:(b b-primary-7)" :class="`${props.fieldClass} ${disabled ? 'pointer-events-none op-50' : ''}`" type="button" @click="visible = !visible">
                <p :class="{ capitalize: !props.lowercase }">{{ selectedValue || props.default || "" }}</p>
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="currentColor" class="bi bi-chevron-dow duration-500" :class="visible && 'rotate-180'" viewBox="0 0 16 16">
                    <path fill-rule="evenodd" d="M1.646 4.646a.5.5 0 0 1 .708 0L8 10.293l5.646-5.647a.5.5 0 0 1 .708.708l-6 6a.5.5 0 0 1-.708 0l-6-6a.5.5 0 0 1 0-.708" />
                </svg>
            </button>

            <!-- absolute top-14 bg-white bg-op-40 dark:(bg-white bg-op-10) rounded-lg  -->
            <ul v-show="visible" class="absolute top-10 bg-white bg-op-40 dark:(bg-white bg-op-10) rounded-lg max-h-100 overflow-auto backdrop-blur-xl w-full z-1">
                <li v-if="props.default" :class="(props.default === selectedValue || selectedValue === '') && 'bg-primary-6 text-white'" class="px-4 py-2 cursor-pointer rounded-xl text-black dark:text-white" @click="selectOption('')" v-text="props.default" />
                <li v-for="option in props.options" :key="option" :class="option === selectedValue && 'bg-primary-7 text-white'" class="px-4 py-2 cursor-pointer rounded-xl" @click="selectOption(option)" v-text="option" />
            </ul>
        </div>
    </div>
</template>
