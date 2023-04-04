import React from 'react'
import { Services } from '../../../services/types'
import { Storage } from '../../../storage/types'
import { ReaderSharedState } from './types'

export interface ReaderAppProps {
    services: Services
    storage: Storage
    sharedState: ReaderSharedState
}
export class ReaderApp extends React.Component<ReaderAppProps> {
    render() {
        return <div>Reader app UI</div>
    }
}
