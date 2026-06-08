import type { SVGProps } from 'react'

export const EXTERNAL_LINK_ICON_PATHS = [
  'M7.5 5.5H5.75A2.25 2.25 0 0 0 3.5 7.75v6.5a2.25 2.25 0 0 0 2.25 2.25h6.5a2.25 2.25 0 0 0 2.25-2.25V12.5',
  'M10.5 3.5h6m0 0v6m0-6-7.5 7.5',
]

const ExternalLinkIcon = ({
  className = 'external-link-icon',
  ...props
}: SVGProps<SVGSVGElement>) => (
  <svg
    aria-hidden="true"
    className={className}
    viewBox="0 0 20 20"
    fill="none"
    data-external-link-icon="true"
    {...props}
  >
    {EXTERNAL_LINK_ICON_PATHS.map((path) => (
      <path
        key={path}
        d={path}
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    ))}
  </svg>
)

export default ExternalLinkIcon
