import { cn } from '../../lib/cn.js'

export default function Skeleton({ className }) {
  return <div aria-hidden className={cn('animate-pulse rounded-control bg-borde', className)} />
}
