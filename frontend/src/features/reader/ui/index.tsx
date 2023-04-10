import React from 'react'
import { ReaderPageViewProps } from './types'

export class ReaderPageView extends React.Component<ReaderPageViewProps> {
    render() {
        return (
            <div>
                Reader UI for collection {this.props.listID}, entry{' '}
                {this.props.entryID}
            </div>
        )
    }
}
