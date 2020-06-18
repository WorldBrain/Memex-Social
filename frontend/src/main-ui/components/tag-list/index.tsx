import React from 'react';
import classNames from 'classnames'
import { UIElement, UIElementServices } from '../../classes';
import { PostTag } from '../../../types';

interface TagListProps {
    services : UIElementServices
    tags : Array<PostTag>
    marked? : Array<PostTag>
    contrast? : boolean
    onTagClick? : (tag : PostTag) => void
}
export default class TagList extends UIElement<TagListProps> {
    render() {
        const marked = this.props.marked ? new Set(this.props.marked.map(tag => tag.label)) : new Set()

        return (
            <div className={classNames(this.styles.tags, this.props.contrast && this.styles.contrast)}>
                {this.props.tags.map(tag => <div
                    key={tag.label}
                    className={classNames(this.styles.tag, marked.has(tag.label) && this.styles.marked)}
                    onClick={() => this.props.onTagClick && this.props.onTagClick(tag)}
                >
                    {tag.label}
                </div>)}
            </div>
        )
    }
}
