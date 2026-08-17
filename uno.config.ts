import { defineConfig, transformerVariantGroup, transformerDirectives, presetWind3 } from 'unocss'
import { colors } from '@unocss/preset-mini'
export default defineConfig({
    presets: [
        presetWind3({
            dark: 'media'
        })
    ],
    transformers: [transformerVariantGroup(), transformerDirectives()],
    safelist: ['lg:cols-1', 'lg:cols-2', 'lg:cols-3', 'lg:cols-4', 'lg:cols-5', 'cols-1', 'cols-2', 'cols-3', 'cols-4'],
    shortcuts: {
        btn: 'px-2 py-1 bg-primary-7 rounded-md',
        input: 'w-full px-2 py-2 bg-white bg-op-10 font-bold b b-gray-5 b-op-50 rounded-xl bg-white focus:(b-primary-7 text-primary-5) dark:(bg-dark-5 bg-op-50) transition-colors duration-200 light:placeholder:text-black',
        'gr-from-r': 'bg-gradient-to-l from-primary-7 to-transparent',
        'gr-from-l': 'bg-gradient-to-r from-primary-7 to-transparent'
    },
    theme: {
        container: {
            center: true,
            padding: '1rem'
        },
        colors: {
            primary: colors.purple
        }
    }
})