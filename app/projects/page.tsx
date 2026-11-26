import projectCategories from '@/data/projectsData'
import projectUpdateDates from '@/data/projectUpdatedDates.json'
import ProjectsExplorer from './ProjectsExplorer'
import { genPageMetadata } from 'app/seo'

export const metadata = genPageMetadata({ title: '專案' })

const dates: Record<string, string> = projectUpdateDates

export default function Projects() {
  const projects = projectCategories.flatMap((category) =>
    category.projects.map((project) => {
      const repoName = project.href?.match(/^https:\/\/github\.com\/ChrisTorng\/([^/?#]+)/i)?.[1] ?? ''
      return {
        ...project,
        category: category.title,
        updatedAt: dates[repoName] || null,
      }
    })
  )

  return (
    <div className="divide-y divide-gray-200 dark:divide-gray-700">
      <div className="space-y-2 pt-6 pb-8 md:space-y-5">
        <h1 className="heading-accent text-3xl leading-9 font-extrabold tracking-tight sm:text-4xl sm:leading-10 md:text-6xl md:leading-14">
          專案
        </h1>
      </div>
      <ProjectsExplorer
        projects={projects}
        categories={projectCategories.map((category) => category.title)}
      />
    </div>
  )
}
