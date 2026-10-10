import { Droplets, Hammer, PaintRoller, Sparkles, Sprout, WashingMachine, Wrench, Zap } from 'lucide-react'

const ICONS = {
  plumbing: Droplets,
  electrical: Zap,
  cleaning: Sparkles,
  carpentry: Hammer,
  painting: PaintRoller,
  appliance: WashingMachine,
  gardening: Sprout,
}

/** Lucide icon for a category's `icon` key, with a generic fallback. */
export const getCategoryIcon = (key) => ICONS[key] ?? Wrench
