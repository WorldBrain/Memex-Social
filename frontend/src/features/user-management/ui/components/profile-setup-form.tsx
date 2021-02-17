import React from 'react'
import styled from 'styled-components'
import TextInput from '../../../../common-ui/components/text-input'
import Button from '../../../../common-ui/components/button'
import AnnotationReply from '../../../content-conversations/ui/components/annotation-reply'
import { Margin } from 'styled-components-spacing'

const StyledProfileSetupForm = styled.div``
const Header = styled.div`
    text-align: center;
    font-family: ${(props) => props.theme.fonts.primary};
    font-size: 14px;
    font-weight: bold;
`
const DisplayName = styled.div`
    text-align: center;
`

export default function ProfileSetupForm(props: {
    displayName: string
    onDisplayNameChange(value: string): void
    onConfirm(): void
}) {
    const placeholder = 'John Doe'
    return (
        <StyledProfileSetupForm>
            <Margin bottom="medium">
                <Header>Set up your display name</Header>
            </Margin>
            <Margin bottom="medium">
                <DisplayName>
                    <TextInput
                        placeholder={placeholder}
                        value={props.displayName}
                        onChange={(e) =>
                            props.onDisplayNameChange(e.target.value)
                        }
                        onConfirm={props.onConfirm}
                    />
                </DisplayName>
            </Margin>
            <Margin bottom="small">
                <Header>Example</Header>
            </Margin>
            <Margin bottom="small">
                <AnnotationReply
                    user={{
                        displayName:
                            props.displayName?.length > 0
                                ? props.displayName
                                : placeholder,
                    }}
                    reply={{
                        content:
                            "This is what a reply to someone's note looks like with your name attached",
                        createdWhen: Date.now(),
                        normalizedPageUrl: 'something',
                    }}
                />
            </Margin>
            <Button
                type="primary-action"
                onClick={props.displayName.length ? props.onConfirm : undefined}
            >
                Confirm
            </Button>
        </StyledProfileSetupForm>
    )
}
