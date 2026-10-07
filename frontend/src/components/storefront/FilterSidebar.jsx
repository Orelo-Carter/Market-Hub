function FilterSidebar({ filters, onChange, vendors = [] }) {
  const update = (field, value) => onChange({ ...filters, [field]: value })

  return (
    <aside className="filter-sidebar">
      <div className="filter-group">
        <p className="filter-title">Price</p>
        <label className="filter-field">
          <span className="muted-copy">Min</span>
          <input value={filters.minPrice || ''} type="number" onChange={(event) => update('minPrice', event.target.value)} />
        </label>
        <label className="filter-field">
          <span className="muted-copy">Max</span>
          <input value={filters.maxPrice || ''} type="number" onChange={(event) => update('maxPrice', event.target.value)} />
        </label>
      </div>

      <div className="filter-group">
        <p className="filter-title">Vendor</p>
        {vendors.map((vendor) => (
          <label className="category-checkbox" key={vendor.slug || vendor._id}>
            <input
              type="checkbox"
              checked={filters.vendor === (vendor.slug || vendor._id)}
              onChange={(event) => update('vendor', event.target.checked ? (vendor.slug || vendor._id) : '')}
            />
            {vendor.storeName}
          </label>
        ))}
      </div>

      <label className="filter-field">
        <span className="filter-title">Rating</span>
        <select value={filters.rating || ''} onChange={(event) => update('rating', event.target.value)}>
          <option value="">Any rating</option>
          <option value="4">4+ stars</option>
          <option value="3">3+ stars</option>
        </select>
      </label>
    </aside>
  )
}

export default FilterSidebar
