import React, { useEffect } from 'react'
import styled from 'styled-components'
import { useLogic } from '../../hooks/useLogic'
import { ReferencesListDependencies, ReferencesListLogic } from './logic'
import AnnotationEdit from '@worldbrain/memex-common/lib/content-conversations/ui/components/annotation-edit'
import AnnotationItem from '../annotation-item'
import LoadingIndicator from '../../common-ui/components/loading-indicator'
import PageInfoBox from '../../common-ui/components/page-info-box'

export default function ReferencesList(props: ReferencesListDependencies) {
    let { logic, state } = useLogic(ReferencesListLogic, props)

    if (state.loadState === 'running') {
        return <LoadingIndicator size={22} />
    }
    console.log('state', state.type, state.annotations, state.pages)

    if (
        Object.entries(state.annotations)?.length === 0 &&
        Object.entries(state.pages)?.length === 0
    ) {
        return <div>No references found</div>
    }

    if (state.type === 'annotation') {
        return (
            <Container>
                {Object.entries(
                    state.annotations,
                )?.map(([annotationId, annotation]) =>
                    annotation ? (
                        <AnnotationItem
                            key={annotationId}
                            annotationId={annotationId}
                            annotation={annotation}
                            onClick={() => logic.onNoteClick(annotationId)}
                            services={props.services}
                            storage={props.storage}
                            imageSupport={props.imageSupport}
                            getRootElement={props.getRootElement}
                        />
                    ) : null,
                )}
            </Container>
        )
    }

    if (state.type === 'page') {
        console.log('state.pages', state.pages)
        return (
            <Container>
                {Object.entries(state.pages)?.map(([pageId, page]) =>
                    page ? (
                        <PageInfoBox
                            pageInfo={{
                                fullTitle: page.entryTitle,
                                originalUrl: page.originalUrl,
                                createdWhen: page.createdWhen,
                                updatedWhen: page.updatedWhen,
                                normalizedUrl: page.normalizedUrl,
                            }}
                            type="page"
                            // actions={[
                            //     {
                            //         node: (
                            //             <div
                            //                 onClick={() =>
                            //                     // logic.loadReader(
                            //                     //     result.reference
                            //                     //         .id,
                            //                     // )
                            //                     logic.loadNotes(
                            //                         result.normalizedUrl,
                            //                     )
                            //                 }
                            //             >
                            //                 Notes
                            //             </div>
                            //         ),
                            //     },
                            // ]}
                            onClick={() => {
                                props.services.events.emit({
                                    openPage: page,
                                })
                            }}
                        />
                    ) : null,
                )}
            </Container>
        )
    }
}

const Container = styled.div`
    display: flex;
    flex-direction: column;
    height: 100%;
    width: 100%;
    gap: 10px;
`
