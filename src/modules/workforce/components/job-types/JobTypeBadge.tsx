interface Props {
  name: string
  color: string
  size?: "sm" | "md"
}

export function JobTypeBadge({ name, color, size = "sm" }: Props) {
  const sizeClass = size === "sm" ? "px-2 py-0.5 text-xs" : "px-3 py-1 text-sm"
  return (
    <span
      className={`inline-flex items-center rounded-full font-medium ${sizeClass}`}
      style={{ backgroundColor: `${color}20`, color }}
    >
      {name}
    </span>
  )
}
