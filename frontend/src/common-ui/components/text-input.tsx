import React from "react";
import { InputHTMLAttributes } from "react";
import styled from "styled-components";

const StyledInput = styled.input`
  font-family: ${(props) => props.theme.fonts.primary};
  background: ${(props) => props.theme.colors.grey};
  border: 0;
  border-radius: 3px;
  padding: 10px;
`;

interface State {
    value: string
    prevValue: string
}

interface Props {
    onConfirm: () => void
    value?: string
}

export default class TextInput extends React.PureComponent<InputHTMLAttributes<HTMLInputElement> & Props,State> {

    state = {prevValue: "", value:""}

    constructor(props:Props) {
        super(props);
        this.state.value = props?.value ?? "";
        this.state.prevValue = props?.value ?? "";
    }

    static getDerivedStateFromProps(props: Props, state: State) {
        if (state.value !== state.prevValue) {
            return {value: state.value}
        }

        if (props?.value && props?.value !== state.value) {
            return { value: props.value };
        }
    }

    handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        this.setState({prevValue: this.state.value, value:e.target.value})
        this.props?.onChange?.(e)
    }

    render() {
        const {onConfirm, value, ...props} = this.props;
        return (
            <StyledInput
                type="text"
                {...props}
                onChange={this.handleChange}
                value={this.state.value}
                onKeyDown={(event) => {
                    if (onConfirm && event.keyCode === 13) {
                        return onConfirm();
                    }
                    this.props.onKeyDown?.(event);
                }}
            />
        );
    }
}
