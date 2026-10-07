import { formatCurrency } from '../../utils/currency'

function VariantSelector({ variants = [], selection, onChange }) {
  if (!variants.length) return null

  return variants.map((variant) => (
    <div className="variant-group" key={variant.name}>
      <p className="filter-title">{variant.name}</p>
      <div className="chip-row">
        {variant.options.map((option) => (
          <button
            type="button"
            key={option.label}
            className={`chip-button${selection[variant.name]?.label === option.label ? ' is-selected' : ''}`}
            onClick={() => onChange(variant.name, option)}
          >
            {option.label}
            {Number(option.priceModifier || 0) > 0 ? ` +${formatCurrency(option.priceModifier)}` : ''}
          </button>
        ))}
      </div>
    </div>
  ))
}

export default VariantSelector
