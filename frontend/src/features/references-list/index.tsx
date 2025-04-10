import React, { useEffect } from 'react'
import styled from 'styled-components'
import { useLogic } from '../../hooks/useLogic'
import { ReferencesListDependencies, ReferencesListLogic } from './logic'
import AnnotationEdit from '@worldbrain/memex-common/lib/content-conversations/ui/components/annotation-edit'
import AnnotationItem from '../annotation-item'
import LoadingIndicator from '../../common-ui/components/loading-indicator'

export default function ReferencesList(props: ReferencesListDependencies) {
    let { logic, state } = useLogic(ReferencesListLogic, props)

    if (state.loadState === 'running') {
        return <LoadingIndicator size={22} />
    }

    if (Object.values(state.annotations)?.length === 0) {
        return <div>No annotations found</div>
    }

    if (state.type === 'annotation') {
        console.log('annotations', state.annotations)
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
}

const Container = styled.div`
    display: flex;
    flex-direction: column;
    height: 100%;
    width: 100%;
    gap: 10px;
`
