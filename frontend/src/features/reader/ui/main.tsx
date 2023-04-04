import React from 'react'
import ReactDOM from 'react-dom'
import { Services } from '../../../services/types'
import { Storage } from '../../../storage/types'
import { ReaderApp } from './ReaderApp'
import { ReaderSharedState } from './types'

export async function runReaderUi(options: {
    services: Services
    storage: Storage
    uiMountPoint: Element
    collectionId: string
    entryId: string
}) {
    const sharedState: ReaderSharedState = {}

    ReactDOM.render(
        <ReaderApp
            services={options.services}
            storage={options.storage}
            sharedState={sharedState}
        />,
        options.uiMountPoint,
    )
    // set up everything else here, like fetching and injecting HTML, communicating trough sharedState
}
