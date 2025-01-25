import { Loader2, Check } from "lucide-react"

export type IconProps = React.HTMLAttributes<SVGElement>

export const Icons = {
  spinner: (props: IconProps) => <Loader2 {...props} />,
  check: (props: IconProps) => <Check {...props} />,
} 