import React from 'react'
import { ReaderPageViewProps } from './types'
import Reader from './Reader'

export class ReaderPageView extends React.Component<ReaderPageViewProps> {
    render() {
        return (
            <div>
                <Reader />
            </div>
        )
    }
}
