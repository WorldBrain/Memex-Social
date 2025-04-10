import React, { useEffect } from 'react'
import styled from 'styled-components'
import { useLogic } from '../../hooks/useLogic'
import { NotesListDependencies, NotesListLogic } from './logic'
import AnnotationEdit from '@worldbrain/memex-common/lib/content-conversations/ui/components/annotation-edit'
import AnnotationItem from '../annotation-item'
import LoadingIndicator from '../../common-ui/components/loading-indicator'

export default function NotesList(props: NotesListDependencies) {
    const { logic, state } = useLogic(NotesListLogic, props)

    useEffect(() => {
        logic.loadAnnotations(props.url, props.annotationEntries)
    }, [props.url])

    if (state.loadState === 'running') {
        return <LoadingIndicator size={22} />
    }

    if (Object.values(state.annotations)?.length === 0) {
        return <div>No annotations found</div>
    }

    return (
        <Container>
            {Object.entries(state.annotations)?.map(
                ([annotationId, annotation]) => (
                    <AnnotationItem
                        annotationId={annotationId}
                        annotation={annotation}
                        onClick={() => logic.onNoteClick(annotationId)}
                        services={props.services}
                        storage={props.storage}
                        imageSupport={props.imageSupport}
                        getRootElement={props.getRootElement}
                    />
                ),
            )}
        </Container>
    )
}

const Container = styled.div`
    display: flex;
    flex-direction: column;
    height: 100%;
    width: 100%;
    gap: 10px;
`
