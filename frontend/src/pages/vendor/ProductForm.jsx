import { ImagePlus, Plus, Trash2 } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { getCategories } from '../../services/categoryApi'

const emptyVariant = {
  name: '',
  options: [
    {
      label: '',
      priceModifier: 0,
      stock: 0,
      sku: '',
    },
  ],
}

const emptyOption = {
  label: '',
  priceModifier: 0,
  stock: 0,
  sku: '',
}

function normalizeVariants(variants = []) {
  return variants.map((variant) => ({
    name: variant.name || '',
    options: Array.isArray(variant.options)
      ? variant.options.map((option) => ({
          label: option.label || '',
          priceModifier: option.priceModifier ?? 0,
          stock: option.stock ?? 0,
          sku: option.sku || '',
        }))
      : [emptyOption],
  }))
}

function getDuplicateSkus(variants) {
  const seen = new Set()
  const duplicates = new Set()

  variants.forEach((variant) => {
    variant.options.forEach((option) => {
      const sku = option.sku.trim()
      if (!sku) return
      if (seen.has(sku)) duplicates.add(sku)
      seen.add(sku)
    })
  })

  return duplicates
}

function parentIdOf(category) {
  if (!category.parent) return null
  return typeof category.parent === 'object' ? category.parent._id : category.parent
}

function buildCategoryTree(categories) {
  return categories
    .filter((category) => !parentIdOf(category))
    .map((parent) => ({
      ...parent,
      children: categories.filter((category) => parentIdOf(category) === parent._id),
    }))
}

function normalizeCategoryIds(product) {
  if (Array.isArray(product?.categories) && product.categories.length) {
    return product.categories.map((category) => (typeof category === 'object' ? category._id : category))
  }

  if (product?.category) {
    return [typeof product.category === 'object' ? product.category._id : product.category]
  }

  return []
}

