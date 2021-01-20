import React from "react";
import { SharedListReference } from "@worldbrain/memex-common/lib/content-sharing/types";
import { State, Dependencies, Events } from './types'
import { UIElement } from "../../classes";
import ListsSidebar from './lists-sidebar'

export interface Props extends Dependencies {

}

export default class ListsSidebarContainer extends UIElement<Props, State, Events> {
    private handleSharedListClick: (ref: SharedListReference) => React.MouseEventHandler = (listReference) => (e) => {
        e.preventDefault()

        this.processEvent('clickSharedList', { listReference })
    }

    render() {
        if (!this.state.isListShown) {
            return null
        }

        return (
            <ListsSidebar
                loadState={this.state.loadState}
                sharedLists={this.state.followedLists}
                onSharedListClick={this.handleSharedListClick}
            />
        )
    }
}
