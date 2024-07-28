import React from 'react'
import Logic from './logic'
import {
    AIChatWebUiWrapperEvent,
    AIChatWebUiWrapperDependencies,
    AIChatWebUiWrapperState,
} from './types'
import { UIElement } from 'ui-logic-react'
import AIChatComponent from '@worldbrain/memex-common/lib/ai-chat'
import { PromptData } from '@worldbrain/memex-common/lib/summarization/types'

export default class AIChatWebUiWrapper extends UIElement<
    AIChatWebUiWrapperDependencies,
    AIChatWebUiWrapperState,
    AIChatWebUiWrapperEvent
> {
    constructor(props: AIChatWebUiWrapperDependencies) {
        super(props, { logic: new Logic(props) })
    }

    async componentDidMount(): Promise<void> {
        super.componentDidMount()
    }

    componentDidUpdate(prevProps) {}

    async componentWillUnmount(): Promise<void> {
        super.componentWillUnmount()
    }

    render() {
        return (
            <AIChatComponent
                context="webUI"
                getRootElement={this.props.getRootElement}
                imageSupport={this.props.imageSupport}
                queryAIservice={async (
                    promptData: PromptData,
                    selectedModel: AIChatWebUiWrapperState['selectedModel'],
                ) => {
                    this.processEvent('queryAIService', {
                        promptData: promptData,
                        selectedModel: selectedModel,
                    })
                }}
                analyticsBG={this.props.analyticsBG}
                openImageInPreview={this.props.openImageInPreview}
                currentAIResponse={this.state.currentAIResponse ?? ''}
                getLocalContent={this.props.getLocalContent}
                createNewNoteFromAISummary={() => null}
                getYoutubePlayer={this.props.getYoutubePlayer}
                omitLocalContentFeature={true}
                sidebarEvents={this.props.collectionDetailsEvents}
                // renderPromptTemplates={() => {
                //     return (
                //         <PromptTemplatesComponent
                //             syncSettingsBG={this.props.syncSettingsBG}
                //             getRootElement={this.props.getRootElement}
                //             onTemplateSelect={(text: string) =>
                //                 this.props.events.emit(
                //                     'addTextToEditor',
                //                     text,
                //                     () => {},
                //                 )
                //             }
                //         />
                //     )
                // }}
            />
        )
    }
}
