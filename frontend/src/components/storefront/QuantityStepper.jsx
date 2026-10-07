function QuantityStepper({ value, min = 1, max = 99, onChange }) {
  return (
    <div className="quantity-stepper">
      <button type="button" onClick={() => onChange(Math.max(min, value - 1))} disabled={value <= min}>-</button>
      <span>{value}</span>
      <button type="button" onClick={() => onChange(Math.min(max, value + 1))} disabled={value >= max}>+</button>
    </div>
  )
}

export default QuantityStepper
