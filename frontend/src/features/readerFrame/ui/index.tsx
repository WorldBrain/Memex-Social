import React from 'react'
import styled, { css, keyframes } from 'styled-components'
import { UIElement } from '../../../main-ui/classes'
import {
    ReaderPageViewDependencies,
    ReaderPageViewEvent,
    ReaderPageViewState,
} from './types'
import { ReaderPageViewLogic } from './logicOld'
import {
    getPageLinkPath,
    getWebUIBaseUrl,
} from '@worldbrain/memex-common/lib/content-sharing/utils'
import LoadingIndicator from '@worldbrain/memex-common/lib/common-ui/components/loading-indicator'
import { getReaderYoutubePlayerId } from '../utils/utils'
import { ViewportBreakpoint } from '@worldbrain/memex-common/lib/common-ui/styles/types'
import { getViewportBreakpoint } from '@worldbrain/memex-common/lib/common-ui/styles/utils'
import { MemexEditorInstance } from '@worldbrain/memex-common/lib/editor'
import { hasUnsavedAnnotationEdits } from '../../annotations/ui/logic'
import { hasUnsavedConversationEdits } from '../../content-conversations/ui/logic'
import { sleepPromise } from '../../../utils/promises'
import { normalizeUrl } from '@worldbrain/memex-url-utils/lib/normalize'
import { ReaderViewDependencies } from './logic'
import { useLogic } from '../../../hooks/useLogic'
import { ReaderViewLogic } from './logic'

export default function ReaderView(props: ReaderViewDependencies) {
    const { logic, state } = useLogic(() => new ReaderViewLogic(props))

    const isYoutubeMobile = false

    const renderYoutubePlayer = () => {
        const { youtube } = props.services
        const originalUrl = props.sourceUrl
        const normalizedUrl = normalizeUrl(originalUrl, {
            removeQueryParams: true,
        })

        const getYoutubeId = () => {
            let regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/
            let match = originalUrl.match(regExp)

            if (match && match[2].length == 11) {
                return match[2]
            } else {
                return 'error'
            }
        }

        const playerId = getReaderYoutubePlayerId(normalizedUrl)

        return (
            <div>
                <YoutubeIframe
                    id={playerId}
                    ref={(ref: HTMLIFrameElement | null) => {
                        if (ref) {
                            youtube.createYoutubePlayer(playerId, {
                                width: 'fill-available', // yes, these are meant to be strings
                                height: 'fill-available',
                                videoId: getYoutubeId(),
                            })
                        }
                    }}
                />
            </div>
        )
    }

    const renderMainContent = () => {
        if (isYoutubeMobile) {
            return (
                <YoutubeArea isYoutubeMobile={isYoutubeMobile}>
                    <YoutubeVideoContainer isYoutubeMobile={isYoutubeMobile}>
                        <YoutubeVideoBox id={'YoutubeVideoBox'}>
                            {renderYoutubePlayer()}
                        </YoutubeVideoBox>
                    </YoutubeVideoContainer>
                </YoutubeArea>
            )
        }

        return (
            <>
                <InjectedContent
                    ref={(ref: HTMLIFrameElement | null) =>
                        logic.initializeReader({
                            ref,
                        })
                    }
                >
                    {state.preventInteractionsInIframe && <ClickBlocker />}
                    {state.iframeLoadState === 'error' ? (
                        <div>
                            The reader didn't load properly. Please try
                            refreshing the page.
                        </div>
                    ) : (
                        state.iframeLoadState !== 'success' && (
                            <LoadingBoxBlurred>
                                <LoadingIndicator size={34} />
                            </LoadingBoxBlurred>
                        )
                    )}
                </InjectedContent>
            </>
        )
    }

    return (
        <MainContainer isYoutubeMobile={isYoutubeMobile}>
            {renderMainContent()}
        </MainContainer>
    )
}

const MainContentContainer = styled.div<{ isYoutubeMobile?: boolean }>`
    width: 100%;
    height: 100%;
    display: flex;
    flex: 1;

    ${(props) =>
        props.isYoutubeMobile &&
        css`
            flex: 0;
        `}
`

const ClickBlocker = styled.div`
    background: transparent;
    height: 100%;
    width: 100%;
    position: absolute;
    top: 0px;
    left: 0px;
    z-index: 1000000000;
`

const LoadingBoxBlurred = styled.div<{ height?: string; width?: string }>`
    display: flex;
    justify-content: center;
    align-items: center;
    height: ${(props) => (props.height ? props.height : 'fill-available')};
    width: ${(props) => (props.width ? props.width : '100%')};
    flex: 1;
    height: 100%;
    width: 100%;
    position: absolute;
    top: 0;
    left: 0;
    background: #ffffff60;
    backdrop-filter: blur(5px);
`

const YoutubeIframe = styled.div<{}>`
    border-radius: 8px;
    height: 100%;
    width: 100%;
    position: absolute;
    top: 0;
    left: 0;
`

const MainContainer = styled.div<{ isYoutubeMobile?: boolean }>`
    display: flex;
    height: fill-available;
    overflow: hidden;
    position: relative;
    flex-direction: row;

    ${(props) =>
        props.isYoutubeMobile &&
        css`
            flex-direction: column;
            align-items: space-between;
        `}
`
const LeftSide = styled.div<{ isYoutubeMobile?: boolean }>`
    display: flex;
    flex-direction: column;
    width: fill-available;
    height: fill-available;

    ${(props) =>
        props.isYoutubeMobile &&
        css`
            height: fit-content;
        `}
`

const InjectedContent = styled.div`
    max-width: 100%;
    width: fill-available;
    height: 100vh;
    left: 0;
    bottom: 0;
    border: 0px solid;
    background: white;
    position: relative;
`

const YoutubeVideoContainer = styled.div<{ isYoutubeMobile: boolean }>`
    display: flex;
    width: 100%;
    height: fill-available;
    justify-content: flex-start;
    align-items: flex-start;
    grid-gap: 10px;
    flex-direction: column;
    max-width: 1000px;
    padding: 10px;

    ${(props) =>
        props.isYoutubeMobile &&
        css`
            height: fit-content;
        `}
`
const YoutubeArea = styled.div<{
    isYoutubeMobile?: boolean
}>`
    display: flex;
    width: 100%;
    height: fill-available;
    justify-content: center;
    grid-gap: 10px;
    flex: 1;

    ${(props) =>
        props.isYoutubeMobile &&
        css`
            height: fit-content;
        `}
`

const YoutubeVideoBox = styled.div`
    display: flex;
    padding-bottom: 56.25%;
    position: relative;
    height: 0;
    width: 100%;
    max-width: 1000px;
`
