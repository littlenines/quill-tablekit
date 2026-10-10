import Quill from 'quill'
import type { Delta as DeltaType, Parchment as ParchmentTypes } from 'quill'
import type ModuleType from 'quill/core/module'

// Not named imports: the CDN build's global Quill has no Delta, Parchment or Module property
export const Delta = Quill.import('delta') as typeof DeltaType
export type Delta = DeltaType

export const Parchment = Quill.import('parchment') as typeof ParchmentTypes
export type { ParchmentTypes }

export const Module = Quill.import('core/module') as typeof ModuleType
