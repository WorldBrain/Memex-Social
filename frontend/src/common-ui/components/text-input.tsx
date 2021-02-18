import React from 'react'
import { InputHTMLAttributes } from 'react'
import styled from 'styled-components'
import { Margin } from 'styled-components-spacing'

import { theme } from '../../main-ui/styles/theme'
import { Theme } from '../../main-ui/styles/types'

const StyledInput = styled.input<{
    theme: Theme
    padding?: boolean
    error?: boolean
}>`
    font-family: ${(props) => props.theme.fonts.primary};
    background: ${(props) => props.theme.colors.grey};
    border: 0;
    min-height: 30px;
    padding: 10px;
    width: 100%;
    border-radius: ${(props) => props.theme.borderRadii.default};
    ${(props) => (props.padding ? 'padding: 10px;' : '')}
    ${(props) => props.error && 'border: solid 2px red;'}
    outline: none;
`

export const StyledInputLabel = styled.div<{
    theme: Theme
}>`
    font-family: ${(props) => props.theme.fonts.primary};
    font-weight: ${(props) => props.theme.fontWeights.bold};
    font-size: ${(props) => props.theme.fontSizes.text};
    line-height: ${(props) => props.theme.lineHeights.text};
    color: ${(props) => props.theme.colors.primary};
`

export const ErrorMessage = styled.div<{
    theme: Theme
}>`
    font-family: ${(props) => props.theme.fonts.primary};
    font-size: ${(props) => props.theme.fontSizes.smallText};
    line-height: ${(props) => props.theme.lineHeights.smallText};
    color: ${(props) => props.theme.colors.warning};
`

interface State {
    value: string
    prevValue: string
}

interface Props {
    onConfirm?: () => void
    value?: string
    label?: string
    error?: boolean
    errorMessage?: string
}

export default class TextInput extends React.PureComponent<
    InputHTMLAttributes<HTMLInputElement> & Props,
    State
> {
    state = { prevValue: '', value: '' }

    constructor(props: Props) {
        super(props)
        this.state.value = props?.value ?? ''
        this.state.prevValue = props?.value ?? ''
    }

    static getDerivedStateFromProps(props: Props, state: State) {
        if (state.value !== state.prevValue) {
            return { value: state.value }
        }

        if (props?.value && props?.value !== state.value) {
            return { value: props.value }
        }

        return null
    }

    handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        this.setState({ prevValue: this.state.value, value: e.target.value })
        this.props?.onChange?.(e)
    }

    renderElement(padding?: boolean) {
        const { onConfirm, value, error, errorMessage, ...props } = this.props
        return (
            <>
                <StyledInput
                    padding={padding}
                    theme={theme}
                    type="text"
                    error={error}
                    {...props}
                    onChange={this.handleChange}
                    value={this.state.value}
                    onKeyDown={(event) => {
                        if (onConfirm && event.keyCode === 13) {
                            return onConfirm()
                        }
                        this.props.onKeyDown?.(event)
                    }}
                />
                {error && errorMessage && (
                    <ErrorMessage theme={theme}>{errorMessage}</ErrorMessage>
                )}
            </>
        )
    }

    render() {
        const { label } = this.props
        if (!label) {
            return this.renderElement(true)
        } else {
            return (
                <>
                    <Margin bottom="small">
                        <StyledInputLabel>{label}</StyledInputLabel>
                    </Margin>
                    <Margin bottom="small">{this.renderElement()}</Margin>
                </>
            )
        }
    }
}
