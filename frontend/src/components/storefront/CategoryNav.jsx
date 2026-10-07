import { Link } from 'react-router-dom'

function parentIdOf(category) {
  if (!category.parent) return null
  return typeof category.parent === 'object' ? category.parent._id : category.parent
}

function CategoryNav({ categories = [] }) {
  const parents = categories.filter((category) => !parentIdOf(category))

  return (
    <nav className="category-nav" aria-label="Product categories">
      {parents.map((parent) => {
        const children = categories.filter((category) => parentIdOf(category) === parent._id)
        return (
          <div className="category-nav-item" key={parent._id}>
            <Link className="category-nav-link" to={`/category/${parent.slug}`}>{parent.name}</Link>
            {children.length ? (
              <div className="category-flyout">
                {children.map((child) => (
                  <Link key={child._id} to={`/category/${child.slug}`}>{child.name}</Link>
                ))}
              </div>
            ) : null}
          </div>
        )
      })}
    </nav>
  )
}

export default CategoryNav
