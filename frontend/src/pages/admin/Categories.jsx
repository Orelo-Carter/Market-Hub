import { ChevronDown, ChevronRight, Edit2, Plus, Trash2 } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import toast from 'react-hot-toast'
import EmptyState from '../../components/admin/EmptyState'
import {
  createCategory,
  deleteCategory,
  getAdminCategories,
  updateCategory,
} from '../../services/categoryApi'

function parentIdOf(category) {
  if (!category.parent) return null
  return typeof category.parent === 'object' ? category.parent._id : category.parent
}

function buildTree(categories) {
  const topLevel = categories.filter((category) => !parentIdOf(category))
  return topLevel.map((parent) => ({
    ...parent,
    children: categories.filter((category) => parentIdOf(category) === parent._id),
  }))
}

const emptyForm = {
  name: '',
  parent: '',
  image: '',
}

function Categories() {
  const [categories, setCategories] = useState([])
  const [isMock, setIsMock] = useState(false)
  const [expanded, setExpanded] = useState(new Set())
  const [editingCategory, setEditingCategory] = useState(null)
  const [form, setForm] = useState(emptyForm)
  const [isSaving, setIsSaving] = useState(false)

  const tree = useMemo(() => buildTree(categories), [categories])
  const topLevelCategories = useMemo(
    () => categories.filter((category) => !parentIdOf(category)),
    [categories],
  )

  useEffect(() => {
    async function loadCategories() {
      const result = await getAdminCategories()
      setCategories(result.data)
      setIsMock(result.isMock)
      setExpanded(new Set(result.data.filter((category) => !parentIdOf(category)).map((category) => category._id)))
    }

    loadCategories()
  }, [])

  const toggleExpanded = (id) => {
    setExpanded((current) => {
      const next = new Set(current)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const startCreate = () => {
    setEditingCategory(null)
    setForm(emptyForm)
  }

  const startEdit = (category) => {
    setEditingCategory(category)
    setForm({
      name: category.name,
      parent: parentIdOf(category) || '',
      image: category.image || '',
    })
  }

  const updateField = (field, value) => {
    setForm((current) => ({ ...current, [field]: value }))
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setIsSaving(true)
    const payload = {
      name: form.name,
      parent: form.parent || null,
      image: form.image,
    }

    try {
      if (editingCategory) {
        const response = isMock
          ? { data: { category: { ...editingCategory, ...payload } } }
          : await updateCategory(editingCategory._id, payload)
        setCategories((current) =>
          current.map((category) =>
            category._id === editingCategory._id ? response.data.category : category,
          ),
        )
        toast.success('Category updated')
      } else {
        const response = isMock
          ? { data: { category: { ...payload, _id: `local_cat_${Date.now()}`, slug: payload.name.toLowerCase().replace(/\s+/g, '-') } } }
          : await createCategory(payload)
        setCategories((current) => [...current, response.data.category])
        toast.success('Category created')
      }
      startCreate()
    } catch (error) {
      toast.error(error.response?.data?.message || 'Could not save category')
    } finally {
      setIsSaving(false)
    }
  }

  const handleDelete = async (category) => {
    const confirmed = window.confirm(`Delete ${category.name}?`)
    if (!confirmed) return

    try {
      if (!isMock) await deleteCategory(category._id)
      setCategories((current) => current.filter((item) => item._id !== category._id))
      toast.success('Category deleted')
    } catch (error) {
      toast.error(error.response?.data?.message || 'Could not delete category')
    }
  }

  const renderCategoryRow = (category, isChild = false) => {
    const hasChildren = category.children?.length > 0
    const isOpen = expanded.has(category._id)

    return (
      <div key={category._id}>
        <div className={`category-row${isChild ? ' is-child' : ''}`}>
          <div className="category-row-main">
            {!isChild && hasChildren ? (
              <button className="category-icon-button" type="button" onClick={() => toggleExpanded(category._id)} aria-label="Toggle category">
                {isOpen ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
              </button>
            ) : (
              <span className="category-indent-spacer" />
            )}
            <div>
              <p className="preview-title">{category.name}</p>
              <p className="preview-meta">{category.slug}</p>
            </div>
          </div>
          <div className="vendor-inline-actions">
            <button className="admin-button" type="button" onClick={() => startEdit(category)} aria-label={`Edit ${category.name}`}>
              <Edit2 size={15} />
            </button>
            <button className="admin-button is-danger" type="button" onClick={() => handleDelete(category)} aria-label={`Delete ${category.name}`}>
              <Trash2 size={15} />
            </button>
          </div>
        </div>
        {!isChild && isOpen ? category.children.map((child) => renderCategoryRow(child, true)) : null}
      </div>
    )
  }

  return (
    <section className="admin-section">
      {isMock ? <div className="mock-banner">Mock categories are being shown because the category API could not be reached.</div> : null}

      <div className="vendor-toolbar">
        <div>
          <h2 className="admin-section-title">Category Management</h2>
          <p className="admin-section-note">Manage platform-controlled product taxonomy.</p>
        </div>
        <button className="admin-button is-primary" type="button" onClick={startCreate}>
          <Plus size={16} /> Add Category
        </button>
      </div>

      <div className="category-management-layout">
        <div className="admin-card stat-card category-tree-card">
          {categories.length ? (
            <div className="category-tree">
              {tree.map((category) => renderCategoryRow(category))}
            </div>
          ) : (
            <EmptyState title="No categories yet">
              Add your first category to start organizing marketplace products.
            </EmptyState>
          )}
        </div>

        <form className="admin-card stat-card vendor-form-grid" onSubmit={handleSubmit}>
          <div>
            <h3 className="admin-section-title">{editingCategory ? 'Edit Category' : 'Add Category'}</h3>
            <p className="admin-section-note">Only one level of nesting is supported for now.</p>
          </div>

          <label className="auth-field">
            <span className="auth-label">Name</span>
            <input className="auth-input" value={form.name} onChange={(event) => updateField('name', event.target.value)} required />
          </label>

          <label className="auth-field">
            <span className="auth-label">Parent</span>
            <select className="auth-select" value={form.parent} onChange={(event) => updateField('parent', event.target.value)}>
              <option value="">None (top-level)</option>
              {topLevelCategories
                .filter((category) => category._id !== editingCategory?._id)
                .map((category) => (
                  <option key={category._id} value={category._id}>{category.name}</option>
                ))}
            </select>
          </label>

          <label className="auth-field">
            <span className="auth-label">Image URL</span>
            <input className="auth-input" value={form.image} onChange={(event) => updateField('image', event.target.value)} />
          </label>

          <div className="vendor-inline-actions">
            <button className="admin-button is-primary" type="submit" disabled={isSaving}>
              {editingCategory ? 'Save changes' : 'Create category'}
            </button>
            {editingCategory ? (
              <button className="admin-button" type="button" onClick={startCreate}>
                Cancel
              </button>
            ) : null}
          </div>
        </form>
      </div>
    </section>
  )
}

export default Categories
