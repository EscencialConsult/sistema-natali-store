import { cn } from '../../lib/cn.js'

export default function Skeleton({ className }) {
  return <div aria-hidden className={cn('animate-pulse rounded-tarjeta bg-borde/60', className)} />
}
