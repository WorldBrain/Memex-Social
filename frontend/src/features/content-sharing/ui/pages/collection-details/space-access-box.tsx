import React from 'react'
import styled from 'styled-components'
import Icon from '@worldbrain/memex-common/lib/common-ui/components/icon'
import { PrimaryAction } from '@worldbrain/memex-common/lib/common-ui/components/PrimaryAction'
import type { CollectionDetailsState } from './types'
import { Margin } from 'styled-components-spacing'

interface LoggedInProps
    extends Pick<CollectionDetailsState, 'permissionDenied' | 'users'> {
    onInvitationAccept: () => Promise<void>
    showDeniedNote?: boolean
}

interface LoggedOutProps
    extends Pick<CollectionDetailsState, 'permissionDenied'> {
    keyString: string | null
}

export const LoggedInAccessBox: React.FunctionComponent<LoggedInProps> = ({
    permissionDenied,
    users,
    onInvitationAccept,
    showDeniedNote,
}) => {
    if (!permissionDenied) {
        return null
    }

    return (
        <SpaceAccessBox>
            {permissionDenied.hasKey ? (
                <>
                    <Icon icon="invite" height="35px" hoverOff />
                    <SpaceAccessBoxTitle bottom={'large'}>
                        <SpaceAccessBoxListTitle>
                            {users[permissionDenied.creator]?.displayName ??
                                'Someone'}{' '}
                        </SpaceAccessBoxListTitle>
                        invited you to{' '}
                        <SpaceAccessBoxListTitle>
                            {permissionDenied.listTitle}
                        </SpaceAccessBoxListTitle>{' '}
                    </SpaceAccessBoxTitle>
                    <PrimaryAction
                        size="medium"
                        type="secondary"
                        label="Accept invite and go to Space →"
                        onClick={onInvitationAccept}
                    />
                    {showDeniedNote && (
                        <DeniedWarning>
                            You tried to accept it with the wrong email address
                        </DeniedWarning>
                    )}
                </>
            ) : (
                <>
                    <Icon icon="lock" height="35px" hoverOff />
                    <SpaceAccessBoxTitle>
                        You don't have access to this Space
                    </SpaceAccessBoxTitle>
                    <SpaceAccessBoxDescription>
                        Ask the owner for an invite link or that they invite you
                        via email.
                    </SpaceAccessBoxDescription>
                </>
            )}
        </SpaceAccessBox>
    )
}

export const LoggedOutAccessBox: React.FunctionComponent<LoggedOutProps> = ({
    permissionDenied,
    keyString,
}) => {
    if (!permissionDenied) {
        return null
    }
    if (!keyString) {
        return (
            <>
                <Icon icon="lock" height="35px" hoverOff />
                <SpaceAccessBoxTitle>This Space is private</SpaceAccessBoxTitle>
                <SpaceAccessBoxDivider />
            </>
        )
    }

    return (
        <>
            <Icon icon="invite" height="35px" hoverOff />
            <SpaceAccessBoxTitle>
                You've been invited to{' '}
                <SpaceAccessBoxListTitle>
                    {permissionDenied.listTitle}
                </SpaceAccessBoxListTitle>{' '}
            </SpaceAccessBoxTitle>
            <SpaceAccessBoxDivider />
        </>
    )
}

const DeniedWarning = styled.span`
    display: flex;
    color: ${(props) => props.theme.colors.warning};
`

const SpaceAccessBox = styled.div`
    background: ${(props) => props.theme.colors.greyScale1};
    padding: 50px 25px;
    border-radius: 10px;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    grid-gap: 10px;
`

const SpaceAccessBoxTitle = styled(Margin)`
    color: ${(props) => props.theme.colors.white};
    font-weight: 500;
    font-size: 16px;
`

const SpaceAccessBoxDescription = styled.span`
    color: ${(props) => props.theme.colors.greyScale5};
    font-weight: 400;
    font-size: 14px;
`

const SpaceAccessBoxListTitle = styled.span`
    color: ${(props) => props.theme.colors.prime1};
`

const SpaceAccessBoxDivider = styled.hr`
    border-color: ${(props) => props.theme.colors.greyScale1};
    height: 1px;
    margin: 50px 0;
    width: 100%;
`
