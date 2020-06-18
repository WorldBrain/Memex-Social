import React from 'react';
import { UIElement, UIElementServices } from '../../../classes';

export interface SimpleFormItem {
    label : React.ReactNode,
    content : React.ReactNode
}

interface Props {
    services : UIElementServices
    items : Array<SimpleFormItem>
}

export default class SimpleForm extends UIElement<Props> {
    render() {
        return (<div className={this.styles.container}>
            {this.props.items.map((item, itemIndex) => <div key={itemIndex} className={this.styles.item}>
                {typeof item.label === 'string' && <h3 className={this.styles.itemLabel}>{item.label}</h3>}
                <div className={this.styles.itemContent}>{item.content}</div>
            </div>)}
        </div>)
    }
}
