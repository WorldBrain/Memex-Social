import React from 'react';
import { UIElement, UIElementServices } from '../../classes';
import { Project, ProjectPostTag, PostDeliveryOptions, PostDeliveryAction, PostDeliveryFilterType } from '../../../types';
import { Services } from '../../../services/types';
import Overlay from '../overlay';
import TagList from '../tag-list';
import Logic, { State, Event } from './logic';
import { shouldTranslate } from '../../../utils/translation';

interface Props {
    project : Required<Project>
    services : UIElementServices<'router' | 'overlay'>
    isAlreadySubscribed? : boolean
    initialDeliveries? : PostDeliveryOptions[]
    onCloseRequested : () => void
    onPreferenceSave : (preferences : PostDeliveryOptions[]) => void
    onUnsubscribe: () => void
}
export default class FollowOverlay extends UIElement<Props, State, Event> {
    constructor(props : Props) {
        super(props, { logic: new Logic(props) })
    }

    renderConfiguration() {
        return (<React.Fragment>
            <div className={this.styles.title}>Receive selected updates from {this.props.project.name}</div>
            <div className={this.styles.deliveries}>
                {this.state.deliveries.map((delivery, index) => {
                    return <PostDeliveryEdit
                        key={index}
                        services={this.props.services}
                        availableTags={this.props.project.postTags}
                        delivery={{...delivery}}
                        canRemove={this.state.canRemove}
                        onTagClick={tag => this.processEvent('toggleFilterTag', { delivery: index, tag })}
                        onActionChange={action => this.processEvent('setAction', { delivery: index, action })}
                        onFilterTypeChange={filterType => this.processEvent('setFilterType', { delivery: index, filterType })}
                        onRemove={() => this.processEvent('removeDelivery', { delivery: index })}
                    />
                })}
            </div>
            {this.state.canAddNew && <div
                className={this.styles.addNew}
                onClick={() => this.processEvent('addNewDelivery', {})}
            >
                + {shouldTranslate("Add another delivery preference")}
            </div>}
            {this.state.canSubmit && <div className={this.styles.confirmButton} onClick={() => this.processEvent('submit', {})}>
                {!this.props.isAlreadySubscribed && shouldTranslate("Follow")}
                {this.props.isAlreadySubscribed && shouldTranslate("Update preferences")}
            </div>}
            {this.props.isAlreadySubscribed && <div className={this.styles.unfollowButton} onClick={() => this.processEvent('initiateUnsubscribe', {})}>
                {shouldTranslate("Unfollow")}
            </div>}
        </React.Fragment>)
    }

    renderConfirmUnsubscribe() {
        return (<React.Fragment>
            <div className={this.styles.title}>Confirm unfollow</div>
            <p>Do you really want to unfollow {this.props.project.name}?</p>
            <div className={this.styles.confirmUnfollowButton} onClick={() => this.processEvent('confirmUnsubscribe', {})}>
                {shouldTranslate("Unfollow")}
            </div>
            <div className={this.styles.cancelUnfollowButton} onClick={() => this.processEvent('cancelUnsubscribe', {})}>
                {shouldTranslate("No, keep following")}
            </div>
        </React.Fragment>)
    }

    render() {
        return (<Overlay services={this.props.services} onCloseRequested={this.props.onCloseRequested}>
            {this.state.mode === 'configure' && this.renderConfiguration()}
            {this.state.mode === 'confirm-unsubscribe' && this.renderConfirmUnsubscribe()}
        </Overlay>)
    }
}

interface PostDeliveryEditProps {
    services : UIElementServices
    availableTags : ProjectPostTag[]
    delivery : PostDeliveryOptions
    canRemove : boolean
    onTagClick : (tag : ProjectPostTag) => void
    onActionChange : (action : PostDeliveryAction) => void
    onFilterTypeChange : (filterType : PostDeliveryFilterType) => void
    onRemove : () => void
}
export class PostDeliveryEdit extends UIElement<PostDeliveryEditProps> {
    styleModule = 'FollowOverlay'

    render() {
        return (<div className={this.styles.deliveryOptions}>
            {this.props.canRemove && <div className={this.styles.deliveryRemove} onClick={() => this.props.onRemove()}>
                <i className="fas fa-trash" />
            </div>}
            <div className={this.styles.deliveryType}>
                I want to receive updates
                <span className={this.styles.selectSpacing}></span>
                <select
                    value={this.props.delivery.action}
                    onChange={event => this.props.onActionChange(event.target.value as PostDeliveryAction)}
                >
                    <option value="weekly-email">in my weekly summary e-mail</option>
                    <option value="instant-email">as instant e-mails</option>
                </select>
                <span className={this.styles.selectSpacing}></span>
                <div>
                    only about posts containing
                    <span className={this.styles.selectSpacing}></span>
                    <select
                        value={this.props.delivery.filterType}
                        onChange={event => this.props.onFilterTypeChange(event.target.value as PostDeliveryFilterType)}
                    >
                        <option value="and">all</option>
                        <option value="or">any</option>
                    </select>
                    <span className={this.styles.selectSpacing}></span>
                </div>
                of the following tags
            </div>
            <TagList
                services={this.props.services}
                contrast={true}
                tags={this.props.availableTags}
                marked={Object.values(this.props.delivery.filterTags)}
                onTagClick={tag => this.props.onTagClick ? this.props.onTagClick(tag) : undefined}
                />
        </div>)
    }
}
