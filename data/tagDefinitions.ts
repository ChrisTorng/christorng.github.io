export const tagDefinitions = [
  { id: 'future', displayName: '未來趨勢' },
  { id: 'ai', displayName: 'AI' },
  { id: 'music', displayName: '音樂' },
  { id: 'english', displayName: 'English' },
] as const

export type TagId = (typeof tagDefinitions)[number]['id']
export type TagData = Record<TagId, { displayName: string; count: number }>

export function getTagDefinitionById(id: string) {
  return tagDefinitions.find((tag) => tag.id === id)
}

export function getTagDefinitionByDisplayName(displayName: string) {
  return tagDefinitions.find((tag) => tag.displayName === displayName)
}
