import React from 'react';
import classNames from 'classnames';
import { UITaskState } from '../../../types';
import { UIElement, UIElementServices } from '../../../classes'
import ActionPageHeader from '../../action-page-header';
import SimpleForm, { SimpleFormItem } from '../simple-form';
import PageContent from '../../page-content';
import { shouldTranslate } from '../../../../utils/translation';

interface Props {
    services : UIElementServices
    title : string
    items : Array<SimpleFormItem>
    valid : boolean
    submitLabel: string
    submitTaskState: UITaskState
    successIndicator: React.ReactNode
    onSubmit: () => void
}

export default class SimpleFormPageLayout extends UIElement<Props> {
    render() {
        return (<div className={this.styles.container}>
            <ActionPageHeader
                services={this.props.services}
                title={this.props.title}
                // imageUrl={user.pictureUrl}
            />
            <PageContent services={this.props.services}>
                <SimpleForm
                    services={this.props.services}
                    items={this.props.items}
                />
                <div
                    className={classNames(
                        this.styles.submitButton,
                        !this.props.valid && this.styles.disabled,
                        this.props.submitTaskState !== 'pristine' && this.styles.submitState,
                    )}
                    onClick={canSubmit(this.props) ? () => this.props.onSubmit() : (() => {})}
                >
                    {this.props.submitTaskState === 'pristine' && this.props.submitLabel}
                    {this.props.submitTaskState === 'running' && shouldTranslate('Working...')}
                    {this.props.submitTaskState === 'error' && shouldTranslate('Something went wrong, try again later')}
                    {this.props.submitTaskState === 'success' && this.props.successIndicator}
                </div>
            </PageContent>
        </div>)
    }
}

export function canSubmit(props : Props) {
    return props.valid && props.submitTaskState === 'pristine'
}