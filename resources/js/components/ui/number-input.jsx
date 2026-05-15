import React, { forwardRef, useState, useEffect, useRef } from 'react'
import { Input } from '@/components/ui/input'

const NumberInput = forwardRef(({
  value,
  onChange,
  placeholder = "0.00",
  className,
  ...props
}, ref) => {
  const [inputValue, setInputValue] = useState('')
  const inputRef = useRef(null)

  // Update input value when value prop changes
  useEffect(() => {
    if (value !== undefined && value !== null) {
      // Format the value with commas for display
      const formatted = value.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',')
      setInputValue(formatted)
    } else {
      setInputValue('')
    }
  }, [value])

  const handleChange = (e) => {
    const newValue = e.target.value
    const cursorPosition = e.target.selectionStart

    // Remove all non-numeric characters except decimal point
    const cleanValue = newValue.replace(/[^\d.]/g, '')

    // Prevent multiple decimal points
    const parts = cleanValue.split('.')
    if (parts.length > 2) {
      return
    }

    // Limit decimal places to 2
    if (parts[1] && parts[1].length > 2) {
      return
    }

    // Format with commas
    const formattedValue = cleanValue.replace(/\B(?=(\d{3})+(?!\d))/g, ',')

    // Calculate new cursor position
    const commaCountBefore = (newValue.substring(0, cursorPosition).match(/,/g) || []).length
    const commaCountAfter = (formattedValue.substring(0, cursorPosition).match(/,/g) || []).length
    const newCursorPosition = cursorPosition + (commaCountAfter - commaCountBefore)

    setInputValue(formattedValue)

    // Call onChange with numeric value as string
    if (onChange) {
      const numericValue = cleanValue === '' ? '' : (parseFloat(cleanValue) || 0).toString()
      const syntheticEvent = {
        ...e,
        target: {
          ...e.target,
          value: numericValue
        }
      }
      onChange(syntheticEvent)
    }

    // Restore cursor position
    setTimeout(() => {
      if (inputRef.current) {
        inputRef.current.setSelectionRange(newCursorPosition, newCursorPosition)
      }
    }, 0)
  }

  return (
    <Input
      {...props}
      ref={(el) => {
        inputRef.current = el
        if (ref) {
          if (typeof ref === 'function') {
            ref(el)
          } else {
            ref.current = el
          }
        }
      }}
      type="text"
      value={inputValue}
      onChange={handleChange}
      placeholder={placeholder}
      className={className}
    />
  )
})

NumberInput.displayName = 'NumberInput'

export { NumberInput }