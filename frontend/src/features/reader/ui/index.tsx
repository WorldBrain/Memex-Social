import React from 'react'
import styled from 'styled-components'
import { UIElement } from '../../../main-ui/classes'
import {
    ReaderPageViewDependencies,
    ReaderPageViewEvent,
    ReaderPageViewState,
} from './types'
import { setupIframeComms } from '../utils/iframe'
import { getWebsiteHTML } from '../utils/api'
import { injectHtml } from '../utils/utils'
import { Rnd } from 'react-rnd'
import { ReaderPageViewLogic } from './logic'

export class ReaderPageView extends UIElement<
    ReaderPageViewDependencies,
    ReaderPageViewState,
    ReaderPageViewEvent
> {
    constructor(props: ReaderPageViewDependencies) {
        super(props, { logic: new ReaderPageViewLogic({ ...props }) })
    }
    private SidebarContainer = React.createRef<HTMLElement>()

    render() {
        const style = {
            position: 'relative',
            right: '0px',
            top: '0px',
            zIndex: 3,
            height: 'fill-available',
        } as const

        return (
            <MainContainer>
                <LeftSide>
                    <Toolbar />
                    <InjectedContent
                        ref={(ref) =>
                            this.processEvent('setReaderContainerRef', { ref })
                        }
                    />
                </LeftSide>
                <ContainerStyled
                    width={this.state.sidebarWidth}
                    id={'annotationSidebarContainer'}
                >
                    <Sidebar
                        ref={this.SidebarContainer}
                        style={style}
                        default={{
                            x: 0,
                            y: 0,
                            width: '400px',
                            height: 'fill-available',
                        }}
                        resizeHandleWrapperClass={'sidebarResizeHandle'}
                        className="sidebar-draggable"
                        resizeGrid={[1, 0]}
                        dragAxis={'none'}
                        minWidth={'400px'}
                        maxWidth={'1000px'}
                        disableDragging={true}
                        enableResizing={{
                            top: false,
                            right: false,
                            bottom: false,
                            left: true,
                            topRight: false,
                            bottomRight: false,
                            bottomLeft: false,
                            topLeft: false,
                        }}
                        onResizeStop={(
                            e: any,
                            direction: any,
                            ref: any,
                            delta: any,
                            position: any,
                        ) => {
                            this.processEvent('setSidebarWidth', {
                                width: ref.style.width,
                            })
                        }}
                    >
                        test
                    </Sidebar>
                </ContainerStyled>
            </MainContainer>
        )
    }
}

const MainContainer = styled.div`
    display: flex;
`

const LeftSide = styled.div`
    display: flex;
    flex-direction: column;
    width: fill-available;
`

const InjectedContent = styled.div`
    max-width: 100%;
    width: fill-available;
    height: fill-available;
    background-color: #000;
    left: 0;
    bottom: 0;
    border: 0px solid;
`

const Toolbar = styled.div`
    position: sticky;
    top: 0;
    left: 0;
    height: 60px;
    width: fill-available;
    background: ${(props) => props.theme.colors.greyScale1};
    border-bottom: 1px solid ${(props) => props.theme.colors.greyScale3};
`
const Sidebar = styled(Rnd)`
    top: 0;
    right: 0;
    height: fill-available;
    background: ${(props) => props.theme.colors.greyScale1};
    border-left: 1px solid ${(props) => props.theme.colors.greyScale3};
`

const ContainerStyled = styled.div<{ width: number }>`
    height: 100vh;
    overflow-x: visible;
    position: relative;
    top: 0px;
    right: 0px;
    width: ${(props) => props.width}px;
    /* background: ${(props) => props.theme.colors.black};
    border-left: 1px solid ${(props) => props.theme.colors.greyScale2}; */
    font-family: 'Satoshi', sans-serif;
    font-feature-settings: 'pnum' on, 'lnum' on, 'case' on, 'ss03' on, 'ss04' on,
        'liga' off;
    box-sizing: content-box;

    &:: -webkit-scrollbar {
        display: none;
    }
    transition: all 0.2s cubic-bezier(0.3, 0.35, 0.14, 0.8);
    scrollbar-width: none;
`
