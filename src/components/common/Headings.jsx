import PageContainer from '../layout/PageContainer'

export function SectionHeading({ eyebrow, title, description, action, align = 'left', id }) {
  const centered = align === 'center'
  return (
    <div className={`mb-8 flex flex-col gap-4 ${centered ? 'items-center text-center' : 'sm:flex-row sm:items-end sm:justify-between'}`}>
      <div className="max-w-2xl">
        {eyebrow && <p className="mb-2 text-sm font-semibold uppercase tracking-wider text-primary-ink">{eyebrow}</p>}
        <h2 id={id} className="text-2xl font-bold sm:text-3xl">
          {title}
        </h2>
        {description && <p className="mt-2 text-base text-muted">{description}</p>}
      </div>
      {action}
    </div>
  )
}

export function PageHeader({ eyebrow, title, description, children }) {
  return (
    <div className="border-b border-line bg-white">
      <PageContainer className="py-8 sm:py-10">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl">
            {eyebrow && <p className="mb-2 text-sm font-semibold uppercase tracking-wider text-primary-ink">{eyebrow}</p>}
            <h1 className="text-3xl font-bold sm:text-4xl">{title}</h1>
            {description && <p className="mt-2 text-base text-muted">{description}</p>}
          </div>
          {children}
        </div>
      </PageContainer>
    </div>
  )
}
