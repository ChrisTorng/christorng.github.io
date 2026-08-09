import Link from 'next/link'
import { getTagDefinitionByDisplayName } from '@/data/tagDefinitions'

interface Props {
  text: string
}

const Tag = ({ text }: Props) => {
  const tag = getTagDefinitionByDisplayName(text)

  if (!tag) {
    return null
  }

  return (
    <Link
      href={`/tags/${tag.id}`}
      className="text-primary-500 hover:text-primary-600 dark:hover:text-primary-400 mr-3 text-sm font-medium uppercase"
    >
      {tag.displayName}
    </Link>
  )
}

export default Tag
