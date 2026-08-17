import { useSound } from '@vueuse/sound'
import errorMain from '@/assets/sounds/error_main.mp3?url'
import errorOnePiece from '@/assets/sounds/error_one_piece.mp3?url'
import errorMj from '@/assets/sounds/error_mj.mp3?url'
import errorMario from '@/assets/sounds/error_mario.m4a?url'

import reservedMain from '@/assets/sounds/reserved_main.mp3?url'
import reservedOnePiece from '@/assets/sounds/reserved_one_piece.mp3?url'
import reservedMj from '@/assets/sounds/reserved_mj.mp3?url'
import reservedMario from '@/assets/sounds/reserved_mario.mp3?url'
import reservedTraore from '@/assets/sounds/reserved_traore.mp3?url'
import reservedMixed from '@/assets/sounds/reserved_mixed.m4a?url'

import livenessIn from '@/assets/sounds/liveness_in_main.mp3?url'
import livenessOut from '@/assets/sounds/liveness_out_main.mp3?url'

import bookedMain from '@/assets/sounds/booked_main.mp3?url'
import bookedOnePiece from '@/assets/sounds/booked_main.mp3?url'
import bookedMario from '@/assets/sounds/booked_mario.mp3?url'

import takenMain from '@/assets/sounds/taken_main.mp3?url'

import useMainStore from '@/stores/main-store'

export default function useSoundEffect() {
  const store = useMainStore()
  const soundPack = store.settings.soundPack
  return {
    error: useSound(soundPack === 'one piece' ? errorOnePiece : soundPack === 'mj' ? errorMj : soundPack === 'super mario' ? errorMario : errorMain),
    reserved: useSound(soundPack === 'mixed' ? reservedMixed : soundPack === 'one piece' ? reservedOnePiece : soundPack === 'mj' ? reservedMj : soundPack === 'super mario' ? reservedMario : soundPack === 'traore' ? reservedTraore : reservedMain),
    livenessIn: useSound(livenessIn),
    livenessOut: useSound(livenessOut),
    booked: useSound(soundPack === 'one piece' ? bookedOnePiece : soundPack === 'super mario' ? bookedMario : bookedMain),
    taken: useSound(takenMain)
  }
}
