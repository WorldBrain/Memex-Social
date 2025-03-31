import React from 'react'
import styled from 'styled-components'
import { useLogic } from '../hooks/useLogic'
import { DashboardDependencies, DashboardLogic } from './logic'
import { CollectionDetailsListEntry } from '../features/content-sharing/ui/pages/collection-details/types'
import { getDomainFromUrl } from '@worldbrain/memex-common/ts/utils/getDomainFromUrl'
import PageInfoBox from '@worldbrain/memex-common/lib/common-ui/components/page-info-box'
import AnnotationsInPage from '@worldbrain/memex-common/lib/content-conversations/ui/components/annotations-in-page'
import NotesList from '../features/notes-list'
import { getBlockContentYoutubePlayerId } from '@worldbrain/memex-common/lib/common-ui/components/block-content'
import { ReaderPageView } from '../features/reader/ui'

const RESULTS_LIST_MAX_WIDTH = 700

export default function Dashboard(props: DashboardDependencies) {
    const { logic, state } = useLogic(() => new DashboardLogic(props))

    const renderResults = () => {
        return (
            <ResultsList>
                <ResultsListInner>
                    {state.results.map(
                        (result: CollectionDetailsListEntry, index: number) => {
                            const pageInfoBox = (
                                <PageInfoBox
                                    pageInfo={{
                                        fullTitle: result.entryTitle,
                                        originalUrl: result.originalUrl,
                                        createdWhen: result.createdWhen,
                                        updatedWhen: result.updatedWhen,
                                        normalizedUrl: result.normalizedUrl,
                                    }}
                                    type="page"
                                    actions={[
                                        {
                                            node: (
                                                <div
                                                    onClick={() =>
                                                        // logic.loadReader(
                                                        //     result.reference
                                                        //         .id,
                                                        // )
                                                        logic.loadNotes(
                                                            result.normalizedUrl,
                                                        )
                                                    }
                                                >
                                                    Notes
                                                </div>
                                            ),
                                        },
                                    ]}
                                    onClick={() => {
                                        console.log('onlclick')
                                        logic.loadReader(result)
                                    }}
                                />
                            )

                            if (index === 3) {
                                return (
                                    <>
                                        <ExtensionPromo>
                                            <PromoText>
                                                Collect, Annotate & Summarize on
                                                the fly with our browser
                                                extension
                                            </PromoText>
                                            {/* Browser icons would go here */}
                                        </ExtensionPromo>
                                        {pageInfoBox}
                                    </>
                                )
                            }

                            return pageInfoBox
                        },
                    )}
                </ResultsListInner>
            </ResultsList>
        )
    }

    const renderPageAnnotations = () => {
        if (!state.pageToShowNotesFor || !state.showRightSideBar) return null

        console.log(
            'state.annotationEntryData',
            state.annotationEntryData[state.pageToShowNotesFor],
        )
        return (
            <NotesList
                services={props.services}
                storage={props.storage}
                imageSupport={props.imageSupport}
                getRootElement={props.getRootElement}
                annotationEntries={
                    state.annotationEntryData[state.pageToShowNotesFor]
                }
                listID={state.listData?.reference.id}
                url={state.pageToShowNotesFor}
            />
        )
    }

    const renderReader = () => {
        return (
            <ReaderContainer>
                <ReaderPageView
                    services={props.services}
                    storage={props.storage}
                    storageManager={props.storageManager}
                    listID={props.listID}
                    entryID={props.entryID ?? ''}
                    normalizeUrl={props.normalizeUrl}
                    generateServerId={props.generateServerId}
                    query={props.query}
                    imageSupport={props.imageSupport}
                    getRootElement={props.getRootElement}
                />
            </ReaderContainer>
        )
    }

    const renderRightSideBar = () => {
        if (!state.showRightSideBar) return null
        return (
            <RightSideBarContainer width={state.rightSideBarWidth}>
                <div>Notes</div>
                {renderPageAnnotations()}
            </RightSideBarContainer>
        )
    }

    const renderLeftSideBar = () => {
        if (!state.showLeftSideBar) return null
        return (
            <div>
                <div>Notes</div>
            </div>
        )
    }

    const renderResultsContainer = () => {
        return (
            <ResultsContainer>
                <Title>{state.listData?.list?.title}</Title>
                <Subtitle>{state.listData?.list?.description}</Subtitle>
                {renderResults()}
                <BottomBox>
                    <ChatInput>
                        <Input placeholder="Ask a question or generate reports..." />
                        <SendButton>Send</SendButton>
                    </ChatInput>
                </BottomBox>
            </ResultsContainer>
        )
    }

    return (
        <Container>
            <MainContent>
                {renderLeftSideBar()}
                <CenterArea>
                    {props.entryID ? renderReader() : renderResultsContainer()}
                </CenterArea>
                {renderRightSideBar()}
            </MainContent>
        </Container>
    )
}

const Container = styled.div`
    background: linear-gradient(to top right, #111317, #111317);
    min-height: 100vh;
    display: flex;
    flex-direction: column;
    height: 100vh;
`

const Title = styled.h1`
    font-family: 'Geist', sans-serif;
    font-weight: 700;
    font-size: 24px;
    line-height: 1.417em;
    color: #ffffff;
    margin-bottom: 10px;
`