function ProductForm({ products, onSubmitProduct, permissions }) {
  const { productId } = useParams()
  const navigate = useNavigate()
  const editingProduct = useMemo(
    () => products.find((product) => product._id === productId),
    [productId, products],
  )
  const isEdit = Boolean(productId)
  const [banner, setBanner] = useState('')
  const [form, setForm] = useState({
    title: editingProduct?.title || editingProduct?.name || '',
    description: editingProduct?.description || '',
    categories: normalizeCategoryIds(editingProduct),
    price: editingProduct?.price || '',
    compareAtPrice: editingProduct?.compareAtPrice || '',
    stock: editingProduct?.stock || '',
    sku: editingProduct?.sku || '',
    images: [],
    variants: editingProduct?.variants ? normalizeVariants(editingProduct.variants) : [],
    flashSale: {
      active: Boolean(editingProduct?.flashSale?.active),
      endsAt: editingProduct?.flashSale?.endsAt
        ? new Date(editingProduct.flashSale.endsAt).toISOString().slice(0, 16)
        : '',
    },
  })
  const [variantError, setVariantError] = useState('')
  const [categoryError, setCategoryError] = useState('')
  const [categories, setCategories] = useState([])
  const [categoriesAreMock, setCategoriesAreMock] = useState(false)

  const canSubmit = isEdit ? permissions.canEditProduct : permissions.canCreateProduct
  const duplicateSkus = useMemo(() => getDuplicateSkus(form.variants), [form.variants])
  const categoryTree = useMemo(() => buildCategoryTree(categories), [categories])

  useEffect(() => {
    let isMounted = true

    async function loadCategories() {
      const result = await getCategories()
      if (!isMounted) return
      setCategories(result.data)
      setCategoriesAreMock(result.isMock)
    }

    loadCategories()
    return () => {
      isMounted = false
    }
  }, [])

  const updateField = (field, value) => {
    setForm((current) => ({ ...current, [field]: value }))
  }

  const updateVariant = (index, field, value) => {
    setForm((current) => ({
      ...current,
      variants: current.variants.map((variant, variantIndex) =>
        variantIndex === index ? { ...variant, [field]: value } : variant,
      ),
    }))
  }

  const addVariant = () => {
    setForm((current) => ({
      ...current,
      variants: [
        ...current.variants,
        {
          name: '',
          options: [{ ...emptyOption }],
        },
      ],
    }))
  }

  const removeVariant = (index) => {
    setForm((current) => ({
      ...current,
      variants: current.variants.filter((_, variantIndex) => variantIndex !== index),
    }))
  }

  const addOption = (variantIndex) => {
    setForm((current) => ({
      ...current,
      variants: current.variants.map((variant, index) =>
        index === variantIndex
          ? { ...variant, options: [...variant.options, { ...emptyOption }] }
          : variant,
      ),
    }))
  }

  const updateOption = (variantIndex, optionIndex, field, value) => {
    setForm((current) => ({
      ...current,
      variants: current.variants.map((variant, index) =>
        index === variantIndex
          ? {
              ...variant,
              options: variant.options.map((option, currentOptionIndex) =>
                currentOptionIndex === optionIndex
                  ? { ...option, [field]: value }
                  : option,
              ),
            }
          : variant,
      ),
    }))
  }

  const removeOption = (variantIndex, optionIndex) => {
    setForm((current) => ({
      ...current,
      variants: current.variants.map((variant, index) =>
        index === variantIndex
          ? {
              ...variant,
              options: variant.options.filter((_, currentOptionIndex) => currentOptionIndex !== optionIndex),
            }
          : variant,
      ),
    }))
  }

  const buildPayload = () => ({
    ...form,
    name: form.title,
    price: Number(form.price || 0),
    compareAtPrice: form.compareAtPrice === '' ? undefined : Number(form.compareAtPrice),
    stock: Number(form.stock || 0),
    category: form.categories[0],
    categories: form.categories,
    variants: form.variants.map((variant) => ({
      name: variant.name,
      options: variant.options.map((option) => ({
        label: option.label.trim(),
        priceModifier: Number(option.priceModifier || 0),
        stock: Number(option.stock || 0),
        sku: option.sku.trim(),
      })),
    })),
    flashSale: {
      active: Boolean(form.flashSale.active),
      endsAt: form.flashSale.endsAt ? new Date(form.flashSale.endsAt).toISOString() : null,
    },
  })

  const handleSubmit = async (event) => {
    event.preventDefault()
    if (!canSubmit) return

    if (!form.categories.length) {
      setCategoryError('Select at least one category.')
      return
    }

    const hasMissingOptionLabel = form.variants.some((variant) =>
      variant.options.some((option) => !option.label.trim()),
    )

    if (hasMissingOptionLabel) {
      setVariantError('Every variant option needs an option label.')
      return
    }

    setCategoryError('')
    setVariantError('')
    await onSubmitProduct(editingProduct, buildPayload())
    setBanner(
      isEdit && editingProduct?.status === 'approved'
        ? 'Changes submitted for admin approval. Your live listing is unaffected until then.'
        : 'Product submitted for admin approval.',
    )
  }

  return (
    <section className="admin-section">
      <div className="vendor-toolbar">
        <div>
          <h2 className="admin-section-title">{isEdit ? 'Edit product' : 'New product'}</h2>
          <p className="admin-section-note">Submissions do not change the live storefront until approved.</p>
        </div>
        <button type="button" className="admin-button" onClick={() => navigate('/vendor/products')}>Back to products</button>
      </div>

      {banner ? <div className="vendor-banner">{banner}</div> : null}
      {!canSubmit ? <div className="mock-banner">Your manager permissions do not allow this product action.</div> : null}

      <form className="admin-card stat-card vendor-form-grid" onSubmit={handleSubmit}>
        <div className="vendor-form-row">
          <label className="auth-field">
            <span className="auth-label">Title</span>
            <input className="auth-input" value={form.title} onChange={(event) => updateField('title', event.target.value)} required />
          </label>
          <div className="auth-field">
            <span className="auth-label">Selected categories</span>
            <div className="category-selected-count mono">{form.categories.length}</div>
          </div>
        </div>

        <div className="auth-field">
          <span className="auth-label">Categories</span>
          {categoriesAreMock ? <p className="vendor-field-warning">Mock categories are being shown because the API could not be reached.</p> : null}
          {categoryError ? <p className="vendor-field-error">{categoryError}</p> : null}
          {form.categories.length > 5 ? <p className="vendor-field-warning">You selected more than 5 categories. Consider keeping product tagging focused.</p> : null}
          <div className="category-picker">
            {categoryTree.map((parent) => (
              <div className="category-picker-group" key={parent._id}>
                <label className="category-checkbox is-parent">
                  <input
                    type="checkbox"
                    checked={form.categories.includes(parent._id)}
                    onChange={(event) => {
                      const checked = event.target.checked
                      setForm((current) => ({
                        ...current,
                        categories: checked
                          ? [...current.categories, parent._id]
                          : current.categories.filter((id) => id !== parent._id),
                      }))
                    }}
                  />
                  {parent.name}
                </label>
                {parent.children.map((child) => (
                  <label className="category-checkbox is-child" key={child._id}>
                    <input
                      type="checkbox"
                      checked={form.categories.includes(child._id)}
                      onChange={(event) => {
                        const checked = event.target.checked
                        setForm((current) => ({
                          ...current,
                          categories: checked
                            ? [...current.categories, child._id]
                            : current.categories.filter((id) => id !== child._id),
                        }))
                      }}
                    />
                    {child.name}
                  </label>
                ))}
              </div>
            ))}
          </div>
        </div>

        <label className="auth-field">
          <span className="auth-label">Description</span>
          <textarea className="auth-textarea vendor-textarea" value={form.description} onChange={(event) => updateField('description', event.target.value)} />
        </label>

        <div className="vendor-form-row">
          <label className="auth-field">
            <span className="auth-label">Price</span>
            <input className="auth-input" type="number" value={form.price} onChange={(event) => updateField('price', event.target.value)} required />
          </label>
          <label className="auth-field">
            <span className="auth-label">Compare at price</span>
            <input className="auth-input" type="number" value={form.compareAtPrice} onChange={(event) => updateField('compareAtPrice', event.target.value)} />
          </label>
        </div>

        <div className="vendor-form-row">
          <label className="auth-field">
            <span className="auth-label">Stock</span>
            <input className="auth-input" type="number" value={form.stock} onChange={(event) => updateField('stock', event.target.value)} required />
          </label>
          <label className="auth-field">
            <span className="auth-label">SKU</span>
            <input className="auth-input mono" value={form.sku} onChange={(event) => updateField('sku', event.target.value)} />
          </label>
        </div>

        <div className="vendor-upload-box">
          <ImagePlus size={24} />
          <strong>Images placeholder</strong>
          <span>Multi-upload will connect to media storage later.</span>
        </div>

        <div className="admin-card vendor-variant-card">
          <div className="vendor-toolbar">
            <div>
              <h3 className="admin-section-title">Flash sale</h3>
              <p className="admin-section-note">Flash sale changes are submitted through the normal approval flow.</p>
            </div>
          </div>
          <label className="category-checkbox is-parent">
            <input
              type="checkbox"
              checked={form.flashSale.active}
              onChange={(event) =>
                updateField('flashSale', { ...form.flashSale, active: event.target.checked })
              }
            />
            Activate flash sale after approval
          </label>
          <label className="auth-field">
            <span className="auth-label">Sale ends at</span>
            <input
              className="auth-input"
              type="datetime-local"
              value={form.flashSale.endsAt}
              onChange={(event) =>
                updateField('flashSale', { ...form.flashSale, endsAt: event.target.value })
              }
            />
          </label>
        </div>

        <div className="admin-section">
          <div className="vendor-toolbar">
            <h3 className="admin-section-title">Variants</h3>
            <button
              type="button"
              className="admin-button is-primary"
              onClick={addVariant}
            >
              <Plus size={16} /> Add variant
            </button>
          </div>

          {variantError ? <p className="vendor-field-error">{variantError}</p> : null}
          {duplicateSkus.size ? (
            <p className="vendor-field-warning">
              Duplicate SKU warning: {[...duplicateSkus].join(', ')}
            </p>
          ) : null}

          {form.variants.map((variant, variantIndex) => (
            <div className="admin-card vendor-variant-card" key={variantIndex}>
              <label className="auth-field">
                <span className="auth-label">Name</span>
                <input
                  className="auth-input"
                  value={variant.name}
                  onChange={(event) => updateVariant(variantIndex, 'name', event.target.value)}
                />
              </label>

              <div className="vendor-option-list">
                {variant.options.map((option, optionIndex) => {
                  const isDuplicateSku = option.sku.trim() && duplicateSkus.has(option.sku.trim())
                  return (
                    <div
                      className={`vendor-option-row${isDuplicateSku ? ' has-warning' : ''}`}
                      key={optionIndex}
                    >
                      <label className="auth-field">
                        <span className="auth-label">Option</span>
                        <input
                          className="auth-input"
                          value={option.label}
                          onChange={(event) => updateOption(variantIndex, optionIndex, 'label', event.target.value)}
                          required
                        />
                      </label>
                      <label className="auth-field">
                        <span className="auth-label">Price modifier</span>
                        <input
                          className="auth-input"
                          type="number"
                          step="0.01"
                          value={option.priceModifier}
                          onChange={(event) => updateOption(variantIndex, optionIndex, 'priceModifier', event.target.value)}
                        />
                      </label>
                      <label className="auth-field">
                        <span className="auth-label">Stock</span>
                        <input
                          className="auth-input"
                          type="number"
                          step="1"
                          value={option.stock}
                          onChange={(event) => updateOption(variantIndex, optionIndex, 'stock', event.target.value)}
                        />
                      </label>
                      <label className="auth-field">
                        <span className="auth-label">SKU</span>
                        <input
                          className="auth-input mono"
                          value={option.sku}
                          onChange={(event) => updateOption(variantIndex, optionIndex, 'sku', event.target.value)}
                        />
                      </label>
                      <button
                        type="button"
                        className="admin-button is-danger vendor-remove-option"
                        aria-label="Remove option"
                        onClick={() => removeOption(variantIndex, optionIndex)}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  )
                })}
              </div>

              <div className="vendor-inline-actions">
                <button type="button" className="admin-button is-primary" onClick={() => addOption(variantIndex)}>
                  <Plus size={16} /> Add option
                </button>
                <button type="button" className="admin-button is-danger" onClick={() => removeVariant(variantIndex)}>
                  <Trash2 size={16} /> Remove variant
                </button>
              </div>
            </div>
          ))}
        </div>

        <button className="admin-button is-primary" type="submit" disabled={!canSubmit}>
          {isEdit ? 'Submit changes' : 'Submit product'}
        </button>
      </form>
    </section>
  )
}

export default ProductForm
