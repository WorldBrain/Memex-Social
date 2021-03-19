import React from 'react'
import styled from 'styled-components'

export interface OptionProps<T> {
    value: T
    subText: string
    headerText: string
}

export interface SelectProps<T> {
    value: T
    options: OptionProps<T>[]
    onChange: (nextValue: T) => void
}

export default function Select<ValueType extends string | number>(
    props: SelectProps<ValueType>,
) {
    const handleValueChange: React.ChangeEventHandler<HTMLSelectElement> = (
        e,
    ) => props.onChange(e.target.value as ValueType)

    return (
        <StyledSelect value={props.value} onChange={handleValueChange}>
            {props.options.map(({ value, headerText, subText }) => (
                <StyledOption key={value} value={value}>
                    {headerText}
                </StyledOption>
            ))}
        </StyledSelect>
    )
}

const StyledSelect = styled.select``
const StyledOption = styled.option``
