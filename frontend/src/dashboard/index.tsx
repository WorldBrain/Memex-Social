import React from 'react'
import styled from 'styled-components'
import { useLogic } from '../hooks/useLogic'
import { DashboardDependencies, DashboardLogic } from './logic'
import { CollectionDetailsListEntry } from '../features/content-sharing/ui/pages/collection-details/types'
import PageInfoBox from '@worldbrain/memex-common/lib/common-ui/components/page-info-box'
import NotesList from '../features/notes-list'
import ReaderView from '../features/readerFrame/ui'
import ChatInput from '../features/ai-chat/components/chatInput'
import AiChat from '../features/ai-chat'
import ReferencesList from '../features/references-list'
import AddContentOverlay from '../features/add-content-overlay'
import { PrimaryAction } from '@worldbrain/memex-common/lib/common-ui/components/PrimaryAction'

export const RESULTS_LIST_MAX_WIDTH = 700

export default function Dashboard(props: DashboardDependencies) {
    const { logic, state } = useLogic(DashboardLogic, props)

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
                                        logic.loadReader(result)
                                    }}
                                />
                            )

                            if (index === 2) {
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
    const renderReferences = () => {
        if (!state.referenceToShow || !state.showRightSideBar) return null

        console.log('state.referenceToShow', state.referenceToShow)

        return (
            <ReferencesList
                services={props.services}
                storage={props.storage}
                imageSupport={props.imageSupport}
                getRootElement={props.getRootElement}
                reference={state.referenceToShow}
                listID={state.listData?.reference.id}
            />
        )
    }
    const renderReader = () => {
        if (!state.currentEntryId) return null

        const pageData = state.listData.listEntries.find(
            (entry) => entry.reference.id === state.currentEntryId,
        )

        const sourceUrl = pageData?.sourceUrl
        if (!sourceUrl || !state.currentListId) return null

        return (
            <ReaderContainer>
                <ReaderView
                    services={props.services}
                    storage={props.storage}
                    storageManager={props.storageManager}
                    sourceUrl={sourceUrl}
                    listId={state.currentListId}
                    entryId={state.currentEntryId}
                    generateServerId={props.generateServerId}
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
                {state.pageToShowNotesFor && renderPageAnnotations()}

                {state.referenceToShow && renderReferences()}
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

    const renderAIChat = () => {
        if (!state.currentListId) return null
        return (
            <AiChat
                listId={state.currentListId}
                initialChatMessage={state.initialChatMessage}
                services={props.services}
                storage={props.storage}
                imageSupport={props.imageSupport}
                getRootElement={props.getRootElement}
                storageManager={props.storageManager}
            />
        )
    }

    const renderChatInput = () => {
        return (
            <BottomBox>
                <ChatInput
                    services={props.services}
                    storage={props.storage}
                    imageSupport={props.imageSupport}
                    getRootElement={props.getRootElement}
                    storageManager={props.storageManager}
                    sendMessage={(message: string) =>
                        logic.sendMessage(message)
                    }
                />
            </BottomBox>
        )
    }

    const renderResultsContainer = () => {
        return (
            <ResultsContainer>
                <PrimaryAction
                    onClick={() => logic.toggleAddContentOverlay()}
                    label="Add New"
                    type="primary"
                />
                <Title>{state.listData?.list?.title}</Title>
                <Subtitle>{state.listData?.list?.description}</Subtitle>
                {renderResults()}
                {renderChatInput()}
            </ResultsContainer>
        )
    }

    const renderMiddleArea = () => {
        if (state.screenState === 'results') {
            return renderResultsContainer()
        }
        if (state.screenState === 'ai') {
            return renderAIChat()
        }
        if (state.currentEntryId) {
            return renderReader()
        }
    }

    return (
        <Container>
            <MainContent>
                {renderLeftSideBar()}
                <CenterArea>{renderMiddleArea()}</CenterArea>
                {renderRightSideBar()}
                {state.showAddContentOverlay && (
                    <AddContentOverlay
                        services={props.services}
                        storage={props.storage}
                        imageSupport={props.imageSupport}
                        getRootElement={props.getRootElement}
                        handleDroppedFiles={async (files: File[]) =>
                            await logic.handleDroppedFiles(files)
                        }
                        handlePastedText={async (text: string) =>
                            await logic.handlePastedText(text)
                        }
                        handleClose={() => logic.toggleAddContentOverlay()}
                        storageManager={props.storageManager}
                    />
                )}
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
    align-items: flex-end;
    display: flex;
`
