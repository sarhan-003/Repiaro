import { Link } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'
import SmartImage from '../common/SmartImage'
import { getCategoryIcon } from './categoryIcons'

/** Category card linking to the provider search pre-filtered by category. */
export default function ServiceCard({ category, providerCount }) {
  const Icon = getCategoryIcon(category.icon)

  return (
    <Link
      to={`/book-now/${category.id}`}
      className="group flex h-full flex-col overflow-hidden rounded-2xl border border-line bg-white transition-all hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-lg"
    >
      <div className="relative">
        <SmartImage
          src={category.image}
          alt={category.imageAlt}
          fallbackIcon={Icon}
          className="aspect-[16/10] w-full transition-transform duration-300 group-hover:scale-[1.03]"
          width="640"
          height="400"
        />
        <span className={`absolute bottom-0 left-5 flex size-12 translate-y-1/2 items-center justify-center rounded-xl bg-white shadow-md ring-1 ${category.tint}`}>
          <Icon className="size-6" aria-hidden="true" />
        </span>
      </div>
      <div className="flex flex-1 flex-col px-5 pb-5 pt-9">
        <h3 className="text-lg font-semibold group-hover:text-accent">{category.name}</h3>
        <p className="mt-1.5 flex-1 text-sm leading-relaxed text-muted">{category.description}</p>
        <div className="mt-4 flex items-center justify-between text-sm">
          {providerCount != null && (
            <span className="text-muted">
              {providerCount} demo {providerCount === 1 ? 'professional' : 'professionals'}
            </span>
          )}
          <span className="inline-flex items-center gap-1 font-semibold text-accent">
            Book now
            <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
          </span>
        </div>
      </div>
    </Link>
  )
}
