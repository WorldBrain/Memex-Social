import React from 'react'
import styled from 'styled-components'
import AnnotationReply from '../../../content-conversations/ui/components/annotation-reply'
import { Margin } from 'styled-components-spacing'
import Icon from '@worldbrain/memex-common/lib/common-ui/components/icon'
import { PrimaryAction } from '@worldbrain/memex-common/lib/common-ui/components/PrimaryAction'
import IconBox from '@worldbrain/memex-common/lib/common-ui/components/icon-box'
import TextField from '@worldbrain/memex-common/lib/common-ui/components/text-field'

const StyledProfileSetupForm = styled.div`
    display: flex;
    justify-content: center;
    align-items: center;
    flex-direction: column;
    padding: 20px;
`
const Header = styled.div`
    text-align: center;
    font-family: ${(props) => props.theme.fonts.primary};
    font-size: 22px;
    font-weight: 800;
    color: ${(props) => props.theme.colors.normalText};
`

function handleEnter(f: () => void) {
    console.log('test')
    const handler = (event: React.KeyboardEvent<HTMLInputElement>) => {
        console.log('test2')
        if (event.keyCode === 13) {
            console.log('test3')
            f()
        }
    }
    return handler
}

export default function ProfileSetupForm(props: {
    displayName: string
    onDisplayNameChange(value: string): void
    onConfirm(): void
}) {
    const placeholder = 'John Doe'
    return (
        <StyledProfileSetupForm>
            <IconBox heightAndWidth="50px" background="light">
                <Icon
                    icon={'personFine'}
                    heightAndWidth="25px"
                    color="purple"
                    hoverOff
                />
            </IconBox>
            <Margin top="medium" bottom="medium">
                <Header>Set up your display name</Header>
            </Margin>
            <TextField
                icon={'smileFace'}
                type={'text'}
                placeholder={placeholder}
                value={props.displayName}
                onChange={(e) =>
                    props.onDisplayNameChange(
                        (e.target as HTMLInputElement).value,
                    )
                }
                onKeyDown={handleEnter(() => props.onConfirm())}
            />
            {/* <Margin bottom="medium">
                <SmallHeader>Where this will appear</SmallHeader>
            </Margin>
            <Margin bottom="small">
                <AnnotationCard>
                    <AnnotationReplyContainer
                        user={{
                            displayName:
                                props.displayName?.length > 0
                                    ? props.displayName
                                    : placeholder,
                        }}
                        reply={{
                            content:
                                "This is what a reply to someone's note looks like with your name attached",
                            normalizedPageUrl: 'something',
                            createdWhen: Date.now(),
                        }}
                    />
                </AnnotationCard>
            </Margin> */}
            <Margin top="large"> </Margin>
            <PrimaryAction
                label="Save"
                onClick={() => props.onConfirm()}
                disabled={props.displayName.length === 0}
                icon={'check'}
                height={'50px'}
                iconSize={'18px'}
                width="100%"
            />
        </StyledProfileSetupForm>
    )
}
