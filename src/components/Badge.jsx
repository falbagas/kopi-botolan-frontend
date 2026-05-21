const variants = {
  green: 'bg-green-100 text-green-800',
  amber: 'bg-amber-100 text-amber-800',
  red: 'bg-red-100 text-red-800',
  blue: 'bg-blue-100 text-blue-800',
  gray: 'bg-gray-100 text-gray-700',
}

const Badge = ({ label, variant = 'gray' }) => (
  <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-medium ${variants[variant]}`}>
    {label}
  </span>
)

export default Badge