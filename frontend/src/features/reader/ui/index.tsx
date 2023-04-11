import React from 'react'
import styled from 'styled-components'
import { UIElement } from '../../../main-ui/classes'
import {
    ReaderPageViewDependencies,
    ReaderPageViewEvent,
    ReaderPageViewState,
} from './types'
import { Toolbar } from './components/Toolbar'
import { Sidebar } from './components/Sidebar'
import { ReaderPageViewLogic } from './logic'

export class ReaderPageView extends UIElement<
    ReaderPageViewDependencies,
    ReaderPageViewState,
    ReaderPageViewEvent
> {
    constructor(props: ReaderPageViewDependencies) {
        super(props, { logic: new ReaderPageViewLogic({ ...props }) })
    }

    render() {
        return (
            <div>
                <Toolbar />
                <Sidebar />
                <InjectedContent
                    ref={(ref) =>
                        this.processEvent('setReaderContainerRef', { ref })
                    }
                />
            </div>
        )
    }
}

const InjectedContent = styled.div`
    max-width: 100%;
    width: calc(100% - 300px);
    height: calc(100% - 80px);
    position: fixed;
    background-color: #000;
    top: 80px;
    left: 0;
    bottom: 0;
`
