import React from 'react'
import styled from 'styled-components'
import AnnotationReply from '../../../content-conversations/ui/components/annotation-reply'
import { Margin } from 'styled-components-spacing'
import Icon from '@worldbrain/memex-common/lib/common-ui/components/icon'
import { PrimaryAction } from '../../../../common-ui/components/PrimaryAction'

const StyledProfileSetupForm = styled.div`
    display: flex;
    justify-content: center;
    align-items: center;
    flex-direction: column;
`
const Header = styled.div`
    text-align: center;
    font-family: ${(props) => props.theme.fonts.primary};
    font-size: 24px;
    font-weight: 800;
`

const SmallHeader = styled.div`
    text-align: center;
    font-family: ${(props) => props.theme.fonts.primary};
    font-size: 18px;
    font-weight: 800;
`

const DisplayName = styled.div`
    text-align: center;
`

const TextInputContainer = styled.div`
    display: flex;
    grid-auto-flow: column;
    grid-gap: 10px;
    align-items: center;
    justify-content: flex-start;
    border: 1px solid ${(props) => props.theme.colors.lineLightGrey};
    height: 50px;
    border-radius: 8px;
    width: 350px;
    padding: 0 15px;
    margin-bottom: 40px;
`

const TextInputOneLine = styled.input`
    outline: none;
    height: fill-available;
    width: fill-available;
    color: #96a0b5;
    font-size: 14px;
    border: none;
    background: transparent;
    font-family: 'Inter';
    color: ${(props) => props.theme.colors.darkerText};

    &::placeholder {
        color: #96a0b5;
    }
`
const SectionCircle = styled.div<{ size: string }>`
    background: ${(props) => props.theme.colors.backgroundHighlight};
    border-radius: 100px;
    height: ${(props) => (props.size ? props.size : '60px')};
    width: ${(props) => (props.size ? props.size : '60px')};
    display: flex;
    justify-content: center;
    align-items: center;
    margin-bottom: 20px;
`

const AnnotationReplyContainer = styled(AnnotationReply)`
    box-shadow: 0px 2px 4px rgba(0, 0, 0, 0.05);
    border: 1px solid ${(props) => props.theme.colors.lightgrey} !important;
`

const PrimaryActionContainer = styled.div`
    margin: 20px 0 0 0;
    width: 100%;

    & > div {
        height: 50px;
        width: 100%;

        & * {
            font-weight: 500;
            font-size: 14px;
        }
    }
`

const AnnotationCard = styled.div`
    & > div {
        box-shadow: 0px 2px 4px rgba(0, 0, 0, 0.15) !important;
        border: 1px solid ${(props) => props.theme.colors.lightgrey} !important;
    }
`

export default function ProfileSetupForm(props: {
    displayName: string
    onDisplayNameChange(value: string): void
    onConfirm(): void
}) {
    const placeholder = 'John Doe'
    return (
        <StyledProfileSetupForm>
            <SectionCircle size="50px">
                <Icon
                    icon={'personFine'}
                    heightAndWidth="25px"
                    color="purple"
                />
            </SectionCircle>
            <Margin bottom="medium">
                <Header>Set up your display name</Header>
            </Margin>
            <Margin bottom="medium">
                <DisplayName>
                    <TextInputContainer>
                        <TextInputOneLine
                            placeholder={placeholder}
                            value={props.displayName}
                            onChange={(e) =>
                                props.onDisplayNameChange(e.target.value)
                            }
                        />
                    </TextInputContainer>
                </DisplayName>
            </Margin>
            <Margin bottom="medium">
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
            </Margin>
            <PrimaryActionContainer>
                <PrimaryAction
                    label="Confirm Display Name"
                    fontSize="14px"
                    onClick={props.onConfirm}
                    disabled={props.displayName.length === 0}
                    icon={'check'}
                    iconSize={'18px'}
                />
            </PrimaryActionContainer>
        </StyledProfileSetupForm>
    )
}
