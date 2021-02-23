import React, { TextareaHTMLAttributes } from 'react'
import styled from 'styled-components'

import { Theme } from '../../main-ui/styles/types'
import { theme } from '../../main-ui/styles/theme'

import { StyledInputLabel } from './text-input'

const Container = styled.div`
    display: flex;
    flex-direction: column;
`
const StyledTextArea = styled.textarea<{
    theme: Theme
    padding?: boolean
    error?: boolean
}>`
    font-family: ${(props) => props.theme.fonts.primary};
    background: ${(props) => props.theme.colors.grey};
    border: 0;
    outline: none;
    max-width: 100%;
    padding: 10px;
    border-radius: ${(props) => props.theme.borderRadii.default};
    ${
        (props) => (props.padding ? 'padding: 10px;' : '') // hacky workaround as this component is already used in several places
    };
    ${(props) => props.error && 'border: solid 2px red;'}
`

interface State {
    value: string
    prevValue: string
    charCount: number
}

interface Props {
    onConfirm?: () => void
    value?: string
    label?: string
    error?: boolean
    errorMessage?: string
}
export default class TextArea extends React.PureComponent<
    TextareaHTMLAttributes<HTMLTextAreaElement> & Props,
    State
> {
    state = {
        prevValue: '',
        value: '',
        charCount: 0,
    }

    constructor(props: Props) {
        super(props)
        this.state.value = props?.value ?? ''
        this.state.prevValue = props?.value ?? ''
        this.state.charCount = props.value?.length ?? 0
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

    handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        this.setState({
            prevValue: this.state.value,
            value: e.target.value,
            charCount: e.target.value.length,
        })
        this.props?.onChange?.(e)
    }

    handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (this.props.onConfirm && e.keyCode === 13) {
            return this.props.onConfirm()
        }
        this.props.onKeyDown?.(e)
    }

    renderElement(padding?: boolean) {
        const { onConfirm, value, error, errorMessage, ...props } = this.props
        return (
            <Container>
                <StyledTextArea
                    padding={padding}
                    theme={theme}
                    value={this.state.value}
                    error={error}
                    {...props}
                    onChange={this.handleChange}
                    onKeyDown={this.handleKeyDown}
                />
                {/*<CharCount
                    theme={theme}
                >{`${this.state.charCount}/${USER_PROFILE_BIO_CHAR_LIMIT}`}</CharCount>*/}
            </Container>
        )
    }

    render() {
        if (!this.props.label) {
            return this.renderElement(true)
        } else {
            return (
                <>
                    <StyledInputLabel>{this.props.label}</StyledInputLabel>
                    {this.renderElement()}
                </>
            )
        }
    }
}
