import projectCategories from '@/data/projectsData'
import Card from '@/components/Card'
import { genPageMetadata } from 'app/seo'

export const metadata = genPageMetadata({ title: '專案' })

export default function Projects() {
  return (
    <>
      <div className="divide-y divide-gray-200 dark:divide-gray-700">
        <div className="space-y-2 pt-6 pb-8 md:space-y-5">
          <h1 className="text-3xl leading-9 font-extrabold tracking-tight text-gray-900 sm:text-4xl sm:leading-10 md:text-6xl md:leading-14 dark:text-gray-100">
            專案
          </h1>
          {/* <p className="text-lg leading-7 text-gray-500 dark:text-gray-400">
            Showcase your projects with a hero image (16 x 9)
          </p> */}
        </div>
        <div className="container space-y-14 py-12">
          {projectCategories.map((category) => (
            <section key={category.title} aria-labelledby={`project-category-${category.title}`}>
              <div className="mb-6 border-b border-gray-200 pb-3 dark:border-gray-700">
                <h2
                  id={`project-category-${category.title}`}
                  className="text-2xl leading-8 font-bold tracking-tight text-gray-900 dark:text-gray-100"
                >
                  {category.title}
                </h2>
              </div>
              <div className="-m-4 flex flex-wrap">
                {category.projects.map((d) => (
                  <Card
                    key={d.title}
                    title={d.title}
                    description={d.description}
                    imgSrc={d.imgSrc}
                    href={d.href}
                    demoHref={d.demoHref}
                  />
                ))}
              </div>
            </section>
          ))}
        </div>
      </div>
    </>
  )
}
