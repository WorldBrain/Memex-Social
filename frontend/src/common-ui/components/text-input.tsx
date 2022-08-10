import React, { InputHTMLAttributes } from 'react'
import styled from 'styled-components'
import { Margin } from 'styled-components-spacing'

const StyledInput = styled.input<{
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

export const StyledInputLabel = styled.div`
    font-family: ${(props) => props.theme.fonts.primary};
    font-size: ${(props) => props.theme.fontSizes.text};
    line-height: ${(props) => props.theme.lineHeights.text};
    color: ${(props) => props.theme.colors.primary};
`

export const ErrorMessage = styled.div`
    font-family: ${(props) => props.theme.fonts.primary};
    font-size: ${(props) => props.theme.fontSizes.smallText};
    line-height: ${(props) => props.theme.lineHeights.smallText};
    color: ${(props) => props.theme.colors.warning};
`

interface State {
    value?: string
    prevValue?: string
}

interface Props
    extends Pick<
        InputHTMLAttributes<HTMLInputElement>,
        'type' | 'placeholder' | 'onChange' | 'onKeyDown'
    > {
    onConfirm?: () => void
    value?: string
    label?: string
    error?: boolean
    errorMessage?: string
}

export default class TextInput extends React.PureComponent<Props, State> {
    state: State = {}

    constructor(props: Props) {
        super(props)
        this.state.value = props?.value ?? ''
        this.state.prevValue = props?.value ?? ''
    }

    componentWillReceiveProps(
        props: InputHTMLAttributes<HTMLInputElement> & Props,
    ) {
        const { state } = this
        if (props.value !== state.value) {
            this.setState({ value: props.value })
        }
    }

    handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        this.setState({ prevValue: this.state.value, value: e.target.value })
        this.props?.onChange?.(e)
    }

    renderElement(padding?: boolean) {
        const { onConfirm, error, errorMessage } = this.props
        return (
            <>
                <StyledInput
                    {...this.props}
                    padding={padding}
                    error={error}
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
                    <ErrorMessage>{errorMessage}</ErrorMessage>
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