const Subtitle = styled.p`
    font-family: 'Geist', sans-serif;
    font-weight: 400;
    font-size: 16px;
    line-height: 1.5em;
    color: #e3e4e7;
    margin-bottom: 20px;
`

const MainContent = styled.div`
    display: flex;
    flex: 1;
    gap: 20px;
    overflow: hidden;
`

const CenterArea = styled.div`
    display: flex;
    flex-direction: column;
    gap: 10px;
    flex: 1;
    height: 100%;
    overflow-y: hidden;
    margin-bottom: 80px; /* Space for the chat input */
    position: relative;
    align-items: center;
`

const SmallText = styled.span`
    font-family: 'Geist', sans-serif;
    font-weight: 400;
    font-size: 12px;
    line-height: 2em;
    color: #9a9b9e;
`

const NotesCounter = styled.div`
    display: flex;
    align-items: center;
    gap: 7px;
    padding: 0 8px;
    background: #2a2c33;
    border: 1px solid #383b42;
    border-radius: 50px;
`

const NotesCount = styled.span`
    font-family: 'Geist', sans-serif;
    font-weight: 400;
    font-size: 12px;
    line-height: 2em;
    color: #ffffff;
`

const NotesLabel = styled(SmallText)`
    color: #e5e6ea;
`

const ExtensionPromo = styled.div`
    background: #20223b;
    border: 1px solid #347ae2;
    border-radius: 10px;
    padding: 15px 17px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    width: 100%;
    margin: 10px 0;
`

const PromoText = styled.span`
    font-family: 'Geist', sans-serif;
    font-weight: 400;
    font-size: 12px;
    line-height: 1.75em;
    color: #ffffff;
`

const BottomBox = styled.div`
    position: absolute;
    width: 100%;
    height: 10%;
    bottom: 0;
    left: 0;
    right: 0;
    z-index: 1000;
    background: linear-gradient(180deg, rgba(17, 19, 23, 0) 0%, #111317 67.51%);
    padding: 0 20px 20px 20px;
    box-sizing: border-box;
    justify-content: center;
    display: flex;
`

const ChatInput = styled.div`
    box-sizing: border-box;
    display: flex;
    flex-direction: row;
    justify-content: space-between;
    align-items: center;
    padding: 11.7132px 11.7132px 11.7132px 23.4263px;
    gap: 11.71px;
    background: rgba(67, 67, 67, 0.49);
    box-shadow: -1.17132px -1.17132px 1.02224px -0.51112px
            rgba(121, 121, 121, 0.7),
        inset 0px 1.78892px 0px rgba(49, 38, 38, 0.25);
    backdrop-filter: blur(7.565px);
    /* Note: backdrop-filter has minimal browser support */
    border-radius: 70.279px;
    max-width: ${RESULTS_LIST_MAX_WIDTH}px;
    width: 100%;
`

const Input = styled.input`
    font-family: 'Geist', sans-serif;
    font-weight: 400;
    font-size: 14px;
    line-height: 1.51em;
    color: #c8c7c5;
    background: transparent;
    border: none;
    outline: none;
    width: 100%;
    &::placeholder {
        color: #c8c7c5;
    }
`

const SendButton = styled.button`
    background: #5e6ad2;
    border-radius: 117.13px;
    padding: 5.71px;
    width: 87.85px;
    border: none;
    cursor: pointer;
    font-family: 'Geist', sans-serif;
    font-weight: 400;
    font-size: 16.4px;
    color: #eeeeee;
    box-shadow: 0px 4.69px 4.69px rgba(23, 23, 23, 0.25);
`

const RightSideBarContainer = styled.div<{ width?: number }>`
    width: ${(props) => props.width ?? 450}px;
    background: ${(props) => props.theme.colors.black0};
    padding: 20px;
    overflow-y: auto;
    animation: slideIn 0.2s cubic-bezier(0.4, 0, 0.2, 1);

    /* Hide scrollbar for Chrome, Safari and Opera */
    &::-webkit-scrollbar {
        display: none;
    }

    /* Hide scrollbar for IE, Edge and Firefox */
    -ms-overflow-style: none; /* IE and Edge */
    scrollbar-width: none; /* Firefox */

    @keyframes slideIn {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
`

const ResultsContainer = styled.div`
    display: flex;
    flex-direction: column;
    gap: 10px;
    width: 100%;
    position: relative;
    height: 100%;
    overflow-y: hidden;
    align-items: center;
`

const ResultsList = styled.div`
    display: flex;
    flex-direction: column;
    gap: 10px;
    height: 100%;
    overflow-y: scroll;
    width: 100%;
    align-items: center;
    &::-webkit-scrollbar {
        display: none;
    }
    -ms-overflow-style: none;
    scrollbar-width: none;
    padding-bottom: 100px;
`

const ResultsListInner = styled.div`
    width: 100%;
    height: 100%;
    max-width: ${RESULTS_LIST_MAX_WIDTH}px;
    gap: 10px;
    display: flex;
    flex-direction: column;
    align-items: center;
    padding-bottom: 350px;
`

const ReaderContainer = styled.div`
    width: 100%;
    height: 100%;
`
