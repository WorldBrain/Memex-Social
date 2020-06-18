import React from 'react';
import { UIElement, UIElementServices } from '../../../classes';

interface Props {
    services : UIElementServices
    value : string
    onChange : (value : string) => void | Promise<void>
    className? : string
    contentType? : 'email' | 'phone'
    placeholder? : string
    onConfirm? : () => void
}

export default class TextInput extends UIElement<Props> {
    render() {
        return (
            <input
                type={this.props.contentType || 'text'}
                value={this.props.value}
                placeholder={this.props.placeholder}
                className={`${this.styles.input} ${this.props.className || ''}`}
                onKeyPress={event => {
                    if (this.props.onConfirm && event.key === 'Enter') {
                        this.props.onConfirm()
                    }
                }}
                onChange={event => this.props.onChange(event.target.value)}
            />
        )
    }
}
