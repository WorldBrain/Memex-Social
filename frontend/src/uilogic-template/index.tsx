import React from 'react'
import styled from 'styled-components'
import { useLogic } from '../hooks/useLogic'
import { NotesSidebarDependencies, NotesSidebarLogic } from './logic'
export default function NotesSidebar(props: NotesSidebarDependencies) {
    const { logic, state } = useLogic(() => new NotesSidebarLogic(props))

    return <Container></Container>
}

const Container = styled.div`
    background: linear-gradient(to top right, #111317, #111317);
    min-height: 100vh;
    display: flex;
    flex-direction: column;
    height: 100vh;
`
